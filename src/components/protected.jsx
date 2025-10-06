// components/ProtectedRoute.jsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth/session';
import AuthProvider from "@/providers/auth_provider";

export default function ProtectedRoute({ children }) {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  return <AuthProvider>{children}</AuthProvider>;
}