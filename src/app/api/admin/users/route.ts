import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@/lib/supabase/server";

// GET /api/admin/users - Fetch all users with teacher profiles (bypasses RLS)
export async function GET() {
    try {
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

        // Fetch ALL users with teacher profiles - no RLS filtering
        const { data, error } = await supabaseAdmin
            .from("users")
            .select(`
                *,
                teacher_profile:teacher_profiles (
                    id,
                    approved,
                    subjects,
                    hourly_rate
                )
            `)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching users:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (err: any) {
        console.error("Admin users API error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
