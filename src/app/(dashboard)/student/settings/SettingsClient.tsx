"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Card, CardHeader, CardContent, CardTitle, Label, Avatar, Tabs, TabsContent, TabsList, TabsTrigger, Switch, Badge } from "@/components/ui";
import { Save, Loader2, User, Mail, Camera, Calendar, Copy, Check, RefreshCw, Bell, CreditCard, GraduationCap } from "lucide-react";
import { motion } from "framer-motion";
import { ImageCropModal } from "@/components/dashboard/ImageCropModal";
import { PageTransition } from "@/components/ui/PageTransition";

interface SettingsClientProps {
    initialUser: {
        id: string;
        full_name: string;
        email: string;
        avatar_url?: string;
        calendar_token?: string;
    };
    isGoogleConnected?: boolean;
}

export default function SettingsClient({ initialUser, isGoogleConnected = false }: SettingsClientProps) {
    const [user, setUser] = useState(initialUser);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);

    // Calendar State
    const [disconnecting, setDisconnecting] = useState(false);

    // Placeholder states for tabs consistency
    const [notifications, setNotifications] = useState({
        email: true,
        push: true,
    });

    const supabase = createClient();

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setSelectedImage(reader.result as string);
                setIsCropModalOpen(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCropComplete = async (croppedBlob: Blob) => {
        setIsCropModalOpen(false);
        setUploading(true);
        try {
            const fileName = `${user.id}-${Math.random()}.jpg`;
            const { data, error } = await supabase.storage
                .from('avatars')
                .upload(fileName, croppedBlob, {
                    contentType: 'image/jpeg',
                    upsert: true
                });

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            const { error: updateError } = await supabase
                .from('users')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id);

            if (updateError) throw updateError;

            setUser(prev => ({ ...prev, avatar_url: publicUrl }));
            alert("Avatar updated successfully!");
        } catch (error) {
            console.error("Error uploading avatar:", error);
            alert("Failed to upload avatar.");
        } finally {
            setUploading(false);
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const fullName = (document.getElementById('fullName') as HTMLInputElement).value;
            const { error } = await supabase
                .from('users')
                .update({ full_name: fullName })
                .eq('id', user.id);

            if (error) throw error;
            setUser(prev => ({ ...prev, full_name: fullName }));
            alert("Profile updated!");
        } catch (error) {
            console.error("Error saving profile:", error);
            alert("Failed to save profile.");
        } finally {
            setSaving(false);
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
                redirectTo: `${window.location.origin}/auth/callback?next=/student/settings`
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
                } as any)
                .eq('id', user.id);

            if (error) throw error;

            window.location.reload();
        } catch (error) {
            console.error("Error disconnecting Google:", error);
            alert("Failed to disconnect.");
        } finally {
            setDisconnecting(false);
        }
    };

    return (
        <PageTransition>
            <div className="space-y-8 p-4 md:p-0">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Settings</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-2">Manage your account preferences.</p>
                </div>

                <Tabs defaultValue="notifications" className="space-y-8">
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
                        <TabsTrigger value="preferences" className="text-slate-600 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white">
                            <GraduationCap className="h-4 w-4 mr-2" />
                            Learning
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
                                            <p className="text-sm text-slate-600 dark:text-slate-400">Receive updates about your lessons</p>
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
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-violet-500/5 border border-violet-500/10">
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
                                </CardContent>
                            </Card>
                        </motion.div>
                    </TabsContent>

                    {/* Account Tab */}
                    <TabsContent value="account">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
                            {/* Profile Info */}
                            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                <CardHeader>
                                    <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
                                        <User className="h-5 w-5 text-violet-500" />
                                        Personal Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col sm:flex-row gap-8">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="relative group">
                                                <Avatar src={user.avatar_url} fallback={user.full_name} className="w-32 h-32 border-4 border-slate-200 dark:border-slate-800" />
                                                {uploading && (
                                                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                                                        <Loader2 className="h-8 w-8 animate-spin text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col w-full gap-2">
                                                <Input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleFileSelect}
                                                    className="hidden"
                                                    id="avatar-upload"
                                                />
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    asChild
                                                    className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                                >
                                                    <label htmlFor="avatar-upload" className="cursor-pointer">
                                                        <Camera className="h-4 w-4 mr-2" />
                                                        Change Photo
                                                    </label>
                                                </Button>
                                            </div>
                                        </div>
                                        <form onSubmit={handleSaveProfile} className="flex-1 space-y-6">
                                            <div className="grid gap-6 sm:grid-cols-2">
                                                <div className="space-y-2">
                                                    <Label htmlFor="fullName" className="text-slate-700 dark:text-slate-300">Full Name</Label>
                                                    <Input
                                                        id="fullName"
                                                        defaultValue={user.full_name}
                                                        className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-50 focus:border-violet-500"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="email" className="text-slate-700 dark:text-slate-300">Email Address</Label>
                                                    <div className="relative">
                                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                                        <Input
                                                            id="email"
                                                            defaultValue={user.email}
                                                            disabled
                                                            className="pl-9 bg-slate-100 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <Button type="submit" disabled={saving || uploading} className="bg-violet-600 hover:bg-violet-700">
                                                {saving ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Saving...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save className="mr-2 h-4 w-4" />
                                                        Save Changes
                                                    </>
                                                )}
                                            </Button>
                                        </form>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Password Section */}
                            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                <CardHeader>
                                    <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
                                        <Mail className="h-5 w-5 text-emerald-500" />
                                        Security
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-slate-50">Password</p>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">Manage your password and security settings.</p>
                                        </div>
                                        <Button asChild variant="outline" className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
                                            <a href="/student/settings/security">
                                                Update Password
                                            </a>
                                        </Button>
                                    </div>
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
                                        Payment Method
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <Button variant="outline" className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                                        <CreditCard className="h-4 w-4 mr-2" />
                                        Add Payment Method
                                    </Button>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </TabsContent>

                    {/* Learning Preferences Tab */}
                    <TabsContent value="preferences">
                        <LearningPreferences user={user} />
                    </TabsContent>
                </Tabs>

                <ImageCropModal
                    isOpen={isCropModalOpen}
                    onClose={() => setIsCropModalOpen(false)}
                    image={selectedImage}
                    onCropComplete={handleCropComplete}
                />
            </div>
        </PageTransition>
    );
}

