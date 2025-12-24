import React, { useMemo } from 'react';
import Button from '../Button';
import { Scene, ReplaceRule, AppSettings } from '../../types';
import { applyReplacementRules, saveTextFile, usePersistentState } from '../../utils/helpers';

interface ReplaceJsonModuleProps {
  data: Scene[];
  availableKeys: string[];
  rules: ReplaceRule[];
  setRules: (rules: ReplaceRule[]) => void;
  settings: AppSettings;
}

const ReplaceJsonModule: React.FC<ReplaceJsonModuleProps> = ({ data, availableKeys, rules, setRules, settings }) => {
  // Store target keys as Array in localStorage
  const [targetKeysList, setTargetKeysList] = usePersistentState<string[]>('replace_json_target_keys', []);
  
  const targetKeys = useMemo(() => new Set<string>(targetKeysList), [targetKeysList]);

  // Logic to process preview: Returns an array of result objects
  const processedResults = useMemo(() => {
    if (!data.length || targetKeys.size === 0) return [];
    
    return Array.from(targetKeys).map((key: string) => {
        // 1. Join data for this specific key
        const rawContent = data
            .map((item: Scene) => item[key])
            .filter((val: any) => val !== undefined && val !== null)
            .join(settings.joinSeparator);
        
        // 2. Apply replacement rules
        const processedContent = applyReplacementRules(rawContent, rules);

        return {
            key: key,
            content: processedContent
        };
    });
  }, [data, targetKeys, rules, settings.joinSeparator]);

  const addRule = () => {
    const newRule: ReplaceRule = {
      id: Date.now().toString(),
      from: '',
      to: '',
      useRegex: false,
      caseSensitive: false,
      wholeWord: false
    };
    setRules([...rules, newRule]);
  };

  const updateRule = (id: string, updates: Partial<ReplaceRule>) => {
    setRules(rules.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const removeRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
  };

  const toggleTargetKey = (key: string) => {
    const newSet = new Set<string>(targetKeys);
    if (newSet.has(key)) newSet.delete(key);
    else newSet.add(key);
    setTargetKeysList(Array.from(newSet));
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Đã sao chép kết quả!");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
      {/* Left: Config */}
      <div className="lg:col-span-5 flex flex-col gap-6 h-full overflow-y-auto">
        
        {/* Target Keys */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-700 mb-2">1. Chọn trường áp dụng</h3>
          <p className="text-xs text-gray-500 mb-2">Chọn các cột dữ liệu bạn muốn thực hiện thay thế. Mỗi cột sẽ tạo ra một khối kết quả riêng.</p>
          <div className="flex flex-wrap gap-2">
            {availableKeys.map(key => (
              <button
                key={key}
                onClick={() => toggleTargetKey(key)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  targetKeys.has(key) 
                    ? 'bg-blue-100 text-blue-800 border-blue-200' 
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {key}
              </button>
            ))}
          </div>
        </div>

        {/* Rules */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col flex-1 p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-700">2. Quy tắc thay thế</h3>
            <Button size="sm" onClick={addRule} variant="secondary">+ Thêm quy tắc</Button>
          </div>
          
          <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2">
            {rules.map((rule, index) => (
              <div key={rule.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200 relative group">
                <div className="flex gap-2 mb-2">
                  <input 
                    className="flex-1 p-1.5 border rounded text-sm"
                    placeholder="Tìm..."
                    value={rule.from}
                    onChange={(e) => updateRule(rule.id, { from: e.target.value })}
                  />
                  <span className="text-gray-400 self-center">→</span>
                  <input 
                    className="flex-1 p-1.5 border rounded text-sm"
                    placeholder="Thay thành..."
                    value={rule.to}
                    onChange={(e) => updateRule(rule.id, { to: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-600">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={rule.useRegex} 
                      onChange={(e) => updateRule(rule.id, { useRegex: e.target.checked })} 
                    /> Regex
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={rule.caseSensitive} 
                      onChange={(e) => updateRule(rule.id, { caseSensitive: e.target.checked })} 
                    /> Hoa/Thường
                  </label>
                   {!rule.useRegex && (
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={rule.wholeWord} 
                        onChange={(e) => updateRule(rule.id, { wholeWord: e.target.checked })} 
                      /> Nguyên từ
                    </label>
                   )}
                </div>
                <button 
                  onClick={() => removeRule(rule.id)}
                  className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Xóa quy tắc"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
            {rules.length === 0 && <p className="text-sm text-gray-400 italic text-center py-4">Chưa có quy tắc nào.</p>}
          </div>
        </div>
      </div>

      {/* Right: Result */}
      <div className="lg:col-span-7 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">
         <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <h3 className="font-semibold text-gray-700">Kết quả thay thế</h3>
            <span className="text-xs text-gray-500">Mỗi trường được xử lý riêng biệt</span>
         </div>
         <div className="p-4 flex-1 bg-gray-100 overflow-x-auto">
            {processedResults.length === 0 && (
                 <div className="h-full flex items-center justify-center text-gray-400 italic">
                     Chọn trường dữ liệu và thêm quy tắc để xem kết quả.
                 </div>
            )}
            
            {processedResults.length > 0 && (
                <div className="flex flex-row space-x-4 h-full">
                    {processedResults.map(res => (
                        <div key={res.key} className="flex-shrink-0 w-[400px] flex flex-col bg-white rounded-lg shadow border border-gray-200 h-full">
                             <div className="p-3 border-b border-gray-200 bg-blue-50 flex items-center justify-between">
                                 <div className="font-bold text-sm text-blue-800 truncate" title={res.key}>{res.key}</div>
                                 <div className="flex space-x-1">
                                    <button 
                                        onClick={() => copyText(res.content)}
                                        className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-white rounded transition-colors"
                                        title="Sao chép"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                    </button>
                                    <button 
                                        onClick={() => saveTextFile(res.content, `replaced_${res.key}.txt`)}
                                        className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-white rounded transition-colors"
                                        title="Tải về"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    </button>
                                 </div>
                             </div>
                             <textarea
                                readOnly
                                value={res.content}
                                className="flex-1 p-3 text-xs font-mono resize-none focus:outline-none w-full bg-white text-gray-800"
                             />
                        </div>
                    ))}
                </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default ReplaceJsonModule;