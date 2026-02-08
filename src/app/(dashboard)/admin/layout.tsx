import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default async function AdminLayout({
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

    // Strict Email Check
    // Only admin@admin.com is allowed
    if (user.email !== "admin@admin.com") {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
                <div className="max-w-md w-full text-center space-y-6">
                    <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
                        <ShieldAlert className="w-10 h-10 text-red-600 dark:text-red-500" />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            Access Denied
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400">
                            This area is restricted to system administrators only.
                        </p>
                    </div>

                    <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm text-left">
                        <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                            Current User
                        </p>
                        <p className="text-sm text-slate-500 font-mono">
                            {user.email}
                        </p>
                    </div>

                    <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors font-medium w-full"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Return Home
                    </Link>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
