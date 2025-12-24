'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Segment, SuggestionType } from '@/lib/voice-editor/types';
import { countSyllables } from '@/lib/voice-editor/syllableCounter';
import {
    Sparkles,
    Plus,
    Trash2,
    Check,
    X,
    Loader2,
    ArrowUp,
    ArrowDown,
    Merge,
    ChevronDown,
    GripVertical
} from 'lucide-react';

interface SegmentItemProps {
    segment: Segment;
    prevSegment: Segment | null;
    nextSegment: Segment | null;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
    onUpdate: (id: string, newText: string, newNote: string) => void;
    onAddAfter: (id: string) => void;
    onMergeWithNextAi: (id: string) => Promise<void>;
    onManualMerge: (id: string, direction: 'prev' | 'next') => void;
    onGetAiSuggestion: (segment: Segment, type?: SuggestionType) => Promise<string>;
    minSyllables: number;
    maxSyllables: number;
}

export function SegmentItem({
    segment,
    prevSegment,
    nextSegment,
    isSelected,
    onSelect,
    onDelete,
    onUpdate,
    onAddAfter,
    onMergeWithNextAi,
    onManualMerge,
    onGetAiSuggestion,
    minSyllables,
    maxSyllables
}: SegmentItemProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(segment.text);
    const [editNote, setEditNote] = useState(segment.note);
    const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
    const [isLoadingAi, setIsLoadingAi] = useState(false);
    const [isMerging, setIsMerging] = useState(false);
    const [showMergeMenu, setShowMergeMenu] = useState(false);

    useEffect(() => {
        setEditText(segment.text);
        setEditNote(segment.note);
    }, [segment.text, segment.note]);

    const syllableCount = useMemo(() => countSyllables(editText), [editText]);
    const isValid = syllableCount >= minSyllables && syllableCount <= maxSyllables;

    const getBorderColor = () => {
        if (isSelected) return 'border-blue-500 ring-2 ring-blue-300';
        if (!isValid) return 'border-red-400';
        return 'border-emerald-400';
    };

    const handleSave = () => {
        onUpdate(segment.segment_id, editText, editNote);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditText(segment.text);
        setEditNote(segment.note);
        setIsEditing(false);
    };

    const handleGetAiSuggestion = async () => {
        setIsLoadingAi(true);
        setAiSuggestions([]);

        // Get suggestions for all 3 types
        const types: SuggestionType[] = ['padding', 'contextual', 'optimization'];
        const suggestions: string[] = [];

        for (const type of types) {
            try {
                const suggestion = await onGetAiSuggestion(segment, type);
                suggestions.push(suggestion);
            } catch {
                suggestions.push(`Lỗi khi lấy gợi ý ${type}`);
            }
        }

        setAiSuggestions(suggestions);
        setIsLoadingAi(false);
    };

    const applySuggestion = (suggestion: string) => {
        setEditText(suggestion);
        setAiSuggestions([]);
    };

    const handleMergeAi = async () => {
        setIsMerging(true);
        setShowMergeMenu(false);
        try {
            await onMergeWithNextAi(segment.segment_id);
        } finally {
            setIsMerging(false);
        }
    };

    if (isMerging) {
        return (
            <div className="bg-white p-4 rounded-lg border-2 border-indigo-400 flex gap-3 items-center justify-center animate-pulse">
                <Merge className="w-6 h-6 text-indigo-500" />
                <span className="font-semibold text-indigo-700">Đang ghép nối bằng AI...</span>
            </div>
        );
    }

    const suggestionTitles = [
        "Thêm từ đệm (giữ nội dung gốc)",
        "Viết lại theo ngữ cảnh",
        "Tối ưu & làm mượt câu"
    ];

    return (
        <div
            onDoubleClick={() => !isEditing && setIsEditing(true)}
            title={isEditing ? '' : 'Nháy đúp để sửa'}
            className={`bg-white p-4 rounded-lg border-2 transition-all duration-200 ${getBorderColor()} flex gap-3 ${!isEditing ? 'cursor-pointer hover:shadow-md' : ''}`}
        >
            <div className="flex flex-col items-center gap-2 pt-1">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onSelect(segment.segment_id)}
                    className="form-checkbox h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <GripVertical className="w-5 h-5 text-gray-400 cursor-grab" />
            </div>

            <div className="flex-grow">
                <div className="flex justify-between items-start">
                    <span className="font-mono text-sm font-semibold text-indigo-600">{segment.segment_id}</span>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${isValid ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                        {syllableCount} âm tiết
                    </span>
                </div>

                {isEditing ? (
                    <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full mt-2 p-2 border border-gray-300 rounded-md text-gray-800 bg-gray-50 text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        rows={3}
                        autoFocus
                    />
                ) : (
                    <p className="mt-2 text-gray-800 text-base">{segment.text}</p>
                )}

                {isEditing ? (
                    <input
                        type="text"
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        placeholder="Nhập ghi chú ngắn..."
                        className="w-full mt-2 p-2 border border-gray-300 rounded-md text-sm text-gray-600"
                    />
                ) : (
                    segment.note && <p className="mt-2 text-sm text-gray-500 italic">Ghi chú: {segment.note}</p>
                )}

                {isLoadingAi && (
                    <div className="mt-2 text-sm text-gray-500 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Đang lấy gợi ý từ AI...
                    </div>
                )}

                {aiSuggestions.length > 0 && (
                    <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm font-bold text-gray-800">✨ AI Gợi ý</h4>
                            <button onClick={() => setAiSuggestions([])} className="text-xs text-gray-500 hover:underline">Đóng</button>
                        </div>
                        <div className="space-y-3">
                            {aiSuggestions.map((s, i) => {
                                const title = suggestionTitles[i] || `Gợi ý ${i + 1}`;
                                const suggestionSyllables = countSyllables(s);
                                const suggestionValid = suggestionSyllables >= minSyllables && suggestionSyllables <= maxSyllables;

                                return (
                                    <div key={i} className="bg-white p-3 rounded-md border border-gray-200 shadow-sm">
                                        <p className="text-xs font-semibold text-indigo-600 mb-1">{title}</p>
                                        <p className="text-sm text-gray-700 flex-grow mb-2">"{s}"</p>
                                        <div className="flex items-center justify-between">
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${suggestionValid ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                                                {suggestionSyllables} âm tiết
                                            </span>
                                            <button onClick={() => applySuggestion(s)} className="text-xs font-bold text-indigo-600 hover:underline flex-shrink-0">
                                                ÁP DỤNG
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="mt-3 flex items-center justify-end gap-1 relative z-10">
                    {isEditing ? (
                        <>
                            <button onClick={handleSave} className="px-3 py-1 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700 flex items-center gap-1">
                                <Check className="w-3 h-3" /> Lưu
                            </button>
                            <button onClick={handleCancel} className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 flex items-center gap-1">
                                <X className="w-3 h-3" /> Hủy
                            </button>
                        </>
                    ) : null}

                    <button
                        onClick={handleGetAiSuggestion}
                        disabled={isEditing || isLoadingAi}
                        title="AI gợi ý"
                        className="p-2 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed"
                    >
                        <Sparkles className="w-4 h-4" />
                    </button>

                    <div className="relative">
                        <button
                            onClick={() => setShowMergeMenu(!showMergeMenu)}
                            disabled={isEditing || isLoadingAi}
                            title="Gộp segments (Thủ công/AI)"
                            className={`p-2 rounded-full disabled:text-gray-300 disabled:cursor-not-allowed transition-colors ${showMergeMenu ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:text-indigo-600 hover:bg-gray-100'}`}
                        >
                            <Merge className="w-4 h-4" />
                        </button>
                        {showMergeMenu && (
                            <>
                                <div className="fixed inset-0 z-20" onClick={() => setShowMergeMenu(false)} />
                                <div className="absolute bottom-full right-0 mb-2 w-64 bg-white rounded-md shadow-xl border border-gray-200 z-30 overflow-hidden flex flex-col">
                                    {prevSegment ? (
                                        <button
                                            onClick={() => { onManualMerge(segment.segment_id, 'prev'); setShowMergeMenu(false); }}
                                            className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100 flex items-center gap-3 text-gray-700 transition-colors"
                                        >
                                            <ArrowUp className="w-4 h-4 text-indigo-500" />
                                            <span>Gộp với trên <span className="text-xs text-gray-400 ml-1 block">(Giữ nguyên nội dung)</span></span>
                                        </button>
                                    ) : (
                                        <span className="w-full text-left px-4 py-3 text-sm text-gray-300 flex items-center gap-3 cursor-not-allowed bg-gray-50">
                                            <ArrowUp className="w-4 h-4" /> Gộp với trên
                                        </span>
                                    )}
                                    <div className="h-px bg-gray-100 mx-2" />
                                    {nextSegment ? (
                                        <button
                                            onClick={() => { onManualMerge(segment.segment_id, 'next'); setShowMergeMenu(false); }}
                                            className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100 flex items-center gap-3 text-gray-700 transition-colors"
                                        >
                                            <ArrowDown className="w-4 h-4 text-indigo-500" />
                                            <span>Gộp với dưới <span className="text-xs text-gray-400 ml-1 block">(Giữ nguyên nội dung)</span></span>
                                        </button>
                                    ) : (
                                        <span className="w-full text-left px-4 py-3 text-sm text-gray-300 flex items-center gap-3 cursor-not-allowed bg-gray-50">
                                            <ArrowDown className="w-4 h-4" /> Gộp với dưới
                                        </span>
                                    )}
                                    {nextSegment && (
                                        <>
                                            <div className="h-px bg-gray-100 mx-2" />
                                            <button onClick={handleMergeAi} className="w-full text-left px-4 py-3 text-sm hover:bg-indigo-50 text-indigo-700 flex items-center gap-3 transition-colors font-medium">
                                                <Sparkles className="w-4 h-4" /> Gộp & Viết lại (AI)
                                            </button>
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    <button
                        onClick={() => onAddAfter(segment.segment_id)}
                        disabled={isEditing || isLoadingAi}
                        title="Thêm segment sau"
                        className="p-2 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDelete(segment.segment_id)}
                        disabled={isEditing || isLoadingAi}
                        title="Xóa segment"
                        className="p-2 text-red-500 hover:text-red-700 rounded-full hover:bg-red-50 disabled:text-red-300 disabled:cursor-not-allowed"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default SegmentItem;
