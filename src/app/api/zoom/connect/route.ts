// Zoom OAuth initiation endpoint
// Redirects user to Zoom authorization page

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getZoomAuthUrl } from "@/lib/zoom";

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.redirect(new URL("/login", request.url));
        }

        // Generate OAuth URL with user ID as state for security
        const state = Buffer.from(JSON.stringify({
            userId: user.id,
            timestamp: Date.now()
        })).toString("base64");

        const authUrl = getZoomAuthUrl(state);

        return NextResponse.redirect(authUrl);
    } catch (error: any) {
        console.error("Zoom connect error:", error);
        return NextResponse.redirect(
            new URL("/teacher/settings?error=zoom_connect_failed", request.url)
        );
    }
}
