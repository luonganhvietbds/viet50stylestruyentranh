import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Segment } from '../types';
import { countSyllables } from '../utils/syllableCounter';
import { AiIcon, AddIcon, DeleteIcon, DragHandleIcon, ExportIcon, UndoIcon, RedoIcon, MergeIcon, SparklesIcon, ArrowUpIcon, ArrowDownIcon } from './icons';
import { getAdvancedSuggestions, bulkFixSegments, mergeSegmentsWithAI, getTargetedSuggestion, SuggestionType } from '../services/geminiService';
import SyllableHistogram from './SyllableHistogram';

// --- Custom Hook for State History ---
const useHistory = <T,>(initialState: T) => {
  const [history, setHistory] = useState<T[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const state = useMemo(() => history[currentIndex], [history, currentIndex]);

  const setState = useCallback((value: T | ((prevState: T) => T)) => {
    const newState = typeof value === 'function' 
        ? (value as (prevState: T) => T)(history[currentIndex]) 
        : value;

    if (JSON.stringify(newState) === JSON.stringify(history[currentIndex])) {
        return; // Don't add a new state if it's identical
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
      setCurrentIndex(prevIndex => prevIndex - 1);
    }
  }, [currentIndex, history.length]);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  return { state, setState, undo, redo, canUndo, canRedo };
};


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
  minSyllables: number;
  maxSyllables: number;
}

