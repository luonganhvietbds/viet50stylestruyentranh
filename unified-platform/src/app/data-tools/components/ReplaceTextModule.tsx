'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { FileText, Copy, Check, Download, RefreshCw, Layers, Type, Trash2, Plus, ChevronUp, ChevronDown } from 'lucide-react';
import { copyToClipboard, saveTextFile } from '../utils/helpers';

type Mode = 'regex' | 'block';

interface ReplacementRule {
    id: string;
    find: string;
    replace: string;
    isRegex: boolean;
    enabled: boolean;
}

// Storage keys
const STORAGE_KEYS = {
    mode: 'data_tools_replacetext_mode',
    inputText: 'data_tools_replacetext_input',
    rules: 'data_tools_replacetext_rules',
    lineToDelete: 'data_tools_replacetext_linetodelete',
};

export function ReplaceTextModule() {
    const [mode, setMode] = useState<Mode>('regex');
    const [inputText, setInputText] = useState('');
    const [rules, setRules] = useState<ReplacementRule[]>([]);
    const [copied, setCopied] = useState(false);
    const [lineToDelete, setLineToDelete] = useState<number>(1);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from storage on mount
    useEffect(() => {
        try {
            const savedMode = localStorage.getItem(STORAGE_KEYS.mode);
            if (savedMode) setMode(savedMode as Mode);

            const savedInput = localStorage.getItem(STORAGE_KEYS.inputText);
            if (savedInput) setInputText(savedInput);

            const savedRules = localStorage.getItem(STORAGE_KEYS.rules);
            if (savedRules) setRules(JSON.parse(savedRules));

            const savedLine = localStorage.getItem(STORAGE_KEYS.lineToDelete);
            if (savedLine) setLineToDelete(parseInt(savedLine) || 1);
        } catch { /* ignore */ }
        setIsLoaded(true);
    }, []);

    // Save to storage on change
    useEffect(() => {
        if (!isLoaded) return;
        try {
            localStorage.setItem(STORAGE_KEYS.mode, mode);
            localStorage.setItem(STORAGE_KEYS.inputText, inputText);
            localStorage.setItem(STORAGE_KEYS.rules, JSON.stringify(rules));
            localStorage.setItem(STORAGE_KEYS.lineToDelete, String(lineToDelete));
        } catch { /* ignore */ }
    }, [isLoaded, mode, inputText, rules, lineToDelete]);

    // Parse blocks (split by empty lines)
    const blocks = useMemo(() => {
        if (!inputText) return [];
        return inputText.split(/\n\s*\n/).filter(b => b.trim());
    }, [inputText]);

    // Apply rules sequentially
    const applyRules = useCallback((text: string): string => {
        let result = text;
        for (const rule of rules) {
            if (!rule.enabled || !rule.find) continue;
            try {
                if (rule.isRegex) {
                    const regex = new RegExp(rule.find, 'g');
                    result = result.replace(regex, rule.replace);
                } else {
                    result = result.split(rule.find).join(rule.replace);
                }
            } catch { /* ignore invalid regex */ }
        }
        return result;
    }, [rules]);

    // Regex mode output
    const regexOutput = useMemo(() => {
        if (!inputText) return inputText;
        return applyRules(inputText);
    }, [inputText, applyRules]);

    // Block processor output - delete line N from all blocks
    const blockOutput = useMemo(() => {
        if (blocks.length === 0 || lineToDelete < 1) return inputText;

        const processed = blocks.map(block => {
            const lines = block.split('\n');
            if (lineToDelete <= lines.length) {
                lines.splice(lineToDelete - 1, 1);
            }
            return lines.join('\n');
        });

        return processed.join('\n\n');
    }, [blocks, lineToDelete, inputText]);

    // Final output based on mode
    const outputText = mode === 'regex' ? regexOutput : blockOutput;

    // Rule management functions
    const addRule = () => {
        setRules(prev => [...prev, {
            id: Date.now().toString(),
            find: '',
            replace: '',
            isRegex: false,
            enabled: true
        }]);
    };

    const updateRule = (id: string, updates: Partial<ReplacementRule>) => {
        setRules(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    };

    const deleteRule = (id: string) => {
        setRules(prev => prev.filter(r => r.id !== id));
    };

    const moveRule = (id: string, direction: 'up' | 'down') => {
        setRules(prev => {
            const idx = prev.findIndex(r => r.id === id);
            if (idx < 0) return prev;
            const newIdx = direction === 'up' ? idx - 1 : idx + 1;
            if (newIdx < 0 || newIdx >= prev.length) return prev;
            const newRules = [...prev];
            [newRules[idx], newRules[newIdx]] = [newRules[newIdx], newRules[idx]];
            return newRules;
        });
    };

    const handleCopy = async () => {
        await copyToClipboard(outputText);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const handleDownload = () => {
        saveTextFile(outputText, 'processed_text.txt');
    };

    const handleClear = () => {
        setInputText('');
        setRules([]);
    };

    // Get max lines in any block
    const maxLinesInBlock = useMemo(() => {
        return blocks.reduce((max, block) => {
            const lines = block.split('\n').length;
            return Math.max(max, lines);
        }, 0);
    }, [blocks]);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">4. Xử Lý Văn Bản</h2>
                        <p className="text-sm text-gray-500">Find & Replace hoặc Block Processor</p>
                    </div>
                </div>

                {/* Mode Toggle */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setMode('regex')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors ${mode === 'regex'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        <Type className="w-4 h-4" />
                        Regex
                    </button>
                    <button
                        onClick={() => setMode('block')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors ${mode === 'block'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        <Layers className="w-4 h-4" />
                        Block Processor
                    </button>
                </div>
            </div>

            {/* Controls based on mode */}
            {mode === 'regex' ? (
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-700">Quy tắc thay thế</h3>
                        <button
                            onClick={addRule}
                            className="px-3 py-1.5 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 flex items-center gap-1.5 transition-colors"
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
                                                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-800"
                                            />
                                            <input
                                                type="text"
                                                value={rule.replace}
                                                onChange={e => updateRule(rule.id, { replace: e.target.value })}
                                                placeholder="Thay bằng..."
                                                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-800"
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
                                                    className="text-green-600 rounded"
                                                />
                                                <span className="text-xs text-gray-600">Regex</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={rule.enabled}
                                                    onChange={e => updateRule(rule.id, { enabled: e.target.checked })}
                                                    className="text-green-600 rounded"
                                                />
                                                <span className="text-xs text-gray-600">Enabled</span>
                                            </label>
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
            ) : (
                <div className="mb-6">
                    <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">Xóa dòng số:</span>
                            <input
                                type="number"
                                min={1}
                                max={maxLinesInBlock || 100}
                                value={lineToDelete}
                                onChange={(e) => setLineToDelete(parseInt(e.target.value) || 1)}
                                className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-800 text-center"
                            />
                        </div>
                        <span className="text-xs text-gray-500">
                            {blocks.length} khối được phát hiện • Tối đa {maxLinesInBlock} dòng/khối
                        </span>
                    </div>
                </div>
            )}

            {/* Text Areas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Văn bản gốc
                        {mode === 'block' && blocks.length > 0 && (
                            <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">
                                {blocks.length} khối
                            </span>
                        )}
                    </label>
                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={mode === 'regex'
                            ? "Dán văn bản cần xử lý vào đây..."
                            : "Dán văn bản có nhiều khối (cách nhau bằng dòng trống)..."
                        }
                        rows={14}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-800 text-sm font-mono resize-none"
                    />
                </div>

                {/* Output */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700">
                            Kết quả
                            {outputText && (
                                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                                    {outputText.split(/\n\s*\n/).filter(block => block.trim()).length} khối
                                </span>
                            )}
                        </label>
                        <div className="flex gap-2">
                            <button
                                onClick={handleClear}
                                className="p-1.5 text-gray-400 hover:text-gray-600 rounded transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleCopy}
                                disabled={!outputText}
                                className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-1.5 transition-colors ${copied
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={handleDownload}
                                disabled={!outputText}
                                className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center gap-1.5 transition-colors"
                            >
                                <Download className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    <textarea
                        readOnly
                        value={outputText}
                        rows={14}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 text-sm font-mono resize-none"
                    />
                </div>
            </div>
        </div>
    );
}
