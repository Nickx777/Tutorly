"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { use } from "react";
import {
    Star,
    Clock,
    Globe,
    Calendar,
    Video,
    MessageSquare,
    CheckCircle,
    Heart,
    Share2,
    ChevronLeft,
    Loader2,
    User,
    Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent, Badge, Avatar } from "@/components/ui";
import { Navbar, Footer } from "@/components/landing";
import { formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { getTeacherByUserId, getTeacherProfileById, getDateAvailability, getReviewsForTeacher, getTeacherRatingStats, browseTeachers, getTeacherPackages, getAllLessons } from "@/lib/db";
import { TeacherPackage } from "@/types/database";

interface TeacherData {
    id: string;
    user_id: string;
    bio: string;
    title: string;
    subjects: string[];
    languages: string[];
    hourly_rate: number;
    group_rate: number | null;
    timezone: string;
    location: string;
    user?: {
        id: string;
        full_name: string;
        avatar_url: string | null;
        email: string;
    };
    packages?: TeacherPackage[];
}

interface ReviewData {
    id: string;
    rating: number;
    content: string;
    subject: string;
    created_at: string;
    student?: {
        id: string;
        full_name: string;
        avatar_url: string | null;
    };
}

interface AvailabilitySlot {
    id: string;
    available_date: string;
    start_time: string;
    end_time: string;
    lesson_type: "one_on_one" | "group";
    max_students: number;
}

interface ExistingLesson {
    scheduled_at: string;
    duration_minutes: number;
    lesson_type?: "one_on_one" | "group";
}

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function TeacherProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [teacher, setTeacher] = useState<TeacherData | null>(null);
    const [reviews, setReviews] = useState<ReviewData[]>([]);
    const [ratingStats, setRatingStats] = useState({ average: 0, total: 0 });
    const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
    const [existingLessons, setExistingLessons] = useState<ExistingLesson[]>([]);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [selectedEndTime, setSelectedEndTime] = useState<string | null>(null);
    const [selectedSessionType, setSelectedSessionType] = useState<"one_on_one" | "group">("one_on_one");
    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<{ id: string } | null>(null);
    const [currentCalendarMonth, setCurrentCalendarMonth] = useState(new Date());

    const supabase = createClient();

    useEffect(() => {
        let isMounted = true;

        async function loadTeacher() {
            if (!id) return;

            try {
                // Get current user
                const { data: { user: authUser } } = await supabase.auth.getUser();
                if (!isMounted) return;
                setUser(authUser);

                // Try loading by user_id first (most common case)
                let teacherData = await getTeacherByUserId(id);
                if (!isMounted) return;

                // If not found, try loading by profile id
                if (!teacherData) {
                    try {
                        teacherData = await getTeacherProfileById(id);
                    } catch (e) {
                        // Ignore error
                    }
                }

                if (!isMounted) return;

                if (!teacherData) {
                    setError("Teacher not found");
                    setLoading(false);
                    return;
                }

                setTeacher(teacherData);

                try {
                    const startDate = new Date();
                    const endDate = new Date();
                    endDate.setDate(endDate.getDate() + 14); // Fetch 2 weeks out just in case

                    const [avail, reviewsData, stats, lessons] = await Promise.all([
                        getDateAvailability(teacherData.id, startDate.toISOString().split('T')[0]),
                        getReviewsForTeacher(teacherData.user_id),
                        getTeacherRatingStats(teacherData.user_id),
                        getAllLessons({
                            teacherId: teacherData.user_id,
                            startDate: startDate.toISOString(),
                            endDate: endDate.toISOString(),
                            status: "scheduled"
                        })
                    ]);

                    if (!isMounted) return;

                    setAvailability(avail);
                    setReviews(reviewsData);
                    setRatingStats({ average: stats.average, total: stats.total });
                    setExistingLessons(lessons);

                    // Fetch packages if not already in teacherData
                    if (!teacherData.packages) {
                        const pkgs = await getTeacherPackages(teacherData.user_id);
                        if (isMounted) {
                            setTeacher(prev => prev ? { ...prev, packages: pkgs } : null);
                        }
                    }
                } catch (dataErr) {
                    console.error("Error loading supplementary data:", dataErr);
                }
            } catch (err) {
                console.error("Error loading teacher:", err);
                if (isMounted) setError("Failed to load teacher profile");
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        setLoading(true);
        loadTeacher();

        return () => {
            isMounted = false;
        };
    }, [id]);

    // Calendar navigation for booking
    const prevMonth = () => {
        const d = new Date(currentCalendarMonth);
        d.setMonth(d.getMonth() - 1);
        setCurrentCalendarMonth(d);
    };

    const nextMonth = () => {
        const d = new Date(currentCalendarMonth);
        d.setMonth(d.getMonth() + 1);
        setCurrentCalendarMonth(d);
    };

    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const calendarYear = currentCalendarMonth.getFullYear();
    const calendarMonth = currentCalendarMonth.getMonth();
    const daysInMonth = getDaysInMonth(calendarYear, calendarMonth);
    const firstDay = getFirstDayOfMonth(calendarYear, calendarMonth);

    const calendarDays = [];
    for (let i = 0; i < firstDay; i++) calendarDays.push(null);
    for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    // Generate dates for the next 30 days
    const dates = [...Array(30)].map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() + i);
        return date;
    });

    // Get available time slots for selected date
    const getAvailableSlotsForDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        const daySlots = availability.filter(a => a.available_date === dateStr);

        const slots: { time: string; endTime: string; sessionType: string; maxStudents?: number }[] = [];
        daySlots.forEach(slot => {
            const slotStart = new Date(date);
            const [h, m] = slot.start_time.split(':');
            slotStart.setHours(parseInt(h), parseInt(m), 0, 0);

            // Check for conflicts
            const overlapping = existingLessons.filter(l => {
                const lStart = new Date(l.scheduled_at);
                return Math.abs(lStart.getTime() - slotStart.getTime()) < 60000;
            });

            const maxStudents = slot.max_students || 1;
            let isFull = false;
            let currentStudents = 0;

            if (slot.lesson_type === 'group') {
                const groupLessons = overlapping.filter(l => l.lesson_type === 'group');
                currentStudents = groupLessons.length;
                const oneOnOne = overlapping.some(l => l.lesson_type !== 'group');
                if (oneOnOne || currentStudents >= maxStudents) isFull = true;
            } else {
                if (overlapping.length > 0) isFull = true;
            }

            if (!isFull) {
                slots.push({
                    time: slot.start_time.substring(0, 5),
                    endTime: slot.end_time.substring(0, 5),
                    sessionType: slot.lesson_type || "one_on_one",
                    maxStudents: slot.max_students
                });
            }
        });
        return slots.sort((a, b) => a.time.localeCompare(b.time));
    };


    const handleBooking = async () => {
        if (!user || !teacher || !selectedDate || !selectedTime || !selectedEndTime) {
            setError("Please select a date and time");
            return;
        }

        const params = new URLSearchParams({
            teacher: teacher.user_id,
            date: selectedDate,
            time: selectedTime,
            endTime: selectedEndTime,
            subject: teacher.subjects[0] || "General Tutoring",
            lessonType: selectedSessionType,
        });

        router.push(`/checkout?${params.toString()}`);
    };

    const handlePackageBooking = (pkg: TeacherPackage) => {
        if (!user || !teacher) {
            router.push("/login");
            return;
        }

        const params = new URLSearchParams({
            teacher: teacher.user_id,
            packageId: pkg.id,
            subject: teacher.subjects[0] || "General Tutoring",
        });

        router.push(`/checkout?${params.toString()}`);
    };

    if (loading) {
        return (
            <main>
                <Navbar />
                <div className="pt-28 pb-16 min-h-screen bg-slate-50 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
                </div>
                <Footer />
            </main>
        );
    }

    if (error && !teacher) {
        return (
            <main>
                <Navbar />
                <div className="pt-28 pb-16 min-h-screen bg-slate-50 flex items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">Teacher Not Found</h1>
                        <p className="text-slate-600 mb-4">{error}</p>
                        <Link href="/browse">
                            <Button>Browse Teachers</Button>
                        </Link>
                    </div>
                </div>
                <Footer />
            </main>
        );
    }

    if (!teacher) return null;

    const selectedDateSlots = selectedDate
        ? getAvailableSlotsForDate(new Date(selectedDate + "T00:00:00")) // Append time to force date parsing
        : [];

    return (
        <main>
            <Navbar />

            <div className="pt-28 pb-16 min-h-screen bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Back button */}
                    <Link
                        href="/browse"
                        className="inline-flex items-center text-sm text-slate-600 hover:text-violet-600 mb-6"
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Back to search
                    </Link>

                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Main content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Profile header */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Card>
                                    <CardContent className="p-8">
                                        <div className="flex flex-col sm:flex-row gap-6">
                                            <Avatar
                                                fallback={teacher.user?.full_name || "Teacher"}
                                                src={teacher.user?.avatar_url || undefined}
                                                size="xl"
                                                className="w-24 h-24"
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h1 className="text-2xl font-bold text-slate-900">
                                                                {teacher.user?.full_name || "Teacher"}
                                                            </h1>
                                                            <CheckCircle className="h-5 w-5 text-emerald-500 fill-emerald-100" />
                                                        </div>
                                                        <p className="text-slate-600 mt-1">{teacher.title || "Tutor"}</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button variant="ghost" size="icon">
                                                            <Heart className="h-5 w-5" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon">
                                                            <Share2 className="h-5 w-5" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-2 mt-4">
                                                    {teacher.subjects.map((subject) => (
                                                        <Badge key={subject} variant="secondary">
                                                            {subject}
                                                        </Badge>
                                                    ))}
                                                </div>

                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                                                    <div className="text-center p-3 rounded-xl bg-slate-50">
                                                        <div className="flex items-center justify-center gap-1 text-amber-500 mb-1">
                                                            <Star className="h-4 w-4 fill-current" />
                                                            <span className="font-bold">{ratingStats.average || "N/A"}</span>
                                                        </div>
                                                        <p className="text-xs text-slate-500">{ratingStats.total} reviews</p>
                                                    </div>
                                                    <div className="text-center p-3 rounded-xl bg-slate-50">
                                                        <p className="font-bold text-slate-900">${teacher.hourly_rate}</p>
                                                        <p className="text-xs text-slate-500">per hour</p>
                                                    </div>
                                                    <div className="text-center p-3 rounded-xl bg-slate-50">
                                                        <p className="font-bold text-slate-900">{teacher.languages.length}</p>
                                                        <p className="text-xs text-slate-500">Languages</p>
                                                    </div>
                                                    <div className="text-center p-3 rounded-xl bg-slate-50">
                                                        <p className="font-bold text-slate-900">{availability.length}</p>
                                                        <p className="text-xs text-slate-500">Time slots</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* About */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: 0.1 }}
                            >
                                <Card>
                                    <CardContent className="p-8">
                                        <h2 className="text-lg font-bold text-slate-900 mb-4">About Me</h2>
                                        <div className="prose prose-slate max-w-none">
                                            <p className="text-slate-600 whitespace-pre-wrap">
                                                {teacher.bio || "No bio available."}
                                            </p>
                                        </div>

                                        <div className="grid sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-violet-100">
                                                    <Globe className="h-5 w-5 text-violet-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-slate-500">Languages</p>
                                                    <p className="font-medium text-slate-900">
                                                        {teacher.languages.join(", ") || "Not specified"}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-violet-100">
                                                    <Clock className="h-5 w-5 text-violet-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-slate-500">Timezone</p>
                                                    <p className="font-medium text-slate-900">{teacher.timezone || "UTC"}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Reviews */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: 0.2 }}
                            >
                                <Card>
                                    <CardContent className="p-8">
                                        <div className="flex items-center justify-between mb-6">
                                            <h2 className="text-lg font-bold text-slate-900">
                                                Reviews ({ratingStats.total})
                                            </h2>
                                            {ratingStats.total > 0 && (
                                                <div className="flex items-center gap-1">
                                                    <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                                                    <span className="font-bold text-slate-900">{ratingStats.average}</span>
                                                    <span className="text-slate-500">average</span>
                                                </div>
                                            )}
                                        </div>

                                        {reviews.length > 0 ? (
                                            <div className="space-y-6">
                                                {reviews.slice(0, 5).map((review) => (
                                                    <div key={review.id} className="pb-6 border-b border-slate-100 last:border-0 last:pb-0">
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div className="flex items-center gap-3">
                                                                <Avatar
                                                                    fallback={review.student?.full_name || "Student"}
                                                                    src={review.student?.avatar_url || undefined}
                                                                    size="sm"
                                                                />
                                                                <div>
                                                                    <p className="font-medium text-slate-900">
                                                                        {review.student?.full_name || "Student"}
                                                                    </p>
                                                                    <p className="text-sm text-slate-500">
                                                                        {review.subject} • {formatDate(review.created_at)}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-0.5">
                                                                {[...Array(review.rating)].map((_, i) => (
                                                                    <Star key={i} className="h-4 w-4 text-amber-400 fill-amber-400" />
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <p className="text-slate-600">{review.content}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-slate-500 text-center py-8">No reviews yet</p>
                                        )}

                                        {reviews.length > 5 && (
                                            <Button variant="outline" className="w-full mt-6">
                                                View all {ratingStats.total} reviews
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>

                        {/* Booking sidebar */}
                        <div className="lg:col-span-1">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: 0.3 }}
                                className="sticky top-28"
                            >
                                <Card>
                                    <CardContent className="p-6">
                                        {/* Success message */}
                                        {bookingSuccess && (
                                            <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                                                <p className="text-emerald-700 font-medium">🎉 Lesson booked successfully!</p>
                                                <p className="text-emerald-600 text-sm mt-1">Check your dashboard for details.</p>
                                            </div>
                                        )}

                                        {/* Error message */}
                                        {error && (
                                            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                                <p className="text-red-700 text-sm">{error}</p>
                                            </div>
                                        )}

                                        <div className="flex items-baseline justify-between mb-6">
                                            <div className="space-y-1">
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-3xl font-bold text-slate-900">
                                                        ${selectedSessionType === "group" && teacher.group_rate ? teacher.group_rate : teacher.hourly_rate}
                                                    </span>
                                                    <span className="text-slate-500">/hr</span>
                                                </div>
                                                {selectedSessionType === "group" && teacher.group_rate && teacher.group_rate < teacher.hourly_rate && (
                                                    <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-100 flex items-center gap-1 w-fit">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                        Save ${teacher.hourly_rate - teacher.group_rate} compared to 1-on-1
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        {/* Date selection - Monthly Calendar */}
                                        <div className="mb-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="font-semibold text-slate-900">Select a date</h3>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-slate-600 mr-2">
                                                        {monthNames[calendarMonth]} {calendarYear}
                                                    </span>
                                                    <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8">
                                                        <ChevronLeft className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8">
                                                        <ChevronLeft className="h-4 w-4 rotate-180" />
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-7 gap-1 mb-2">
                                                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                                                    <div key={i} className="text-center text-[10px] font-bold text-slate-400 py-1">{d}</div>
                                                ))}
                                            </div>

                                            <div className="grid grid-cols-7 gap-1">
                                                {calendarDays.map((day, i) => {
                                                    if (day === null) return <div key={`empty-${i}`} className="aspect-square" />;

                                                    const date = new Date(calendarYear, calendarMonth, day);
                                                    const year = date.getFullYear();
                                                    const month = String(date.getMonth() + 1).padStart(2, '0');
                                                    const dayStr = String(date.getDate()).padStart(2, '0');
                                                    const dateStr = `${year}-${month}-${dayStr}`;

                                                    const isSelected = selectedDate === dateStr;
                                                    const hasSlots = getAvailableSlotsForDate(date).length > 0;
                                                    const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));

                                                    return (
                                                        <button
                                                            key={i}
                                                            onClick={() => {
                                                                if (!isPast && hasSlots) {
                                                                    setSelectedDate(dateStr);
                                                                    setSelectedTime(null);
                                                                }
                                                            }}
                                                            disabled={isPast || !hasSlots}
                                                            className={`aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-all relative ${isSelected
                                                                ? "bg-violet-600 text-white shadow-md z-10"
                                                                : isPast
                                                                    ? "text-slate-200 cursor-not-allowed"
                                                                    : hasSlots
                                                                        ? "bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200"
                                                                        : "bg-slate-50 text-slate-300 cursor-not-allowed"
                                                                }`}
                                                        >
                                                            <span className="font-semibold">{day}</span>
                                                            {hasSlots && !isPast && (
                                                                <span className={`w-1 h-1 rounded-full mt-1 ${isSelected ? "bg-white" : "bg-violet-500"}`} />
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Lesson Type Selection */}
                                        {selectedDate && (
                                            <div className="mb-6">
                                                <h3 className="font-semibold text-slate-900 mb-3">Select lesson type</h3>
                                                {(() => {
                                                    // Get unique lesson types available for selected date
                                                    const availableTypes = [...new Set(selectedDateSlots.map(s => s.sessionType))];

                                                    if (availableTypes.length === 0) {
                                                        return <p className="text-slate-500 text-sm">No lessons available on this date</p>;
                                                    }

                                                    const isSingleType = availableTypes.length === 1;

                                                    return (
                                                        <div className={`grid gap-3 ${isSingleType ? "grid-cols-1" : "grid-cols-2"}`}>
                                                            {availableTypes.includes("one_on_one") && (
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedSessionType("one_on_one");
                                                                        setSelectedTime(null);
                                                                    }}
                                                                    className={`p-4 rounded-xl text-center transition-all border-2 ${selectedSessionType === "one_on_one"
                                                                        ? "border-violet-600 bg-violet-50 text-violet-900"
                                                                        : "border-slate-200 bg-white hover:border-slate-300 text-slate-900"
                                                                        } ${isSingleType ? "flex items-center justify-center gap-4 py-6" : ""}`}
                                                                >
                                                                    <User className={`${isSingleType ? "h-6 w-6" : "h-6 w-6 mx-auto mb-2"}`} />
                                                                    <div>
                                                                        <p className="font-semibold text-base">1-on-1</p>
                                                                        <p className="text-xs text-slate-500">Private lesson</p>
                                                                    </div>
                                                                </button>
                                                            )}
                                                            {availableTypes.includes("group") && (
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedSessionType("group");
                                                                        setSelectedTime(null);
                                                                    }}
                                                                    className={`p-4 rounded-xl text-center transition-all border-2 ${selectedSessionType === "group"
                                                                        ? "border-blue-600 bg-blue-50 text-blue-900"
                                                                        : "border-slate-200 bg-white hover:border-slate-300 text-slate-900"
                                                                        } ${isSingleType ? "flex items-center justify-center gap-4 py-6" : ""}`}
                                                                >
                                                                    <Users className={`${isSingleType ? "h-6 w-6" : "h-6 w-6 mx-auto mb-2"}`} />
                                                                    <div>
                                                                        <p className="font-semibold text-base">Group</p>
                                                                        <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                                                            {teacher.group_rate && teacher.hourly_rate > 0
                                                                                ? `Save ${Math.round((1 - (teacher.group_rate / teacher.hourly_rate)) * 100)}%`
                                                                                : `$${teacher.group_rate}/hr`
                                                                            }
                                                                        </p>
                                                                        {(() => {
                                                                            const maxStudents = Math.max(...selectedDateSlots.filter(s => s.sessionType === "group").map(s => s.maxStudents || 0));
                                                                            return maxStudents > 0 && (
                                                                                <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider">
                                                                                    Up to {maxStudents} attending
                                                                                </p>
                                                                            );
                                                                        })()}
                                                                    </div>
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        )}

                                        {/* Time slots (filtered by lesson type) */}
                                        {selectedDate && selectedSessionType && (
                                            <div className="mb-6">
                                                <h3 className="font-semibold text-slate-900 mb-3">Select a time</h3>
                                                {(() => {
                                                    const filteredSlots = selectedDateSlots.filter(s => s.sessionType === selectedSessionType);

                                                    if (filteredSlots.length === 0) {
                                                        return <p className="text-slate-500 text-sm">No {selectedSessionType === "group" ? "group" : "1-on-1"} slots on this date</p>;
                                                    }

                                                    return (
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {filteredSlots.map((slot) => (
                                                                <button
                                                                    key={slot.time}
                                                                    onClick={() => {
                                                                        setSelectedTime(slot.time);
                                                                        setSelectedEndTime(slot.endTime);
                                                                    }}
                                                                    className={`p-3 rounded-lg text-sm font-medium transition-all ${selectedTime === slot.time
                                                                        ? "bg-violet-600 text-white"
                                                                        : "bg-slate-50 hover:bg-slate-100 text-slate-900"
                                                                        }`}
                                                                >
                                                                    {slot.time} - {slot.endTime}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        )}

                                        {user ? (
                                            <Button
                                                className="w-full"
                                                size="lg"
                                                disabled={!selectedDate || !selectedTime || booking}
                                                onClick={handleBooking}
                                            >
                                                {booking ? (
                                                    <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Booking...</>
                                                ) : (
                                                    <><Calendar className="h-5 w-5 mr-2" /> Book Lesson</>
                                                )}
                                            </Button>
                                        ) : (
                                            <Link href="/login">
                                                <Button className="w-full" size="lg">
                                                    Login to Book
                                                </Button>
                                            </Link>
                                        )}

                                        <Link href={`/student/messages?message=${teacher.user_id}`}>
                                            <Button variant="outline" className="w-full mt-3">
                                                <MessageSquare className="h-5 w-5 mr-2" />
                                                Message Teacher
                                            </Button>
                                        </Link>

                                        <p className="text-center text-sm text-slate-500 mt-4">
                                            Free cancellation up to 24 hours before
                                        </p>
                                    </CardContent>
                                </Card>

                                {/* Package options */}
                                {teacher.packages && teacher.packages.length > 0 && (
                                    <div className="mt-6 space-y-4">
                                        <h3 className="font-bold text-slate-900">💰 Specialized Packages</h3>
                                        <div className="grid gap-3">
                                            {teacher.packages.map((pkg) => (
                                                <Card key={pkg.id} className="border-violet-100 bg-violet-50/50 hover:border-violet-300 transition-colors">
                                                    <CardContent className="p-4">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <h4 className="font-bold text-slate-900">{pkg.name}</h4>
                                                                <p className="text-xs text-slate-500">{pkg.lesson_count} lessons</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="font-bold text-violet-600">${pkg.price}</p>
                                                                <p className="text-[10px] text-slate-400">${(pkg.price / pkg.lesson_count).toFixed(2)}/lesson</p>
                                                            </div>
                                                        </div>
                                                        {pkg.description && (
                                                            <p className="text-xs text-slate-600 mb-3">{pkg.description}</p>
                                                        )}
                                                        <Button
                                                            variant="outline"
                                                            className="w-full h-8 text-xs border-violet-200 text-violet-700 hover:bg-violet-100"
                                                            onClick={() => handlePackageBooking(pkg)}
                                                        >
                                                            Select Package
                                                        </Button>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    );
}
