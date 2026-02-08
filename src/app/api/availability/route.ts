import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get the current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { teacher_id, day_of_week, start_time, end_time, session_type, max_students, subject } = body;

        // Get the real teacher profile ID and verify ownership
        const { data: profile } = await supabase
            .from("teacher_profiles")
            .select("id, user_id")
            .eq("user_id", user.id)
            .single();

        if (!profile) {
            return NextResponse.json(
                { error: "Teacher profile not found" },
                { status: 404 }
            );
        }

        const realProfileId = profile.id;

        // Check for overlaps on the same day
        const { data: existingSlots, error: fetchError } = await supabase
            .from("availability")
            .select("id, start_time, end_time")
            .eq("teacher_id", realProfileId)
            .eq("day_of_week", day_of_week);

        if (fetchError) {
            return NextResponse.json({ error: fetchError.message }, { status: 500 });
        }

        if (existingSlots && existingSlots.length > 0) {
            // Overlap condition: (StartA < EndB) AND (EndA > StartB)
            // Normalize to HH:MM:SS for accurate string comparison
            const norm = (t: string) => t.length === 5 ? `${t}:00` : t;
            const newStart = norm(start_time);
            const newEnd = norm(end_time);

            const overlappingSlot = existingSlots.find(slot => {
                const sStart = norm(slot.start_time);
                const sEnd = norm(slot.end_time);
                return (newStart < sEnd) && (newEnd > sStart);
            });

            if (overlappingSlot) {
                const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                const dayName = days[day_of_week];
                const startTimeStr = overlappingSlot.start_time.slice(0, 5);
                const endTimeStr = overlappingSlot.end_time.slice(0, 5);

                return NextResponse.json(
                    { error: `This time overlaps with your existing ${startTimeStr} - ${endTimeStr} slot on ${dayName}.` },
                    { status: 400 }
                );
            }
        }

        // Insert the availability slot
        const { data, error: insertError } = await supabase
            .from("availability")
            .insert({
                teacher_id: realProfileId, // Use the actual profile ID
                day_of_week,
                start_time,
                end_time,
                session_type: session_type || "one-on-one",
                max_students: max_students || 1,
                subject: subject || null
            })
            .select()
            .single();

        if (insertError) {
            console.error("Availability insert error:", insertError);
            return NextResponse.json(
                { error: insertError.message, details: insertError },
                { status: 400 }
            );
        }

        return NextResponse.json({ data });

    } catch (error: any) {
        console.error("API error:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const slotId = searchParams.get("id");

        if (!slotId) {
            return NextResponse.json(
                { error: "Missing slot ID" },
                { status: 400 }
            );
        }

        // Get the real teacher profile ID to verify ownership
        const { data: profile } = await supabase
            .from("teacher_profiles")
            .select("id")
            .eq("user_id", user.id)
            .single();

        if (!profile) {
            return NextResponse.json(
                { error: "Teacher profile not found" },
                { status: 404 }
            );
        }

        // Delete the slot
        const { error: deleteError } = await supabase
            .from("availability")
            .delete()
            .eq("id", slotId)
            .eq("teacher_id", profile.id);

        if (deleteError) {
            return NextResponse.json(
                { error: deleteError.message },
                { status: 400 }
            );
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("API error:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
