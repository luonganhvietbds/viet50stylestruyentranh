'use client';

import { useAuth } from '@/contexts/AuthContext';
import {
    Loader2, Video, Play, Trash2, Layers, FileText, RefreshCw,
    Check, AlertCircle, XCircle, Clock, Zap, Download, Copy,
    ChevronDown, ChevronUp, Sparkles
} from 'lucide-react';
import { AuthScreen } from '../story-factory/components/AuthScreen';
import { useState } from 'react';
import { useScenePipeline } from '@/hooks/useScenePipeline';
import { useApiKey } from '@/contexts/ApiKeyContext';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import * as LucideIcons from 'lucide-react';

// Dynamic icon helper
function getIcon(iconName: string, className?: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const icons = LucideIcons as unknown as Record<string, any>;
    const IconComponent = icons[iconName];
    if (IconComponent && typeof IconComponent === 'function') {
        return <IconComponent className={className || "w-5 h-5"} />;
    }
    return <Sparkles className={className || "w-5 h-5"} />;
}

export default function SceneGenPage() {
    const { user, loading: authLoading } = useAuth();
    const { hasValidKey, openModal } = useApiKey();

    const {
        styles,
        loadingStyles,
        selectedStyle,
        voiceInput,
        useThinkingModel,
        currentJob,
        jobHistory,
        error,
        selectStyle,
        setVoiceInput,
        setUseThinkingModel,
        startPipeline,
        clearError,
        clearHistory,
        resetJob,
    } = useScenePipeline();

    const [expandedLogs, setExpandedLogs] = useState(false);
    const [expandedResults, setExpandedResults] = useState(false);

    if (authLoading) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
                <p className="text-gray-400 text-sm">Đang tải...</p>
            </div>
        );
    }

    if (!user) {
        return <AuthScreen moduleName="ScriptGen AI Agent" />;
    }

    // Copy JSON to clipboard
    const copyToClipboard = (data: unknown) => {
        navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    };

    // Download JSON
    const downloadJSON = (data: unknown, filename: string) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Get step status badge
    const getStepBadge = (step: string) => {
        if (!currentJob) return null;

        const steps = ['CHARACTER', 'SNIPPET', 'SCENE', 'DONE'];
        const currentIndex = steps.indexOf(currentJob.currentStep);
        const stepIndex = steps.indexOf(step);

        if (stepIndex < currentIndex || currentJob.currentStep === 'DONE') {
            return <Check className="w-4 h-4 text-green-400" />;
        } else if (stepIndex === currentIndex && currentJob.status === 'PROCESSING') {
            return <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />;
        } else if (currentJob.status === 'ERROR' && stepIndex === currentIndex) {
            return <XCircle className="w-4 h-4 text-red-400" />;
        }
        return <Clock className="w-4 h-4 text-gray-500" />;
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                        <Video className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-white text-xl">ScriptGen AI Agent</h1>
                        <p className="text-xs text-gray-500">V2 Pipeline · {styles.length} Styles</p>
                    </div>
                </div>
                <LanguageToggle />
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

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* LEFT: Controls */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Style Selector */}
                    <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Layers className="w-4 h-4" /> 1. Select Style
                        </h2>

                        {loadingStyles ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                            </div>
                        ) : styles.length === 0 ? (
                            <div className="text-center py-6 text-sm">
                                <p className="text-gray-400 mb-3">Chưa có styles nào.</p>
                                <a href="/admin" className="text-cyan-400 hover:text-cyan-300 underline text-xs">
                                    Vào Admin để thêm
                                </a>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {styles.map(style => (
                                    <button
                                        key={style.id}
                                        onClick={() => selectStyle(style.id)}
                                        className={`w-full text-left p-3 rounded-lg border transition-all ${selectedStyle?.id === style.id
                                            ? 'bg-cyan-900/20 border-cyan-500 ring-1 ring-cyan-500/50'
                                            : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                                            }`}
                                    >
                                        <div className="font-bold text-gray-200 text-sm">{style.label}</div>
                                        <div className="text-xs text-gray-500 mt-1 line-clamp-2">{style.description}</div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Input Area */}
                    <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <FileText className="w-4 h-4" /> 2. Input Voice Data
                        </h2>
                        <textarea
                            value={voiceInput}
                            onChange={(e) => setVoiceInput(e.target.value)}
                            placeholder='Paste JSON segments hoặc text (mỗi dòng = 1 segment)...'
                            className="w-full h-32 bg-gray-950 border border-gray-700 rounded-lg p-3 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none resize-none mb-4 font-mono leading-relaxed text-white placeholder-gray-600"
                        />

                        {/* Options */}
                        <div className="flex items-center justify-between mb-4">
                            <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={useThinkingModel}
                                    onChange={(e) => setUseThinkingModel(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-cyan-500 focus:ring-cyan-500"
                                />
                                <Zap className="w-4 h-4" />
                                Thinking Model
                            </label>

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

                        <button
                            onClick={startPipeline}
                            disabled={!voiceInput.trim() || !hasValidKey || !selectedStyle || currentJob?.status === 'PROCESSING'}
                            className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {currentJob?.status === 'PROCESSING' ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Play className="w-4 h-4 fill-current" />
                                    Start Pipeline
                                </>
                            )}
                        </button>
                    </section>

                    {/* Pipeline Progress */}
                    {currentJob && (
                        <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <RefreshCw className="w-4 h-4" /> Pipeline Status
                            </h2>

                            <div className="space-y-3">
                                {/* Steps */}
                                <div className="flex items-center gap-2">
                                    {getStepBadge('CHARACTER')}
                                    <span className={`text-sm ${currentJob.currentStep === 'CHARACTER' ? 'text-white' : 'text-gray-400'}`}>
                                        Character Bible
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {getStepBadge('SNIPPET')}
                                    <span className={`text-sm ${currentJob.currentStep === 'SNIPPET' ? 'text-white' : 'text-gray-400'}`}>
                                        Prompt Snippets
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {getStepBadge('SCENE')}
                                    <span className={`text-sm ${currentJob.currentStep === 'SCENE' ? 'text-white' : 'text-gray-400'}`}>
                                        Scene Generation
                                    </span>
                                </div>

                                {/* Overall Status */}
                                <div className={`mt-4 p-2 rounded-lg text-center text-sm font-bold ${currentJob.status === 'COMPLETED' ? 'bg-green-900/30 text-green-400' :
                                    currentJob.status === 'ERROR' ? 'bg-red-900/30 text-red-400' :
                                        'bg-cyan-900/30 text-cyan-400'
                                    }`}>
                                    {currentJob.status}
                                </div>
                            </div>
                        </section>
                    )}
                </div>

                {/* RIGHT: Results & Logs */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Results */}
                    {currentJob && currentJob.status === 'COMPLETED' && (
                        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                            <button
                                onClick={() => setExpandedResults(!expandedResults)}
                                className="w-full flex items-center justify-between p-4 hover:bg-gray-800/50 transition"
                            >
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Check className="w-5 h-5 text-green-400" />
                                    Results ({currentJob.scenes.length} Scenes)
                                </h2>
                                {expandedResults ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </button>

                            {expandedResults && (
                                <div className="p-4 border-t border-gray-800 space-y-4">
                                    {/* Export Buttons */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => copyToClipboard(currentJob.scenes)}
                                            className="flex items-center gap-2 px-3 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700"
                                        >
                                            <Copy className="w-4 h-4" />
                                            Copy Scenes
                                        </button>
                                        <button
                                            onClick={() => downloadJSON(currentJob.scenes, `scenes_${currentJob.id}.json`)}
                                            className="flex items-center gap-2 px-3 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700"
                                        >
                                            <Download className="w-4 h-4" />
                                            Download JSON
                                        </button>
                                        <button
                                            onClick={() => downloadJSON({
                                                characterBible: currentJob.characterBible,
                                                snippets: currentJob.characterSnippets,
                                                scenes: currentJob.scenes
                                            }, `full_output_${currentJob.id}.json`)}
                                            className="flex items-center gap-2 px-3 py-2 bg-cyan-600 text-white rounded-lg text-sm hover:bg-cyan-500"
                                        >
                                            <Download className="w-4 h-4" />
                                            Download All
                                        </button>
                                    </div>

                                    {/* Scene Preview */}
                                    <div className="max-h-96 overflow-y-auto space-y-2">
                                        {currentJob.scenes.slice(0, 5).map((scene, idx) => (
                                            <div key={idx} className="p-3 bg-gray-800/50 rounded-lg">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-xs font-bold text-cyan-400">SCENE {scene.scene}</span>
                                                    <span className="text-xs text-gray-500">{scene.segment_id}</span>
                                                </div>
                                                <p className="text-sm text-gray-300">{scene.description}</p>
                                            </div>
                                        ))}
                                        {currentJob.scenes.length > 5 && (
                                            <p className="text-center text-gray-500 text-sm py-2">
                                                + {currentJob.scenes.length - 5} more scenes...
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Logs */}
                    {currentJob && currentJob.logs.length > 0 && (
                        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                            <button
                                onClick={() => setExpandedLogs(!expandedLogs)}
                                className="w-full flex items-center justify-between p-4 hover:bg-gray-800/50 transition"
                            >
                                <h2 className="text-lg font-bold text-white">Logs ({currentJob.logs.length})</h2>
                                {expandedLogs ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </button>

                            {expandedLogs && (
                                <div className="p-4 border-t border-gray-800 max-h-64 overflow-y-auto font-mono text-xs">
                                    {currentJob.logs.map((log, idx) => (
                                        <div key={idx} className={`py-1 ${log.includes('✓') || log.includes('✅') ? 'text-green-400' :
                                            log.includes('❌') || log.includes('Error') ? 'text-red-400' :
                                                log.includes('⚠') ? 'text-yellow-400' :
                                                    'text-gray-400'
                                            }`}>
                                            {log}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* History */}
                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-200">Job History</h2>
                            {jobHistory.length > 0 && (
                                <button
                                    onClick={clearHistory}
                                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                                >
                                    <Trash2 className="w-3 h-3" />
                                    Clear
                                </button>
                            )}
                        </div>

                        {jobHistory.length === 0 ? (
                            <div className="border-2 border-dashed border-gray-800 rounded-xl p-8 text-center text-gray-500">
                                <Video className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                <p className="font-medium">No jobs yet</p>
                                <p className="text-xs mt-1">Start a pipeline to see results here</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {jobHistory.map(job => (
                                    <div key={job.id} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                                        <div className={`p-2 rounded-lg ${job.status === 'COMPLETED' ? 'bg-green-900/30' :
                                            job.status === 'ERROR' ? 'bg-red-900/30' :
                                                'bg-gray-800'
                                            }`}>
                                            {job.status === 'COMPLETED' ?
                                                <Check className="w-4 h-4 text-green-400" /> :
                                                <XCircle className="w-4 h-4 text-red-400" />
                                            }
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-white font-medium truncate">{job.styleId}</p>
                                            <p className="text-xs text-gray-500">
                                                {job.scenes.length} scenes • {new Date(job.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => downloadJSON(job.scenes, `scenes_${job.id}.json`)}
                                            className="p-2 text-gray-400 hover:text-white transition"
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
