import React from 'react';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { ContractProcess } from '../../../types';

interface LegalProcessListProps {
  processes: ContractProcess[];
  setViewProcess: (p: ContractProcess) => void;
  setViewProcessIndex: (i: number) => void;
  editProcess: (idx: number) => void;
  removeProcess: (idx: number) => void;
}

export function LegalProcessList({ processes, setViewProcess, setViewProcessIndex, editProcess, removeProcess }: LegalProcessListProps) {
  if (processes.length === 0) return null;

  return (
    <div className="space-y-2 mt-4">
      {processes.map((p, idx) => (
        <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:border-blue-200 transition-colors group">
          <div className="grid grid-cols-3 gap-4 flex-1 text-xs">
            {/* NÚMERO CLICÁVEL */}
            <span 
              onClick={() => { setViewProcess(p); setViewProcessIndex(idx); }} 
              className="font-mono font-medium text-salomao-blue hover:underline cursor-pointer flex items-center"
              title="Clique para ver detalhes do processo"
            >
              <Eye className="w-3 h-3 mr-1" />
              {p.process_number}
            </span>
            <span className="text-gray-600">{p.court} ({p.uf})</span>
            <span className="text-gray-500 truncate">{p.opponent}</span>
          </div>
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => editProcess(idx)} className="text-blue-500 hover:bg-blue-50 p-1 rounded"><Edit className="w-4 h-4" /></button>
            <button onClick={() => removeProcess(idx)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>
      ))}
    </div>
  );
}