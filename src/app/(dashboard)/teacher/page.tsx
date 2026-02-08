
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getTeacherStats, getUpcomingLessons, getReviewsForTeacher } from "@/lib/db";
import TeacherDashboardClient from "./TeacherDashboardClient";

export default async function TeacherDashboard() {
    const supabase = await createClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect("/auth/sign-in");
    }

    // Parallel data fetching for performance
    const [userData, teacherProfile, teacherStats, lessons, reviews] = await Promise.all([
        supabase
            .from('users')
            .select('id, email, full_name, avatar_url, suspended, suspended_reason')
            .eq('id', user.id)
            .single()
            .then(res => res.data),
        supabase
            .from('teacher_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single()
            .then(res => res.data),
        getTeacherStats(user.id, supabase),
        getUpcomingLessons(user.id, "teacher", supabase),
        getReviewsForTeacher(user.id, supabase)
    ]);

    // Query availability using teacher_profile.id
    // Check both general availability and specific date availability
    let hasAvailability = false;
    if (teacherProfile?.id) {
        const [generalAvail, dateAvail] = await Promise.all([
            supabase
                .from('availability')
                .select('id')
                .eq('teacher_id', teacherProfile.id)
                .limit(1),
            supabase
                .from('date_availability')
                .select('id')
                .eq('teacher_id', teacherProfile.id)
                .limit(1)
        ]);

        hasAvailability = (generalAvail.data?.length || 0) > 0 || (dateAvail.data?.length || 0) > 0;
    }

    // If userData is missing but we have auth user, constructing a fallback to allow dashboard to load
    // so the user can see "Complete your setup"
    const safeUser = userData || {
        id: user.id,
        email: user.email || "",
        full_name: user.user_metadata?.full_name || "Teacher",
        avatar_url: user.user_metadata?.avatar_url,
        suspended: (userData as any)?.suspended,
        suspended_reason: (userData as any)?.suspended_reason
    };

    // Check profile completeness
    const detailsComplete = !!(
        teacherProfile?.bio &&
        teacherProfile?.subjects?.length > 0 &&
        teacherProfile?.languages?.length > 0 &&
        teacherProfile?.timezone
    );

    const profileComplete = !!(
        safeUser.full_name &&
        safeUser.avatar_url &&
        detailsComplete
    );

    const isApproved = teacherProfile?.approved || false;
    const showApprovalNotification = teacherProfile?.show_approval_notification || false;

    // Sanitize stats to ensure no nulls
    const statsSafe = {
        upcoming_lessons: teacherStats?.upcoming_lessons || 0,
        total_lessons: teacherStats?.total_lessons || 0,
        total_students: teacherStats?.total_students || 0,
        total_earnings: teacherStats?.total_earnings || 0,
        average_rating: teacherStats?.average_rating || 0,
        // Calculate dynamic trends if possible, otherwise use safe defaults
        monthly_earnings_growth: 0, // Placeholder for real growth calc
        weekly_students_growth: 0   // Placeholder
    };

    return (
        <TeacherDashboardClient
            user={safeUser}
            stats={statsSafe}
            upcomingLessons={(lessons || []).slice(0, 3) as any}
            recentReviews={(reviews || []).slice(0, 3) as any}
            profileComplete={profileComplete}
            detailsComplete={detailsComplete}
            isApproved={isApproved}
            showApprovalNotification={showApprovalNotification}
            hasAvailability={hasAvailability}
        />
    );
}
