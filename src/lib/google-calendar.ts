import { createClient } from "@supabase/supabase-js";

/**
 * Pushes a lesson event to the user's Google Calendar.
 * Requires the user to have connected their Google account with calendar scopes.
 */
export async function pushLessonToGoogleCalendar(lessonId: string) {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    );

    // 1. Fetch lesson details
    const { data: lesson, error: lessonError } = await supabaseAdmin
        .from('lessons')
        .select(`
            *,
            teacher:teacher_profiles(user:users(id, full_name, email)),
            student:users(id, full_name, email)
        `)
        .eq('id', lessonId)
        .single();

    if (lessonError || !lesson) {
        console.error("Error fetching lesson for Google sync:", lessonError);
        return;
    }

    // 2. Identify whose calendar we are pushing to (Teacher & Student)
    const participants = [lesson.teacher?.user, lesson.student];

    for (const participant of participants) {
        if (!participant) continue;

        try {
            // 3. Get Google Provider Token from auth.identities
            const { data: identities, error: identError } = await supabaseAdmin
                .rpc('get_user_google_token', { user_id: participant.id });

            if (identError || !identities) {
                console.log(`User ${participant.id} has no Google connection. skipping.`);
                continue;
            }

            let accessToken = identities.provider_token;

            // 4. Check if we need to refresh (Optional: simple check or try and retry)
            // For now, let's try pushing, and if it fails with 401, try to refresh using google_refresh_token

            const pushToGoogle = async (token: string) => {
                const event = {
                    summary: `Tutorly: Lesson with ${participant.id === lesson.student.id ? lesson.teacher.user.full_name : lesson.student.full_name}`,
                    description: `Tutorly Lesson\nStatus: ${lesson.status}\nLesson ID: ${lesson.id}\nDuration: ${lesson.duration} mins`,
                    start: {
                        dateTime: new Date(lesson.scheduled_at).toISOString(),
                    },
                    end: {
                        dateTime: new Date(new Date(lesson.scheduled_at).getTime() + (lesson.duration || 60) * 60000).toISOString(),
                    },
                    reminders: {
                        useDefault: true
                    }
                };

                return await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(event),
                });
            };

            let response = await pushToGoogle(accessToken);

            if (response.status === 401) {
                console.log(`Access token expired for user ${participant.id}, attempting refresh...`);
                // Get refresh token from public.users
                const { data: userData } = await supabaseAdmin
                    .from('users')
                    .select('google_refresh_token')
                    .eq('id', participant.id)
                    .single();

                if (userData?.google_refresh_token) {
                    // Refresh token logic
                    const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: new URLSearchParams({
                            client_id: process.env.GOOGLE_CLIENT_ID || '',
                            client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
                            refresh_token: userData.google_refresh_token,
                            grant_type: 'refresh_token',
                        }),
                    });

                    if (refreshResponse.ok) {
                        const refreshData = await refreshResponse.json();
                        accessToken = refreshData.access_token;
                        console.log(`Successfully refreshed token for user ${participant.id}`);

                        // Retry push with new token
                        response = await pushToGoogle(accessToken);
                    } else {
                        console.error(`Failed to refresh token for user ${participant.id}:`, await refreshResponse.json());
                    }
                } else {
                    console.log(`No refresh token found for user ${participant.id}.`);
                }
            }

            if (!response.ok) {
                const err = await response.json();
                console.error(`Google Calendar API Error for user ${participant.id}:`, err);
            } else {
                console.log(`Successfully pushed lesson ${lesson.id} to Google Calendar for ${participant.id}`);
            }
        } catch (err) {
            console.error(`Unexpected error syncing to Google Calendar for ${participant.id}:`, err);
        }
    }
}
