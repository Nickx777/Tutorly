import { createClient } from "@/lib/supabase/client";
import { SupabaseClient } from "@supabase/supabase-js";
import type {
    TeacherProfile,
    StudentProfile,
    Availability,
    Review,
    TeacherStats,
    StudentStats,
    AdminStats,
    User,
} from "@/types/database";

// =====================================================
// Teacher Profile Functions
// =====================================================

export async function getTeacherProfile(userId: string) {
    const supabase = createClient();

    const { data, error } = await supabase
        .from("teacher_profiles")
        .select(
            `
      *,
      user:users!teacher_profiles_user_id_fkey (
        id,
        email,
        full_name,
        avatar_url,
        role
      ),
      packages:teacher_packages (*)
    `
        )
        .eq("user_id", userId)
        .single();

    if (error) throw error;
    return data;
}

export async function getTeacherProfileById(profileId: string) {
    const supabase = createClient();

    const { data, error } = await supabase
        .from("teacher_profiles")
        .select(
            `
      *,
      user:users!teacher_profiles_user_id_fkey (
        id,
        email,
        full_name,
        avatar_url,
        role
      ),
      packages:teacher_packages (*)
    `
        )
        .eq("id", profileId)
        .single();

    if (error) throw error;
    return data;
}

export async function getTeacherByUserId(userId: string) {
    const supabase = createClient();

    const { data, error } = await supabase
        .from("teacher_profiles")
        .select(
            `
      *,
      user:users!teacher_profiles_user_id_fkey (
        id,
        email,
        full_name,
        avatar_url,
        role
      ),
      packages:teacher_packages (*)
    `
        )
        .eq("user_id", userId)
        .single();

    if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows
    return data;
}

