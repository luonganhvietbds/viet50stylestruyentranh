'use client';

import React, { useState, useMemo } from 'react';
import { Replace, Plus, Trash2, Eye, EyeOff, ChevronDown, Check, Download } from 'lucide-react';
import { DataToolsHook } from '../hooks/useDataTools';
import { copyToClipboard, saveTextFile } from '../utils/helpers';
import { Scene } from '../types';

interface ReplaceJsonModuleProps {
    hook: DataToolsHook;
}

export function ReplaceJsonModule({ hook }: ReplaceJsonModuleProps) {
    const [selectedKey, setSelectedKey] = useState<string | null>(null);
    const [findText, setFindText] = useState('');
    const [replaceText, setReplaceText] = useState('');
    const [isRegex, setIsRegex] = useState(false);
    const [showPreview, setShowPreview] = useState(true);

    // Preview of changes
    const preview = useMemo(() => {
        if (!selectedKey || !findText || hook.sceneData.length === 0) return [];

        return hook.sceneData.map((item, idx) => {
            const original = item[selectedKey];
            if (original === undefined || original === null) return null;

            const originalStr = typeof original === 'string' ? original : JSON.stringify(original);
            let replaced: string;

            try {
                if (isRegex) {
                    const regex = new RegExp(findText, 'g');
                    replaced = originalStr.replace(regex, replaceText);
                } else {
                    replaced = originalStr.split(findText).join(replaceText);
                }
            } catch {
                replaced = originalStr;
            }

            if (originalStr === replaced) return null;

            return { idx, original: originalStr, replaced };
        }).filter(Boolean);
    }, [selectedKey, findText, replaceText, isRegex, hook.sceneData]);

    const handleApply = () => {
        if (!selectedKey || !findText) return;

        const newData = hook.sceneData.map(item => {
            const original = item[selectedKey];
            if (original === undefined || original === null) return item;

            const originalStr = typeof original === 'string' ? original : JSON.stringify(original);
            let replaced: string;

            try {
                if (isRegex) {
                    const regex = new RegExp(findText, 'g');
                    replaced = originalStr.replace(regex, replaceText);
                } else {
                    replaced = originalStr.split(findText).join(replaceText);
                }
            } catch {
                replaced = originalStr;
            }

            return { ...item, [selectedKey]: replaced };
        });

        hook.replaceData(newData);
        setFindText('');
        setReplaceText('');
    };

    const handleExportJson = () => {
        const content = JSON.stringify(hook.sceneData, null, 2);
        saveTextFile(content, 'data_replaced.json');
    };

    if (hook.sceneData.length === 0) {
        return (
            <div className="text-center py-16 text-gray-400">
                <Replace className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Chưa có dữ liệu</p>
                <p className="text-sm mt-2">Vui lòng import dữ liệu ở tab Nhập liệu</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                        <Replace className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">3. Thay Thế (JSON)</h2>
                        <p className="text-sm text-gray-500">Find & Replace trong dữ liệu JSON</p>
                    </div>
                </div>
                <button
                    onClick={handleExportJson}
                    className="px-4 py-2 text-sm font-medium bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center gap-2 transition-colors"
                >
                    <Download className="w-4 h-4" />
                    Export JSON
                </button>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {/* Key Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Trường dữ liệu</label>
                    <div className="relative">
                        <select
                            value={selectedKey || ''}
                            onChange={(e) => setSelectedKey(e.target.value || null)}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg appearance-none cursor-pointer focus:ring-2 focus:ring-blue-500 text-gray-800"
                        >
                            <option value="">-- Chọn --</option>
                            {hook.availableKeys.map(key => (
                                <option key={key} value={key}>{key}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                {/* Find */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tìm</label>
                    <input
                        type="text"
                        value={findText}
                        onChange={(e) => setFindText(e.target.value)}
                        placeholder="Văn bản cần tìm"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-800"
                    />
                </div>

                {/* Replace */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Thay bằng</label>
                    <input
                        type="text"
                        value={replaceText}
                        onChange={(e) => setReplaceText(e.target.value)}
                        placeholder="Văn bản thay thế"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-800"
                    />
                </div>

                {/* Options */}
                <div className="flex flex-col justify-end gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isRegex}
                            onChange={(e) => setIsRegex(e.target.checked)}
                            className="text-blue-600 rounded"
                        />
                        <span className="text-sm text-gray-700">Regex</span>
                    </label>
                    <button
                        onClick={handleApply}
                        disabled={!selectedKey || !findText}
                        className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                        <Check className="w-4 h-4" />
                        Áp dụng
                    </button>
                </div>
            </div>

            {/* Preview */}
            {selectedKey && findText && (
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm text-gray-600">
                            Preview: <span className="font-bold text-blue-600">{preview.length}</span> thay đổi
                        </p>
                        <button
                            onClick={() => setShowPreview(!showPreview)}
                            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                        >
                            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            {showPreview ? 'Ẩn' : 'Hiện'}
                        </button>
                    </div>

                    {showPreview && preview.length > 0 && (
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                            {preview.slice(0, 10).map((item: any) => (
                                <div key={item.idx} className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs">
                                    <span className="text-gray-400">Row {item.idx + 1}:</span>
                                    <div className="mt-1 grid grid-cols-2 gap-2">
                                        <div className="p-2 bg-red-50 rounded text-red-700 line-through truncate">
                                            {item.original.substring(0, 100)}
                                        </div>
                                        <div className="p-2 bg-green-50 rounded text-green-700 truncate">
                                            {item.replaced.substring(0, 100)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {preview.length > 10 && (
                                <p className="text-center text-gray-400 text-sm">
                                    ... và {preview.length - 10} thay đổi khác
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
