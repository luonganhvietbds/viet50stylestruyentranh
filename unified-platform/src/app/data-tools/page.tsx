'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Database, Upload, Table, Replace, FileText, Sparkles, FileCode, Settings, Scissors } from 'lucide-react';
import { AuthScreen } from '../story-factory/components/AuthScreen';
import { useState } from 'react';
import { useDataTools } from './hooks/useDataTools';

// Module Components
import { ImportModule } from './components/ImportModule';
import { ExtractModule } from './components/ExtractModule';
import { ReplaceJsonModule } from './components/ReplaceJsonModule';
import { ReplaceTextModule } from './components/ReplaceTextModule';
import { GeminiModule } from './components/GeminiModule';
import { PromptFormatModule } from './components/PromptFormatModule';
import { TvcExtractModule } from './components/TvcExtractModule';
import { SettingsModule } from './components/SettingsModule';

const TABS = [
    { id: 'import', label: '1. Nhập liệu', icon: Upload },
    { id: 'extract', label: '2. Trích xuất', icon: Table },
    { id: 'replace_json', label: '3. JSON', icon: Replace },
    { id: 'replace_text', label: '4. Văn bản', icon: FileText },
    { id: 'gemini', label: '5. Gemini', icon: Sparkles },
    { id: 'prompt', label: '6. Prompt', icon: FileCode },
    { id: 'tvc', label: '7. TVC', icon: Scissors },
    { id: 'settings', label: 'Cài đặt', icon: Settings },
];

export default function DataToolsPage() {
    const { user, loading: authLoading } = useAuth();
    const [activeTab, setActiveTab] = useState('import');
    const dataTools = useDataTools();

    if (authLoading) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
                <p className="text-gray-400 text-sm">Đang tải...</p>
            </div>
        );
    }

    if (!user) {
        return <AuthScreen moduleName="SceneJSON Pro VN" />;
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-gray-100">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-16 z-30">
                <div className="max-w-screen-2xl mx-auto px-4">
                    <div className="flex items-center justify-between h-14">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                                <Database className="w-4 h-4 text-white" />
                            </div>
                            <div className="hidden sm:block">
                                <h1 className="font-bold text-gray-800">SceneJSON Pro VN</h1>
                                <p className="text-xs text-gray-400">
                                    {dataTools.sceneData.length} rows • {dataTools.availableKeys.length} fields
                                </p>
                            </div>
                        </div>

                        <nav className="flex space-x-1 overflow-x-auto no-scrollbar">
                            {TABS.map(tab => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`px-2.5 py-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${isActive
                                                ? 'bg-orange-50 text-orange-700'
                                                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span className="hidden md:inline">{tab.label}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-screen-2xl mx-auto px-4 py-6">
                {activeTab === 'import' && (
                    <ImportModule
                        hook={dataTools}
                        onNext={() => setActiveTab('extract')}
                    />
                )}

                {activeTab === 'extract' && (
                    <ExtractModule
                        hook={dataTools}
                        onSendToGemini={() => setActiveTab('gemini')}
                    />
                )}

                {activeTab === 'replace_json' && (
                    <ReplaceJsonModule hook={dataTools} />
                )}

                {activeTab === 'replace_text' && (
                    <ReplaceTextModule />
                )}

                {activeTab === 'gemini' && (
                    <GeminiModule hook={dataTools} />
                )}

                {activeTab === 'prompt' && (
                    <PromptFormatModule />
                )}

                {activeTab === 'tvc' && (
                    <TvcExtractModule hook={dataTools} />
                )}

                {activeTab === 'settings' && (
                    <SettingsModule hook={dataTools} />
                )}
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 py-4 mt-auto">
                <div className="max-w-screen-2xl mx-auto px-4 text-center text-xs text-gray-400">
                    SceneJSON Pro VN © 2025. BYOK Architecture. Dữ liệu và Key được lưu trên trình duyệt của bạn.
                </div>
            </footer>
        </div>
    );
}
