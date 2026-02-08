"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Bell, MessageSquare, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { getUnreadMessagesCount } from "@/lib/db";
import { Badge } from "@/components/ui/badge";

interface HorizonNavbarProps {
    onOpenSidenav: () => void;
    brandText: string;
    userName: string;
    userRole: string;
    userAvatar?: string;
}

export function HorizonNavbar({ onOpenSidenav, brandText, userName, userRole, userAvatar }: HorizonNavbarProps) {
    const pathname = usePathname();
    const [unreadMessages, setUnreadMessages] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const [currentBrandText, setCurrentBrandText] = useState(brandText);
    const [dateStr, setDateStr] = useState("");
    const [notifications, setNotifications] = useState<{ id: string; title: string; message: string; created_at: string; read: boolean; type: string }[]>([]);
    const [notificationCount, setNotificationCount] = useState(0);
    const supabase = createClient();



    useEffect(() => {
        let isMounted = true;

        const fetchUnreadCount = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user && isMounted) {
                    const count = await getUnreadMessagesCount(user.id);
                    if (isMounted) setUnreadMessages(count);
                }
            } catch (err: any) {
                // Aggressively silence AbortErrors and expected auth/unmount interruptions
                if (
                    err?.name === 'AbortError' ||
                    err?.message?.includes('aborted') ||
                    err?.message?.includes('Auth session missing')
                ) {
                    return;
                }
                console.error("Error fetching unread count:", err);
            }
        };

        fetchUnreadCount();

        // Fix hydration mismatch by setting date on mount
        const today = new Date();
        setDateStr(today.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }));

        // Listen for local updates (e.g., from MessageCenter)
        const handleMessageUpdate = () => {
            fetchUnreadCount();
        };
        window.addEventListener('messages:updated', handleMessageUpdate);

        // Fix hydration mismatch by setting date on mount
        const channel = supabase
            .channel('navbar_notifications')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'messages'
                // We don't filter by receiver_id here because we want to catch UPDATES 
                // and the receiver_id filter in UPDATE events is tricky with Supabase.
                // fetchUnreadCount is cheap enough for now as it only runs on our own changes or messages sent to us.
            }, () => {
                if (isMounted) fetchUnreadCount();
            })
            .subscribe();

        return () => {
            isMounted = false;
            window.removeEventListener('messages:updated', handleMessageUpdate);
            supabase.removeChannel(channel);
        };
    }, []);

    const unreadCount = unreadMessages + notificationCount;

    useEffect(() => {
        const segments = pathname?.split("/").filter(Boolean) || [];
        if (segments.length > 1) {
            setCurrentBrandText(segments[1].replace(/-/g, " "));
        } else if (segments.length === 1) {
            setCurrentBrandText("Dashboard");
        } else {
            setCurrentBrandText("Dashboard");
        }
    }, [pathname]);

    const markAsRead = async (id: string) => {
        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notification_id: id })
            });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            setNotificationCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Error marking notification as read:', err);
        }
    };

    const markAllAsRead = async () => {
        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mark_all: true })
            });
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setNotificationCount(0);
        } catch (err) {
            console.error('Error marking all as read:', err);
        }
    };

    // Fetch notifications
    useEffect(() => {
        let isMounted = true;

        const fetchNotifications = async () => {
            try {
                const response = await fetch('/api/notifications?limit=10');
                if (response.ok) {
                    const result = await response.json();
                    if (isMounted) {
                        setNotifications(result.data || []);
                        setNotificationCount(result.unreadCount || 0);
                    }
                }
            } catch (err) {
                console.error('Error fetching notifications:', err);
            }
        };

        fetchNotifications();

        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);


    return (
        <nav className="flex items-center justify-between gap-4">
            {/* Left Section: Menu button + Welcome */}
            <div className="flex items-center gap-4">
                {/* Mobile Menu Toggle */}
                <button
                    className="flex cursor-pointer p-2 text-slate-600 dark:text-slate-400 xl:hidden hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    onClick={onOpenSidenav}
                >
                    <Menu className="h-5 w-5" />
                </button>

                {/* Welcome Message */}
                <div className="hidden sm:flex items-center gap-3">
                    {userAvatar ? (
                        <img
                            src={userAvatar}
                            alt={userName}
                            className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700"
                        />
                    ) : (
                        <div className={cn(
                            "w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm",
                            userRole === "teacher" ? "from-emerald-400 to-emerald-600" :
                                userRole === "admin" ? "from-amber-400 to-amber-600" :
                                    "from-violet-400 to-violet-600"
                        )}>
                            {userName.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div>
                        <h2 className="font-semibold text-slate-900 dark:text-white">Welcome back, {userName.split(' ')[0]}</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{dateStr}</p>
                    </div>
                </div>
            </div>

            {/* Right Section: Notifications & Theme */}
            <div className="flex items-center gap-3">

                {/* Theme Toggle */}
                <button
                    className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    onClick={() => {
                        const html = document.documentElement;
                        if (html.classList.contains('dark')) {
                            html.classList.remove('dark');
                            html.classList.add('light');
                            localStorage.setItem('theme', 'light');
                        } else {
                            html.classList.remove('light');
                            html.classList.add('dark');
                            localStorage.setItem('theme', 'dark');
                        }
                    }}
                    title="Toggle theme"
                >
                    <Sun className="h-5 w-5 hidden dark:block text-amber-500" />
                    <Moon className="h-5 w-5 dark:hidden" />
                </button>

                {/* Notifications */}
                <div className="relative">
                    <button
                        className="relative cursor-pointer p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        onClick={() => setShowNotifications(!showNotifications)}
                    >
                        <Bell className="h-5 w-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-violet-500 ring-2 ring-white dark:ring-slate-950" />
                        )}
                    </button>

                    {/* Notifications Dropdown */}
                    {showNotifications && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setShowNotifications(false)}
                            />
                            <div className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden">
                                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                    <h3 className="font-semibold text-slate-900 dark:text-white">Notifications</h3>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllAsRead}
                                            className="text-xs text-violet-600 dark:text-violet-400 hover:underline"
                                        >
                                            Mark all read
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-80 overflow-y-auto">
                                    {notifications.length === 0 && unreadMessages === 0 ? (
                                        <div className="p-4 text-center text-slate-500 text-sm">
                                            No notifications
                                        </div>
                                    ) : (
                                        <>
                                            {unreadMessages > 0 && (
                                                <Link
                                                    href={`/${userRole}/messages`}
                                                    onClick={() => setShowNotifications(false)}
                                                    className="p-4 border-b border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors bg-violet-50 dark:bg-violet-500/10 block"
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center flex-shrink-0">
                                                            <MessageSquare className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center justify-between">
                                                                <p className="font-medium text-slate-900 dark:text-white text-sm">
                                                                    New Messages
                                                                </p>
                                                                <Badge className="bg-violet-600 text-white border-none py-0 px-2 h-5">
                                                                    {unreadMessages}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-slate-600 dark:text-slate-400 text-sm mt-0.5">
                                                                You have {unreadMessages} unread message{unreadMessages > 1 ? 's' : ''}.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </Link>
                                            )}
                                            {notifications.map((notification) => (
                                                <div
                                                    key={notification.id}
                                                    onClick={() => markAsRead(notification.id)}
                                                    className={cn(
                                                        "p-4 border-b border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors",
                                                        !notification.read && "bg-violet-50 dark:bg-violet-500/10"
                                                    )}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        {!notification.read && (
                                                            <span className="w-2 h-2 mt-1.5 rounded-full bg-violet-500 flex-shrink-0" />
                                                        )}
                                                        <div className="flex-1">
                                                            <p className="font-medium text-slate-900 dark:text-white text-sm">
                                                                {notification.title}
                                                            </p>
                                                            <p className="text-slate-600 dark:text-slate-400 text-sm mt-0.5">
                                                                {notification.message}
                                                            </p>
                                                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                                                {new Date(notification.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default HorizonNavbar;
