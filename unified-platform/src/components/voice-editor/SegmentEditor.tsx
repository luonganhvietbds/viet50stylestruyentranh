'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Segment, SuggestionType } from '@/lib/voice-editor/types';
import { countSyllables } from '@/lib/voice-editor/syllableCounter';
import { SegmentItem } from './SegmentItem';
import { QualityPanel } from './QualityPanel';
import {
    getAdvancedSuggestions,
    bulkFixSegments,
    mergeSegmentsWithAI,
    getTargetedSuggestion
} from '@/services/voiceAiService';
import { useApiKey } from '@/contexts/ApiKeyContext';
import {
    Undo2,
    Redo2,
    Sparkles,
    Trash2,
    Download,
    Loader2
} from 'lucide-react';

// Custom hook for undo/redo history
function useHistory<T>(initialState: T) {
    const [history, setHistory] = useState<T[]>([initialState]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const state = useMemo(() => history[currentIndex], [history, currentIndex]);

    const setState = useCallback((value: T | ((prevState: T) => T)) => {
        const newState = typeof value === 'function'
            ? (value as (prevState: T) => T)(history[currentIndex])
            : value;

        if (JSON.stringify(newState) === JSON.stringify(history[currentIndex])) {
            return;
        }

        const newHistory = history.slice(0, currentIndex + 1);
        newHistory.push(newState);
        setHistory(newHistory);
        setCurrentIndex(newHistory.length - 1);
    }, [currentIndex, history]);

    const undo = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex(prevIndex => prevIndex - 1);
        }
    }, [currentIndex]);

    const redo = useCallback(() => {
        if (currentIndex < history.length - 1) {
            setCurrentIndex(prevIndex => prevIndex + 1);
        }
    }, [currentIndex, history.length]);

    const canUndo = currentIndex > 0;
    const canRedo = currentIndex < history.length - 1;

    return { state, setState, undo, redo, canUndo, canRedo };
}

interface SegmentEditorProps {
    initialSegments: Segment[];
    onSegmentsChange: (segments: Segment[]) => void;
    minSyllables: number;
    maxSyllables: number;
}

