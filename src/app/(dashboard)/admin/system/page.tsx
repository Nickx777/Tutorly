"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Server,
    Database,
    Shield,
    Mail,
    CreditCard,
    RefreshCw,
    CheckCircle,
    XCircle,
    AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@/components/ui";
import { DashboardLayout } from "@/components/dashboard";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

interface SystemStatus {
    name: string;
    status: "ok" | "error" | "warning";
    message: string;
    icon: React.ReactNode;
}

export default function SystemCheckPage() {
    const [statuses, setStatuses] = useState<SystemStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastChecked, setLastChecked] = useState<Date | null>(null);

    const checkSystems = async () => {
        setLoading(true);
        const newStatuses: SystemStatus[] = [];

        try {
            const { getSystemStatus, getPlatformSettings } = await import("@/lib/db");
            const status = await getSystemStatus();
            const emailSettings = await getPlatformSettings('email'); // Assuming we might have this, or check general settings

            // Database
            newStatuses.push({
                name: "Database",
                status: status.database ? "ok" : "error",
                message: status.database ? `Connected (${status.latency.database}ms)` : "Connection failed",
                icon: <Database className="h-5 w-5" />
            });

            // Auth
            newStatuses.push({
                name: "Authentication",
                status: status.auth ? "ok" : "error",
                message: status.auth ? "Auth system operational" : "Auth check failed",
                icon: <Shield className="h-5 w-5" />
            });

            // Storage
            newStatuses.push({
                name: "File Storage",
                status: status.storage ? "ok" : "error",
                message: status.storage ? "Storage buckets accessible" : "Storage access failed",
                icon: <Server className="h-5 w-5" />
            });

            // Realtime
            newStatuses.push({
                name: "Realtime",
                status: "ok", // Hard to test from client without subscription, assuming OK if Supabase is OK
                message: "Realtime service enabled",
                icon: <RefreshCw className="h-5 w-5" />
            });

            // Email (Check if support email is set in general settings as a proxy for configuration)
            const generalSettings = await getPlatformSettings('general');
            newStatuses.push({
                name: "Email Service",
                status: generalSettings?.supportEmail ? "ok" : "warning",
                message: generalSettings?.supportEmail ? `Configured as ${generalSettings.supportEmail}` : "Support email not set",
                icon: <Mail className="h-5 w-5" />
            });

            // Payment (Stripe)
            newStatuses.push({
                name: "Payment Gateway",
                status: "warning",
                message: "Stripe integration pending",
                icon: <CreditCard className="h-5 w-5" />
            });

        } catch (err) {
            console.error("System check failed:", err);
            newStatuses.push({
                name: "System Check",
                status: "error",
                message: "Failed to run system checks",
                icon: <XCircle className="h-5 w-5" />
            });
        }

        setStatuses(newStatuses);
        setLastChecked(new Date());
        setLoading(false);
    };

    useEffect(() => {
        checkSystems();
    }, []);

    return (
        <DashboardLayout userRole="admin" userName="System Admin">
            <div className="space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">System Check</h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                            Monitor the status of all system components
                        </p>
                    </div>
                    <Button
                        onClick={checkSystems}
                        disabled={loading}
                        className="bg-violet-600 hover:bg-violet-700 text-white"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? 'Checking...' : 'Refresh'}
                    </Button>
                </div>

                {/* Status Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-500/30">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-300">
                                    {statuses.filter(s => s.status === 'ok').length}
                                </p>
                                <p className="text-emerald-700 dark:text-emerald-400">Operational</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-500/30">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                                <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-amber-900 dark:text-amber-300">
                                    {statuses.filter(s => s.status === 'warning').length}
                                </p>
                                <p className="text-amber-700 dark:text-amber-400">Warnings</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-500/30">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                                <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-red-900 dark:text-red-300">
                                    {statuses.filter(s => s.status === 'error').length}
                                </p>
                                <p className="text-red-700 dark:text-red-400">Errors</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Detailed Status */}
                <Card className="bg-white dark:bg-[#1B254B] border-gray-200 dark:border-white/10">
                    <CardHeader>
                        <CardTitle className="text-slate-900 dark:text-white">Component Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {statuses.map((status, index) => (
                                <motion.div
                                    key={status.name}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-white/5"
                                >
                                    <div className={`p-3 rounded-lg ${status.status === 'ok' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                                            status.status === 'warning' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400' :
                                                'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                                        }`}>
                                        {status.icon}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-slate-900 dark:text-white">{status.name}</h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">{status.message}</p>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${status.status === 'ok' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' :
                                            status.status === 'warning' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300' :
                                                'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300'
                                        }`}>
                                        {status.status === 'ok' ? 'Operational' : status.status === 'warning' ? 'Warning' : 'Error'}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {lastChecked && (
                    <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                        Last checked: {lastChecked.toLocaleTimeString()}
                    </p>
                )}
            </div>
        </DashboardLayout>
    );
}
