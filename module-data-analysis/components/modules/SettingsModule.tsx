import React, { useState } from 'react';
import Button from '../Button';
import { AppSettings } from '../../types';

interface SettingsModuleProps {
  settings: AppSettings;
  setSettings: (s: AppSettings) => void;
  onClearProject: () => void;
}

const SettingsModule: React.FC<SettingsModuleProps> = ({ settings, setSettings, onClearProject }) => {
  const [showKey, setShowKey] = useState(false);

  const handleSeparatorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    let actualVal = "\n\n";
    if (val === '\\n') actualVal = "\n";
    if (val === '\\n\\n') actualVal = "\n\n";
    if (val === '---') actualVal = "\n---\n";
    
    setSettings({ ...settings, joinSeparator: actualVal });
  };

  const getSelectValue = () => {
    if (settings.joinSeparator === "\n") return "\\n";
    if (settings.joinSeparator === "\n\n") return "\\n\\n";
    if (settings.joinSeparator === "\n---\n") return "---";
    return "\\n\\n"; 
  };

  const handleDeleteKey = () => {
    if(window.confirm("Bạn có chắc chắn muốn xóa API Key? Bạn sẽ cần nhập lại key mới để tiếp tục sử dụng.")) {
        setSettings({ ...settings, apiKey: '' });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Cấu hình Hệ thống</h2>
        
        <div className="space-y-6">
          {/* API Key */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold text-gray-800">Google Gemini API Key (BYOK)</label>
                {settings.apiKey && (
                    <button onClick={handleDeleteKey} className="text-xs text-red-600 hover:text-red-800 hover:underline">
                        Xóa Key (Đăng xuất)
                    </button>
                )}
            </div>
            <div className="flex gap-2">
              <div className="relative flex-grow">
                 <input 
                  type={showKey ? "text" : "password"}
                  className="w-full p-2 border border-blue-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 font-mono text-sm pr-10"
                  placeholder="AIzaSy..."
                  value={settings.apiKey}
                  onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                />
                <button
                    onClick={() => setShowKey(!showKey)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
                >
                    {showKey ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                </button>
              </div>
            </div>
            <p className="mt-2 text-xs text-blue-800">
               Ứng dụng sử dụng key cá nhân của bạn. Key được lưu an toàn trong localStorage của trình duyệt và không bao giờ được gửi đến server trung gian.
            </p>
          </div>

          {/* Separator */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ký tự nối (Join Separator)</label>
            <select 
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              value={getSelectValue()}
              onChange={handleSeparatorChange}
            >
              <option value="\n">Xuống dòng đơn (\n)</option>
              <option value="\n\n">Xuống dòng đôi (\n\n) (Mặc định)</option>
              <option value="---">Dấu gạch ngang (---)</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">Ký tự dùng để ngăn cách khi gộp nhiều dòng dữ liệu lại với nhau.</p>
          </div>
        </div>
      </div>

      <div className="bg-red-50 rounded-xl shadow-sm border border-red-200 p-6">
        <h2 className="text-lg font-bold text-red-800 mb-4 border-b border-red-200 pb-2">Vùng Nguy Hiểm</h2>
        <div className="flex items-center justify-between">
          <div className="text-sm text-red-700">
            <p className="font-medium">Làm mới Dữ liệu (Batch Reset)</p>
            <p>Xóa toàn bộ dữ liệu JSON và bản nháp để nhập đợt mới. <br/><b>Giữ lại:</b> API Key, Quy tắc thay thế.</p>
          </div>
          <Button variant="danger" size="sm" onClick={() => onClearProject()}>
            Xóa Dữ liệu (Giữ Key & Quy tắc)
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModule;