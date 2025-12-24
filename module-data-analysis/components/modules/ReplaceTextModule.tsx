import React, { useMemo, useEffect } from 'react';
import Button from '../Button';
import { ReplaceRule } from '../../types';
import { applyReplacementRules, usePersistentState } from '../../utils/helpers';

const ReplaceTextModule: React.FC = () => {
  // --- Persistent State ---
  const [mode, setMode] = usePersistentState<'regex' | 'blocks'>('replace_text_mode', 'regex');
  const [input, setInput] = usePersistentState<string>('replace_text_input', '');
  const [rules, setRules] = usePersistentState<ReplaceRule[]>('replace_text_rules', []);
  
  // Storing linesToRemove as an array because Set cannot be stringified automatically
  const [linesToRemoveList, setLinesToRemoveList] = usePersistentState<number[]>('replace_text_lines_remove', []);
  
  // Memoize Set for efficient lookup
  const linesToRemove = useMemo(() => new Set<number>(linesToRemoveList), [linesToRemoveList]);

  // --- Regex Logic ---
  const addRule = () => {
    setRules([...rules, {
      id: Date.now().toString(),
      from: '',
      to: '',
      useRegex: false,
      caseSensitive: false,
      wholeWord: false
    }]);
  };

  const updateRule = (id: string, updates: Partial<ReplaceRule>) => {
    setRules(rules.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const removeRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
  };

  const regexResult = useMemo(() => applyReplacementRules(input, rules), [input, rules]);

  // --- Block Processor Logic ---
  // Note: blockOutput is derived state, so we don't need to persist it. It recalculates on load.
  const blocks = useMemo(() => {
    if (!input.trim()) return [];
    return input.split(/\n\s*\n/).filter(b => b.trim().length > 0);
  }, [input]);

  const maxLines = useMemo(() => {
    let max = 0;
    blocks.forEach(block => {
      const lineCount = block.split('\n').filter(l => l.trim().length > 0).length;
      if (lineCount > max) max = lineCount;
    });
    return max;
  }, [blocks]);

  // Compute block output (no effect handling needed, just memo)
  const blockOutput = useMemo(() => {
    if (blocks.length === 0) return '';
    
    const processedBlocks = blocks.map(block => {
      const lines = block.split('\n');
      const validLines = lines.filter(l => l.trim() !== '');
      const keptLines = validLines.filter((_, index) => !linesToRemove.has(index));
      return keptLines.join('\n');
    });
    return processedBlocks.join('\n\n');
  }, [blocks, linesToRemove]);

  const toggleLine = (index: number) => {
    const newSet = new Set<number>(linesToRemove);
    if (newSet.has(index)) newSet.delete(index);
    else newSet.add(index);
    setLinesToRemoveList(Array.from(newSet));
  };

  // --- Render ---
  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Mode Switcher */}
      <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200 inline-flex self-start">
        <button
          onClick={() => setMode('regex')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            mode === 'regex' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          Thay thế (Regex)
        </button>
        <button
          onClick={() => setMode('blocks')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            mode === 'blocks' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          Xử lý Khối/Dòng (Block Processor)
        </button>
      </div>

      {mode === 'regex' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full flex-1">
          {/* Rules Column */}
          <div className="lg:col-span-4 flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h3 className="font-semibold text-gray-700">Quy tắc Thay thế</h3>
                <Button size="sm" onClick={addRule} variant="secondary">+ Thêm</Button>
            </div>
            <div className="space-y-3 overflow-y-auto flex-1">
                {rules.map((rule) => (
                  <div key={rule.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200 relative group">
                    <div className="flex gap-2 mb-2">
                      <input 
                        className="flex-1 p-1.5 border rounded text-xs"
                        placeholder="Tìm..."
                        value={rule.from}
                        onChange={(e) => updateRule(rule.id, { from: e.target.value })}
                      />
                      <input 
                        className="flex-1 p-1.5 border rounded text-xs"
                        placeholder="Thay thành..."
                        value={rule.to}
                        onChange={(e) => updateRule(rule.id, { to: e.target.value })}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                      <label className="flex items-center gap-1"><input type="checkbox" checked={rule.useRegex} onChange={(e) => updateRule(rule.id, { useRegex: e.target.checked })} /> Regex</label>
                      <label className="flex items-center gap-1"><input type="checkbox" checked={rule.caseSensitive} onChange={(e) => updateRule(rule.id, { caseSensitive: e.target.checked })} /> Hoa/Thường</label>
                      {!rule.useRegex && <label className="flex items-center gap-1"><input type="checkbox" checked={rule.wholeWord} onChange={(e) => updateRule(rule.id, { wholeWord: e.target.checked })} /> Nguyên từ</label>}
                    </div>
                    <button onClick={() => removeRule(rule.id)} className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
            </div>
          </div>

          {/* Editor Column */}
          <div className="lg:col-span-8 flex flex-col lg:flex-row gap-4 h-full">
             <div className="flex-1 flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Văn bản gốc</label>
                <textarea
                  className="flex-1 w-full p-3 border border-gray-300 rounded-lg text-sm font-mono resize-none focus:ring-1 focus:ring-blue-500"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Dán văn bản vào đây..."
                />
             </div>
             <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-1">
                   <label className="text-sm font-medium text-gray-700">Kết quả</label>
                   <button onClick={() => navigator.clipboard.writeText(regexResult)} className="text-xs text-blue-600 font-medium hover:underline">Sao chép</button>
                </div>
                <textarea
                  readOnly
                  className="flex-1 w-full p-3 border border-gray-300 rounded-lg text-sm font-mono resize-none bg-gray-50 focus:outline-none"
                  value={regexResult}
                  placeholder="Văn bản sau khi xử lý..."
                />
             </div>
          </div>
        </div>
      ) : (
        // --- Block Processor View (Features Restored) ---
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full flex-1">
          <div className="lg:col-span-5 space-y-4 flex flex-col h-full">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col flex-1">
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h2 className="font-semibold text-gray-700">Văn bản dạng Khối</h2>
                <button onClick={() => setInput('')} className="text-xs text-red-600 hover:text-red-800 font-medium">Xóa</button>
              </div>
              <div className="p-4 flex-grow flex flex-col">
                <textarea
                  className="w-full h-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-xs font-mono resize-none"
                  placeholder={`Dán văn bản dạng khối vào đây. Ví dụ:

Khối 1 Dòng 1
Khối 1 Dòng 2

Khối 2 Dòng 1
Khối 2 Dòng 2`}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
                <p className="mt-2 text-xs text-gray-400">
                  Đã phát hiện {blocks.length} khối. Các khối cách nhau bởi dòng trống.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 flex flex-col space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-700 mb-3 text-sm">Xóa Dòng</h3>
              <p className="text-xs text-gray-500 mb-4">Chọn dòng muốn xóa khỏi TẤT CẢ các khối.</p>
              
              {maxLines === 0 && <p className="text-xs text-gray-400 italic">Chưa có dữ liệu</p>}

              <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                {Array.from({ length: maxLines }).map((_, i) => (
                  <label key={i} className={`flex items-center space-x-3 p-2 rounded cursor-pointer transition-colors border ${linesToRemove.has(i) ? 'bg-red-50 border-red-200' : 'hover:bg-gray-50 border-transparent'}`}>
                    <input
                      type="checkbox"
                      checked={linesToRemove.has(i)}
                      onChange={() => toggleLine(i)}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                    <span className={`text-sm font-medium ${linesToRemove.has(i) ? 'text-red-700 line-through' : 'text-gray-700'}`}>
                      Dòng {i + 1}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4 flex flex-col h-full">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col flex-1">
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h2 className="font-semibold text-gray-700">Kết quả xử lý</h2>
                 <Button 
                   variant="primary" 
                   size="sm" 
                   onClick={() => {navigator.clipboard.writeText(blockOutput); alert("Đã sao chép!");}}
                   disabled={!blockOutput}
                 >
                   Sao chép
                 </Button>
              </div>
              <div className="p-0 flex-grow relative bg-gray-50">
                <textarea
                  readOnly
                  className="w-full h-full p-4 bg-gray-50 text-gray-800 text-xs font-mono resize-none focus:outline-none"
                  value={blockOutput}
                  placeholder="Kết quả sẽ hiển thị ở đây..."
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReplaceTextModule;