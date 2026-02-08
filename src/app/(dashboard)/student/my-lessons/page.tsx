import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getLessonsForStudent } from "@/lib/db";
import MyLessonsClient from "./MyLessonsClient";

export default async function MyLessonsPage() {
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

    // Fetch lessons
    let lessons: any[] = [];
    try {
        lessons = await getLessonsForStudent(userData.id);
    } catch (err) {
        console.error("Error fetching lessons:", err);
    }

    return <MyLessonsClient lessons={lessons} />;
}
