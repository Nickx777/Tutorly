import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard";
import Link from "next/link";
import { BookOpen, ArrowRight } from "lucide-react";
import { ForceLogout } from "@/components/auth/force-logout";

export default async function StudentLayout({
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

    // Check if user is a teacher (block them from student dashboard)
    if (userData.role === 'teacher') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
                <div className="max-w-md w-full">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 text-center">
                        {/* Icon */}
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/25">
                            <BookOpen className="h-10 w-10 text-white" />
                        </div>

                        {/* Title */}
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                            Hey Teacher! 👋
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            This area is for students. Your teacher dashboard awaits!
                        </p>

                        {/* Actions */}
                        <div className="space-y-3">
                            <Link
                                href="/teacher"
                                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
                            >
                                Go to Teacher Dashboard
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                            <Link
                                href="/browse"
                                className="w-full inline-flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium py-2 transition-colors"
                            >
                                Browse Teachers
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <DashboardLayout
            userRole="student"
            userName={userData.full_name}
            userAvatar={userData.avatar_url}
            userEmail={userData.email}
        >
            {children}
        </DashboardLayout>
    );
}
