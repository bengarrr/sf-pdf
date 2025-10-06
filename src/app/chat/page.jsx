'use client'

import Chatbox from "@/components/chat";
import PDFViewer from "@/components/viewer";
import ProtectedRoute from "@/components/protected";
import { getSession } from "@/lib/auth/session";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

export default function Page({ params }) {
    const session = getSession();
    const chatId = useSearchParams().get("chatId");

    return (
        <Suspense>
            <ProtectedRoute>
                <div className="flex flex-row">
                    <div className="w-full lg:w-1/2">
                        <PDFViewer></PDFViewer>
                    </div>
                    <div className="w-full lg:w-1/2">
                        <Chatbox currentUserId={session?.user.id} chatId={chatId}></Chatbox>
                    </div>
                </div>
            </ProtectedRoute>
        </Suspense>
    )
}