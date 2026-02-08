import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - Fetch user's notifications
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const unreadOnly = searchParams.get("unread") === "true";
        const limit = parseInt(searchParams.get("limit") || "20");

        let query = supabase
            .from("notifications")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(limit);

        if (unreadOnly) {
            query = query.eq("read", false);
        }

        const { data, error } = await query;

        if (error) {
            console.error("Error fetching notifications:", error);
            return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
        }

        // Get unread count
        const { count } = await supabase
            .from("notifications")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("read", false);

        return NextResponse.json({ data, unreadCount: count || 0 });
    } catch (err) {
        console.error("Notifications API error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST - Create a new notification (internal use)
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        const body = await request.json();
        const { user_id, type, title, message, data } = body;

        if (!user_id || !type || !title || !message) {
            return NextResponse.json(
                { error: "Missing required fields: user_id, type, title, message" },
                { status: 400 }
            );
        }

        const { data: notification, error } = await supabase
            .from("notifications")
            .insert({
                user_id,
                type,
                title,
                message,
                data: data || {},
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating notification:", error);
            return NextResponse.json({ error: "Failed to create notification" }, { status: 500 });
        }

        return NextResponse.json({ data: notification }, { status: 201 });
    } catch (err) {
        console.error("Notification create error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PATCH - Mark notification(s) as read
export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { notification_id, mark_all } = body;

        if (mark_all) {
            // Mark all notifications as read
            const { error } = await supabase
                .from("notifications")
                .update({ read: true })
                .eq("user_id", user.id)
                .eq("read", false);

            if (error) {
                console.error("Error marking all as read:", error);
                return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
            }

            return NextResponse.json({ success: true });
        } else if (notification_id) {
            // Mark single notification as read
            const { error } = await supabase
                .from("notifications")
                .update({ read: true })
                .eq("id", notification_id)
                .eq("user_id", user.id);

            if (error) {
                console.error("Error marking notification as read:", error);
                return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
            }

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Must provide notification_id or mark_all" }, { status: 400 });
    } catch (err) {
        console.error("Notification update error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE - Delete a notification
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const notificationId = searchParams.get("id");

        if (!notificationId) {
            return NextResponse.json({ error: "Missing notification id" }, { status: 400 });
        }

        const { error } = await supabase
            .from("notifications")
            .delete()
            .eq("id", notificationId)
            .eq("user_id", user.id);

        if (error) {
            console.error("Error deleting notification:", error);
            return NextResponse.json({ error: "Failed to delete notification" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Notification delete error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
