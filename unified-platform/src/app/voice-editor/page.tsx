'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Mic, ArrowRight } from 'lucide-react';
import { AuthScreen } from '../story-factory/components/AuthScreen';
import { useState } from 'react';

const TABS = [
    { id: 'step1', label: '① PHÂN TÁCH CÂU' },
    { id: 'step2', label: '② TẠO SEGMENTS' },
    { id: 'step3', label: '③ EDITOR (TỐI ƯU)' },
    { id: 'step4', label: '④ EDITOR (GỐC)' },
];

export default function VoiceEditorPage() {
    const { user, loading: authLoading } = useAuth();
    const [activeTab, setActiveTab] = useState('step1');
    const [inputText, setInputText] = useState('');
    const [sentences, setSentences] = useState<string[]>([]);
    const [minSyllables, setMinSyllables] = useState(15);
    const [maxSyllables, setMaxSyllables] = useState(22);

    if (authLoading) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-green-500 animate-spin" />
                <p className="text-gray-400 text-sm">Đang tải...</p>
            </div>
        );
    }

    if (!user) {
        return <AuthScreen moduleName="VietVoice Pro Editor" />;
    }

    const handleProcess = () => {
        const lines = inputText.split(/\r?\n/).map(s => s.trim()).filter(s => s.length > 0);
        setSentences(lines);
        setActiveTab('step2');
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-gray-100">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap justify-between items-center py-3 gap-3">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                                <Mic className="w-5 h-5 text-white" />
                            </div>
                            <h1 className="text-xl font-bold text-gray-800">VietVoice Pro Editor</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-lg border border-gray-200">
                        <span className="text-sm font-bold text-gray-700">Cấu hình độ dài:</span>
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-500">Min:</label>
                            <input
                                type="number"
                                value={minSyllables}
                                onChange={(e) => setMinSyllables(Number(e.target.value))}
                                className="w-16 p-1 text-sm border border-gray-300 rounded focus:ring-green-500"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-500">Max:</label>
                            <input
                                type="number"
                                value={maxSyllables}
                                onChange={(e) => setMaxSyllables(Number(e.target.value))}
                                className="w-16 p-1 text-sm border border-gray-300 rounded focus:ring-green-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <nav className="border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex overflow-x-auto">
                            {TABS.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    disabled={tab.id !== 'step1' && sentences.length === 0}
                                    className={`px-4 py-3 text-sm font-semibold border-b-4 transition-colors ${activeTab === tab.id
                                            ? 'border-green-500 text-green-600'
                                            : 'border-transparent text-gray-500 hover:text-green-500 disabled:text-gray-300 disabled:cursor-not-allowed'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </nav>
            </header>

            {/* Content */}
            <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                {activeTab === 'step1' && (
                    <div className="p-6 bg-white rounded-lg shadow-md">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">① PHÂN TÁCH CÂU (THEO DÒNG)</h2>
                        <p className="text-sm text-gray-500 mb-2">Nhập văn bản của bạn dưới đây. Hệ thống sẽ nhận diện mỗi dòng là một câu.</p>
                        <textarea
                            className="w-full h-64 p-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition text-gray-800"
                            placeholder="Dán văn bản gốc vào đây..."
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                        />
                        <div className="flex justify-end mt-4">
                            <button
                                onClick={handleProcess}
                                disabled={!inputText.trim()}
                                className="px-6 py-2 bg-green-600 text-white font-semibold rounded-md shadow-sm hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                            >
                                Phân Tách Câu & Chuyển Sang Bước 2
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'step2' && (
                    <div className="p-6 bg-white rounded-lg shadow-md">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">② TẠO VOICE SEGMENTS</h2>
                        <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-md grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div><span className="block text-sm text-gray-500">Tổng số câu</span><span className="text-2xl font-bold text-green-600">{sentences.length}</span></div>
                            <div><span className="block text-sm text-gray-500">Tổng số từ</span><span className="text-2xl font-bold text-green-600">{sentences.reduce((acc, s) => acc + s.split(/\s+/).length, 0)}</span></div>
                            <div><span className="block text-sm text-gray-500">Tổng ký tự</span><span className="text-2xl font-bold text-green-600">{inputText.length}</span></div>
                            <div><span className="block text-sm text-gray-500">Config</span><span className="text-2xl font-bold text-green-600">{minSyllables}-{maxSyllables}</span></div>
                        </div>
                        <div className="max-h-96 overflow-y-auto space-y-3 pr-2 mb-4">
                            {sentences.map((sentence, index) => (
                                <div key={index} className="p-3 bg-white border border-gray-200 rounded-md flex items-start gap-3">
                                    <span className="text-sm font-medium text-green-500 bg-green-100 rounded-full w-6 h-6 flex items-center justify-center shrink-0 mt-1">{index + 1}</span>
                                    <p className="text-gray-700">{sentence}</p>
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4 border-t pt-4">
                            <button
                                onClick={() => setActiveTab('step3')}
                                className="px-6 py-2 bg-green-600 text-white font-semibold rounded-md shadow-sm hover:bg-green-700 transition-colors"
                            >
                                Tạo Segments Tối Ưu ({minSyllables}-{maxSyllables} âm)
                            </button>
                            <button
                                onClick={() => setActiveTab('step4')}
                                className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 transition-colors"
                            >
                                Giữ Nguyên Câu Gốc
                            </button>
                        </div>
                    </div>
                )}

                {(activeTab === 'step3' || activeTab === 'step4') && (
                    <div className="p-6 bg-white rounded-lg shadow-md text-center py-20">
                        <Mic className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <h2 className="text-xl font-bold text-gray-800 mb-2">
                            {activeTab === 'step3' ? 'Editor Tối Ưu' : 'Editor Gốc'}
                        </h2>
                        <p className="text-gray-500 mb-4">
                            Tính năng editor đầy đủ đang được migrate từ module gốc.
                        </p>
                        <button
                            onClick={() => setActiveTab('step2')}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                            Quay lại Step 2
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
