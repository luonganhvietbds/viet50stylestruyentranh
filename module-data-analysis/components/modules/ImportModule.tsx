import React, { useState } from 'react';
import Button from '../Button';
import { parseSceneJson } from '../../services/parserService';
import { ParsedResult } from '../../types';
import { usePersistentState } from '../../utils/helpers';

interface ImportModuleProps {
  onDataParsed: (result: ParsedResult) => void;
  existingDataCount: number;
}

const ImportModule: React.FC<ImportModuleProps> = ({ onDataParsed, existingDataCount }) => {
  // Persistence for draft input
  const [input, setInput] = usePersistentState<string>('import_draft_input', '');
  const [error, setError] = useState<string | null>(null);

  const handleParse = () => {
    setError(null);
    if (!input.trim()) return;

    try {
      const result = parseSceneJson(input);
      onDataParsed(result);
      setInput(''); // Clear on success
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
      <div className="lg:col-span-8 flex flex-col h-full">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[600px]">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="font-semibold text-gray-700">Nhập dữ liệu JSON thô</h2>
            <button onClick={() => setInput('')} className="text-xs text-red-600 hover:text-red-800 font-medium">Xóa trắng</button>
          </div>
          <div className="p-4 flex-1">
            <textarea
              className="w-full h-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs font-mono resize-none"
              placeholder='Dán các mảng JSON của bạn vào đây. 
Ví dụ: 
[{"scene": 1, "text": "Xin chào"}]
[{"scene": 2, "text": "Tạm biệt"}]'
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </div>
          <div className="p-4 bg-gray-50 border-t border-gray-200">
             <Button onClick={handleParse} className="w-full">
               Phân tích & Nhập liệu
             </Button>
             {error && (
                <div className="mt-2 p-2 bg-red-100 text-red-700 text-xs rounded border border-red-200">
                  {error}
                </div>
              )}
          </div>
        </div>
      </div>

      <div className="lg:col-span-4 space-y-6">
        <div className="bg-blue-50 rounded-xl shadow-sm border border-blue-100 p-6">
           <h3 className="font-bold text-blue-800 mb-2">Trạng thái hiện tại</h3>
           <div className="flex items-center space-x-2">
             <div className={`w-3 h-3 rounded-full ${existingDataCount > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
             <span className="text-sm text-gray-700">Đang lưu giữ <b>{existingDataCount}</b> đối tượng</span>
           </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-bold text-gray-800 mb-2">Hướng dẫn</h3>
          <ul className="text-sm text-gray-600 space-y-2 list-disc pl-4">
            <li>Dán một hoặc nhiều mảng JSON liên tiếp.</li>
            <li>Hệ thống tự động phát hiện và gộp (Merge Mode).</li>
            <li>Chỉ phân tích cấu trúc ở cấp độ ngoài cùng.</li>
            <li>Giữ nguyên định dạng chuỗi gốc (không format lại).</li>
            <li>Dữ liệu nháp được tự động lưu.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ImportModule;