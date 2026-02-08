"use client";

import MessageCenter from "@/components/dashboard/MessageCenter";
import { PageTransition } from "@/components/ui/PageTransition";

interface MessagesClientProps {
    currentUserId: string;
    preselectedContactId?: string;
}

export default function MessagesClient({ currentUserId, preselectedContactId }: MessagesClientProps) {
    return (
        <PageTransition className="h-[calc(100vh-80px)] -m-6 flex flex-col">
            <MessageCenter
                currentUserId={currentUserId}
                preselectedContactId={preselectedContactId}
            />
        </PageTransition>
    );
}