const SegmentItem: React.FC<SegmentItemProps> = ({ segment, prevSegment, nextSegment, isSelected, onSelect, onDelete, onUpdate, onAddAfter, onMergeWithNextAi, onManualMerge, minSyllables, maxSyllables }) => {
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
    // Use dynamic min/max for validation logic within component
    const isValid = syllableCount >= minSyllables && syllableCount <= maxSyllables;

    const getBorderColor = () => {
        if(isSelected) return 'border-blue-500 ring-2 ring-blue-300';
        // Check validity dynamically
        if (!isValid) return 'border-red-400';
        return 'border-green-400';
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
        const suggestions = await getAdvancedSuggestions(segment, prevSegment, nextSegment, minSyllables, maxSyllables);
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
    }

    if(isMerging) {
        return (
            <div className="bg-white p-4 rounded-lg border-2 border-indigo-400 flex gap-3 items-center justify-center animate-pulse">
                <MergeIcon className="w-6 h-6 text-indigo-500"/>
                <span className="font-semibold text-indigo-700">Đang ghép nối bằng AI...</span>
            </div>
        )
    }

    return (
        <div 
            onDoubleClick={() => !isEditing && setIsEditing(true)}
            title={isEditing ? '' : 'Nháy đúp để sửa'}
            className={`bg-white p-4 rounded-lg border-2 transition-all duration-200 ${getBorderColor()} flex gap-3 ${!isEditing ? 'cursor-pointer' : ''}`}>
            <div className="flex flex-col items-center gap-2 pt-1">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onSelect(segment.segment_id)}
                    className="form-checkbox h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <DragHandleIcon className="w-5 h-5 text-slate-400 cursor-grab" />
            </div>

            <div className="flex-grow">
                <div className="flex justify-between items-start">
                    <span className="font-mono text-sm font-semibold text-indigo-600">{segment.segment_id}</span>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {segment.syllable_count} âm tiết
                    </span>
                </div>

                {isEditing ? (
                    <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full mt-2 p-2 border border-slate-300 rounded-md text-slate-800 bg-slate-50 text-base"
                        rows={3}
                        autoFocus
                    />
                ) : (
                    <p className="mt-2 text-slate-800 text-base">{segment.text}</p>
                )}
                
                {isEditing ? (
                    <input
                        type="text"
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        placeholder="Nhập ghi chú ngắn..."
                        className="w-full mt-2 p-2 border border-slate-300 rounded-md text-sm text-slate-600"
                    />
                ) : (
                   segment.note && <p className="mt-2 text-sm text-slate-500 italic">Ghi chú: {segment.note}</p>
                )}

                {isLoadingAi && <div className="mt-2 text-sm text-slate-500">Đang lấy gợi ý từ AI...</div>}
                
                {aiSuggestions.length > 0 && (
                    <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-sm font-bold text-slate-800">✨ AI Gợi ý</h4>
                          <button onClick={() => setAiSuggestions([])} className="text-xs text-slate-500 hover:underline">Đóng</button>
                        </div>
                        <div className="space-y-3">
                        {aiSuggestions.map((s, i) => {
                            const titles = [
                                "Thêm từ đệm (giữ nội dung gốc)",
                                "Viết lại theo ngữ cảnh",
                                "Tối ưu & làm mượt câu"
                            ];
                            const title = titles[i] || `Gợi ý ${i + 1}`; 
                            const suggestionSyllables = countSyllables(s);

                            return (
                                <div key={i} className="bg-white p-3 rounded-md border border-slate-200 shadow-sm">
                                    <p className="text-xs font-semibold text-indigo-600 mb-1">{title}</p>
                                    <p className="text-sm text-slate-700 flex-grow mb-2">"{s}"</p>
                                    <div className="flex items-center justify-between">
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${suggestionSyllables >= minSyllables && suggestionSyllables <= maxSyllables ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{suggestionSyllables} âm tiết</span>
                                        <button onClick={() => applySuggestion(s)} className="text-xs font-bold text-indigo-600 hover:underline flex-shrink-0">ÁP DỤNG</button>
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
                            <button onClick={handleSave} className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">Lưu</button>
                            <button onClick={handleCancel} className="px-3 py-1 text-sm bg-slate-500 text-white rounded hover:bg-slate-600">Hủy</button>
                        </>
                    ) : null}
                    <button onClick={handleGetAiSuggestion} disabled={isEditing || isLoadingAi} title="AI gợi ý" className="p-2 text-slate-500 hover:text-indigo-600 rounded-full hover:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed"><AiIcon /></button>
                    
                    <div className="relative">
                        <button 
                            onClick={() => setShowMergeMenu(!showMergeMenu)} 
                            disabled={isEditing || isLoadingAi} 
                            title="Gộp segments (Thủ công/AI)" 
                            className={`p-2 rounded-full disabled:text-slate-300 disabled:cursor-not-allowed transition-colors ${showMergeMenu ? 'bg-indigo-100 text-indigo-600' : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-100'}`}
                        >
                            <MergeIcon />
                        </button>
                        {showMergeMenu && (
                            <>
                            <div className="fixed inset-0 z-20" onClick={() => setShowMergeMenu(false)}></div>
                            <div className="absolute bottom-full right-0 mb-2 w-64 bg-white rounded-md shadow-xl border border-slate-200 z-30 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
                                {prevSegment ? (
                                    <button onClick={() => { onManualMerge(segment.segment_id, 'prev'); setShowMergeMenu(false); }} className="w-full text-left px-4 py-3 text-sm hover:bg-slate-100 flex items-center gap-3 text-slate-700 transition-colors">
                                        <ArrowUpIcon className="w-4 h-4 text-indigo-500"/> 
                                        <span>Gộp với trên <span className="text-xs text-slate-400 ml-1 block">(Giữ nguyên nội dung)</span></span>
                                    </button>
                                ) : (
                                    <span className="w-full text-left px-4 py-3 text-sm text-slate-300 flex items-center gap-3 cursor-not-allowed bg-slate-50">
                                        <ArrowUpIcon className="w-4 h-4"/> Gộp với trên
                                    </span>
                                )}
                                <div className="h-px bg-slate-100 mx-2"></div>
                                {nextSegment ? (
                                    <button onClick={() => { onManualMerge(segment.segment_id, 'next'); setShowMergeMenu(false); }} className="w-full text-left px-4 py-3 text-sm hover:bg-slate-100 flex items-center gap-3 text-slate-700 transition-colors">
                                        <ArrowDownIcon className="w-4 h-4 text-indigo-500"/> 
                                        <span>Gộp với dưới <span className="text-xs text-slate-400 ml-1 block">(Giữ nguyên nội dung)</span></span>
                                    </button>
                                ) : (
                                     <span className="w-full text-left px-4 py-3 text-sm text-slate-300 flex items-center gap-3 cursor-not-allowed bg-slate-50">
                                        <ArrowDownIcon className="w-4 h-4"/> Gộp với dưới
                                    </span>
                                )}
                                {nextSegment && (
                                    <>
                                        <div className="h-px bg-slate-100 mx-2"></div>
                                        <button onClick={handleMergeAi} className="w-full text-left px-4 py-3 text-sm hover:bg-indigo-50 text-indigo-700 flex items-center gap-3 transition-colors font-medium">
                                            <SparklesIcon className="w-4 h-4"/> Gộp & Viết lại (AI)
                                        </button>
                                    </>
                                )}
                            </div>
                            </>
                        )}
                    </div>

                    <button onClick={() => onAddAfter(segment.segment_id)} disabled={isEditing || isLoadingAi} title="Thêm segment sau" className="p-2 text-slate-500 hover:text-indigo-600 rounded-full hover:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed"><AddIcon /></button>
                    <button onClick={() => onDelete(segment.segment_id)} disabled={isEditing || isLoadingAi} title="Xóa segment" className="p-2 text-red-500 hover:text-red-700 rounded-full hover:bg-red-50 disabled:text-red-300 disabled:cursor-not-allowed"><DeleteIcon /></button>
                </div>
            </div>
        </div>
    );
};

interface BulkActionBarProps {
  selectedCount: number;
  onBulkAiFix: () => void;
  onBulkAiFixWithChoice: () => void;
  onBulkDelete: () => void;
  onDeselectAll: () => void;
}

const BulkActionBar: React.FC<BulkActionBarProps> = ({ selectedCount, onBulkAiFix, onBulkAiFixWithChoice, onBulkDelete, onDeselectAll }) => {
    if (selectedCount === 0) return null;

    return (
        <div className="sticky top-0 z-10 bg-indigo-600 text-white p-3 rounded-md shadow-lg mb-4 flex items-center justify-between animate-fade-in-down">
            <span className="font-semibold">{selectedCount} segments đã được chọn</span>
            <div className="flex items-center gap-2">
                <button onClick={onBulkAiFixWithChoice} className="flex items-center gap-2 px-3 py-1.5 bg-white text-indigo-600 font-semibold rounded-md text-sm hover:bg-indigo-100"><SparklesIcon/> Sửa Chọn lọc với AI</button>
                <button onClick={onBulkAiFix} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-400 text-white font-semibold rounded-md text-sm hover:bg-indigo-500"><AiIcon/> Sửa Tự động</button>
                <button onClick={onBulkDelete} className="flex items-center gap-2 px-3 py-1.5 bg-red-500 text-white font-semibold rounded-md text-sm hover:bg-red-600"><DeleteIcon/> Xóa</button>
                <button onClick={onDeselectAll} className="px-3 py-1.5 bg-transparent text-white font-semibold rounded-md text-sm hover:bg-indigo-500">Bỏ chọn</button>
            </div>
        </div>
    );
}

const EditorToolbar: React.FC<{ onUndo: () => void; onRedo: () => void; canUndo: boolean; canRedo: boolean; }> = ({ onUndo, onRedo, canUndo, canRedo }) => {
  return (
    <div className="bg-white p-2 rounded-lg shadow-md flex items-center justify-between">
      <h3 className="text-lg font-bold text-slate-800">Công Cụ Editor</h3>
      <div className="flex items-center gap-2">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
        >
          <UndoIcon className="w-4 h-4" />
          Hoàn tác
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
        >
          <RedoIcon className="w-4 h-4" />
          Làm lại
        </button>
      </div>
    </div>
  );
};

interface QualityControlPanelProps {
    segments: Segment[];
    showInvalidOnly: boolean;
    setShowInvalidOnly: (show: boolean) => void;
    onSelectInvalid: () => void;
    onSelectAll: () => void;
    minSyllables: number;
    maxSyllables: number;
}
const QualityControlPanel: React.FC<QualityControlPanelProps> = ({ segments, showInvalidOnly, setShowInvalidOnly, onSelectInvalid, onSelectAll, minSyllables, maxSyllables }) => {
    // Dynamic validation check
    const validSegments = segments.filter(s => s.syllable_count >= minSyllables && s.syllable_count <= maxSyllables).length;
    const totalSegments = segments.length;
    const invalidSegments = totalSegments - validSegments;
    const completionRate = totalSegments > 0 ? ((validSegments / totalSegments) * 100).toFixed(0) : 0;
    const visibleCount = showInvalidOnly ? invalidSegments : totalSegments;

    return (
        <div className="p-4 bg-white rounded-lg shadow-md space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Kiểm Soát Chất Lượng</h3>
             <div className="text-xs text-slate-500">Mục tiêu: {minSyllables} - {maxSyllables} âm tiết</div>
            <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Tổng số segments:</span> <span className="font-semibold">{totalSegments}</span></div>
                <div className="flex justify-between"><span>Đạt chuẩn:</span> <span className="font-semibold text-green-600">{validSegments}</span></div>
                <div className="flex justify-between"><span>Cần sửa:</span> <span className="font-semibold text-red-600">{invalidSegments}</span></div>
                <div className="flex justify-between items-center">
                    <span>Tỷ lệ hoàn thành:</span> 
                    <div className="w-1/2 bg-slate-200 rounded-full h-2.5">
                        <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${completionRate}%` }}></div>
                    </div>
                    <span className="font-semibold">{completionRate}%</span>
                </div>
            </div>

            <div className="flex items-center justify-between mt-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={showInvalidOnly} onChange={e => setShowInvalidOnly(e.target.checked)} className="form-checkbox h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"/>
                    Chỉ hiển thị lỗi
                </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
                 <button onClick={onSelectInvalid} disabled={invalidSegments === 0} className="w-full px-4 py-2 text-sm bg-indigo-100 text-indigo-700 font-semibold rounded-md hover:bg-indigo-200 transition disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed">
                    Chọn Lỗi ({invalidSegments})
                </button>
                 <button onClick={onSelectAll} disabled={visibleCount === 0} className="w-full px-4 py-2 text-sm bg-slate-100 text-slate-700 font-semibold rounded-md hover:bg-slate-200 transition disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed">
                    Chọn Tất Cả ({visibleCount})
                </button>
            </div>
             <h3 className="text-lg font-bold text-slate-800 pt-4 border-t">Phân Phối Âm Tiết</h3>
            <SyllableHistogram segments={segments} min={minSyllables} max={maxSyllables} />
        </div>
    )
}

const suggestionOptions = [
    { type: 'padding' as SuggestionType, title: 'Thêm từ đệm', description: 'Giữ nguyên nội dung gốc, chỉ thêm từ nối để tối ưu độ dài và sự tự nhiên.' },
    { type: 'contextual' as SuggestionType, title: 'Viết lại theo ngữ cảnh', description: 'Viết lại segment để liền mạch hơn với các segment trước và sau nó.' },
    { type: 'optimization' as SuggestionType, title: 'Tối ưu & Làm mượt', description: 'Tự do sáng tạo để làm câu văn súc tích, mạch lạc và hay hơn.' },
];

interface BulkFixChoiceModalProps {
    isOpen: boolean;
    isProcessing: boolean;
    onClose: () => void;
    onConfirm: (type: SuggestionType) => void;
    selectedCount: number;
    progress: { current: number, total: number };
}

const BulkFixChoiceModal: React.FC<BulkFixChoiceModalProps> = ({ isOpen, isProcessing, onClose, onConfirm, selectedCount, progress }) => {
    const [selectedType, setSelectedType] = useState<SuggestionType>('padding');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg mx-4">
                <h2 className="text-xl font-bold text-slate-800 mb-2">Sửa {selectedCount} Segments với AI</h2>
                <p className="text-sm text-slate-600 mb-4">Chọn một phương pháp AI sẽ áp dụng cho tất cả các segment đã chọn.</p>
                
                <div className="space-y-3">
                    {suggestionOptions.map(option => (
                        <label key={option.type} className={`block p-4 border-2 rounded-lg cursor-pointer transition-colors ${selectedType === option.type ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}>
                            <input
                                type="radio"
                                name="suggestionType"
                                value={option.type}
                                checked={selectedType === option.type}
                                onChange={() => setSelectedType(option.type)}
                                className="sr-only"
                            />
                            <h3 className="font-semibold text-slate-800">{option.title}</h3>
                            <p className="text-sm text-slate-500">{option.description}</p>
                        </label>
                    ))}
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} disabled={isProcessing} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 disabled:opacity-50">Hủy</button>
                    <button onClick={() => onConfirm(selectedType)} disabled={isProcessing} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 flex items-center gap-2">
                        {isProcessing ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Đang xử lý {progress.current}/{progress.total}...
                            </>
                        ) : `Áp dụng cho ${selectedCount} segments`}
                    </button>
                </div>
            </div>
        </div>
    );
}