export async function updateTeacherProfile(
    userId: string,
    data: Partial<TeacherProfile>
) {
    const supabase = createClient();

    const { error } = await supabase
        .from("teacher_profiles")
        .update({
            ...data,
            updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

    if (error) throw error;
}

// =====================================================
// Student Profile Functions
// =====================================================

export async function upsertStudentProfile(
    userId: string,
    data: Partial<StudentProfile>
) {
    const supabase = createClient();

    const { error } = await supabase.from("student_profiles").upsert({
        user_id: userId,
        interests: data.interests || [],
        languages: data.languages || [],
        updated_at: new Date().toISOString(),
    }, {
        onConflict: 'user_id'
    });

    if (error) throw error;
}

// =====================================================
// Custom Package Functions
// =====================================================

export async function getTeacherPackages(teacherId: string) {
    const supabase = createClient();

    const { data, error } = await supabase
        .from("teacher_packages")
        .select("*")
        .eq("teacher_id", teacherId)
        .order("lesson_count", { ascending: true });

    if (error) throw error;
    return data;
}

export async function updateTeacherPackages(
    teacherProfileId: string,
    packages: any[]
) {
    const supabase = createClient();

    // Delete existing packages
    const { error: deleteError } = await supabase
        .from("teacher_packages")
        .delete()
        .eq("teacher_id", teacherProfileId);

    if (deleteError) throw deleteError;

    // Insert new packages
    if (packages.length > 0) {
        const { error: insertError } = await supabase.from("teacher_packages").insert(
            packages.map((pkg) => ({
                teacher_id: teacherProfileId,
                name: pkg.name,
                lesson_count: pkg.lesson_count,
                price: pkg.price,
                description: pkg.description,
            }))
        );

        if (insertError) throw insertError;
    }
}

export async function createTeacherProfile(
    userId: string,
    data: Partial<TeacherProfile>
) {
    const supabase = createClient();

    const { data: profile, error } = await supabase
        .from("teacher_profiles")
        .insert({
            user_id: userId,
            bio: data.bio || "",
            subjects: data.subjects || [],
            languages: data.languages || [],
            hourly_rate: data.hourly_rate || 0,
            approved: false,
            ...data,
        })
        .select()
        .single();

    if (error) throw error;
    return profile;
}

// =====================================================
// Availability Functions
// =====================================================

export async function getAvailability(teacherId: string) {
    const supabase = createClient();

    const { data, error } = await supabase
        .from("availability")
        .select("*")
        .eq("teacher_id", teacherId)
        .order("day_of_week", { ascending: true })
        .order("start_time", { ascending: true });

    if (error) throw error;
    return data as Availability[];
}

export async function setAvailability(
    teacherId: string,
    slots: Omit<Availability, "id" | "teacher_id">[]
) {
    const supabase = createClient();

    // Delete existing availability
    const { error: deleteError } = await supabase
        .from("availability")
        .delete()
        .eq("teacher_id", teacherId);

    if (deleteError) throw deleteError;

    // Insert new availability
    if (slots.length > 0) {
        const { error: insertError } = await supabase.from("availability").insert(
            slots.map((slot) => ({
                teacher_id: teacherId,
                day_of_week: slot.day_of_week,
                start_time: slot.start_time,
                end_time: slot.end_time,
            }))
        );

        if (insertError) throw insertError;
    }
}

export async function addAvailabilitySlot(
    teacherId: string,
    slot: Omit<Availability, "id" | "teacher_id">
) {
    const supabase = createClient();

    const { error } = await supabase.from("availability").insert({
        teacher_id: teacherId,
        day_of_week: slot.day_of_week,
        start_time: slot.start_time,
        end_time: slot.end_time,
    });

    if (error) throw error;
}

export async function removeAvailabilitySlot(slotId: string) {
    const supabase = createClient();

    const { error } = await supabase
        .from("availability")
        .delete()
        .eq("id", slotId);

    if (error) throw error;
}

// =====================================================
// Lesson/Booking Functions
// =====================================================

interface CreateBookingData {
    teacher_id: string;
    student_id: string;
    subject: string;
    scheduled_at: string;
    duration_minutes: number;
    price: number;
    notes?: string;
    lesson_type?: "one_on_one" | "group";
}

export async function createBooking(data: CreateBookingData) {
    const supabase = createClient();

    const { data: booking, error } = await supabase
        .from("lessons")
        .insert({
            teacher_id: data.teacher_id,
            student_id: data.student_id,
            subject: data.subject,
            scheduled_at: data.scheduled_at,
            duration_minutes: data.duration_minutes,
            price: data.price,
            notes: data.notes,
            lesson_type: data.lesson_type || "one_on_one",
            status: "scheduled",
        })
        .select()
        .single();

    if (error) throw error;
    return booking;
}

export async function getLessonsForTeacher(teacherId: string, supabaseClient?: SupabaseClient) {
    const supabase = supabaseClient || createClient();

    // Fetch lessons without joins to avoid FK name issues
    const { data: lessons, error } = await supabase
        .from("lessons")
        .select("*")
        .eq("teacher_id", teacherId)
        .order("scheduled_at", { ascending: true });

    if (error) throw error;
    if (!lessons || lessons.length === 0) return [];

    // Fetch student info separately
    const studentIds = [...new Set(lessons.map((l: any) => l.student_id).filter(Boolean))];
    const { data: students } = await supabase
        .from("users")
        .select("id, full_name, avatar_url, email")
        .in("id", studentIds);

    const studentMap = new Map(students?.map((s: any) => [s.id, s]) || []);

    return lessons.map((lesson: any) => ({
        ...lesson,
        student: studentMap.get(lesson.student_id) || null
    }));
}

export async function getLessonsForStudent(studentId: string, supabaseClient?: SupabaseClient) {
    const supabase = supabaseClient || createClient();

    // Fetch lessons without joins to avoid FK name issues
    const { data: lessons, error } = await supabase
        .from("lessons")
        .select("*")
        .eq("student_id", studentId)
        .order("scheduled_at", { ascending: true });

    if (error) throw error;
    if (!lessons || lessons.length === 0) return [];

    // Fetch teacher info separately
    const teacherIds = [...new Set(lessons.map((l: any) => l.teacher_id).filter(Boolean))];
    const { data: teachers } = await supabase
        .from("users")
        .select("id, full_name, avatar_url, email")
        .in("id", teacherIds);

    const teacherMap = new Map(teachers?.map((t: any) => [t.id, t]) || []);

    return lessons.map((lesson: any) => ({
        ...lesson,
        teacher: teacherMap.get(lesson.teacher_id) || null
    }));
}

export async function getUpcomingLessons(userId: string, role: "teacher" | "student", supabaseClient?: SupabaseClient) {
    const supabase = supabaseClient || createClient();

    const column = role === "teacher" ? "teacher_id" : "student_id";
    const otherColumn = role === "teacher" ? "student_id" : "teacher_id";

    // Fetch lessons without joins to avoid FK name issues
    const { data: lessons, error } = await supabase
        .from("lessons")
        .select("*")
        .eq(column, userId)
        .in("status", ["scheduled", "pending"]) // Fetch both scheduled and pending
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true })
        .limit(10);

    if (error) throw error;
    if (!lessons || lessons.length === 0) return [];

    // Fetch related user info separately
    const otherUserIds = [...new Set(lessons.map((l: any) => l[otherColumn as keyof typeof l] as string).filter(Boolean))];
    const { data: users } = await supabase
        .from("users")
        .select("id, full_name, avatar_url")
        .in("id", otherUserIds);

    const userMap = new Map(users?.map((u: any) => [u.id, u]) || []);
    const fieldName = role === "teacher" ? "student" : "teacher";

    return lessons.map((lesson: any) => ({
        ...lesson,
        [fieldName]: userMap.get(lesson[otherColumn as keyof typeof lesson] as string) || null
    }));
}

