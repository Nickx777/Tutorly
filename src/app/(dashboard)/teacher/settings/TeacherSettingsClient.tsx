"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Bell, Lock, CreditCard, User, Calendar, Copy, Check, RefreshCw, Loader2, Video } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Switch, Input, Label, Tabs, TabsContent, TabsList, TabsTrigger, Badge } from "@/components/ui";

interface TeacherSettingsClientProps {
    initialUser: {
        id: string;
        full_name: string;
        email: string;
        avatar_url?: string;
        calendar_token?: string;
        google_refresh_token?: string;
        zoom_refresh_token?: string;
    };
    isGoogleConnected?: boolean;
    isZoomConnected?: boolean;
    defaultTab?: string;
}

export default function TeacherSettingsClient({
    initialUser,
    isGoogleConnected = false,
    isZoomConnected = false,
    defaultTab = "notifications"
}: TeacherSettingsClientProps) {
    const [user, setUser] = useState(initialUser);

    // Sync state if props change (e.g. after a redirect and re-fetch)
    useEffect(() => {
        setUser(initialUser);
    }, [initialUser]);

    const searchParams = useSearchParams();
    const router = useRouter();

    // Notification Effect
    useEffect(() => {
        const success = searchParams.get('success');
        const error = searchParams.get('error');

        if (success) {
            if (success === 'zoom_connected') {
                toast.success("Zoom connected successfully!");
            } else if (success === 'google_connected') {
                toast.success("Google Calendar connected successfully!");
            }
            // Cleanup URL
            const params = new URLSearchParams(searchParams.toString());
            params.delete('success');
            router.replace(`/teacher/settings?${params.toString()}`);
        }

        if (error) {
            let message = "An error occurred.";
            if (error === 'zoom_denied') message = "Zoom connection was denied.";
            if (error === 'callback_failed') message = "Something went wrong during the connection process. Please try again.";
            if (error === 'no_code') message = "Authorization code was missing.";
            if (error === 'expired') message = "Connection request expired. Please try again.";
            if (error === 'invalid_state') message = "Security verification failed. Please try again.";
            if (error === 'unauthorized') message = "You are not authorized to perform this action.";
            if (error === 'storage_failed') message = "Failed to save connection details.";
            if (error === 'missing_zoom_config') message = "Zoom configuration is missing in Vercel. Please add ZOOM_CLIENT_ID and ZOOM_CLIENT_SECRET.";
            if (error === 'zoom_connect_failed') message = "Failed to initiate Zoom connection. Check server logs.";

            toast.error(message);

            // Cleanup URL
            const params = new URLSearchParams(searchParams.toString());
            params.delete('error');
            router.replace(`/teacher/settings?${params.toString()}`);
        }
    }, [searchParams, router]);

    const [notifications, setNotifications] = useState({
        email: true,
        push: true,
        sms: false,
        marketing: false,
    });


    const [copied, setCopied] = useState(false);
    const [regenerating, setRegenerating] = useState(false);

    // Password State Removed in favor of dedicated page

    // Calendar State
    const [disconnecting, setDisconnecting] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState<{ message: string; synced?: number } | null>(null);

    const supabase = createClient();

    const calendarUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/api/calendar/feed/${user.calendar_token}`
        : "";

    const copyToClipboard = () => {
        navigator.clipboard.writeText(calendarUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleRegenerateToken = async () => {
        if (!confirm("Are you sure? This will invalidate your existing calendar sync links.")) return;
        setRegenerating(true);
        try {
            const { data, error } = await supabase.rpc('regenerate_calendar_token', {
                user_id: user.id
            });
            if (error) throw error;
            setUser(prev => ({ ...prev, calendar_token: data }));
            alert("New calendar token generated!");
        } catch (error) {
            console.error("Error regenerating token:", error);
            alert("Failed to regenerate token.");
        } finally {
            setRegenerating(false);
        }
    };

    const handleConnectGoogle = async () => {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
                scopes: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly',
                redirectTo: `${window.location.origin}/auth/callback?next=/teacher/settings?tab=calendar&role=teacher`
            }
        });
        if (error) {
            console.error("Error connecting Google:", error);
            alert("Failed to initiate Google connection.");
        }
    };

    const handleDisconnectGoogle = async () => {
        if (!confirm("Are you sure you want to disconnect Google Calendar? Automation will stop.")) return;
        setDisconnecting(true);
        try {
            const { error } = await supabase
                .from('users')
                .update({
                    google_refresh_token: null,
                    // We might also want to clear the access token if we stored it, but refresh token is the key.
                    // If we need to clear identities, that's harder client-side.
                    // For now, clearing refresh token stops the sync.
                } as any)
                .eq('id', user.id);

            if (error) throw error;

            // Force refresh or update local state?
            // Since isGoogleConnected is a prop, we need to refresh the page or assume navigation.
            window.location.reload();
        } catch (error) {
            console.error("Error disconnecting Google:", error);
            alert("Failed to disconnect.");
        } finally {
            setDisconnecting(false);
        }
    };

    const handleSyncLessons = async () => {
        setSyncing(true);
        setSyncResult(null);
        try {
            const response = await fetch('/api/calendar/sync', { method: 'POST' });
            const data = await response.json();
            if (response.ok) {
                setSyncResult({ message: data.message, synced: data.synced });
            } else {
                setSyncResult({ message: data.error || 'Sync failed' });
            }
        } catch (error) {
            console.error('Error syncing lessons:', error);
            setSyncResult({ message: 'Failed to sync lessons' });
        } finally {
            setSyncing(false);
        }
    };

    // Zoom handlers
    const [zoomDisconnecting, setZoomDisconnecting] = useState(false);

    const handleConnectZoom = () => {
        window.location.href = '/api/zoom/connect';
    };

    const handleDisconnectZoom = async () => {
        if (!confirm("Are you sure you want to disconnect Zoom? New lessons won't automatically get Zoom links.")) return;
        setZoomDisconnecting(true);
        try {
            const response = await fetch('/api/zoom/disconnect', { method: 'POST' });
            if (!response.ok) throw new Error('Failed to disconnect');
            window.location.reload();
        } catch (error) {
            console.error("Error disconnecting Zoom:", error);
            alert("Failed to disconnect Zoom.");
        } finally {
            setZoomDisconnecting(false);
        }
    };


    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">Manage your account preferences</p>
            </div>

            <Tabs defaultValue={defaultTab} className="space-y-8">
                <TabsList className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800">
                    <TabsTrigger value="notifications" className="text-slate-600 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white">
                        <Bell className="h-4 w-4 mr-2" />
                        Notifications
                    </TabsTrigger>

                    <TabsTrigger value="calendar" className="text-slate-600 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white">
                        <Calendar className="h-4 w-4 mr-2" />
                        Calendar Sync
                    </TabsTrigger>
                    <TabsTrigger value="account" className="text-slate-600 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white">
                        <User className="h-4 w-4 mr-2" />
                        Account
                    </TabsTrigger>
                    <TabsTrigger value="payment" className="text-slate-600 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Payment
                    </TabsTrigger>
                </TabsList>

                {/* Notifications Tab */}
                <TabsContent value="notifications">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
                                    <Bell className="h-5 w-5" />
                                    Notification Preferences
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-slate-900 dark:text-white">Email Notifications</p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Receive updates about bookings and messages</p>
                                    </div>
                                    <Switch
                                        checked={notifications.email}
                                        onCheckedChange={(v) => setNotifications({ ...notifications, email: v })}
                                    />
                                </div>
                                <div className="h-px bg-slate-200 dark:bg-slate-800" />
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-slate-900 dark:text-white">Push Notifications</p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Get instant alerts on your device</p>
                                    </div>
                                    <Switch
                                        checked={notifications.push}
                                        onCheckedChange={(v) => setNotifications({ ...notifications, push: v })}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </TabsContent>



                {/* Calendar Tab */}
                <TabsContent value="calendar">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-blue-500" />
                                    Calendar Sync
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Keep your teaching schedule in sync with Google, Outlook, or Apple Calendar.
                                </p>

                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-sm">
                                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">Automatic Google Sync</p>
                                            <p className="text-[11px] text-slate-500">Instantly push new lessons to your Google Calendar.</p>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={isGoogleConnected ? handleDisconnectGoogle : handleConnectGoogle}
                                        disabled={disconnecting}
                                        className={`shadow-sm ${isGoogleConnected
                                            ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'
                                            : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                                    >
                                        {disconnecting ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : isGoogleConnected ? (
                                            <span className="flex items-center gap-2">
                                                Disconnect
                                            </span>
                                        ) : 'Connect Google'}
                                    </Button>
                                </div>

                                {/* Sync Existing Lessons */}
                                {isGoogleConnected && (
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-green-500/5 border border-green-500/10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                                <RefreshCw className="h-5 w-5 text-green-600 dark:text-green-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">Sync Existing Lessons</p>
                                                <p className="text-[11px] text-slate-500">Push all upcoming lessons to your calendar.</p>
                                            </div>
                                        </div>
                                        <Button
                                            onClick={handleSyncLessons}
                                            disabled={syncing}
                                            variant="outline"
                                            className="bg-green-50 text-green-600 border-green-100 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30"
                                        >
                                            {syncing ? (
                                                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Syncing...</>
                                            ) : 'Sync Now'}
                                        </Button>
                                    </div>
                                )}

                                {syncResult && (
                                    <div className={`p-3 rounded-lg text-sm ${syncResult.synced !== undefined && syncResult.synced > 0
                                        ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                        }`}>
                                        {syncResult.message}
                                    </div>
                                )}

                                {/* Divider */}
                                <div className="h-px bg-slate-200 dark:bg-slate-700 my-2" />

                                {/* Zoom Integration */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                            <Video className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">Zoom Meetings</p>
                                            <p className="text-[11px] text-slate-500">
                                                {isZoomConnected
                                                    ? "Zoom links are auto-generated for new lessons."
                                                    : "Connect to auto-create Zoom meetings for lessons."}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={isZoomConnected ? handleDisconnectZoom : handleConnectZoom}
                                        disabled={zoomDisconnecting}
                                        className={`shadow-sm ${isZoomConnected
                                            ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'
                                            : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                                    >
                                        {zoomDisconnecting ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : isZoomConnected ? (
                                            'Disconnect Zoom'
                                        ) : 'Connect Zoom'}
                                    </Button>
                                </div>

                                {isZoomConnected && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        ✓ When students book lessons, Zoom meeting links will be automatically created and shared with both you and the student.
                                    </p>
                                )}

                            </CardContent>
                        </Card>
                    </motion.div>
                </TabsContent>

                {/* Account Tab */}
                <TabsContent value="account">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
                        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
                                    <Lock className="h-5 w-5" />
                                    Change Password
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Manage your password and security settings securely on a dedicated page.
                                </p>
                                <Button asChild variant="outline" className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
                                    <a href="/teacher/settings/security">
                                        Update Password
                                    </a>
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                </TabsContent>

                {/* Payment Tab */}
                <TabsContent value="payment">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
                                    <CreditCard className="h-5 w-5" />
                                    Payout Method
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <Button variant="outline" className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    Add Payout Method
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
