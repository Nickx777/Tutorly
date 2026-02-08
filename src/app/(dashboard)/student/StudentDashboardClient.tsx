"use client";

import { motion } from "framer-motion";
import {
    BookOpen,
    Clock,
    DollarSign,
    ArrowUpRight,
    Video,
    Star,
    Search,
    CalendarCheck,
    X,
    Sparkles,
    TrendingUp,
    Zap,
    GraduationCap,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ScheduleCalendar } from "@/components/ScheduleCalendar";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Avatar } from "@/components/ui";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface UserData {
    id: string;
    full_name: string;
    avatar_url?: string;
}

interface LessonData {
    id: string;
    subject: string;
    scheduled_at: string;
    duration_minutes: number;
    zoom_link?: string;
    teacher?: {
        id: string;
        full_name: string;
        avatar_url?: string;
    };
}

interface TeacherData {
    id: string;
    user_id: string;
    subjects: string[];
    hourly_rate: number;
    average_rating?: number;
    total_reviews?: number;
    user?: {
        id: string;
        full_name: string;
        avatar_url?: string;
    };
}

interface Stats {
    upcoming_lessons: number;
    total_lessons: number;
    total_spent: number;
}

interface StudentDashboardClientProps {
    user: UserData;
    stats: Stats;
    upcomingLessons: LessonData[];
    recommendedTutors: TeacherData[];
}

