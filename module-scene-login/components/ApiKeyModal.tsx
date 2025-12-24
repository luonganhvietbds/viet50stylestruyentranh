
import React, { useState, useEffect } from 'react';
import { Key, ExternalLink, ShieldCheck, AlertCircle, Layers } from 'lucide-react';
import { useAppStore } from '../store';

export const ApiKeyModal = () => {
  const { apiKeys, setApiKeys, isApiKeyModalOpen, setApiKeyModalOpen } = useAppStore();
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');

  // Sync local state when modal opens or store changes
  useEffect(() => {
    if (isApiKeyModalOpen) {
      setInputValue(apiKeys.join('\n'));
    }
  }, [isApiKeyModalOpen, apiKeys]);

  // Determine if we should show the modal (either explicitly open OR keys are missing)
  const shouldShow = isApiKeyModalOpen || apiKeys.length === 0;

  if (!shouldShow) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Split by newlines, trim whitespace, remove empty lines
    const rawKeys = inputValue.split('\n').map(k => k.trim()).filter(k => k.length > 0);
    
    if (rawKeys.length === 0) {
      setError('Vui lòng nhập ít nhất một API Key.');
      return;
    }

    // Basic validation
    const invalidKeys = rawKeys.filter(k => !k.startsWith('AIza'));
    if (invalidKeys.length > 0) {
      setError(`Một số key không đúng định dạng (phải bắt đầu bằng "AIza").`);
      return;
    }

    setApiKeys(rawKeys);
    setError('');
  };

  const handleClose = () => {
    if (apiKeys.length > 0) {
      setApiKeyModalOpen(false);
    } else {
        setError("Bạn cần nhập API Key để tiếp tục.");
    }
  };

  const count = inputValue.split('\n').filter(k => k.trim().length > 0).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-8 ring-1 ring-white/10">
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/30">
            <Key className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">Cấu hình API Key</h2>
          <p className="text-sm text-slate-400">Hỗ trợ nhiều Key để chạy luân phiên</p>
        </div>

        <p className="text-sm text-slate-400 mb-6 text-center leading-relaxed bg-slate-950/50 p-4 rounded-lg border border-slate-800">
          Nhập mỗi API Key trên một dòng. <br/>
          Nếu một Key bị hết hạn ngạch (Quota), hệ thống sẽ tự động chuyển sang Key tiếp theo.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-300 uppercase ml-1">Danh sách Gemini Keys</label>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
                    {count} keys detected
                </span>
            </div>
            
            <textarea
                value={inputValue}
                onChange={(e) => {
                    setInputValue(e.target.value);
                    setError('');
                }}
                placeholder={`AIzaSy...\nAIzaSy...\nAIzaSy...`}
                className="w-full h-32 bg-slate-950 border border-slate-700 rounded-xl p-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono transition-all resize-none leading-relaxed whitespace-pre"
              />
            
            {error && (
                <div className="flex items-center gap-2 text-xs text-red-400 mt-2 bg-red-900/10 p-2 rounded border border-red-900/20">
                    <AlertCircle className="w-3 h-3" /> {error}
                </div>
            )}
          </div>

          <div className="flex justify-between items-center text-xs text-slate-500 px-1">
             <div className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-green-500" />
                <span>Lưu trữ cục bộ an toàn</span>
             </div>
             <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 hover:underline"
             >
                Lấy API Key <ExternalLink className="w-3 h-3" />
             </a>
          </div>

          <div className="flex gap-3 pt-2">
            {apiKeys.length > 0 && (
                <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors"
                >
                    Đóng
                </button>
            )}
            <button
              type="submit"
              className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
            >
              <Layers className="w-4 h-4" />
              {apiKeys.length > 0 ? 'Cập nhật Danh sách' : 'Lưu & Bắt đầu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
