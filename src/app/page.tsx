'use client'

import { isAuthenticated } from "@/lib/auth/session";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
      if (isAuthenticated()) {
        router.push('/home');
      } else {
        router.push('/login')
      }
  }, [router]);

  return;
}