export default function StudentDashboardClient({
    user,
    stats,
    upcomingLessons,
    recommendedTutors,
}: StudentDashboardClientProps) {
    const [showBanner, setShowBanner] = useState(true);
    const userName = user?.full_name || "Student";

    const statsDisplay = [
        {
            title: "Upcoming Lessons",
            value: stats.upcoming_lessons.toString(),
            subtitle: stats.upcoming_lessons > 0 ? "Ready to learn" : "Book a lesson",
            icon: BookOpen,
            gradient: "from-violet-500 to-purple-600",
            bgGradient: "from-violet-500/10 to-purple-600/10",
        },
        {
            title: "Lessons Completed",
            value: stats.total_lessons.toString(),
            subtitle: "Keep going!",
            icon: GraduationCap,
            gradient: "from-emerald-500 to-teal-600",
            bgGradient: "from-emerald-500/10 to-teal-600/10",
        },
        {
            title: "Total Invested",
            value: formatCurrency(stats.total_spent),
            subtitle: "In your education",
            icon: TrendingUp,
            gradient: "from-amber-500 to-orange-600",
            bgGradient: "from-amber-500/10 to-orange-600/10",
        },
    ];

    const quickActions = [
        { label: "Find a Tutor", href: "/browse", icon: Search, color: "violet" },
        { label: "My Lessons", href: "/student/my-lessons", icon: CalendarCheck, color: "emerald" },
        { label: "Messages", href: "/student/messages", icon: Sparkles, color: "amber" },
    ];

    // Transform upcomingLessons into DayLessons format for the calendar
    const calendarLessons = upcomingLessons.reduce((acc: Record<string, Array<{ id: string; subject: string; teacher: string; time: string }>>, lesson) => {
        const dateKey = lesson.scheduled_at.split('T')[0];
        if (!acc[dateKey]) {
            acc[dateKey] = [];
        }
        acc[dateKey].push({
            id: lesson.id,
            subject: lesson.subject,
            teacher: lesson.teacher?.full_name || "Tutor",
            time: new Date(lesson.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        return acc;
    }, {});

    return (
        <div className="relative z-10 space-y-8">
            {/* Welcome Banner */}
            {showBanner && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl p-5 text-white relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHoiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIiBzdHJva2Utd2lkdGg9IjIiLz48L2c+PC9zdmc+')] opacity-30"></div>
                    <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                                <Zap className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Welcome back, {userName.split(' ')[0]}!</h3>
                                <p className="text-white/80 text-sm">Ready for your next learning adventure?</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowBanner(false)}
                            className="text-white/60 hover:text-white transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-4">
                {quickActions.map((action, index) => (
                    <motion.div
                        key={action.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <Link
                            href={action.href}
                            className={`group flex flex-col items-center justify-center p-6 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 hover:border-${action.color}-300 dark:hover:border-${action.color}-500/30 transition-all hover:shadow-lg hover:shadow-${action.color}-500/10 hover:-translate-y-1`}
                        >
                            <div className={`w-14 h-14 rounded-xl bg-${action.color}-100 dark:bg-${action.color}-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                                <action.icon className={`h-7 w-7 text-${action.color}-600 dark:text-${action.color}-400`} />
                            </div>
                            <span className="font-medium text-slate-900 dark:text-white text-sm">{action.label}</span>
                        </Link>
                    </motion.div>
                ))}
            </div>

            {/* Stats Grid */}
            <div className="grid sm:grid-cols-3 gap-6">
                {statsDisplay.map((stat, index) => (
                    <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                        <Card className={`relative overflow-hidden bg-gradient-to-br ${stat.bgGradient} border-0 shadow-lg`}>
                            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.gradient} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2`}></div>
                            <CardContent className="p-6 relative">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{stat.title}</p>
                                        <p className={`text-4xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent mt-2`}>{stat.value}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">{stat.subtitle}</p>
                                    </div>
                                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                                        <stat.icon className="h-7 w-7 text-white" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-2 gap-8">
                {/* Calendar Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                    className="flex flex-col"
                >
                    <Card className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 h-full">
                        <CardHeader className="border-b border-slate-100 dark:border-slate-800">
                            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                                <CalendarCheck className="h-5 w-5 text-violet-500" />
                                Your Schedule
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 min-h-[350px]">
                            <ScheduleCalendar lessons={calendarLessons} />
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Upcoming lessons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                >
                    <Card className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 h-full">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800">
                            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                                <BookOpen className="h-5 w-5 text-emerald-500" />
                                Upcoming Lessons
                            </CardTitle>
                            <Button variant="ghost" size="sm" asChild className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                                <Link href="/student/my-lessons">
                                    View all
                                    <ArrowUpRight className="h-4 w-4 ml-1" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {upcomingLessons.length > 0 ? (
                                <div className="space-y-4">
                                    {upcomingLessons.slice(0, 3).map((lesson) => (
                                        <div
                                            key={lesson.id}
                                            className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-500/30 transition-all group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <Avatar
                                                    fallback={lesson.teacher?.full_name || "Teacher"}
                                                    src={lesson.teacher?.avatar_url}
                                                    size="lg"
                                                    className="border-2 border-white dark:border-slate-700 shadow-md group-hover:scale-105 transition-transform"
                                                />
                                                <div>
                                                    <p className="font-semibold text-slate-900 dark:text-white">{lesson.subject}</p>
                                                    <p className="text-sm text-slate-600 dark:text-slate-400">with {lesson.teacher?.full_name || "Teacher"}</p>
                                                    <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                                                        <Clock className="h-4 w-4" />
                                                        {lesson.duration_minutes} min
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                    {formatDateTime(lesson.scheduled_at)}
                                                </p>
                                                {lesson.zoom_link ? (
                                                    <Button size="sm" className="mt-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/25" asChild>
                                                        <a href={lesson.zoom_link} target="_blank" rel="noopener noreferrer">
                                                            <Video className="h-4 w-4 mr-1" />
                                                            Join
                                                        </a>
                                                    </Button>
                                                ) : (
                                                    <Badge variant="secondary" className="mt-2">Pending link</Badge>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 rounded-full bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center mx-auto mb-4">
                                        <BookOpen className="h-8 w-8 text-violet-500" />
                                    </div>
                                    <p className="text-slate-600 dark:text-slate-400 mb-4">No upcoming lessons</p>
                                    <Button className="bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700" asChild>
                                        <Link href="/browse">Book Your First Lesson</Link>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Recommended tutors */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
            >
                <Card className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800">
                        <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                            <Sparkles className="h-5 w-5 text-amber-500" />
                            Recommended Tutors
                        </CardTitle>
                        <Button variant="ghost" size="sm" asChild className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                            <Link href="/browse">
                                Browse all
                                <ArrowUpRight className="h-4 w-4 ml-1" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {recommendedTutors.length > 0 ? (
                            <div className="grid md:grid-cols-3 gap-4">
                                {recommendedTutors.map((tutor) => (
                                    <Link
                                        key={tutor.id}
                                        href={`/teachers/${tutor.user_id}`}
                                        className="group p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-500/30 transition-all hover:shadow-lg hover:-translate-y-1"
                                    >
                                        <div className="flex flex-col items-center text-center">
                                            <Avatar
                                                fallback={tutor.user?.full_name || "Tutor"}
                                                src={tutor.user?.avatar_url}
                                                size="xl"
                                                className="border-4 border-white dark:border-slate-700 shadow-lg mb-4 group-hover:scale-105 transition-transform"
                                            />
                                            <p className="font-semibold text-slate-900 dark:text-white">{tutor.user?.full_name || "Tutor"}</p>
                                            <div className="flex flex-wrap justify-center gap-1 mt-2">
                                                {tutor.subjects.slice(0, 2).map((subject) => (
                                                    <Badge key={subject} variant="secondary" className="bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 border-0 text-xs">
                                                        {subject}
                                                    </Badge>
                                                ))}
                                            </div>
                                            <div className="flex items-center gap-1 mt-3">
                                                <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                                                <span className="font-medium text-slate-800 dark:text-slate-200">{tutor.average_rating || "N/A"}</span>
                                                <span className="text-slate-500 text-sm">({tutor.total_reviews || 0})</span>
                                            </div>
                                            <p className="text-xl font-bold text-slate-900 dark:text-white mt-3">
                                                ${tutor.hourly_rate}<span className="text-sm font-normal text-slate-500">/hr</span>
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Search className="h-12 w-12 text-slate-400 dark:text-slate-700 mx-auto mb-3" />
                                <p className="text-slate-600 dark:text-slate-500">No tutors available yet</p>
                                <Button className="mt-4" variant="outline" asChild>
                                    <Link href="/browse">Browse All Tutors</Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
