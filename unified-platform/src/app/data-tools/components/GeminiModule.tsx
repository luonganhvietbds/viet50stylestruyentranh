'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Send, Copy, Check, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { DataToolsHook } from '../hooks/useDataTools';
import { copyToClipboard } from '../utils/helpers';
import { useApiKey } from '@/contexts/ApiKeyContext';
import { generateWithModelFallback } from '@/lib/gemini';

interface GeminiModuleProps {
    hook: DataToolsHook;
}

export function GeminiModule({ hook }: GeminiModuleProps) {
    const { getNextKey, markKeyInvalid, hasValidKey } = useApiKey();

    const [systemPrompt, setSystemPrompt] = useState('Bạn là một AI assistant chuyên phân tích và xử lý dữ liệu.');
    const [userPrompt, setUserPrompt] = useState('');
    const [response, setResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // Auto-fill context from ExtractModule
    useEffect(() => {
        if (hook.geminiContext) {
            setUserPrompt(prev => prev || `Phân tích dữ liệu sau:\n\n${hook.geminiContext}`);
        }
    }, [hook.geminiContext]);

    const handleGenerate = async () => {
        if (!userPrompt.trim()) {
            setError('Vui lòng nhập prompt');
            return;
        }

        if (!hasValidKey) {
            setError('Vui lòng thêm API Key');
            return;
        }

        setIsLoading(true);
        setError(null);
        setResponse('');

        try {
            const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

            const result = await generateWithModelFallback(
                getNextKey,
                markKeyInvalid,
                fullPrompt,
                undefined,
                { maxRetries: 2, delayMs: 1500 }
            );

            setResponse(result || 'Không có phản hồi từ AI');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = async () => {
        await copyToClipboard(response);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const handleClear = () => {
        setUserPrompt('');
        setResponse('');
        setError(null);
        hook.setGeminiContext('');
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-800">5. Gemini AI</h2>
                    <p className="text-sm text-gray-500">Phân tích dữ liệu với Gemini AI</p>
                </div>
            </div>

            {!hasValidKey && (
                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
                    ⚠️ Vui lòng thêm API Key để sử dụng tính năng này
                </div>
            )}

            <div className="space-y-4">
                {/* System Prompt */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">System Prompt</label>
                    <input
                        type="text"
                        value={systemPrompt}
                        onChange={(e) => setSystemPrompt(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 text-sm"
                    />
                </div>

                {/* User Prompt */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700">User Prompt</label>
                        {hook.geminiContext && (
                            <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
                                Có dữ liệu từ ExtractModule
                            </span>
                        )}
                    </div>
                    <textarea
                        value={userPrompt}
                        onChange={(e) => setUserPrompt(e.target.value)}
                        placeholder="Nhập câu hỏi hoặc yêu cầu của bạn..."
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 text-sm resize-none"
                    />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading || !hasValidKey || !userPrompt.trim()}
                        className="flex-1 py-2.5 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Đang xử lý...
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                Gửi yêu cầu
                            </>
                        )}
                    </button>
                    <button
                        onClick={handleClear}
                        className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" />
                        Xóa
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        ❌ {error}
                    </div>
                )}

                {/* Response */}
                {response && (
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-gray-700">Kết quả</label>
                            <button
                                onClick={handleCopy}
                                className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-1.5 transition-colors ${copied
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                {copied ? 'Đã copy' : 'Copy'}
                            </button>
                        </div>
                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                            <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">{response}</pre>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
