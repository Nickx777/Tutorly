"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export default function OnboardingPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function checkRole() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push("/login"); // Should be handled by middleware, but safe to add
                return;
            }

            // Get role from metadata first (faster)
            let role = user.user_metadata?.role;

            // Fallback to database check if metadata is missing/stale
            if (!role) {
                const { data: userData } = await supabase
                    .from("users")
                    .select("role")
                    .eq("id", user.id)
                    .single();
                role = userData?.role;
            }

            if (role === "teacher") {
                router.push("/onboarding/teacher");
            } else if (role === "student") {
                router.push("/onboarding/student");
            } else if (role === "admin") {
                // Admins typically don't need onboarding, but if they land here:
                router.push("/admin");
            } else {
                // Default to student if unknown
                router.push("/onboarding/student");
            }
        }

        checkRole();
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
            <Loader2 className="h-12 w-12 animate-spin text-violet-600 dark:text-violet-400" />
            <span className="sr-only">Redirecting...</span>
        </div>
    );
}
