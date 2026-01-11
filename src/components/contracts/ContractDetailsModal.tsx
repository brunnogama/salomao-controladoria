import React from 'react';
import { X, Edit, Trash2, Calendar, User, FileText, Briefcase, MapPin, History as HistoryIcon, Hourglass, CalendarCheck } from 'lucide-react';
import { Contract, ContractProcess, TimelineEvent } from '../../types';

// Função para pegar a data de negócio (ou null se não existir)
const getEffectiveDate = (status: string, contract: Contract): Date | null => {
  let businessDateString = null;
  switch (status) {
    case 'analysis': businessDateString = contract.prospect_date; break;
    case 'proposal': businessDateString = contract.proposal_date; break;
    case 'active': businessDateString = contract.contract_date; break;
    case 'rejected': businessDateString = contract.rejection_date; break;
    case 'probono': businessDateString = contract.probono_date || contract.contract_date; break;
  }
  
  if (businessDateString) {
    return new Date(businessDateString + 'T12:00:00');
  }
  return null; // Retorna null se não houver data de negócio preenchida
};

// Função de duração segura contra nulos
const getDurationBetween = (startDate: Date | null, endDate: Date | null): string => {
  if (!startDate || !endDate) return '-'; // Ignora se faltar data

  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
  
  if (diffDays === 0) return 'Mesmo dia';
  if (diffDays > 30) {
    const months = Math.floor(diffDays / 30);
    const days = diffDays % 30;
    return days > 0 ? `${months} meses e ${days} dias` : `${months} meses`;
  }
  return `${diffDays} dias`;
};

const getTotalDuration = (timelineData: TimelineEvent[], contract: Contract) => {
  if (timelineData.length === 0) return '0 dias';
  const latestEvent = timelineData[0];
  const oldestEvent = timelineData[timelineData.length - 1];
  
  const endDate = getEffectiveDate(latestEvent.new_status, contract);
  const startDate = getEffectiveDate(oldestEvent.new_status, contract);
  
  return getDurationBetween(startDate, endDate);
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract | null;
  onEdit: () => void;
  onDelete: () => void;
  processes: ContractProcess[];
  timelineData: TimelineEvent[];
}

