
import React, { useState } from 'react';
import { GeneratedStory, StyleAgent } from '../types';
import { Download, RefreshCw, Image as ImageIcon, Loader2, ArrowLeft, Share2, Copy, Lock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { generateCoverImage } from '../services/gemini';

interface Props {
  story: GeneratedStory;
  agent: StyleAgent;
  onReset: () => void;
  onUpdateStory: (updatedStory: GeneratedStory) => void;
  batchStatus: string | null;
  onBack: () => void;
  apiKey: string;
}

const Step5Reader: React.FC<Props> = ({ story, agent, onReset, onUpdateStory, batchStatus, onBack, apiKey }) => {
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  const handleDownloadTXT = () => {
    const textContent = `${story.title}\n\nSUMMARY: ${story.summary}\n\n${story.content}`;
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${story.title.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadMD = () => {
    const blob = new Blob([story.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${story.title.replace(/\s+/g, '_')}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(story.content);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleGenerateCover = async () => {
    if (!apiKey) {
      alert("Vui lòng nhập API Key trước khi tạo ảnh.");
      return;
    }
    setIsGeneratingImage(true);
    try {
      const imageData = await generateCoverImage(apiKey, story, agent);
      onUpdateStory({ ...story, coverImage: imageData });
    } catch (e: any) {
      console.error(e);
      alert("Không thể tạo ảnh bìa lúc này. Lỗi: " + (e.message || "Unknown error"));
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in pb-20 relative">
      {!batchStatus && (
          <button 
            onClick={onBack}
            className="absolute -top-12 left-0 text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" /> Quay lại
          </button>
      )}
      
      {/* Batch Processing Status Banner */}
      {batchStatus && (
        <div className="sticky top-20 z-30 mb-6 bg-indigo-900/90 backdrop-blur border border-indigo-500/50 p-4 rounded-xl flex items-center justify-between shadow-lg animate-pulse">
           <div className="flex items-center gap-3">
             <Loader2 className="w-5 h-5 text-indigo-300 animate-spin" />
             <span className="text-indigo-100 font-medium">{batchStatus}</span>
           </div>
           <div className="text-xs text-indigo-300 bg-indigo-950/50 px-2 py-1 rounded border border-indigo-800">
             Auto-Process Mode
           </div>
        </div>
      )}
      
      {/* Action Toolbar */}
      <div className="flex flex-wrap gap-4 justify-between items-center mb-6 bg-gray-900/80 backdrop-blur-md p-4 rounded-xl border border-gray-800 shadow-xl sticky top-4 z-20">
        <button 
          onClick={onReset} 
          disabled={!!batchStatus}
          className={`text-gray-400 hover:text-white flex items-center gap-2 text-sm font-medium ${!!batchStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <RefreshCw className="w-4 h-4" /> Truyện Mới
        </button>
        
        <div className="flex gap-2">
          {!story.coverImage && (
            <button 
              disabled={true}
              className="flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-medium text-gray-500 cursor-not-allowed opacity-60"
              title="Tính năng đang tạm khóa"
            >
              <Lock className="w-4 h-4" />
              Vẽ Minh Họa (Tạm khóa)
            </button>
          )}

          <div className="w-px h-8 bg-gray-700 mx-2"></div>

          <button onClick={handleCopy} className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium text-white transition-colors flex items-center gap-2" title="Copy Content">
            {copySuccess ? <span className="text-green-400">Copied!</span> : <Copy className="w-4 h-4" />}
          </button>
          <button onClick={handleDownloadMD} className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium text-white transition-colors">
            MD
          </button>
          <button onClick={handleDownloadTXT} className="flex items-center gap-2 px-3 py-2 bg-primary-600 hover:bg-primary-500 rounded-lg text-sm font-medium text-white transition-colors">
            <Download className="w-4 h-4" /> TXT
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white text-gray-900 rounded-lg shadow-2xl overflow-hidden min-h-[80vh]">
        
        {/* Cover Image Header */}
        {story.coverImage && (
          <div className="w-full h-64 md:h-[400px] relative group">
            <img 
              src={story.coverImage} 
              alt={story.title} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-center pb-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
               <button 
                 onClick={() => {
                   const link = document.createElement('a');
                   link.href = story.coverImage!;
                   link.download = `Cover_${story.title}.png`;
                   link.click();
                 }}
                 className="bg-white/20 backdrop-blur text-white border border-white/50 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-white hover:text-black transition-colors"
               >
                 <Download className="w-4 h-4" /> Tải Ảnh Bìa
               </button>
            </div>
          </div>
        )}

        <div className="p-8 md:p-16">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12 border-b-2 border-gray-100 pb-8">
              <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4 text-gray-900 leading-tight">{story.title}</h1>
              <p className="text-gray-500 italic font-serif text-lg leading-relaxed">{story.summary}</p>
            </div>
            
            <div className="prose prose-lg prose-slate font-serif first-letter:text-7xl first-letter:font-bold first-letter:text-gray-900 first-letter:mr-3 first-letter:float-left">
               <ReactMarkdown>{story.content}</ReactMarkdown>
            </div>

            <div className="mt-20 pt-8 border-t border-gray-100 text-center flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold font-sans">AI</div>
              <div className="text-gray-400 text-sm font-sans">
                Được viết bởi Agent <strong>{agent.name}</strong> • {story.wordCount} từ
                <br/>
                {new Date(story.createdAt).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Step5Reader;
