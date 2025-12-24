'use client';

import React, { useState } from 'react';
import { FileCode, Copy, Check, Download, RefreshCw, Info } from 'lucide-react';
import { copyToClipboard, saveTextFile } from '../utils/helpers';

export function PromptFormatModule() {
    const [inputPrompt, setInputPrompt] = useState('');
    const [characterTokens, setCharacterTokens] = useState<string[]>([]);
    const [copied, setCopied] = useState(false);

    // Parse character tokens from input
    React.useEffect(() => {
        const matches = inputPrompt.match(/\{\{\s*([^}]+)\s*\}\}/g) || [];
        const tokens = [...new Set(matches.map(m => m.replace(/\{\{\s*|\s*\}\}/g, '')))];
        setCharacterTokens(tokens);
    }, [inputPrompt]);

    // Format prompt - ensure proper structure
    const formattedPrompt = React.useMemo(() => {
        if (!inputPrompt.trim()) return '';

        let result = inputPrompt;

        // Ensure tokens are properly formatted
        result = result.replace(/\{\{\s*([^}]+)\s*\}\}/g, '{{ $1 }}');

        // Add scene header if missing
        if (!result.includes('SCENE_')) {
            result = `SCENE_001 | [STYLE] [ASPECT_16_9]\n${result}`;
        }

        return result;
    }, [inputPrompt]);

    const handleCopy = async () => {
        await copyToClipboard(formattedPrompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const handleDownload = () => {
        saveTextFile(formattedPrompt, 'formatted_prompt.txt');
    };

    const handleClear = () => {
        setInputPrompt('');
    };

    // Insert token template
    const insertToken = (name: string) => {
        setInputPrompt(prev => `{{ ${name} }}\n${prev}`);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <FileCode className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-800">6. Chuẩn Hóa Prompt</h2>
                    <p className="text-sm text-gray-500">Định dạng và chuẩn hóa prompt cho AI</p>
                </div>
            </div>

            {/* Quick Insert Tokens */}
            <div className="mb-4 flex flex-wrap gap-2">
                <span className="text-sm text-gray-500 mr-2">Quick insert:</span>
                {['Character A', 'Character B', 'Location', 'Object'].map(name => (
                    <button
                        key={name}
                        onClick={() => insertToken(name)}
                        className="px-2 py-1 text-xs bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 transition-colors"
                    >
                        {'{{ ' + name + ' }}'}
                    </button>
                ))}
            </div>

            {/* Text Areas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Prompt gốc</label>
                    <textarea
                        value={inputPrompt}
                        onChange={(e) => setInputPrompt(e.target.value)}
                        placeholder="Dán prompt cần chuẩn hóa...&#10;&#10;Ví dụ:&#10;{{ Character A }}&#10;SCENE_001 | [STYLE] [ASPECT_16_9]&#10;Description of the scene..."
                        rows={14}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-800 text-sm font-mono resize-none"
                    />
                </div>

                {/* Output */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700">Prompt đã chuẩn hóa</label>
                        <div className="flex gap-2">
                            <button
                                onClick={handleClear}
                                className="p-1.5 text-gray-400 hover:text-gray-600 rounded transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleCopy}
                                disabled={!formattedPrompt}
                                className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-1.5 transition-colors ${copied
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={handleDownload}
                                disabled={!formattedPrompt}
                                className="px-3 py-1.5 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 flex items-center gap-1.5"
                            >
                                <Download className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    <textarea
                        readOnly
                        value={formattedPrompt}
                        rows={14}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 text-sm font-mono resize-none"
                    />
                </div>
            </div>

            {/* Detected Tokens */}
            {characterTokens.length > 0 && (
                <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <div className="flex items-center gap-2 text-indigo-700 text-sm">
                        <Info className="w-4 h-4" />
                        <span>Tokens tìm thấy: </span>
                        {characterTokens.map((token, i) => (
                            <span key={token} className="px-2 py-0.5 bg-indigo-100 rounded font-medium">
                                {token}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
