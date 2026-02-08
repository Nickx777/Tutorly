
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import TeacherAvailabilityClient from "./TeacherAvailabilityClient";

export default async function TeacherAvailability() {
    const supabase = await createClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect("/auth/sign-in");
    }

    // Parallel data fetching
    const [userRes, profileRes] = await Promise.all([
        supabase
            .from('users')
            .select('id, full_name, email, avatar_url, suspended, suspended_reason')
            .eq('id', user.id)
            .single(),
        supabase
            .from("teacher_profiles")
            .select("id, auto_accept_bookings, subjects, buffer_minutes, is_buffer_enabled")
            .eq("user_id", user.id)
            .single()
    ]);

    const userData = userRes.data;
    const profileData = profileRes.data;

    if (userRes.error && userRes.error.code !== 'PGRST116') {
        console.error("Error fetching user data:", userRes.error);
    }
    if (profileRes.error && profileRes.error.code !== 'PGRST116') {
        console.error("Error fetching teacher profile:", profileRes.error);
    }

    // Fallback user if missing from public.users
    const safeUser = userData || {
        id: user.id,
        email: user.email || "",
        full_name: user.user_metadata?.full_name || "Teacher",
        avatar_url: user.user_metadata?.avatar_url,
    };

    // If profile is completely missing, we need it to continue
    if (!profileData) {
        console.log("No teacher profile found for user:", user.id);
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center max-w-md">
                    <h3 className="text-lg font-bold text-amber-800 mb-2">Teacher Profile Not Found</h3>
                    <p className="text-amber-700 text-sm mb-4">
                        We couldn't find your teacher profile. Please complete your profile setup first to manage availability.
                    </p>
                    <Link href="/teacher/profile" className="inline-flex items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                        Go to Profile Settings
                    </Link>
                </div>
            </div>
        );
    }

    // Now fetch slots using the real teacher_profile.id
    const { data: dateSlotsData } = await supabase
        .from("date_availability")
        .select("*")
        .eq("teacher_id", profileData.id)
        .order("available_date")
        .order("start_time");

    // Default auto-accept to true if profile found but value null
    const autoAccept = profileData.auto_accept_bookings ?? true;

    return (
        <div className="h-[calc(100vh-80px)] -m-6 flex flex-col overflow-auto">
            <div className="p-6 flex-1">
                <TeacherAvailabilityClient
                    user={safeUser as any}
                    teacherProfileId={profileData.id}
                    initialDateSlots={dateSlotsData || []}
                    initialAutoAccept={autoAccept}
                    subjects={profileData?.subjects || []}
                    initialBufferMinutes={profileData.buffer_minutes || 0}
                    initialIsBufferEnabled={profileData.is_buffer_enabled || false}
                />
            </div>
        </div>
    );
}
