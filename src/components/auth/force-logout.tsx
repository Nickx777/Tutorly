"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function ForceLogout() {
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const logout = async () => {
            await supabase.auth.signOut();
            router.push("/auth/sign-in");
            router.refresh();
        };

        logout();
    }, [router, supabase]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
            <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-violet-600 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400">Logging out...</p>
            </div>
        </div>
    );
}
