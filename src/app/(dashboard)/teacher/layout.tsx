import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard";
import Link from "next/link";
import { GraduationCap, ArrowRight, Sparkles } from "lucide-react";
import { ForceLogout } from "@/components/auth/force-logout";

export default async function TeacherLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect("/auth/sign-in");
    }

    // Fetch user data for layout
    const { data: userData } = await supabase
        .from('users')
        .select('id, full_name, avatar_url, email, role')
        .eq('id', user.id)
        .single();

    if (!userData) {
        return <ForceLogout />;
    }

    // Check if user is a teacher
    if (userData.role !== 'teacher' && userData.role !== 'admin') {
        redirect("/student");
    }

    return (
        <DashboardLayout
            userRole="teacher"
            userName={userData.full_name}
            userAvatar={userData.avatar_url}
            userEmail={userData.email}
        >
            {children}
        </DashboardLayout>
    );
}
