import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@/lib/supabase/server";

// POST /api/admin/approve-teacher - Approve a teacher (bypasses RLS)
export async function POST(request: NextRequest) {
    try {
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: "userId is required" }, { status: 400 });
        }

        // Verify the caller is an admin
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Use service role client to bypass RLS
        const supabaseAdmin = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                cookies: { getAll() { return []; }, setAll() { } }
            }
        );

        // Check admin role
        const { data: adminUser } = await supabaseAdmin
            .from("users")
            .select("role")
            .eq("id", user.id)
            .single();

        if (adminUser?.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Approve the teacher
        const { error } = await supabaseAdmin
            .from("teacher_profiles")
            .update({ approved: true, show_approval_notification: true })
            .eq("user_id", userId);

        if (error) {
            console.error("Error approving teacher:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("Approve teacher API error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
