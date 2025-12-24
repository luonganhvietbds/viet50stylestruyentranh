'use client';

import React, { useState, useMemo } from 'react';
import { Scissors, Copy, Download, Check, ChevronDown } from 'lucide-react';
import { DataToolsHook } from '../hooks/useDataTools';
import { copyToClipboard, saveTextFile } from '../utils/helpers';

interface TvcExtractModuleProps {
    hook: DataToolsHook;
}

export function TvcExtractModule({ hook }: TvcExtractModuleProps) {
    const [selectedKey, setSelectedKey] = useState<string | null>(null);
    const [separator, setSeparator] = useState<string>('\\n\\n');
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    // Get content for selected key
    const rawContent = useMemo(() => {
        if (!selectedKey || hook.sceneData.length === 0) return '';
        return hook.sceneData
            .map(item => item[selectedKey])
            .filter(val => val !== undefined && val !== null)
            .map(val => typeof val === 'string' ? val : JSON.stringify(val))
            .join('\n');
    }, [selectedKey, hook.sceneData]);

    // Parse separator (handle escape sequences)
    const parsedSeparator = useMemo(() => {
        return separator
            .replace(/\\n/g, '\n')
            .replace(/\\t/g, '\t')
            .replace(/\\r/g, '\r');
    }, [separator]);

    // Split content
    const segments = useMemo(() => {
        if (!rawContent || !parsedSeparator) return [];
        return rawContent.split(parsedSeparator).filter(s => s.trim().length > 0);
    }, [rawContent, parsedSeparator]);

    const handleCopySegment = async (text: string, index: number) => {
        await copyToClipboard(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 1500);
    };

    const handleCopyAll = async () => {
        await copyToClipboard(segments.join('\n---\n'));
        setCopiedIndex(-1);
        setTimeout(() => setCopiedIndex(null), 1500);
    };

    const handleDownloadAll = () => {
        saveTextFile(segments.join('\n---\n'), `${selectedKey || 'tvc'}_segments.txt`);
    };

    if (hook.sceneData.length === 0) {
        return (
            <div className="text-center py-16 text-gray-400">
                <Scissors className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Chưa có dữ liệu</p>
                <p className="text-sm mt-2">Vui lòng import dữ liệu ở tab Nhập liệu</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                    <Scissors className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-800">7. Phân Tách TVC</h2>
                    <p className="text-sm text-gray-500">Tách dữ liệu theo dấu phân cách</p>
                </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Key Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Chọn trường dữ liệu</label>
                    <div className="relative">
                        <select
                            value={selectedKey || ''}
                            onChange={(e) => setSelectedKey(e.target.value || null)}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg appearance-none cursor-pointer focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800"
                        >
                            <option value="">-- Chọn trường --</option>
                            {hook.availableKeys.map(key => (
                                <option key={key} value={key}>{key}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                {/* Separator */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Dấu phân cách</label>
                    <input
                        type="text"
                        value={separator}
                        onChange={(e) => setSeparator(e.target.value)}
                        placeholder="\\n\\n"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800"
                    />
                    <p className="text-xs text-gray-400 mt-1">Hỗ trợ: \n (newline), \t (tab), --- (dashes)</p>
                </div>
            </div>

            {/* Results */}
            {selectedKey && segments.length > 0 && (
                <>
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm text-gray-600">
                            Tìm thấy <span className="font-bold text-purple-600">{segments.length}</span> phân đoạn
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={handleCopyAll}
                                className={`px-3 py-1.5 text-sm font-medium rounded-lg flex items-center gap-1.5 transition-colors ${copiedIndex === -1
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {copiedIndex === -1 ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                Copy All
                            </button>
                            <button
                                onClick={handleDownloadAll}
                                className="px-3 py-1.5 text-sm font-medium bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 flex items-center gap-1.5 transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                Download
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                        {segments.map((segment, idx) => (
                            <div
                                key={idx}
                                className="p-4 bg-gray-50 border border-gray-200 rounded-lg group relative"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <span className="inline-block px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded mb-2">
                                            #{idx + 1}
                                        </span>
                                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{segment}</p>
                                    </div>
                                    <button
                                        onClick={() => handleCopySegment(segment, idx)}
                                        className={`p-2 rounded-lg transition-colors ${copiedIndex === idx
                                                ? 'bg-green-100 text-green-600'
                                                : 'bg-white text-gray-400 hover:text-purple-600 hover:bg-purple-50 opacity-0 group-hover:opacity-100'
                                            }`}
                                    >
                                        {copiedIndex === idx ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {selectedKey && segments.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                    <p>Không tìm thấy phân đoạn nào với dấu phân cách hiện tại</p>
                </div>
            )}
        </div>
    );
}
