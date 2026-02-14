import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/";

    console.log("Auth Callback triggered");
    console.log("Code present:", !!code);
    console.log("Next path:", next);

    if (code) {
        let collectedCookies: { name: string; value: string; options: any }[] = [];

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll();
                    },
                    setAll(cookiesToSet) {
                        collectedCookies = [...collectedCookies, ...cookiesToSet];
                        cookiesToSet.forEach(({ name, value, options }) =>
                            request.cookies.set(name, value)
                        );
                    },
                },
            }
        );

        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
            console.error("Auth Callback Error:", error.message);
            // Even if error, we might want to carry over any cookies set? Probably not if session failed.
            return NextResponse.redirect(`${origin}/login?error=Authentication Failed`);
        }

        if (data.session) {
            console.log("Session created successfully for user:", data.session.user.id);
            const user = data.session.user;
            const refreshToken = data.session.provider_refresh_token;

            // If we've got a Google refresh token, store it in our public.users table
            const supabaseAdmin = createServerClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!,
                {
                    cookies: { getAll() { return []; }, setAll() { } }
                }
            );

            // Check if user exists in public.users
            const { data: existingUser } = await supabaseAdmin
                .from('users')
                .select('id, role, onboarding_completed')
                .eq('id', user.id)
                .single();

            let targetRole = existingUser?.role;

            const full_name = user.user_metadata.full_name || user.user_metadata.name || 'New User';
            // Prioritize role from URL param (passed from register page), then metadata, then default
            const roleParam = searchParams.get("role");

            if (!existingUser) {
                console.log("New user detected, creating record...");
                // New User: Create public.users record
                const role = roleParam || user.user_metadata.role || 'student';
                targetRole = role;

                const { error: insertError } = await supabaseAdmin.from('users').upsert({
                    id: user.id,
                    email: user.email,
                    full_name: full_name,
                    role: role,
                    google_refresh_token: refreshToken || null,
                    onboarding_completed: false
                }, { onConflict: 'id' });

                if (insertError) {
                    console.error("Error creating user record:", insertError);
                }

                // If teacher, create profile
                if (role === 'teacher') {
                    await supabaseAdmin.from('teacher_profiles').upsert({
                        user_id: user.id,
                        approved: false
                    }, { onConflict: 'user_id' });
                }
            } else {
                console.log("Existing user found, role:", existingUser.role, "roleParam:", roleParam);
                const updates: any = {};
                if (refreshToken) updates.google_refresh_token = refreshToken;

                // If roleParam is explicitly provided AND the user hasn't completed onboarding yet,
                // this is a new registration where the DB trigger set the wrong default role.
                // Always apply the role from the register page in this case.
                if (roleParam && !existingUser.onboarding_completed) {
                    updates.role = roleParam;
                    targetRole = roleParam;

                    // If switching to teacher, ensure teacher profile exists
                    if (roleParam === 'teacher') {
                        await supabaseAdmin.from('teacher_profiles').upsert({
                            user_id: user.id,
                            approved: false
                        }, { onConflict: 'user_id' });
                    }
                }

                if (Object.keys(updates).length > 0) {
                    await supabaseAdmin
                        .from('users')
                        .update(updates)
                        .eq('id', user.id);

                    // Also update auth metadata so the onboarding page picks up the role
                    if (updates.role) {
                        await supabaseAdmin.auth.admin.updateUserById(user.id, {
                            user_metadata: { ...user.user_metadata, role: updates.role }
                        });
                    }
                }
            }

            // Determine redirect path
            let redirectPath = next;
            // If next is default '/', redirect based on onboarding status and role
            if (next === '/' || next === '/auth/callback') {
                // Only force onboarding for brand new accounts
                const needsOnboarding = !existingUser;

                if (needsOnboarding) {
                    redirectPath = '/onboarding';
                } else if (targetRole === 'teacher') {
                    redirectPath = '/teacher';
                } else if (targetRole === 'admin') {
                    redirectPath = '/admin';
                } else {
                    redirectPath = '/student';
                }
            }

            console.log("Redirecting to:", redirectPath);
            const response = NextResponse.redirect(`${origin}${redirectPath}`);

            // Apply the auth cookies to the response
            collectedCookies.forEach(({ name, value, options }) => {
                response.cookies.set(name, value, options);
            });

            return response;
        }
    }

    // Return the user to an error page with instructions
    console.log("No code found or session creation failed, redirecting to login");
    return NextResponse.redirect(`${origin}/login?error=Could not authenticate`);
}
