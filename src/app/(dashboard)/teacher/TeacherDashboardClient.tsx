"use client";

import { motion } from "framer-motion";
import {
    BookOpen,
    Clock,
    DollarSign,
    ArrowUpRight,
    Video,
    Star,
    Users,
    TrendingUp,
    CalendarCheck,
    AlertCircle,
    CheckCircle2,
    Zap,
    MessageSquare,
    Settings,
    X,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { ScheduleCalendar } from "@/components/ScheduleCalendar";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Avatar } from "@/components/ui";
import { formatCurrency, getDateTimeParts } from "@/lib/utils";
import { toast } from "sonner";
import { dismissApprovalNotification } from "@/lib/db";
import { useEffect } from "react";

interface LessonData {
    id: string;
    subject: string;
    scheduled_at: string;
    duration_minutes: number;
    status: string;
    zoom_link?: string;
    student?: {
        id: string;
        full_name: string;
        avatar_url?: string;
    };
}

interface ReviewData {
    id: string;
    rating: number;
    content?: string;
    created_at: string;
    student?: {
        id: string;
        full_name: string;
        avatar_url?: string;
    };
}

interface Stats {
    upcoming_lessons: number;
    total_lessons: number;
    total_students: number;
    total_earnings: number;
    average_rating: number;
}

interface UserData {
    id: string;
    email: string;
    full_name: string;
    avatar_url?: string;
    suspended?: boolean;
    suspended_reason?: string;
}

interface TeacherDashboardClientProps {
    user: UserData;
    stats: Stats;
    upcomingLessons: LessonData[];
    recentReviews: ReviewData[];
    profileComplete: boolean;
    detailsComplete: boolean;
    isApproved: boolean;
    showApprovalNotification: boolean;
    hasAvailability: boolean;
}

