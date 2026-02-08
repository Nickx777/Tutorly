"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    CalendarCheck,
    Search,
    Clock,
    DollarSign,
    Loader2,
    Video,
    User,
    Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Avatar, Input } from "@/components/ui";
import { DashboardLayout } from "@/components/dashboard";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { getAllLessons } from "@/lib/db";

interface LessonItem {
    id: string;
    subject: string;
    scheduled_at: string;
    duration_minutes: number;
    price: number;
    status: string;
    lesson_type: string;
    zoom_link?: string;
    teacher?: {
        id: string;
        full_name: string;
        avatar_url?: string;
    };
    student?: {
        id: string;
        full_name: string;
        avatar_url?: string;
    };
}

export default function AdminLessonsPage() {
    const [lessons, setLessons] = useState<LessonItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [adminUser, setAdminUser] = useState<{ full_name: string; avatar_url?: string } | null>(null);

    useEffect(() => {
        async function fetchData() {
            const supabase = createClient();
            const { data: { user: authUser } } = await supabase.auth.getUser();

            if (authUser) {
                const { data: userData } = await supabase
                    .from("users")
                    .select("full_name, avatar_url")
                    .eq("id", authUser.id)
                    .single();
                if (userData) setAdminUser(userData);
            }

            try {
                const lessonsData = await getAllLessons();
                setLessons(lessonsData as LessonItem[]);
            } catch (err) {
                console.error("Error fetching lessons:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    const filteredLessons = lessons.filter(lesson => {
        const matchesSearch =
            lesson.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lesson.teacher?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lesson.student?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = !statusFilter || lesson.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const userName = adminUser?.full_name || "Admin";
    const userAvatar = adminUser?.avatar_url;

    const getStatusColor = (status: string) => {
        switch (status) {
            case "scheduled":
                return "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300";
            case "completed":
                return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300";
            case "cancelled":
                return "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300";
            case "pending":
                return "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300";
            default:
                return "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300";
        }
    };

    if (loading) {
        return (
            <DashboardLayout userRole="admin" userName={userName} userAvatar={userAvatar}>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="h-8 w-8 animate-spin text-red-600" />
                </div>
            </DashboardLayout>
        );
    }

    // Calculate stats
    const totalRevenue = lessons.reduce((sum, l) => sum + (l.price || 0), 0);
    const platformCommission = totalRevenue * 0.15;
    const scheduledCount = lessons.filter(l => l.status === "scheduled").length;
    const completedCount = lessons.filter(l => l.status === "completed").length;

    return (
        <DashboardLayout userRole="admin" userName={userName} userAvatar={userAvatar}>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Lesson Management</h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                            View and manage all platform lessons
                        </p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
                        <CardContent className="p-4">
                            <p className="text-sm text-slate-600 dark:text-slate-400">Total Lessons</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{lessons.length}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
                        <CardContent className="p-4">
                            <p className="text-sm text-slate-600 dark:text-slate-400">Scheduled</p>
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{scheduledCount}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
                        <CardContent className="p-4">
                            <p className="text-sm text-slate-600 dark:text-slate-400">Total Revenue</p>
                            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalRevenue)}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
                        <CardContent className="p-4">
                            <p className="text-sm text-slate-600 dark:text-slate-400">Commission (15%)</p>
                            <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">{formatCurrency(platformCommission)}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <Input
                            placeholder="Search by subject, teacher, or student..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-white dark:bg-slate-800"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant={statusFilter === null ? "default" : "outline"}
                            size="sm"
                            onClick={() => setStatusFilter(null)}
                        >
                            All
                        </Button>
                        <Button
                            variant={statusFilter === "scheduled" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setStatusFilter("scheduled")}
                        >
                            Scheduled
                        </Button>
                        <Button
                            variant={statusFilter === "completed" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setStatusFilter("completed")}
                        >
                            Completed
                        </Button>
                        <Button
                            variant={statusFilter === "cancelled" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setStatusFilter("cancelled")}
                        >
                            Cancelled
                        </Button>
                    </div>
                </div>

                {/* Lessons Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <Card className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-white/5">
                                            <th className="text-left p-4 text-sm font-medium text-slate-700 dark:text-slate-300">Subject</th>
                                            <th className="text-left p-4 text-sm font-medium text-slate-700 dark:text-slate-300">Teacher</th>
                                            <th className="text-left p-4 text-sm font-medium text-slate-700 dark:text-slate-300">Student</th>
                                            <th className="text-left p-4 text-sm font-medium text-slate-700 dark:text-slate-300">Scheduled</th>
                                            <th className="text-left p-4 text-sm font-medium text-slate-700 dark:text-slate-300">Duration</th>
                                            <th className="text-left p-4 text-sm font-medium text-slate-700 dark:text-slate-300">Price</th>
                                            <th className="text-left p-4 text-sm font-medium text-slate-700 dark:text-slate-300">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredLessons.map((lesson) => (
                                            <tr
                                                key={lesson.id}
                                                className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5"
                                            >
                                                <td className="p-4">
                                                    <p className="font-medium text-slate-900 dark:text-white">{lesson.subject}</p>
                                                    <Badge variant="secondary" className="text-xs mt-1">
                                                        {lesson.lesson_type === "group" ? "Group" : "1-on-1"}
                                                    </Badge>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <Avatar
                                                            fallback={lesson.teacher?.full_name || "T"}
                                                            src={lesson.teacher?.avatar_url}
                                                            size="sm"
                                                        />
                                                        <span className="text-sm text-slate-700 dark:text-slate-300">
                                                            {lesson.teacher?.full_name || "Unknown"}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <Avatar
                                                            fallback={lesson.student?.full_name || "S"}
                                                            src={lesson.student?.avatar_url}
                                                            size="sm"
                                                        />
                                                        <span className="text-sm text-slate-700 dark:text-slate-300">
                                                            {lesson.student?.full_name || "Unknown"}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                                                    {formatDateTime(lesson.scheduled_at)}
                                                </td>
                                                <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="h-4 w-4" />
                                                        {lesson.duration_minutes} min
                                                    </div>
                                                </td>
                                                <td className="p-4 text-sm font-medium text-slate-900 dark:text-white">
                                                    {formatCurrency(lesson.price)}
                                                </td>
                                                <td className="p-4">
                                                    <Badge className={getStatusColor(lesson.status)}>
                                                        {lesson.status}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {filteredLessons.length === 0 && (
                                <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                                    <CalendarCheck className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p>No lessons found</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </DashboardLayout>
    );
}
