// Zoom API integration for creating meetings
// Requires: ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET, ZOOM_REDIRECT_URI env vars

import { createClient } from "@/lib/supabase/server";

const ZOOM_AUTH_URL = "https://zoom.us/oauth/authorize";
const ZOOM_TOKEN_URL = "https://zoom.us/oauth/token";
const ZOOM_API_BASE = "https://api.zoom.us/v2";

interface ZoomTokens {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
}

interface ZoomUser {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
}

interface ZoomMeeting {
    id: number;
    join_url: string;
    start_url: string;
    password?: string;
    topic: string;
}

/**
 * Generate the Zoom OAuth authorization URL
 */
export function getZoomAuthUrl(state?: string): string {
    const clientId = process.env.ZOOM_CLIENT_ID;
    const redirectUri = process.env.ZOOM_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/zoom/callback`;

    if (!clientId) {
        throw new Error("ZOOM_CLIENT_ID environment variable is not set");
    }

    const params = new URLSearchParams({
        response_type: "code",
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: "user:read meeting:write", // Explicitly request required scopes
        ...(state && { state }),
    });

    return `${ZOOM_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for access and refresh tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<ZoomTokens> {
    const clientId = process.env.ZOOM_CLIENT_ID;
    const clientSecret = process.env.ZOOM_CLIENT_SECRET;
    const redirectUri = process.env.ZOOM_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/zoom/callback`;

    if (!clientId || !clientSecret) {
        throw new Error("ZOOM_CLIENT_ID and ZOOM_CLIENT_SECRET must be set");
    }

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const response = await fetch(ZOOM_TOKEN_URL, {
        method: "POST",
        headers: {
            "Authorization": `Basic ${credentials}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            grant_type: "authorization_code",
            code,
            redirect_uri: redirectUri,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        console.error("Zoom token exchange error:", error);
        throw new Error(`Failed to exchange code for tokens: ${response.status}`);
    }

    return response.json();
}

/**
 * Refresh an expired access token
 */
export async function refreshZoomToken(refreshToken: string): Promise<ZoomTokens> {
    const clientId = process.env.ZOOM_CLIENT_ID;
    const clientSecret = process.env.ZOOM_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error("ZOOM_CLIENT_ID and ZOOM_CLIENT_SECRET must be set");
    }

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const response = await fetch(ZOOM_TOKEN_URL, {
        method: "POST",
        headers: {
            "Authorization": `Basic ${credentials}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: refreshToken,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        console.error("Zoom token refresh error:", error);
        throw new Error(`Failed to refresh token: ${response.status}`);
    }

    return response.json();
}

/**
 * Get the current user's Zoom profile
 */
export async function getZoomUser(accessToken: string): Promise<ZoomUser> {
    const response = await fetch(`${ZOOM_API_BASE}/users/me`, {
        headers: {
            "Authorization": `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        let errorText = "";
        try {
            errorText = await response.text();
        } catch (e) {
            errorText = "Could not read error response body";
        }
        console.error(`Failed to get Zoom user (${response.status}):`, errorText);
        throw new Error(`Failed to get Zoom user: ${response.status}. Details: ${errorText.substring(0, 100)}`);
    }

    return response.json();
}

/**
 * Create a Zoom meeting for a tutoring session
 */
export async function createZoomMeeting(
    accessToken: string,
    options: {
        topic: string;
        startTime: Date;
        durationMinutes: number;
        timezone?: string;
    }
): Promise<ZoomMeeting> {
    const response = await fetch(`${ZOOM_API_BASE}/users/me/meetings`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            topic: options.topic,
            type: 2, // Scheduled meeting
            start_time: options.startTime.toISOString(),
            duration: options.durationMinutes,
            timezone: options.timezone || "UTC",
            settings: {
                host_video: true,
                participant_video: true,
                join_before_host: true, // Allow students to join early
                waiting_room: false,
                mute_upon_entry: false,
                audio: "both",
                auto_recording: "none",
            },
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        console.error("Zoom meeting creation error:", error);
        throw new Error(`Failed to create meeting: ${response.status}`);
    }

    return response.json();
}

/**
 * Delete a Zoom meeting
 */
export async function deleteZoomMeeting(
    accessToken: string,
    meetingId: string | number
): Promise<void> {
    const response = await fetch(`${ZOOM_API_BASE}/meetings/${meetingId}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${accessToken}`,
        },
    });

    // 204 No Content is success, 404 means already deleted
    if (!response.ok && response.status !== 404) {
        throw new Error(`Failed to delete meeting: ${response.status}`);
    }
}

/**
 * Get valid access token for a user, refreshing if necessary
 */
export async function getValidAccessToken(userId: string): Promise<string | null> {
    const supabase = await createClient();

    // Get user's Zoom tokens
    const { data: user, error } = await supabase
        .from("users")
        .select("zoom_access_token, zoom_refresh_token, zoom_token_expires_at")
        .eq("id", userId)
        .single();

    if (error || !user?.zoom_refresh_token) {
        return null; // User doesn't have Zoom connected
    }

    const expiresAt = user.zoom_token_expires_at ? new Date(user.zoom_token_expires_at) : null;
    const now = new Date();

    // If token is still valid (with 5 minute buffer), return it
    if (expiresAt && user.zoom_access_token && expiresAt.getTime() > now.getTime() + 5 * 60 * 1000) {
        return user.zoom_access_token;
    }

    // Token expired or about to expire, refresh it
    try {
        const tokens = await refreshZoomToken(user.zoom_refresh_token);

        const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);

        // Update tokens in database
        await supabase
            .from("users")
            .update({
                zoom_access_token: tokens.access_token,
                zoom_refresh_token: tokens.refresh_token,
                zoom_token_expires_at: newExpiresAt.toISOString(),
            })
            .eq("id", userId);

        return tokens.access_token;
    } catch (error) {
        console.error("Failed to refresh Zoom token:", error);

        // Clear invalid tokens
        await supabase
            .from("users")
            .update({
                zoom_access_token: null,
                zoom_refresh_token: null,
                zoom_token_expires_at: null,
                zoom_user_id: null,
            })
            .eq("id", userId);

        return null;
    }
}

/**
 * Create a Zoom meeting for a lesson if the teacher has Zoom connected
 * Returns the meeting join URL or null if Zoom not connected
 */
export async function createMeetingForLesson(
    teacherId: string,
    lessonDetails: {
        subject: string;
        studentName?: string;
        scheduledAt: Date;
        durationMinutes: number;
        timezone?: string;
    }
): Promise<{ joinUrl: string; meetingId: string } | null> {
    const accessToken = await getValidAccessToken(teacherId);

    if (!accessToken) {
        return null; // Teacher doesn't have Zoom connected
    }

    try {
        const topic = lessonDetails.studentName
            ? `${lessonDetails.subject} Lesson with ${lessonDetails.studentName}`
            : `${lessonDetails.subject} Tutoring Session`;

        const meeting = await createZoomMeeting(accessToken, {
            topic,
            startTime: lessonDetails.scheduledAt,
            durationMinutes: lessonDetails.durationMinutes,
            timezone: lessonDetails.timezone,
        });

        return {
            joinUrl: meeting.join_url,
            meetingId: meeting.id.toString(),
        };
    } catch (error) {
        console.error("Failed to create Zoom meeting:", error);
        return null;
    }
}
