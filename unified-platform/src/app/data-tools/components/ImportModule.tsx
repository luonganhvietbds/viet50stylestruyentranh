'use client';

import React, { useState } from 'react';
import { Upload, FileJson, AlertTriangle, Trash2, Plus, RefreshCw } from 'lucide-react';
import { DataToolsHook } from '../hooks/useDataTools';
import { safeJsonParse } from '../utils/helpers';
import { Scene } from '../types';

interface ImportModuleProps {
    hook: DataToolsHook;
    onNext: () => void;
}

export function ImportModule({ hook, onNext }: ImportModuleProps) {
    const [inputData, setInputData] = useState('');
    const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
    const [error, setError] = useState<string | null>(null);

    const handleImport = () => {
        setError(null);

        if (!inputData.trim()) {
            setError('Vui lòng nhập dữ liệu JSON');
            return;
        }

        const parsed = safeJsonParse<Scene[] | Scene>(inputData.trim());

        if (!parsed) {
            setError('JSON không hợp lệ. Vui lòng kiểm tra lại định dạng.');
            return;
        }

        // Handle array or single object, also handle { segments: [...] } structure
        let dataArray: Scene[];

        if (Array.isArray(parsed)) {
            dataArray = parsed;
        } else if (typeof parsed === 'object' && parsed !== null) {
            // Check for segments, data, items keys
            const obj = parsed as Record<string, unknown>;
            if (Array.isArray(obj.segments)) {
                dataArray = obj.segments as Scene[];
            } else if (Array.isArray(obj.data)) {
                dataArray = obj.data as Scene[];
            } else if (Array.isArray(obj.items)) {
                dataArray = obj.items as Scene[];
            } else {
                dataArray = [parsed as Scene];
            }
        } else {
            dataArray = [parsed as Scene];
        }

        if (dataArray.length === 0) {
            setError('Không tìm thấy dữ liệu hợp lệ.');
            return;
        }

        if (importMode === 'replace') {
            hook.replaceData(dataArray);
        } else {
            hook.importData(dataArray);
        }

        setInputData('');
        onNext();
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            setInputData(content);
        };
        reader.onerror = () => {
            setError('Không thể đọc file');
        };
        reader.readAsText(file);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                    <FileJson className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-800">1. Nhập Liệu JSON</h2>
                    <p className="text-sm text-gray-500">Dán JSON data hoặc upload file</p>
                </div>
            </div>

            {/* Import Mode Toggle */}
            <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="radio"
                        checked={importMode === 'append'}
                        onChange={() => setImportMode('append')}
                        className="text-orange-600"
                    />
                    <span className="text-sm text-gray-700">Thêm vào dữ liệu hiện có</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="radio"
                        checked={importMode === 'replace'}
                        onChange={() => setImportMode('replace')}
                        className="text-orange-600"
                    />
                    <span className="text-sm text-gray-700">Thay thế dữ liệu</span>
                </label>
            </div>

            {/* File Upload */}
            <div className="mb-4">
                <label className="flex items-center justify-center w-full h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors">
                    <div className="flex items-center gap-2 text-gray-500">
                        <Upload className="w-5 h-5" />
                        <span className="text-sm">Click hoặc kéo thả file .json</span>
                    </div>
                    <input
                        type="file"
                        accept=".json"
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                </label>
            </div>

            {/* Textarea */}
            <textarea
                value={inputData}
                onChange={(e) => {
                    setInputData(e.target.value);
                    setError(null);
                }}
                placeholder='[{"scene": 1, "imagePrompt": "...", "videoPrompt": "..."}, ...]'
                className="w-full h-64 p-4 font-mono text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800 resize-none"
            />

            {/* Error */}
            {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    {error}
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between mt-6">
                <div className="flex items-center gap-4">
                    <p className="text-sm text-gray-500">
                        Dữ liệu hiện có: <span className="font-bold text-orange-600">{hook.sceneData.length}</span> rows
                    </p>
                    {hook.sceneData.length > 0 && (
                        <button
                            onClick={hook.clearProject}
                            className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Xóa tất cả
                        </button>
                    )}
                </div>
                <button
                    onClick={handleImport}
                    disabled={!inputData.trim()}
                    className="px-6 py-2.5 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                    {importMode === 'replace' ? <RefreshCw className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {importMode === 'replace' ? 'Import & Thay thế' : 'Import & Tiếp tục'}
                </button>
            </div>
        </div>
    );
}
