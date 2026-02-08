"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, User, MessageSquare, Loader2, X, Search, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Avatar, Input, Badge } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Message {
    id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    read: boolean;
    created_at: string;
    sender?: {
        id: string;
        full_name: string;
        avatar_url?: string;
    };
    receiver?: {
        id: string;
        full_name: string;
        avatar_url?: string;
    };
}

interface Contact {
    id: string;
    full_name: string;
    avatar_url?: string;
    lastMessage?: string;
    lastMessageTime?: string;
    unreadCount: number;
}

export default function MessageCenter({
    currentUserId,
    preselectedContactId
}: {
    currentUserId: string;
    preselectedContactId?: string;
}) {
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    // Use a ref to access current selectedContact inside the closure without adding it to dependencies
    const selectedContactRef = useRef<Contact | null>(null);
    useEffect(() => {
        selectedContactRef.current = selectedContact;
    }, [selectedContact]);

    useEffect(() => {
        if (!currentUserId) return;

        fetchThreads();

        // Subscribe to all changes in the 'messages' table
        // We filter by logic in the callback or use specific filters.
        // Since we want both sent (by me) and received (by me), and Supabase 
        // Realtime filters are simple (col=eq.val), we need two subscriptions 
        // OR one subscription to the whole table (inefficient if public) 
        // OR rely on RLS broadcast (if 'broadcast' mode).
        // BUT 'postgres_changes' respects filters.

        // Let's try a single channel with two bindings.
        console.log("Subscribing to messages for user:", currentUserId);

        const channel = supabase.channel(`user_messages_${currentUserId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${currentUserId}`
                },
                (payload: any) => {
                    console.log("Received message:", payload);
                    handleRealtimeMessage(payload);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'messages',
                    filter: `sender_id=eq.${currentUserId}`
                },
                (payload: any) => {
                    console.log("Sent message update:", payload);
                    handleRealtimeMessage(payload);
                }
            )
            .subscribe((status: string) => {
                console.log("Subscription status:", status);
                // console.log("Subscription status:", status);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUserId, supabase]); // Removed selectedContact?.id dependency

    const handleRealtimeMessage = (payload: any) => {
        const newMsg = payload.new as Message;
        const currentSelected = selectedContactRef.current;

        if (payload.eventType === 'INSERT') {
            // If it's a message in the current conversation
            if (currentSelected && (newMsg.sender_id === currentSelected.id || newMsg.receiver_id === currentSelected.id)) {
                setMessages(prev => {
                    if (prev.some(m => m.id === newMsg.id)) return prev;
                    return [...prev, newMsg];
                });

                // If I received it in the active chat, mark as read
                if (newMsg.receiver_id === currentUserId && newMsg.sender_id === currentSelected.id) {
                    markAsRead(currentSelected.id);
                }
            }
        } else if (payload.eventType === 'UPDATE') {
            setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, ...newMsg } : m));
        }

        // Always refresh threads to update sidebar (last message, unread count)
        fetchThreads();
    };

    // Presence / Typing indicators
    const [isPartnerTyping, setIsPartnerTyping] = useState(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout>(null);
    const presenceChannelRef = useRef<any>(null);

    useEffect(() => {
        if (!selectedContact || !currentUserId) return;

        const presenceChannel = supabase.channel(`presence:${selectedContact.id}`);
        presenceChannelRef.current = presenceChannel;

        presenceChannel
            .on('presence', { event: 'sync' }, () => {
                const state = presenceChannel.presenceState();
                const partnerTyping = Object.values(state).some((presences: any) =>
                    presences.some((p: any) => p.isTyping && p.userId === selectedContact.id)
                );
                setIsPartnerTyping(partnerTyping);
            })
            .subscribe(async (status: string) => {
                if (status === 'SUBSCRIBED') {
                    await presenceChannel.track({
                        userId: currentUserId,
                        isTyping: false,
                        online_at: new Date().toISOString(),
                    });
                }
            });

        return () => {
            supabase.removeChannel(presenceChannel);
            presenceChannelRef.current = null;
        };
    }, [selectedContact?.id, currentUserId, supabase]);

    const handleTyping = async () => {
        if (!selectedContact || !currentUserId || !presenceChannelRef.current) return;

        const channel = presenceChannelRef.current;
        await channel.track({
            userId: currentUserId,
            isTyping: true,
            online_at: new Date().toISOString(),
        });

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        typingTimeoutRef.current = setTimeout(async () => {
            if (presenceChannelRef.current) {
                await presenceChannelRef.current.track({
                    userId: currentUserId,
                    isTyping: false,
                    online_at: new Date().toISOString(),
                });
            }
        }, 2000);
    };

    useEffect(() => {
        if (selectedContact) {
            fetchConversation(selectedContact.id);
            markAsRead(selectedContact.id);
        }
    }, [selectedContact?.id]);

    useEffect(() => {
        const initChat = async () => {
            if (!preselectedContactId || loading) return;

            const existing = contacts.find(c => c.id === preselectedContactId);

            if (existing) {
                setSelectedContact(existing);
            } else {
                try {
                    const { data: userData, error: userError } = await supabase
                        .from('users')
                        .select('id, full_name, avatar_url')
                        .eq('id', preselectedContactId)
                        .single();

                    if (userData && !userError) {
                        const newContact: Contact = {
                            id: userData.id,
                            full_name: userData.full_name,
                            avatar_url: userData.avatar_url || undefined,
                            unreadCount: 0,
                            lastMessage: "",
                            lastMessageTime: new Date().toISOString()
                        };
                        setSelectedContact(newContact);
                    }
                } catch (err) {
                    console.error("Failed to load new contact", err);
                }
            }
        };

        initChat();
    }, [preselectedContactId, contacts, loading, supabase]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchThreads = async () => {
        try {
            const res = await fetch('/api/messages');
            const { data } = await res.json();
            if (data) {
                const contactMap = new Map<string, Contact>();
                data.forEach((msg: Message) => {
                    const otherUser = msg.sender_id === currentUserId ? msg.receiver : msg.sender;
                    if (otherUser) {
                        const existing = contactMap.get(otherUser.id);
                        const isUnread = !msg.read && msg.receiver_id === currentUserId;

                        if (!existing) {
                            contactMap.set(otherUser.id, {
                                id: otherUser.id,
                                full_name: otherUser.full_name,
                                avatar_url: otherUser.avatar_url,
                                lastMessage: msg.content,
                                lastMessageTime: msg.created_at,
                                unreadCount: (isUnread && otherUser.id !== selectedContactRef.current?.id) ? 1 : 0
                            });
                        } else {
                            if (isUnread && otherUser.id !== selectedContactRef.current?.id) {
                                existing.unreadCount += 1;
                            }
                        }
                    }
                });
                setContacts(Array.from(contactMap.values()));
            }
        } catch (error) {
            console.error("Error fetching threads:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchConversation = async (contactId: string) => {
        try {
            const res = await fetch(`/api/messages?contactId=${contactId}`);
            const { data } = await res.json();
            if (data) {
                setMessages(data);
            }
        } catch (error) {
            console.error("Error fetching conversation:", error);
        }
    };

    const markAsRead = async (contactId: string) => {
        if (!contactId) return;
        setContacts(prev => prev.map(c => c.id === contactId ? { ...c, unreadCount: 0 } : c));
        try {
            await supabase.rpc('mark_conversation_as_read', { contact_id: contactId });
            window.dispatchEvent(new Event('messages:updated'));
        } catch (error) {
            console.error("Error marking messages as read:", error);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedContact || sending) return;

        setSending(true);
        try {
            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    receiver_id: selectedContact.id,
                    content: newMessage.trim()
                })
            });

            if (res.ok) {
                const { data } = await res.json();
                setMessages(prev => [...prev, data]);
                setNewMessage("");
                fetchThreads();
            }
        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setSending(false);
        }
    };

    const filteredContacts = contacts.filter(c =>
        c.full_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="bg-white dark:bg-slate-900 h-full flex overflow-hidden">
            {/* Sidebar */}
            <div className={`w-full md:w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col ${selectedContact ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search messages..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-slate-50 dark:bg-slate-800 border-none"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
                        </div>
                    ) : (
                        filteredContacts.map(contact => (
                            <button
                                key={contact.id}
                                onClick={() => setSelectedContact(contact)}
                                className={`w-full p-4 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left border-b border-slate-100 dark:border-slate-800/50 ${selectedContact?.id === contact.id ? 'bg-violet-50 dark:bg-violet-500/10' : ''}`}
                            >
                                <Avatar fallback={contact.full_name} src={contact.avatar_url} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="font-semibold text-slate-900 dark:text-white truncate">{contact.full_name}</p>
                                        <span className="text-[10px] text-slate-500">
                                            {contact.lastMessageTime && new Date(contact.lastMessageTime).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-xs text-slate-500 truncate">{contact.lastMessage}</p>
                                        {contact.unreadCount > 0 && (
                                            <Badge className="bg-violet-600 text-white border-none h-5 min-w-5 flex items-center justify-center rounded-full p-0 text-[10px]">
                                                {contact.unreadCount}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className={`flex-1 flex flex-col ${!selectedContact ? 'hidden md:flex' : 'flex'}`}>
                {selectedContact ? (
                    <>
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 z-10">
                            <div className="flex items-center gap-3">
                                <Button variant="ghost" size="sm" className="md:hidden p-0 h-8 w-8" onClick={() => setSelectedContact(null)}>
                                    <X className="h-4 w-4" />
                                </Button>
                                <Avatar src={selectedContact.avatar_url} fallback={selectedContact.full_name} />
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-white text-base">{selectedContact.full_name}</p>
                                    <div className="flex items-center gap-2">
                                        {isPartnerTyping ? (
                                            <span className="text-[10px] text-violet-500 font-medium animate-pulse">typing...</span>
                                        ) : (
                                            <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-200">Online</Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button variant="ghost" size="sm" onClick={() => setSelectedContact(null)} className="hidden md:flex h-8 w-8 p-0">
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30 dark:bg-slate-900/50">
                            {messages.map((msg) => {
                                const isMe = msg.sender_id === currentUserId;
                                return (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${isMe
                                            ? 'bg-violet-600 text-white rounded-tr-none'
                                            : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-tl-none border border-slate-100 dark:border-slate-700'
                                            }`}>
                                            <p className="text-sm">{msg.content}</p>
                                            <div className={`flex items-center justify-between gap-4 mt-1 ${isMe ? 'text-violet-200' : 'text-slate-500'}`}>
                                                <p className="text-[10px]">{formatDateTime(msg.created_at)}</p>
                                                {isMe && (
                                                    <div className="flex">
                                                        {msg.read ? (
                                                            <div className="flex -space-x-1">
                                                                <svg className="w-3 h-3 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                                                <svg className="w-3 h-3 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                                            </div>
                                                        ) : (
                                                            <svg className="w-3 h-3 text-violet-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 dark:border-slate-800 flex gap-2">
                            <Input
                                placeholder="Type a message..."
                                value={newMessage}
                                onChange={(e) => {
                                    setNewMessage(e.target.value);
                                    handleTyping();
                                }}
                                className="flex-1 bg-slate-50 dark:bg-slate-800 border-none px-4"
                            />
                            <Button type="submit" disabled={sending || !newMessage.trim()} className="bg-violet-600 text-white hover:bg-violet-700 px-6">
                                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            </Button>
                        </form>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                            <MessageSquare className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Select a conversation</h3>
                        <p className="text-slate-500 max-w-xs">Choose a student or teacher from the list to start messaging.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
