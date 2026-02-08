import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
    const supabase = await createClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect("/auth/sign-in");
    }

    // Fetch user profile
    const { data: profile, error } = await supabase
        .from('users')
        .select('id, full_name, email, avatar_url, calendar_token, google_refresh_token')
        .eq('id', user.id)
        .single();

    if (error || !profile) {
        console.error("Error fetching student profile:", error);
        return <div className="p-8 text-center text-red-500">Error loading user profile. Please try again later.</div>;
    }

    const isCalendarConnected = !!profile.google_refresh_token;

    return <SettingsClient initialUser={profile} isGoogleConnected={isCalendarConnected} />;
}
