
import React from 'react';
import { StoryIdea, StoryLength, UserRole } from '../types';
import { LENGTH_CONFIG } from '../data/agents';
import { PenTool, Network, Clock, Layers, Lock, ArrowLeft, Zap } from 'lucide-react';

interface Props {
  selectedIdeas: StoryIdea[];
  length: StoryLength;
  setLength: (l: StoryLength) => void;
  customPrompt: string;
  setCustomPrompt: (s: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  batchStatus: string | null;
  userRole?: UserRole;
  onBack: () => void;
}

const Step4Config: React.FC<Props> = ({ 
  selectedIdeas, length, setLength, customPrompt, setCustomPrompt, onGenerate, isGenerating, batchStatus, userRole = 'free', onBack
}) => {
  
  // Logic: Batch (nhiều hơn 1 idea) chỉ dành cho Silver/Gold/Admin
  const isBatchLocked = userRole === 'free' && selectedIdeas.length > 1;

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in relative pb-10">
      <button 
        onClick={onBack}
        disabled={isGenerating}
        className={`absolute -top-12 left-0 text-gray-400 hover:text-white flex items-center gap-2 transition-colors ${isGenerating ? 'opacity-0 cursor-default' : ''}`}
      >
        <ArrowLeft className="w-5 h-5" /> Quay lại
      </button>

       <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">Thiết Lập Sản Xuất</h2>
        <p className="text-gray-400">
          Cấu hình thông số chi tiết cho {selectedIdeas.length} kịch bản.
        </p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 shadow-2xl">
        
        {/* Selected Ideas List */}
        <div className="mb-8 p-4 bg-gray-950 rounded-lg border border-gray-800">
          <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4" /> 
            Danh sách Concept cần viết ({selectedIdeas.length})
          </h3>
          <ul className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
            {selectedIdeas.map((idea, idx) => (
              <li key={idea.id} className="text-sm text-gray-300 flex items-start gap-3 border-b border-gray-800 pb-2 last:border-0 last:pb-0">
                <span className="bg-gray-800 text-gray-500 font-mono text-[10px] px-1.5 py-0.5 rounded h-fit mt-0.5">#{idx + 1}</span>
                <span className="line-clamp-1">{idea.title}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Length Slider */}
        <div className="mb-8">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-4">
            <Clock className="w-4 h-4 text-primary-400" /> Độ dài Kịch Bản
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {(Object.keys(LENGTH_CONFIG) as StoryLength[]).map((key) => {
              const config = LENGTH_CONFIG[key];
              return (
                <button
                  key={key}
                  onClick={() => setLength(key)}
                  className={`
                    py-4 px-2 rounded-xl border text-sm flex flex-col items-center gap-2 transition-all relative overflow-hidden
                    ${length === key 
                      ? 'bg-primary-900/20 border-primary-500 text-primary-100' 
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-750 hover:border-gray-500'}
                  `}
                >
                  <span className="font-bold text-lg">{config.label}</span>
                  <span className="text-xs opacity-60 bg-black/20 px-2 py-0.5 rounded-full">{config.words} từ</span>
                  {length === key && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary-500"></div>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Prompt */}
        <div className="mb-8">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
            <PenTool className="w-4 h-4 text-primary-400" /> Ghi chú Đạo diễn (Director's Note)
          </label>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Ví dụ: Tập trung sâu vào đối thoại nội tâm. Đảm bảo cái kết có hậu. Phong cách gãy gọn..."
            className="w-full bg-gray-950 border border-gray-700 rounded-lg p-4 text-white placeholder-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[120px]"
          />
        </div>

        {/* Generation Button */}
        <button
          onClick={onGenerate}
          disabled={isGenerating || isBatchLocked}
          className={`
            w-full py-5 rounded-xl font-bold text-xl flex items-center justify-center gap-3 transition-all relative overflow-hidden group
            ${isGenerating || isBatchLocked
              ? 'bg-gray-800 cursor-not-allowed text-gray-500 border border-gray-700' 
              : 'bg-white text-gray-900 hover:bg-gray-100 shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)]'}
          `}
        >
          {isGenerating ? (
            <>
              <Network className="w-6 h-6 animate-pulse text-primary-600" />
              <span className="animate-pulse">{batchStatus || "Đang khởi tạo Engine..."}</span>
            </>
          ) : (
            <>
              {isBatchLocked ? (
                <>
                  <Lock className="w-5 h-5 text-gray-500" />
                  <span>Nâng cấp để Viết Hàng Loạt</span>
                </>
              ) : (
                <>
                  <Zap className="w-6 h-6 text-yellow-600 fill-current group-hover:scale-110 transition-transform" />
                  <span>Viết {selectedIdeas.length} Kịch Bản Ngay</span>
                </>
              )}
            </>
          )}
        </button>
        
        {isGenerating && (
           <div className="mt-6 p-4 bg-gray-950 rounded-lg border border-gray-800 flex items-start gap-3">
             <div className="w-2 h-2 rounded-full bg-green-500 mt-2 animate-ping"></div>
             <p className="text-xs text-gray-400 leading-relaxed">
               <strong className="text-white">Thinking Mode Active (32k Tokens):</strong> AI đang suy nghĩ sâu về cấu trúc cốt truyện, tâm lý nhân vật và các nút thắt. 
               Quá trình này có thể mất 30-60 giây cho mỗi kịch bản để đảm bảo chất lượng cao nhất.
             </p>
           </div>
        )}
      </div>
    </div>
  );
};

export default Step4Config;