export default function TeacherDashboardClient({
    user,
    stats,
    upcomingLessons,
    recentReviews,
    profileComplete,
    detailsComplete,
    isApproved,
    showApprovalNotification,
    hasAvailability,
}: TeacherDashboardClientProps) {
    const [showWelcome, setShowWelcome] = useState(true);
    const [showAvailabilityWarning, setShowAvailabilityWarning] = useState(!hasAvailability);
    const userName = user?.full_name || "Teacher";
    const [dismissedNotification, setDismissedNotification] = useState(false);

    useEffect(() => {
        if (showApprovalNotification && !dismissedNotification) {
            toast.success("Congratulations! Your account is now verified.", {
                description: "Students can now find and book your lessons.",
                icon: <Zap className="h-5 w-5 text-amber-500" />,
                duration: 10000,
            });

            // Clear the flag in the database
            dismissApprovalNotification(user.id).catch(console.error);
            setDismissedNotification(true);
        }
    }, [showApprovalNotification, user.id, dismissedNotification]);

    // ... (keep generic stats display logic, but maybe override if suspended?)
    const statsDisplay = [
        // ... (same as before)
        {
            title: "Upcoming Lessons",
            value: stats.upcoming_lessons.toString(),
            icon: BookOpen,
            trend: stats.upcoming_lessons > 0 ? "Ready to teach" : "Set availability",
            gradient: "from-violet-500 to-purple-600",
            bgGradient: "from-violet-500/10 to-purple-600/10",
        },
        {
            title: "Total Students",
            value: stats.total_students.toString(),
            icon: Users,
            trend: "Active learners",
            gradient: "from-emerald-500 to-teal-600",
            bgGradient: "from-emerald-500/10 to-teal-600/10",
        },
        {
            title: "Total Earnings",
            value: formatCurrency(stats.total_earnings),
            icon: DollarSign,
            trend: "All time",
            gradient: "from-cyan-500 to-blue-600",
            bgGradient: "from-cyan-500/10 to-blue-600/10",
        },
        {
            title: "Average Rating",
            value: stats.average_rating > 0 ? stats.average_rating.toFixed(1) : "N/A",
            icon: Star,
            trend: `${stats.total_lessons} lessons`,
            gradient: "from-amber-500 to-orange-600",
            bgGradient: "from-amber-500/10 to-orange-600/10",
        },
    ];

    const quickActions = [
        { label: "Set Availability", href: "/teacher/availability", icon: CalendarCheck, color: "violet" },
        { label: "My Lessons", href: "/teacher/lessons", icon: BookOpen, color: "emerald" },
        { label: "Messages", href: "/teacher/messages", icon: MessageSquare, color: "amber" },
        { label: "Settings", href: "/teacher/settings", icon: Settings, color: "slate" },
    ];

    // Transform lessons for calendar
    const calendarLessons = upcomingLessons.reduce((acc: Record<string, Array<{ id: string; subject: string; teacher: string; time: string }>>, lesson) => {
        const dateKey = lesson.scheduled_at.split('T')[0];
        if (!acc[dateKey]) {
            acc[dateKey] = [];
        }
        acc[dateKey].push({
            id: lesson.id,
            subject: lesson.subject,
            teacher: lesson.student?.full_name || "Student",
            time: new Date(lesson.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        return acc;
    }, {});

    return (
        <div className="space-y-8">
            {/* Suspension Banner */}
            {user.suspended && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800 rounded-2xl p-6 shadow-sm"
                >
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-red-100 dark:bg-red-900/40 rounded-full">
                            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-red-700 dark:text-red-400">
                                Account Suspended
                            </h2>
                            <p className="text-red-600 dark:text-red-300 mt-1 max-w-2xl">
                                Your account has been suspended due to a violation of our terms.
                                Your profile is hidden, and you cannot accept new bookings.
                                Future lessons have been cancelled.
                            </p>
                            {user.suspended_reason && (
                                <div className="mt-4 p-4 bg-white/50 dark:bg-black/20 rounded-xl border border-red-100 dark:border-red-800/50 inline-block">
                                    <p className="text-sm font-semibold text-red-800 dark:text-red-300 uppercase tracking-wide text-xs mb-1">Reason for suspension</p>
                                    <p className="text-red-700 dark:text-red-300">
                                        &ldquo;{user.suspended_reason}&rdquo;
                                    </p>
                                </div>
                            )}
                            <div className="mt-4">
                                <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 dark:border-red-800 dark:text-red-400">
                                    Contact Support
                                </Button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* No Availability Warning */}
            {showAvailabilityWarning && profileComplete && isApproved && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 relative"
                >
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-full flex-shrink-0">
                            <CalendarCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-amber-800 dark:text-amber-300">
                                You&apos;re not visible to students
                            </h3>
                            <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                                You haven&apos;t set any availability slots yet. Students won&apos;t be able to find or book lessons with you until you set your availability.
                            </p>
                            <Button
                                asChild
                                size="sm"
                                className="mt-3 bg-amber-600 hover:bg-amber-700 text-white"
                            >
                                <Link href="/teacher/availability">Set Availability Now</Link>
                            </Button>
                        </div>
                        <button
                            onClick={() => setShowAvailabilityWarning(false)}
                            className="text-amber-400 hover:text-amber-600 dark:text-amber-500 dark:hover:text-amber-300 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Onboarding Status */}
            {(!profileComplete || !isApproved) && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-6"
                >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-amber-500" />
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                    Complete your setup
                                </h2>
                                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-0">
                                    Required
                                </Badge>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400">
                                Students can only find and book you once your profile is complete and approved.
                            </p>
                        </div>
                        <Button asChild className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/25">
                            <Link href="/teacher/profile">
                                Complete Profile
                            </Link>
                        </Button>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-4 mt-6">
                        <div className={`flex items-center gap-3 p-4 rounded-xl ${detailsComplete ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'} border`}>
                            {detailsComplete ? (
                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            ) : (
                                <div className="h-5 w-5 rounded-full border-2 border-slate-300 dark:border-slate-600" />
                            )}
                            <div className="text-sm">
                                <p className="font-medium text-slate-900 dark:text-white">Profile Details</p>
                                <p className="text-slate-500">Bio, Timezone, Languages</p>
                            </div>
                        </div>
                        <div className={`flex items-center gap-3 p-4 rounded-xl ${user.avatar_url ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'} border`}>
                            {user.avatar_url ? (
                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            ) : (
                                <div className="h-5 w-5 rounded-full border-2 border-slate-300 dark:border-slate-600" />
                            )}
                            <div className="text-sm">
                                <p className="font-medium text-slate-900 dark:text-white">Profile Picture</p>
                                <p className="text-slate-500">Add a professional photo</p>
                            </div>
                        </div>
                        <div className={`flex items-center gap-3 p-4 rounded-xl ${isApproved ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30' : 'bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/30'} border`}>
                            {isApproved ? (
                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            ) : (
                                <Clock className="h-5 w-5 text-violet-500 animate-pulse" />
                            )}
                            <div className="text-sm">
                                <p className="font-medium text-slate-900 dark:text-white">Admin Approval</p>
                                <p className="text-slate-500">
                                    {isApproved ? 'Approved!' : 'Pending review'}
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Welcome Banner */}
            {showWelcome && profileComplete && isApproved && (
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
                                <p className="text-white/80 text-sm">Here&apos;s what&apos;s happening with your tutoring business.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowWelcome(false)}
                            className="text-white/60 hover:text-white transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {quickActions.map((action, index) => (
                    <motion.div
                        key={action.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <Link
                            href={action.href}
                            className={`group flex flex-col items-center justify-center p-5 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 hover:border-${action.color}-300 dark:hover:border-${action.color}-500/30 transition-all hover:shadow-lg hover:-translate-y-1`}
                        >
                            <div className={`w-12 h-12 rounded-xl bg-${action.color}-100 dark:bg-${action.color}-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                                <action.icon className={`h-6 w-6 text-${action.color}-600 dark:text-${action.color}-400`} />
                            </div>
                            <span className="font-medium text-slate-900 dark:text-white text-sm">{action.label}</span>
                        </Link>
                    </motion.div>
                ))}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statsDisplay.map((stat, index) => (
                    <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                        <Card className={`relative overflow-hidden bg-gradient-to-br ${stat.bgGradient} border-0 shadow-lg`}>
                            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.gradient} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2`}></div>
                            <CardContent className="p-5 relative">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">{stat.title}</p>
                                        <p className={`text-3xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent mt-1`}>{stat.value}</p>
                                        <p className="text-xs text-slate-500 mt-1">{stat.trend}</p>
                                    </div>
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                                        <stat.icon className="h-5 w-5 text-white" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Upcoming Lessons */}
                <Card className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800">
                        <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                            <BookOpen className="h-5 w-5 text-violet-500" />
                            Upcoming Lessons
                        </CardTitle>
                        <Button variant="ghost" className="text-violet-600 hover:text-violet-700 hover:bg-violet-50 dark:hover:bg-slate-800" asChild>
                            <Link href="/teacher/lessons">View All</Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {upcomingLessons.length > 0 ? (
                            <div className="space-y-4">
                                {upcomingLessons.slice(0, 3).map((lesson) => {
                                    const { day, time } = getDateTimeParts(lesson.scheduled_at);
                                    return (
                                        <div key={lesson.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-500/30 transition-all group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex flex-col items-center justify-center text-white shadow-lg shadow-violet-500/25">
                                                    <span className="text-lg font-bold">{day}</span>
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-slate-900 dark:text-white">{lesson.subject}</h4>
                                                    <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 mt-1">
                                                        <Clock className="w-3.5 h-3.5 mr-1" />
                                                        {time} ({lesson.duration_minutes} min)
                                                    </div>
                                                    <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 mt-1">
                                                        <span className="font-medium mr-1">Student:</span> {lesson.student?.full_name || "Unknown"}
                                                    </div>
                                                </div>
                                            </div>
                                            {lesson.zoom_link && (
                                                <Button size="sm" className="bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/25" asChild>
                                                    <a href={lesson.zoom_link} target="_blank" rel="noopener noreferrer">
                                                        <Video className="w-4 h-4 mr-2" />
                                                        Join
                                                    </a>
                                                </Button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 rounded-full bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center mx-auto mb-4">
                                    <CalendarCheck className="w-8 h-8 text-violet-500" />
                                </div>
                                <p className="text-slate-600 dark:text-slate-400 mb-4">No upcoming lessons scheduled</p>
                                <Button className="bg-gradient-to-r from-violet-600 to-purple-600 text-white" asChild>
                                    <Link href="/teacher/availability">Set Your Availability</Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Reviews */}
                <Card className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800">
                        <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                            <Star className="h-5 w-5 text-amber-500" />
                            Recent Reviews
                        </CardTitle>
                        <Button variant="ghost" className="text-violet-600 hover:text-violet-700 hover:bg-violet-50 dark:hover:bg-slate-800" asChild>
                            <Link href="/teacher/reviews">View All</Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {recentReviews.length > 0 ? (
                            <div className="space-y-4">
                                {recentReviews.map((review) => (
                                    <div key={review.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <Avatar
                                                    fallback={review.student?.full_name || "Student"}
                                                    src={review.student?.avatar_url}
                                                    size="md"
                                                    className="border-2 border-white dark:border-slate-700 shadow-md"
                                                />
                                                <div>
                                                    <p className="font-medium text-slate-900 dark:text-white">{review.student?.full_name}</p>
                                                    <p className="text-xs text-slate-500">{new Date(review.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-500/20 dark:to-orange-500/20 px-3 py-1.5 rounded-full">
                                                <Star className="w-4 h-4 text-amber-500 fill-amber-500 mr-1" />
                                                <span className="text-sm font-bold text-amber-700 dark:text-amber-400">{review.rating}</span>
                                            </div>
                                        </div>
                                        {review.content && (
                                            <p className="text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed">&ldquo;{review.content}&rdquo;</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
                                    <Star className="w-8 h-8 text-amber-500" />
                                </div>
                                <p className="text-slate-600 dark:text-slate-400">No reviews yet</p>
                                <p className="text-sm text-slate-500 mt-1">Complete lessons to receive reviews</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
