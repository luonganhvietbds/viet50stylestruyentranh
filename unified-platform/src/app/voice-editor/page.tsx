'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Mic, ArrowRight, RefreshCw, Trash2 } from 'lucide-react';
import { AuthScreen } from '../story-factory/components/AuthScreen';
import { useState, useCallback, useEffect } from 'react';
import { Segment, Sentence, countSyllables, createSegmentsFromSentences, createSegmentsFromOriginal, VoiceLanguage, VOICE_LANGUAGES, getUnitLabel } from '@/lib/voice-editor';
import { SegmentEditor } from '@/components/voice-editor';

const TABS = [
    { id: 'step1', label: '① PHÂN TÁCH CÂU' },
    { id: 'step2', label: '② TẠO SEGMENTS' },
    { id: 'step3', label: '③ EDITOR (TỐI ƯU)' },
    { id: 'step4', label: '④ EDITOR (GỐC)' },
];

// Storage keys for Voice Editor
const STORAGE_KEYS = {
    activeTab: 'voice_editor_tab',
    inputText: 'voice_editor_input',
    sentences: 'voice_editor_sentences',
    segments: 'voice_editor_segments',
    segmentsTab4: 'voice_editor_segments_tab4',
    minSyllables: 'voice_editor_min',
    maxSyllables: 'voice_editor_max',
    language: 'voice_editor_language',
};

