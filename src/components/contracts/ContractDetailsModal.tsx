import React from 'react';
import { X, Edit, Trash2, Calendar, User, FileText, Briefcase, MapPin, History as HistoryIcon, Hourglass, CalendarCheck, ArrowDown } from 'lucide-react';
import { Contract, ContractProcess } from '../../types';

// Interface interna para os eventos construídos a partir das datas do formulário
interface InternalTimelineEvent {
  label: string;
  date: string; // YYYY-MM-DD
  status: string;
  color: string;
}

const getDurationBetween = (startDateStr: string, endDateStr: string): string => {
  if (!startDateStr || !endDateStr) return '-';
  
  const start = new Date(startDateStr + 'T12:00:00');
  const end = new Date(endDateStr + 'T12:00:00');
  
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
  
  if (diffDays === 0) return 'Mesmo dia';
  if (diffDays > 30) {
    const months = Math.floor(diffDays / 30);
    const days = diffDays % 30;
    return days > 0 ? `${months} meses e ${days} dias` : `${months} meses`;
  }
  return `${diffDays} dias`;
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract | null;
  onEdit: () => void;
  onDelete: () => void;
  processes: ContractProcess[];
}

export function ContractDetailsModal({ isOpen, onClose, contract, onEdit, onDelete, processes }: Props) {
  if (!isOpen || !contract) return null;

  // 1. CONSTRUÇÃO DA TIMELINE BASEADA NAS DATAS INTERNAS
  const buildInternalTimeline = (): InternalTimelineEvent[] => {
    const events: InternalTimelineEvent[] = [];

    // Adiciona eventos apenas se a data interna estiver preenchida no formulário
    if (contract.prospect_date) {
      events.push({ label: 'Sob Análise (Prospect)', date: contract.prospect_date, status: 'analysis', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' });
    }
    if (contract.proposal_date) {
      events.push({ label: 'Proposta Enviada', date: contract.proposal_date, status: 'proposal', color: 'bg-blue-100 text-blue-800 border-blue-200' });
    }
    if (contract.contract_date) {
      events.push({ label: 'Contrato Fechado (Ativo)', date: contract.contract_date, status: 'active', color: 'bg-green-100 text-green-800 border-green-200' });
    }
    if (contract.rejection_date) {
      events.push({ label: 'Rejeitado', date: contract.rejection_date, status: 'rejected', color: 'bg-red-100 text-red-800 border-red-200' });
    }
    if (contract.probono_date) {
      events.push({ label: 'Probono', date: contract.probono_date, status: 'probono', color: 'bg-purple-100 text-purple-800 border-purple-200' });
    }

    // Ordena cronologicamente (Data mais antiga primeiro)
    return events.sort((a, b) => a.date.localeCompare(b.date));
  };

  const timelineEvents = buildInternalTimeline();

  // Cálculo da duração total (Primeiro evento -> Último evento)
  const getTotalDuration = () => {
    if (timelineEvents.length < 2) return '0 dias';
    const first = timelineEvents[0];
    const last = timelineEvents[timelineEvents.length - 1];
    return getDurationBetween(first.date, last.date);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'analysis': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'proposal': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'probono': return 'bg-purple-100 text-purple-800 border-purple-200';
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
          
          {/* Ações */}
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

          {/* --- TIMELINE DE STATUS (DATAS INTERNAS) --- */}
          {timelineEvents.length > 0 && (
            <div className="border-t border-gray-100 pt-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center">
                  <HistoryIcon className="w-4 h-4 mr-2" /> Timeline (Datas do Processo)
                </h3>
                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold border border-gray-200 flex items-center">
                  <Hourglass className="w-3 h-3 mr-1" /> Duração Total: {getTotalDuration()}
                </span>
              </div>
              
              <div className="relative border-l-2 border-gray-100 ml-3 space-y-0 pb-4">
                {timelineEvents.map((event, idx) => {
                  const isLast = idx === timelineEvents.length - 1;
                  const nextEvent = !isLast ? timelineEvents[idx + 1] : null;
                  
                  // Calcula duração até o próximo evento (se existir)
                  const durationToNext = nextEvent 
                    ? getDurationBetween(event.date, nextEvent.date)
                    : null;

                  return (
                    <div key={idx} className="relative pl-8 pb-8 last:pb-0 group">
                      {/* Bolinha da Timeline */}
                      <span className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 ${event.status === contract.status ? 'bg-salomao-blue border-blue-200 scale-110' : 'bg-white border-gray-300'}`}></span>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:border-blue-200 transition-colors">
                        <div>
                          <div className="flex items-center gap-2">
                             <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${event.color}`}>
                                {event.label}
                             </span>
                          </div>
                          <p className="text-sm font-bold text-gray-700 mt-2 flex items-center">
                            <CalendarCheck className="w-4 h-4 mr-2 text-gray-400" /> 
                            {new Date(event.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                          </p>
                        </div>

                        {/* Se houver próximo evento, mostra a duração entre eles */}
                        {durationToNext && (
                           <div className="mt-3 sm:mt-0 flex items-center text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                              <ArrowDown className="w-3 h-3 mr-1" />
                              {durationToNext} até a próxima fase
                           </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {timelineEvents.length === 0 && (
             <div className="text-center py-8 border-t border-gray-100 text-gray-400 text-sm">
                 Nenhuma data interna (Prospect, Proposta, etc.) preenchida neste contrato.
             </div>
          )}

        </div>
      </div>
    </div>
  );
}