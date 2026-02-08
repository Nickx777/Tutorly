import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { pushLessonToGoogleCalendar } from "@/lib/google-calendar";

/**
 * POST /api/calendar/sync
 * Syncs all upcoming lessons to Google Calendar for the authenticated user
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if user has Google Calendar connected
        const { data: userData } = await supabase
            .from('users')
            .select('google_refresh_token')
            .eq('id', user.id)
            .single();

        if (!userData?.google_refresh_token) {
            return NextResponse.json({
                error: "Google Calendar not connected. Please connect your Google account first."
            }, { status: 400 });
        }

        // Get user role to determine which lessons to sync
        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        const role = profile?.role;

        // Fetch upcoming lessons for this user
        const now = new Date().toISOString();
        let lessonsQuery = supabase
            .from('lessons')
            .select('id')
            .neq('status', 'cancelled')
            .gte('scheduled_at', now);

        if (role === 'teacher') {
            lessonsQuery = lessonsQuery.eq('teacher_id', user.id);
        } else {
            lessonsQuery = lessonsQuery.eq('student_id', user.id);
        }

        const { data: lessons, error: lessonsError } = await lessonsQuery;

        if (lessonsError) {
            console.error("Error fetching lessons for sync:", lessonsError);
            return NextResponse.json({ error: "Failed to fetch lessons" }, { status: 500 });
        }

        if (!lessons || lessons.length === 0) {
            return NextResponse.json({
                message: "No upcoming lessons to sync",
                synced: 0
            });
        }

        // Sync each lesson to Google Calendar
        let synced = 0;
        let failed = 0;
        const errors: string[] = [];

        for (const lesson of lessons) {
            try {
                await pushLessonToGoogleCalendar(lesson.id);
                synced++;
            } catch (err: any) {
                failed++;
                errors.push(`Lesson ${lesson.id}: ${err.message}`);
                console.error(`Failed to sync lesson ${lesson.id}:`, err);
            }
        }

        return NextResponse.json({
            message: `Synced ${synced} lessons to Google Calendar`,
            synced,
            failed,
            total: lessons.length,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (err) {
        console.error("Calendar sync API error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
