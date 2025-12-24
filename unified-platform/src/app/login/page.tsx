'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AuthForm } from '@/components/auth/AuthForm';
import { useEffect } from 'react';

export default function LoginPage() {
    const router = useRouter();
    const { user } = useAuth();

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            router.push('/');
        }
    }, [user, router]);

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <AuthForm
                    moduleName="Unified Platform"
                    onSuccess={() => router.push('/')}
                />
            </div>
        </div>
    );
}
