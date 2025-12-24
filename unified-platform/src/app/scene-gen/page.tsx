'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Video, Play, Plus, Trash2, Layers, FileText, RefreshCw } from 'lucide-react';
import { AuthScreen } from '../story-factory/components/AuthScreen';
import { useState } from 'react';

const STYLES = [
    { id: 'tiktok_viral', label: 'TikTok Viral', description: 'Fast-paced, emotional hooks, trend-focused' },
    { id: 'youtube_story', label: 'YouTube Story', description: 'Narrative-driven, detailed, engaging' },
    { id: 'cinematic', label: 'Cinematic', description: 'Film-quality, dramatic, visual focus' },
    { id: 'documentary', label: 'Documentary', description: 'Factual, informative, educational' },
];

export default function SceneGenPage() {
    const { user, loading: authLoading, isPremium, isGold } = useAuth();
    const [selectedStyle, setSelectedStyle] = useState(STYLES[0].id);
    const [inputVoice, setInputVoice] = useState('');
    const [jobs, setJobs] = useState<Array<{ id: string; status: string; style: string }>>([]);

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

    const handleAddJob = () => {
        if (!inputVoice.trim()) return;
        const newJob = {
            id: Math.random().toString(36).substring(2, 9),
            status: 'IDLE',
            style: selectedStyle,
        };
        setJobs([...jobs, newJob]);
        setInputVoice('');
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                    <Video className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h1 className="font-bold text-white text-xl">ScriptGen AI Agent</h1>
                    <p className="text-xs text-gray-500">V2 Pipeline · Multi-Agent Architecture</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* LEFT: Controls */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Style Selector */}
                    <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Layers className="w-4 h-4" /> 1. Select Architecture Style
                        </h2>
                        <div className="space-y-3">
                            {STYLES.map(style => (
                                <button
                                    key={style.id}
                                    onClick={() => setSelectedStyle(style.id)}
                                    className={`w-full text-left p-3 rounded-lg border transition-all ${selectedStyle === style.id
                                            ? 'bg-cyan-900/20 border-cyan-500 ring-1 ring-cyan-500/50'
                                            : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                                        }`}
                                >
                                    <div className="font-bold text-gray-200 text-sm">{style.label}</div>
                                    <div className="text-xs text-gray-500 mt-1">{style.description}</div>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Input Area */}
                    <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <FileText className="w-4 h-4" /> 2. Input Voice Data
                        </h2>
                        <textarea
                            value={inputVoice}
                            onChange={(e) => setInputVoice(e.target.value)}
                            placeholder='Paste JSON segments or plain text here...'
                            className="w-full h-32 bg-gray-950 border border-gray-700 rounded-lg p-3 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none resize-none mb-4 font-mono leading-relaxed text-white placeholder-gray-600"
                        />
                        <button
                            onClick={handleAddJob}
                            disabled={!inputVoice.trim()}
                            className="w-full py-2 bg-white text-gray-900 rounded-lg font-bold text-sm hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Add Job to Queue
                        </button>
                    </section>

                    {/* Queue Control */}
                    <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                <RefreshCw className="w-4 h-4" /> Pipeline Control
                            </h2>
                            <span className="text-[10px] font-bold bg-gray-800 px-2 py-0.5 rounded-full text-gray-300 border border-gray-700">
                                {jobs.filter(j => j.status === 'IDLE').length} Pending
                            </span>
                        </div>
                        <button
                            disabled={jobs.length === 0}
                            className="w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white disabled:opacity-50"
                        >
                            <Play className="w-5 h-5 fill-current" />
                            Start Batch Processing
                        </button>
                    </section>
                </div>

                {/* RIGHT: Jobs List */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-200">Processing Dashboard</h2>
                        {jobs.length > 0 && (
                            <button
                                onClick={() => setJobs([])}
                                className="text-xs text-red-400 hover:text-red-300 transition-colors"
                            >
                                Clear History
                            </button>
                        )}
                    </div>

                    {jobs.length === 0 ? (
                        <div className="border-2 border-dashed border-gray-800 rounded-xl p-12 text-center text-gray-500 bg-gray-900/20">
                            <Video className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p className="font-medium">Job queue is empty.</p>
                            <p className="text-xs mt-1">Select a style and add data to begin generation.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {jobs.map(job => (
                                <div key={job.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center">
                                        <FileText className="w-6 h-6 text-gray-500" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 uppercase">{job.status}</span>
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-900/30 text-cyan-300 border border-cyan-900/50 uppercase font-bold">{job.style}</span>
                                        </div>
                                        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden w-full max-w-md">
                                            <div className="h-full bg-cyan-500 w-[5%]" />
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setJobs(jobs.filter(j => j.id !== job.id))}
                                        className="p-2 text-gray-600 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
