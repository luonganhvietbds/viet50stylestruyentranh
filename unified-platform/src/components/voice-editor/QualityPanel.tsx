'use client';

import React from 'react';
import { Segment } from '@/lib/voice-editor/types';
import { SyllableHistogram } from './SyllableHistogram';

interface QualityPanelProps {
    segments: Segment[];
    showInvalidOnly: boolean;
    setShowInvalidOnly: (show: boolean) => void;
    onSelectInvalid: () => void;
    onSelectAll: () => void;
    minSyllables: number;
    maxSyllables: number;
}

export function QualityPanel({
    segments,
    showInvalidOnly,
    setShowInvalidOnly,
    onSelectInvalid,
    onSelectAll,
    minSyllables,
    maxSyllables
}: QualityPanelProps) {
    const validSegments = segments.filter(s => s.syllable_count >= minSyllables && s.syllable_count <= maxSyllables).length;
    const totalSegments = segments.length;
    const invalidSegments = totalSegments - validSegments;
    const completionRate = totalSegments > 0 ? ((validSegments / totalSegments) * 100).toFixed(0) : '0';
    const visibleCount = showInvalidOnly ? invalidSegments : totalSegments;

    return (
        <div className="p-4 bg-white rounded-lg shadow-md space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Kiểm Soát Chất Lượng</h3>
            <div className="text-xs text-gray-500">Mục tiêu: {minSyllables} - {maxSyllables} âm tiết</div>

            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span>Tổng số segments:</span>
                    <span className="font-semibold">{totalSegments}</span>
                </div>
                <div className="flex justify-between">
                    <span>Đạt chuẩn:</span>
                    <span className="font-semibold text-emerald-600">{validSegments}</span>
                </div>
                <div className="flex justify-between">
                    <span>Cần sửa:</span>
                    <span className="font-semibold text-red-600">{invalidSegments}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span>Tỷ lệ hoàn thành:</span>
                    <div className="w-1/2 bg-gray-200 rounded-full h-2.5">
                        <div
                            className="bg-emerald-500 h-2.5 rounded-full transition-all"
                            style={{ width: `${completionRate}%` }}
                        />
                    </div>
                    <span className="font-semibold">{completionRate}%</span>
                </div>
            </div>

            <div className="flex items-center justify-between mt-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                        type="checkbox"
                        checked={showInvalidOnly}
                        onChange={e => setShowInvalidOnly(e.target.checked)}
                        className="form-checkbox h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    Chỉ hiển thị lỗi
                </label>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={onSelectInvalid}
                    disabled={invalidSegments === 0}
                    className="w-full px-4 py-2 text-sm bg-indigo-100 text-indigo-700 font-semibold rounded-md hover:bg-indigo-200 transition disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                    Chọn Lỗi ({invalidSegments})
                </button>
                <button
                    onClick={onSelectAll}
                    disabled={visibleCount === 0}
                    className="w-full px-4 py-2 text-sm bg-gray-100 text-gray-700 font-semibold rounded-md hover:bg-gray-200 transition disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                    Chọn Tất Cả ({visibleCount})
                </button>
            </div>

            <h3 className="text-lg font-bold text-gray-800 pt-4 border-t">Phân Phối Âm Tiết</h3>
            <SyllableHistogram segments={segments} min={minSyllables} max={maxSyllables} />
        </div>
    );
}

export default QualityPanel;
