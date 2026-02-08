import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    // Skip auth check if Supabase is not configured
    if (supabaseUrl === "https://placeholder.supabase.co") {
        return supabaseResponse;
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value }) =>
                    request.cookies.set(name, value)
                );
                supabaseResponse = NextResponse.next({
                    request,
                });
                cookiesToSet.forEach(({ name, value, options }) =>
                    supabaseResponse.cookies.set(name, value, options)
                );
            },
        },
    });

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Protected routes
    const protectedRoutes = ["/teacher", "/student", "/admin"];
    const isProtectedRoute = protectedRoutes.some((route) =>
        request.nextUrl.pathname.startsWith(route)
    );

    if (isProtectedRoute && !user) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("redirect", request.nextUrl.pathname);
        return NextResponse.redirect(url);
    }

    // Redirect logged-in users away from auth pages
    const authRoutes = ["/login", "/register"];
    const isAuthRoute = authRoutes.some((route) =>
        request.nextUrl.pathname.startsWith(route)
    );

    if (isAuthRoute && user) {
        // Fetch role to redirect to correct dashboard
        const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        const role = userData?.role || 'student'; // Fallback to student
        const dashboardMap: Record<string, string> = {
            teacher: '/teacher',
            admin: '/admin',
            student: '/student'
        };

        const targetPath = dashboardMap[role] || '/student';

        const url = request.nextUrl.clone();
        url.pathname = targetPath;
        return NextResponse.redirect(url);
    }

    // Role-based access control
    if (user && !isAuthRoute) {
        const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        const role = userData?.role;
        const path = request.nextUrl.pathname;

        // Role-based access control
        const isTeacherDashboard = path === '/teacher' || path.startsWith('/teacher/');
        const isStudentDashboard = path === '/student' || path.startsWith('/student/');
        const isAdminDashboard = path === '/admin' || path.startsWith('/admin/');

        // Prevent Students from accessing /teacher dashboard
        if (role === 'student' && isTeacherDashboard) {
            const url = request.nextUrl.clone();
            url.pathname = "/student";
            return NextResponse.redirect(url);
        }

        // Prevent Teachers from accessing /student dashboard
        if (role === 'teacher' && isStudentDashboard) {
            const url = request.nextUrl.clone();
            url.pathname = "/teacher";
            return NextResponse.redirect(url);
        }

        // Prevent Admin from accessing /student dashboard
        if (role === 'admin' && isStudentDashboard) {
            const url = request.nextUrl.clone();
            url.pathname = "/admin";
            return NextResponse.redirect(url);
        }
    }

    return supabaseResponse;
}
