'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Database, Upload, Table, Replace, FileText, Sparkles, FileCode, Settings } from 'lucide-react';
import { AuthScreen } from '../story-factory/components/AuthScreen';
import { useState } from 'react';

const TABS = [
    { id: 'import', label: '1. Nhập liệu', icon: Upload },
    { id: 'extract', label: '2. Trích xuất & Bảng', icon: Table },
    { id: 'replace_json', label: '3. Thay thế (JSON)', icon: Replace },
    { id: 'replace_text', label: '4. Xử lý Văn bản', icon: FileText },
    { id: 'gemini', label: '5. Gemini AI', icon: Sparkles },
    { id: 'prompt', label: '6. Chuẩn hóa Prompt', icon: FileCode },
    { id: 'tvc', label: '7. Phân tách TVC', icon: Database },
    { id: 'settings', label: 'Cài đặt', icon: Settings },
];

export default function DataToolsPage() {
    const { user, loading: authLoading } = useAuth();
    const [activeTab, setActiveTab] = useState('import');
    const [inputData, setInputData] = useState('');
    const [parsedData, setParsedData] = useState<Array<Record<string, unknown>>>([]);

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

    const handleImport = () => {
        try {
            const data = JSON.parse(inputData);
            const arr = Array.isArray(data) ? data : [data];
            setParsedData(prev => [...prev, ...arr]);
            setInputData('');
            setActiveTab('extract');
        } catch {
            alert('JSON không hợp lệ!');
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-gray-100">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-16 z-30">
                <div className="max-w-screen-2xl mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                                <Database className="w-5 h-5 text-white" />
                            </div>
                            <h1 className="font-bold text-lg text-gray-800">SceneJSON Pro VN</h1>
                        </div>

                        <nav className="flex space-x-1 overflow-x-auto no-scrollbar">
                            {TABS.map(tab => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${activeTab === tab.id
                                                ? 'bg-orange-50 text-orange-700'
                                                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span className="hidden lg:inline">{tab.label}</span>
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
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">1. Nhập Liệu JSON</h2>
                        <p className="text-sm text-gray-500 mb-4">Dán JSON data của bạn vào đây. Hỗ trợ array hoặc single object.</p>

                        <textarea
                            value={inputData}
                            onChange={(e) => setInputData(e.target.value)}
                            placeholder='[{"scene": 1, "description": "...", "imagePrompt": "..."}, ...]'
                            className="w-full h-64 p-4 font-mono text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800"
                        />

                        <div className="flex items-center justify-between mt-4">
                            <p className="text-sm text-gray-500">
                                Dữ liệu hiện có: <span className="font-bold text-orange-600">{parsedData.length}</span> rows
                            </p>
                            <button
                                onClick={handleImport}
                                disabled={!inputData.trim()}
                                className="px-6 py-2 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                            >
                                <Upload className="w-4 h-4" />
                                Import & Tiếp tục
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'extract' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">2. Trích Xuất & Bảng Dữ Liệu</h2>

                        {parsedData.length === 0 ? (
                            <div className="text-center py-12">
                                <Database className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                <p className="text-gray-500">Chưa có dữ liệu. Vui lòng import ở bước 1.</p>
                                <button
                                    onClick={() => setActiveTab('import')}
                                    className="mt-4 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
                                >
                                    Về bước Import
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-gray-50">
                                                <th className="px-4 py-3 text-left font-semibold text-gray-600">#</th>
                                                {Object.keys(parsedData[0] || {}).slice(0, 5).map(key => (
                                                    <th key={key} className="px-4 py-3 text-left font-semibold text-gray-600">{key}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {parsedData.slice(0, 10).map((row, idx) => (
                                                <tr key={idx} className="border-t border-gray-100 hover:bg-gray-50">
                                                    <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                                                    {Object.values(row).slice(0, 5).map((val, i) => (
                                                        <td key={i} className="px-4 py-3 text-gray-700 max-w-xs truncate">
                                                            {typeof val === 'string' ? val : JSON.stringify(val)}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {parsedData.length > 10 && (
                                    <p className="text-sm text-gray-500 mt-4 text-center">
                                        Hiển thị 10/{parsedData.length} rows
                                    </p>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* Placeholder for other tabs */}
                {!['import', 'extract'].includes(activeTab) && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center py-20">
                        <Database className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <h2 className="text-xl font-bold text-gray-800 mb-2">
                            {TABS.find(t => t.id === activeTab)?.label}
                        </h2>
                        <p className="text-gray-500 mb-4">
                            Tính năng này đang được migrate từ module gốc.
                        </p>
                    </div>
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
