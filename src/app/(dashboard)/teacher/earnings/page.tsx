import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import EarningsClient from "./EarningsClient";
import { getTeacherStats } from "@/lib/db";
import { format, subMonths, startOfMonth, isSameMonth } from "date-fns";

export default async function TeacherEarnings() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect("/auth/sign-in");
    }

    // Get teacher profile
    const { data: teacher } = await supabase
        .from("teacher_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

    if (!teacher) {
        return <div>Teacher profile not found</div>;
    }

    // Fetch stats using existing function
    const stats = await getTeacherStats(teacher.id, supabase);

    // Fetch payments for monthly overview (last 6 months)
    const sixMonthsAgo = subMonths(new Date(), 5);
    const { data: payments } = await supabase
        .from("payments")
        .select("amount, teacher_payout, created_at, status")
        .eq("teacher_id", teacher.id)
        .gte("created_at", startOfMonth(sixMonthsAgo).toISOString())
        .order("created_at", { ascending: true });

    // Calculate monthly data
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const monthName = format(date, "MMM");
        const monthPayments = payments?.filter(p =>
            p.status === "completed" &&
            isSameMonth(new Date(p.created_at), date)
        ) || [];

        const earnings = monthPayments.reduce((sum, p) => sum + (p.teacher_payout || p.amount || 0), 0);
        monthlyData.push({ month: monthName, earnings });
    }

    // Calculate "This Month" percentage
    const thisMonthEarnings = monthlyData[monthlyData.length - 1].earnings;
    const lastMonthEarnings = monthlyData[monthlyData.length - 2]?.earnings || 0;

    let thisMonthChange = "vs last month";
    if (lastMonthEarnings > 0) {
        const change = ((thisMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100;
        thisMonthChange = `${change > 0 ? "+" : ""}${change.toFixed(1)}%`;
    } else if (thisMonthEarnings > 0) {
        thisMonthChange = "+100%";
    } else {
        thisMonthChange = "0%";
    }

    // Fetch recent transactions (Bookings as proxy for now, or payments if they have metadata)
    // We'll use bookings to get student and subject info nicely
    const { data: recentBookings } = await supabase
        .from("bookings")
        .select(`
            id,
            status,
            created_at,
            end_time,
            student:users!student_id(full_name),
            lesson:lessons(title, price)
        `)
        .eq("teacher_id", teacher.id)
        .order("end_time", { ascending: false })
        .limit(5);

    const transactions = recentBookings?.map((booking: any) => ({
        id: booking.id,
        student: booking.student?.full_name || "Unknown Student",
        subject: booking.lesson?.title || "Lesson",
        amount: booking.lesson?.price || 0,
        date: format(new Date(booking.end_time), "MMM d, yyyy"),
        status: booking.status
    })) || [];

    // Calculate average per lesson
    const averagePerLesson = stats.total_lessons > 0
        ? Math.round(stats.total_earnings / stats.total_lessons)
        : 0;

    const refinedStats = {
        totalEarnings: stats.total_earnings,
        totalEarningsChange: "All time",
        thisMonthEarnings,
        thisMonthChange,
        pendingEarnings: stats.pending_earnings,
        pendingChange: "processing",
        averagePerLesson,
        averageChange: "per session"
    };

    return (
        <EarningsClient
            stats={refinedStats}
            transactions={transactions as any}
            monthlyData={monthlyData}
        />
    );
}