export default function VoiceEditorPage() {
    const { user, loading: authLoading } = useAuth();
    const [activeTab, setActiveTab] = useState('step1');
    const [inputText, setInputText] = useState('');
    const [sentences, setSentences] = useState<Sentence[]>([]);
    const [segments, setSegments] = useState<Segment[]>([]);
    const [segmentsTab4, setSegmentsTab4] = useState<Segment[]>([]);
    const [minSyllables, setMinSyllables] = useState(15);
    const [maxSyllables, setMaxSyllables] = useState(22);
    const [language, setLanguage] = useState<VoiceLanguage>('vi');
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const savedTab = localStorage.getItem(STORAGE_KEYS.activeTab);
            if (savedTab) setActiveTab(savedTab);

            const savedInput = localStorage.getItem(STORAGE_KEYS.inputText);
            if (savedInput) setInputText(savedInput);

            const savedSentences = localStorage.getItem(STORAGE_KEYS.sentences);
            if (savedSentences) setSentences(JSON.parse(savedSentences));

            const savedSegments = localStorage.getItem(STORAGE_KEYS.segments);
            if (savedSegments) setSegments(JSON.parse(savedSegments));

            const savedSegmentsTab4 = localStorage.getItem(STORAGE_KEYS.segmentsTab4);
            if (savedSegmentsTab4) setSegmentsTab4(JSON.parse(savedSegmentsTab4));

            const savedMin = localStorage.getItem(STORAGE_KEYS.minSyllables);
            if (savedMin) setMinSyllables(Number(savedMin));

            const savedMax = localStorage.getItem(STORAGE_KEYS.maxSyllables);
            if (savedMax) setMaxSyllables(Number(savedMax));

            const savedLang = localStorage.getItem(STORAGE_KEYS.language);
            if (savedLang && ['vi', 'en', 'ko', 'ja'].includes(savedLang)) setLanguage(savedLang as VoiceLanguage);
        } catch { /* ignore */ }
        setIsLoaded(true);
    }, []);

    // Save to localStorage on change
    useEffect(() => {
        if (!isLoaded) return;
        try {
            localStorage.setItem(STORAGE_KEYS.activeTab, activeTab);
            localStorage.setItem(STORAGE_KEYS.inputText, inputText);
            localStorage.setItem(STORAGE_KEYS.sentences, JSON.stringify(sentences));
            localStorage.setItem(STORAGE_KEYS.segments, JSON.stringify(segments));
            localStorage.setItem(STORAGE_KEYS.segmentsTab4, JSON.stringify(segmentsTab4));
            localStorage.setItem(STORAGE_KEYS.minSyllables, String(minSyllables));
            localStorage.setItem(STORAGE_KEYS.maxSyllables, String(maxSyllables));
            localStorage.setItem(STORAGE_KEYS.language, language);
        } catch { /* ignore */ }
    }, [isLoaded, activeTab, inputText, sentences, segments, segmentsTab4, minSyllables, maxSyllables, language]);

    if (authLoading) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-green-500 animate-spin" />
                <p className="text-gray-400 text-sm">Đang tải...</p>
            </div>
        );
    }

    if (!user) {
        return <AuthScreen moduleName="VietVoice Pro Editor" />;
    }

    const handleProcessToStep2 = () => {
        const rawSentences = inputText.split(/\r?\n/);
        const detectedSentences = rawSentences
            .map(s => s.trim())
            .filter(s => s.length > 0)
            .map((s, i) => ({ id: i, text: s }));
        setSentences(detectedSentences);
        setActiveTab('step2');
    };

    const handleProcessToStep3 = () => {
        const generatedSegments = createSegmentsFromSentences(
            sentences.map(s => s.text),
            minSyllables,
            maxSyllables
        );
        setSegments(generatedSegments);
        setActiveTab('step3');
    };

    const handleProcessToStep4 = () => {
        const mappedSegments = createSegmentsFromOriginal(
            sentences.map(s => s.text),
            minSyllables,
            maxSyllables
        );
        setSegmentsTab4(mappedSegments);
        setActiveTab('step4');
    };

    const handleNewSession = () => {
        if (window.confirm('⚠️ XÓA TẤT CẢ DỮ LIỆU?\n\nBạn có chắc muốn xóa tất cả dữ liệu phiên làm việc và bắt đầu lại từ đầu?')) {
            // Clear state
            setInputText('');
            setSentences([]);
            setSegments([]);
            setSegmentsTab4([]);
            setActiveTab('step1');
            setMinSyllables(15);
            setMaxSyllables(22);

            // Clear localStorage
            Object.values(STORAGE_KEYS).forEach(key => {
                try { localStorage.removeItem(key); } catch { /* ignore */ }
            });
        }
    };

    const totalSyllables = sentences.reduce((acc, s) => acc + countSyllables(s.text, language), 0);
    const totalWords = sentences.reduce((acc, s) => acc + s.text.split(/\s+/).filter(Boolean).length, 0);
    const currentUnitLabel = getUnitLabel(language);

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-gray-100">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap justify-between items-center py-3 gap-3">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                                <Mic className="w-5 h-5 text-white" />
                            </div>
                            <h1 className="text-xl font-bold text-gray-800">VietVoice Pro Editor</h1>
                        </div>
                        {/* Language Selector */}
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value as VoiceLanguage)}
                            className="px-3 py-2 text-sm font-medium bg-white border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 cursor-pointer"
                        >
                            {VOICE_LANGUAGES.map(lang => (
                                <option key={lang.code} value={lang.code}>
                                    {lang.flag} {lang.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-4 bg-green-50 p-3 rounded-lg border-2 border-green-200">
                        <span className="text-sm font-bold text-green-700">🎯 Mục tiêu:</span>
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-medium text-gray-600">Min:</label>
                            <input
                                type="number"
                                min={1}
                                max={100}
                                value={minSyllables}
                                onChange={(e) => setMinSyllables(Number(e.target.value) || 1)}
                                className="w-16 px-2 py-1.5 text-center text-sm font-bold text-green-700 bg-white border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            />
                        </div>
                        <span className="text-gray-400">–</span>
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-medium text-gray-600">Max:</label>
                            <input
                                type="number"
                                min={1}
                                max={100}
                                value={maxSyllables}
                                onChange={(e) => setMaxSyllables(Number(e.target.value) || 1)}
                                className="w-16 px-2 py-1.5 text-center text-sm font-bold text-green-700 bg-white border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            />
                        </div>
                        <span className="text-xs text-gray-500">{currentUnitLabel}</span>
                    </div>

                    <button
                        onClick={handleNewSession}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Bắt Đầu Phiên Mới
                    </button>
                </div>

                {/* Tabs */}
                <nav className="border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex overflow-x-auto">
                            {TABS.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    disabled={
                                        (tab.id !== 'step1' && sentences.length === 0) ||
                                        (tab.id === 'step3' && segments.length === 0) ||
                                        (tab.id === 'step4' && segmentsTab4.length === 0)
                                    }
                                    className={`px-4 py-3 text-sm font-semibold border-b-4 transition-colors ${activeTab === tab.id
                                        ? 'border-green-500 text-green-600'
                                        : 'border-transparent text-gray-500 hover:text-green-500 disabled:text-gray-300 disabled:cursor-not-allowed'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </nav>
            </header>

            {/* Content */}
            <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                {activeTab === 'step1' && (
                    <div className="p-6 bg-white rounded-lg shadow-md">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">① PHÂN TÁCH CÂU (THEO DÒNG)</h2>
                        <p className="text-sm text-gray-500 mb-2">Nhập văn bản của bạn dưới đây. Hệ thống sẽ nhận diện mỗi dòng là một câu.</p>
                        <textarea
                            className="w-full h-64 p-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition text-gray-800"
                            placeholder="Dán văn bản gốc vào đây..."
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                        />
                        <div className="flex justify-end mt-4">
                            <button
                                onClick={handleProcessToStep2}
                                disabled={!inputText.trim()}
                                className="px-6 py-2 bg-green-600 text-white font-semibold rounded-md shadow-sm hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                            >
                                Phân Tách Câu & Chuyển Sang Bước 2
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'step2' && (
                    <div className="p-6 bg-white rounded-lg shadow-md">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">② TẠO VOICE SEGMENTS</h2>
                        <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-md grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div><span className="block text-sm text-gray-500">Tổng số câu</span><span className="text-2xl font-bold text-green-600">{sentences.length}</span></div>
                            <div><span className="block text-sm text-gray-500">Tổng số từ</span><span className="text-2xl font-bold text-green-600">{totalWords}</span></div>
                            <div><span className="block text-sm text-gray-500">Tổng âm tiết</span><span className="text-2xl font-bold text-green-600">{totalSyllables}</span></div>
                            <div><span className="block text-sm text-gray-500">Config</span><span className="text-2xl font-bold text-green-600">{minSyllables}-{maxSyllables}</span></div>
                        </div>
                        <div className="max-h-96 overflow-y-auto space-y-3 pr-2 mb-4">
                            {sentences.map((sentence, index) => (
                                <div key={sentence.id} className="p-3 bg-white border border-gray-200 rounded-md flex items-start gap-3">
                                    <span className="text-sm font-medium text-green-500 bg-green-100 rounded-full w-6 h-6 flex items-center justify-center shrink-0 mt-1">{index + 1}</span>
                                    <p className="text-gray-700">{sentence.text}</p>
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4 border-t pt-4">
                            <div className="flex flex-col items-end">
                                <button
                                    onClick={handleProcessToStep3}
                                    className="px-6 py-2 bg-green-600 text-white font-semibold rounded-md shadow-sm hover:bg-green-700 transition-colors w-full sm:w-auto"
                                >
                                    Tạo Segments Tối Ưu ({minSyllables}-{maxSyllables} âm)
                                </button>
                                <span className="text-xs text-gray-500 mt-1">Cắt/Gộp câu tự động để đạt độ dài chuẩn</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <button
                                    onClick={handleProcessToStep4}
                                    className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 transition-colors w-full sm:w-auto"
                                >
                                    Giữ Nguyên Câu Gốc
                                </button>
                                <span className="text-xs text-gray-500 mt-1">1 Câu = 1 Segment (Không cắt gộp)</span>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'step3' && (
                    <SegmentEditor
                        initialSegments={segments}
                        onSegmentsChange={setSegments}
                        minSyllables={minSyllables}
                        maxSyllables={maxSyllables}
                        language={language}
                    />
                )}

                {activeTab === 'step4' && (
                    <SegmentEditor
                        initialSegments={segmentsTab4}
                        onSegmentsChange={setSegmentsTab4}
                        minSyllables={minSyllables}
                        maxSyllables={maxSyllables}
                        language={language}
                    />
                )}
            </main>
        </div>
    );
}