export async function getPastLessons(userId: string, role: "teacher" | "student") {
    const supabase = createClient();

    const column = role === "teacher" ? "teacher_id" : "student_id";

    const { data, error } = await supabase
        .from("lessons")
        .select("*")
        .eq(column, userId)
        .or(`status.eq.completed,scheduled_at.lt.${new Date().toISOString()}`)
        .order("scheduled_at", { ascending: false })
        .limit(10);

    if (error) throw error;
    return data;
}

export async function updateLessonStatus(
    lessonId: string,
    status: "scheduled" | "completed" | "cancelled"
) {
    const supabase = createClient();

    const { error } = await supabase
        .from("lessons")
        .update({ status })
        .eq("id", lessonId);

    if (error) throw error;
}

export async function getAllLessons(filters?: {
    status?: string;
    teacherId?: string;
    startDate?: string;
    endDate?: string;
}) {
    const supabase = createClient();

    let query = supabase
        .from("lessons")
        .select("*")
        .order("scheduled_at", { ascending: false });

    if (filters?.status) {
        query = query.eq("status", filters.status);
    }
    if (filters?.teacherId) {
        query = query.eq("teacher_id", filters.teacherId);
    }
    if (filters?.startDate) {
        query = query.gte("scheduled_at", filters.startDate);
    }
    if (filters?.endDate) {
        query = query.lte("scheduled_at", filters.endDate);
    }

    const { data: lessons, error } = await query;

    if (error) throw error;
    if (!lessons || lessons.length === 0) return [];

    // Fetch user info separately
    const teacherIds = [...new Set(lessons.map((l: any) => l.teacher_id).filter(Boolean))];
    const studentIds = [...new Set(lessons.map((l: any) => l.student_id).filter(Boolean))];
    const allUserIds = [...new Set([...teacherIds, ...studentIds])];

    const { data: users } = await supabase
        .from("users")
        .select("id, full_name, email, avatar_url")
        .in("id", allUserIds);

    const userMap = new Map(users?.map((u: any) => [u.id, u]) || []);

    return lessons.map((lesson: any) => ({
        ...lesson,
        teacher: userMap.get(lesson.teacher_id) || null,
        student: userMap.get(lesson.student_id) || null
    }));
}

// =====================================================
// Review Functions
// =====================================================

