'use client'

import LoginForm from "@/components/login"
import { isAuthenticated } from "@/lib/auth/session";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Page() {
    const router = useRouter();

    useEffect(() => {
        if (isAuthenticated()) {
          router.push('/home');
        }
    }, [router]);

    return (
        <LoginForm></LoginForm>
    )
}