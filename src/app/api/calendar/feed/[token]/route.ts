import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role or a specialized client for feed access since it's token-based, not session-based
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    const { token } = await params;

    if (!token) {
        return new NextResponse("Missing token", { status: 400 });
    }

    try {
        // 1. Verify token and get user
        const { data: user, error: userError } = await supabaseAdmin
            .from("users")
            .select("id, full_name")
            .eq("calendar_token", token)
            .single();

        if (userError || !user) {
            return new NextResponse("Invalid token", { status: 401 });
        }

        // 2. Fetch future lessons for this user (scheduled, accepted, or confirmed)
        const { data: lessons, error: lessonsError } = await supabaseAdmin
            .from("lessons")
            .select(`
                *,
                teacher:teacher_profiles(user:users(full_name)),
                student:users(full_name)
            `)
            .or(`teacher_id.eq.${user.id},student_id.eq.${user.id}`)
            .in("status", ["scheduled", "accepted", "confirmed"])
            .order("scheduled_at", { ascending: true });

        if (lessonsError) throw lessonsError;

        // 3. Generate iCal content
        let ical = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//Tutorly//NONSGML v1.0//EN",
            "CALSCALE:GREGORIAN",
            "METHOD:PUBLISH",
            `X-WR-CALNAME:Tutorly - ${user.full_name}`,
            "X-WR-TIMEZONE:UTC",
        ];

        lessons?.forEach((lesson: any) => {
            const start = new Date(lesson.scheduled_at);
            const end = new Date(start.getTime() + lesson.duration_minutes * 60000);

            const formatDate = (date: Date) => date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

            const summary = `${lesson.subject} Lesson`;
            const description = lesson.lesson_type === 'group'
                ? `Group lesson with ${lesson.teacher?.user?.full_name}`
                : `1-on-1 lesson with ${lesson.teacher?.user?.full_name || lesson.student?.full_name}`;

            ical.push(
                "BEGIN:VEVENT",
                `UID:${lesson.id}@tutorly.app`,
                `DTSTAMP:${formatDate(new Date())}`,
                `DTSTART:${formatDate(start)}`,
                `DTEND:${formatDate(end)}`,
                `SUMMARY:${summary}`,
                `DESCRIPTION:${description}`,
                lesson.zoom_link ? `LOCATION:${lesson.zoom_link}` : "",
                "STATUS:CONFIRMED",
                "END:VEVENT"
            );
        });

        ical.push("END:VCALENDAR");

        // 4. Return as .ics file
        return new NextResponse(ical.filter(line => line !== "").join("\r\n"), {
            headers: {
                "Content-Type": "text/calendar; charset=utf-8",
                "Content-Disposition": `attachment; filename="tutorly-calendar.ics"`,
                "Cache-Control": "no-cache, no-store, must-revalidate",
            },
        });

    } catch (error) {
        console.error("iCal Generator Error:", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