export async function getReviewsForTeacher(teacherId: string, supabaseClient?: SupabaseClient) {
    const supabase = supabaseClient || createClient();

    // Fetch reviews without joins to avoid FK name issues
    const { data: reviews, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("teacher_id", teacherId)
        .eq("approved", true)
        .order("created_at", { ascending: false });

    if (error) throw error;
    if (!reviews || reviews.length === 0) return [];

    // Fetch student info separately
    const studentIds = [...new Set(reviews.map((r: any) => r.student_id).filter(Boolean))];
    const { data: students } = await supabase
        .from("users")
        .select("id, full_name, avatar_url")
        .in("id", studentIds);

    const studentMap = new Map(students?.map((s: any) => [s.id, s]) || []);

    return reviews.map((review: any) => ({
        ...review,
        student: studentMap.get(review.student_id) || null
    }));
}

export async function createReview(data: {
    teacher_id: string;
    student_id: string;
    lesson_id?: string;
    rating: number;
    content?: string;
    subject?: string;
}) {
    const supabase = createClient();

    const { error } = await supabase.from("reviews").insert({
        teacher_id: data.teacher_id,
        student_id: data.student_id,
        lesson_id: data.lesson_id,
        rating: data.rating,
        content: data.content,
        subject: data.subject,
        approved: true, // Auto-approve for now
    });

    if (error) throw error;
}

export async function getTeacherRatingStats(teacherId: string) {
    const supabase = createClient();

    const { data, error } = await supabase
        .from("reviews")
        .select("rating")
        .eq("teacher_id", teacherId)
        .eq("approved", true);

    if (error) throw error;

    if (!data || data.length === 0) {
        return {
            average: 0,
            total: 0,
            breakdown: [
                { stars: 5, count: 0 },
                { stars: 4, count: 0 },
                { stars: 3, count: 0 },
                { stars: 2, count: 0 },
                { stars: 1, count: 0 },
            ],
        };
    }

    const total = data.length;
    const average = data.reduce((sum: number, r: any) => sum + r.rating, 0) / total;
    const breakdown = [5, 4, 3, 2, 1].map((stars: number) => ({
        stars,
        count: data.filter((r: any) => r.rating === stars).length,
    }));

    return { average: Math.round(average * 10) / 10, total, breakdown };
}

// =====================================================
// Stats Functions
// =====================================================

export async function getTeacherStats(teacherId: string, supabaseClient?: SupabaseClient): Promise<TeacherStats> {
    const supabase = supabaseClient || createClient();

    // Get lesson stats
    const { data: lessons } = await supabase
        .from("lessons")
        .select("id, student_id, status, scheduled_at")
        .eq("teacher_id", teacherId);

    // Get payment stats
    const { data: payments } = await supabase
        .from("payments")
        .select("teacher_payout, status")
        .eq("teacher_id", teacherId);

    // Get review stats
    const { data: reviews } = await supabase
        .from("reviews")
        .select("rating")
        .eq("teacher_id", teacherId)
        .eq("approved", true);

    const now = new Date();
    const uniqueStudents = new Set(lessons?.map((l: any) => l.student_id) || []);

    return {
        total_lessons: lessons?.length || 0,
        total_students: uniqueStudents.size,
        total_earnings:
            payments
                ?.filter((p: any) => p.status === "completed")
                .reduce((sum: number, p: any) => sum + (p.teacher_payout || 0), 0) || 0,
        pending_earnings:
            payments
                ?.filter((p: any) => p.status === "pending")
                .reduce((sum: number, p: any) => sum + (p.teacher_payout || 0), 0) || 0,
        average_rating:
            reviews && reviews.length > 0
                ? Math.round(
                    (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length) * 10
                ) / 10
                : 0,
        upcoming_lessons:
            lessons?.filter(
                (l: any) => l.status === "scheduled" && new Date(l.scheduled_at) > now
            ).length || 0,
    };
}

export async function getStudentStats(studentId: string): Promise<StudentStats> {
    const supabase = createClient();

    // Get lesson stats
    const { data: lessons } = await supabase
        .from("lessons")
        .select("id, subject, status, scheduled_at")
        .eq("student_id", studentId);

    // Get payment stats
    const { data: payments } = await supabase
        .from("payments")
        .select("amount, status")
        .eq("student_id", studentId);

    const now = new Date();

    // Count subject frequency
    const subjectCounts: Record<string, number> = {};
    lessons?.forEach((l: any) => {
        if (l.subject) {
            subjectCounts[l.subject] = (subjectCounts[l.subject] || 0) + 1;
        }
    });
    const favoriteSubjects = Object.entries(subjectCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([subject]) => subject);

    return {
        total_lessons: lessons?.length || 0,
        total_spent:
            payments
                ?.filter((p: any) => p.status === "succeeded" || p.status === "completed")
                .reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0,
        upcoming_lessons:
            lessons?.filter(
                (l: any) => l.status === "scheduled" && new Date(l.scheduled_at) > now
            ).length || 0,
        favorite_subjects: favoriteSubjects,
    };
}

export async function getAdminStats(): Promise<AdminStats> {
    const supabase = createClient();

    // Get user counts
    const { count: totalUsers } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true });

    const { count: totalTeachers } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("role", "teacher");

    const { count: totalStudents } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("role", "student");

    // Get pending approvals
    const { count: pendingApprovals } = await supabase
        .from("teacher_profiles")
        .select("*", { count: "exact", head: true })
        .eq("approved", false);

    // Get payment stats
    const { data: payments } = await supabase
        .from("payments")
        .select("amount, commission_amount, status");

    const completedPayments = payments?.filter(
        (p: any) => p.status === "completed" || p.status === "succeeded"
    );

    // Get today's lessons
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { count: activeLessonsToday } = await supabase
        .from("lessons")
        .select("*", { count: "exact", head: true })
        .gte("scheduled_at", today.toISOString())
        .lt("scheduled_at", tomorrow.toISOString());

    return {
        total_users: totalUsers || 0,
        total_teachers: totalTeachers || 0,
        total_students: totalStudents || 0,
        pending_approvals: pendingApprovals || 0,
        total_revenue:
            completedPayments?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0,
        platform_commission:
            completedPayments?.reduce((sum: number, p: any) => sum + (p.commission_amount || 0), 0) ||
            0,
        active_lessons_today: activeLessonsToday || 0,
    };
}

