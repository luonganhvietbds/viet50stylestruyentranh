'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { ApiKeyProvider } from '@/contexts/ApiKeyContext';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <ApiKeyProvider>
                {children}
            </ApiKeyProvider>
        </AuthProvider>
    );
}
