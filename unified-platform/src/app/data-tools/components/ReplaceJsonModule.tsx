'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Replace, Plus, Trash2, Eye, EyeOff, Check, Download, Copy, ChevronUp, ChevronDown, ToggleLeft, ToggleRight } from 'lucide-react';
import { DataToolsHook } from '../hooks/useDataTools';
import { copyToClipboard, saveTextFile, applyReplacementRules, getValueByPath } from '../utils/helpers';
import { ReplaceRule, Scene } from '../types';

interface ReplaceJsonModuleProps {
    hook: DataToolsHook;
}

// Generate unique ID
const genId = () => Math.random().toString(36).substring(2, 9);

// Storage keys
const STORAGE_KEYS = {
    selectedKeys: 'data_tools_replacejson_selectedkeys',
    rules: 'data_tools_replacejson_rules',
    showPreview: 'data_tools_replacejson_preview',
};

export function ReplaceJsonModule({ hook }: ReplaceJsonModuleProps) {
    // Selected keys (multi-select with pill buttons)
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

    // Replacement rules
    const [rules, setRules] = useState<ReplaceRule[]>([]);

    // UI state
    const [showPreview, setShowPreview] = useState(true);
    const [copied, setCopied] = useState(false);

    const { sceneData, availableKeys, dataAnalysis } = hook;

    // Load from storage on mount
    useEffect(() => {
        try {
            const savedKeys = localStorage.getItem(STORAGE_KEYS.selectedKeys);
            if (savedKeys) setSelectedKeys(new Set(JSON.parse(savedKeys)));

            const savedRules = localStorage.getItem(STORAGE_KEYS.rules);
            if (savedRules) setRules(JSON.parse(savedRules));

            const savedPreview = localStorage.getItem(STORAGE_KEYS.showPreview);
            if (savedPreview) setShowPreview(savedPreview === 'true');
        } catch { /* ignore */ }
    }, []);

    // Save to storage on change
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEYS.selectedKeys, JSON.stringify(Array.from(selectedKeys)));
            localStorage.setItem(STORAGE_KEYS.rules, JSON.stringify(rules));
            localStorage.setItem(STORAGE_KEYS.showPreview, String(showPreview));
        } catch { /* ignore */ }
    }, [selectedKeys, rules, showPreview]);

    // Toggle key selection
    const toggleKey = useCallback((key: string) => {
        setSelectedKeys(prev => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    }, []);

    // Add new rule
    const addRule = useCallback(() => {
        setRules(prev => [...prev, {
            id: genId(),
            find: '',
            replace: '',
            isRegex: false,
            enabled: true,
        }]);
    }, []);

    // Update rule
    const updateRule = useCallback((id: string, updates: Partial<ReplaceRule>) => {
        setRules(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    }, []);

    // Delete rule
    const deleteRule = useCallback((id: string) => {
        setRules(prev => prev.filter(r => r.id !== id));
    }, []);

    // Move rule up/down
    const moveRule = useCallback((id: string, direction: 'up' | 'down') => {
        setRules(prev => {
            const idx = prev.findIndex(r => r.id === id);
            if (idx === -1) return prev;
            if (direction === 'up' && idx === 0) return prev;
            if (direction === 'down' && idx === prev.length - 1) return prev;

            const newRules = [...prev];
            const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
            [newRules[idx], newRules[swapIdx]] = [newRules[swapIdx], newRules[idx]];
            return newRules;
        });
    }, []);

    // Get combined content for selected keys
    const getCombinedContent = useCallback((data: Scene[]): string => {
        if (selectedKeys.size === 0) return '';

        const separator = hook.settings?.joinSeparator || '\n---\n';
        const lines: string[] = [];

        data.forEach((item, idx) => {
            const rowParts: string[] = [];
            selectedKeys.forEach(key => {
                const val = getValueByPath(item, key);
                if (val !== undefined && val !== null) {
                    const str = typeof val === 'string' ? val : JSON.stringify(val);
                    rowParts.push(str);
                }
            });
            if (rowParts.length > 0) {
                lines.push(rowParts.join('\n'));
            }
        });

        return lines.join(separator);
    }, [selectedKeys, hook.settings]);

    // Original content (before rules)
    const originalContent = useMemo(() => getCombinedContent(sceneData), [sceneData, getCombinedContent]);

    // Result after applying rules
    const resultContent = useMemo(() => {
        if (!originalContent || rules.length === 0) return originalContent;
        return applyReplacementRules(originalContent, rules);
    }, [originalContent, rules]);

    // Apply rules to actual data
    const handleApply = useCallback(() => {
        if (selectedKeys.size === 0 || rules.length === 0) return;

        const newData = sceneData.map(item => {
            const newItem = { ...item };
            selectedKeys.forEach(key => {
                const val = item[key];
                if (typeof val === 'string') {
                    newItem[key] = applyReplacementRules(val, rules);
                }
            });
            return newItem;
        });

        hook.replaceData(newData);
    }, [selectedKeys, rules, sceneData, hook]);

    // Export JSON
    const handleExportJson = () => {
        const content = JSON.stringify(sceneData, null, 2);
        saveTextFile(content, 'data_replaced.json');
    };

    // Copy result
    const handleCopy = async () => {
        await copyToClipboard(resultContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    if (sceneData.length === 0) {
        return (
            <div className="text-center py-16 text-gray-400">
                <Replace className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Chưa có dữ liệu</p>
                <p className="text-sm mt-2">Vui lòng import dữ liệu ở tab Nhập liệu</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                            <Replace className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">3. Thay Thế (JSON)</h2>
                            <p className="text-sm text-gray-500">Chọn trường và áp dụng quy tắc thay thế</p>
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

                {/* Section 1: Field Selection (Pill Buttons) */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-700">1. Chọn trường áp dụng</h3>
                        <span className="text-xs text-gray-400">
                            {selectedKeys.size}/{dataAnalysis.totalFields} đã chọn
                        </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">
                        Chọn các trường bạn muốn thay thế. Mỗi trường được xử lý và kết quả sẽ được nối với nhau.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {dataAnalysis.fields.map(field => (
                            <button
                                key={field.path}
                                onClick={() => toggleKey(field.path)}
                                className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-all ${selectedKeys.has(field.path)
                                    ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'
                                    }`}
                            >
                                {field.key}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Section 2: Replacement Rules */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-700">2. Quy tắc thay thế</h3>
                        <button
                            onClick={addRule}
                            className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 flex items-center gap-1.5 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Thêm quy tắc
                        </button>
                    </div>

                    {rules.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                            <p className="text-sm">Chưa có quy tắc nào</p>
                            <p className="text-xs mt-1">Bấm "Thêm quy tắc" để bắt đầu</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {rules.map((rule, idx) => (
                                <div
                                    key={rule.id}
                                    className={`p-4 rounded-lg border transition-all ${rule.enabled
                                        ? 'bg-white border-gray-200'
                                        : 'bg-gray-50 border-gray-200 opacity-60'
                                        }`}
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-xs font-medium text-gray-400 w-6">#{idx + 1}</span>
                                        <div className="flex-1 grid grid-cols-2 gap-3">
                                            <input
                                                type="text"
                                                value={rule.find}
                                                onChange={e => updateRule(rule.id, { find: e.target.value })}
                                                placeholder="Tìm..."
                                                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-800"
                                            />
                                            <input
                                                type="text"
                                                value={rule.replace}
                                                onChange={e => updateRule(rule.id, { replace: e.target.value })}
                                                placeholder="Thay bằng..."
                                                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-800"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={rule.isRegex}
                                                    onChange={e => updateRule(rule.id, { isRegex: e.target.checked })}
                                                    className="text-blue-600 rounded"
                                                />
                                                <span className="text-xs text-gray-600">Regex</span>
                                            </label>
                                            <button
                                                onClick={() => updateRule(rule.id, { enabled: !rule.enabled })}
                                                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700"
                                            >
                                                {rule.enabled ? (
                                                    <><ToggleRight className="w-4 h-4 text-green-500" /> Enabled</>
                                                ) : (
                                                    <><ToggleLeft className="w-4 h-4" /> Disabled</>
                                                )}
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => moveRule(rule.id, 'up')}
                                                disabled={idx === 0}
                                                className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                            >
                                                <ChevronUp className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => moveRule(rule.id, 'down')}
                                                disabled={idx === rules.length - 1}
                                                className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                            >
                                                <ChevronDown className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => deleteRule(rule.id)}
                                                className="p-1.5 text-red-400 hover:text-red-600"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Result Panel */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <h3 className="text-sm font-semibold text-gray-700">Kết quả thay thế</h3>
                        {resultContent && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                                {resultContent.split(/\n\s*\n/).filter((block: string) => block.trim()).length} khối
                            </span>
                        )}
                        {selectedKeys.size > 0 && (
                            <span className="text-xs text-gray-400">
                                {Array.from(selectedKeys).join(', ')}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowPreview(!showPreview)}
                            className="p-2 text-gray-400 hover:text-gray-600"
                        >
                            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={handleCopy}
                            disabled={!resultContent}
                            className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-1.5 transition-colors ${copied ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={() => saveTextFile(resultContent, 'replaced_content.txt')}
                            disabled={!resultContent}
                            className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center gap-1.5"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {showPreview && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-96 overflow-auto">
                        {selectedKeys.size === 0 ? (
                            <p className="text-gray-400 text-sm text-center py-8">
                                Chọn ít nhất một trường để xem kết quả
                            </p>
                        ) : (
                            <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                                {resultContent || 'Không có dữ liệu'}
                            </pre>
                        )}
                    </div>
                )}

                {/* Apply Button */}
                {selectedKeys.size > 0 && rules.length > 0 && (
                    <button
                        onClick={handleApply}
                        className="mt-4 w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors"
                    >
                        <Check className="w-5 h-5" />
                        Áp dụng thay đổi vào dữ liệu gốc
                    </button>
                )}
            </div>
        </div>
    );
}
