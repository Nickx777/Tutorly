// Zoom disconnect endpoint
// Clears Zoom OAuth tokens from the database

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Clear Zoom tokens
        const { error: updateError } = await supabase
            .from("users")
            .update({
                zoom_access_token: null,
                zoom_refresh_token: null,
                zoom_token_expires_at: null,
                zoom_user_id: null,
            })
            .eq("id", user.id);

        if (updateError) {
            console.error("Failed to disconnect Zoom:", updateError);
            return NextResponse.json(
                { error: "Failed to disconnect Zoom" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Zoom disconnect error:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
