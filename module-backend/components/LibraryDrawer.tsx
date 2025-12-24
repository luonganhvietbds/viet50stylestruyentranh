
import React from 'react';
import { GeneratedStory } from '../types';
import { X, Trash2, Clock, BookOpen, Image as ImageIcon } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  stories: GeneratedStory[];
  onSelectStory: (story: GeneratedStory) => void;
  onDeleteStory: (id: string) => void;
}

const LibraryDrawer: React.FC<Props> = ({ isOpen, onClose, stories, onSelectStory, onDeleteStory }) => {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div className={`
        fixed top-0 right-0 h-full w-full md:w-96 bg-gray-900 border-l border-gray-800 z-50 transform transition-transform duration-300 shadow-2xl
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-800 flex justify-between items-center">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary-500" />
              Tủ Sách Cá Nhân
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {stories.length === 0 ? (
              <div className="text-center text-gray-500 mt-10">
                <p>Chưa có truyện nào được lưu.</p>
                <p className="text-sm mt-2">Hãy sáng tạo câu chuyện đầu tiên của bạn!</p>
              </div>
            ) : (
              stories.map((story) => (
                <div 
                  key={story.id} 
                  className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-primary-500 transition-all group"
                >
                  <div 
                    onClick={() => { onSelectStory(story); onClose(); }}
                    className="cursor-pointer"
                  >
                    <h3 className="font-bold text-white mb-1 line-clamp-1 group-hover:text-primary-400 transition-colors">
                      {story.title}
                    </h3>
                    <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(story.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                    <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                      {story.summary}
                    </p>
                    
                    <div className="flex gap-2 mb-3">
                      {story.coverImage && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-indigo-900/30 text-indigo-400 text-[10px] font-medium border border-indigo-900/50">
                          <ImageIcon className="w-3 h-3" /> Có Tranh
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-gray-700">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDeleteStory(story.id); }}
                      className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1 px-2 py-1 hover:bg-red-900/20 rounded transition-colors"
                    >
                      <Trash2 className="w-3 h-3" /> Xóa
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default LibraryDrawer;