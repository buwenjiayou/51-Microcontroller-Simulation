
import React from 'react';

interface KeypadProps {
  onKey: (key: string | number) => void;
  onOk: () => void;
  onCancel: () => void;
  onS16: () => void;
  disabled?: boolean;
}

export const Keypad: React.FC<KeypadProps> = ({ onKey, onOk, onCancel, onS16, disabled }) => {
  const keys = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
    ['S16', 0, '*']
  ];

  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200">
      <div className="grid grid-cols-3 gap-4 mb-6">
        {keys.map((row, rIdx) => (
          row.map((k, kIdx) => (
            <button
              key={`${rIdx}-${kIdx}`}
              onClick={() => {
                if (disabled) return;
                if (k === 'S16') onS16();
                else if (typeof k === 'number') onKey(k);
              }}
              disabled={disabled}
              className={`
                h-14 rounded-xl flex items-center justify-center font-bold text-xl transition-all shadow-md
                ${disabled ? 'bg-slate-100 text-slate-300' : 'bg-slate-50 text-slate-700 hover:bg-slate-200 active:scale-95 active:shadow-inner border-b-4 border-slate-300'}
              `}
            >
              {k === '*' ? '#' : k}
            </button>
          ))
        ))}
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => !disabled && onCancel()}
          disabled={disabled}
          className="h-14 bg-red-100 text-red-700 rounded-xl font-bold shadow-md hover:bg-red-200 active:scale-95 border-b-4 border-red-300 transition-all uppercase tracking-wide"
        >
          Cancel
        </button>
        <button
          onClick={() => !disabled && onOk()}
          disabled={disabled}
          className="h-14 bg-emerald-100 text-emerald-700 rounded-xl font-bold shadow-md hover:bg-emerald-200 active:scale-95 border-b-4 border-emerald-300 transition-all uppercase tracking-wide"
        >
          OK
        </button>
      </div>
    </div>
  );
};