// =====================================================
// Admin User Management Functions
// =====================================================

export async function getAllUsers(filters?: {
    role?: string;
    search?: string;
    suspended?: boolean;
}) {
    const supabase = createClient();

    let query = supabase
        .from("users")
        .select(
            `
      *,
      teacher_profile:teacher_profiles (
        id,
        approved,
        subjects,
        hourly_rate
      )
    `
        )
        .order("created_at", { ascending: false });

    if (filters?.role) {
        query = query.eq("role", filters.role);
    }
    if (filters?.search) {
        query = query.or(
            `full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
        );
    }
    if (filters?.suspended !== undefined) {
        query = query.eq("suspended", filters.suspended);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
}

export async function updateUserStatus(
    userId: string,
    updates: { suspended?: boolean; suspended_reason?: string; role?: string }
) {
    const supabase = createClient();

    const updateData: Record<string, unknown> = { ...updates };
    if (updates.suspended !== undefined) {
        updateData.suspended_at = updates.suspended ? new Date().toISOString() : null;
        if (updates.suspended === false) {
            updateData.suspended_reason = null; // Clear reason on unsuspend
        }
    }

    const { error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", userId);

    if (error) throw error;

    // If suspending a teacher, cancel their future lessons
    if (updates.suspended === true) {
        // Check if user is a teacher
        const { data: user } = await supabase.from("users").select("role").eq("id", userId).single();

        if (user?.role === "teacher") {
            const now = new Date().toISOString();
            // Find all future scheduled lessons
            const { data: lessons } = await supabase
                .from("lessons")
                .select("id")
                .eq("teacher_id", userId)
                .eq("status", "scheduled")
                .gt("scheduled_at", now);

            if (lessons && lessons.length > 0) {
                const lessonIds = lessons.map((l: any) => l.id);
                // Update them to cancelled
                await supabase
                    .from("lessons")
                    .update({ status: "cancelled" })
                    .in("id", lessonIds);
            }
        }
    }
}

export async function approveTeacher(userId: string) {
    const supabase = createClient();

    const { error } = await supabase
        .from("teacher_profiles")
        .update({ approved: true, show_approval_notification: true })
        .eq("user_id", userId);

    if (error) throw error;
}

export async function dismissApprovalNotification(userId: string) {
    const supabase = createClient();

    const { error } = await supabase
        .from("teacher_profiles")
        .update({ show_approval_notification: false })
        .eq("user_id", userId);

    if (error) throw error;
}

export async function getPendingTeachers() {
    const supabase = createClient();

    const { data, error } = await supabase
        .from("teacher_profiles")
        .select(
            `
      *,
      user:users!teacher_profiles_user_id_fkey (
        id,
        full_name,
        email,
        avatar_url,
        created_at
      )
    `
        )
        .eq("approved", false)
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
}

// =====================================================
// Browse Teachers Functions
// =====================================================

export async function browseTeachers(filters?: {
    subject?: string;
    language?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
}, supabaseClient?: SupabaseClient) {
    const supabase = supabaseClient || createClient();

    let query = supabase
        .from("teacher_profiles")
        .select(
            `
      *,
      user:users!teacher_profiles_user_id_fkey (
        id,
        full_name,
        avatar_url
      )
    `
        )
        .eq("approved", true);

    if (filters?.subject) {
        query = query.contains("subjects", [filters.subject]);
    }
    if (filters?.language) {
        query = query.contains("languages", [filters.language]);
    }
    if (filters?.minPrice) {
        query = query.gte("hourly_rate", filters.minPrice);
    }
    if (filters?.maxPrice) {
        query = query.lte("hourly_rate", filters.maxPrice);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Get teachers who have availability slots in either table
    const [generalSlots, dateSlots] = await Promise.all([
        supabase
            .from("availability")
            .select("teacher_id"),
        supabase
            .from("date_availability")
            .select("teacher_id")
    ]);

    const teacherIdsWithAvailability = new Set([
        ...(generalSlots.data || []).map((slot: any) => slot.teacher_id),
        ...(dateSlots.data || []).map((slot: any) => slot.teacher_id)
    ]);

    // Filter to only teachers with availability slots
    const teachersWithSlots = (data || []).filter((teacher: any) =>
        teacherIdsWithAvailability.has(teacher.id)
    );

    // Add rating info for each teacher
    const teachersWithRatings = await Promise.all(
        teachersWithSlots.map(async (teacher: any) => {
            const ratingStats = await getTeacherRatingStats(teacher.user_id);
            return {
                ...teacher,
                average_rating: ratingStats.average,
                total_reviews: ratingStats.total,
            };
        })
    );

    // Filter by rating if specified
    if (filters?.minRating) {
        return teachersWithRatings.filter(
            (t) => t.average_rating >= (filters.minRating || 0)
        );
    }

    return teachersWithRatings;
}

export async function getRecommendedTeachers(studentId: string, supabaseClient?: SupabaseClient) {
    const supabase = supabaseClient || createClient();

    // 1. Get student profile interests and languages
    const { data: profile } = await supabase
        .from("student_profiles")
        .select("interests, languages")
        .eq("user_id", studentId)
        .single();

    if (!profile) {
        // Fallback to general browse if no profile
        return browseTeachers();
    }

    // 2. Query teachers
    const { data: teachers, error } = await supabase
        .from("teacher_profiles")
        .select(`
            *,
            user:users!teacher_profiles_user_id_fkey (
                id,
                full_name,
                avatar_url
            )
        `)
        .eq("approved", true);

    if (error) throw error;

    const studentInterests = profile.interests || [];
    const studentLanguages = profile.languages || [];

    // Calculate match score
    const teachersWithScores = await Promise.all((teachers || []).map(async (teacher: any) => {
        let score = 0;

        // Subject match (+2 per subject)
        const teacherSubjects = teacher.subjects || [];
        const commonSubjects = teacherSubjects.filter((s: string) => studentInterests.includes(s));
        score += commonSubjects.length * 2;

        // Language match (+3 per language)
        const teacherLanguages = teacher.languages || [];
        const commonLanguages = teacherLanguages.filter((l: string) => studentLanguages.includes(l));
        score += commonLanguages.length * 3;

        const ratingStats = await getTeacherRatingStats(teacher.user_id);

        return {
            ...teacher,
            average_rating: ratingStats.average,
            total_reviews: ratingStats.total,
            match_score: score
        };
    }));

    // Sort by match score descending, then rating
    return teachersWithScores
        .sort((a, b) => b.match_score - a.match_score || b.average_rating - a.average_rating)
        .slice(0, 6);
}

// =====================================================
// User Profile Functions
// =====================================================

export async function getUserProfile(userId: string) {
    const supabase = createClient();

    const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

    if (error) throw error;
    return data as User;
}

export async function updateUserProfile(
    userId: string,
    data: Partial<User>
) {
    const supabase = createClient();

    const { error } = await supabase
        .from("users")
        .update({
            ...data,
            updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

    if (error) throw error;
}

export async function getUnreadMessagesCount(userId: string): Promise<number> {
    const supabase = createClient();

    const { count, error } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", userId)
        .eq("read", false);

    if (error) {
        console.error("Error fetching unread messages count:", error);
        return 0;
    }

    return count || 0;
}

export async function uploadAvatar(userId: string, file: File) {
    const supabase = createClient();
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

    await updateUserProfile(userId, { avatar_url: publicUrl });

    return publicUrl;
}

export async function getUserById(userId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
        .from("users")
        .select("id, full_name, avatar_url")
        .eq("id", userId)
        .single();

    if (error) throw error;
    return data;
}
// =====================================================
// Platform Settings & System Functions
// =====================================================

export async function getPlatformSettings(key: string) {
    const supabase = createClient();
    const { data, error } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", key)
        .single();

    if (error && error.code !== "PGRST116") throw error;
    return data?.value || null;
}

export async function updatePlatformSettings(key: string, value: any) {
    const supabase = createClient();
    const { error } = await supabase
        .from("platform_settings")
        .upsert({ key, value }, { onConflict: "key" });

    if (error) throw error;
}

export async function getSystemStatus() {
    const supabase = createClient();

    // Check Database (simple query)
    const startDb = performance.now();
    const { error: dbError } = await supabase.from("users").select("count").limit(1).single();
    const dbLatency = Math.round(performance.now() - startDb);

    // Check Auth (session check)
    const { error: authError } = await supabase.auth.getSession();

    // Check Storage (list buckets)
    const { error: storageError } = await supabase.storage.listBuckets();

    return {
        database: !dbError,
        auth: !authError,
        storage: !storageError,
        realtime: true, // Hard to check from here without subscription
        latency: {
            database: dbLatency
        }
    };
}
// =====================================================
// Date-Specific Availability Functions
// =====================================================

export async function getDateAvailability(teacherId: string, startDate?: string, endDate?: string) {
    const supabase = createClient();

    let query = supabase
        .from("date_availability")
        .select("*")
        .eq("teacher_id", teacherId);

    if (startDate) {
        query = query.gte("available_date", startDate);
    }
    if (endDate) {
        query = query.lte("available_date", endDate);
    }

    const { data, error } = await query.order("available_date").order("start_time");

    if (error) throw error;
    return data;
}

export async function saveDateAvailability(slots: any[]) {
    const supabase = createClient();

    if (slots.length === 0) return;

    const { error } = await supabase
        .from("date_availability")
        .upsert(slots);

    if (error) throw error;
}

export async function deleteDateAvailability(slotId: string) {
    const supabase = createClient();
    const { error } = await supabase
        .from("date_availability")
        .delete()
        .eq("id", slotId);

    if (error) throw error;
}
