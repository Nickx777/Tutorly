// Database types for Tutorly

export type UserRole = "student" | "teacher" | "admin";

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

export type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded";

export type LessonType = "one_on_one" | "group";

export interface User {
    id: string;
    email: string;
    full_name: string;
    avatar_url?: string;
    role: UserRole;
    suspended?: boolean;
    suspended_reason?: string;
    suspended_at?: string;
    created_at: string;
    updated_at?: string;
    onboarding_completed?: boolean;
    calendar_token?: string;
    google_refresh_token?: string;
    zoom_access_token?: string;
    zoom_refresh_token?: string;
    zoom_token_expires_at?: string;
    zoom_user_id?: string;
}

export interface StudentProfile {
    id: string;
    user_id: string;
    interests: string[];
    languages: string[];
    grade_level?: string; // e.g. "10th Grade"
    created_at: string;
    updated_at?: string;
}

export interface TeacherProfile {
    id: string;
    user_id: string;
    bio?: string;
    title?: string;
    location?: string;
    website?: string;
    photo_url?: string;
    subjects: string[];
    languages: string[];
    target_grades?: string[]; // e.g. ["10th Grade", "11th Grade"]
    hourly_rate: number;
    group_rate?: number | null;
    timezone: string;
    auto_accept_bookings?: boolean;
    // Availability Settings
    buffer_minutes?: number;
    is_buffer_enabled?: boolean;

    approved: boolean;
    show_approval_notification?: boolean;
    created_at: string;
    updated_at?: string;
    // Joined fields
    user?: User;
    average_rating?: number;
    total_reviews?: number;
    total_lessons?: number;
    packages?: TeacherPackage[];
}

export interface Availability {
    id: string;
    teacher_id: string;
    day_of_week: number; // 0 = Sunday, 6 = Saturday
    start_time: string; // HH:mm format
    end_time: string;
    subject?: string; // Tutors can choose a specific subject for a slot
    pattern_id?: string; // Link to a recurring pattern
}

export interface TeacherTimeOff {
    id: string;
    teacher_id: string;
    start_date: string; // YYYY-MM-DD
    end_date: string;   // YYYY-MM-DD
    reason?: string;
    created_at: string;
}

export interface AvailabilityPattern {
    id: string;
    teacher_id: string;
    name: string;
    days_of_week: number[];
    start_time: string;
    duration_minutes: number;
    is_active: boolean;
    created_at: string;
}

export interface TeacherPackage {
    id: string;
    teacher_id: string;
    name: string;
    lesson_count: number;
    price: number;
    description?: string;
    created_at: string;
    updated_at: string;
}

export interface StudentPackage {
    id: string;
    student_id: string;
    teacher_id: string;
    package_id: string;
    total_lessons: number;
    remaining_lessons: number;
    status: "active" | "exhausted" | "refunded";
    created_at: string;
    updated_at: string;
    // Joined fields
    package?: TeacherPackage;
    teacher?: TeacherProfile;
}

export interface Lesson {
    id: string;
    teacher_id: string;
    student_id?: string; // New: linking student directly if it's a booking
    subject: string;
    scheduled_at: string;
    duration_minutes: number;
    price: number;
    status: BookingStatus;
    zoom_link?: string;
    notes?: string;
    lesson_type: LessonType;
    package_id?: string;
    student_package_id?: string;
    created_at: string;
    // Joined fields
    student?: User;
    teacher?: TeacherProfile;
}

export interface Message {
    id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    read: boolean;
    created_at: string;
    // Joined fields
    sender?: User;
    receiver?: User;
}

export interface Booking {
    id: string;
    lesson_id: string;
    student_id: string;
    teacher_id: string;
    start_time: string;
    end_time: string;
    zoom_meeting_id?: string;
    zoom_join_url?: string;
    status: BookingStatus;
    notes?: string;
    created_at: string;
    // Joined fields
    lesson?: Lesson;
    student?: User;
    teacher?: TeacherProfile;
}

export interface Recording {
    id: string;
    booking_id: string;
    storage_url: string;
    duration_seconds?: number;
    recorded_at: string;
    // Access control
    teacher_access: boolean;
    student_access: boolean;
}

export interface Review {
    id: string;
    teacher_id: string;
    student_id: string;
    booking_id?: string;
    rating: number; // 1-5
    content?: string;
    approved: boolean;
    created_at: string;
    // Joined fields
    student?: User;
}

export interface Payment {
    id: string;
    booking_id: string;
    student_id: string;
    teacher_id: string;
    amount: number;
    commission: number;
    net_amount: number;
    stripe_payment_id?: string;
    status: PaymentStatus;
    created_at: string;
}

export interface Coupon {
    id: string;
    code: string;
    discount_percent: number;
    max_uses?: number;
    current_uses: number;
    expires_at?: string;
    active: boolean;
    created_at: string;
}

// API Response types
export interface ApiResponse<T> {
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}

// Dashboard Stats
export interface TeacherStats {
    total_lessons: number;
    total_students: number;
    total_earnings: number;
    pending_earnings: number;
    average_rating: number;
    upcoming_lessons: number;
}

export interface StudentStats {
    total_lessons: number;
    total_spent: number;
    upcoming_lessons: number;
    favorite_subjects: string[];
}

export interface AdminStats {
    total_users: number;
    total_teachers: number;
    total_students: number;
    pending_approvals: number;
    total_revenue: number;
    platform_commission: number;
    active_lessons_today: number;
}

export interface PlatformSettings {
    id: string;
    key: string; // 'general' | 'features'
    value: any;
    updated_at: string;
    updated_by?: string;
}

export interface SystemStatus {
    database: boolean;
    auth: boolean;
    storage: boolean;
    realtime: boolean;
}
