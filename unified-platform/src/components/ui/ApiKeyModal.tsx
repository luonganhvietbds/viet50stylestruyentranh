'use client';

import React, { useState } from 'react';
import { X, Key, Plus, Trash2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useApiKey } from '@/contexts/ApiKeyContext';
import { cn } from '@/lib/utils';

export function ApiKeyModal() {
    const {
        isModalOpen,
        closeModal,
        apiKeys,
        addKey,
        removeKey,
        hasValidKey
    } = useApiKey();

    const [newKey, setNewKey] = useState('');
    const [keyName, setKeyName] = useState('');
    const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

    if (!isModalOpen) return null;

    const handleAddKey = () => {
        if (newKey.trim()) {
            addKey(newKey.trim(), keyName.trim() || undefined);
            setNewKey('');
            setKeyName('');
        }
    };

    const toggleShowKey = (id: string) => {
        setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const maskKey = (key: string) => {
        if (key.length <= 8) return '••••••••';
        return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={hasValidKey ? closeModal : undefined}
            />

            {/* Modal */}
            <div className="relative bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                            <Key className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Quản Lý API Keys</h2>
                            <p className="text-xs text-gray-500">Gemini AI Key Rotation</p>
                        </div>
                    </div>
                    {hasValidKey && (
                        <button
                            onClick={closeModal}
                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Warning if no keys */}
                    {!hasValidKey && (
                        <div className="flex items-start gap-3 p-4 bg-amber-900/20 border border-amber-800/50 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-amber-300">Chưa có API Key</p>
                                <p className="text-xs text-amber-400/70 mt-1">
                                    Bạn cần thêm ít nhất 1 Gemini API Key để sử dụng các tính năng AI.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Add New Key */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-300">Thêm Key Mới</label>
                        <div className="space-y-2">
                            <input
                                type="password"
                                value={newKey}
                                onChange={(e) => setNewKey(e.target.value)}
                                placeholder="AIzaSy..."
                                className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                            />
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={keyName}
                                    onChange={(e) => setKeyName(e.target.value)}
                                    placeholder="Tên key (tùy chọn)"
                                    className="flex-1 px-4 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                                />
                                <button
                                    onClick={handleAddKey}
                                    disabled={!newKey.trim()}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-lg font-medium text-sm flex items-center gap-2 transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    Thêm
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Key List */}
                    {apiKeys.length > 0 && (
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-300">
                                Danh Sách Keys ({apiKeys.length})
                            </label>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {apiKeys.map((key) => (
                                    <div
                                        key={key.id}
                                        className="flex items-center gap-3 p-3 bg-gray-950 border border-gray-800 rounded-lg group"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white truncate">{key.name}</p>
                                            <p className="text-xs text-gray-500 font-mono">
                                                {showKeys[key.id] ? key.key : maskKey(key.key)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => toggleShowKey(key.id)}
                                                className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded transition-colors"
                                            >
                                                {showKeys[key.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={() => removeKey(key.id)}
                                                className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Info */}
                    <div className="text-xs text-gray-500 space-y-1">
                        <p>• Keys được lưu trữ an toàn trên trình duyệt của bạn.</p>
                        <p>• Hệ thống tự động xoay vòng giữa các keys để tránh rate limit.</p>
                        <p>• Lấy API Key tại: <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">AI Studio</a></p>
                    </div>
                </div>

                {/* Footer */}
                {hasValidKey && (
                    <div className="p-6 border-t border-gray-800">
                        <button
                            onClick={closeModal}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors"
                        >
                            Hoàn Tất
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