interface Tab3EditorProps {
    initialSegments: Segment[];
    setParentSegments: (segments: Segment[]) => void;
    minSyllables: number;
    maxSyllables: number;
}

const Tab3Editor: React.FC<Tab3EditorProps> = ({ initialSegments, setParentSegments, minSyllables, maxSyllables }) => {
  const { state: segments, setState: setSegmentsHistory, undo, redo, canUndo, canRedo } = useHistory<Segment[]>(initialSegments);
  const [selectedSegmentIds, setSelectedSegmentIds] = useState<Set<string>>(new Set());
  const [showInvalidOnly, setShowInvalidOnly] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });

  // Central function to update segments state and push to history
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
  }, [setSegmentsHistory, minSyllables, maxSyllables]); // Depend on dynamic min/max

  useEffect(() => {
    // If user changes min/max config from header, we need to re-validate all existing segments without changing text
    const revalidatedSegments = segments.map(s => {
        const count = countSyllables(s.text);
        return {
            ...s,
            is_valid: count >= minSyllables && count <= maxSyllables
        };
    });
    
    // Only update if validity actually changed to avoid infinite loops or unnecessary history updates
    const hasChanges = revalidatedSegments.some((s, i) => s.is_valid !== segments[i].is_valid);
    if (hasChanges) {
         setSegmentsHistory(revalidatedSegments);
    }
  }, [minSyllables, maxSyllables]);

  useEffect(() => {
    setParentSegments(segments);
  }, [segments, setParentSegments]);


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
        if (currentIndex === -1 || currentIndex + 1 >= segments.length) {
            return;
        }

        const currentSegment = segments[currentIndex];
        const nextSegment = segments[currentIndex + 1];

        // Pass dynamic min/max to service
        const mergedText = await mergeSegmentsWithAI(currentSegment, nextSegment, minSyllables, maxSyllables);

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
            if (currentIndex === 0) return; // Can't merge up
            targetIndex = currentIndex - 1;
            sourceIndex = currentIndex;
        } else {
            if (currentIndex === segments.length - 1) return; // Can't merge down
            targetIndex = currentIndex;
            sourceIndex = currentIndex + 1;
        }

        const targetSegment = newSegments[targetIndex];
        const sourceSegment = newSegments[sourceIndex];

        const needsSpace = !(targetSegment.text.endsWith(' ') || sourceSegment.text.startsWith(' '));
        const mergedText = (targetSegment.text + (needsSpace ? " " : "") + sourceSegment.text).trim();
        
        const updatedNote = [targetSegment.note, sourceSegment.note].filter(Boolean).join(' | ');

        // Update the target segment
        newSegments[targetIndex] = {
            ...targetSegment,
            text: mergedText,
            note: updatedNote
        };

        // Remove the source segment
        newSegments.splice(sourceIndex, 1);

        updateSegments(newSegments, true); // Re-index
    };

  const handleBulkDelete = () => {
    if(window.confirm(`Bạn có chắc muốn xóa ${selectedSegmentIds.size} segments đã chọn?`)){
        const filtered = segments.filter(s => !selectedSegmentIds.has(s.segment_id));
        updateSegments(filtered, true);
        setSelectedSegmentIds(new Set());
    }
  }

  // Delay helper
  const delay = (min: number, max: number) => {
    return new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1) + min)));
  };

  const handleBulkAiFix = async () => {
    setIsBulkProcessing(true);
    const segmentsToFix = segments.filter(s => selectedSegmentIds.has(s.segment_id));
    
    // Call service to get fixed segments (Now using Flash, safe to send batch but still good to handle errors)
    try {
        setBulkProgress({ current: 0, total: segmentsToFix.length });
        
        // Even with Flash, sending too many at once might be large. 
        // We will stick to the service call which handles the batch, but updated to Flash.
        // If necessary, we can split into chunks here, but let's trust Flash + Service for now.
        // NOTE: User asked for 3-5s delay to avoid errors. The safest way is to process sequentially or in small batches.
        // Let's implement batching here to be super safe.
        
        const CHUNK_SIZE = 5;
        let allFixedSegments: Segment[] = [];
        
        for (let i = 0; i < segmentsToFix.length; i += CHUNK_SIZE) {
            const chunk = segmentsToFix.slice(i, i + CHUNK_SIZE);
            setBulkProgress({ current: Math.min(i + CHUNK_SIZE, segmentsToFix.length), total: segmentsToFix.length });
            
            const fixedChunk = await bulkFixSegments(chunk, minSyllables, maxSyllables);
            allFixedSegments = [...allFixedSegments, ...fixedChunk];

            // Add delay between chunks
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
  }

  const handleConfirmBulkFixChoice = async (suggestionType: SuggestionType) => {
    setIsBulkProcessing(true);
    
    const segmentsToFix = segments.filter(s => selectedSegmentIds.has(s.segment_id));
    const segmentIndices = new Map(segments.map((s, i) => [s.segment_id, i]));
    const total = segmentsToFix.length;
    setBulkProgress({ current: 0, total });

    let completedCount = 0;
    // We create a temporary map to store results so we can update state once (or incrementally if preferred)
    // To show progress, we need to process sequentially
    const resultsMap = new Map<string, string>();

    try {
        // SEQUENTIAL PROCESSING LOOP
        for (const segment of segmentsToFix) {
             const index = segmentIndices.get(segment.segment_id);
            
            if (typeof index !== 'number') {
                continue;
            }

            const prevSegment = index > 0 ? segments[index - 1] : null;
            const nextSegment = index < segments.length - 1 ? segments[index + 1] : null;
            
            // API Call
            const newText = await getTargetedSuggestion(segment, prevSegment, nextSegment, suggestionType, minSyllables, maxSyllables);
            resultsMap.set(segment.segment_id, newText);

            completedCount++;
            setBulkProgress({ current: completedCount, total });

            // DELAY: 3000ms - 5000ms
            if (completedCount < total) {
                await delay(3000, 5000);
            }
        }
        
        // Update all at once at the end
        const updatedSegments = segments.map(originalSegment => {
            if (resultsMap.has(originalSegment.segment_id)) {
                return { ...originalSegment, text: resultsMap.get(originalSegment.segment_id)! };
            }
            return originalSegment;
        });

        updateSegments(updatedSegments, false);
        alert(`Đã hoàn tất sửa hàng loạt cho ${completedCount} segments.`);

    } catch (error) {
        console.error("Error during targeted bulk AI fix:", error);
        alert("Đã xảy ra lỗi trong quá trình sửa hàng loạt. Một vài segments có thể chưa được sửa.");
    } finally {
        setIsBulkProcessing(false);
        setIsChoiceModalOpen(false);
        setSelectedSegmentIds(new Set());
        setBulkProgress({ current: 0, total: 0 });
    }
  };

  const handleSelectInvalid = () => {
    // Check against dynamic validity
    const invalidIds = segments.filter(s => s.syllable_count < minSyllables || s.syllable_count > maxSyllables).map(s => s.segment_id);
    setSelectedSegmentIds(new Set(invalidIds));
  }
  
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
      } else { // txt
          // Updated to output only the text, one segment per line
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
        // Filter based on dynamic validation
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
        <EditorToolbar onUndo={undo} onRedo={redo} canUndo={canUndo} canRedo={canRedo} />
        <BulkActionBar 
          selectedCount={selectedSegmentIds.size}
          onBulkAiFix={handleBulkAiFix}
          onBulkAiFixWithChoice={() => setIsChoiceModalOpen(true)}
          onBulkDelete={handleBulkDelete}
          onDeselectAll={() => setSelectedSegmentIds(new Set())}
        />
         {isBulkProcessing && !isChoiceModalOpen && (
          <div className="p-4 bg-blue-100 text-blue-800 rounded-md text-center font-semibold flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5 text-blue-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            🤖 AI đang xử lý: {bulkProgress.current}/{bulkProgress.total}...
          </div>
        )}
        <BulkFixChoiceModal
            isOpen={isChoiceModalOpen}
            isProcessing={isBulkProcessing}
            onClose={() => setIsChoiceModalOpen(false)}
            onConfirm={handleConfirmBulkFixChoice}
            selectedCount={selectedSegmentIds.size}
            progress={bulkProgress}
        />
        {filteredSegments.map(segment => {
          const originalIndex = segments.findIndex(s => s.segment_id === segment.segment_id);
          const prevSegment = originalIndex > 0 ? segments[originalIndex - 1] : null;
          const nextSegment = originalIndex < segments.length - 1 ? segments[originalIndex + 1] : null;

          return (
            <SegmentItem
              key={segment.segment_id}
              segment={segment}
              prevSegment={prevSegment}
              nextSegment={nextSegment}
              isSelected={selectedSegmentIds.has(segment.segment_id)}
              onSelect={handleSelect}
              onDelete={handleDeleteSegment}
              onUpdate={handleUpdateSegment}
              onAddAfter={handleAddAfter}
              onMergeWithNextAi={handleMergeWithNextAi}
              onManualMerge={handleManualMerge}
              minSyllables={minSyllables}
              maxSyllables={maxSyllables}
            />
          );
        })}
      </div>

      <div className="lg:col-span-1">
        <div className="sticky top-4 space-y-4">
            <QualityControlPanel 
                segments={segments}
                showInvalidOnly={showInvalidOnly}
                setShowInvalidOnly={setShowInvalidOnly}
                onSelectInvalid={handleSelectInvalid}
                onSelectAll={handleSelectAll}
                minSyllables={minSyllables}
                maxSyllables={maxSyllables}
            />
            <div className="p-4 bg-white rounded-lg shadow-md space-y-3">
                 <h3 className="text-lg font-bold text-slate-800">Xuất Dữ Liệu</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button onClick={() => handleExport('txt')} className="flex items-center justify-center gap-2 w-full px-4 py-2 text-sm bg-slate-100 text-slate-700 font-semibold rounded-md hover:bg-slate-200 transition">📄 TXT</button>
                    <button onClick={() => handleExport('csv')} className="flex items-center justify-center gap-2 w-full px-4 py-2 text-sm bg-slate-100 text-slate-700 font-semibold rounded-md hover:bg-slate-200 transition">📊 CSV</button>
                    <button onClick={() => handleExport('json')} className="flex items-center justify-center gap-2 w-full px-4 py-2 text-sm bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition"><ExportIcon/> JSON</button>
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Tab3Editor;