"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    BarChart3,
    TrendingUp,
    Users,
    BookOpen,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight,
    Calendar,
    Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "@/components/ui";
import { DashboardLayout } from "@/components/dashboard";
import { createClient } from "@/lib/supabase/client";

interface AnalyticsData {
    totalUsers: number;
    newUsersThisWeek: number;
    totalLessons: number;
    lessonsThisMonth: number;
    totalRevenue: number;
    revenueGrowth: number;
}

export default function AdminAnalytics() {
    const [user, setUser] = useState<{ full_name: string; email: string; avatar_url?: string } | null>(null);
    const [timeRange, setTimeRange] = useState("30 days");
    const [analytics, setAnalytics] = useState<AnalyticsData>({
        totalUsers: 0,
        newUsersThisWeek: 0,
        totalLessons: 0,
        lessonsThisMonth: 0,
        totalRevenue: 0,
        revenueGrowth: 0,
    });
    const [loading, setLoading] = useState(true);

    const getStartDate = (range: string) => {
        const now = new Date();
        switch (range) {
            case "24 hours":
                now.setHours(now.getHours() - 24);
                break;
            case "7 days":
                now.setDate(now.getDate() - 7);
                break;
            case "30 days":
                now.setDate(now.getDate() - 30);
                break;
            case "12 months":
                now.setMonth(now.getMonth() - 12);
                break;
            default:
                now.setDate(now.getDate() - 30); // Default to 30 days
        }
        return now.toISOString();
    };

    useEffect(() => {
        async function fetchUserData() {
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
        }
        fetchUserData();
    }, []);

    useEffect(() => {
        async function fetchAnalytics() {
            setLoading(true);
            const supabase = createClient();
            const startDate = getStartDate(timeRange);

            try {
                // Users
                const { count: totalUsers } = await supabase
                    .from('users')
                    .select('*', { count: 'exact', head: true });

                const { count: newUsers } = await supabase
                    .from('users')
                    .select('*', { count: 'exact', head: true })
                    .gte('created_at', startDate);

                // Lessons
                const { count: totalLessons } = await supabase
                    .from('lessons')
                    .select('*', { count: 'exact', head: true });

                const { count: newLessons } = await supabase
                    .from('lessons')
                    .select('*', { count: 'exact', head: true })
                    .gte('date', startDate);

                // Revenue
                const { data: payments } = await supabase
                    .from('payments')
                    .select('amount')
                    .gte('created_at', startDate);

                const revenue = payments?.reduce((sum: number, p: { amount: number | null }) => sum + (p.amount || 0), 0) || 0;

                // Previous period for growth comparison (simplified: same duration before startDate)
                // This is a rough approximation
                // For now setting growth to 0 as implementing accurate historical comparison requires more complex queries

                setAnalytics({
                    totalUsers: totalUsers || 0,
                    newUsersThisWeek: newUsers || 0,
                    totalLessons: totalLessons || 0,
                    lessonsThisMonth: newLessons || 0,
                    totalRevenue: revenue,
                    revenueGrowth: 0,
                });
            } catch (err) {
                console.error("Error fetching analytics:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchAnalytics();
    }, [timeRange]);

    const userName = user?.full_name || "Admin";
    const userEmail = user?.email;
    const userAvatar = user?.avatar_url;

    if (loading && !analytics.totalUsers) { // Only show full loader on initial load
        return (
            <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-violet-500" />
            </div>
        );
    }

    const metrics = [
        {
            title: "Total Users",
            value: analytics.totalUsers.toString(),
            change: `+${analytics.newUsersThisWeek} in last ${timeRange}`,
            trend: "up",
            icon: Users,
        },
        {
            title: "Total Lessons",
            value: analytics.totalLessons.toString(),
            change: `+${analytics.lessonsThisMonth} in last ${timeRange}`,
            trend: "up",
            icon: BookOpen,
        },
        {
            title: "Revenue",
            value: `$${analytics.totalRevenue.toLocaleString()}`,
            change: `in last ${timeRange}`,
            trend: "neutral",
            icon: DollarSign,
        },
        {
            title: "Avg. Session Length",
            value: "52 min", // This would need actual lesson duration data to calculate real average
            change: "Average",
            trend: "neutral",
            icon: Calendar,
        },
    ];

    return (
        <DashboardLayout userRole="admin" userName={userName} userEmail={userEmail} userAvatar={userAvatar}>
            <div className="space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">Track platform performance and growth.</p>
                </div>

                {/* Time Range Selector */}
                <div className="flex flex-wrap gap-2">
                    {["12 months", "30 days", "7 days", "24 hours"].map((range) => (
                        <Button
                            key={range}
                            variant={timeRange === range ? "default" : "outline"}
                            size="sm"
                            onClick={() => setTimeRange(range)}
                            className={timeRange === range
                                ? "bg-violet-600 text-white hover:bg-violet-700"
                                : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                            }
                        >
                            {range}
                        </Button>
                    ))}
                </div>

                {/* Metrics Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {metrics.map((metric, index) => (
                        <motion.div
                            key={metric.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{metric.title}</span>
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                            <metric.icon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                        </div>
                                    </div>
                                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{metric.value}</p>
                                    <div className="flex items-center gap-1 mt-2">
                                        <span className="text-sm text-slate-500 dark:text-slate-400">
                                            {metric.change}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* Charts Section */}
                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Revenue Chart Placeholder */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.4 }}
                    >
                        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-slate-900 dark:text-white">Revenue Over Time</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                                    <div className="text-center">
                                        <BarChart3 className="h-12 w-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
                                        <p className="text-slate-600 dark:text-slate-400">Chart visualization</p>
                                        <p className="text-sm text-slate-500">Revenue trends will display here</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* User Growth Chart Placeholder */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.5 }}
                    >
                        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-slate-900 dark:text-white">User Growth</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                                    <div className="text-center">
                                        <TrendingUp className="h-12 w-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
                                        <p className="text-slate-600 dark:text-slate-400">Growth visualization</p>
                                        <p className="text-sm text-slate-500">User trends will display here</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </DashboardLayout>
    );
}
