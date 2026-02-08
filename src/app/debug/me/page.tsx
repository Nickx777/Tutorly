"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function DebugMePage() {
    const [user, setUser] = useState<any>(null);
    const [dbUser, setDbUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                const { data } = await supabase
                    .from("users")
                    .select("*")
                    .eq("id", user.id)
                    .single();
                setDbUser(data);
            }
            setLoading(false);
        }
        load();
    }, []);

    if (loading) return <div className="p-10">Loading...</div>;

    return (
        <div className="p-10 space-y-6">
            <h1 className="text-2xl font-bold">Debug / Me</h1>

            <div className="p-4 border rounded bg-slate-100">
                <h2 className="font-bold">Auth User (Metadata)</h2>
                <pre className="text-xs overflow-auto mt-2">
                    {JSON.stringify(user, null, 2)}
                </pre>
            </div>

            <div className="p-4 border rounded bg-slate-100">
                <h2 className="font-bold">Public User (DB)</h2>
                <pre className="text-xs overflow-auto mt-2">
                    {JSON.stringify(dbUser, null, 2)}
                </pre>
            </div>

            <div className="p-4 border border-red-200 bg-red-50">
                <h2 className="font-bold text-red-700">Diagnosis</h2>
                <ul className="list-disc pl-5 mt-2">
                    <li><strong>Auth Role:</strong> {user?.role}</li>
                    <li><strong>Metadata Role:</strong> {user?.user_metadata?.role}</li>
                    <li><strong>DB Role:</strong> {dbUser?.role}</li>
                    <li><strong>Onboarding Completed (Meta):</strong> {String(user?.user_metadata?.onboarding_completed)}</li>
                    <li><strong>Onboarding Completed (DB):</strong> {String(dbUser?.onboarding_completed)}</li>
                </ul>
            </div>
        </div>
    );
}
