
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getLessonsForTeacher } from "@/lib/db";
import TeacherLessonsClient from "./TeacherLessonsClient";

export default async function TeacherLessons() {
    const supabase = await createClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect("/auth/sign-in");
    }

    // Parallel data fetching
    const [userData, lessons] = await Promise.all([
        supabase
            .from('users')
            .select('id, full_name, email, avatar_url')
            .eq('id', user.id)
            .single()
            .then(res => res.data),
        getLessonsForTeacher(user.id, supabase)
    ]);

    if (!userData) {
        return <div>Error loading profile</div>;
    }

    return (
        <TeacherLessonsClient
            user={userData}
            lessons={lessons || []}
        />
    );
}
