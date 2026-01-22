import React from 'react';
import { X, Gavel, Edit } from 'lucide-react';
import { ContractProcess } from '../../../types';

interface ProcessDetailsModalProps {
  process: ContractProcess | null;
  onClose: () => void;
  onEdit: () => void;
}

export function ProcessDetailsModal({ process, onClose, onEdit }: ProcessDetailsModalProps) {
  if (!process) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
        <div className="bg-salomao-blue text-white p-6 flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-lg font-bold">Detalhes do Processo</h3>
            <p className="text-xs text-blue-200 mt-1 font-mono">{process.process_number}</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Tribunal</span>
              <span className="text-sm font-medium text-gray-800">{process.court || '-'}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Estado (UF)</span>
              <span className="text-sm font-medium text-gray-800">{process.uf || '-'}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Vara</span>
              <span className="text-sm font-medium text-gray-800">{process.vara || '-'}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Comarca</span>
              <span className="text-sm font-medium text-gray-800">{process.comarca || '-'}</span>
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
            <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Magistrados</span>
            {process.magistrates && process.magistrates.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {process.magistrates.map((m, idx) => (
                  <span key={idx} className="inline-flex items-center px-2 py-1 rounded bg-white border border-gray-200 text-xs text-gray-700">
                    <Gavel size={10} className="mr-1 text-gray-400" />
                    <span className="font-semibold mr-1">{m.title}:</span> {m.name}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-sm text-gray-500 italic">Nenhum magistrado cadastrado.</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Parte Oposta</span>
              <span className="text-sm font-medium text-gray-800">{process.opponent || '-'}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Posição</span>
              <span className="text-sm font-medium text-gray-800">{process.position || '-'}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Tipo de Ação</span>
              <span className="text-sm font-medium text-gray-800">{process.action_type || '-'}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Data Distribuição</span>
              <span className="text-sm font-medium text-gray-800">{process.distribution_date ? new Date(process.distribution_date).toLocaleDateString('pt-BR') : '-'}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Justiça</span>
              <span className="text-sm font-medium text-gray-800">{process.justice_type || '-'}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Instância</span>
              <span className="text-sm font-medium text-gray-800">{process.instance || '-'}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Classe</span>
              <span className="text-sm font-medium text-gray-800">{process.process_class || '-'}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Assunto</span>
              <span className="text-sm font-medium text-gray-800">{process.subject || '-'}</span>
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex justify-between items-center">
            <span className="text-xs uppercase font-bold text-blue-600">Valor da Causa</span>
            <span className="text-lg font-bold text-blue-900">{process.cause_value || 'R$ 0,00'}</span>
          </div>
        </div>
        
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 shrink-0">
          <button 
            onClick={onClose} 
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Fechar
          </button>
          <button 
            onClick={onEdit} 
            className="px-4 py-2 bg-salomao-blue text-white rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors flex items-center"
          >
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </button>
        </div>
      </div>
    </div>
  );
}