"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Calendar, Clock, Video, Filter, Plus, Loader2, Check, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Avatar, Input } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";

interface Lesson {
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

interface UserData {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
}

interface TeacherLessonsClientProps {
    user: UserData;
    lessons: Lesson[];
}

const statusColors = {
    scheduled: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
    upcoming: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
    completed: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20",
    cancelled: "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
    pending: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
};

export default function TeacherLessonsClient({ user, lessons }: TeacherLessonsClientProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const router = useRouter();

    const userName = user?.full_name || "Teacher";
    const userEmail = user?.email;
    const userAvatar = user?.avatar_url;

    const filteredLessons = lessons.filter(lesson =>
        searchQuery === "" ||
        lesson.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lesson.student?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleStatusUpdate = async (lessonId: string, newStatus: string) => {
        setUpdatingId(lessonId);
        try {
            const res = await fetch('/api/bookings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lesson_id: lessonId, status: newStatus }),
            });

            if (!res.ok) throw new Error('Failed to update status');

            router.refresh();
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update lesson status");
        } finally {
            setUpdatingId(null);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Lessons</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">Manage your upcoming and past lessons</p>
                </div>
                <Button className="bg-emerald-600 text-white hover:bg-emerald-700" asChild>
                    <Link href="/teacher/availability">
                        <Plus className="h-4 w-4 mr-2" />
                        Set Availability
                    </Link>
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                        placeholder="Search lessons..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    />
                </div>
                <Button variant="outline" className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                </Button>
            </div>

            {/* Lessons List */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-slate-900 dark:text-white">All Lessons</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {filteredLessons.length > 0 ? (
                            <div className="space-y-4">
                                {filteredLessons.map((lesson) => {
                                    const isUpcoming = new Date(lesson.scheduled_at) > new Date() && lesson.status !== 'cancelled';
                                    const displayStatus = lesson.status || (isUpcoming ? 'upcoming' : 'completed');
                                    const isUpdating = updatingId === lesson.id;

                                    return (
                                        <div
                                            key={lesson.id}
                                            className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors gap-4"
                                        >
                                            <div className="flex items-center gap-4">
                                                <Avatar fallback={lesson.student?.full_name || "Student"} src={lesson.student?.avatar_url} size="lg" className="border-slate-200 dark:border-slate-700" />
                                                <div>
                                                    <p className="font-semibold text-slate-900 dark:text-white">{lesson.subject}</p>
                                                    <p className="text-sm text-slate-600 dark:text-slate-400">with {lesson.student?.full_name || "Student"}</p>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className={`text-xs px-2 py-1 rounded-full border ${statusColors[displayStatus as keyof typeof statusColors] || statusColors.upcoming}`}>
                                                            {displayStatus}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-right flex flex-row md:flex-col justify-between items-center md:items-end gap-x-4">
                                                <div>
                                                    <div className="flex items-center gap-1 text-sm text-slate-700 dark:text-slate-300 justify-end">
                                                        <Calendar className="h-4 w-4" />
                                                        {formatDateTime(lesson.scheduled_at)}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-sm text-slate-500 mt-1 justify-end">
                                                        <Clock className="h-4 w-4" />
                                                        {lesson.duration_minutes} min
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="mt-2 flex gap-2">
                                                    {lesson.status === "pending" && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-900/20"
                                                                onClick={() => handleStatusUpdate(lesson.id, 'cancelled')}
                                                                disabled={isUpdating}
                                                            >
                                                                {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3 mr-1" />}
                                                                Decline
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                className="bg-emerald-600 text-white hover:bg-emerald-700"
                                                                onClick={() => handleStatusUpdate(lesson.id, 'scheduled')}
                                                                disabled={isUpdating}
                                                            >
                                                                {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
                                                                Approve
                                                            </Button>
                                                        </>
                                                    )}

                                                    {isUpcoming && lesson.status === "scheduled" && lesson.zoom_link && (
                                                        <Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700" asChild>
                                                            <a href={lesson.zoom_link} target="_blank" rel="noopener noreferrer">
                                                                <Video className="h-3 w-3 mr-1" />
                                                                Join
                                                            </a>
                                                        </Button>
                                                    )}

                                                    {isUpcoming && lesson.status === "scheduled" && !lesson.zoom_link && (
                                                        <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                            Link pending
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <BookOpen className="h-12 w-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
                                <p className="text-slate-600 dark:text-slate-400">No lessons yet</p>
                                <p className="text-sm text-slate-500 mt-1">Lessons will appear here when students book with you</p>
                                <Button className="mt-4 bg-emerald-600 text-white hover:bg-emerald-700" asChild>
                                    <Link href="/teacher/availability">Set Your Availability</Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
