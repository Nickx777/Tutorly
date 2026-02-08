import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MessageCenter from "@/components/dashboard/MessageCenter";

export default async function TeacherMessages() {
    const supabase = await createClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect("/auth/sign-in");
    }

    // Fetch user data for layout
    const { data: userData } = await supabase
        .from('users')
        .select('id, full_name, avatar_url, email')
        .eq('id', user.id)
        .single();

    if (!userData) {
        return <div>Error loading profile</div>;
    }

    return (
        <div className="h-[calc(100vh-80px)] -m-6 flex flex-col">
            <MessageCenter currentUserId={user.id} />
        </div>
    );
}
