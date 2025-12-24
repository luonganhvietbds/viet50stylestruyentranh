'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useApiKey } from '@/contexts/ApiKeyContext';
import { Loader2 } from 'lucide-react';
import { AuthScreen } from './components/AuthScreen';
import { StoryWorkspace } from './components/StoryWorkspace';

export default function StoryFactoryPage() {
    const { user, loading: authLoading } = useAuth();
    const { hasValidKey } = useApiKey();

    // Loading state
    if (authLoading) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                <p className="text-gray-400 text-sm">Đang tải...</p>
            </div>
        );
    }

    // Auth required
    if (!user) {
        return <AuthScreen moduleName="AI Story Factory" />;
    }

    // Main workspace
    return <StoryWorkspace />;
}
