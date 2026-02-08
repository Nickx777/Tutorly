"use client";

import { useState } from "react";
import { Button, Card, CardContent, Badge } from "@/components/ui";
import { Calendar as CalendarIcon, Clock, Video, FileText, Star, Calendar, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { CustomCalendar } from "@/components/custom-calendar";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";
import { ReviewModal } from "@/components/ReviewModal";
import { PageTransition } from "@/components/ui/PageTransition";

interface Lesson {
    id: string;
    subject: string;
    scheduled_at: string;
    duration_minutes: number;
    status: string;
    zoom_link?: string;
    teacher?: {
        id: string;
        full_name: string;
        avatar_url?: string;
    };
}

interface MyLessonsClientProps {
    lessons: Lesson[];
}

export default function MyLessonsClient({ lessons }: MyLessonsClientProps) {
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [selectedLessonForReview, setSelectedLessonForReview] = useState<Lesson | null>(null);

    // Separate upcoming and past lessons
    const now = new Date();
    const upcomingLessons = lessons.filter(l => new Date(l.scheduled_at) >= now && l.status !== 'cancelled' && l.status !== 'rejected');
    const pastLessons = lessons.filter(l => new Date(l.scheduled_at) < now || l.status === 'completed' || l.status === 'rejected');

    // Create calendar events from lessons
    const calendarEvents = lessons.map(l => ({
        date: new Date(l.scheduled_at),
        title: l.subject
    }));

    return (
        <PageTransition>
            <div className="max-w-5xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">My Lessons</h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-2">Manage your schedule and learning history.</p>
                    </div>
                    <Button asChild className="bg-violet-600 hover:bg-violet-700 text-white">
                        <Link href="/browse">Book a Lesson</Link>
                    </Button>
                </div>

                <div className="grid gap-8">
                    {/* Upcoming */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-violet-500" />
                                Upcoming Sessions
                            </h2>
                        </div>

                        <div className="space-y-8">
                            {upcomingLessons.length > 0 ? (
                                <div className="grid md:grid-cols-2 gap-4">
                                    {upcomingLessons.map((lesson, idx) => (
                                        <motion.div
                                            key={lesson.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                        >
                                            <Card className="bg-slate-100 dark:bg-black/20 backdrop-blur-xl border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                                <CardContent className="p-6">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div>
                                                            <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-50">{lesson.subject}</h3>
                                                            <p className="text-slate-600 dark:text-slate-400">with {lesson.teacher?.full_name || "Teacher"}</p>
                                                        </div>
                                                        {lesson.status === 'pending' ? (
                                                            <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                                                                Pending Approval
                                                            </Badge>
                                                        ) : (
                                                            <Badge className="bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20">
                                                                Upcoming
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="space-y-2 mb-6">
                                                        <div className="flex items-center text-slate-600 dark:text-slate-400 text-sm">
                                                            <CalendarIcon className="h-4 w-4 mr-2 text-slate-500" />
                                                            {formatDateTime(lesson.scheduled_at)}
                                                        </div>
                                                        <div className="flex items-center text-slate-600 dark:text-slate-400 text-sm">
                                                            <Clock className="h-4 w-4 mr-2 text-slate-500" />
                                                            {lesson.duration_minutes} min
                                                        </div>
                                                    </div>
                                                    {lesson.zoom_link ? (
                                                        <Button className="w-full bg-violet-600 hover:bg-violet-700" asChild>
                                                            <a href={lesson.zoom_link} target="_blank" rel="noopener noreferrer">
                                                                <Video className="h-4 w-4 mr-2" />
                                                                Join Room
                                                            </a>
                                                        </Button>
                                                    ) : (
                                                        <Button className="w-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400" disabled>
                                                            {lesson.status === 'pending' ? 'Awaiting teacher approval' : 'Room link pending'}
                                                        </Button>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                                    <BookOpen className="h-12 w-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
                                    <p className="text-slate-600 dark:text-slate-400">No upcoming lessons</p>
                                    <Button className="mt-4 bg-violet-600 text-white hover:bg-violet-700" asChild>
                                        <Link href="/browse">Book a Lesson</Link>
                                    </Button>
                                </div>
                            )}

                            {/* Calendar View */}
                            <div className="w-full">
                                <CustomCalendar
                                    className="w-full max-w-none min-h-[500px]"
                                    events={calendarEvents}
                                />
                            </div>
                        </div>
                    </section>

                    {/* Past */}
                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-2">
                            <FileText className="h-5 w-5 text-slate-500" />
                            History
                        </h2>
                        {pastLessons.length > 0 ? (
                            <div className="space-y-4">
                                {pastLessons.map((lesson, idx) => (
                                    <motion.div
                                        key={lesson.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.2 + idx * 0.1 }}
                                    >
                                        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full">
                                                    <FileText className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-slate-900 dark:text-slate-50">{lesson.subject}</h4>
                                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                                        {lesson.teacher?.full_name || "Teacher"} • {formatDateTime(lesson.scheduled_at)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Badge className={
                                                    lesson.status === 'completed'
                                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                                                        : lesson.status === 'rejected'
                                                            ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                                                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                                                }>
                                                    {lesson.status === 'rejected' ? 'Declined' : (lesson.status || 'Completed')}
                                                </Badge>
                                                {lesson.status === 'completed' && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setSelectedLessonForReview(lesson);
                                                            setReviewModalOpen(true);
                                                        }}
                                                    >
                                                        <Star className="h-4 w-4 mr-2" />
                                                        Rate Teacher
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                                <FileText className="h-12 w-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
                                <p className="text-slate-600 dark:text-slate-400">No past lessons yet</p>
                            </div>
                        )}
                    </section>
                </div>
            </div>

            <ReviewModal
                isOpen={reviewModalOpen}
                onClose={() => setReviewModalOpen(false)}
                lessonId={selectedLessonForReview?.id || ""}
                teacherId={selectedLessonForReview?.teacher?.id || ""}
                teacherName={selectedLessonForReview?.teacher?.full_name || "Teacher"}
                subject={selectedLessonForReview?.subject || "Lesson"}
                onSuccess={() => {
                    setReviewModalOpen(false);
                }}
            />
        </PageTransition>
    );
}
