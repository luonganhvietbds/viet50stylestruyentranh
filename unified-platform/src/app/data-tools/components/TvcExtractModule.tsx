'use client';

import React, { useState, useMemo } from 'react';
import { Scissors, Copy, Download, Check, ChevronDown, Database, Hash, Type, List, Braces } from 'lucide-react';
import { DataToolsHook } from '../hooks/useDataTools';
import { copyToClipboard, saveTextFile, getValueByPath, formatFieldType } from '../utils/helpers';
import { FieldInfo, FieldType } from '../types';

interface TvcExtractModuleProps {
    hook: DataToolsHook;
}

// Type badge colors
const getTypeBadgeColor = (type: FieldType): string => {
    const colors: Record<FieldType, string> = {
        string: 'bg-green-100 text-green-700',
        number: 'bg-blue-100 text-blue-700',
        boolean: 'bg-yellow-100 text-yellow-700',
        array: 'bg-purple-100 text-purple-700',
        object: 'bg-orange-100 text-orange-700',
        null: 'bg-gray-100 text-gray-500',
        mixed: 'bg-red-100 text-red-700',
        unknown: 'bg-gray-100 text-gray-400',
    };
    return colors[type] || colors.unknown;
};

// Type icon
const TypeIcon = ({ type }: { type: FieldType }) => {
    const iconClass = "w-3 h-3";
    switch (type) {
        case 'string': return <Type className={iconClass} />;
        case 'number': return <Hash className={iconClass} />;
        case 'array': return <List className={iconClass} />;
        case 'object': return <Braces className={iconClass} />;
        default: return <Database className={iconClass} />;
    }
};

export function TvcExtractModule({ hook }: TvcExtractModuleProps) {
    const [selectedPath, setSelectedPath] = useState<string | null>(null);
    const [separator, setSeparator] = useState<string>('\\n\\n');
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const { dataAnalysis, sceneData } = hook;

    // Get field info for selected path
    const selectedFieldInfo: FieldInfo | undefined = useMemo(() => {
        if (!selectedPath) return undefined;
        return dataAnalysis.fields.find(f => f.path === selectedPath);
    }, [selectedPath, dataAnalysis.fields]);

    // Get content for selected path (supports nested paths)
    const rawContent = useMemo(() => {
        if (!selectedPath || sceneData.length === 0) return '';
        return sceneData
            .map(item => getValueByPath(item, selectedPath))
            .filter(val => val !== undefined && val !== null)
            .map(val => typeof val === 'string' ? val : JSON.stringify(val))
            .join('\n');
    }, [selectedPath, sceneData]);

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
        saveTextFile(segments.join('\n---\n'), `${selectedPath || 'tvc'}_segments.txt`);
    };

    if (sceneData.length === 0) {
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

            {/* Data Analysis Summary */}
            <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-100">
                <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-purple-600" />
                        <span className="text-gray-600">Tổng rows:</span>
                        <span className="font-bold text-purple-700">{dataAnalysis.totalRows}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4 text-indigo-600" />
                        <span className="text-gray-600">Tổng fields:</span>
                        <span className="font-bold text-indigo-700">{dataAnalysis.totalFields}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Braces className="w-4 h-4 text-blue-600" />
                        <span className="text-gray-600">Top-level:</span>
                        <span className="font-bold text-blue-700">{dataAnalysis.topLevelKeys.length}</span>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Path Selection with Type Info */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Chọn trường dữ liệu
                    </label>
                    <div className="relative">
                        <select
                            value={selectedPath || ''}
                            onChange={(e) => setSelectedPath(e.target.value || null)}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg appearance-none cursor-pointer focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800"
                        >
                            <option value="">-- Chọn trường ({dataAnalysis.totalFields} fields) --</option>
                            {dataAnalysis.fields.map(field => (
                                <option key={field.path} value={field.path}>
                                    {field.isNested ? '  └ ' : ''}{field.path} [{field.type}] ({field.fillRate}%)
                                </option>
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

            {/* Selected Field Info */}
            {selectedFieldInfo && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${getTypeBadgeColor(selectedFieldInfo.type)}`}>
                            <TypeIcon type={selectedFieldInfo.type} />
                            {formatFieldType(selectedFieldInfo)}
                        </span>
                        <span className="text-xs text-gray-500">
                            Có dữ liệu: <strong className="text-green-600">{selectedFieldInfo.filledCount}</strong>/{selectedFieldInfo.totalCount}
                        </span>
                        <span className="text-xs text-gray-500">
                            Trống: <strong className="text-orange-600">{selectedFieldInfo.emptyCount}</strong>
                        </span>
                        <span className="text-xs text-gray-500">
                            Fill rate: <strong className={selectedFieldInfo.fillRate > 80 ? 'text-green-600' : selectedFieldInfo.fillRate > 50 ? 'text-yellow-600' : 'text-red-600'}>
                                {selectedFieldInfo.fillRate}%
                            </strong>
                        </span>
                        {selectedFieldInfo.sampleValue !== null && selectedFieldInfo.sampleValue !== undefined && (
                            <span className="text-xs text-gray-400 italic truncate max-w-xs" title={String(selectedFieldInfo.sampleValue)}>
                                Sample: {String(selectedFieldInfo.sampleValue).substring(0, 50)}...
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Results */}
            {selectedPath && segments.length > 0 && (
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

            {selectedPath && segments.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                    <p>Không tìm thấy phân đoạn nào với dấu phân cách hiện tại</p>
                </div>
            )}
        </div>
    );
}
