import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import TeacherSettingsClient from "./TeacherSettingsClient";

export const dynamic = 'force-dynamic';

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SettingsPage({ searchParams }: PageProps) {
    const supabase = await createClient();
    const resolvedParams = await searchParams;
    const defaultTab = (resolvedParams.tab as string) || "notifications";

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect("/auth/sign-in");
    }

    // Fetch user profile (including calendar and zoom tokens)
    const { data: profile, error } = await supabase
        .from('users')
        .select('id, full_name, email, avatar_url, calendar_token, google_refresh_token, zoom_refresh_token')
        .eq('id', user.id)
        .single();

    if (error || !profile) {
        console.error("Error fetching teacher profile:", error);
        return <div className="p-8 text-center text-red-500">Error loading user profile. Please try again later.</div>;
    }

    const isCalendarConnected = !!profile.google_refresh_token;
    const isZoomConnected = !!profile.zoom_refresh_token;

    return (
        <Suspense fallback={<div className="p-8 text-center text-slate-500"><Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" /> Loading settings...</div>}>
            <TeacherSettingsClient
                initialUser={profile}
                isGoogleConnected={isCalendarConnected}
                isZoomConnected={isZoomConnected}
                defaultTab={defaultTab}
            />
        </Suspense>
    );
}