function LearningPreferences({ user }: { user: any }) {
    const [gradeLevel, setGradeLevel] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const supabase = createClient();

    const GRADES = [
        "Elementary School",
        "Middle School (6-8)",
        "High School - Freshman (9th)",
        "High School - Sophomore (10th)",
        "High School - Junior (11th)",
        "High School - Senior (12th)",
        "University / College",
        "Adult Learner",
    ];

    // Load student profile
    useState(() => {
        async function loadProfile() {
            try {
                const { getStudentProfile } = await import("@/lib/db");
                const profile = await getStudentProfile(user.id);
                if (profile?.grade_level) {
                    setGradeLevel(profile.grade_level);
                }
            } catch (error) {
                console.error("Error loading student profile:", error);
            } finally {
                setLoading(false);
            }
        }
        loadProfile();
    });

    const handleSave = async () => {
        setSaving(true);
        try {
            const { upsertStudentProfile } = await import("@/lib/db");
            await upsertStudentProfile(user.id, {
                grade_level: gradeLevel
            });

            // Allow update of user metadata for consistency if needed
            await supabase.auth.updateUser({
                data: { grade_level: gradeLevel }
            });

            alert("Preferences updated!");
        } catch (error) {
            console.error("Error saving preferences:", error);
            alert("Failed to save preferences.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-violet-600" /></div>;
    }

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <CardHeader>
                    <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-violet-500" />
                        Learning Preferences
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label className="text-slate-700 dark:text-slate-300">Current Grade Level</Label>
                        <select
                            value={gradeLevel}
                            onChange={(e) => setGradeLevel(e.target.value)}
                            className="w-full p-2 rounded-lg bg-white border border-slate-300 text-slate-900 dark:bg-slate-950 dark:border-slate-800 dark:text-white"
                        >
                            <option value="">Select your grade level...</option>
                            {GRADES.map((grade) => (
                                <option key={grade} value={grade}>{grade}</option>
                            ))}
                        </select>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            This helps us match you with the right tutors.
                        </p>
                    </div>

                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-violet-600 hover:bg-violet-700 text-white"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Save Preferences
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>
        </motion.div>
    );
}
