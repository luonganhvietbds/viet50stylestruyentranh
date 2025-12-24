
import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, ExternalLink, ShieldCheck, Check, List, AlertTriangle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onSave: (key: string) => void;
  onClose: () => void;
  hasKey: boolean;
}

const ApiKeyModal: React.FC<Props> = ({ isOpen, onSave, onClose, hasKey }) => {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [error, setError] = useState('');
  const [keyCount, setKeyCount] = useState(0);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setApiKeyInput(''); 
      setError('');
      setKeyCount(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const count = apiKeyInput.split('\n').filter(line => line.trim().length > 20).length;
    setKeyCount(count);
  }, [apiKeyInput]);

  if (!isOpen) return null;

  const handleSave = () => {
    const trimmedInput = apiKeyInput.trim();
    if (!trimmedInput) {
      setError('Vui lòng nhập ít nhất một API Key.');
      return;
    }

    // Validate: Check if at least one line looks like a key
    const validLines = trimmedInput.split('\n').filter(line => line.trim().startsWith('AIza'));
    
    if (validLines.length === 0 && trimmedInput.length < 30) {
       setError('Không tìm thấy API Key hợp lệ (thường bắt đầu bằng "AIza...").');
       return;
    }

    onSave(trimmedInput);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-lg w-full shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Decorative Header */}
        <div className="h-1.5 w-full bg-gradient-to-r from-primary-500 via-purple-500 to-indigo-600 absolute top-0"></div>

        <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
          <div className="text-center">
            <div className="w-14 h-14 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-5 border border-gray-700 shadow-inner">
              <List className="w-7 h-7 text-primary-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Quản Lý Multi-Key (Quota Fix)</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Để tránh lỗi <strong className="text-red-400">429 Resource Exhausted</strong> (Hết Quota), bạn hãy nhập nhiều API Key. 
              Hệ thống sẽ <strong className="text-white">tự động luân chuyển</strong> sang key khác nếu key hiện tại bị lỗi.
            </p>
          </div>

          <div className="space-y-4 bg-gray-950/50 p-4 rounded-xl border border-gray-800">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Danh sách API Key (Mỗi key 1 dòng)
                </label>
                {keyCount > 0 && (
                  <span className="text-xs font-bold text-green-400 bg-green-900/20 px-2 py-0.5 rounded border border-green-900">
                    Đã nhận diện: {keyCount} Key
                  </span>
                )}
              </div>
              
              <div className="relative group">
                <textarea
                  value={apiKeyInput}
                  onChange={(e) => {
                    setApiKeyInput(e.target.value);
                    setError('');
                  }}
                  placeholder={`AIzaSy...Key1\nAIzaSy...Key2\nAIzaSy...Key3`}
                  className={`w-full bg-gray-900 border border-gray-700 group-hover:border-gray-600 rounded-lg py-3 pl-4 pr-12 text-white placeholder-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all font-mono text-xs leading-loose min-h-[150px] resize-none ${!isVisible ? 'text-security-disc' : ''}`}
                  autoFocus
                  spellCheck={false}
                />
                <button
                  onClick={() => setIsVisible(!isVisible)}
                  className="absolute right-3 top-3 text-gray-500 hover:text-white p-1 rounded-md transition-colors bg-gray-800 border border-gray-700"
                  type="button"
                  title="Hiện/Ẩn Key"
                >
                  {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              
              {error && (
                <div className="mt-2 text-red-400 text-xs flex items-center gap-1 animate-pulse">
                   <AlertTriangle className="w-3 h-3" /> {error}
                </div>
              )}
               <p className="mt-2 text-[10px] text-gray-500">
                * Mẹo: Tạo nhiều project trên Google AI Studio để lấy nhiều key miễn phí.
              </p>
            </div>

            <div className="text-center pt-2 border-t border-gray-800">
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-primary-400 hover:text-primary-300 text-xs font-medium transition-colors border-b border-primary-500/30 hover:border-primary-400 pb-0.5"
              >
                <ExternalLink className="w-3 h-3" /> Lấy thêm Key tại Google AI Studio
              </a>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            {hasKey && (
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium transition-colors"
              >
                Đóng
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={!apiKeyInput}
              className={`
                flex-1 py-3 px-4 rounded-lg font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-900/20
                ${!apiKeyInput 
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white hover:scale-[1.02]'}
                ${!hasKey ? 'w-full' : ''}
              `}
            >
              {hasKey ? 'Cập Nhật List Key' : 'Lưu & Bắt Đầu'} <Check className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;
