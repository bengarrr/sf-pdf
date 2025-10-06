'use client'

import ProtectedRoute from "@/components/protected";
import ChatList from "@/components/chat_list";
import { useAuthData } from "@/providers/auth_provider";
import { getSession } from "@/lib/auth/session";

export default function Home() {
  //const session = useAuthData();
  const session = getSession();

  return (
    <ProtectedRoute>
      <div className="flex flex-col">
        <p className="bg-transparent">
          Hello <strong>{session?.user.email}!</strong>
        </p>
        <ChatList currentUserId={session?.user.id}></ChatList>
      </div>
    </ProtectedRoute>
  );
}