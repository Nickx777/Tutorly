import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            console.error("API /messages GET Unauthorized:", authError);
            if (!user) console.error("API /messages GET: No user found.");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const contactId = searchParams.get("contactId");

        if (!contactId) {
            // Get all recent message threads for the user
            const { data, error } = await supabase
                .from("messages")
                .select(`
                    *,
                    sender:users!messages_sender_id_fkey(id, full_name, avatar_url),
                    receiver:users!messages_receiver_id_fkey(id, full_name, avatar_url)
                `)
                .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return NextResponse.json({ data });
        }

        // Get specific conversation with a contact
        const { data, error } = await supabase
            .from("messages")
            .select(`
                *,
                sender:users!messages_sender_id_fkey(id, full_name, avatar_url),
                receiver:users!messages_receiver_id_fkey(id, full_name, avatar_url)
            `)
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${user.id})`)
            .order("created_at", { ascending: true });

        if (error) throw error;
        return NextResponse.json({ data });

    } catch (err) {
        console.error("Messaging API GET error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            console.error("API /messages POST Unauthorized:", authError);
            if (!user) console.error("API /messages POST: No user found.");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { receiver_id, content } = body;

        if (!receiver_id || !content) {
            return NextResponse.json({ error: "Missing receiver_id or content" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("messages")
            .insert({
                sender_id: user.id,
                receiver_id,
                content
            })
            .select()
            .single();

        if (error) {
            console.error("Supabase Messaging INSERT error:", error);
            throw error;
        }
        return NextResponse.json({ data });

    } catch (err: any) {
        console.error("Messaging API POST error:", err);
        return NextResponse.json({
            error: "Internal server error",
            details: err.message,
            code: err.code
        }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { contactId } = body;

        if (!contactId) {
            return NextResponse.json({ error: "Missing contactId" }, { status: 400 });
        }

        // Mark all messages from this contact to the current user as read
        const { error } = await supabase
            .from("messages")
            .update({ read: true })
            .eq("sender_id", contactId)
            .eq("receiver_id", user.id)
            .eq("read", false);

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (err: any) {
        console.error("Messaging API PATCH error:", err);
        return NextResponse.json({
            error: "Internal server error",
            details: err.message
        }, { status: 500 });
    }
}
