// Zoom OAuth callback endpoint
// Exchanges authorization code for tokens and stores them

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeCodeForTokens, getZoomUser } from "@/lib/zoom";

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const searchParams = request.nextUrl.searchParams;

        const code = searchParams.get("code");
        const state = searchParams.get("state");
        const error = searchParams.get("error");

        // Handle Zoom error response
        if (error) {
            console.error("Zoom OAuth error:", error);
            return NextResponse.redirect(
                new URL("/teacher/settings?error=zoom_denied", request.url)
            );
        }

        if (!code) {
            return NextResponse.redirect(
                new URL("/teacher/settings?error=no_code", request.url)
            );
        }

        // Verify state and extract user ID
        let userId: string;
        try {
            const stateData = JSON.parse(Buffer.from(state || "", "base64").toString());
            userId = stateData.userId;

            // Check state is not too old (15 minutes max)
            if (Date.now() - stateData.timestamp > 15 * 60 * 1000) {
                return NextResponse.redirect(
                    new URL("/teacher/settings?error=expired", request.url)
                );
            }
        } catch {
            return NextResponse.redirect(
                new URL("/teacher/settings?error=invalid_state", request.url)
            );
        }

        // Verify the current user matches the state
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user || user.id !== userId) {
            return NextResponse.redirect(
                new URL("/teacher/settings?error=unauthorized", request.url)
            );
        }

        // Exchange code for tokens
        const tokens = await exchangeCodeForTokens(code);

        // Get Zoom user info (optional, don't fail if it fails)
        let zoomUserId = null;
        try {
            const zoomUser = await getZoomUser(tokens.access_token);
            zoomUserId = zoomUser.id;
        } catch (e) {
            console.warn("Could not fetch Zoom user info, proceeding without user ID:", e);
        }

        // Calculate token expiration
        const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

        // Store tokens in database
        const updateData: any = {
            zoom_access_token: tokens.access_token,
            zoom_token_expires_at: expiresAt.toISOString(),
            zoom_user_id: zoomUserId,
        };

        // Only update refresh token if provided
        if (tokens.refresh_token) {
            updateData.zoom_refresh_token = tokens.refresh_token;
        }

        const { error: updateError } = await supabase
            .from("users")
            .update(updateData)
            .eq("id", user.id);

        if (updateError) {
            console.error("Failed to store Zoom tokens:", updateError);
            return NextResponse.redirect(
                new URL("/teacher/settings?error=storage_failed", request.url)
            );
        }

        // Success - redirect back to settings
        return NextResponse.redirect(
            new URL("/teacher/settings?tab=calendar&success=zoom_connected", request.url)
        );

    } catch (error: any) {
        console.error("Zoom callback error:", error);
        return NextResponse.redirect(
            new URL("/teacher/settings?error=callback_failed", request.url)
        );
    }
}
