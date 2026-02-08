"use client";

import { useState, useEffect } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export function SupabaseTest() {
    const [status, setStatus] = useState<"checking" | "connected" | "error">("checking");
    const [message, setMessage] = useState("Checking connection...");
    const [details, setDetails] = useState<string[]>([]);

    useEffect(() => {
        async function testConnection() {
            if (!isSupabaseConfigured()) {
                setStatus("error");
                setMessage("Supabase not configured - check .env.local");
                return;
            }

            try {
                const supabase = createClient();
                const tables = ["users", "teacher_profiles", "lessons", "reviews", "payments", "availability"];
                const tableStatus: string[] = [];

                for (const table of tables) {
                    const { error } = await supabase.from(table).select("count").limit(1);
                    if (error && error.code === "42P01") {
                        tableStatus.push(`❌ ${table}: missing`);
                    } else {
                        tableStatus.push(`✅ ${table}: ok`);
                    }
                }

                setDetails(tableStatus);
                setStatus("connected");
                setMessage("Connected to Supabase!");
            } catch (err) {
                setStatus("error");
                setMessage(`Connection failed: ${err instanceof Error ? err.message : "Unknown error"}`);
            }
        }

        testConnection();
    }, []);

    return (
        <div className={`p-4 rounded-lg text-sm ${
            status === "connected" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" :
            status === "error" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" :
            "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
        }`}>
            <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${
                    status === "connected" ? "bg-emerald-500" :
                    status === "error" ? "bg-red-500" :
                    "bg-slate-500 animate-pulse"
                }`} />
                <span className="font-medium">{message}</span>
            </div>
            {details.length > 0 && (
                <div className="mt-2 text-xs space-y-1 font-mono">
                    {details.map((d, i) => <div key={i}>{d}</div>)}
                </div>
            )}
        </div>
    );
}
