'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { FileText, Copy, Check, Download, RefreshCw, Layers, Type, Trash2 } from 'lucide-react';
import { copyToClipboard, saveTextFile } from '../utils/helpers';

type Mode = 'regex' | 'block';

// Storage keys
const STORAGE_KEYS = {
    mode: 'data_tools_replacetext_mode',
    inputText: 'data_tools_replacetext_input',
    findText: 'data_tools_replacetext_find',
    replaceText: 'data_tools_replacetext_replace',
    isRegex: 'data_tools_replacetext_isregex',
    lineToDelete: 'data_tools_replacetext_linetodelete',
};

export function ReplaceTextModule() {
    const [mode, setMode] = useState<Mode>('regex');
    const [inputText, setInputText] = useState('');
    const [findText, setFindText] = useState('');
    const [replaceText, setReplaceText] = useState('');
    const [isRegex, setIsRegex] = useState(false);
    const [copied, setCopied] = useState(false);
    const [lineToDelete, setLineToDelete] = useState<number>(1);

    // Load from storage on mount
    useEffect(() => {
        try {
            const savedMode = localStorage.getItem(STORAGE_KEYS.mode);
            if (savedMode) setMode(savedMode as Mode);

            const savedInput = localStorage.getItem(STORAGE_KEYS.inputText);
            if (savedInput) setInputText(savedInput);

            const savedFind = localStorage.getItem(STORAGE_KEYS.findText);
            if (savedFind) setFindText(savedFind);

            const savedReplace = localStorage.getItem(STORAGE_KEYS.replaceText);
            if (savedReplace) setReplaceText(savedReplace);

            const savedIsRegex = localStorage.getItem(STORAGE_KEYS.isRegex);
            if (savedIsRegex) setIsRegex(savedIsRegex === 'true');

            const savedLine = localStorage.getItem(STORAGE_KEYS.lineToDelete);
            if (savedLine) setLineToDelete(parseInt(savedLine) || 1);
        } catch { /* ignore */ }
    }, []);

    // Save to storage on change
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEYS.mode, mode);
            localStorage.setItem(STORAGE_KEYS.inputText, inputText);
            localStorage.setItem(STORAGE_KEYS.findText, findText);
            localStorage.setItem(STORAGE_KEYS.replaceText, replaceText);
            localStorage.setItem(STORAGE_KEYS.isRegex, String(isRegex));
            localStorage.setItem(STORAGE_KEYS.lineToDelete, String(lineToDelete));
        } catch { /* ignore */ }
    }, [mode, inputText, findText, replaceText, isRegex, lineToDelete]);

    // Parse blocks (split by empty lines)
    const blocks = useMemo(() => {
        if (!inputText) return [];
        return inputText.split(/\n\s*\n/).filter(b => b.trim());
    }, [inputText]);

    // Regex mode output
    const regexOutput = useMemo(() => {
        if (!inputText || !findText) return inputText;

        try {
            if (isRegex) {
                const regex = new RegExp(findText, 'g');
                return inputText.replace(regex, replaceText);
            } else {
                return inputText.split(findText).join(replaceText);
            }
        } catch {
            return inputText;
        }
    }, [inputText, findText, replaceText, isRegex]);

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
        setFindText('');
        setReplaceText('');
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tìm</label>
                        <input
                            type="text"
                            value={findText}
                            onChange={(e) => setFindText(e.target.value)}
                            placeholder="Văn bản cần tìm"
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-800"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Thay bằng</label>
                        <input
                            type="text"
                            value={replaceText}
                            onChange={(e) => setReplaceText(e.target.value)}
                            placeholder="Văn bản thay thế"
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-800"
                        />
                    </div>
                    <div className="flex items-end gap-2">
                        <label className="flex items-center gap-2 cursor-pointer py-2.5">
                            <input
                                type="checkbox"
                                checked={isRegex}
                                onChange={(e) => setIsRegex(e.target.checked)}
                                className="text-green-600 rounded"
                            />
                            <span className="text-sm text-gray-700">Regex</span>
                        </label>
                        <button
                            onClick={handleClear}
                            className="px-4 py-2.5 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800 mb-3">
                        <strong>Block Processor:</strong> Chia văn bản thành các khối (theo dòng trống).
                        Chọn số dòng để xóa khỏi TẤT CẢ các khối.
                    </p>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700">Xóa dòng số:</label>
                            <input
                                type="number"
                                min={1}
                                max={maxLinesInBlock || 10}
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
                            <span className="ml-2 text-xs text-gray-400">({blocks.length} blocks)</span>
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
                                    {outputText.split('\n').filter(line => line.trim()).length} dòng
                                </span>
                            )}
                        </label>
                        <div className="flex gap-2">
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
