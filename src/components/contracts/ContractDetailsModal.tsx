import React from 'react';
import { X, Edit, Trash2, Calendar, User, FileText, Briefcase, MapPin, History as HistoryIcon, Hourglass, CalendarCheck, ArrowDown, Calculator, Paperclip, CheckCircle2 } from 'lucide-react';
import { Contract, ContractProcess, ContractDocument } from '../../types';
import { parseCurrency } from '../../utils/masks'; // Assumindo que parseCurrency está exportado aqui, conforme visto no seu FormModal

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

// Função auxiliar para formatar moeda apenas para exibição
const formatMoney = (val: number) => {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract | null;
  onEdit: () => void;
  onDelete: () => void;
  processes: ContractProcess[];
  documents?: ContractDocument[]; // Adicionado para receber a lista de documentos
}

export function ContractDetailsModal({ isOpen, onClose, contract, onEdit, onDelete, processes, documents = [] }: Props) {
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

  // --- LÓGICA DE CÁLCULO FINANCEIRO ---
  const calculateFinancials = () => {
    const isFinancialRelevant = ['proposal', 'active'].includes(contract.status);

    // Valores Base
    const proLaboreBase = parseCurrency(contract.pro_labore);
    const finalFeeBase = parseCurrency(contract.final_success_fee);

    // Extras Pró-Labore
    const proLaboreExtrasTotal = (contract as any).pro_labore_extras?.reduce((acc: number, item: any) => acc + parseCurrency(item.value), 0) || 0;
    
    // Êxito Intermediário (Lista de strings monetárias)
    const intermediateTotal = contract.intermediate_fees?.reduce((acc: number, val: string) => acc + parseCurrency(val), 0) || 0;

    // Extras Êxito Final
    const finalFeeExtrasTotal = (contract as any).final_success_extras?.reduce((acc: number, item: any) => acc + parseCurrency(item.value), 0) || 0;

    // Totais por Categoria
    const totalProLabore = proLaboreBase + proLaboreExtrasTotal;
    const totalFinalFee = finalFeeBase + finalFeeExtrasTotal;
    
    // Soma Geral (Apenas monetária)
    const grandTotal = totalProLabore + intermediateTotal + totalFinalFee;

    return {
      showTotals: isFinancialRelevant,
      totalProLabore,
      totalFinalFee,
      intermediateTotal,
      grandTotal,
      hasProLaboreExtras: proLaboreExtrasTotal > 0,
      hasFinalFeeExtras: finalFeeExtrasTotal > 0,
      hasIntermediate: intermediateTotal > 0
    };
  };

  const financials = calculateFinancials();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      {/* Tamanho aumentado para max-w-7xl */}
      <div className="bg-white w-full max-w-7xl rounded-3xl shadow-2xl flex flex-col max-h-[95vh] animate-in zoom-in-95 overflow-hidden">
        
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
              {/* Sinalização de Arquivo Vinculado */}
              {documents.length > 0 && (
                <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100" title={`${documents.length} arquivo(s) vinculado(s)`}>
                  <Paperclip className="w-3 h-3" /> {documents.length} Anexo(s)
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
                  <label className="text-xs text-gray-400 block">Documento (CNPJ/CPF)</label>
                  <div className="text-gray-800 font-mono mt-1">{contract.cnpj || 'Não informado'}</div>
                </div>
                {/* Referência (se houver) */}
                {(contract as any).reference_text && (
                  <div className="mt-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <label className="text-xs text-gray-400 block font-bold mb-1">Referência</label>
                    <p className="text-xs text-gray-700 italic line-clamp-3">{(contract as any).reference_text}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Coluna 2: Financeiro (Dinâmica) */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2 flex items-center justify-between">
                Financeiro
                {financials.showTotals && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-200">Consolidado</span>}
              </h3>
              
              <div className="space-y-4">
                
                {/* Visualização Detalhada para Proposta/Ativo */}
                {financials.showTotals ? (
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase flex items-center">
                       <Calculator className="w-3 h-3 mr-2" /> Composição de Honorários
                    </div>
                    
                    <div className="divide-y divide-gray-100">
                      {/* Pró-Labore */}
                      <div className="px-4 py-3 flex justify-between items-center hover:bg-gray-50">
                         <div>
                           <p className="text-xs font-medium text-gray-600">Pró-Labore</p>
                           {financials.hasProLaboreExtras && <span className="text-[10px] text-gray-400">(Inclui extras)</span>}
                         </div>
                         <span className="text-sm font-bold text-gray-800">{formatMoney(financials.totalProLabore)}</span>
                      </div>

                      {/* Êxito Intermediário */}
                      {(financials.hasIntermediate) && (
                        <div className="px-4 py-3 flex justify-between items-center hover:bg-gray-50 bg-blue-50/30">
                           <p className="text-xs font-medium text-blue-600">Êxito Intermediário</p>
                           <span className="text-sm font-bold text-blue-800">{formatMoney(financials.intermediateTotal)}</span>
                        </div>
                      )}

                      {/* Êxito Final (R$) */}
                      <div className="px-4 py-3 flex justify-between items-center hover:bg-gray-50 bg-green-50/30">
                         <div>
                           <p className="text-xs font-medium text-green-600">Êxito Final (Valor)</p>
                           {financials.hasFinalFeeExtras && <span className="text-[10px] text-green-500">(Inclui extras)</span>}
                         </div>
                         <span className="text-sm font-bold text-green-800">{formatMoney(financials.totalFinalFee)}</span>
                      </div>

                      {/* TOTAL GERAL */}
                      <div className="px-4 py-4 bg-gray-50 flex justify-between items-center border-t border-gray-200">
                         <p className="text-sm font-black text-gray-800 uppercase">Total Geral</p>
                         <span className="text-lg font-black text-salomao-blue">{formatMoney(financials.grandTotal)}</span>
                      </div>
                    </div>

                    {/* Indicadores de Porcentagem (Não somados) */}
                    {(contract.final_success_percent || (contract as any).percent_extras) && (
                       <div className="px-4 py-2 bg-yellow-50 border-t border-yellow-100 flex flex-wrap gap-2 items-center">
                          <span className="text-[10px] font-bold text-yellow-700 uppercase">Indicadores (%):</span>
                          {contract.final_success_percent && <span className="text-xs font-bold text-yellow-800 bg-white px-2 py-0.5 rounded border border-yellow-200">{contract.final_success_percent} (Final)</span>}
                       </div>
                    )}
                  </div>
                ) : (
                  // Visualização Simples (Sob Análise, Rejeitado, etc)
                  <>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                      <label className="text-xs text-gray-500 block font-bold uppercase">Estimativa Pró-Labore</label>
                      <div className="text-gray-800 font-medium mt-1">{contract.pro_labore || '-'}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                       <label className="text-xs text-gray-500 block font-bold uppercase">Estimativa Êxito</label>
                       <div className="text-gray-800 font-medium mt-1">
                          {contract.final_success_fee || '-'} 
                          {contract.final_success_percent && <span className="ml-1 text-sm text-gray-500">({contract.final_success_percent})</span>}
                       </div>
                    </div>
                  </>
                )}
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
                    <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm hover:bg-gray-100 transition-colors flex flex-col gap-1">
                      <div className="font-mono font-bold text-salomao-blue text-xs flex items-center">
                        <CheckCircle2 className="w-3 h-3 mr-1.5 text-gray-400" />
                        {proc.process_number}
                      </div>
                      <div className="text-gray-700 font-medium text-xs ml-4">{proc.opponent}</div>
                      <div className="text-gray-500 text-[10px] ml-4">{proc.court} • {proc.uf} • {proc.vara || 'Vara não inf.'}</div>
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