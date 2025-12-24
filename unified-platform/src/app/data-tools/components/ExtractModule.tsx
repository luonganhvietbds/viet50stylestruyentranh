'use client';

import React, { useState, useMemo } from 'react';
import { Check, Copy, Download, Sparkles, Table, LayoutGrid, CheckSquare, Square } from 'lucide-react';
import { DataToolsHook } from '../hooks/useDataTools';
import { exportToCsv, copyToClipboard, saveTextFile } from '../utils/helpers';

interface ExtractModuleProps {
    hook: DataToolsHook;
    onSendToGemini: () => void;
}

export function ExtractModule({ hook, onSendToGemini }: ExtractModuleProps) {
    const [viewMode, setViewMode] = useState<'table' | 'blocks'>('table');
    const [copiedCell, setCopiedCell] = useState<string | null>(null);

    const selectedKeysArray = useMemo(() => Array.from(hook.selectedKeys), [hook.selectedKeys]);

    const handleCopyCell = async (value: unknown, cellId: string) => {
        const text = typeof value === 'string' ? value : JSON.stringify(value);
        const success = await copyToClipboard(text);
        if (success) {
            setCopiedCell(cellId);
            setTimeout(() => setCopiedCell(null), 1500);
        }
    };

    const handleCopyColumn = async (key: string) => {
        const content = hook.getColumnData(key);
        await copyToClipboard(content);
        setCopiedCell(`col_${key}`);
        setTimeout(() => setCopiedCell(null), 1500);
    };

    const handleCopyMerged = async () => {
        const content = hook.getMergedData();
        await copyToClipboard(content);
        setCopiedCell('merged');
        setTimeout(() => setCopiedCell(null), 1500);
    };

    const handleExportCsv = () => {
        exportToCsv(hook.sceneData, selectedKeysArray);
    };

    const handleSendToGemini = () => {
        const content = hook.getMergedData();
        hook.setGeminiContext(content);
        onSendToGemini();
    };

    const handleDownloadColumn = (key: string) => {
        const content = hook.getColumnData(key);
        saveTextFile(content, `${key}.txt`);
    };

    if (hook.sceneData.length === 0) {
        return (
            <div className="text-center py-16 text-gray-400">
                <Table className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Chưa có dữ liệu</p>
                <p className="text-sm mt-2">Vui lòng import dữ liệu ở tab Nhập liệu</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-220px)]">
            {/* Sidebar: Key Selection */}
            <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
                <div className="p-4 border-b bg-gray-50 font-semibold text-gray-700 flex items-center justify-between">
                    <span>Chọn Trường Dữ Liệu</span>
                    <span className="text-xs font-normal text-gray-400">
                        {hook.selectedKeys.size}/{hook.availableKeys.length}
                    </span>
                </div>

                {/* Quick Actions */}
                <div className="p-2 border-b border-gray-100 flex gap-2">
                    <button
                        onClick={hook.selectAllKeys}
                        className="flex-1 text-xs py-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                        Chọn tất cả
                    </button>
                    <button
                        onClick={hook.deselectAllKeys}
                        className="flex-1 text-xs py-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    >
                        Bỏ chọn
                    </button>
                </div>

                {/* Key List */}
                <div className="flex-1 overflow-y-auto p-2">
                    {hook.availableKeys.map(key => (
                        <label
                            key={key}
                            className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer group"
                        >
                            <button
                                onClick={() => hook.toggleKey(key)}
                                className="text-gray-400 group-hover:text-gray-600"
                            >
                                {hook.selectedKeys.has(key) ? (
                                    <CheckSquare className="w-4 h-4 text-orange-500" />
                                ) : (
                                    <Square className="w-4 h-4" />
                                )}
                            </button>
                            <span className="text-sm truncate flex-1" title={key}>{key}</span>
                            <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100">
                                {hook.sceneData.filter(d => d[key] !== undefined).length}
                            </span>
                        </label>
                    ))}
                </div>

                {/* Tools */}
                <div className="p-4 border-t bg-gray-50 space-y-2">
                    <p className="text-xs text-gray-500 font-medium mb-2">Công cụ chung:</p>
                    <button
                        onClick={handleCopyMerged}
                        disabled={hook.selectedKeys.size === 0}
                        className="w-full py-2 px-3 text-sm font-medium bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                        {copiedCell === 'merged' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        Sao chép Tất cả
                    </button>
                    <button
                        onClick={handleSendToGemini}
                        disabled={hook.selectedKeys.size === 0}
                        className="w-full py-2 px-3 text-sm font-medium bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                        <Sparkles className="w-4 h-4" />
                        Gửi qua Gemini
                    </button>
                    <button
                        onClick={handleExportCsv}
                        disabled={hook.selectedKeys.size === 0}
                        className="w-full py-2 px-3 text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Xuất CSV
                    </button>
                </div>
            </div>

            {/* Main View */}
            <div className="lg:col-span-9 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                {/* View Switcher */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors ${viewMode === 'table'
                                    ? 'bg-orange-100 text-orange-700'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            <Table className="w-3.5 h-3.5" />
                            Bảng
                        </button>
                        <button
                            onClick={() => setViewMode('blocks')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors ${viewMode === 'blocks'
                                    ? 'bg-orange-100 text-orange-700'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            <LayoutGrid className="w-3.5 h-3.5" />
                            Khối Cột
                        </button>
                    </div>
                    <span className="text-xs text-gray-400">
                        {hook.sceneData.length} rows • {selectedKeysArray.length} columns
                    </span>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto bg-gray-50 p-4">
                    {hook.selectedKeys.size === 0 ? (
                        <div className="flex h-full items-center justify-center text-gray-400">
                            <div className="text-center">
                                <LayoutGrid className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>Chọn ít nhất một trường dữ liệu ở menu bên trái</p>
                            </div>
                        </div>
                    ) : viewMode === 'table' ? (
                        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-12">#</th>
                                            {selectedKeysArray.map(key => (
                                                <th
                                                    key={key}
                                                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[200px]"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className="truncate">{key}</span>
                                                        <button
                                                            onClick={() => handleCopyColumn(key)}
                                                            className="p-1 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100"
                                                            title="Copy column"
                                                        >
                                                            <Copy className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {hook.sceneData.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50">
                                                <td className="px-4 py-2 text-xs text-gray-400">{idx + 1}</td>
                                                {selectedKeysArray.map(key => {
                                                    const cellId = `${idx}_${key}`;
                                                    const val = row[key];
                                                    return (
                                                        <td
                                                            key={key}
                                                            className="px-4 py-2 text-sm text-gray-900 whitespace-pre-wrap min-w-[200px] max-w-md cursor-pointer hover:bg-blue-50 transition-colors relative group"
                                                            onClick={() => handleCopyCell(val, cellId)}
                                                            title="Click để sao chép"
                                                        >
                                                            <div className="truncate max-h-24 overflow-hidden">
                                                                {typeof val === 'object' ? JSON.stringify(val) : String(val ?? '')}
                                                            </div>
                                                            {copiedCell === cellId && (
                                                                <span className="absolute top-1 right-1 text-xs text-green-600 bg-green-100 px-1.5 py-0.5 rounded">
                                                                    Copied!
                                                                </span>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        /* Block View */
                        <div className="flex gap-4 h-full overflow-x-auto pb-2">
                            {selectedKeysArray.map(key => {
                                const content = hook.getColumnData(key);
                                return (
                                    <div
                                        key={key}
                                        className="flex-shrink-0 w-[400px] flex flex-col bg-white rounded-lg shadow border border-gray-200 h-full"
                                    >
                                        <div className="p-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                                            <span className="font-bold text-sm text-gray-700 truncate" title={key}>
                                                {key}
                                            </span>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => handleCopyColumn(key)}
                                                    className={`p-1.5 rounded transition-colors ${copiedCell === `col_${key}`
                                                            ? 'text-green-600 bg-green-50'
                                                            : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                                                        }`}
                                                    title="Sao chép"
                                                >
                                                    {copiedCell === `col_${key}` ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={() => handleDownloadColumn(key)}
                                                    className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                                    title="Tải về .txt"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <textarea
                                            readOnly
                                            value={content}
                                            className="flex-1 p-3 text-xs font-mono resize-none focus:outline-none w-full bg-white text-gray-800"
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
