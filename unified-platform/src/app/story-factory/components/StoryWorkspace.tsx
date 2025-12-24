'use client';

import React, { useState } from 'react';
import {
    BookOpen,
    Sparkles,
    History,
    Crown,
    Star,
    ArrowLeft,
    ArrowRight,
    Loader2,
    AlertCircle,
    XCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useApiKey } from '@/contexts/ApiKeyContext';

// Placeholder components - will be migrated from original module
function StepIndicator({ currentStep }: { currentStep: number }) {
    const steps = [
        { num: 1, label: 'Phong cách' },
        { num: 2, label: 'Ý tưởng' },
        { num: 3, label: 'Chọn đề tài' },
        { num: 4, label: 'Cấu hình' },
        { num: 5, label: 'Đọc truyện' },
    ];

    return (
        <div className="flex items-center justify-center gap-2 mb-8">
            {steps.map((step, idx) => (
                <React.Fragment key={step.num}>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${currentStep === step.num
                            ? 'bg-indigo-500 text-white'
                            : currentStep > step.num
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-gray-800 text-gray-500'
                        }`}>
                        <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">
                            {step.num}
                        </span>
                        <span className="hidden sm:inline">{step.label}</span>
                    </div>
                    {idx < steps.length - 1 && (
                        <div className={`w-8 h-0.5 ${currentStep > step.num ? 'bg-green-500' : 'bg-gray-800'}`} />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
}

// Writing styles from original module
const WRITING_STYLES = [
    { id: 'romance', name: 'Lãng Mạn', emoji: '💕', description: 'Tình yêu ngọt ngào, cảm xúc sâu lắng' },
    { id: 'action', name: 'Hành Động', emoji: '⚔️', description: 'Chiến đấu, phiêu lưu, kịch tính' },
    { id: 'mystery', name: 'Bí Ẩn', emoji: '🔍', description: 'Thám tử, điều tra, giải đố' },
    { id: 'fantasy', name: 'Kỳ Ảo', emoji: '🧙', description: 'Phép thuật, thế giới thần tiên' },
    { id: 'scifi', name: 'Khoa Học', emoji: '🚀', description: 'Tương lai, công nghệ, vũ trụ' },
    { id: 'horror', name: 'Kinh Dị', emoji: '👻', description: 'Rùng rợn, ma quái, ám ảnh' },
    { id: 'comedy', name: 'Hài Hước', emoji: '😂', description: 'Vui nhộn, giải trí, nhẹ nhàng' },
    { id: 'drama', name: 'Kịch Tính', emoji: '🎭', description: 'Đời sống, cảm xúc, xung đột' },
    { id: 'slice_of_life', name: 'Đời Thường', emoji: '🌸', description: 'Cuộc sống hàng ngày, bình dị' },
    { id: 'historical', name: 'Lịch Sử', emoji: '🏯', description: 'Cổ đại, triều đại, chiến tranh' },
    { id: 'thriller', name: 'Hồi Hộp', emoji: '😰', description: 'Căng thẳng, gay cấn, nguy hiểm' },
    { id: 'wuxia', name: 'Võ Hiệp', emoji: '🥋', description: 'Kiếm khách, giang hồ, nội công' },
    { id: 'xianxia', name: 'Tiên Hiệp', emoji: '☯️', description: 'Tu tiên, phi thăng, đạo pháp' },
    { id: 'cultivation', name: 'Tu Luyện', emoji: '🧘', description: 'Đột phá cảnh giới, sức mạnh' },
    { id: 'system', name: 'Hệ Thống', emoji: '📊', description: 'Game system, level up, status' },
    { id: 'reincarnation', name: 'Trọng Sinh', emoji: '🔄', description: 'Xuyên không, tái sinh, thay đổi số phận' },
];

export function StoryWorkspace() {
    const { user, isPremium, isGold } = useAuth();
    const { hasValidKey, openModal } = useApiKey();
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
    const [userInput, setUserInput] = useState('');
    const [numIdeas, setNumIdeas] = useState(5);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Step 1: Select Style
    const renderStep1 = () => (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Chọn Phong Cách Viết</h2>
                <p className="text-gray-400">Chọn thể loại truyện bạn muốn sáng tác</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {WRITING_STYLES.map((style) => (
                    <button
                        key={style.id}
                        onClick={() => setSelectedStyle(style.id)}
                        className={`p-4 rounded-xl border text-left transition-all ${selectedStyle === style.id
                                ? 'bg-indigo-500/20 border-indigo-500 ring-2 ring-indigo-500/50'
                                : 'bg-gray-900 border-gray-800 hover:border-gray-700'
                            }`}
                    >
                        <span className="text-2xl mb-2 block">{style.emoji}</span>
                        <h3 className="font-semibold text-white text-sm">{style.name}</h3>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{style.description}</p>
                    </button>
                ))}
            </div>

            <div className="flex justify-end mt-8">
                <button
                    onClick={() => setCurrentStep(2)}
                    disabled={!selectedStyle}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                >
                    Tiếp Tục
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );

    // Step 2: Input Ideas
    const renderStep2 = () => (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Mô Tả Ý Tưởng</h2>
                <p className="text-gray-400">Nhập mô tả hoặc từ khóa cho câu chuyện của bạn</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
                <textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Ví dụ: Một thiếu niên phát hiện mình có khả năng du hành thời gian, phải ngăn chặn thảm họa trong tương lai..."
                    className="w-full h-40 p-4 bg-gray-950 border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                />

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <label className="text-sm text-gray-400">Số ý tưởng:</label>
                        <select
                            value={numIdeas}
                            onChange={(e) => setNumIdeas(Number(e.target.value))}
                            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:ring-2 focus:ring-indigo-500"
                        >
                            {[3, 5, 7, 10].map((n) => (
                                <option key={n} value={n}>{n} ý tưởng</option>
                            ))}
                        </select>
                    </div>

                    {!hasValidKey && (
                        <button
                            onClick={openModal}
                            className="text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1"
                        >
                            <AlertCircle className="w-4 h-4" />
                            Thêm API Key
                        </button>
                    )}
                </div>
            </div>

            <div className="flex justify-between mt-8">
                <button
                    onClick={() => setCurrentStep(1)}
                    className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Quay Lại
                </button>
                <button
                    onClick={() => setCurrentStep(3)}
                    disabled={!userInput.trim() || !hasValidKey}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Đang tạo...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-4 h-4" />
                            Tạo Ý Tưởng
                        </>
                    )}
                </button>
            </div>
        </div>
    );

    // Placeholder for steps 3-5
    const renderPlaceholder = (stepNum: number) => (
        <div className="text-center py-20">
            <div className="w-20 h-20 rounded-2xl bg-gray-800 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-gray-600" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Bước {stepNum}</h2>
            <p className="text-gray-400 mb-6">
                Tính năng này đang được migrate từ module gốc.
            </p>
            <div className="flex justify-center gap-4">
                <button
                    onClick={() => setCurrentStep(stepNum - 1)}
                    className="px-4 py-2 bg-gray-800 text-white rounded-lg"
                >
                    Quay lại
                </button>
                {stepNum < 5 && (
                    <button
                        onClick={() => setCurrentStep(stepNum + 1)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
                    >
                        Tiếp tục
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-white">AI Story Factory</h1>
                        <p className="text-xs text-gray-500">16 Writing Styles</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Role Badge */}
                    {isGold && (
                        <span className="flex items-center gap-1 text-xs font-bold text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded-lg border border-yellow-500/30">
                            <Crown className="w-3 h-3" />
                            GOLD
                        </span>
                    )}
                    {isPremium && !isGold && (
                        <span className="flex items-center gap-1 text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded-lg border border-blue-500/30">
                            <Star className="w-3 h-3" />
                            SILVER
                        </span>
                    )}

                    {/* Library Button */}
                    <button className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                        <History className="w-4 h-4" />
                        <span className="hidden sm:inline text-sm">Tủ Sách</span>
                    </button>
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="mb-6 bg-red-900/20 border border-red-800 text-red-300 p-4 rounded-lg flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="flex-1">{error}</p>
                    <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
                        <XCircle className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* Step Indicator */}
            <StepIndicator currentStep={currentStep} />

            {/* Step Content */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderPlaceholder(3)}
                {currentStep === 4 && renderPlaceholder(4)}
                {currentStep === 5 && renderPlaceholder(5)}
            </div>
        </div>
    );
}
