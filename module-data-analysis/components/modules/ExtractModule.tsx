import React, { useMemo } from 'react';
import Button from '../Button';
import { Scene, AppSettings } from '../../types';
import { exportToCsv, saveTextFile, usePersistentState } from '../../utils/helpers';

interface ExtractModuleProps {
  data: Scene[];
  availableKeys: string[];
  settings: AppSettings;
  onSendToGemini: (text: string) => void;
}

const ExtractModule: React.FC<ExtractModuleProps> = ({ data, availableKeys, settings, onSendToGemini }) => {
  // Store selected keys as Array in localStorage, convert to Set for logic
  const [selectedKeysList, setSelectedKeysList] = usePersistentState<string[]>('extract_selected_keys', []);
  const [viewMode, setViewMode] = usePersistentState<'table' | 'blocks'>('extract_view_mode', 'table');

  const selectedKeys = useMemo(() => new Set<string>(selectedKeysList), [selectedKeysList]);

  const toggleKey = (key: string) => {
    const newSet = new Set<string>(selectedKeys);
    if (newSet.has(key)) newSet.delete(key);
    else newSet.add(key);
    setSelectedKeysList(Array.from(newSet));
  };

  // Helper to get joined data for a specific key (column) only
  const getColumnData = (key: string) => {
    return data
      .map((item: Scene) => item[key])
      .filter((val: any) => val !== undefined && val !== null)
      .join(settings.joinSeparator);
  };

  // Helper to get joined data for ALL selected keys (Interleaved) - Used for Gemini/Global Copy
  const getJoinedMergedData = () => {
    if (!data.length || selectedKeys.size === 0) return '';
    const keys = Array.from(selectedKeys);
    return data.map((item: Scene) => {
      const rowText = keys.map((k: string) => item[k]).filter((val: any) => val !== undefined && val !== null).join(' '); 
      return rowText;
    }).join(settings.joinSeparator);
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Đã sao chép!");
  };

  const handleCopyJoined = () => {
    const text = getJoinedMergedData();
    navigator.clipboard.writeText(text);
    alert("Đã sao chép nội dung gộp toàn bộ!");
  };

  const handleExportCsv = () => {
    exportToCsv(data, Array.from(selectedKeys));
  };

  const handleAiAnalyze = () => {
    const text = getJoinedMergedData();
    onSendToGemini(text);
  };

  if (data.length === 0) {
    return <div className="text-center p-12 text-gray-500">Chưa có dữ liệu. Vui lòng quay lại tab Nhập liệu.</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
      {/* Sidebar: Key Selection */}
      <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col max-h-[calc(100vh-200px)]">
        <div className="p-4 border-b bg-gray-50 font-semibold text-gray-700">Chọn Trường Dữ Liệu</div>
        <div className="p-2 overflow-y-auto flex-1">
          {availableKeys.map(key => (
            <label key={key} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
              <input 
                type="checkbox" 
                checked={selectedKeys.has(key)}
                onChange={() => toggleKey(key)}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <span className="text-sm truncate" title={key}>{key}</span>
            </label>
          ))}
        </div>
        <div className="p-4 border-t bg-gray-50 space-y-2">
           <div className="text-xs text-gray-500 mb-2 font-medium">Công cụ chung:</div>
          <Button size="sm" className="w-full" onClick={handleCopyJoined} disabled={selectedKeys.size === 0}>
            Sao chép Tất cả (Gộp)
          </Button>
          <Button size="sm" variant="ai" className="w-full" onClick={handleAiAnalyze} disabled={selectedKeys.size === 0}>
            ✨ Gửi Gộp qua Gemini
          </Button>
          <Button size="sm" variant="secondary" className="w-full" onClick={handleExportCsv} disabled={selectedKeys.size === 0}>
            Xuất file CSV
          </Button>
        </div>
      </div>

      {/* Main View */}
      <div className="lg:col-span-9 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col max-h-[calc(100vh-200px)]">
         {/* View Switcher Header */}
         <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
            <div className="flex space-x-2 bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
                <button
                    onClick={() => setViewMode('table')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        viewMode === 'table' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                    Xem dạng Bảng
                </button>
                <button
                    onClick={() => setViewMode('blocks')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        viewMode === 'blocks' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                    Xem dạng Khối Cột
                </button>
            </div>
            <span className="text-xs text-gray-400 italic">
                {viewMode === 'table' ? 'Hiển thị dữ liệu chi tiết theo hàng' : 'Hiển thị dữ liệu đã gộp theo từng cột'}
            </span>
         </div>

         {/* Content */}
         <div className="overflow-auto flex-1 bg-gray-100 p-4">
           {selectedKeys.size === 0 && (
               <div className="flex h-full items-center justify-center text-gray-400">
                   Vui lòng chọn ít nhất một trường dữ liệu ở menu bên trái.
               </div>
           )}

           {viewMode === 'table' && selectedKeys.size > 0 && (
               <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                   <table className="min-w-full divide-y divide-gray-200">
                     <thead className="bg-gray-50">
                       <tr>
                         <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">#</th>
                         {Array.from(selectedKeys).map((key: string) => (
                           <th key={key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                             {key}
                           </th>
                         ))}
                       </tr>
                     </thead>
                     <tbody className="bg-white divide-y divide-gray-200">
                       {data.map((row: Scene, idx: number) => (
                         <tr key={idx} className="hover:bg-gray-50">
                           <td className="px-4 py-2 text-xs text-gray-500">{idx + 1}</td>
                           {Array.from(selectedKeys).map((key: string) => (
                             <td 
                                key={key} 
                                className="px-4 py-2 text-sm text-gray-900 whitespace-pre-wrap min-w-[200px] cursor-pointer hover:bg-blue-50 transition-colors"
                                onClick={() => copyText(String(row[key]))}
                                title="Click để sao chép ô này"
                             >
                               {typeof row[key] === 'object' ? JSON.stringify(row[key]) : String(row[key])}
                             </td>
                           ))}
                         </tr>
                       ))}
                     </tbody>
                   </table>
               </div>
           )}

           {viewMode === 'blocks' && selectedKeys.size > 0 && (
               <div className="flex flex-row space-x-4 h-full overflow-x-auto pb-2">
                   {Array.from(selectedKeys).map((key: string) => {
                       const content = getColumnData(key);
                       return (
                           <div key={key} className="flex-shrink-0 w-[400px] flex flex-col bg-white rounded-lg shadow border border-gray-200 h-full">
                               <div className="p-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                                   <div className="font-bold text-sm text-gray-700 truncate" title={key}>{key}</div>
                                   <div className="flex space-x-1">
                                       <button 
                                            onClick={() => copyText(content)}
                                            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                                            title="Sao chép"
                                       >
                                           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                       </button>
                                       <button 
                                            onClick={() => saveTextFile(content, `${key}.txt`)}
                                            className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded"
                                            title="Tải về .txt"
                                       >
                                           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                       </button>
                                   </div>
                               </div>
                               <textarea
                                   readOnly
                                   value={content}
                                   className="flex-1 p-3 text-xs font-mono resize-none focus:outline-none w-full bg-white text-gray-800"
                               />
                           </div>
                       );
                   })}
               </div>
           )}
         </div>
      </div>
    </div>
  );
};

export default ExtractModule;