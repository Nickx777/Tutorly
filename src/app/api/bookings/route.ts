import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { pushLessonToGoogleCalendar } from "@/lib/google-calendar";
import { createMeetingForLesson } from "@/lib/zoom";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { teacher_id, subject, scheduled_at, duration_minutes, price, notes, lesson_type, package_id } = body;

        // Validate required fields
        if (!teacher_id || !subject || !scheduled_at || !duration_minutes) {
            return NextResponse.json(
                { error: "Missing required fields: teacher_id, subject, scheduled_at, duration_minutes" },
                { status: 400 }
            );
        }

        // Check for conflicts
        const startTime = new Date(scheduled_at);
        const endTime = new Date(startTime.getTime() + duration_minutes * 60000);

        // Check if STUDENT already has a lesson at this time
        const { data: studentLessons, error: studentConflictError } = await supabase
            .from("lessons")
            .select("scheduled_at, duration_minutes")
            .eq("student_id", user.id)
            .neq("status", "cancelled")
            .gte("scheduled_at", new Date(startTime.getTime() - 24 * 60 * 60000).toISOString())
            .lte("scheduled_at", new Date(endTime.getTime() + 24 * 60 * 60000).toISOString());

        if (studentConflictError) {
            console.error("Error checking student conflicts:", studentConflictError);
        }

        const hasStudentConflict = studentLessons?.some(lesson => {
            const lStart = new Date(lesson.scheduled_at);
            const lEnd = new Date(lStart.getTime() + lesson.duration_minutes * 60000);
            return (startTime < lEnd && endTime > lStart);
        });

        if (hasStudentConflict) {
            return NextResponse.json({ error: "You already have a lesson scheduled at this time" }, { status: 409 });
        }

        // Fetch existing lessons for TEACHER in the time range
        const { data: existingLessons, error: conflictError } = await supabase
            .from("lessons")
            .select("scheduled_at, duration_minutes, lesson_type")
            .eq("teacher_id", teacher_id)
            .neq("status", "cancelled")
            .gte("scheduled_at", new Date(startTime.getTime() - 24 * 60 * 60000).toISOString())
            .lte("scheduled_at", new Date(endTime.getTime() + 24 * 60 * 60000).toISOString());

        if (conflictError) {
            console.error("Error checking conflicts:", conflictError);
            console.error("Conflict Query Params:", { teacher_id, startTime, endTime });
            return NextResponse.json({
                error: "Failed to check availability",
                details: conflictError.message,
                code: conflictError.code
            }, { status: 500 });
        }

        const isConflict = await (async () => {
            // Check provided lesson type
            if (lesson_type === "group") {
                // For group lessons, check if there are existing group lessons at the EXACT same time
                // and if the max capacity hasn't been reached.

                // Filter for lessons that are exactly at the same time
                const sameSlotLessons = existingLessons?.filter(l =>
                    new Date(l.scheduled_at).getTime() === startTime.getTime() &&
                    l.duration_minutes === duration_minutes
                ) || [];

                // If no lessons at this time, we need to check for overlaps with other lessons (e.g. 1-on-1)
                // If there are ANY overlapping lessons that are NOT this exact group slot, it's a conflict.
                const overlappingNonGroup = existingLessons?.some(l => {
                    const lStart = new Date(l.scheduled_at);
                    const lEnd = new Date(lStart.getTime() + l.duration_minutes * 60000);

                    // Exact match is fine (we handle capacity below), but partial overlap is bad
                    if (lStart.getTime() === startTime.getTime() && l.duration_minutes === duration_minutes) {
                        return l.lesson_type !== "group"; // Conflict if 1-on-1 is already there
                    }

                    // Partial overlap
                    return (startTime < lEnd && endTime > lStart);
                });

                if (overlappingNonGroup) return true;

                // Now check capacity for this group slot
                if (sameSlotLessons.length > 0) {
                    // Get max students from availability
                    const dayOfWeek = startTime.getUTCDay();
                    // Use UTC hours/minutes for consistent matching
                    const hours = startTime.getUTCHours().toString().padStart(2, '0');
                    const minutes = startTime.getUTCMinutes().toString().padStart(2, '0');
                    const startTimeStr = `${hours}:${minutes}`;

                    console.log("Debug Group Booking:", {
                        startTime: startTime.toISOString(),
                        dayOfWeek,
                        startTimeStr,
                        teacher_id
                    });

                    // Fetch all availability for this teacher for the specific date
                    const dateStr = startTime.toISOString().split('T')[0];
                    const { data: availabilitySlots, error: availError } = await supabase
                        .from("date_availability")
                        .select("max_students, start_time, available_date")
                        .eq("teacher_id", teacher_id)
                        .eq("available_date", dateStr);

                    if (availError) {
                        console.log("Debug Availability Lookup Error:", availError);
                    }

                    // Find matching slot in JS
                    const matchedSlot = availabilitySlots?.find(slot => {
                        const slotTime = slot.start_time.substring(0, 5); // Take HH:MM
                        return slotTime === startTimeStr;
                    });

                    console.log("Debug Matched Slot:", matchedSlot);
                    console.log("Date availability slots:", availabilitySlots);

                    // Use max_students from matched slot, or default to 1 for non-group (though this block is for group)
                    const maxStudents = matchedSlot?.max_students || 10;

                    console.log("Capacity Check:", {
                        current: sameSlotLessons.length,
                        max: maxStudents,
                        isFull: sameSlotLessons.length >= maxStudents
                    });

                    if (sameSlotLessons.length >= maxStudents) {
                        return true; // Full
                    }
                    return false; // Available
                }

                return false; // No existing lessons, so free
            } else {
                // One-on-One: ANY overlap is a conflict
                return existingLessons?.some(lesson => {
                    const lStart = new Date(lesson.scheduled_at);
                    const lEnd = new Date(lStart.getTime() + lesson.duration_minutes * 60000);
                    return (startTime < lEnd && endTime > lStart);
                });
            }
        })();

        if (isConflict) {
            return NextResponse.json({ error: "This time slot is already booked" }, { status: 409 });
        }

        // Check teacher's auto-accept setting
        const { data: teacherProfile } = await supabase
            .from("teacher_profiles")
            .select("auto_accept_bookings")
            .eq("user_id", teacher_id)
            .single();

        const autoAccept = teacherProfile?.auto_accept_bookings ?? true; // Default to true if not set
        const initialStatus = autoAccept ? "scheduled" : "pending";

        // Get student name for notification
        const { data: studentData } = await supabase
            .from("users")
            .select("full_name")
            .eq("id", user.id)
            .single();
        const studentName = studentData?.full_name || "A student";

        let studentPackageId = null;

        // If package_id is provided, create a student_package
        if (package_id) {
            const { data: pkgData, error: pkgError } = await supabase
                .from("teacher_packages")
                .select("lesson_count, price")
                .eq("id", package_id)
                .single();

            if (pkgError) {
                console.error("Error fetching package info:", pkgError);
                return NextResponse.json({ error: "Invalid package" }, { status: 400 });
            }

            // Create student package record
            const { data: studentPkg, error: studentPkgError } = await supabase
                .from("student_packages")
                .insert({
                    student_id: user.id,
                    teacher_id,
                    package_id,
                    total_lessons: pkgData.lesson_count,
                    remaining_lessons: pkgData.lesson_count - 1, // First lesson is this one
                    status: "active"
                })
                .select()
                .single();

            if (studentPkgError) {
                console.error("Error creating student package:", studentPkgError);
                return NextResponse.json({ error: "Failed to record package purchase" }, { status: 500 });
            }

            studentPackageId = studentPkg.id;
        }

        // Create the booking
        const { data: booking, error } = await supabase
            .from("lessons")
            .insert({
                teacher_id,
                student_id: user.id,
                subject,
                scheduled_at,
                duration_minutes,
                price: price || 0,
                notes,
                lesson_type: lesson_type || "one_on_one",
                status: initialStatus,
                package_id: package_id || null,
                student_package_id: studentPackageId
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating booking:", error);
            return NextResponse.json({
                error: "Failed to create booking",
                details: error.message,
                code: error.code,
                hint: error.hint
            }, { status: 500 });
        }

        // Auto-create Zoom meeting if teacher has Zoom connected
        if (initialStatus === "scheduled") {
            try {
                // Check if teacher has Zoom connected
                const zoomMeeting = await createMeetingForLesson(teacher_id, {
                    subject,
                    studentName,
                    scheduledAt: new Date(scheduled_at),
                    durationMinutes: duration_minutes,
                });

                if (zoomMeeting) {
                    // Update lesson with Zoom link
                    const { error: updateError } = await supabase
                        .from("lessons")
                        .update({
                            zoom_link: zoomMeeting.joinUrl,
                            zoom_meeting_id: zoomMeeting.meetingId,
                        })
                        .eq("id", booking.id);

                    if (updateError) {
                        console.error("Failed to update lesson with Zoom link:", updateError);
                    } else {
                        // Update booking object for response
                        booking.zoom_link = zoomMeeting.joinUrl;
                        console.log("Zoom meeting created for lesson:", booking.id);
                    }
                } else {
                    console.log("Teacher does not have Zoom connected, skipping meeting creation.");
                }
            } catch (zoomError) {
                // Log error but don't fail the booking
                console.error("Failed to create Zoom meeting in POST:", zoomError);
            }
        }

        // Sync to Google Calendar if auto-accepted
        if (initialStatus === "scheduled") {
            const { pushLessonToGoogleCalendar } = await import("@/lib/google-calendar");
            pushLessonToGoogleCalendar(booking.id).catch(err =>
                console.error("Failed to sync new booking to Google Calendar:", err)
            );
        }

        // Create notification for teacher
        const scheduledDate = new Date(scheduled_at).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });

        await supabase.from("notifications").insert({
            user_id: teacher_id,
            type: autoAccept ? "booking_accepted" : "booking_request",
            title: autoAccept ? "New Lesson Booked" : "New Booking Request",
            message: autoAccept
                ? `${studentName} has booked a ${subject} lesson for ${scheduledDate}.`
                : `${studentName} wants to book a ${subject} lesson for ${scheduledDate}. Please review and accept or decline.`,
            data: { lesson_id: booking.id, student_id: user.id, subject, scheduled_at }
        });

        // Create notification for teacher ...

        // Push to Google Calendar in background (no await to avoid blocking)
        if (initialStatus === "scheduled") {
            pushLessonToGoogleCalendar(booking.id).catch(console.error);
        }

        return NextResponse.json({
            data: booking,
            autoAccept,
            status: initialStatus
        }, { status: 201 });
    } catch (err) {
        console.error("Booking API error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const role = searchParams.get("role") || "student";
        const status = searchParams.get("status");

        // Build query based on role
        const column = role === "teacher" ? "teacher_id" : "student_id";
        const joinColumn = role === "teacher" ? "student_id" : "teacher_id";

        let query = supabase
            .from("lessons")
            .select(`
                *,
                ${role === "teacher" ? "student" : "teacher"}:users!lessons_${joinColumn}_fkey (
                    id,
                    full_name,
                    avatar_url,
                    email
                )
            `)
            .eq(column, user.id)
            .order("scheduled_at", { ascending: true });

        if (status) {
            query = query.eq("status", status);
        }

        const { data, error } = await query;

        if (error) {
            console.error("Error fetching bookings:", error);
            return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (err) {
        console.error("Bookings API error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { lesson_id, status, scheduled_at, notes } = body;

        if (!lesson_id) {
            return NextResponse.json({ error: "Missing lesson_id" }, { status: 400 });
        }

        // Check if user is part of this lesson
        const { data: lesson, error: fetchError } = await supabase
            .from("lessons")
            .select("teacher_id, student_id, subject, scheduled_at")
            .eq("id", lesson_id)
            .single();

        if (fetchError || !lesson) {
            return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
        }

        if (lesson.teacher_id !== user.id && lesson.student_id !== user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Build update object
        const updates: Record<string, unknown> = {};
        if (status) updates.status = status;
        if (scheduled_at) updates.scheduled_at = scheduled_at;
        if (notes !== undefined) updates.notes = notes;

        const { data: updated, error } = await supabase
            .from("lessons")
            .update(updates)
            .eq("id", lesson_id)
            .select()
            .single();

        if (error) {
            console.error("Error updating booking:", error);
            return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
        }

        // Create notification for the other party when status changes
        if (status) {
            const isTeacherAction = user.id === lesson.teacher_id;
            const notifyUserId = isTeacherAction ? lesson.student_id : lesson.teacher_id;

            // Get the actor's name
            const { data: actorData } = await supabase
                .from("users")
                .select("full_name")
                .eq("id", user.id)
                .single();
            const actorName = actorData?.full_name || (isTeacherAction ? "The teacher" : "The student");

            const scheduledDate = new Date(lesson.scheduled_at).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
            });

            let notificationType = "system";
            let notificationTitle = "";
            let notificationMessage = "";

            if (status === "scheduled" || status === "confirmed") {
                notificationType = "booking_accepted";
                notificationTitle = "Booking Accepted! ✅";
                notificationMessage = `${actorName} has accepted your ${lesson.subject} lesson for ${scheduledDate}.`;
            } else if (status === "cancelled") {
                notificationType = "booking_cancelled";
                notificationTitle = "Booking Cancelled";
                notificationMessage = `${actorName} has cancelled the ${lesson.subject} lesson scheduled for ${scheduledDate}.`;
            } else if (status === "rejected") {
                notificationType = "booking_rejected";
                notificationTitle = "Booking Declined";
                notificationMessage = `${actorName} has declined your ${lesson.subject} lesson request for ${scheduledDate}.`;
            }

            if (notificationTitle) {
                await supabase.from("notifications").insert({
                    user_id: notifyUserId,
                    type: notificationType,
                    title: notificationTitle,
                    message: notificationMessage,
                    data: { lesson_id, subject: lesson.subject, scheduled_at: lesson.scheduled_at }
                });
            }

            // Sync to Google Calendar if status changed to scheduled/confirmed
            if (status === "scheduled" || status === "confirmed") {
                pushLessonToGoogleCalendar(lesson_id).catch(console.error);

                // ALSO: Create Zoom meeting if it doesn't exist yet
                if (!updated.zoom_link) {
                    try {
                        // Get student name for the meeting topic
                        const { data: studentData } = await supabase
                            .from("users")
                            .select("full_name")
                            .eq("id", updated.student_id)
                            .single();

                        const studentName = studentData?.full_name || "A student";

                        const zoomMeeting = await createMeetingForLesson(updated.teacher_id, {
                            subject: updated.subject,
                            studentName,
                            scheduledAt: new Date(updated.scheduled_at),
                            durationMinutes: updated.duration_minutes,
                        });

                        if (zoomMeeting) {
                            await supabase
                                .from("lessons")
                                .update({
                                    zoom_link: zoomMeeting.joinUrl,
                                    zoom_meeting_id: zoomMeeting.meetingId,
                                })
                                .eq("id", lesson_id);

                            console.log("Zoom meeting created for approved lesson:", lesson_id);
                        }
                    } catch (zoomError) {
                        console.error("Failed to create Zoom meeting on approval:", zoomError);
                    }
                }
            }
        }

        return NextResponse.json({ data: updated });
    } catch (err) {
        console.error("Booking update API error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
