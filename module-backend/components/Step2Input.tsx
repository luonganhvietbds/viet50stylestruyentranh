
import React, { useState, useEffect } from 'react';
import { StyleAgent, UserRole } from '../types';
import { Sparkles, Wand2, FileText, Settings2, Save, RotateCcw, ChevronDown, ChevronUp, Lock, ArrowLeft, Crown } from 'lucide-react';

interface Props {
  agent: StyleAgent;
  description: string;
  setDescription: (val: string) => void;
  numIdeas: number;
  setNumIdeas: (val: number) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  customSystemPrompt: string | undefined;
  onSaveCustomPrompt: (prompt: string) => void;
  userRole?: UserRole;
  onBack: () => void;
}

const Step2Input: React.FC<Props> = ({ 
  agent, description, setDescription, numIdeas, setNumIdeas, onGenerate, isGenerating,
  customSystemPrompt, onSaveCustomPrompt, userRole = 'free', onBack
}) => {
  const [showPromptConfig, setShowPromptConfig] = useState(false);
  const [tempPrompt, setTempPrompt] = useState(agent.systemPrompt);

  useEffect(() => {
    setTempPrompt(customSystemPrompt || agent.systemPrompt);
  }, [agent.id, customSystemPrompt]);

  const handleUseTemplate = () => {
    setDescription(agent.template);
  };

  const handleSavePrompt = () => {
    onSaveCustomPrompt(tempPrompt);
  };

  const handleResetPrompt = () => {
    setTempPrompt(agent.systemPrompt);
    onSaveCustomPrompt(''); 
  };

  // Logic Phân Quyền Số Lượng Ý Tưởng:
  // Free: Max 3
  // Silver: Max 10
  // Gold/Admin: Max 20
  const isOptionLocked = (num: number) => {
    if (userRole === 'admin' || userRole === 'gold') return false;
    if (userRole === 'silver') return num > 10;
    return num > 3; // Free limit
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in relative">
      <button 
        onClick={onBack}
        className="absolute -top-12 left-0 text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" /> Quay lại
      </button>

      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">Cấu Hình {agent.name}</h2>
        <p className="text-gray-400">Cung cấp ý tưởng ban đầu hoặc để AI tự do sáng tạo.</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 space-y-6 shadow-2xl">
        
        {/* Number of Ideas */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3 flex justify-between">
            <span>Số lượng Ý tưởng cần tạo</span>
            <span className="text-xs text-gray-500 uppercase tracking-wide">
              Quyền hạn: {userRole?.toUpperCase()}
            </span>
          </label>
          <div className="grid grid-cols-4 gap-4">
            {[3, 5, 10, 20].map(num => {
              const locked = isOptionLocked(num);
              return (
                <button
                  key={num}
                  disabled={locked}
                  onClick={() => setNumIdeas(num)}
                  className={`
                    py-3 rounded-lg border text-sm font-semibold transition-all flex flex-col items-center justify-center gap-1
                    ${locked 
                      ? 'bg-gray-950 border-gray-800 text-gray-600 cursor-not-allowed opacity-70' 
                      : (numIdeas === num 
                          ? 'bg-primary-600 border-primary-500 text-white ring-2 ring-primary-500/50' 
                          : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-750 hover:border-gray-500')}
                  `}
                >
                  <span className="text-lg">{num}</span>
                  <span className="text-[10px] uppercase font-normal opacity-80">
                    {locked ? <Lock className="w-3 h-3 mx-auto" /> : 'Ý tưởng'}
                  </span>
                </button>
              );
            })}
          </div>
          {isOptionLocked(10) && (
             <p className="text-xs text-center mt-3 text-gray-500">
               <span className="text-yellow-500">Mẹo:</span> Nâng cấp lên Gold để tạo 20 ý tưởng cùng lúc.
             </p>
          )}
        </div>

        {/* Description Input */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="block text-sm font-medium text-gray-300">
              Mô tả Ý tưởng (Tùy chọn)
            </label>
            <button 
              onClick={handleUseTemplate}
              className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-gray-800 border border-transparent hover:border-gray-700"
              title="Chèn mẫu mô tả gợi ý"
            >
              <FileText className="w-3 h-3" /> Sử dụng Template
            </button>
          </div>
          
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={`Ví dụ: Một anh hùng bất đắc dĩ tìm thấy thanh gươm bị nguyền rủa trong một con hẻm đèn neon...`}
            className="w-full bg-gray-950 border border-gray-700 rounded-lg p-4 text-white placeholder-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[160px] resize-none"
          />
        </div>

        {/* Prompt Library / Config Section */}
        <div className="border-t border-gray-800 pt-4">
          <button 
            onClick={() => setShowPromptConfig(!showPromptConfig)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors w-full justify-between"
          >
            <span className="flex items-center gap-2">
              <Settings2 className="w-4 h-4" />
              Cấu hình Agent (Nâng cao)
            </span>
            {showPromptConfig ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {showPromptConfig && (
            <div className="mt-4 bg-gray-950 rounded-lg p-4 border border-gray-800 animate-fade-in">
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                  System Prompt (Chỉ thị cốt lõi)
                </label>
                <textarea
                  value={tempPrompt}
                  onChange={(e) => setTempPrompt(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-md p-3 text-xs font-mono text-emerald-400 focus:ring-1 focus:ring-emerald-500 min-h-[150px]"
                />
              </div>
              <div className="flex gap-3 justify-end">
                 <button
                  onClick={handleResetPrompt}
                  className="flex items-center gap-1 px-3 py-1.5 rounded border border-gray-700 text-xs text-gray-400 hover:text-white hover:bg-gray-800"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
                <button
                  onClick={handleSavePrompt}
                  className="flex items-center gap-1 px-3 py-1.5 rounded bg-primary-600 hover:bg-primary-500 text-white text-xs font-medium"
                >
                  <Save className="w-3 h-3" /> Lưu thay đổi
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className={`
            w-full py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all
            ${isGenerating 
              ? 'bg-gray-800 cursor-not-allowed text-gray-500 border border-gray-700' 
              : 'bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white shadow-lg shadow-primary-900/40 hover:scale-[1.02]'}
          `}
        >
          {isGenerating ? (
            <>
              <Sparkles className="w-5 h-5 animate-spin" />
              Đang Sáng Tạo...
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5" />
              Tạo {numIdeas} Ý Tưởng
            </>
          )}
        </button>

      </div>
    </div>
  );
};

export default Step2Input;
