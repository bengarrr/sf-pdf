'use client'

import Chatbox from "@/components/chat";
import PDFViewer from "@/components/viewer";
import ProtectedRoute from "@/components/protected";
import { getSession } from "@/lib/auth/session";
import { Suspense } from "react";

export default function Page({ params }) {
    const session = getSession();
    
    return (
        <ProtectedRoute>
            <div className="flex flex-row">
                <div className="w-full lg:w-1/2">
                    <PDFViewer></PDFViewer>
                </div>
                <div className="w-full lg:w-1/2">
                    <Suspense>
                        <Chatbox currentUserId={session?.user.id}></Chatbox>
                    </Suspense>
                </div>
            </div>
        </ProtectedRoute>
    )
}