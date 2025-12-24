'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { ApiKeyProvider } from '@/contexts/ApiKeyContext';
import { LanguageProvider } from '@/contexts/LanguageContext';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <ApiKeyProvider>
                <LanguageProvider>
                    {children}
                </LanguageProvider>
            </ApiKeyProvider>
        </AuthProvider>
    );
}
