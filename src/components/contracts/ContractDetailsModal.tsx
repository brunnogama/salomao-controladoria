import React from 'react';
import { X, Edit, Trash2, Calendar, User, FileText, Briefcase, MapPin, History as HistoryIcon, Hourglass, CalendarCheck } from 'lucide-react';
import { Contract, ContractProcess, TimelineEvent } from '../../types';

// Função para pegar a data de negócio correta baseada no status
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
    // Adiciona T12:00:00 para evitar problemas de timezone ao converter string YYYY-MM-DD
    return new Date(businessDateString + 'T12:00:00');
  }
  return null;
};

// Cálculo de duração entre datas
const getDurationBetween = (startDate: Date | null, endDate: Date | null): string => {
  if (!startDate || !endDate) return '-';

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

// Duração total baseada no primeiro e último evento da timeline (usando datas de negócio)
const getTotalDuration = (timelineData: TimelineEvent[], contract: Contract) => {
  if (timelineData.length === 0) return '0 dias';
  const latestEvent = timelineData[0]; // Mais recente
  const oldestEvent = timelineData[timelineData.length - 1]; // Mais antigo
  
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
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${getStatusColor(contract.status)}`}>
                {getStatusLabel(contract.status)}
              </span>
              {contract.hon_number && (
                <span className="font-mono text-xs text-gray-500 bg-white border border-gray-200 px-2 py-1 rounded">
                  HON: {contract.hon_number}
                </span>
              )}
            </div>
            <h2 className="text-3xl font-bold text-gray-900 leading-tight">{contract.client_name}</h2>
            <div className="flex items-center gap-4 mt-2 text-gray-500 text-sm">
              <span className="flex items-center"><Briefcase className="w-4 h-4 mr-1.5" /> {contract.area}</span>
              <span className="flex items-center"><MapPin className="w-4 h-4 mr-1.5" /> {contract.uf}</span>
            </div>
          </div>
          
          {/* Ações: Editar e Excluir */}
          <div className="flex gap-2">
            <button onClick={onEdit} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors" title="Editar">
              <Edit className="w-5 h-5" />
            </button>
            <button onClick={onDelete} className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors" title="Excluir">
              <Trash2 className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="p-3 bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-200 ml-2 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Coluna 1: Dados Gerais */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">Dados Gerais</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 block">Sócio Responsável</label>
                  <div className="flex items-center gap-2 mt-1 text-gray-800 font-medium">
                    <User className="w-4 h-4 text-salomao-blue" /> {contract.partner_name || '-'}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block">Analista</label>
                  <div className="flex items-center gap-2 mt-1 text-gray-800 font-medium">
                    <User className="w-4 h-4 text-purple-500" /> {contract.analyzed_by_name || '-'}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block">Data Prospect</label>
                  <div className="flex items-center gap-2 mt-1 text-gray-800">
                    <Calendar className="w-4 h-4 text-gray-400" /> 
                    {contract.prospect_date ? new Date(contract.prospect_date + 'T12:00:00').toLocaleDateString() : '-'}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block">Documento</label>
                  <div className="text-gray-800 font-mono mt-1">{contract.cnpj || 'Não informado'}</div>
                </div>
              </div>
            </div>

            {/* Coluna 2: Financeiro */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">Financeiro</h3>
              <div className="space-y-4">
                <div className="bg-green-50 p-3 rounded-xl border border-green-100">
                  <label className="text-xs text-green-600 block font-bold uppercase">Êxito Final</label>
                  <div className="text-xl font-bold text-green-800 mt-1">
                    {contract.final_success_fee || '-'} 
                    <span className="text-sm font-normal text-green-600 ml-1">({contract.final_success_percent || '0%'})</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block">Pró-Labore</label>
                  <div className="text-gray-800 font-medium mt-1">{contract.pro_labore || '-'}</div>
                </div>
              </div>
            </div>

            {/* Coluna 3: Processos */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">Processos ({processes.length})</h3>
              {processes.length === 0 ? (
                <p className="text-sm text-gray-400 italic">Nenhum processo vinculado.</p>
              ) : (
                <div className="space-y-3">
                  {processes.map((proc, idx) => (
                    <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm hover:bg-gray-100 transition-colors">
                      <div className="font-mono font-bold text-gray-700 text-xs mb-1">{proc.process_number}</div>
                      <div className="text-gray-600 text-xs">{proc.court} • {proc.uf}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {contract.observations && (
            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
              <h4 className="text-xs font-bold text-yellow-700 uppercase mb-2 flex items-center">
                <FileText className="w-4 h-4 mr-1" /> Observações
              </h4>
              <p className="text-sm text-yellow-900 leading-relaxed">{contract.observations}</p>
            </div>
          )}

          {/* TIMELINE VISUALIZATION (DATAS INTERNAS) */}
          {timelineData.length > 0 && (
            <div className="border-t border-gray-100 pt-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center">
                  <HistoryIcon className="w-4 h-4 mr-2" /> Histórico (Datas de Negócio)
                </h3>
                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold border border-gray-200 flex items-center">
                  <Hourglass className="w-3 h-3 mr-1" /> Total: {getTotalDuration(timelineData, contract)}
                </span>
              </div>
              
              <div className="relative border-l-2 border-gray-100 ml-3 space-y-8 pb-4">
                {timelineData.map((t, idx) => {
                  // Pega a data de negócio associada ao status deste evento
                  const currentEventDate = getEffectiveDate(t.new_status, contract);
                  
                  // Pega o próximo evento (que é o anterior cronologicamente na lista desc)
                  const nextEvent = timelineData[idx + 1];
                  const prevEventDate = nextEvent ? getEffectiveDate(nextEvent.new_status, contract) : null;
                  
                  // Calcula duração entre o evento anterior e este
                  const duration = nextEvent 
                    ? getDurationBetween(prevEventDate, currentEventDate) 
                    : 'Início';
                  
                  return (
                    <div key={t.id} className="relative pl-8 group">
                      <span className="absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 bg-gray-300 border-white group-first:bg-salomao-blue group-first:border-blue-100"></span>
                      
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:border-blue-200 transition-colors">
                        <div>
                          <h4 className="text-sm font-bold text-gray-600 group-first:text-salomao-blue">{getStatusLabel(t.new_status)}</h4>
                          <p className="text-xs text-gray-400 mt-1 flex items-center">
                            <CalendarCheck className="w-3 h-3 mr-1" /> 
                            {currentEventDate ? currentEventDate.toLocaleDateString('pt-BR') : 'Data n/a'}
                          </p>
                          <p className="text-[10px] text-gray-300 mt-1">Alterado por: {t.changed_by}</p>
                        </div>
                        <div className="mt-2 sm:mt-0 flex flex-col items-end">
                          <span className="text-[10px] uppercase font-bold text-gray-400 mb-1">
                            {nextEvent ? 'Duração Fase Anterior' : 'Origem'}
                          </span>
                          <span className="bg-gray-50 px-2 py-1 rounded border border-gray-200 text-xs font-mono text-gray-600">
                            {duration}
                          </span>
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