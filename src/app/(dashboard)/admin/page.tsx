"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Users,
    BookOpen,
    DollarSign,
    TrendingUp,
    AlertCircle,
    CheckCircle,
    Clock,
    BarChart3,
    ArrowUpRight,
    Loader2,
    Shield,
    GraduationCap,
    UserCheck,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Avatar } from "@/components/ui";
import { DashboardLayout } from "@/components/dashboard";
import { formatCurrency } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface Stats {
    totalUsers: number;
    totalTeachers: number;
    totalStudents: number;
    totalLessons: number;
    pendingLessons: number;
    totalRevenue: number;
    revenueGrowth: number;
}

interface RecentUser {
    id: string;
    full_name: string;
    email: string;
    role: string;
    avatar_url?: string;
    created_at: string;
}

export default function AdminDashboard() {
    const [user, setUser] = useState<{ full_name: string; email: string; avatar_url?: string } | null>(null);
    const [stats, setStats] = useState<Stats>({
        totalUsers: 0,
        totalTeachers: 0,
        totalStudents: 0,
        totalLessons: 0,
        pendingLessons: 0,
        totalRevenue: 0,
        revenueGrowth: 0,
    });
    const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
    const [loading, setLoading] = useState(true);

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

                // Fetch real platform stats
                try {
                    const { getAdminStats } = await import("@/lib/db");
                    const adminStats = await getAdminStats();

                    setStats({
                        totalUsers: adminStats.total_users,
                        totalTeachers: adminStats.total_teachers,
                        totalStudents: adminStats.total_students,
                        totalLessons: adminStats.active_lessons_today, // Using active lessons today for the card, or could fetch total lessons
                        pendingLessons: adminStats.pending_approvals,
                        totalRevenue: adminStats.total_revenue,
                        revenueGrowth: 0, // Trends require historical data tables not yet implemented
                    });
                } catch (err) {
                    console.error("Error fetching stats:", err);
                }

                // Fetch recent users
                try {
                    const { data: users } = await supabase
                        .from('users')
                        .select('id, full_name, email, role, avatar_url, created_at')
                        .order('created_at', { ascending: false })
                        .limit(5);

                    setRecentUsers(users || []);
                } catch (err) {
                    console.error("Error fetching users:", err);
                }
            }

            setLoading(false);
        }

        fetchData();
    }, []);

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

    const statsDisplay = [
        {
            title: "Total Users",
            value: stats.totalUsers.toString(),
            icon: Users,
            trend: "Total registered",
            color: "violet",
        },
        {
            title: "Teachers",
            value: stats.totalTeachers.toString(),
            icon: GraduationCap,
            trend: `${stats.pendingLessons} pending approval`,
            color: "emerald",
        },
        {
            title: "Students",
            value: stats.totalStudents.toString(),
            icon: UserCheck,
            trend: "Active learners",
            color: "cyan",
        },
        {
            title: "Revenue",
            value: formatCurrency(stats.totalRevenue),
            icon: DollarSign,
            trend: "Lifetime earnings",
            color: "amber",
        },
    ];

    return (
        <DashboardLayout userRole="admin" userName={userName} userEmail={userEmail} userAvatar={userAvatar}>
            <div className="space-y-8">
                {/* Welcome Section */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">Monitor and manage your tutoring platform.</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" asChild className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                            <Link href="/admin/system">
                                <Shield className="h-4 w-4 mr-2" />
                                System Check
                            </Link>
                        </Button>
                        <Button asChild className="bg-violet-600 text-white hover:bg-violet-700">
                            <Link href="/admin/users">
                                <Users className="h-4 w-4 mr-2" />
                                Manage Users
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statsDisplay.map((stat, index) => (
                        <motion.div
                            key={stat.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{stat.title}</p>
                                            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{stat.value}</p>
                                            <div className="flex items-center gap-1 mt-2">
                                                <TrendingUp className="h-4 w-4 text-emerald-500" />
                                                <span className="text-sm text-emerald-600 dark:text-emerald-400">{stat.trend}</span>
                                            </div>
                                        </div>
                                        <div className="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center">
                                            <stat.icon className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Recent Users */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.4 }}
                    >
                        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-slate-900 dark:text-white">Recent Users</CardTitle>
                                <Button variant="ghost" size="sm" asChild className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                                    <Link href="/admin/users">
                                        View all
                                        <ArrowUpRight className="h-4 w-4 ml-1" />
                                    </Link>
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {recentUsers.length > 0 ? (
                                    <div className="space-y-4">
                                        {recentUsers.map((u) => (
                                            <div
                                                key={u.id}
                                                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Avatar fallback={u.full_name} src={u.avatar_url} />
                                                    <div>
                                                        <p className="font-medium text-slate-900 dark:text-white">{u.full_name}</p>
                                                        <p className="text-sm text-slate-500">{u.email}</p>
                                                    </div>
                                                </div>
                                                <Badge className={
                                                    u.role === 'teacher'
                                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                                                        : u.role === 'admin'
                                                            ? 'bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400'
                                                            : 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400'
                                                }>
                                                    {u.role || 'student'}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <Users className="h-12 w-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
                                        <p className="text-slate-600 dark:text-slate-400">No users yet</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* System Status */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.5 }}
                    >
                        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-slate-900 dark:text-white">System Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {[
                                        { name: "Database", status: "operational", icon: CheckCircle },
                                        { name: "Authentication", status: "operational", icon: CheckCircle },
                                        { name: "File Storage", status: "operational", icon: CheckCircle },
                                        { name: "Video Calls", status: "operational", icon: CheckCircle },
                                    ].map((service) => (
                                        <div
                                            key={service.name}
                                            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                                        >
                                            <div className="flex items-center gap-3">
                                                <service.icon className="h-5 w-5 text-emerald-500" />
                                                <span className="font-medium text-slate-900 dark:text-white">{service.name}</span>
                                            </div>
                                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                                                Operational
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* Quick Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.6 }}
                >
                    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <CardHeader>
                            <CardTitle className="text-slate-900 dark:text-white">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    { name: "Manage Users", href: "/admin/users", icon: Users, color: "violet" },
                                    { name: "View Lessons", href: "/admin/lessons", icon: BookOpen, color: "emerald" },
                                    { name: "Analytics", href: "/admin/analytics", icon: BarChart3, color: "cyan" },
                                    { name: "System Check", href: "/admin/system", icon: Shield, color: "amber" },
                                ].map((action) => (
                                    <Link
                                        key={action.name}
                                        href={action.href}
                                        className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-violet-500 dark:hover:border-violet-500 transition-colors group"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center group-hover:bg-violet-100 dark:group-hover:bg-violet-500/20 transition-colors">
                                            <action.icon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                                        </div>
                                        <span className="font-medium text-slate-900 dark:text-white">{action.name}</span>
                                        <ArrowUpRight className="h-4 w-4 text-slate-400 ml-auto group-hover:text-violet-500 transition-colors" />
                                    </Link>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </DashboardLayout>
    );
}
