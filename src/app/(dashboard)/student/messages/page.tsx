import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MessagesClient from "./MessagesClient";

interface PageProps {
    searchParams: Promise<{ message?: string }>;
}

export default async function StudentMessages({ searchParams }: PageProps) {
    const supabase = await createClient();
    const params = await searchParams;

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect("/auth/sign-in");
    }

    return (
        <MessagesClient
            currentUserId={user.id}
            preselectedContactId={params.message}
        />
    );
}
