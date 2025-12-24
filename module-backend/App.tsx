
import React, { useState, useEffect, useCallback } from 'react';
import { 
  BookOpen, AlertCircle, History, LogOut, Loader2, Crown, Sparkles, XCircle, Key
} from 'lucide-react';

// Components
import Step1Styles from './components/Step1Styles';
import Step2Input from './components/Step2Input';
import Step3Ideas from './components/Step3Ideas';
import Step4Config from './components/Step4Config';
import Step5Reader from './components/Step5Reader';
import LibraryDrawer from './components/LibraryDrawer';
import ApiKeyModal from './components/ApiKeyModal';
import Auth from './components/Auth';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import PricingModal from './components/PricingModal';
import { ErrorBoundary } from './components/ErrorBoundary';

// Hooks
import { useAuth } from './hooks/useAuth';
import { useAgents } from './hooks/useAgents';
import { useLibrary } from './hooks/useLibrary';
import { useStoryFlow } from './hooks/useStoryFlow';

const App: React.FC = () => {
  // --- AUTH & DATA ---
  const { 
    currentUser, userRole, isAdmin, setIsAdmin, loading: authLoading, 
    verificationEmail, setVerificationEmail, handleSignOut 
  } = useAuth();

  const { agentsList, updateAgentsList } = useAgents(currentUser?.uid);
  const { library, saveToLibrary, deleteFromLibrary } = useLibrary(currentUser?.uid);

  // --- UI STATE ---
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  
  // --- API KEY STATE (BYOK) ---
  const [apiKey, setApiKey] = useState<string>('');
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  useEffect(() => {
    const storedKey = localStorage.getItem('USER_GEMINI_KEY');
    if (storedKey) {
      setApiKey(storedKey);
    } else {
      setIsKeyModalOpen(true);
    }
  }, []);

  const handleSaveKey = (key: string) => {
    localStorage.setItem('USER_GEMINI_KEY', key);
    setApiKey(key);
    setIsKeyModalOpen(false);
  };

  const handleKeyError = useCallback(() => {
    // If API returns auth error, clear key and force prompt
    localStorage.removeItem('USER_GEMINI_KEY');
    setApiKey('');
    setIsKeyModalOpen(true);
    alert("API Key không hợp lệ hoặc đã hết hạn. Vui lòng nhập Key mới.");
  }, []);

  // --- STORY FLOW ---
  const flow = useStoryFlow({ 
    apiKey,
    saveToLibrary,
    onKeyError: handleKeyError 
  });

  // --- HANDLERS ---
  const handleAdminLoginSuccess = useCallback(() => {
    setIsAdmin(true);
    setIsAdminLoginOpen(false);
  }, [setIsAdmin]);

  const handleAdminLogout = useCallback(() => {
    setIsAdmin(false);
    setIsAdminLoginOpen(false);
  }, [setIsAdmin]);

  const handleDeleteStory = useCallback((id: string) => {
    deleteFromLibrary(id);
    if (flow.finalStory?.id === id) {
       flow.handleReset();
    }
  }, [deleteFromLibrary, flow.finalStory, flow.handleReset]);

  const onSignOut = useCallback(async () => {
    await handleSignOut();
    flow.handleReset();
  }, [handleSignOut, flow.handleReset]);

  // --- RENDERING ---

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
        <p className="text-gray-400 text-sm animate-pulse">Authenticating...</p>
      </div>
    );
  }

  // Admin Login
  if (isAdminLoginOpen) {
    return (
      <AdminLogin 
        onLoginSuccess={handleAdminLoginSuccess}
        onBack={() => setIsAdminLoginOpen(false)}
      />
    );
  }

  // Admin Dashboard
  if (isAdmin) {
    return (
      <AdminDashboard 
        agents={agentsList}
        onUpdateAgents={updateAgentsList}
        onLogout={handleAdminLogout}
      />
    );
  }

  // User Auth
  if (!currentUser) {
    return (
      <Auth 
        verificationEmail={verificationEmail} 
        setVerificationEmail={setVerificationEmail}
        onAdminClick={() => setIsAdminLoginOpen(true)}
      />
    );
  }

  // Main App
  return (
    <div className="min-h-screen flex flex-col bg-gray-950 text-gray-100">

      {/* HEADER */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={flow.handleReset}>
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">AI Story Factory</span>
          </div>
          
          <div className="flex items-center gap-3">
             {/* Role Badges */}
             {userRole === 'gold' && <span className="hidden md:flex items-center gap-1 text-xs font-bold text-yellow-500 bg-yellow-900/20 px-2 py-1 rounded border border-yellow-800"><Crown className="w-3 h-3" /> GOLD</span>}
             {userRole === 'silver' && <span className="hidden md:flex items-center gap-1 text-xs font-bold text-blue-400 bg-blue-900/20 px-2 py-1 rounded border border-blue-800"><Sparkles className="w-3 h-3" /> SILVER</span>}
             
             {/* UPGRADE BUTTON: Show for Free AND Silver */}
             {(userRole === 'free' || userRole === 'silver') && (
                <button 
                  onClick={() => setIsPricingOpen(true)}
                  className={`hidden md:flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full hover:scale-105 transition-transform
                    ${userRole === 'silver' 
                      ? 'text-yellow-900 bg-gradient-to-r from-yellow-400 to-amber-500' 
                      : 'text-gray-900 bg-gradient-to-r from-yellow-400 to-yellow-600'
                    }
                  `}
                >
                    <Crown className="w-3 h-3" /> {userRole === 'silver' ? 'LÊN GOLD' : 'NÂNG CẤP'}
                </button>
             )}

             <div className="h-6 w-px bg-gray-800 mx-1"></div>

             {/* API Key Button */}
             <button
                onClick={() => setIsKeyModalOpen(true)}
                className={`p-2 rounded-lg transition-colors ${!apiKey ? 'bg-red-900/20 text-red-400 animate-pulse' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                title="Cài đặt API Key"
             >
                <Key className="w-5 h-5" />
             </button>

             {/* Library Button */}
             <button 
                onClick={() => setIsLibraryOpen(true)}
                className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-gray-800"
              >
                <History className="w-4 h-4" />
                <span className="hidden md:inline">Tủ Sách</span>
             </button>

             <div className="flex items-center gap-3">
               <button 
                onClick={onSignOut}
                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                title="Sign Out"
               >
                 <LogOut className="w-5 h-5" />
               </button>
             </div>
          </div>
        </div>
      </header>
      
      {/* MODALS */}
      <ApiKeyModal 
        isOpen={isKeyModalOpen}
        hasKey={!!apiKey}
        onSave={handleSaveKey}
        onClose={() => setIsKeyModalOpen(false)}
      />

      <PricingModal 
        isOpen={isPricingOpen} 
        onClose={() => setIsPricingOpen(false)} 
        user={currentUser}
        currentRole={userRole}
      />

      <LibraryDrawer 
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        stories={library}
        onSelectStory={(story) => flow.handleLoadStory(story, agentsList)}
        onDeleteStory={handleDeleteStory}
      />

      {/* MAIN CONTENT */}
      <main className="flex-1 max-w-7xl mx-auto px-4 md:px-8 py-10 w-full relative">
        {/* Batch Cancel Button */}
        {flow.batchStatus && (
            <div className="fixed bottom-6 right-6 z-50 animate-bounce-in">
                <button 
                    onClick={flow.handleCancelBatch}
                    className="bg-red-900/80 hover:bg-red-800 text-white px-4 py-2 rounded-full shadow-2xl backdrop-blur border border-red-500 flex items-center gap-2 font-bold text-sm"
                >
                    <XCircle className="w-4 h-4" /> DỪNG VIẾT ({flow.batchStatus.split(':')[0]})
                </button>
            </div>
        )}

        {/* Error Banner */}
        {flow.error && (
          <div className="mb-6 bg-red-900/20 border border-red-800 text-red-300 p-4 rounded-lg flex items-center gap-3 animate-pulse">
            <AlertCircle className="w-5 h-5" />
            {flow.error}
          </div>
        )}

        <ErrorBoundary>
            <>
              {flow.step === 1 && (
                <Step1Styles 
                  onSelect={flow.handleStyleSelect} 
                  selectedAgentId={flow.selectedAgent?.id || null} 
                  agents={agentsList}
                  userRole={userRole}
                />
              )}
              
              {flow.step === 2 && flow.selectedAgent && (
                <Step2Input 
                  agent={flow.selectedAgent}
                  description={flow.userDescription}
                  setDescription={flow.setUserDescription}
                  numIdeas={flow.numIdeas}
                  setNumIdeas={flow.setNumIdeas}
                  onGenerate={flow.handleGenerateIdeas}
                  isGenerating={flow.isGeneratingIdeas}
                  customSystemPrompt={flow.customPrompts[flow.selectedAgent.id]}
                  onSaveCustomPrompt={flow.handleSaveCustomPrompt}
                  userRole={userRole}
                  onBack={flow.handleBack}
                />
              )}

              {flow.step === 3 && (
                <Step3Ideas 
                  ideas={flow.generatedIdeas}
                  selectedIdeas={flow.selectedIdeas}
                  onToggle={flow.handleIdeaToggle}
                  onSelectAll={flow.handleSelectAllIdeas}
                  onNext={flow.handleIdeaConfirm}
                  onBack={flow.handleBack}
                />
              )}

              {flow.step === 4 && flow.selectedIdeas.length > 0 && (
                <Step4Config 
                  selectedIdeas={flow.selectedIdeas}
                  length={flow.length}
                  setLength={flow.setLength}
                  customPrompt={flow.customPrompt}
                  setCustomPrompt={flow.setCustomPrompt}
                  onGenerate={flow.handleBatchGenerate}
                  isGenerating={flow.isWritingStory}
                  batchStatus={flow.batchStatus}
                  userRole={userRole}
                  onBack={flow.handleBack}
                />
              )}

              {flow.step === 5 && flow.finalStory && flow.selectedAgent && (
                <Step5Reader 
                  story={flow.finalStory}
                  agent={flow.selectedAgent}
                  onReset={flow.handleReset}
                  onUpdateStory={flow.handleUpdateStory}
                  batchStatus={flow.batchStatus}
                  onBack={flow.handleBack}
                  apiKey={apiKey}
                />
              )}
            </>
        </ErrorBoundary>
      </main>

    </div>
  );
};

export default App;
