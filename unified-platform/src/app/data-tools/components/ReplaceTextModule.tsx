'use client';

import React, { useState } from 'react';
import { FileText, Copy, Check, Download, RefreshCw } from 'lucide-react';
import { copyToClipboard, saveTextFile } from '../utils/helpers';

export function ReplaceTextModule() {
    const [inputText, setInputText] = useState('');
    const [findText, setFindText] = useState('');
    const [replaceText, setReplaceText] = useState('');
    const [isRegex, setIsRegex] = useState(false);
    const [copied, setCopied] = useState(false);

    // Apply replacement
    const outputText = React.useMemo(() => {
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

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-green-600" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-800">4. Xử Lý Văn Bản</h2>
                    <p className="text-sm text-gray-500">Find & Replace cho văn bản tự do</p>
                </div>
            </div>

            {/* Controls */}
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

            {/* Text Areas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Văn bản gốc</label>
                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Dán văn bản cần xử lý vào đây..."
                        rows={12}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-800 text-sm font-mono resize-none"
                    />
                </div>

                {/* Output */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700">Kết quả</label>
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
                        rows={12}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 text-sm font-mono resize-none"
                    />
                </div>
            </div>
        </div>
    );
}
