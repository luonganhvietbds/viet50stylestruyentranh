'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { FileCode, Copy, Check, Download, RefreshCw, Quote, AlignLeft, Hash, Info } from 'lucide-react';
import { copyToClipboard, saveTextFile } from '../utils/helpers';

type ExtractionMode = 'quotes' | 'lines';
type SpacingMode = 'single' | 'double';

// Storage keys
const STORAGE_KEYS = {
    input: 'data_tools_promptformat_input',
    mode: 'data_tools_promptformat_mode',
    numbering: 'data_tools_promptformat_numbering',
    spacing: 'data_tools_promptformat_spacing',
};

export function PromptFormatModule() {
    const [inputPrompt, setInputPrompt] = useState('');
    const [mode, setMode] = useState<ExtractionMode>('quotes');
    const [addNumbering, setAddNumbering] = useState(true);
    const [spacing, setSpacing] = useState<SpacingMode>('double');
    const [copied, setCopied] = useState(false);

    // Load from storage on mount
    useEffect(() => {
        try {
            const savedInput = localStorage.getItem(STORAGE_KEYS.input);
            if (savedInput) setInputPrompt(savedInput);

            const savedMode = localStorage.getItem(STORAGE_KEYS.mode);
            if (savedMode) setMode(savedMode as ExtractionMode);

            const savedNumbering = localStorage.getItem(STORAGE_KEYS.numbering);
            if (savedNumbering) setAddNumbering(savedNumbering === 'true');

            const savedSpacing = localStorage.getItem(STORAGE_KEYS.spacing);
            if (savedSpacing) setSpacing(savedSpacing as SpacingMode);
        } catch { /* ignore */ }
    }, []);

    // Save to storage on change
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEYS.input, inputPrompt);
            localStorage.setItem(STORAGE_KEYS.mode, mode);
            localStorage.setItem(STORAGE_KEYS.numbering, String(addNumbering));
            localStorage.setItem(STORAGE_KEYS.spacing, spacing);
        } catch { /* ignore */ }
    }, [inputPrompt, mode, addNumbering, spacing]);

    // Extract prompts based on mode
    const extractedPrompts = useMemo(() => {
        if (!inputPrompt.trim()) return [];

        if (mode === 'quotes') {
            // Regex to extract content inside double quotes
            // Handle escaped quotes "" (CSV style)
            const regex = /"((?:[^"]|"")*)"/g;
            const matches: string[] = [];
            let match;

            while ((match = regex.exec(inputPrompt)) !== null) {
                let content = match[1];
                // Unescape double quotes
                content = content.replace(/""/g, '"');
                // Remove excess newlines and normalize whitespace
                content = content.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
                if (content) {
                    matches.push(content);
                }
            }
            return matches;
        } else {
            // Lines mode: each non-empty paragraph is a prompt
            return inputPrompt
                .split(/\n\s*\n/)
                .map(block => block.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim())
                .filter(line => line.length > 0);
        }
    }, [inputPrompt, mode]);

    // Format output with numbering and spacing
    const formattedOutput = useMemo(() => {
        if (extractedPrompts.length === 0) return '';

        const separator = spacing === 'double' ? '\n\n' : '\n';

        return extractedPrompts
            .map((prompt, idx) => {
                if (addNumbering) {
                    return `${idx + 1}. ${prompt}`;
                }
                return prompt;
            })
            .join(separator);
    }, [extractedPrompts, addNumbering, spacing]);

    const handleCopy = async () => {
        await copyToClipboard(formattedOutput);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const handleDownload = () => {
        saveTextFile(formattedOutput, 'formatted_prompts.txt');
    };

    const handleClear = () => {
        setInputPrompt('');
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                        <FileCode className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">6. Chuẩn Hóa Prompt</h2>
                        <p className="text-sm text-gray-500">Trích xuất và chuẩn hóa danh sách prompt</p>
                    </div>
                </div>

                {/* Mode Toggle */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setMode('quotes')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors ${mode === 'quotes'
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        <Quote className="w-4 h-4" />
                        Quotes
                    </button>
                    <button
                        onClick={() => setMode('lines')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors ${mode === 'lines'
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        <AlignLeft className="w-4 h-4" />
                        Lines
                    </button>
                </div>
            </div>

            {/* Mode explanation */}
            <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                <div className="flex items-start gap-2 text-indigo-700 text-sm">
                    <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {mode === 'quotes' ? (
                        <p>
                            <strong>Quotes Mode:</strong> Trích xuất nội dung nằm trong dấu ngoặc kép "...".
                            Phù hợp với dữ liệu CSV hoặc JSON. Tự động xử lý escaped quotes ("").
                        </p>
                    ) : (
                        <p>
                            <strong>Lines Mode:</strong> Mỗi đoạn văn bản (cách nhau bởi dòng trống) được coi là một prompt độc lập.
                        </p>
                    )}
                </div>
            </div>

            {/* Options */}
            <div className="flex items-center gap-6 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={addNumbering}
                        onChange={(e) => setAddNumbering(e.target.checked)}
                        className="text-indigo-600 rounded"
                    />
                    <Hash className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">Đánh số thứ tự</span>
                </label>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Spacing:</span>
                    <select
                        value={spacing}
                        onChange={(e) => setSpacing(e.target.value as SpacingMode)}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-800"
                    >
                        <option value="single">1 dòng</option>
                        <option value="double">2 dòng</option>
                    </select>
                </div>
            </div>

            {/* Text Areas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dữ liệu gốc (CSV, Log, Text)
                    </label>
                    <textarea
                        value={inputPrompt}
                        onChange={(e) => setInputPrompt(e.target.value)}
                        placeholder={mode === 'quotes'
                            ? '"Prompt 1 content here", "Prompt 2 content here"...'
                            : 'Prompt 1 content here\n\nPrompt 2 content here\n\n...'
                        }
                        rows={14}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-800 text-sm font-mono resize-none"
                    />
                </div>

                {/* Output */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700">
                            Prompt đã chuẩn hóa
                            {extractedPrompts.length > 0 && (
                                <span className="ml-2 text-xs text-gray-400">
                                    ({extractedPrompts.length} prompts)
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
                                disabled={!formattedOutput}
                                className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-1.5 transition-colors ${copied
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={handleDownload}
                                disabled={!formattedOutput}
                                className="px-3 py-1.5 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 flex items-center gap-1.5"
                            >
                                <Download className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    <textarea
                        readOnly
                        value={formattedOutput}
                        rows={14}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 text-sm font-mono resize-none"
                    />
                </div>
            </div>
        </div>
    );
}
