import React, { useState, useEffect } from 'react';
import Button from './Button';

interface ApiKeyModalProps {
  isOpen: boolean;
  onSave: (key: string) => void;
  initialValue?: string;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onSave, initialValue = '' }) => {
  const [key, setKey] = useState(initialValue);
  const [isVisible, setIsVisible] = useState(false);
  const [error, setError] = useState('');

  // Sync state if initialValue changes (e.g. from settings)
  useEffect(() => {
    setKey(initialValue);
  }, [initialValue]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) {
      setError('Vui lòng nhập API Key hợp lệ.');
      return;
    }
    setError('');
    onSave(key.trim());
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900 bg-opacity-90 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 transform transition-all scale-100">
        <div className="text-center mb-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 19l-1 1-1-1-1 1-1-1H4a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2zm-10 9a1 1 0 100-2 1 1 0 000 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Yêu cầu API Key</h2>
          <p className="text-sm text-gray-500 mt-2">
            Ứng dụng này hoạt động theo cơ chế BYOK (Bring Your Own Key). 
            Key của bạn chỉ được lưu trên trình duyệt này và gửi trực tiếp đến Google.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">
              Google Gemini API Key
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <input
                type={isVisible ? "text" : "password"}
                id="apiKey"
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pr-10 sm:text-sm border-gray-300 rounded-md p-3 border"
                placeholder="AIzaSy..."
                value={key}
                onChange={(e) => {
                    setKey(e.target.value);
                    setError('');
                }}
                autoFocus
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setIsVisible(!isVisible)}
              >
                {isVisible ? (
                  <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>

          <div className="flex flex-col gap-3">
             <Button type="submit" className="w-full justify-center" size="lg">
                Lưu và Bắt đầu
             </Button>
             <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noreferrer"
                className="text-xs text-center text-blue-600 hover:text-blue-800 hover:underline"
             >
                Chưa có key? Lấy key miễn phí tại Google AI Studio
             </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApiKeyModal;