import React, { useMemo } from 'react';
import Button from '../Button';
import { Scene, AppSettings } from '../../types';
import { getDeepKeys, getDeepValue, saveTextFile, usePersistentState } from '../../utils/helpers';

interface TvcExtractModuleProps {
  data: Scene[];
  settings: AppSettings;
}

const TvcExtractModule: React.FC<TvcExtractModuleProps> = ({ data, settings }) => {
  const [selectedKey, setSelectedKey] = usePersistentState<string>('tvc_selected_key', '');

  // 1. Get all available deep keys
  const allKeys = useMemo(() => getDeepKeys(data), [data]);

  // 2. Group keys by their top-level parent (e.g., 'layers', 'master_prompts')
  const groupedKeys = useMemo<{ [key: string]: string[] }>(() => {
    const groups: { [key: string]: string[] } = {};
    allKeys.forEach(key => {
      const parts = key.split('.');
      const groupName = parts.length > 1 ? parts[0] : 'Thông tin chung';
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(key);
    });
    return groups;
  }, [allKeys]);

  // 3. Extract content based on selected key
  const extractedContent = useMemo(() => {
    if (!selectedKey || !data.length) return '';
    return data.map(item => {
      const val = getDeepValue(item, selectedKey);
      if (val === undefined || val === null) return '';
      return String(val);
    })
    .filter(val => val !== '')
    .join(settings.joinSeparator);
  }, [data, selectedKey, settings.joinSeparator]);

  const handleCopy = () => {
    if (!extractedContent) return;
    navigator.clipboard.writeText(extractedContent);
    alert('Đã sao chép nội dung!');
  };

  const handleDownload = () => {
    if (!extractedContent) return;
    saveTextFile(extractedContent, `${selectedKey}.txt`);
  };

  if (data.length === 0) {
    return <div className="text-center p-12 text-gray-500">Chưa có dữ liệu. Vui lòng quay lại tab Nhập liệu.</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
      {/* Left Column: Deep Field Selector */}
      <div className="lg:col-span-4 flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
           <h2 className="font-semibold text-gray-700">Chọn trường dữ liệu (Deep Select)</h2>
           <p className="text-xs text-gray-500 mt-1">Chọn một trường cụ thể từ cấu trúc phân cấp.</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          {Object.entries(groupedKeys).map(([group, keys]) => (
            <div key={group} className="border-b border-gray-100 last:border-0 pb-2">
              <h3 className="px-2 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{group}</h3>
              <div className="space-y-1">
                {(keys as string[]).map(key => (
                  <button
                    key={key}
                    onClick={() => setSelectedKey(key)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between group ${
                      selectedKey === key 
                        ? 'bg-blue-50 text-blue-700 font-medium' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="truncate" title={key}>
                      {key.split('.').length > 1 ? key.split('.').slice(1).join('.') : key}
                    </span>
                    {selectedKey === key && (
                      <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: Result Content */}
      <div className="lg:col-span-8 flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <h2 className="font-semibold text-gray-700">
             Kết quả trích xuất 
             {selectedKey && <span className="ml-2 font-mono text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{selectedKey}</span>}
          </h2>
          <div className="flex space-x-2">
             <Button size="sm" variant="secondary" onClick={handleDownload} disabled={!extractedContent}>
               Tải .txt
             </Button>
             <Button size="sm" onClick={handleCopy} disabled={!extractedContent}>
               Sao chép
             </Button>
          </div>
        </div>
        <div className="flex-1 p-0 bg-gray-50 relative">
          <textarea
            readOnly
            className="w-full h-full p-4 bg-gray-50 text-gray-800 text-sm font-mono resize-none focus:outline-none"
            value={extractedContent}
            placeholder={selectedKey ? "Không có dữ liệu cho trường này." : "Vui lòng chọn một trường bên trái để xem dữ liệu."}
          />
        </div>
        <div className="p-2 border-t bg-white text-xs text-gray-400 text-center">
           Dữ liệu được nối bằng ký tự phân cách trong phần Cài đặt.
        </div>
      </div>
    </div>
  );
};

export default TvcExtractModule;