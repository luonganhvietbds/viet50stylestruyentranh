import React, { useState } from 'react';
import { generateAIResponse } from '../services/geminiService';
import { AIModelType } from '../types';
import Button from './Button';
import ReactMarkdown from 'react-markdown';

interface GeminiModalProps {
  isOpen: boolean;
  onClose: () => void;
  contextTitle: string;
  contextData: string;
}

const GeminiModal: React.FC<GeminiModalProps> = ({ isOpen, onClose, contextTitle, contextData }) => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [isThinkingMode, setIsThinkingMode] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setResponse('');
    try {
      const model = isThinkingMode ? AIModelType.THINKING : AIModelType.FAST;
      const result = await generateAIResponse(prompt, contextData, model);
      setResponse(result);
    } catch (error) {
      setResponse("Sorry, I encountered an error processing your request.");
    } finally {
      setLoading(false);
    }
  };

  const suggestedPrompts = [
    "Summarize the key themes",
    "Proofread and correct grammar",
    "Rewrite in a more engaging tone",
    "Extract key entities"
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-700 px-4 py-4 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-white flex items-center" id="modal-title">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              Gemini Intelligence: {contextTitle}
            </h3>
            <p className="text-indigo-100 text-sm mt-1">Analyze and transform your content.</p>
          </div>
          
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Context Preview (First 200 chars)</label>
              <div className="bg-gray-50 p-3 rounded text-xs text-gray-500 font-mono truncate">
                {contextData.substring(0, 200)}...
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Prompt</label>
              <textarea
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border h-24"
                placeholder="Ask Gemini to analyze, rewrite, or summarize this data..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {suggestedPrompts.map(p => (
                  <button 
                    key={p}
                    onClick={() => setPrompt(p)}
                    className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-100 transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
               <div className="flex items-center">
                 <div className="flex items-center h-5">
                   <input
                     id="thinking-mode"
                     type="checkbox"
                     checked={isThinkingMode}
                     onChange={(e) => setIsThinkingMode(e.target.checked)}
                     className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                   />
                 </div>
                 <div className="ml-3 text-sm">
                   <label htmlFor="thinking-mode" className="font-medium text-gray-700">Thinking Mode</label>
                   <p className="text-gray-500 text-xs">Uses Gemini 3 Pro with extended reasoning for complex tasks.</p>
                 </div>
               </div>
               {isThinkingMode && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    High Intelligence
                  </span>
               )}
            </div>

            {response && (
              <div className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="text-sm font-bold text-gray-700 mb-2">Gemini Response:</h4>
                <div className="prose prose-sm prose-indigo max-w-none text-gray-800 max-h-60 overflow-y-auto">
                  <ReactMarkdown>{response}</ReactMarkdown>
                </div>
                <div className="mt-2 text-right">
                   <button 
                     onClick={() => navigator.clipboard.writeText(response)}
                     className="text-xs text-indigo-600 hover:text-indigo-800"
                   >
                     Copy Response
                   </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <Button 
              variant="ai"
              onClick={handleGenerate} 
              isLoading={loading}
              disabled={!prompt.trim()}
              className="w-full sm:w-auto sm:ml-3"
            >
              {loading ? 'Processing...' : 'Generate'}
            </Button>
            <Button 
              variant="secondary"
              onClick={onClose}
              className="mt-3 w-full sm:mt-0 sm:w-auto"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeminiModal;