export function ContractDetailsModal({ isOpen, onClose, contract, onEdit, onDelete, processes, timelineData }: Props) {
  if (!isOpen || !contract) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'analysis': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'proposal': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const map: any = { analysis: 'Sob Análise', proposal: 'Proposta', active: 'Ativo', rejected: 'Rejeitado', probono: 'Probono' };
    return map[status] || status;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 overflow-hidden">
        {/* Header */}
        <div className="p-8 bg-gray-50 border-b border-gray-100 flex justify-between items-start relative">
          <div className="flex-1 pr-10">
            <div className="flex items-center gap-3 mb-3">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${getStatusColor(contract.status)}`}>{getStatusLabel(contract.status)}</span>
              {contract.hon_number && <span className="font-mono text-xs text-gray-500 bg-white border border-gray-200 px-2 py-1 rounded">HON: {contract.hon_number}</span>}
            </div>
            <h2 className="text-3xl font-bold text-gray-900 leading-tight">{contract.client_name}</h2>
            <div className="flex items-center gap-4 mt-2 text-gray-500 text-sm">
              <span className="flex items-center"><Briefcase className="w-4 h-4 mr-1.5" /> {contract.area}</span>
              <span className="flex items-center"><MapPin className="w-4 h-4 mr-1.5" /> {contract.uf}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={onEdit} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100" title="Editar"><Edit className="w-5 h-5" /></button>
            <button onClick={onDelete} className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100" title="Excluir"><Trash2 className="w-5 h-5" /></button>
            <button onClick={onClose} className="p-3 bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-200 ml-2"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Coluna 1 */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">Dados Gerais</h3>
              <div className="space-y-4">
                <div><label className="text-xs text-gray-400 block">Sócio Responsável</label><div className="flex items-center gap-2 mt-1 text-gray-800 font-medium"><User className="w-4 h-4 text-salomao-blue" /> {contract.partner_name || '-'}</div></div>
                <div><label className="text-xs text-gray-400 block">Analista</label><div className="flex items-center gap-2 mt-1 text-gray-800 font-medium"><User className="w-4 h-4 text-purple-500" /> {contract.analyzed_by_name || '-'}</div></div>
                <div><label className="text-xs text-gray-400 block">Data Prospect</label><div className="flex items-center gap-2 mt-1 text-gray-800"><Calendar className="w-4 h-4 text-gray-400" /> {contract.prospect_date ? new Date(contract.prospect_date).toLocaleDateString() : '-'}</div></div>
                <div><label className="text-xs text-gray-400 block">Documento</label><div className="text-gray-800 font-mono mt-1">{contract.cnpj || 'Não informado'}</div></div>
              </div>
            </div>
            {/* Coluna 2 */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">Financeiro</h3>
              <div className="space-y-4">
                <div className="bg-green-50 p-3 rounded-xl border border-green-100"><label className="text-xs text-green-600 block font-bold uppercase">Êxito Final</label><div className="text-xl font-bold text-green-800 mt-1">{contract.final_success_fee || '-'} <span className="text-sm font-normal text-green-600">({contract.final_success_percent || '0%'})</span></div></div>
                <div><label className="text-xs text-gray-400 block">Pró-Labore</label><div className="text-gray-800 font-medium mt-1">{contract.pro_labore || '-'}</div></div>
              </div>
            </div>
            {/* Coluna 3 */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">Processos ({processes.length})</h3>
              {processes.length === 0 ? <p className="text-sm text-gray-400 italic">Nenhum processo.</p> : (
                <div className="space-y-3">{processes.map((proc, idx) => (<div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm"><div className="font-mono font-bold text-gray-700 text-xs mb-1">{proc.process_number}</div><div className="text-gray-600">{proc.court}</div></div>))}</div>
              )}
            </div>
          </div>

          {contract.observations && (<div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100"><h4 className="text-xs font-bold text-yellow-700 uppercase mb-2 flex items-center"><FileText className="w-4 h-4 mr-1" /> Observações</h4><p className="text-sm text-yellow-900 leading-relaxed">{contract.observations}</p></div>)}

          {/* TIMELINE VISUALIZATION */}
          {timelineData.length > 0 && (
            <div className="border-t border-gray-100 pt-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center"><HistoryIcon className="w-4 h-4 mr-2" /> Histórico</h3>
                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold border border-gray-200 flex items-center"><Hourglass className="w-3 h-3 mr-1" /> Total: {getTotalDuration(timelineData, contract)}</span>
              </div>
              <div className="relative border-l-2 border-gray-100 ml-3 space-y-8 pb-4">
                {timelineData.map((t, idx) => {
                  // Lógica corrigida para não falhar com nulos
                  const currentEventDate = getEffectiveDate(t.new_status, contract);
                  const nextEvent = timelineData[idx + 1];
                  const prevEventDate = nextEvent ? getEffectiveDate(nextEvent.new_status, contract) : null;
                  
                  const duration = nextEvent 
                    ? getDurationBetween(prevEventDate, currentEventDate) 
                    : 'Início';
                  
                  return (
                    <div key={t.id} className="relative pl-8">
                      <span className="absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 bg-gray-300 border-white"></span>
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                        <div>
                          <h4 className="text-sm font-bold text-gray-600">{getStatusLabel(t.new_status)}</h4>
                          <p className="text-xs text-gray-400 mt-1 flex items-center">
                            <CalendarCheck className="w-3 h-3 mr-1" /> 
                            {currentEventDate ? currentEventDate.toLocaleDateString('pt-BR') : 'Data n/a'}
                          </p>
                        </div>
                        <div className="mt-2 sm:mt-0 flex flex-col items-end">
                          <span className="text-[10px] uppercase font-bold text-gray-400 mb-1">{nextEvent ? 'Duração Fase Anterior' : 'Origem'}</span>
                          <span className="bg-gray-50 px-2 py-1 rounded border border-gray-200 text-xs font-mono text-gray-600">{duration}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}