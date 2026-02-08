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

        const body = await request.json();
        const { teacher_id, lesson_id, rating, content, subject } = body;

        // Validate required fields
        if (!teacher_id || !rating) {
            return NextResponse.json(
                { error: "Missing required fields: teacher_id, rating" },
                { status: 400 }
            );
        }

        if (rating < 1 || rating > 5) {
            return NextResponse.json(
                { error: "Rating must be between 1 and 5" },
                { status: 400 }
            );
        }

        // Check if user already reviewed this teacher for this lesson
        if (lesson_id) {
            const { data: existing } = await supabase
                .from("reviews")
                .select("id")
                .eq("student_id", user.id)
                .eq("lesson_id", lesson_id)
                .single();

            if (existing) {
                return NextResponse.json(
                    { error: "You have already reviewed this lesson" },
                    { status: 400 }
                );
            }
        }

        // Create the review
        const { data: review, error } = await supabase
            .from("reviews")
            .insert({
                teacher_id,
                student_id: user.id,
                lesson_id,
                rating,
                content,
                subject,
                approved: true, // Auto-approve for now
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating review:", error);
            return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
        }

        return NextResponse.json({ data: review }, { status: 201 });
    } catch (err) {
        console.error("Review API error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { searchParams } = new URL(request.url);
        const teacherId = searchParams.get("teacher_id");

        if (!teacherId) {
            return NextResponse.json({ error: "Missing teacher_id" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("reviews")
            .select(`
                *,
                student:users!reviews_student_id_fkey (
                    id,
                    full_name,
                    avatar_url
                )
            `)
            .eq("teacher_id", teacherId)
            .eq("approved", true)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching reviews:", error);
            return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
        }

        // Calculate stats
        const total = data.length;
        const average = total > 0
            ? Math.round((data.reduce((sum, r) => sum + r.rating, 0) / total) * 10) / 10
            : 0;
        const breakdown = [5, 4, 3, 2, 1].map(stars => ({
            stars,
            count: data.filter(r => r.rating === stars).length
        }));

        return NextResponse.json({
            data,
            stats: {
                average,
                total,
                breakdown
            }
        });
    } catch (err) {
        console.error("Reviews API error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