export function SegmentEditor({
    initialSegments,
    onSegmentsChange,
    minSyllables,
    maxSyllables
}: SegmentEditorProps) {
    const { getNextKey, hasValidKey } = useApiKey();
    const { state: segments, setState: setSegmentsHistory, undo, redo, canUndo, canRedo } = useHistory<Segment[]>(initialSegments);
    const [selectedSegmentIds, setSelectedSegmentIds] = useState<Set<string>>(new Set());
    const [showInvalidOnly, setShowInvalidOnly] = useState(false);
    const [isBulkProcessing, setIsBulkProcessing] = useState(false);
    const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);
    const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });

    // Update segments with optional re-indexing
    const updateSegments = useCallback((newSegments: Segment[], reorder: boolean = false) => {
        let processedSegments = newSegments;
        if (reorder) {
            processedSegments = processedSegments.map((segment, index) => ({
                ...segment,
                segment_id: 'VS_' + String(index + 1).padStart(3, '0')
            }));
        }

        const finalSegments = processedSegments.map(s => {
            const newSyllableCount = countSyllables(s.text);
            return {
                ...s,
                syllable_count: newSyllableCount,
                is_valid: newSyllableCount >= minSyllables && newSyllableCount <= maxSyllables,
            };
        });

        setSegmentsHistory(finalSegments);
    }, [setSegmentsHistory, minSyllables, maxSyllables]);

    // Re-validate when min/max changes
    useEffect(() => {
        const revalidatedSegments = segments.map(s => {
            const count = countSyllables(s.text);
            return {
                ...s,
                is_valid: count >= minSyllables && count <= maxSyllables
            };
        });

        const hasChanges = revalidatedSegments.some((s, i) => s.is_valid !== segments[i].is_valid);
        if (hasChanges) {
            setSegmentsHistory(revalidatedSegments);
        }
    }, [minSyllables, maxSyllables]);

    // Sync with parent
    useEffect(() => {
        onSegmentsChange(segments);
    }, [segments, onSegmentsChange]);

    const handleSelect = (id: string) => {
        setSelectedSegmentIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleDeleteSegment = (id: string) => {
        if (!window.confirm(`Bạn có chắc muốn xóa segment ${id}?`)) return;
        const filtered = segments.filter(s => s.segment_id !== id);
        updateSegments(filtered, true);
        setSelectedSegmentIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
        });
    };

    const handleUpdateSegment = (id: string, newText: string, newNote: string) => {
        const updated = segments.map(s => s.segment_id === id ? { ...s, text: newText, note: newNote } : s);
        updateSegments(updated, false);
    };

    const handleAddAfter = (id: string) => {
        const index = segments.findIndex(s => s.segment_id === id);
        if (index === -1) return;

        const newSegment: Segment = {
            segment_id: 'TEMP_ID',
            text: "Đây là segment mới, hãy chỉnh sửa nội dung.",
            syllable_count: 9,
            note: '',
            is_valid: false,
        };

        const newSegments = [...segments];
        newSegments.splice(index + 1, 0, newSegment);
        updateSegments(newSegments, true);
    };

    const handleMergeWithNextAi = async (currentId: string) => {
        const currentIndex = segments.findIndex(s => s.segment_id === currentId);
        if (currentIndex === -1 || currentIndex + 1 >= segments.length) return;

        const currentSegment = segments[currentIndex];
        const nextSegment = segments[currentIndex + 1];

        const apiKey = getNextKey();
        if (!apiKey) {
            alert('Không có API key khả dụng');
            return;
        }

        const mergedText = await mergeSegmentsWithAI(apiKey, currentSegment, nextSegment, minSyllables, maxSyllables);

        const newSegments = segments
            .map(s => s.segment_id === currentId ? { ...s, text: mergedText } : s)
            .filter(s => s.segment_id !== nextSegment.segment_id);

        updateSegments(newSegments, true);
    };

    const handleManualMerge = (id: string, direction: 'prev' | 'next') => {
        const currentIndex = segments.findIndex(s => s.segment_id === id);
        if (currentIndex === -1) return;

        const newSegments = [...segments];
        let targetIndex = -1;
        let sourceIndex = -1;

        if (direction === 'prev') {
            if (currentIndex === 0) return;
            targetIndex = currentIndex - 1;
            sourceIndex = currentIndex;
        } else {
            if (currentIndex === segments.length - 1) return;
            targetIndex = currentIndex;
            sourceIndex = currentIndex + 1;
        }

        const targetSegment = newSegments[targetIndex];
        const sourceSegment = newSegments[sourceIndex];

        const needsSpace = !(targetSegment.text.endsWith(' ') || sourceSegment.text.startsWith(' '));
        const mergedText = (targetSegment.text + (needsSpace ? " " : "") + sourceSegment.text).trim();

        const updatedNote = [targetSegment.note, sourceSegment.note].filter(Boolean).join(' | ');

        newSegments[targetIndex] = {
            ...targetSegment,
            text: mergedText,
            note: updatedNote
        };

        newSegments.splice(sourceIndex, 1);
        updateSegments(newSegments, true);
    };

    const handleGetAiSuggestion = async (segment: Segment, prev: Segment | null, next: Segment | null): Promise<string[]> => {
        const apiKey = getNextKey();
        if (!apiKey) {
            return ['Không có API key khả dụng'];
        }
        return await getAdvancedSuggestions(apiKey, segment, prev, next, minSyllables, maxSyllables);
    };

    const handleBulkDelete = () => {
        if (window.confirm(`Bạn có chắc muốn xóa ${selectedSegmentIds.size} segments đã chọn?`)) {
            const filtered = segments.filter(s => !selectedSegmentIds.has(s.segment_id));
            updateSegments(filtered, true);
            setSelectedSegmentIds(new Set());
        }
    };

    const delay = (min: number, max: number) => {
        return new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1) + min)));
    };

    const handleBulkAiFix = async () => {
        const apiKey = getNextKey();
        if (!apiKey) {
            alert('Không có API key khả dụng');
            return;
        }

        setIsBulkProcessing(true);
        const segmentsToFix = segments.filter(s => selectedSegmentIds.has(s.segment_id));

        try {
            setBulkProgress({ current: 0, total: segmentsToFix.length });

            const CHUNK_SIZE = 5;
            let allFixedSegments: Segment[] = [];

            for (let i = 0; i < segmentsToFix.length; i += CHUNK_SIZE) {
                const chunk = segmentsToFix.slice(i, i + CHUNK_SIZE);
                setBulkProgress({ current: Math.min(i + CHUNK_SIZE, segmentsToFix.length), total: segmentsToFix.length });

                const fixedChunk = await bulkFixSegments(apiKey, chunk, minSyllables, maxSyllables);
                allFixedSegments = [...allFixedSegments, ...fixedChunk];

                if (i + CHUNK_SIZE < segmentsToFix.length) {
                    await delay(3000, 5000);
                }
            }

            const updatedSegments = segments.map(originalSegment => {
                const fixedVersion = allFixedSegments.find(fs => fs.segment_id === originalSegment.segment_id);
                return fixedVersion || originalSegment;
            });

            updateSegments(updatedSegments, false);
            alert("Đã hoàn tất sửa tự động hàng loạt bằng AI.");
        } catch (error) {
            console.error("Bulk fix error", error);
            alert("Có lỗi xảy ra khi sửa hàng loạt.");
        } finally {
            setIsBulkProcessing(false);
            setSelectedSegmentIds(new Set());
            setBulkProgress({ current: 0, total: 0 });
        }
    };

    const handleSelectInvalid = () => {
        const invalidIds = segments.filter(s => s.syllable_count < minSyllables || s.syllable_count > maxSyllables).map(s => s.segment_id);
        setSelectedSegmentIds(new Set(invalidIds));
    };

    const handleExport = (format: 'txt' | 'json' | 'csv') => {
        let content = '';
        let filename = '';
        let mimeType = '';

        const dataToExport = segments.map(s => ({
            id: s.segment_id,
            text: s.text,
            syllables: s.syllable_count,
            note: s.note
        }));

        if (format === 'json') {
            content = JSON.stringify({ metadata: { exportedAt: new Date().toISOString() }, segments: dataToExport }, null, 2);
            filename = 'segments.json';
            mimeType = 'application/json';
        } else if (format === 'csv') {
            const header = "segment_id,text,syllable_count,note\n";
            const rows = dataToExport.map(s => `${s.id},"${s.text.replace(/"/g, '""')}","${s.syllables}","${s.note.replace(/"/g, '""')}"`).join('\n');
            content = header + rows;
            filename = 'segments.csv';
            mimeType = 'text/csv';
        } else {
            content = dataToExport.map(s => s.text).join('\n');
            filename = 'segments.txt';
            mimeType = 'text/plain';
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const filteredSegments = useMemo(() => {
        if (showInvalidOnly) {
            return segments.filter(s => s.syllable_count < minSyllables || s.syllable_count > maxSyllables);
        }
        return segments;
    }, [segments, showInvalidOnly, minSyllables, maxSyllables]);

    const handleSelectAll = () => {
        const allVisibleIds = filteredSegments.map(s => s.segment_id);
        setSelectedSegmentIds(new Set(allVisibleIds));
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
                {/* Editor Toolbar */}
                <div className="bg-white p-3 rounded-lg shadow-md flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-800">Công Cụ Editor</h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={undo}
                            disabled={!canUndo}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            <Undo2 className="w-4 h-4" />
                            Hoàn tác
                        </button>
                        <button
                            onClick={redo}
                            disabled={!canRedo}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            <Redo2 className="w-4 h-4" />
                            Làm lại
                        </button>
                    </div>
                </div>

                {/* Bulk Action Bar */}
                {selectedSegmentIds.size > 0 && (
                    <div className="sticky top-0 z-10 bg-indigo-600 text-white p-3 rounded-md shadow-lg flex items-center justify-between">
                        <span className="font-semibold">{selectedSegmentIds.size} segments đã được chọn</span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleBulkAiFix}
                                disabled={isBulkProcessing}
                                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-400 text-white font-semibold rounded-md text-sm hover:bg-indigo-500 disabled:opacity-50"
                            >
                                <Sparkles className="w-4 h-4" /> Sửa Tự động
                            </button>
                            <button
                                onClick={handleBulkDelete}
                                disabled={isBulkProcessing}
                                className="flex items-center gap-2 px-3 py-1.5 bg-red-500 text-white font-semibold rounded-md text-sm hover:bg-red-600 disabled:opacity-50"
                            >
                                <Trash2 className="w-4 h-4" /> Xóa
                            </button>
                            <button
                                onClick={() => setSelectedSegmentIds(new Set())}
                                className="px-3 py-1.5 bg-transparent text-white font-semibold rounded-md text-sm hover:bg-indigo-500"
                            >
                                Bỏ chọn
                            </button>
                        </div>
                    </div>
                )}

                {/* Processing Indicator */}
                {isBulkProcessing && (
                    <div className="p-4 bg-blue-100 text-blue-800 rounded-md text-center font-semibold flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        🤖 AI đang xử lý: {bulkProgress.current}/{bulkProgress.total}...
                    </div>
                )}

                {/* Segment List */}
                <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
                    {filteredSegments.map((segment, index) => (
                        <SegmentItem
                            key={segment.segment_id}
                            segment={segment}
                            prevSegment={index > 0 ? filteredSegments[index - 1] : null}
                            nextSegment={index < filteredSegments.length - 1 ? filteredSegments[index + 1] : null}
                            isSelected={selectedSegmentIds.has(segment.segment_id)}
                            onSelect={handleSelect}
                            onDelete={handleDeleteSegment}
                            onUpdate={handleUpdateSegment}
                            onAddAfter={handleAddAfter}
                            onMergeWithNextAi={handleMergeWithNextAi}
                            onManualMerge={handleManualMerge}
                            onGetAiSuggestion={handleGetAiSuggestion}
                            minSyllables={minSyllables}
                            maxSyllables={maxSyllables}
                        />
                    ))}
                </div>

                {/* Export Buttons */}
                <div className="bg-white p-4 rounded-lg shadow-md">
                    <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <Download className="w-4 h-4" /> Xuất dữ liệu
                    </h3>
                    <div className="flex gap-2">
                        <button onClick={() => handleExport('txt')} className="px-4 py-2 text-sm bg-gray-100 text-gray-700 font-medium rounded hover:bg-gray-200 transition">
                            TXT
                        </button>
                        <button onClick={() => handleExport('json')} className="px-4 py-2 text-sm bg-gray-100 text-gray-700 font-medium rounded hover:bg-gray-200 transition">
                            JSON
                        </button>
                        <button onClick={() => handleExport('csv')} className="px-4 py-2 text-sm bg-gray-100 text-gray-700 font-medium rounded hover:bg-gray-200 transition">
                            CSV
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Panel */}
            <div className="lg:col-span-1">
                <QualityPanel
                    segments={segments}
                    showInvalidOnly={showInvalidOnly}
                    setShowInvalidOnly={setShowInvalidOnly}
                    onSelectInvalid={handleSelectInvalid}
                    onSelectAll={handleSelectAll}
                    minSyllables={minSyllables}
                    maxSyllables={maxSyllables}
                />
            </div>
        </div>
    );
}

export default SegmentEditor;
