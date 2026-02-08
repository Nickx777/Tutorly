import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUpcomingLessons } from "@/lib/db";
import CalendarClient from "./CalendarClient";

export default async function StudentCalendar() {
    const supabase = await createClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect("/auth/sign-in");
    }

    // Fetch user data
    const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single();

    if (!userData) {
        return <div>Error loading user data</div>;
    }

    // Fetch lessons for calendar
    let events: { date: Date; title: string }[] = [];
    try {
        const lessons = await getUpcomingLessons(userData.id, "student");
        events = lessons.map((lesson: any) => ({
            date: new Date(lesson.scheduled_at),
            title: lesson.subject || "Lesson",
        }));
    } catch (err) {
        console.error("Error fetching lessons:", err);
    }

    return <CalendarClient events={events} />;
}
