"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Settings,
    Bell,
    Shield,
    Globe,
    Mail,
    DollarSign,
    Loader2,
    Save,
    ToggleLeft,
    ToggleRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input } from "@/components/ui";
import { DashboardLayout } from "@/components/dashboard";
import { createClient } from "@/lib/supabase/client";

interface SettingToggle {
    id: string;
    label: string;
    description: string;
    enabled: boolean;
}

export default function AdminSettings() {
    const [user, setUser] = useState<{ full_name: string; email: string; avatar_url?: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState({
        platformName: "Tutorly",
        supportEmail: "support@tutorly.com",
        commissionRate: "15",
    });
    const [toggles, setToggles] = useState<SettingToggle[]>([
        { id: "notifications", label: "Email Notifications", description: "Send email notifications for important events", enabled: true },
        { id: "maintenance", label: "Maintenance Mode", description: "Put the platform in maintenance mode", enabled: false },
        { id: "registration", label: "Open Registration", description: "Allow new user registrations", enabled: true },
        { id: "teacherApproval", label: "Teacher Approval Required", description: "Require admin approval for new teachers", enabled: true },
    ]);

    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function fetchData() {
            const supabase = createClient();
            const { data: { user: authUser } } = await supabase.auth.getUser();

            if (authUser) {
                const { data: userData } = await supabase
                    .from('users')
                    .select('full_name, email, avatar_url')
                    .eq('id', authUser.id)
                    .single();

                if (userData) {
                    setUser(userData);
                }
            }

            try {
                const { getPlatformSettings } = await import("@/lib/db");
                const generalSettings = await getPlatformSettings('general');
                const featureSettings = await getPlatformSettings('features');

                if (generalSettings) {
                    setSettings(generalSettings);
                }
                if (featureSettings) {
                    setToggles(prev => prev.map(t => ({
                        ...t,
                        enabled: featureSettings[t.id] ?? t.enabled
                    })));
                }
            } catch (err) {
                console.error("Error fetching settings:", err);
            }

            setLoading(false);
        }

        fetchData();
    }, []);

    const toggleSetting = (id: string) => {
        setToggles(prev => prev.map(t =>
            t.id === id ? { ...t, enabled: !t.enabled } : t
        ));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { updatePlatformSettings } = await import("@/lib/db");

            // Save general settings
            await updatePlatformSettings('general', settings);

            // Save feature toggles
            const features = toggles.reduce((acc, t) => ({
                ...acc,
                [t.id]: t.enabled
            }), {});
            await updatePlatformSettings('features', features);

            // Show success (could add a toast notification here)
            alert("Settings saved successfully!");
        } catch (err) {
            console.error("Error saving settings:", err);
            alert("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    const userName = user?.full_name || "Admin";
    const userEmail = user?.email;
    const userAvatar = user?.avatar_url;

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-violet-500" />
            </div>
        );
    }

    return (
        <DashboardLayout userRole="admin" userName={userName} userEmail={userEmail} userAvatar={userAvatar}>
            <div className="space-y-8 max-w-4xl">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Platform Settings</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">Configure platform-wide settings and preferences.</p>
                </div>

                {/* General Settings */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <CardHeader>
                            <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
                                <Globe className="h-5 w-5 text-violet-500" />
                                General Settings
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Platform Name
                                    </label>
                                    <Input
                                        value={settings.platformName}
                                        onChange={(e) => setSettings(prev => ({ ...prev, platformName: e.target.value }))}
                                        className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Support Email
                                    </label>
                                    <Input
                                        value={settings.supportEmail}
                                        onChange={(e) => setSettings(prev => ({ ...prev, supportEmail: e.target.value }))}
                                        className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                                    />
                                </div>
                            </div>
                            <div className="max-w-xs">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Platform Commission (%)
                                </label>
                                <Input
                                    type="number"
                                    value={settings.commissionRate}
                                    onChange={(e) => setSettings(prev => ({ ...prev, commissionRate: e.target.value }))}
                                    className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                                    min="0"
                                    max="100"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Feature Toggles */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                >
                    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <CardHeader>
                            <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
                                <Settings className="h-5 w-5 text-violet-500" />
                                Feature Toggles
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {toggles.map((toggle) => (
                                    <div
                                        key={toggle.id}
                                        className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                                    >
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-white">{toggle.label}</p>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">{toggle.description}</p>
                                        </div>
                                        <button
                                            onClick={() => toggleSetting(toggle.id)}
                                            className={`p-1 rounded-full transition-colors ${toggle.enabled ? "text-violet-600" : "text-slate-400"
                                                }`}
                                        >
                                            {toggle.enabled ? (
                                                <ToggleRight className="h-8 w-8" />
                                            ) : (
                                                <ToggleLeft className="h-8 w-8" />
                                            )}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Save Button */}
                <div className="flex justify-end">
                    <Button
                        className="bg-violet-600 text-white hover:bg-violet-700"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        Save Settings
                    </Button>
                </div>
            </div>
        </DashboardLayout>
    );
}
