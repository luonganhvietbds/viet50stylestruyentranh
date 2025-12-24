
import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  BrainCircuit, 
  Play, 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  FileJson, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  FileText, 
  Download, 
  Copy, 
  Video, 
  Image as ImageIcon, 
  Camera,
  Layers,
  BookOpen,
  Key,
  Settings,
  RefreshCw,
  Eye,
  LogOut,
  User,
  Crown,
  Star,
  Zap,
  Lock,
  LayoutDashboard
} from 'lucide-react';
import { useAppStore } from './store';
import { JobProcessor } from './components/JobProcessor';
import { ApiKeyModal } from './components/ApiKeyModal';
import { AuthModal } from './components/AuthModal';
import { PricingModal } from './components/PricingModal';
import { AdminDashboard } from './components/AdminDashboard'; // Import Admin Dashboard
import { ScriptJob, Scene } from './types';
import { useAuth } from './hooks/useAuth';
import { auth } from './src/firebase';
import { signOut } from 'firebase/auth';

function App() {
  const { 
    styles, 
    selectedStyleId, 
    setSelectedStyle, 
    scriptJobs, 
    addJob, 
    setProcessingQueue, 
    isProcessingQueue,
    deleteJob,
    setApiKeyModalOpen,
    apiKeys,
    user,
    isLoadingAuth,
    setAuthModalOpen,
    setPricingModalOpen,
    isAdminView,
    setAdminView
  } = useAppStore();

  const [inputVoice, setInputVoice] = useState("");
  const [useThinking, setUseThinking] = useState(false);

  // Initialize Auth Listener
  useAuth();

  useEffect(() => {
    console.log("ScriptGen AI: V2 Pipeline Loaded");
  }, []);

  const handleAddJob = () => {
    if (!inputVoice.trim()) return;
    
    // Feature Check: Free Tier Limits
    if (user?.role === 'free' && scriptJobs.length >= 3) {
      alert("Free users are limited to 3 concurrent jobs. Please delete completed jobs or upgrade to Silver/Gold.");
      setPricingModalOpen(true);
      return;
    }

    addJob(inputVoice, useThinking);
    setInputVoice("");
  };

  const handleRunQueue = () => {
    setProcessingQueue(true);
  };

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const isGold = user?.role === 'gold' || user?.role === 'admin';
  const isSilver = user?.role === 'silver';
  const isFree = user?.role === 'free';
  const isAdmin = user?.role === 'admin';

  // ---------------------------------------------------------------------------
  // 1. Loading State
  // ---------------------------------------------------------------------------
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-sm font-medium">Đang khởi tạo ứng dụng...</p>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 2. Login Wall (Not Authenticated)
  // ---------------------------------------------------------------------------
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Ambient Background */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-3xl"></div>
        </div>
        
        {/* Force Open Auth Modal */}
        <AuthModal forceOpen={true} />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 3. ADMIN VIEW
  // ---------------------------------------------------------------------------
  if (isAdminView && isAdmin) {
    return (
      <AdminDashboard />
    );
  }

  // ---------------------------------------------------------------------------
  // 4. Main Application (Authenticated)
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 font-sans selection:bg-indigo-500/30">
      <JobProcessor />
      {/* Modals check their own 'isOpen' state */}
      <ApiKeyModal />
      <AuthModal /> 
      <PricingModal />
      
      <header className="max-w-7xl mx-auto mb-10 border-b border-slate-800 pb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-indigo-400" />
            ScriptGen AI Agent
          </h1>
          <p className="text-slate-400 mt-2 font-medium">V2 Pipeline · Multi-Agent Architecture</p>
        </div>
        <div className="flex gap-4 items-center">
            
            {/* User Profile & Upgrade */}
            <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-lg p-1.5">
              
              <div className="flex flex-col items-end px-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1">
                      {user.displayName || user.email?.split('@')[0]}
                  </span>
                  
                  {/* Role Badge */}
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] uppercase font-bold px-1.5 rounded-sm flex items-center gap-1 ${
                        isGold ? 'bg-gradient-to-r from-amber-600 to-yellow-500 text-slate-950' :
                        isSilver ? 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white' :
                        'bg-slate-800 text-slate-500'
                    }`}>
                        {isAdmin ? <LayoutDashboard className="w-2.5 h-2.5" /> : 
                         isGold ? <Crown className="w-2.5 h-2.5" /> : 
                         isSilver ? <Star className="w-2.5 h-2.5" /> : null}
                        {user.role}
                    </span>
                    
                    {/* Upgrade Button Logic */}
                    {!isGold && (
                      <button 
                        onClick={() => setPricingModalOpen(true)}
                        className="text-[10px] text-indigo-400 hover:text-white flex items-center gap-0.5 hover:underline"
                      >
                        <Zap className="w-2.5 h-2.5" />
                        {isSilver ? 'Upgrade Gold' : 'Upgrade'}
                      </button>
                    )}
                  </div>
              </div>

              <div className="h-8 w-[1px] bg-slate-800"></div>
              
              <button 
                  onClick={handleLogout}
                  title="Đăng xuất"
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
              >
                  <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* ADMIN DASHBOARD BUTTON */}
            {isAdmin && (
              <button
                onClick={() => setAdminView(true)}
                className="px-3 py-2 rounded-lg border bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white font-medium text-xs flex items-center gap-2"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Admin Panel
              </button>
            )}

            <button
                onClick={() => setApiKeyModalOpen(true)}
                className={`px-3 py-2 rounded-lg border text-xs font-medium transition-colors flex items-center gap-2 group ${
                  apiKeys.length > 0 
                    ? 'bg-indigo-950/30 border-indigo-500/50 text-indigo-300 hover:bg-indigo-900/50' 
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white hover:border-slate-500'
                }`}
            >
                {apiKeys.length > 0 ? <Key className="w-3.5 h-3.5" /> : <Settings className="w-3.5 h-3.5" />}
                {apiKeys.length > 0 ? 'Key Rotation Config' : 'Setup API Keys'}
            </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Controls */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Style Selector V2 */}
          <section className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4" /> 1. Select Architecture Style
            </h2>
            <div className="space-y-3">
              {styles.map(style => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all relative overflow-hidden ${
                    selectedStyleId === style.id 
                      ? 'bg-indigo-900/20 border-indigo-500 ring-1 ring-indigo-500/50' 
                      : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {selectedStyleId === style.id && (
                     <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-indigo-500/20 to-transparent rounded-bl-3xl -mr-8 -mt-8"></div>
                  )}
                  <div className="font-bold text-slate-200 text-sm">{style.label}</div>
                  <div className="text-xs text-slate-500 mt-1 line-clamp-2">{style.description}</div>
                </button>
              ))}
            </div>
          </section>

          {/* Input Area */}
          <section className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4" /> 2. Input Voice Data
            </h2>
            <textarea
              value={inputVoice}
              onChange={(e) => setInputVoice(e.target.value)}
              placeholder='Paste JSON segments or plain text here...'
              className="w-full h-32 bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none mb-4 font-mono leading-relaxed"
            />
            
            {/* Thinking Mode - Locked for non-Gold users */}
            <div className={`flex items-center gap-2 mb-4 p-3 rounded-lg border transition-all ${
               isGold 
                 ? 'bg-indigo-950/30 border-indigo-900/50' 
                 : 'bg-slate-900/30 border-slate-800 opacity-70'
            }`}>
                <div className="relative flex items-center">
                    <input 
                        type="checkbox" 
                        id="thinkingMode"
                        checked={isGold && useThinking}
                        onChange={(e) => isGold && setUseThinking(e.target.checked)}
                        disabled={!isGold}
                        className="w-4 h-4 rounded border-slate-600 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900 disabled:cursor-not-allowed"
                    />
                </div>
                
                <label htmlFor="thinkingMode" className={`flex items-center gap-2 select-none flex-1 ${!isGold ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                    <BrainCircuit className={`w-4 h-4 ${isGold ? 'text-purple-400' : 'text-slate-600'}`} />
                    <div className="flex flex-col">
                        <span className={`text-sm font-medium ${isGold ? 'text-purple-200' : 'text-slate-500'}`}>Deep Thinking Mode</span>
                        <span className="text-[10px] text-slate-500">Gemini 3.0 Pro (Complex Logic)</span>
                    </div>
                </label>
                
                {!isGold && (
                    <button 
                        onClick={() => setPricingModalOpen(true)}
                        className="text-amber-500 hover:text-amber-400 p-1" 
                        title="Requires Gold Membership"
                    >
                        <Lock className="w-4 h-4" />
                    </button>
                )}
            </div>

            <button
              onClick={handleAddJob}
              disabled={!inputVoice.trim()}
              className="w-full py-2 bg-slate-100 text-slate-900 rounded-lg font-bold text-sm hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Job to Queue
            </button>
            
            {/* Free Tier Limit Warning */}
            {isFree && (
                <p className="text-[10px] text-center mt-3 text-slate-500">
                    Free Plan: {scriptJobs.length}/3 Jobs Active. 
                    <button onClick={() => setPricingModalOpen(true)} className="text-indigo-400 hover:underline ml-1">Upgrade</button>
                </p>
            )}
          </section>

          {/* Queue Control */}
          <section className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" /> Pipeline Control
                </h2>
                <span className="text-[10px] font-bold bg-slate-800 px-2 py-0.5 rounded-full text-slate-300 border border-slate-700">
                  {scriptJobs.filter(j => j.status === 'IDLE').length} Pending
                </span>
             </div>
             <button
                onClick={handleRunQueue}
                disabled={isProcessingQueue || scriptJobs.every(j => j.status !== 'IDLE')}
                className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
                    isProcessingQueue 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-indigo-500/20 border border-indigo-500/50'
                }`}
             >
                {isProcessingQueue ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Running Pipeline...
                    </>
                ) : (
                    <>
                        <Play className="w-5 h-5 fill-current" />
                        Start Batch Processing
                    </>
                )}
             </button>
          </section>
        </div>

        {/* RIGHT COLUMN: Jobs List */}
        <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between">
                 <h2 className="text-xl font-bold text-slate-200">Processing Dashboard</h2>
                 {scriptJobs.length > 0 && (
                     <button onClick={() => scriptJobs.forEach(j => deleteJob(j.id))} className="text-xs text-red-400 hover:text-red-300 transition-colors">Clear History</button>
                 )}
            </div>

            {scriptJobs.length === 0 ? (
                <div className="border-2 border-dashed border-slate-800 rounded-xl p-12 text-center text-slate-500 bg-slate-900/20">
                    <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="font-medium">Job queue is empty.</p>
                    <p className="text-xs mt-1">Select a style and add data to begin generation.</p>
                </div>
            ) : (
                scriptJobs.map(job => (
                    <JobCard key={job.id} job={job} onDelete={() => deleteJob(job.id)} />
                ))
            )}
        </div>
      </main>
    </div>
  );
}

// -----------------------------------------------------------------------------
// SUB-COMPONENTS
// -----------------------------------------------------------------------------

interface JobCardProps {
  job: ScriptJob;
  onDelete: () => void;
}

const JobCard: React.FC<JobCardProps> = ({ job, onDelete }) => {
    const [expanded, setExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState<'LOGS' | 'CHARACTERS' | 'SNIPPETS' | 'SCENES'>('LOGS');
    
    // Auto-switch tabs when job completes
    useEffect(() => {
        if (job.status === 'COMPLETED' && activeTab === 'LOGS') {
            setActiveTab('SCENES');
        }
    }, [job.status]);

    const steps = ['CHARACTER', 'SNIPPET', 'SCENE', 'DONE'];
    const currentIdx = steps.indexOf(job.currentStep);
    const progress = Math.max(5, ((currentIdx) / (steps.length - 1)) * 100);

    const downloadFile = (data: any, filename: string) => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
        const anchor = document.createElement('a');
        anchor.href = dataStr;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
    };

    const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

    return (
        <div className={`bg-slate-900 border rounded-xl overflow-hidden transition-all duration-300 ${
            expanded ? 'border-indigo-500/50 shadow-xl shadow-black/50' : 'border-slate-800 hover:border-slate-700'
        }`}>
            {/* Header */}
            <div className="p-4 flex items-center gap-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
                    job.status === 'COMPLETED' ? 'bg-green-900/20 text-green-400 border-green-900/50' :
                    job.status === 'ERROR' ? 'bg-red-900/20 text-red-400 border-red-900/50' :
                    job.status === 'PROCESSING' ? 'bg-indigo-900/20 text-indigo-400 border-indigo-900/50' :
                    'bg-slate-800 text-slate-500 border-slate-700'
                }`}>
                    {job.status === 'COMPLETED' ? <CheckCircle className="w-6 h-6" /> :
                     job.status === 'ERROR' ? <AlertCircle className="w-6 h-6" /> :
                     job.status === 'PROCESSING' ? <Loader2 className="w-6 h-6 animate-spin" /> :
                     <FileText className="w-6 h-6" />}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                             job.status === 'COMPLETED' ? 'bg-green-900/30 text-green-300' : 
                             job.status === 'ERROR' ? 'bg-red-900/30 text-red-300' :
                             'bg-slate-800 text-slate-400'
                        }`}>{job.status}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-900/30 text-indigo-300 border border-indigo-900/50 uppercase font-bold tracking-wider">{job.styleId}</span>
                        <span className="text-xs text-slate-500 ml-auto font-mono">ID: {job.id}</span>
                    </div>
                    <div className="relative h-1.5 bg-slate-800 rounded-full overflow-hidden w-full max-w-md">
                        <div className={`absolute top-0 left-0 h-full transition-all duration-500 ${
                             job.status === 'ERROR' ? 'bg-red-500' : 'bg-indigo-500'
                        }`} style={{ width: `${progress}%` }}></div>
                    </div>
                </div>

                <div className="flex items-center gap-2 pl-4 border-l border-slate-800">
                    <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400">
                        {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2 hover:bg-red-900/20 text-slate-600 hover:text-red-400 rounded-lg">
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Expanded Content (V2 Tabs) */}
            {expanded && (
                <div className="border-t border-slate-800 bg-slate-950/50 flex flex-col">
                    
                    {/* Tabs Navigation */}
                    <div className="flex border-b border-slate-800 bg-slate-900/50">
                        {[
                            { id: 'LOGS', icon: FileText, label: 'System Logs' },
                            { id: 'CHARACTERS', icon: BookOpen, label: 'Characters', count: job.characterBible?.characters?.length },
                            { id: 'SNIPPETS', icon: Layers, label: 'Snippets', count: job.characterSnippet?.length },
                            { id: 'SCENES', icon: Video, label: 'Scenes', count: job.scenes?.length },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-colors ${
                                    activeTab === tab.id 
                                        ? 'border-indigo-500 text-indigo-400 bg-indigo-950/10' 
                                        : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                                }`}
                            >
                                <tab.icon className="w-3.5 h-3.5" />
                                {tab.label}
                                {tab.count !== undefined && (
                                    <span className="bg-slate-800 text-slate-400 px-1.5 rounded-full text-[9px]">{tab.count}</span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="p-4 min-h-[300px]">
                        
                        {/* 1. LOGS TAB */}
                        {activeTab === 'LOGS' && (
                            <div className="space-y-2">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase">Process Logs</h4>
                                    <button onClick={() => downloadFile(job.logs, `logs_${job.id}.txt`)} className="text-xs text-indigo-400 hover:underline">Download Logs</button>
                                </div>
                                <div className="bg-slate-950 rounded border border-slate-800 p-4 h-64 overflow-y-auto font-mono text-xs text-slate-400 leading-relaxed shadow-inner">
                                    {job.logs.map((log, i) => (
                                        <div key={i} className="mb-1 border-b border-slate-900/50 last:border-0 pb-1">{log}</div>
                                    ))}
                                    {job.status === 'PROCESSING' && (
                                        <div className="animate-pulse text-indigo-400">_ Processing...</div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 2. CHARACTERS TAB */}
                        {activeTab === 'CHARACTERS' && (
                            <div className="space-y-4">
                                {!job.characterBible ? (
                                    <div className="text-center text-slate-500 py-10">Character data not yet generated.</div>
                                ) : (
                                    <>
                                        <div className="flex justify-end mb-2">
                                            <button 
                                                onClick={() => downloadFile(job.characterBible, `characters_${job.id}.json`)}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-medium border border-slate-700"
                                            >
                                                <Download className="w-3 h-3" /> JSON
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {job.characterBible.characters?.map((char: any, idx: number) => (
                                                <div key={idx} className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h5 className="font-bold text-slate-200 text-sm">{char.uid}</h5>
                                                        <span className="text-[10px] bg-indigo-900/30 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-900/50">{char.type}</span>
                                                    </div>
                                                    <div className="space-y-1 text-xs text-slate-400">
                                                        <p><span className="text-slate-500">Role:</span> {char.role}</p>
                                                        <p><span className="text-slate-500">Variants:</span> {char.variants?.length || 0}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-4">
                                             <h5 className="text-xs font-bold text-slate-500 uppercase mb-2">Raw JSON</h5>
                                             <pre className="bg-slate-950 p-3 rounded border border-slate-800 text-[10px] text-green-400 overflow-x-auto max-h-40">
                                                {JSON.stringify(job.characterBible, null, 2)}
                                             </pre>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* 3. SNIPPETS TAB */}
                        {activeTab === 'SNIPPETS' && (
                            <div className="space-y-4">
                                {!job.characterSnippet ? (
                                    <div className="text-center text-slate-500 py-10">Snippet data not yet generated.</div>
                                ) : (
                                    <>
                                        <div className="flex justify-end mb-2">
                                            <button 
                                                onClick={() => downloadFile(job.characterSnippet, `snippets_${job.id}.json`)}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-medium border border-slate-700"
                                            >
                                                <Download className="w-3 h-3" /> JSON
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            {(Array.isArray(job.characterSnippet) ? job.characterSnippet : [job.characterSnippet]).map((snip: any, idx: number) => (
                                                <div key={idx} className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex gap-3">
                                                    <div className="shrink-0 w-8 h-8 rounded-full bg-yellow-900/20 flex items-center justify-center text-yellow-500 text-xs font-bold border border-yellow-900/30">
                                                        {idx + 1}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-xs font-bold text-slate-300 mb-1">{snip.uid}</div>
                                                        <p className="text-xs text-yellow-500/90 font-mono leading-relaxed break-words">{snip.promptSnippet}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* 4. SCENES TAB (Main Output) */}
                        {activeTab === 'SCENES' && (
                            <div className="space-y-6">
                                {!job.scenes || job.scenes.length === 0 ? (
                                    <div className="text-center text-slate-500 py-10">No scenes generated yet. Pipeline in progress...</div>
                                ) : (
                                    <>
                                        <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                                            <div className="text-xs text-slate-400">
                                                Generated <span className="font-bold text-white">{job.scenes.length}</span> scenes
                                            </div>
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => downloadFile(job.scenes, `scenes_${job.id}.json`)}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold shadow-lg shadow-indigo-500/20"
                                                >
                                                    <Download className="w-3 h-3" /> Download Scene Data
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            {job.scenes.map((scene, i) => (
                                                <div key={i} className="bg-slate-950 p-5 rounded-xl border border-slate-800 shadow-sm relative group hover:border-slate-700 transition-colors">
                                                    <div className="absolute top-4 right-4 text-[10px] font-mono text-slate-600 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                                                        {scene.segment_id}
                                                    </div>
                                                    
                                                    {/* Header */}
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <span className="text-xs font-bold bg-indigo-500 text-white px-2.5 py-1 rounded shadow-lg shadow-indigo-500/30">
                                                            SCENE {scene.scene || i + 1}
                                                        </span>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                                            scene.feasibilityLevel === 'Easy' ? 'bg-green-900/20 text-green-400 border-green-900/30' :
                                                            scene.feasibilityLevel === 'Medium' ? 'bg-yellow-900/20 text-yellow-400 border-yellow-900/30' :
                                                            'bg-red-900/20 text-red-400 border-red-900/30'
                                                        }`}>
                                                            {scene.feasibilityLevel || 'Medium'}
                                                        </span>
                                                    </div>

                                                    {/* Description */}
                                                    <p className="text-sm text-slate-300 mb-5 leading-relaxed pl-1 border-l-2 border-slate-800">
                                                        {scene.description}
                                                    </p>
                                                    
                                                    {/* Technical Details */}
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5 bg-slate-900/30 p-3 rounded-lg border border-slate-800/50">
                                                        <div className="text-xs text-slate-400 flex items-center gap-2">
                                                            <Camera className="w-3.5 h-3.5 text-indigo-400" /> 
                                                            <span className="text-slate-200">{scene.camera}</span>
                                                        </div>
                                                        <div className="text-xs text-slate-400 flex items-center gap-2">
                                                            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                                                            <span className="text-slate-200">{scene.visualEffect || 'No effect'}</span>
                                                        </div>
                                                    </div>

                                                    {/* Prompts Section */}
                                                    <div className="space-y-3">
                                                        <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 hover:border-yellow-500/30 transition-colors group/prompt">
                                                            <div className="flex justify-between items-center mb-1.5">
                                                                <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1.5">
                                                                    <ImageIcon className="w-3 h-3" /> Image Prompt
                                                                </span>
                                                                <button onClick={() => copyToClipboard(scene.imagePrompt)} className="text-slate-600 hover:text-indigo-400 opacity-0 group-hover/prompt:opacity-100 transition-opacity">
                                                                    <Copy className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                            <p className="text-[10px] text-yellow-500/80 font-mono break-words leading-normal selection:bg-yellow-500/20">
                                                                {scene.imagePrompt}
                                                            </p>
                                                        </div>

                                                        <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 hover:border-blue-500/30 transition-colors group/prompt">
                                                            <div className="flex justify-between items-center mb-1.5">
                                                                <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1.5">
                                                                    <Video className="w-3 h-3" /> Video Prompt
                                                                </span>
                                                                <button onClick={() => copyToClipboard(scene.videoPrompt)} className="text-slate-600 hover:text-indigo-400 opacity-0 group-hover/prompt:opacity-100 transition-opacity">
                                                                    <Copy className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                            <p className="text-[10px] text-blue-400/80 font-mono break-words leading-normal selection:bg-blue-500/20">
                                                                {scene.videoPrompt}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
