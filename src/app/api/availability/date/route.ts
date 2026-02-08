import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const teacher_id = searchParams.get("teacher_id");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    if (!teacher_id) {
        return NextResponse.json({ error: "Missing teacher_id" }, { status: 400 });
    }

    const supabase = await createClient();

    let query = supabase
        .from("date_availability")
        .select("*")
        .eq("teacher_id", teacher_id);

    if (startDate) query = query.gte("available_date", startDate);
    if (endDate) query = query.lte("available_date", endDate);

    const { data, error } = await query.order("available_date").order("start_time");

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { teacher_id, available_date, start_time, end_time, lesson_type, max_students } = body;

        if (!teacher_id || !available_date || !start_time || !end_time) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Verify teacher_id belongs to user
        const { data: profile, error: profileError } = await supabase
            .from("teacher_profiles")
            .select("id")
            .eq("user_id", user.id)
            .eq("id", teacher_id)
            .single();

        if (profileError || !profile) {
            console.error("Profile verification error:", profileError);
            return NextResponse.json({ error: "Unauthorized to manage this profile" }, { status: 403 });
        }

        // Format times to HH:mm:00 if they are HH:mm
        const formattedStartTime = start_time.length === 5 ? `${start_time}:00` : start_time;
        const formattedEndTime = end_time.length === 5 ? `${end_time}:00` : end_time;

        console.log("Adding availability slot:", { teacher_id, available_date, start_time: formattedStartTime, end_time: formattedEndTime, lesson_type, max_students });

        const { data, error } = await supabase
            .from("date_availability")
            .insert({
                teacher_id,
                available_date,
                start_time: formattedStartTime,
                end_time: formattedEndTime,
                lesson_type: lesson_type || 'one_on_one',
                max_students: lesson_type === 'group' ? (max_students || 1) : 1
            })
            .select();

        if (error) {
            console.error("Database error inserting availability slot:", error);
            // Handle overlapping slots (EXCLUDE constraint error code 23P01)
            if (error.code === '23P01') {
                return NextResponse.json({ error: "This time slot overlaps with an existing one on this date." }, { status: 409 });
            }
            return NextResponse.json({ error: error.message, details: error.details, hint: error.hint }, { status: 500 });
        }

        if (!data || data.length === 0) {
            return NextResponse.json({ error: "Slot created but could not be retrieved. Check RLS policies." }, { status: 500 });
        }

        console.log("Successfully added slot:", data[0]);
        return NextResponse.json({ data: data[0] });
    } catch (err: any) {
        console.error("Unexpected error in availability POST:", err);
        return NextResponse.json({ error: err.message || "An unexpected error occurred" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
        return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership via join
    const { data: slot, error: fetchError } = await supabase
        .from("date_availability")
        .select("teacher_id, teacher_profiles(user_id)")
        .eq("id", id)
        .single();

    if (fetchError || !slot) {
        return NextResponse.json({ error: "Slot not found or unauthorized" }, { status: 404 });
    }

    const userData = slot.teacher_profiles as any;
    if (userData.user_id !== user.id) {
        return NextResponse.json({ error: "Unauthorized to delete this slot" }, { status: 403 });
    }

    const { error } = await supabase
        .from("date_availability")
        .delete()
        .eq("id", id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
