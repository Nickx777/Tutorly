
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getLessonsForTeacher } from "@/lib/db";
import TeacherStudentsClient from "./TeacherStudentsClient";

interface Student {
    id: string;
    full_name: string;
    avatar_url?: string;
    totalLessons: number;
    lastLesson?: string;
}

export default async function TeacherStudents() {
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

    // Process students server-side
    const studentMap = new Map<string, Student>();

    if (lessons) {
        lessons.forEach((lesson: any) => {
            if (lesson.student) {
                const existing = studentMap.get(lesson.student.id);
                if (existing) {
                    existing.totalLessons++;
                    if (!existing.lastLesson || lesson.scheduled_at > existing.lastLesson) {
                        existing.lastLesson = lesson.scheduled_at;
                    }
                } else {
                    studentMap.set(lesson.student.id, {
                        id: lesson.student.id,
                        full_name: lesson.student.full_name,
                        avatar_url: lesson.student.avatar_url,
                        totalLessons: 1,
                        lastLesson: lesson.scheduled_at,
                    });
                }
            }
        });
    }

    const students = Array.from(studentMap.values());

    return (
        <TeacherStudentsClient
            user={userData}
            students={students}
        />
    );
}
