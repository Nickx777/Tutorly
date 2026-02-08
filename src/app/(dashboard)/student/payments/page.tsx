import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PaymentsClient from "./PaymentsClient";

interface Transaction {
    id: string;
    amount: number;
    type: string;
    status: string;
    created_at: string;
    lesson_id?: string;
    lesson?: {
        subject: string;
        teacher?: {
            full_name: string;
        };
    };
}

export default async function PaymentsPage() {
    const supabase = await createClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect("/auth/sign-in");
    }

    // Fetch user data
    const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single();

    if (!userData) {
        return <div>Error loading user data</div>;
    }

    // Fetch transactions/payments
    let transactions: Transaction[] = [];
    let balance = 0;

    try {
        const { data: paymentsData } = await supabase
            .from('payments')
            .select('id, amount, type, status, created_at, lesson_id')
            .eq('student_id', userData.id)
            .order('created_at', { ascending: false })
            .limit(10);

        if (paymentsData) {
            // Manual joins to avoid FK issues
            const lessonIds = [...new Set(paymentsData.map((p: any) => p.lesson_id).filter(Boolean))];

            let lessonsMap = new Map();
            let teachersMap = new Map();

            if (lessonIds.length > 0) {
                // Fetch lessons
                const { data: lessons } = await supabase
                    .from('lessons')
                    .select('id, subject, teacher_id')
                    .in('id', lessonIds);

                if (lessons) {
                    lessons.forEach((l: any) => lessonsMap.set(l.id, l));

                    // Fetch teachers
                    const teacherIds = [...new Set(lessons.map((l: any) => l.teacher_id).filter(Boolean))];
                    if (teacherIds.length > 0) {
                        const { data: teachers } = await supabase
                            .from('users')
                            .select('id, full_name')
                            .in('id', teacherIds);

                        if (teachers) {
                            teachers.forEach((t: any) => teachersMap.set(t.id, t));
                        }
                    }
                }
            }

            // Stitch data together
            transactions = paymentsData.map((p: any) => {
                const lesson = p.lesson_id ? lessonsMap.get(p.lesson_id) : null;
                const teacher = lesson?.teacher_id ? teachersMap.get(lesson.teacher_id) : null;

                return {
                    ...p,
                    lesson: lesson ? {
                        subject: lesson.subject,
                        teacher: teacher ? {
                            full_name: teacher.full_name
                        } : undefined
                    } : undefined
                };
            });

            // Calculate balance (sum of completed payments)
            balance = transactions
                .filter((p: Transaction) => p.status === 'completed' && p.type === 'payment')
                .reduce((sum: number, p: Transaction) => sum + (p.amount || 0), 0);
        }
    } catch (err) {
        console.error("Error fetching payments:", err);
    }

    return <PaymentsClient transactions={transactions} balance={balance} />;
}
