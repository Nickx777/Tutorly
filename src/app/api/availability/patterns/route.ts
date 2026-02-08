import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get teacher ID first
    const { data: teacher } = await supabase
        .from("teacher_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

    if (!teacher) {
        return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
    }

    const { data: patterns, error } = await supabase
        .from("availability_patterns")
        .select("*")
        .eq("teacher_id", teacher.id)
        .order("created_at", { ascending: true });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: patterns });
}

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { name, days_of_week, start_time, duration_minutes, is_active } = await request.json();

        // Get teacher ID
        const { data: teacher } = await supabase
            .from("teacher_profiles")
            .select("id")
            .eq("user_id", user.id)
            .single();

        if (!teacher) throw new Error("Teacher profile not found");

        // Insert pattern
        const { data: pattern, error } = await supabase
            .from("availability_patterns")
            .insert({
                teacher_id: teacher.id,
                name,
                days_of_week,
                start_time,
                duration_minutes,
                is_active
            })
            .select()
            .single();

        if (error) throw error;

        // If active, we should theoretically generate slots, but for now we'll just return the pattern
        // and let the frontend or a separate sync process handle slot generation.
        // Ideally, we'd delete old slots linked to this pattern and insert new ones.

        if (is_active) {
            // Simple logic: If activating, generate slots for next 4 weeks (or just static weekly slots)
            // For the "Weekly Schedule" view which is generic (0-6 days), we just need to ensure
            // the `availability` table has entries for these days/times.

            // 1. Delete existing slots for this pattern
            await supabase
                .from("availability")
                .delete()
                .eq("pattern_id", pattern.id);

            // 2. Insert new slots for each day in the pattern
            const slotsToInsert = days_of_week.map((day: number) => {
                // Calculate end time
                const [hours, minutes] = start_time.split(':').map(Number);
                const totalMinutes = hours * 60 + minutes + duration_minutes;
                const endHours = Math.floor(totalMinutes / 60) % 24;
                const endMinutes = totalMinutes % 60;
                const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;

                return {
                    teacher_id: teacher.id,
                    day_of_week: day,
                    start_time: start_time,
                    end_time: endTime,
                    pattern_id: pattern.id
                };
            });

            if (slotsToInsert.length > 0) {
                const { error: slotError } = await supabase
                    .from("availability")
                    .insert(slotsToInsert);

                if (slotError) console.error("Error generating slots:", slotError);
            }
        }

        return NextResponse.json({ data: pattern });

    } catch (error: any) {
        console.error("Error creating pattern:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { id, is_active } = await request.json();

        // Update pattern
        const { data: pattern, error } = await supabase
            .from("availability_patterns")
            .update({ is_active })
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        // Sync slots
        if (is_active) {
            // Re-generate slots (same logic as POST)
            // Ideally this should be a shared function
            // Get teacher ID
            const { data: teacher } = await supabase
                .from("teacher_profiles")
                .select("id")
                .eq("user_id", user.id)
                .single();

            if (!teacher) throw new Error("Teacher profile not found");

            // 1. Delete existing
            await supabase.from("availability").delete().eq("pattern_id", id);

            // 2. Insert new
            const slotsToInsert = pattern.days_of_week.map((day: number) => {
                const [hours, minutes] = pattern.start_time.split(':').map(Number);
                const totalMinutes = hours * 60 + minutes + pattern.duration_minutes;
                const endHours = Math.floor(totalMinutes / 60) % 24;
                const endMinutes = totalMinutes % 60;
                const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;

                return {
                    teacher_id: teacher.id,
                    day_of_week: day,
                    start_time: pattern.start_time,
                    end_time: endTime,
                    pattern_id: id
                };
            });

            if (slotsToInsert.length > 0) {
                await supabase.from("availability").insert(slotsToInsert);
            }

        } else {
            // If deactivating, remove associated slots
            await supabase
                .from("availability")
                .delete()
                .eq("pattern_id", id);
        }

        return NextResponse.json({ data: pattern });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
export async function DELETE(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

        // 1. Delete associated slots first
        await supabase
            .from("availability")
            .delete()
            .eq("pattern_id", id);

        // 2. Delete the pattern
        const { error } = await supabase
            .from("availability_patterns")
            .delete()
            .eq("id", id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
