
import React, { useMemo } from 'react';
import Button from '../Button';
import { usePersistentState, saveTextFile } from '../../utils/helpers';

const PromptFormatModule: React.FC = () => {
  const [input, setInput] = usePersistentState<string>('prompt_format_input', '');
  const [addEmptyLine, setAddEmptyLine] = usePersistentState<boolean>('prompt_format_empty_line', false);
  const [extractionMode, setExtractionMode] = usePersistentState<'quotes' | 'lines'>('prompt_format_mode', 'quotes');

  // --- Processing Logic ---
  const processedPrompts = useMemo(() => {
    if (!input.trim()) return [];

    const results: string[] = [];

    if (extractionMode === 'quotes') {
      // MODE A: Extract content inside quotes "..."
      // Regex explanation:
      // "          : Starts with quote
      // (          : Start capture group
      //   (?:      : Non-capturing group
      //     [^"]   : Any char EXCEPT quote
      //     |      : OR
      //     ""     : Two quotes (CSV escape)
      //   )*       : Repeat 0 or more times
      // )          : End capture group
      // "          : Ends with quote
      const regex = /"((?:[^"]|"")*)"/g;

      let match;
      while ((match = regex.exec(input)) !== null) {
          let text = match[1];
          if (!text || !text.trim()) continue;

          // 1. Handle CSV escape quotes ("" -> ")
          text = text.replace(/""/g, '"');
          // 2. Replace newlines with space
          text = text.replace(/[\r\n]+/g, ' ');
          // 3. Normalize whitespace
          text = text.replace(/\s+/g, ' ');

          const finalText = text.trim();
          if (finalText.length > 5) {
              results.push(finalText);
          }
      }
    } else {
      // MODE B: Split by Newlines (Treat each line/paragraph as a prompt)
      // Split by one or more newlines
      const chunks = input.split(/\n+/);
      
      chunks.forEach(chunk => {
        // Normalize whitespace within the line (optional, but good for clean output)
        let text = chunk.replace(/\s+/g, ' ');
        const finalText = text.trim();
        
        if (finalText.length > 5) {
          results.push(finalText);
        }
      });
    }

    return results;
  }, [input, extractionMode]);

  const getJoinedText = () => {
    const separator = addEmptyLine ? '\n\n' : '\n';
    return processedPrompts.join(separator);
  };

  const copyAll = () => {
    if (processedPrompts.length === 0) return;
    const allText = getJoinedText();
    navigator.clipboard.writeText(allText);
    alert(`Đã sao chép ${processedPrompts.length} prompt!`);
  };

  const handleDownload = () => {
    if (processedPrompts.length === 0) return;
    const allText = getJoinedText();
    saveTextFile(allText, 'formatted_prompts.txt');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
      {/* Input Section */}
      <div className="lg:col-span-5 flex flex-col h-full">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-semibold text-gray-700">Đầu vào</h2>
              <button 
                onClick={() => setInput('')} 
                className="text-xs text-red-600 hover:text-red-800 font-medium"
              >
                Xóa trắng
              </button>
            </div>
            
            {/* Mode Switcher */}
            <div className="flex bg-gray-200 p-1 rounded-lg">
              <button
                onClick={() => setExtractionMode('quotes')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                  extractionMode === 'quotes' 
                    ? 'bg-white text-blue-700 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Tìm trong ngoặc kép "..."
              </button>
              <button
                onClick={() => setExtractionMode('lines')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                  extractionMode === 'lines' 
                    ? 'bg-white text-blue-700 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Tách theo Dòng (Lines)
              </button>
            </div>
          </div>
          
          <div className="p-4 flex-1">
            <textarea
              className="w-full h-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs font-mono resize-none"
              placeholder={extractionMode === 'quotes' 
                ? `Chế độ Ngoặc kép: Dán văn bản hỗn loạn vào đây. Hệ thống chỉ lấy nội dung trong dấu "".

Ví dụ:
"Prompt 1 bị
xuống dòng"
...Rác...
"Prompt 2"` 
                : `Chế độ Dòng: Dán danh sách Prompt vào đây. Mỗi prompt nằm trên một dòng (hoặc đoạn).

Ví dụ:
Prompt dòng 1
Prompt dòng 2
Prompt dòng 3`
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </div>
          <div className="p-3 border-t bg-gray-50 text-xs text-gray-500">
            {extractionMode === 'quotes' 
              ? 'Logic: Trích xuất nội dung giữa 2 dấu ngoặc kép và nối thành 1 dòng.' 
              : 'Logic: Coi mỗi dòng văn bản (paragraph) là một prompt riêng biệt.'}
          </div>
        </div>
      </div>

      {/* Output Section */}
      <div className="lg:col-span-7 flex flex-col h-full">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2">
               <h2 className="font-semibold text-gray-700">Kết quả ({processedPrompts.length})</h2>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap justify-end">
                <label className="flex items-center text-xs text-gray-600 cursor-pointer select-none bg-white px-2 py-1 rounded border border-gray-200 hover:bg-gray-50">
                    <input 
                        type="checkbox" 
                        checked={addEmptyLine} 
                        onChange={e => setAddEmptyLine(e.target.checked)}
                        className="mr-2 rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    Cách nhau 1 dòng trống
                </label>
                
                <Button size="sm" variant="secondary" onClick={handleDownload} disabled={processedPrompts.length === 0}>
                   Tải về .txt
                </Button>
                
                <Button size="sm" onClick={copyAll} disabled={processedPrompts.length === 0}>
                  Sao chép Tất cả
                </Button>
            </div>
          </div>
          
          <div className="p-4 flex-1 overflow-y-auto bg-gray-100 space-y-3">
            {processedPrompts.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 italic">
                <span>
                  {extractionMode === 'quotes' 
                    ? 'Chưa tìm thấy nội dung trong dấu ngoặc kép.' 
                    : 'Chưa tìm thấy dòng văn bản hợp lệ.'}
                </span>
              </div>
            )}

            {processedPrompts.map((prompt, idx) => (
              <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex gap-3 group">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 font-mono break-words leading-relaxed">
                    {prompt}
                  </p>
                </div>
                <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(prompt);
                    }}
                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                    title="Sao chép dòng này"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptFormatModule;
