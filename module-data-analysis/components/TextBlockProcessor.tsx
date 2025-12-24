
import React, { useState, useEffect, useMemo } from 'react';
import Button from './Button';

const CopyIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
const RefreshIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;

const TextBlockProcessor: React.FC = () => {
  const [input, setInput] = useState('');
  const [linesToRemove, setLinesToRemove] = useState<Set<number>>(new Set());
  const [processedOutput, setProcessedOutput] = useState('');

  // 1. Parse blocks and determine structure
  const blocks = useMemo(() => {
    if (!input.trim()) return [];
    // Split by 2 or more newlines to get blocks
    return input.split(/\n\s*\n/).filter(b => b.trim().length > 0);
  }, [input]);

  // 2. Find max lines to generate checkboxes
  const maxLines = useMemo(() => {
    let max = 0;
    blocks.forEach(block => {
      const lineCount = block.split('\n').filter(l => l.trim().length > 0).length;
      if (lineCount > max) max = lineCount;
    });
    return max;
  }, [blocks]);

  // 3. Process the output whenever input or checkboxes change
  useEffect(() => {
    if (blocks.length === 0) {
      setProcessedOutput('');
      return;
    }

    const processedBlocks = blocks.map(block => {
      const lines = block.split('\n'); // Keep empty lines within block to maintain structure or use filter?
      // Based on request "delete row 1", we treat visual rows.
      // Let's split by newline, filter out completely empty lines to be safe? 
      // The prompt implies structured data. Let's keep strict splitting.
      const validLines = lines.filter(l => l.trim() !== ''); // Remove empty lines inside block for cleaner indexing
      
      const keptLines = validLines.filter((_, index) => !linesToRemove.has(index));
      return keptLines.join('\n');
    });

    setProcessedOutput(processedBlocks.join('\n\n'));
  }, [blocks, linesToRemove]);

  const toggleLine = (index: number) => {
    const newSet = new Set(linesToRemove);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setLinesToRemove(newSet);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(processedOutput);
    alert("Result copied to clipboard!");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Input Section */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="font-semibold text-gray-700">Input Text Blocks</h2>
            <button onClick={() => setInput('')} className="text-xs text-red-600 hover:text-red-800 font-medium">Clear</button>
          </div>
          <div className="p-4 flex-grow flex flex-col">
            <textarea
              className="w-full h-96 flex-grow p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs font-mono resize-none"
              placeholder={`Paste your blocks here. Example:

{{ Character A }}
SCENE_001 | Description
Details...

{{ Character B }}
SCENE_002 | Description
Details...`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <p className="mt-2 text-xs text-gray-400">
              {blocks.length} blocks detected. Separate blocks with empty lines.
            </p>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="lg:col-span-2 flex flex-col space-y-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-700 mb-3 text-sm">Line Deletion</h3>
          <p className="text-xs text-gray-500 mb-4">Select lines to remove from EVERY block.</p>
          
          {maxLines === 0 && <p className="text-xs text-gray-400 italic">No text detected</p>}

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
                  Line {i + 1}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Output Section */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="font-semibold text-gray-700">Processed Output</h2>
             <Button 
               variant="primary" 
               size="sm" 
               onClick={copyToClipboard}
               disabled={!processedOutput}
               icon={<CopyIcon />}
             >
               Copy
             </Button>
          </div>
          <div className="p-0 flex-grow relative bg-gray-50">
            <textarea
              readOnly
              className="w-full h-96 p-4 bg-gray-50 text-gray-800 text-xs font-mono resize-none focus:outline-none"
              value={processedOutput}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextBlockProcessor;
