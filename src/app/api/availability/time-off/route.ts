import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get teacher ID
    const { data: teacher } = await supabase
        .from("teacher_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

    if (!teacher) {
        return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
    }

    const { data: timeOff, error } = await supabase
        .from("teacher_time_off")
        .select("*")
        .eq("teacher_id", teacher.id)
        .order("start_date", { ascending: true });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: timeOff });
}

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { start_date, end_date, reason } = await request.json();

        const { data: teacher } = await supabase
            .from("teacher_profiles")
            .select("id")
            .eq("user_id", user.id)
            .single();

        if (!teacher) throw new Error("Teacher profile not found");

        const { data, error } = await supabase
            .from("teacher_time_off")
            .insert({
                teacher_id: teacher.id,
                start_date,
                end_date,
                reason
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ data });
    } catch (error: any) {
        console.error("Error adding time off:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    const { error } = await supabase
        .from("teacher_time_off")
        .delete()
        .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
}
