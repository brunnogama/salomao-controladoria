import { Edit, Trash2 } from 'lucide-react';
import { Contract } from '../../types';

interface Props {
  contracts: Contract[];
  onEdit: (c: Contract) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
  getStatusColor: (s: string) => string;
  getStatusLabel: (s: string) => string;
}

export function ContractTable({ contracts, onEdit, onDelete, getStatusColor, getStatusLabel }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Cliente</th>
            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Sócio Responsável</th>
            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Proc. Vinculados</th>
            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {contracts.length === 0 ? (
             <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400">Nenhum contrato encontrado.</td></tr>
          ) : (
            contracts.map((contract) => (
              <tr key={contract.id} className="hover:bg-gray-50 transition-colors cursor-pointer group" onClick={() => onEdit(contract)}>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(contract.status)}`}>{getStatusLabel(contract.status)}</span>
                </td>
                <td className="px-6 py-4 font-medium text-gray-900">{contract.client_name} <span className="text-gray-400 text-xs font-normal">({contract.client_position})</span></td>
                <td className="px-6 py-4 text-gray-600 flex items-center gap-2">
                   <div className="w-6 h-6 rounded-full bg-salomao-blue text-white flex items-center justify-center text-xs">{contract.partner_name?.charAt(0)}</div>
                   {contract.partner_name || '-'}
                </td>
                <td className="px-6 py-4 text-gray-600"><span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-bold text-gray-700">{contract.process_count}</span></td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2 opacity-100">
                    <button onClick={(e) => { e.stopPropagation(); onEdit(contract); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"><Edit className="w-4 h-4" /></button>
                    <button onClick={(e) => onDelete(e, contract.id!)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
