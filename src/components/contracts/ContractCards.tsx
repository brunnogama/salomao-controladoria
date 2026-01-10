import { Edit, Trash2 } from 'lucide-react';
import { Contract } from '../../types';

interface Props {
  contracts: Contract[];
  onEdit: (c: Contract) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
  getStatusColor: (s: string) => string;
  getStatusLabel: (s: string) => string;
}

export function ContractCards({ contracts, onEdit, onDelete, getStatusColor, getStatusLabel }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {contracts.map(c => (
         <div key={c.id} onClick={() => onEdit(c)} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer relative">
            <div className="absolute top-4 right-4 flex gap-1">
              <button onClick={(e) => { e.stopPropagation(); onEdit(c); }} className="text-gray-400 hover:text-blue-500 p-1"><Edit className="w-4 h-4" /></button>
              <button onClick={(e) => onDelete(e, c.id!)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
            </div>
            <div className="flex justify-between items-start mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(c.status)}`}>{getStatusLabel(c.status)}</span>
            </div>
            <h3 className="font-bold text-gray-800 text-lg mb-1">{c.client_name}</h3>
            <p className="text-sm text-gray-500 mb-4">{c.client_position}</p>
            <div className="border-t pt-4 flex justify-between items-center text-xs text-gray-500">
               <span>{c.process_count} Processos</span>
               <span className="font-semibold text-salomao-blue">{c.partner_name}</span>
            </div>
         </div>
      ))}
    </div>
  );
}