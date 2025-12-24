
import React from 'react';
import { StoryIdea } from '../types';
import { CheckCircle, Square, CheckSquare, ArrowLeft } from 'lucide-react';

interface Props {
  ideas: StoryIdea[];
  selectedIdeas: StoryIdea[];
  onToggle: (idea: StoryIdea) => void;
  onSelectAll: () => void;
  onNext: () => void;
  onBack: () => void;
}

const Step3Ideas: React.FC<Props> = ({ ideas, selectedIdeas, onToggle, onSelectAll, onNext, onBack }) => {
  const isAllSelected = ideas.length > 0 && selectedIdeas.length === ideas.length;

  return (
    <div className="space-y-8 animate-fade-in relative">
      <button 
        onClick={onBack}
        className="absolute -top-12 left-0 text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" /> Quay lại
      </button>

      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">Chọn Concept Cốt Truyện</h2>
        <p className="text-gray-400">Chọn những ý tưởng tiềm năng nhất để triển khai thành kịch bản.</p>
      </div>

      <div className="flex justify-between items-center bg-gray-900 p-4 rounded-xl border border-gray-800 shadow-lg sticky top-20 z-10 backdrop-blur-md bg-opacity-90">
        <div className="flex items-center gap-3">
          <button 
            onClick={onSelectAll}
            className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
          >
            {isAllSelected ? <CheckSquare className="w-5 h-5 text-primary-500" /> : <Square className="w-5 h-5" />}
            Chọn Tất Cả ({ideas.length})
          </button>
        </div>
        <div className="text-sm font-semibold">
          <span className="text-gray-400">Đã chọn: </span>
          <span className="text-primary-400 text-lg">{selectedIdeas.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
        {ideas.map((idea) => {
          const isSelected = selectedIdeas.some(i => i.id === idea.id);
          
          return (
            <div
              key={idea.id}
              onClick={() => onToggle(idea)}
              className={`
                relative p-6 rounded-xl border cursor-pointer transition-all duration-300 flex flex-col h-full group
                ${isSelected
                  ? 'bg-gray-800 border-primary-500 shadow-[0_0_20px_rgba(79,70,229,0.2)]'
                  : 'bg-gray-950 border-gray-800 hover:border-gray-600 hover:bg-gray-900'}
              `}
            >
              <div className="absolute top-4 right-4">
                {isSelected ? (
                   <CheckCircle className="w-6 h-6 text-primary-500 fill-white/10" />
                ) : (
                   <div className="w-6 h-6 rounded-full border-2 border-gray-700 group-hover:border-gray-500 transition-colors"></div>
                )}
              </div>
              
              <h3 className="text-lg font-bold text-white mb-3 pr-8 leading-tight group-hover:text-primary-300 transition-colors">{idea.title}</h3>
              <p className="text-primary-400 text-sm font-medium mb-4 italic pl-3 border-l-2 border-primary-500/30">
                "{idea.hook}"
              </p>
              
              <div className="flex-1">
                <p className="text-gray-400 text-sm mb-4 leading-relaxed">{idea.summary}</p>
              </div>

              <div className="pt-4 border-t border-gray-800/50 mt-auto grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="block text-gray-600 uppercase tracking-wider font-bold mb-1">Xung đột</span>
                  <span className="text-gray-300">{idea.conflict}</span>
                </div>
                <div>
                  <span className="block text-gray-600 uppercase tracking-wider font-bold mb-1">Tone</span>
                  <span className="text-gray-300">{idea.tone}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-0 left-0 w-full p-4 bg-gradient-to-t from-gray-950 to-transparent pointer-events-none flex justify-center z-20">
        <button
          onClick={onNext}
          disabled={selectedIdeas.length === 0}
          className={`
            pointer-events-auto px-12 py-4 rounded-full font-bold text-lg transition-all shadow-xl
            ${selectedIdeas.length === 0
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
              : 'bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white hover:scale-105 hover:shadow-primary-900/50'}
          `}
        >
          {selectedIdeas.length > 0 ? `Tiếp tục với ${selectedIdeas.length} Kịch Bản` : 'Vui lòng chọn ý tưởng'}
        </button>
      </div>
    </div>
  );
};

export default Step3Ideas;
