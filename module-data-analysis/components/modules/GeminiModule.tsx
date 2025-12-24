import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import Button from '../Button';
import { generateAIResponse } from '../../services/geminiService';
import { AIModelType, AppSettings } from '../../types';

interface GeminiModuleProps {
  settings: AppSettings;
  initialContext?: string;
  onAuthError: () => void;
}

const GeminiModule: React.FC<GeminiModuleProps> = ({ settings, initialContext, onAuthError }) => {
  const [prompt, setPrompt] = useState('');
  const [contextData, setContextData] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial context if provided from other tabs
  useEffect(() => {
    if (initialContext) {
      setContextData(initialContext);
    }
  }, [initialContext]);

  const handleGenerate = async () => {
    const finalInput = contextData 
      ? `Data:\n${contextData}\n\nTask:\n${prompt}` 
      : prompt;

    if (!finalInput.trim()) return;
    
    // Auth check logic is now mostly handled by global modal, but safe guard here
    if (!settings.apiKey) {
      onAuthError();
      return;
    }
    
    setError(null);
    setLoading(true);
    setResponse('');

    try {
      const modelType = isThinking ? AIModelType.THINKING : AIModelType.FAST;
      const result = await generateAIResponse(settings.apiKey, finalInput, modelType);
      setResponse(result);
    } catch (err: any) {
      if (err.message === "AUTH_INVALID" || err.message === "AUTH_REQUIRED") {
        setError("API Key không hợp lệ hoặc đã hết hạn. Vui lòng cập nhật lại.");
        onAuthError(); // Trigger global modal
      } else {
        setError(err.message || "Lỗi không xác định khi gọi Gemini API");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
      <div className="lg:col-span-5 flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-t-xl">
          <h2 className="font-bold flex items-center">
             <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
             Gemini AI (Model: 2.5 Flash)
          </h2>
          <p className="text-xs text-indigo-100 opacity-80 mt-1">Sử dụng API Key cá nhân của bạn.</p>
        </div>
        
        <div className="p-4 flex-1 flex flex-col space-y-4 overflow-y-auto">
           {/* Context Area */}
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Dữ liệu đầu vào (Context)</label>
             <textarea
               className="w-full p-2 border border-gray-300 rounded-lg text-xs font-mono h-32 resize-y focus:ring-1 focus:ring-indigo-500"
               placeholder="Dán dữ liệu cần xử lý vào đây (hoặc gửi từ tab Trích xuất)..."
               value={contextData}
               onChange={(e) => setContextData(e.target.value)}
             />
           </div>

           {/* Prompt Area */}
           <div className="flex-1 flex flex-col">
             <label className="block text-sm font-medium text-gray-700 mb-1">Yêu cầu (Prompt)</label>
             <textarea
               className="flex-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm font-medium resize-none"
               placeholder="Ví dụ: Dịch đoạn văn bản trên sang tiếng Việt phong cách kiếm hiệp..."
               value={prompt}
               onChange={(e) => setPrompt(e.target.value)}
             />
           </div>
           
           <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
             <label className="flex items-center cursor-pointer">
               <input 
                 type="checkbox" 
                 checked={isThinking} 
                 onChange={(e) => setIsThinking(e.target.checked)}
                 className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
               />
               <span className="ml-2 text-sm font-medium text-gray-700">Thinking Mode (3.0 Pro)</span>
             </label>
             <Button variant="ai" onClick={handleGenerate} isLoading={loading} disabled={!prompt.trim() && !contextData.trim()}>
               Gửi tới Gemini
             </Button>
           </div>
           
           {error && <div className="text-red-600 text-xs p-2 bg-red-50 rounded border border-red-100">{error}</div>}
        </div>
      </div>

      <div className="lg:col-span-7 flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
           <h3 className="font-semibold text-gray-700">Phản hồi từ AI</h3>
           <button 
             onClick={() => navigator.clipboard.writeText(response)} 
             disabled={!response}
             className="text-xs font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
           >
             Sao chép
           </button>
        </div>
        <div className="p-6 flex-1 overflow-y-auto prose prose-sm max-w-none">
           {response ? <ReactMarkdown>{response}</ReactMarkdown> : <div className="text-gray-400 italic text-center mt-10">Kết quả sẽ hiển thị tại đây...</div>}
        </div>
      </div>
    </div>
  );
};

export default GeminiModule;