
import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { Sentence, Segment } from './types';
import { createSegmentsFromSentences } from './utils/segmentation';
import { countSyllables } from './utils/syllableCounter';
// Lazy load the heavy editor component to split the bundle
const Tab3Editor = React.lazy(() => import('./components/Tab3Editor'));
import { ResetIcon } from './components/icons';
import { ApiKeyModal } from './components/ApiKeyModal';
import { API_KEY_STORAGE_KEY, INVALID_KEY_EVENT } from './services/geminiService';

// Default configuration
const DEFAULT_MIN_SYLLABLES = 15;
const DEFAULT_MAX_SYLLABLES = 22;

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode; disabled?: boolean; }> = ({ active, onClick, children, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-3 text-sm font-semibold border-b-4 transition-colors duration-200 ${
      active
        ? 'border-indigo-500 text-indigo-600'
        : 'border-transparent text-slate-500 hover:text-indigo-500'
    } ${disabled ? 'cursor-not-allowed text-slate-400' : ''}`}
  >
    {children}
  </button>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('step1');
  const [inputText, setInputText] = useState('');
  const [sentences, setSentences] = useState<Sentence[]>([]);
  
  // Segments for Tab 3 (Optimized Length)
  const [segments, setSegments] = useState<Segment[]>([]);
  
  // Segments for Tab 4 (Original Sentences)
  const [segmentsTab4, setSegmentsTab4] = useState<Segment[]>([]);
  
  // Dynamic Configuration State
  const [minSyllables, setMinSyllables] = useState(DEFAULT_MIN_SYLLABLES);
  const [maxSyllables, setMaxSyllables] = useState(DEFAULT_MAX_SYLLABLES);

  // API Key Modal State
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  // Check API Key on Mount
  useEffect(() => {
    const checkKey = () => {
        const key = localStorage.getItem(API_KEY_STORAGE_KEY);
        if (key) {
            setHasApiKey(true);
            setIsApiKeyModalOpen(false);
        } else {
            setHasApiKey(false);
            setIsApiKeyModalOpen(true);
        }
    };

    checkKey();

    // Listen for invalid key events from service
    const handleInvalidKey = () => {
        setHasApiKey(false);
        setIsApiKeyModalOpen(true);
    };

    window.addEventListener(INVALID_KEY_EVENT, handleInvalidKey);
    return () => window.removeEventListener(INVALID_KEY_EVENT, handleInvalidKey);
  }, []);

  const handleSaveApiKey = (key: string) => {
      localStorage.setItem(API_KEY_STORAGE_KEY, key);
      setHasApiKey(true);
      setIsApiKeyModalOpen(false);
  };

  useEffect(() => {
    try {
      const savedState = localStorage.getItem('vietVoiceProEditorState');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        if (parsed.inputText) setInputText(parsed.inputText);
        if (parsed.sentences) setSentences(parsed.sentences);
        if (parsed.segments) setSegments(parsed.segments);
        if (parsed.segmentsTab4) setSegmentsTab4(parsed.segmentsTab4);
        if (parsed.activeTab) setActiveTab(parsed.activeTab);
        // Load saved config if exists, otherwise default
        if (parsed.minSyllables) setMinSyllables(parsed.minSyllables);
        if (parsed.maxSyllables) setMaxSyllables(parsed.maxSyllables);
      }
    } catch (error) {
      console.error("Failed to load state from localStorage", error);
    }
  }, []);

  const saveState = useCallback(() => {
    try {
      const state = { 
          inputText, 
          sentences, 
          segments, 
          segmentsTab4,
          activeTab,
          minSyllables,
          maxSyllables
      };
      localStorage.setItem('vietVoiceProEditorState', JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save state to localStorage", error);
    }
  }, [inputText, sentences, segments, segmentsTab4, activeTab, minSyllables, maxSyllables]);

  useEffect(() => {
    const handler = setTimeout(() => {
        saveState();
    }, 500); // Debounce saving
    return () => clearTimeout(handler);
  }, [saveState]);

  const handleProcessToStep2 = () => {
    // Split the text strictly by newlines as requested.
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
    const mappedSegments: Segment[] = sentences.map((s, index) => {
        const syllables = countSyllables(s.text);
        return {
            segment_id: `VS_${String(index + 1).padStart(3, '0')}`,
            text: s.text,
            syllable_count: syllables,
            note: '',
            is_valid: syllables >= minSyllables && syllables <= maxSyllables
        };
    });
    setSegmentsTab4(mappedSegments);
    setActiveTab('step4');
  };

  const handleNewSession = () => {
    if (window.confirm('Bạn có chắc muốn xóa tất cả dữ liệu và bắt đầu phiên mới?')) {
      setInputText('');
      setSentences([]);
      setSegments([]);
      setSegmentsTab4([]);
      localStorage.removeItem('vietVoiceProEditorState');
      setActiveTab('step1');
      alert('Đã bắt đầu phiên làm việc mới.');
    }
  };
  
  const totalSyllables = sentences.reduce((acc, s) => acc + countSyllables(s.text), 0);
  const totalWords = sentences.reduce((acc, s) => acc + s.text.split(/\s+/).filter(Boolean).length, 0);

  const renderContent = () => {
    switch (activeTab) {
      case 'step1':
        return (
            <div className="p-6 bg-white rounded-lg shadow-md">
                <h2 className="text-xl font-bold text-slate-800 mb-4">① PHÂN TÁCH CÂU (THEO DÒNG)</h2>
                <p className="text-sm text-slate-500 mb-2">Nhập văn bản của bạn dưới đây. Hệ thống sẽ nhận diện mỗi dòng là một câu.</p>
                <textarea
                    className="w-full h-64 p-4 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    placeholder="Dán văn bản gốc vào đây..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                />
                <div className="flex justify-end mt-4">
                    <button
                        onClick={handleProcessToStep2}
                        disabled={!inputText.trim()}
                        className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
                    >
                        Phân Tách Câu & Chuyển Sang Bước 2
                    </button>
                </div>
            </div>
        );
      case 'step2':
        return (
            <div className="p-6 bg-white rounded-lg shadow-md">
                <h2 className="text-xl font-bold text-slate-800 mb-4">② TẠO VOICE SEGMENTS</h2>
                <div className="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-md grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div><span className="block text-sm text-slate-500">Tổng số câu</span><span className="text-2xl font-bold text-indigo-600">{sentences.length}</span></div>
                    <div><span className="block text-sm text-slate-500">Tổng số từ</span><span className="text-2xl font-bold text-indigo-600">{totalWords}</span></div>
                    <div><span className="block text-sm text-slate-500">Tổng âm tiết</span><span className="text-2xl font-bold text-indigo-600">{totalSyllables}</span></div>
                    <div><span className="block text-sm text-slate-500">Tổng ký tự</span><span className="text-2xl font-bold text-indigo-600">{inputText.length}</span></div>
                </div>
                <div className="max-h-96 overflow-y-auto space-y-3 pr-2 mb-4">
                    {sentences.map((sentence, index) => (
                        <div key={sentence.id} className="p-3 bg-white border border-slate-200 rounded-md flex items-start gap-3">
                            <span className="text-sm font-medium text-indigo-500 bg-indigo-100 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-1">{index + 1}</span>
                            <p className="text-slate-700">{sentence.text}</p>
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
                        <span className="text-xs text-slate-500 mt-1">Cắt/Gộp câu tự động để đạt độ dài chuẩn</span>
                    </div>

                    <div className="flex flex-col items-end">
                        <button
                            onClick={handleProcessToStep4}
                            className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 transition-colors w-full sm:w-auto"
                        >
                            Giữ Nguyên Câu Gốc
                        </button>
                         <span className="text-xs text-slate-500 mt-1">1 Câu = 1 Segment (Không cắt gộp)</span>
                    </div>
                </div>
            </div>
        );
      case 'step3':
        return (
          <Suspense fallback={
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-600 font-medium">Đang tải trình chỉnh sửa (Tối ưu)...</p>
            </div>
          }>
            <Tab3Editor 
                initialSegments={segments} 
                setParentSegments={setSegments}
                minSyllables={minSyllables}
                maxSyllables={maxSyllables}
            />
          </Suspense>
        );
      case 'step4':
        return (
          <Suspense fallback={
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-600 font-medium">Đang tải trình chỉnh sửa (Nguyên bản)...</p>
            </div>
          }>
            <Tab3Editor 
                initialSegments={segmentsTab4} 
                setParentSegments={setSegmentsTab4}
                minSyllables={minSyllables}
                maxSyllables={maxSyllables}
            />
          </Suspense>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <ApiKeyModal 
        isOpen={isApiKeyModalOpen} 
        onSave={handleSaveApiKey} 
        onClose={() => setIsApiKeyModalOpen(false)}
        hasExistingKey={hasApiKey}
      />

      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap justify-between items-center py-3 gap-3">
          <div className="flex items-center gap-4">
             <h1 className="text-2xl font-bold text-slate-800">VietVoice Pro Editor</h1>
             <button 
                onClick={() => setIsApiKeyModalOpen(true)}
                className="text-xs font-semibold text-slate-500 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 px-2 py-1 rounded transition-colors flex items-center gap-1"
             >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11.536 16.536a2.25 2.25 0 01-.659 1.591l-2.12 2.12m-2.646-2.647a2.25 2.25 0 00-1.591.659l-2.12 2.12m2.646-2.647L8.293 20.293M3 15a6 6 0 0112 0v1H3v-1z" /></svg>
                {hasApiKey ? "Cài đặt Key" : "Nhập Key"}
             </button>
          </div>
          
          <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-lg border border-slate-200">
              <span className="text-sm font-bold text-slate-700">Cấu hình độ dài:</span>
              <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-500">Min:</label>
                  <input 
                    type="number" 
                    value={minSyllables} 
                    onChange={(e) => setMinSyllables(Number(e.target.value))}
                    className="w-16 p-1 text-sm border border-slate-300 rounded focus:ring-indigo-500"
                  />
              </div>
              <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-500">Max:</label>
                  <input 
                    type="number" 
                    value={maxSyllables} 
                    onChange={(e) => setMaxSyllables(Number(e.target.value))}
                    className="w-16 p-1 text-sm border border-slate-300 rounded focus:ring-indigo-500"
                  />
              </div>
          </div>

          <button onClick={handleNewSession} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-100 rounded-md hover:bg-red-200 transition-colors">
            <ResetIcon className="w-4 h-4" />
            Bắt Đầu Phiên Mới
          </button>
        </div>
        <nav className="border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex overflow-x-auto">
              <TabButton active={activeTab === 'step1'} onClick={() => setActiveTab('step1')}>① PHÂN TÁCH CÂU</TabButton>
              <TabButton active={activeTab === 'step2'} onClick={() => setActiveTab('step2')} disabled={sentences.length === 0}>② TẠO SEGMENTS</TabButton>
              <TabButton active={activeTab === 'step3'} onClick={() => setActiveTab('step3')} disabled={segments.length === 0}>③ EDITOR (TỐI ƯU)</TabButton>
              <TabButton active={activeTab === 'step4'} onClick={() => setActiveTab('step4')} disabled={segmentsTab4.length === 0}>④ EDITOR (GỐC)</TabButton>
            </div>
          </div>
        </nav>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
