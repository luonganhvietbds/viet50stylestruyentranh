'use client';

import React from 'react';
import { X, Loader2, Wand2, BookA, Sparkles } from 'lucide-react';
import { SuggestionType } from '@/lib/voice-editor';

interface BulkFixModalProps {
    isOpen: boolean;
    isProcessing: boolean;
    selectedCount: number;
    progress: { current: number; total: number };
    onClose: () => void;
    onConfirm: (type: SuggestionType) => void;
}

const SUGGESTION_OPTIONS: { type: SuggestionType; icon: React.ReactNode; title: string; description: string }[] = [
    {
        type: 'padding',
        icon: <Wand2 className="w-5 h-5" />,
        title: 'Thêm từ đệm',
        description: 'Giữ nguyên nội dung gốc, chỉ thêm từ nối để tối ưu độ dài và sự tự nhiên.'
    },
    {
        type: 'contextual',
        icon: <BookA className="w-5 h-5" />,
        title: 'Thay từ đồng nghĩa',
        description: 'Thay thế từ bằng từ đồng nghĩa hoặc thêm từ ngữ phù hợp ngữ cảnh.'
    },
    {
        type: 'optimization',
        icon: <Sparkles className="w-5 h-5" />,
        title: 'Tối ưu & Làm mượt',
        description: 'Tự do sáng tạo để làm câu văn súc tích, mạch lạc và hay hơn.'
    }
];

export function BulkFixModal({
    isOpen,
    isProcessing,
    selectedCount,
    progress,
    onClose,
    onConfirm
}: BulkFixModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={!isProcessing ? onClose : undefined}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800">
                        {isProcessing ? 'Đang xử lý...' : 'Chọn phương thức'}
                    </h3>
                    {!isProcessing && (
                        <button
                            onClick={onClose}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="p-4">
                    {isProcessing ? (
                        <div className="py-8 text-center">
                            <Loader2 className="w-12 h-12 mx-auto text-green-500 animate-spin mb-4" />
                            <p className="text-gray-600 font-medium">
                                Đang xử lý {progress.current}/{progress.total} segments
                            </p>
                            <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                                />
                            </div>
                            <p className="text-xs text-gray-400 mt-2">
                                Vui lòng không đóng cửa sổ này
                            </p>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm text-gray-500 mb-4">
                                Chọn phương thức để sửa <strong className="text-green-600">{selectedCount}</strong> segment không đạt chuẩn:
                            </p>

                            <div className="space-y-3">
                                {SUGGESTION_OPTIONS.map(option => (
                                    <button
                                        key={option.type}
                                        onClick={() => onConfirm(option.type)}
                                        className="w-full p-4 text-left bg-gray-50 hover:bg-green-50 border border-gray-200 hover:border-green-300 rounded-xl transition-all group"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-white rounded-lg text-gray-500 group-hover:text-green-600 group-hover:bg-green-100 transition-colors">
                                                {option.icon}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800 group-hover:text-green-700">
                                                    {option.title}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {option.description}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                {!isProcessing && (
                    <div className="p-4 bg-gray-50 border-t border-gray-200">
                        <button
                            onClick={onClose}
                            className="w-full py-2 text-gray-600 font-medium hover:text-gray-800 transition-colors"
                        >
                            Hủy
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
