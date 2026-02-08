"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    Calendar,
    Clock,
    User,
    DollarSign,
    CreditCard,
    CheckCircle,
    ArrowLeft,
    Loader2,
    Users,
    UserCheck,
} from "lucide-react";
import Link from "next/link";
import { Button, Card, CardContent, Badge, Avatar } from "@/components/ui";
import { Navbar, Footer } from "@/components/landing";
import { createClient } from "@/lib/supabase/client";
import { getTeacherByUserId, getTeacherPackages } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import { TeacherPackage } from "@/types/database";

interface TeacherData {
    id: string;
    user_id: string;
    bio: string;
    title: string;
    subjects: string[];
    hourly_rate: number;
    group_rate: number | null;
    user?: {
        id: string;
        full_name: string;
        avatar_url: string | null;
    };
    packages?: TeacherPackage[];
}

function CheckoutContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const teacherId = searchParams.get("teacher");
    const date = searchParams.get("date");
    const time = searchParams.get("time");
    const endTime = searchParams.get("endTime");
    const subject = searchParams.get("subject");
    const lessonType = (searchParams.get("lessonType") || "one-on-one") as "one-on-one" | "group";
    const packageId = searchParams.get("packageId");

    const [teacher, setTeacher] = useState<TeacherData | null>(null);
    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState(false);
    const [success, setSuccess] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<{ id: string } | null>(null);
    const [selectedPackage, setSelectedPackage] = useState<TeacherPackage | null>(null);
    const [mounted, setMounted] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        async function loadData() {
            if (!teacherId) {
                setError("Missing teacher information");
                setLoading(false);
                return;
            }

            try {
                // Get current user
                const { data: { user } } = await supabase.auth.getUser();
                setUser(user);

                if (!user) {
                    setLoading(false);
                    router.push(`/login?redirect=/checkout?teacher=${teacherId}&date=${date}&time=${time}`);
                    return;
                }

                // Load teacher data
                const teacherData = await getTeacherByUserId(teacherId);
                if (teacherData) {
                    setTeacher(teacherData as TeacherData);

                    // If packageId is provided, fetch packages and find the selected one
                    if (packageId) {
                        const pkgs = await getTeacherPackages(teacherId);
                        const pkg = pkgs.find((p: TeacherPackage) => p.id === packageId);
                        if (pkg) {
                            setSelectedPackage(pkg);
                        } else {
                            setError("Selected package not found");
                        }
                    }
                } else {
                    setError("Teacher not found");
                }
            } catch (err) {
                console.error("Error loading checkout data:", err);
                setError("Failed to load booking details");
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [teacherId, date, time, supabase, router]);

    const handleConfirmBooking = async () => {
        if (!user || !teacher || !date || !time) {
            setError("Missing booking information");
            return;
        }

        setBooking(true);
        setError(null);

        try {
            const scheduledAt = new Date(`${date}T${time}:00`);

            // Calculate duration in minutes
            let durationMinutes = 60;
            if (time && endTime) {
                const [startH, startM] = time.split(":").map(Number);
                const [endH, endM] = endTime.split(":").map(Number);
                durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
            }

            // Calculate price
            const hourlyRate = lessonType === "group" && teacher.group_rate
                ? teacher.group_rate
                : teacher.hourly_rate;

            const totalHours = durationMinutes / 60;
            const totalPrice = selectedPackage ? selectedPackage.price : (totalHours * hourlyRate);

            const response = await fetch("/api/bookings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    teacher_id: teacher.user_id,
                    subject: subject || teacher.subjects[0] || "General Tutoring",
                    scheduled_at: scheduledAt.toISOString(),
                    duration_minutes: durationMinutes,
                    price: totalPrice,
                    package_id: packageId || null,
                    lesson_type: lessonType === "group" ? "group" : "one_on_one",
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to book lesson");
            }

            // Check if booking is pending teacher approval
            setIsPending(!result.autoAccept);
            setSuccess(true);
        } catch (err: any) {
            console.error("Booking error:", err);
            setError(err.message || "Failed to complete booking");
        } finally {
            setBooking(false);
        }
    };

    if (loading) {
        return (
            <div className="pt-28 pb-16 min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
            </div>
        );
    }

    if (success) {
        return (
            <div className="pt-28 pb-16 min-h-screen bg-slate-50 dark:bg-slate-950">
                <div className="max-w-lg mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Card className="text-center">
                            <CardContent className="p-8">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${isPending
                                    ? "bg-amber-100 dark:bg-amber-500/20"
                                    : "bg-emerald-100 dark:bg-emerald-500/20"
                                    }`}>
                                    {isPending ? (
                                        <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                                    ) : (
                                        <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                                    )}
                                </div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                                    {isPending ? "Booking Request Sent! ⏳" : "Booking Confirmed! 🎉"}
                                </h1>
                                <p className="text-slate-600 dark:text-slate-400 mb-6">
                                    {isPending ? (
                                        <>Your lesson request with <strong>{teacher?.user?.full_name}</strong> has been sent. Please wait for the teacher to accept your booking.</>
                                    ) : (
                                        <>Your lesson with <strong>{teacher?.user?.full_name}</strong> has been booked successfully.</>
                                    )}
                                </p>

                                {isPending && (
                                    <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl p-4 mb-6 text-left">
                                        <p className="text-sm text-amber-700 dark:text-amber-400">
                                            <strong>Pending Approval:</strong> The teacher will review your request and confirm the lesson. You'll receive a notification once it's approved.
                                        </p>
                                    </div>
                                )}

                                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-6 text-left">
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-2">
                                        <Calendar className="h-4 w-4" />
                                        {mounted && date && new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                        <Clock className="h-4 w-4" />
                                        {time}
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Button variant="outline" className="flex-1" asChild>
                                        <Link href="/student/my-lessons">View My Lessons</Link>
                                    </Button>
                                    <Button className="flex-1 bg-violet-600 hover:bg-violet-700" asChild>
                                        <Link href="/browse">Find More Tutors</Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>
        );
    }

    if (error && !teacher) {
        return (
            <div className="pt-28 pb-16 min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
                <Card className="max-w-md mx-auto">
                    <CardContent className="p-8 text-center">
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                            Booking Error
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
                        <Button asChild>
                            <Link href="/browse">Browse Teachers</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!teacher || !date || !time) {
        return (
            <div className="pt-28 pb-16 min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
                <Card className="max-w-md mx-auto">
                    <CardContent className="p-8 text-center">
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                            Invalid Booking
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mb-4">
                            Missing booking information. Please select a date and time.
                        </p>
                        <Button asChild>
                            <Link href="/browse">Browse Teachers</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const formattedDate = mounted && date ? new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    }) : "...";

    return (
        <div className="pt-28 pb-16 min-h-screen bg-slate-50 dark:bg-slate-950" suppressHydrationWarning>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back button */}
                <Link
                    href={`/teachers/${teacherId}`}
                    className="inline-flex items-center text-sm text-slate-600 dark:text-slate-400 hover:text-violet-600 mb-6"
                >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to profile
                </Link>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Order Summary */}
                    <div className="lg:col-span-2">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Card>
                                <CardContent className="p-6">
                                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                                        Confirm Your Booking
                                    </h1>

                                    {/* Teacher info */}
                                    <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl mb-6">
                                        <Avatar
                                            fallback={teacher.user?.full_name || "Teacher"}
                                            src={teacher.user?.avatar_url || undefined}
                                            size="lg"
                                        />
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-slate-900 dark:text-white">
                                                {teacher.user?.full_name}
                                            </h3>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                                {teacher.title || "Tutor"}
                                            </p>
                                        </div>
                                        {/* Lesson type badge */}
                                        <Badge
                                            className={lessonType === "group"
                                                ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"
                                                : "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400"
                                            }
                                        >
                                            {lessonType === "group" ? (
                                                <><Users className="h-3 w-3 mr-1" /> Group Lesson</>
                                            ) : (
                                                <><UserCheck className="h-3 w-3 mr-1" /> 1-on-1 Lesson</>
                                            )}
                                        </Badge>
                                        {selectedPackage && (
                                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                                                Package: {selectedPackage.name}
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Booking details */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-500/20">
                                                    <Calendar className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400">Date</p>
                                                    <p className="font-medium text-slate-900 dark:text-white">{formattedDate}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-500/20">
                                                    <Clock className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400">Time</p>
                                                    <p className="font-medium text-slate-900 dark:text-white">
                                                        {time}{endTime ? ` - ${endTime}` : ""}
                                                        {(() => {
                                                            if (time && endTime) {
                                                                const [startH, startM] = time.split(":").map(Number);
                                                                const [endH, endM] = endTime.split(":").map(Number);
                                                                const duration = (endH * 60 + endM) - (startH * 60 + startM);
                                                                return ` (${duration} minutes)`;
                                                            }
                                                            return " (60 minutes)";
                                                        })()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-500/20">
                                                    <User className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400">Subject</p>
                                                    <p className="font-medium text-slate-900 dark:text-white">
                                                        {subject || teacher.subjects[0] || "General Tutoring"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>

                    {/* Payment Summary */}
                    <div className="lg:col-span-1">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                            className="sticky top-28"
                        >
                            <Card>
                                <CardContent className="p-6">
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                                        Payment Summary
                                    </h2>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-600 dark:text-slate-400">
                                                Lesson
                                                {(() => {
                                                    if (time && endTime) {
                                                        const [startH, startM] = time.split(":").map(Number);
                                                        const [endH, endM] = endTime.split(":").map(Number);
                                                        const duration = (endH * 60 + endM) - (startH * 60 + startM);
                                                        return ` (${duration} min)`;
                                                    }
                                                    return " (60 min)";
                                                })()}
                                            </span>
                                            <span className="text-slate-900 dark:text-white">
                                                {formatCurrency(lessonType === "group" && teacher.group_rate ? teacher.group_rate : teacher.hourly_rate)} / hr
                                            </span>
                                        </div>
                                        {lessonType === "group" && teacher.group_rate && teacher.group_rate < teacher.hourly_rate && (
                                            <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400">
                                                <span>Group Discount</span>
                                                <span>- {formatCurrency(teacher.hourly_rate - teacher.group_rate)} / hr</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-600 dark:text-slate-400">Platform fee</span>
                                            <span className="text-emerald-600 dark:text-emerald-400">Free</span>
                                        </div>
                                        <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
                                            <div className="flex justify-between">
                                                <span className="font-semibold text-slate-900 dark:text-white">Total</span>
                                                <span className="font-bold text-lg text-slate-900 dark:text-white">
                                                    {(() => {
                                                        if (selectedPackage) return formatCurrency(selectedPackage.price);

                                                        let durationMinutes = 60;
                                                        if (time && endTime) {
                                                            const [startH, startM] = time.split(":").map(Number);
                                                            const [endH, endM] = endTime.split(":").map(Number);
                                                            durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
                                                        }
                                                        const rate = lessonType === "group" && teacher.group_rate ? teacher.group_rate : teacher.hourly_rate;
                                                        return formatCurrency((durationMinutes / 60) * rate);
                                                    })()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {selectedPackage && (
                                        <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl">
                                            <p className="text-xs text-emerald-800 dark:text-emerald-400 font-medium">
                                                You are booking a package of {selectedPackage.lesson_count} lessons. After checkout, you can schedule the remaining {selectedPackage.lesson_count - 1} lessons from your dashboard.
                                            </p>
                                        </div>
                                    )}

                                    {error && (
                                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg">
                                            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
                                        </div>
                                    )}

                                    <Button
                                        className="w-full bg-violet-600 hover:bg-violet-700"
                                        size="lg"
                                        disabled={booking}
                                        onClick={handleConfirmBooking}
                                    >
                                        {booking ? (
                                            <>
                                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <CreditCard className="h-5 w-5 mr-2" />
                                                Confirm Booking
                                            </>
                                        )}
                                    </Button>

                                    <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-4">
                                        Free cancellation up to 24 hours before the lesson
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <main>
            <Navbar />
            <Suspense fallback={
                <div className="pt-28 pb-16 min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
                </div>
            }>
                <CheckoutContent />
            </Suspense>
            <Footer />
        </main>
    );
}
