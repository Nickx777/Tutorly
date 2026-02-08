import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getStudentStats, getUpcomingLessons, getRecommendedTeachers } from "@/lib/db";
import StudentDashboardClient from "./StudentDashboardClient";

export default async function StudentDashboard() {
    const supabase = await createClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect("/auth/sign-in");
    }

    // Parallel data fetching for performance
    const [userData, studentStats, lessons, teachers] = await Promise.all([
        supabase
            .from('users')
            .select('id, full_name, avatar_url')
            .eq('id', user.id)
            .single()
            .then(res => res.data),
        getStudentStats(user.id),
        getUpcomingLessons(user.id, "student"),
        getRecommendedTeachers(user.id, supabase)
    ]);

    if (!userData) {
        return <div>Error loading profile</div>;
    }

    // Sanitize stats
    const statsSafe = {
        upcoming_lessons: studentStats?.upcoming_lessons || 0,
        total_lessons: studentStats?.total_lessons || 0,
        total_spent: studentStats?.total_spent || 0,
    };

    return (
        <StudentDashboardClient
            user={userData}
            stats={statsSafe}
            upcomingLessons={(lessons || []).slice(0, 5) as any}
            recommendedTutors={(teachers || []).slice(0, 3) as any}
        />
    );
}
