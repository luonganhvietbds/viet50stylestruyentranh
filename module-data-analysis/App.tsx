
import React, { useState, useEffect } from 'react';
import { usePersistentState, detectKeys } from './utils/helpers';
import { Scene, ReplaceRule, AppSettings, TabType, ParsedResult } from './types';

// Modules
import ImportModule from './components/modules/ImportModule';
import ExtractModule from './components/modules/ExtractModule';
import ReplaceJsonModule from './components/modules/ReplaceJsonModule';
import ReplaceTextModule from './components/modules/ReplaceTextModule';
import GeminiModule from './components/modules/GeminiModule';
import PromptFormatModule from './components/modules/PromptFormatModule';
import SettingsModule from './components/modules/SettingsModule';
import TvcExtractModule from './components/modules/TvcExtractModule';
import ApiKeyModal from './components/ApiKeyModal';

const App: React.FC = () => {
  // --- Global State ---
  const [settings, setSettings] = usePersistentState<AppSettings>('app_settings', {
    joinSeparator: '\n\n',
    apiKey: ''
  });

  const [sceneData, setSceneData] = usePersistentState<Scene[]>('project_data', []);
  const [jsonRules, setJsonRules] = usePersistentState<ReplaceRule[]>('project_json_rules', []);
  const [activeTab, setActiveTab] = usePersistentState<TabType>('active_tab', 'import');

  // Modal State
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  // --- Auth Logic ---
  useEffect(() => {
    // Check key on mount. If missing, open modal.
    if (!settings.apiKey) {
      setIsKeyModalOpen(true);
    }
  }, [settings.apiKey]);

  const handleSaveApiKey = (key: string) => {
    setSettings({ ...settings, apiKey: key });
    setIsKeyModalOpen(false);
  };

  const handleAuthError = () => {
    // Called by GeminiModule when API returns 401/403
    setIsKeyModalOpen(true);
  };

  // State temporary for transferring data to Gemini
  const [geminiContext, setGeminiContext] = useState<string>('');

  // --- Handlers ---
  const handleDataParsed = (result: ParsedResult) => {
    const newData = [...sceneData, ...result.data];
    setSceneData(newData);
    if (result.data.length > 0) {
      alert(`Đã nhập thành công ${result.data.length} dòng dữ liệu.`);
      setActiveTab('extract');
    }
  };

  const handleClearProject = () => {
    if(window.confirm("Bạn có chắc chắn muốn xóa dữ liệu nhập để bắt đầu phiên mới? (API Key và Quy tắc sẽ được giữ lại)")) {
      // 1. Reset Main Data
      setSceneData([]);
      
      // 2. Remove specific data-related keys from localStorage to reset child modules
      // We do NOT use localStorage.clear() to preserve settings and rules.
      const keysToRemove = [
        'import_draft_input',
        'tvc_selected_key', 
        'extract_selected_keys',
        'replace_text_input',
        'prompt_format_input',
        'gemini_context_data'
      ];
      
      keysToRemove.forEach(k => window.localStorage.removeItem(k));

      // 3. Reset UI State
      setActiveTab('import');
      
      // 4. Reload to ensure all child components re-initialize with empty state
      window.location.reload();
    }
  };

  const handleSendToGemini = (text: string) => {
    setGeminiContext(text);
    setActiveTab('gemini');
  };

  const availableKeys = React.useMemo(() => detectKeys(sceneData), [sceneData]);

  const tabs: { id: TabType; label: string; }[] = [
    { id: 'import', label: '1. Nhập liệu' },
    { id: 'extract', label: '2. Trích xuất & Bảng' },
    { id: 'replace_json', label: '3. Thay thế (JSON)' },
    { id: 'replace_text', label: '4. Xử lý Văn bản' },
    { id: 'gemini', label: '5. Gemini AI' },
    { id: 'prompt_format', label: '6. Chuẩn hóa Prompt' },
    { id: 'tvc_extract', label: '7. Phân tách TVC' },
    { id: 'settings', label: 'Cài đặt' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900 flex flex-col">
      {/* GLOBAL BLOCKING MODAL */}
      <ApiKeyModal 
        isOpen={isKeyModalOpen} 
        onSave={handleSaveApiKey}
        initialValue={settings.apiKey}
      />

      {/* Header & Nav */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-screen-2xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold">S</div>
              <h1 className="font-bold text-lg hidden sm:block">SceneJSON Pro VN</h1>
            </div>
            
            <nav className="flex space-x-1 overflow-x-auto no-scrollbar">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-screen-2xl w-full mx-auto px-4 py-6">
        {activeTab === 'import' && (
          <ImportModule 
            onDataParsed={handleDataParsed} 
            existingDataCount={sceneData.length} 
          />
        )}
        
        {activeTab === 'extract' && (
          <ExtractModule 
            data={sceneData} 
            availableKeys={availableKeys} 
            settings={settings}
            onSendToGemini={handleSendToGemini}
          />
        )}

        {activeTab === 'replace_json' && (
          <ReplaceJsonModule 
            data={sceneData} 
            availableKeys={availableKeys}
            rules={jsonRules}
            setRules={setJsonRules}
            settings={settings}
          />
        )}

        {activeTab === 'replace_text' && (
          <ReplaceTextModule />
        )}

        {activeTab === 'gemini' && (
          <GeminiModule 
            settings={settings} 
            initialContext={geminiContext}
            onAuthError={handleAuthError}
          />
        )}

        {activeTab === 'prompt_format' && (
          <PromptFormatModule />
        )}

        {activeTab === 'tvc_extract' && (
          <TvcExtractModule 
            data={sceneData} 
            settings={settings}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsModule 
            settings={settings} 
            setSettings={setSettings} 
            onClearProject={handleClearProject} 
          />
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-auto py-4">
        <div className="max-w-screen-2xl mx-auto px-4 text-center text-xs text-gray-400">
           SceneJSON Pro VN &copy; 2025. BYOK Architecture. Dữ liệu và Key được lưu trên trình duyệt của bạn.
        </div>
      </footer>
    </div>
  );
};

export default App;