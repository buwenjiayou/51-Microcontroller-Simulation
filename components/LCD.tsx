
import React from 'react';

interface LCDProps {
  lines: string[];
  stateId: string;
  step?: string;
}

export const LCD: React.FC<LCDProps> = ({ lines, stateId, step }) => {
  return (
    <div className="bg-slate-900 border-4 border-slate-700 p-4 rounded-lg shadow-inner">
      <div className="flex justify-between items-center mb-2 px-1">
        <span className="text-[10px] text-blue-400 uppercase font-bold tracking-widest">12864 LCD SIMULATOR</span>
        <span className="text-[10px] text-slate-500 font-mono">[{stateId}{step ? `:${step}` : ''}]</span>
      </div>
      <div className="bg-blue-900/20 p-2 rounded border border-blue-900/30">
        <div className="space-y-1">
          {lines.map((line, idx) => (
            <div 
              key={idx} 
              className="lcd-font text-blue-400 text-lg md:text-xl leading-none whitespace-pre h-6 overflow-hidden"
            >
              {line.padEnd(16, ' ').slice(0, 16)}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex justify-end gap-1">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
        <div className="w-1.5 h-1.5 rounded-full bg-blue-800"></div>
      </div>
    </div>
  );
};
