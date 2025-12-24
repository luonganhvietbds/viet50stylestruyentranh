'use client';

import React from 'react';
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
    XCircle,
    Check,
    RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useApiKey } from '@/contexts/ApiKeyContext';
import { useStoryFlow, StoryStep } from '@/hooks/useStoryFlow';
import { StoryLength, STORY_LENGTH_CONFIG } from '@/types/styles';
import * as LucideIcons from 'lucide-react';

// Step Indicator Component
function StepIndicator({ currentStep }: { currentStep: number }) {
    const steps = [
        { num: 1, label: 'Phong cách' },
        { num: 2, label: 'Ý tưởng' },
        { num: 3, label: 'Chọn đề tài' },
        { num: 4, label: 'Cấu hình' },
        { num: 5, label: 'Đọc truyện' },
    ];

    return (
        <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
            {steps.map((step, idx) => (
                <React.Fragment key={step.num}>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${currentStep === step.num
                        ? 'bg-indigo-500 text-white'
                        : currentStep > step.num
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-gray-800 text-gray-500'
                        }`}>
                        <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">
                            {currentStep > step.num ? <Check className="w-3 h-3" /> : step.num}
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

// Dynamic icon helper
function getIcon(iconName: string, className?: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const icons = LucideIcons as unknown as Record<string, any>;
    const IconComponent = icons[iconName];
    if (IconComponent && typeof IconComponent === 'function') {
        return <IconComponent className={className || "w-6 h-6"} />;
    }
    return <Sparkles className={className || "w-6 h-6"} />;
}

export function StoryWorkspace() {
    const { isPremium, isGold } = useAuth();
    const { hasValidKey, openModal } = useApiKey();

    const {
        currentStep,
        styles,
        loadingStyles,
        selectedStyle,
        userInput,
        numIdeas,
        ideas,
        selectedIdea,
        storyLength,
        customPrompt,
        generatedStory,
        isGenerating,
        error,
        setCurrentStep,
        selectStyle,
        setUserInput,
        setNumIdeas,
        generateIdeas,
        selectIdea,
        setStoryLength,
        setCustomPrompt,
        generateStory,
        reset,
        clearError,
    } = useStoryFlow();

    // Step 1: Select Style
    const renderStep1 = () => (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Chọn Phong Cách Viết</h2>
                <p className="text-gray-400">Chọn style AI để sáng tác truyện theo phong cách riêng</p>
            </div>

            {loadingStyles ? (
                <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-4" />
                    <p className="text-gray-400">Đang tải styles...</p>
                </div>
            ) : styles.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-400 mb-4">Chưa có styles nào. Vui lòng liên hệ Admin.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {styles.map((style) => (
                        <button
                            key={style.id}
                            onClick={() => selectStyle(style.id)}
                            className={`p-4 rounded-xl border text-left transition-all group ${selectedStyle?.id === style.id
                                ? 'bg-indigo-500/20 border-indigo-500 ring-2 ring-indigo-500/50'
                                : 'bg-gray-900 border-gray-800 hover:border-gray-700 hover:bg-gray-800/50'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg bg-gray-800 ${style.colorClass} group-hover:scale-110 transition-transform`}>
                                    {getIcon(style.iconName, "w-5 h-5")}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-white text-sm truncate">{style.name}</h3>
                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{style.tagline}</p>
                                </div>
                            </div>
                            <p className="text-xs text-gray-400 mt-3 line-clamp-2">{style.description}</p>
                        </button>
                    ))}
                </div>
            )}

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
                <p className="text-gray-400">
                    Nhập mô tả hoặc từ khóa cho câu chuyện {selectedStyle?.name}
                </p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
                {/* Selected Style Badge */}
                <div className="flex items-center gap-2 mb-4">
                    <div className={`p-1.5 rounded-lg bg-gray-800 ${selectedStyle?.colorClass}`}>
                        {selectedStyle && getIcon(selectedStyle.iconName, "w-4 h-4")}
                    </div>
                    <span className="text-sm text-gray-400">
                        Style: <span className="text-white font-medium">{selectedStyle?.name}</span>
                    </span>
                </div>

                <textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder={selectedStyle?.template || "Ví dụ: Một thiếu niên phát hiện mình có khả năng du hành thời gian..."}
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
                    onClick={generateIdeas}
                    disabled={!userInput.trim() || !hasValidKey || isGenerating}
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

    // Step 3: Select Idea
    const renderStep3 = () => (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Chọn Ý Tưởng</h2>
                <p className="text-gray-400">AI đã tạo {ideas.length} ý tưởng, chọn một để phát triển</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ideas.map((idea) => (
                    <button
                        key={idea.id}
                        onClick={() => selectIdea(idea)}
                        className={`p-5 rounded-xl border text-left transition-all ${selectedIdea?.id === idea.id
                            ? 'bg-indigo-500/20 border-indigo-500 ring-2 ring-indigo-500/50'
                            : 'bg-gray-900 border-gray-800 hover:border-gray-700'
                            }`}
                    >
                        <h3 className="font-bold text-white text-lg mb-2">{idea.title}</h3>
                        <p className="text-sm text-indigo-300 mb-3 italic">"{idea.hook}"</p>
                        <p className="text-sm text-gray-400 mb-3">{idea.summary}</p>
                        <div className="flex flex-wrap gap-2">
                            <span className="text-xs px-2 py-1 bg-gray-800 text-gray-400 rounded">
                                Mâu thuẫn: {idea.conflict}
                            </span>
                            <span className="text-xs px-2 py-1 bg-gray-800 text-gray-400 rounded">
                                Tone: {idea.tone}
                            </span>
                        </div>
                    </button>
                ))}
            </div>

            <div className="flex justify-between mt-8">
                <button
                    onClick={() => setCurrentStep(2)}
                    className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Quay Lại
                </button>
                <button
                    onClick={() => setCurrentStep(4)}
                    disabled={!selectedIdea}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                >
                    Tiếp Tục
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );

    // Step 4: Configure Story
    const renderStep4 = () => (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Cấu Hình Truyện</h2>
                <p className="text-gray-400">Tùy chỉnh độ dài và yêu cầu bổ sung</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">
                {/* Selected Idea Preview */}
                <div className="p-4 bg-gray-950 rounded-lg border border-gray-800">
                    <h4 className="font-bold text-white mb-1">{selectedIdea?.title}</h4>
                    <p className="text-sm text-gray-400">{selectedIdea?.summary}</p>
                </div>

                {/* Story Length */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">Độ dài truyện</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {(Object.keys(STORY_LENGTH_CONFIG) as StoryLength[]).map((length) => {
                            const config = STORY_LENGTH_CONFIG[length];
                            return (
                                <button
                                    key={length}
                                    onClick={() => setStoryLength(length)}
                                    className={`p-3 rounded-lg border text-center transition-all ${storyLength === length
                                        ? 'bg-indigo-500/20 border-indigo-500'
                                        : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                                        }`}
                                >
                                    <p className="font-medium text-white">{config.label}</p>
                                    <p className="text-xs text-gray-400">{config.words} từ</p>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Custom Prompt */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Yêu cầu bổ sung (tuỳ chọn)
                    </label>
                    <textarea
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="Ví dụ: Thêm nhiều chi tiết về cảm xúc nhân vật, kết thúc bất ngờ..."
                        className="w-full h-24 p-3 bg-gray-950 border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                    />
                </div>
            </div>

            <div className="flex justify-between mt-8">
                <button
                    onClick={() => setCurrentStep(3)}
                    className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Quay Lại
                </button>
                <button
                    onClick={generateStory}
                    disabled={isGenerating}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-gray-800 disabled:to-gray-800 text-white rounded-lg font-medium flex items-center gap-2 transition-all"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Đang viết truyện...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-4 h-4" />
                            Viết Truyện
                        </>
                    )}
                </button>
            </div>
        </div>
    );

    // Step 5: Read Story
    const renderStep5 = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-white">{generatedStory?.title}</h2>
                    <p className="text-gray-400 text-sm mt-1">
                        {generatedStory?.wordCount} từ • Style: {selectedStyle?.name}
                    </p>
                </div>
                <button
                    onClick={reset}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Viết Truyện Mới
                </button>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
                <div
                    className="prose prose-invert prose-lg max-w-none"
                    style={{ whiteSpace: 'pre-wrap' }}
                >
                    {generatedStory?.content}
                </div>
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
                        <p className="text-xs text-gray-500">{styles.length} Writing Styles</p>
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
                    <button onClick={clearError} className="text-red-400 hover:text-red-300">
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
                {currentStep === 3 && renderStep3()}
                {currentStep === 4 && renderStep4()}
                {currentStep === 5 && renderStep5()}
            </div>
        </div>
    );
}
