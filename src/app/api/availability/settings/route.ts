import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { buffer_minutes, is_buffer_enabled } = await request.json();

        const { error } = await supabase
            .from("teacher_profiles")
            .update({
                buffer_minutes: buffer_minutes,
                is_buffer_enabled: is_buffer_enabled
            })
            .eq("user_id", user.id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error updating buffer settings:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
