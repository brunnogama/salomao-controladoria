import { Plus, X, Save, Settings, Check, ChevronDown, Clock, History as HistoryIcon, ArrowRight, Edit, Trash2, CalendarCheck, Hourglass } from 'lucide-react';
import { Contract, Partner, ContractProcess, TimelineEvent } from '../../types';
import { maskCNPJ, maskMoney, maskHon, maskCNJ, toTitleCase } from '../../utils/masks';

const UFS = [
  { sigla: 'AC', nome: 'Acre' }, { sigla: 'AL', nome: 'Alagoas' }, { sigla: 'AP', nome: 'Amapá' },
  { sigla: 'AM', nome: 'Amazonas' }, { sigla: 'BA', nome: 'Bahia' }, { sigla: 'CE', nome: 'Ceará' },
  { sigla: 'DF', nome: 'Distrito Federal' }, { sigla: 'ES', nome: 'Espírito Santo' }, { sigla: 'GO', nome: 'Goiás' },
  { sigla: 'MA', nome: 'Maranhão' }, { sigla: 'MT', nome: 'Mato Grosso' }, { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MG', nome: 'Minas Gerais' }, { sigla: 'PA', nome: 'Pará' }, { sigla: 'PB', nome: 'Paraíba' },
  { sigla: 'PR', nome: 'Paraná' }, { sigla: 'PE', nome: 'Pernambuco' }, { sigla: 'PI', nome: 'Piauí' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' }, { sigla: 'RN', nome: 'Rio Grande do Norte' }, { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'RO', nome: 'Rondônia' }, { sigla: 'RR', nome: 'Roraima' }, { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SP', nome: 'São Paulo' }, { sigla: 'SE', nome: 'Sergipe' }, { sigla: 'TO', nome: 'Tocantins' }
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  formData: Contract;
  setFormData: (c: Contract) => void;
  onSave: () => void;
  loading: boolean;
  isEditing: boolean;
  partners: Partner[];
  onOpenPartnerManager: () => void;
  onCNPJSearch: () => void;
  // Processos
  processes: ContractProcess[];
  currentProcess: ContractProcess;
  setCurrentProcess: (p: ContractProcess) => void;
  editingProcessIndex: number | null;
  handleProcessAction: () => void;
  editProcess: (idx: number) => void;
  removeProcess: (idx: number) => void;
  // Honorários
  newIntermediateFee: string;
  setNewIntermediateFee: (v: string) => void;
  addIntermediateFee: () => void;
  removeIntermediateFee: (idx: number) => void;
  // Timeline
  timelineData: TimelineEvent[];
  getStatusColor: (s: string) => string;
  getStatusLabel: (s: string) => string;
}

// --- FUNÇÕES DE DATA INTELIGENTE ---

// Retorna a data de negócio correta baseada no status
const getEffectiveDate = (status: string, defaultDate: string, formData: Contract) => {
  let businessDate = null;

  switch (status) {
    case 'analysis':
      businessDate = formData.prospect_date;
      break;
    case 'proposal':
      businessDate = formData.proposal_date;
      break;
    case 'active':
      businessDate = formData.contract_date;
      break;
    case 'rejected':
      businessDate = formData.rejection_date;
      break;
    case 'probono':
      businessDate = formData.probono_date;
      break;
  }

  // Se existir uma data de negócio preenchida, usa ela. Senão, usa a data do registro (changed_at).
  // Adicionamos 'T12:00:00' para evitar problemas de fuso horário ao converter string YYYY-MM-DD
  return businessDate ? new Date(businessDate + 'T12:00:00') : new Date(defaultDate);
};

// Calcula duração entre duas datas
const getDuration = (startDate: Date, endDate: Date) => {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

  if (diffDays === 0) return 'Mesmo dia';
  if (diffDays > 30) {
    const months = Math.floor(diffDays / 30);
    const days = diffDays % 30;
    return days > 0 ? `${months} meses e ${days} dias` : `${months} meses`;
  }
  return `${diffDays} dias`;
};

// Calcula o tempo total do início ao fim usando as datas efetivas
const getTotalDuration = (timelineData: TimelineEvent[], formData: Contract) => {
  if (timelineData.length === 0) return '0 dias';
  
  // O evento mais antigo (início)
  const firstEvent = timelineData[timelineData.length - 1];
  const firstDate = getEffectiveDate(firstEvent.new_status, firstEvent.changed_at, formData);
  
  // O evento mais recente (estado atual)
  const lastEvent = timelineData[0];
  const lastDate = getEffectiveDate(lastEvent.new_status, lastEvent.changed_at, formData);
  
  return getDuration(firstDate, lastDate);
};

export function ContractFormModal({
  isOpen, onClose, formData, setFormData, onSave, loading, isEditing,
  partners, onOpenPartnerManager, onCNPJSearch,
  processes, currentProcess, setCurrentProcess, editingProcessIndex, handleProcessAction, editProcess, removeProcess,
  newIntermediateFee, setNewIntermediateFee, addIntermediateFee, removeIntermediateFee,
  timelineData, getStatusColor, getStatusLabel
}: Props) {
  if (!isOpen) return null;

  const handleTextChange = (field: keyof Contract, value: string) => {
    setFormData({ ...formData, [field]: toTitleCase(value) });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[50] p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[95vh] animate-in fade-in zoom-in duration-200">
        
        {/* HEADER */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{isEditing ? 'Editar Caso' : 'Novo Caso'}</h2>
            <p className="text-xs text-gray-500 uppercase tracking-wider">{isEditing ? 'Visualização e Edição Completa' : 'Cadastro Unificado'}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          
          {/* STATUS SELECTOR */}
          <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100">
            <label className="block text-sm font-bold text-gray-700 mb-2">Status Atual do Caso</label>
            <div className="relative">
              <select 
                className="w-full p-3 border border-blue-200 rounded-lg bg-white font-medium text-salomao-blue appearance-none focus:ring-2 focus:ring-salomao-blue outline-none"
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value as any})}
              >
                <option value="analysis">Sob Análise</option>
                <option value="proposal">Proposta Enviada</option>
                <option value="active">Contrato Fechado</option>
                <option value="rejected">Rejeitada</option>
                <option value="probono">Probono</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-salomao-blue w-5 h-5 pointer-events-none" />
            </div>
          </div>

          {/* DADOS DO CLIENTE */}
          <section className="space-y-5">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b pb-2">Dados do Cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">CNPJ/CPF</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    disabled={formData.has_no_cnpj} 
                    className="flex-1 border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-salomao-blue disabled:bg-gray-100" 
                    placeholder="00.000.000/0000-00" 
                    value={formData.cnpj} 
                    onChange={(e) => setFormData({...formData, cnpj: maskCNPJ(e.target.value)})}
                  />
                  <button 
                    onClick={onCNPJSearch} 
                    disabled={formData.has_no_cnpj || !formData.cnpj} 
                    className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2.5 rounded-lg border border-gray-300 disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center mt-2">
                  <input 
                    type="checkbox" 
                    id="no_cnpj" 
                    className="rounded text-salomao-blue focus:ring-salomao-blue" 
                    checked={formData.has_no_cnpj} 
                    onChange={(e) => setFormData({...formData, has_no_cnpj: e.target.checked, cnpj: ''})}
                  />
                  <label htmlFor="no_cnpj" className="ml-2 text-xs text-gray-500">Sem CNPJ (Pessoa Física)</label>
                </div>
              </div>

              <div className="md:col-span-6">
                <label className="block text-xs font-medium text-gray-600 mb-1">Nome do Cliente</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-salomao-blue" 
                  value={formData.client_name} 
                  onChange={(e) => handleTextChange('client_name', e.target.value)} 
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">Posição no Processo</label>
                <div className="relative">
                  <select 
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white appearance-none" 
                    value={formData.client_position} 
                    onChange={(e) => setFormData({...formData, client_position: e.target.value})}
                  >
                    <option value="Autor">Autor</option>
                    <option value="Réu">Réu</option>
                    <option value="Terceiro">Terceiro Interessado</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Estado (UF)</label>
                <div className="relative">
                  <select 
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white appearance-none" 
                    value={formData.uf} 
                    onChange={(e) => setFormData({...formData, uf: e.target.value})}
                  >
                    <option value="">Selecione...</option>
                    {UFS.map(uf => <option key={uf.sigla} value={uf.sigla}>{uf.nome}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Área do Direito</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" 
                  placeholder="Ex: Trabalhista, Cível..." 
                  value={formData.area} 
                  onChange={(e) => handleTextChange('area', e.target.value)} 
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Responsável (Sócio)</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <select 
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white appearance-none" 
                      value={formData.partner_id} 
                      onChange={(e) => setFormData({...formData, partner_id: e.target.value})}
                    >
                      <option value="">Selecione...</option>
                      {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  </div>
                  <button 
                    onClick={onOpenPartnerManager} 
                    className="bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg px-3 text-gray-600 transition-colors" 
                    title="Gerenciar Sócios"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* PROCESSOS JUDICIAIS */}
          <section className="space-y-4 bg-gray-50 p-5 rounded-xl border border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Processos Judiciais</h3>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="no_process" 
                  checked={!formData.has_legal_process} 
                  onChange={(e) => setFormData({...formData, has_legal_process: !e.target.checked})} 
                  className="rounded text-salomao-blue" 
                />
                <label htmlFor="no_process" className="ml-2 text-xs text-gray-600">Caso sem processo judicial</label>
              </div>
            </div>

            {formData.has_legal_process && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Contrário (Parte Oposta)</label>
                  <input 
                    type="text" 
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white" 
                    placeholder="Nome da parte contrária" 
                    value={formData.company_name} 
                    onChange={(e) => handleTextChange('company_name', e.target.value)} 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="md:col-span-3">
                    <label className="text-[10px] text-gray-500 uppercase font-bold">Número CNJ</label>
                    <input 
                      type="text" 
                      className="w-full border-b border-gray-300 focus:border-salomao-blue outline-none py-1 text-sm font-mono" 
                      placeholder="0000000-00..." 
                      value={currentProcess.process_number} 
                      onChange={(e) => setCurrentProcess({...currentProcess, process_number: maskCNJ(e.target.value)})} 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[10px] text-gray-500 uppercase font-bold">Valor Causa</label>
                    <input 
                      type="text" 
                      className="w-full border-b border-gray-300 focus:border-salomao-blue outline-none py-1 text-sm" 
                      value={currentProcess.cause_value} 
                      onChange={(e) => setCurrentProcess({...currentProcess, cause_value: maskMoney(e.target.value)})} 
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="text-[10px] text-gray-500 uppercase font-bold">Tribunal / Vara</label>
                    <input 
                      type="text" 
                      className="w-full border-b border-gray-300 focus:border-salomao-blue outline-none py-1 text-sm" 
                      value={currentProcess.court} 
                      onChange={(e) => setCurrentProcess({...currentProcess, court: e.target.value})} 
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="text-[10px] text-gray-500 uppercase font-bold">Juiz</label>
                    <input 
                      type="text" 
                      className="w-full border-b border-gray-300 focus:border-salomao-blue outline-none py-1 text-sm" 
                      value={currentProcess.judge} 
                      onChange={(e) => setCurrentProcess({...currentProcess, judge: e.target.value})} 
                    />
                  </div>
                  <div className="md:col-span-1">
                    <button 
                      onClick={handleProcessAction} 
                      className="w-full bg-salomao-blue text-white rounded p-1.5 hover:bg-blue-900 transition-colors"
                    >
                      {editingProcessIndex !== null ? <Check className="w-4 h-4 mx-auto" /> : <Plus className="w-4 h-4 mx-auto" />}
                    </button>
                  </div>
                </div>

                {processes.length > 0 && (
                  <div className="space-y-2">
                    {processes.map((p, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:border-blue-200 transition-colors group">
                        <div className="grid grid-cols-4 gap-4 flex-1 text-xs">
                          <span className="font-mono font-medium text-gray-800">{p.process_number}</span>
                          <span className="text-gray-600">{p.cause_value}</span>
                          <span className="text-gray-500">{p.court}</span>
                          <span className="text-gray-500 truncate">{p.judge}</span>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => editProcess(idx)} className="text-blue-500 hover:bg-blue-50 p-1 rounded">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => removeProcess(idx)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* FASES E CONDICIONAIS */}
          <section className="border-t pt-6">
            <h3 className="text-sm font-bold text-salomao-gold uppercase tracking-wider mb-6 flex items-center">
              <Clock className="w-4 h-4 mr-2" />Detalhes da Fase: {getStatusLabel(formData.status)}
            </h3>

            {formData.status === 'analysis' && (
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-medium block mb-1">Data Prospect</label>
                  <input type="date" className="w-full border border-gray-300 p-2.5 rounded-lg text-sm" value={formData.prospect_date} onChange={e => setFormData({...formData, prospect_date: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1">Analisado Por</label>
                  <input type="text" className="w-full border border-gray-300 p-2.5 rounded-lg text-sm" value={formData.analyzed_by} onChange={e => setFormData({...formData, analyzed_by: toTitleCase(e.target.value)})} />
                </div>
              </div>
            )}

            {(formData.status === 'proposal' || formData.status === 'active') && (
              <div className="space-y-6 animate-in slide-in-from-top-2">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                   <div>
                     <label className="text-xs font-medium block mb-1">Data Proposta</label>
                     <input type="date" className="w-full border border-gray-300 p-2.5 rounded-lg text-sm" value={formData.proposal_date} onChange={e => setFormData({...formData, proposal_date: e.target.value})} />
                   </div>
                   <div>
                     <label className="text-xs font-medium block mb-1">Pró-Labore (R$)</label>
                     <input type="text" className="w-full border border-gray-300 p-2.5 rounded-lg text-sm" value={formData.pro_labore} onChange={e => setFormData({...formData, pro_labore: maskMoney(e.target.value)})} />
                   </div>
                   <div>
                     <label className="text-xs font-medium block mb-1">Êxito Final (R$)</label>
                     <input type="text" className="w-full border border-gray-300 p-2.5 rounded-lg text-sm" value={formData.final_success_fee} onChange={e => setFormData({...formData, final_success_fee: maskMoney(e.target.value)})} />
                   </div>
                   <div>
                     <label className="text-xs font-medium block mb-1">Êxito Final (%)</label>
                     <input type="text" className="w-full border border-gray-300 p-2.5 rounded-lg text-sm" placeholder="Ex: 20%" value={formData.final_success_percent} onChange={e => setFormData({...formData, final_success_percent: e.target.value})} />
                   </div>
                </div>
                
                {/* LINHA DE HONORÁRIOS DINÂMICOS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  
                  {/* ÊXITOS INTERMEDIÁRIOS */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Êxitos Intermediários</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        className="flex-1 border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-salomao-blue" 
                        placeholder="R$ 0,00" 
                        value={newIntermediateFee} 
                        onChange={e => setNewIntermediateFee(maskMoney(e.target.value))} 
                      />
                      <button 
                        onClick={addIntermediateFee} 
                        className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2.5 rounded-lg border border-gray-300 transition-colors"
                        title="Adicionar"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.intermediate_fees?.map((fee, idx) => (
                        <span key={idx} className="bg-blue-50 border border-blue-100 px-3 py-1 rounded-full text-xs text-blue-800 flex items-center shadow-sm">
                          {fee}
                          <button onClick={() => removeIntermediateFee(idx)} className="ml-2 text-blue-400 hover:text-red-500">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* OUTROS HONORÁRIOS E TIMESHEET */}
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-xs font-medium text-gray-600 block mb-1">Outros Honorários</label>
                      <input 
                        type="text" 
                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-salomao-blue" 
                        placeholder="Descrição/Valor" 
                        value={formData.other_fees} 
                        onChange={e => setFormData({...formData, other_fees: toTitleCase(e.target.value)})} 
                      />
                    </div>
                    <div className="flex items-end pb-3">
                       <div className="flex items-center">
                         <input 
                           type="checkbox" 
                           id="timesheet" 
                           checked={formData.timesheet} 
                           onChange={e => setFormData({...formData, timesheet: e.target.checked})} 
                           className="w-4 h-4 text-salomao-blue rounded border-gray-300 focus:ring-salomao-blue" 
                         />
                         <label htmlFor="timesheet" className="ml-2 text-sm text-gray-700 font-medium whitespace-nowrap">Hon. de Timesheet</label>
                       </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {formData.status === 'active' && (
              <div className="mt-6 p-4 bg-green-50 border border-green-100 rounded-xl animate-in fade-in">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium block mb-1 text-green-800">Número HON (Único)</label>
                    <input type="text" className="w-full border-2 border-green-200 p-2.5 rounded-lg text-green-900 font-mono font-bold" placeholder="0000000/000" value={formData.hon_number} onChange={e => setFormData({...formData, hon_number: maskHon(e.target.value)})} />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1">Data Assinatura</label>
                    <input type="date" className="w-full border border-gray-300 p-2.5 rounded-lg" value={formData.contract_date} onChange={e => setFormData({...formData, contract_date: e.target.value})} />
                  </div>
                </div>
              </div>
            )}

            {formData.status === 'rejected' && (
              <div className="grid grid-cols-3 gap-4">
                <input type="date" className="border p-2 rounded" onChange={e => setFormData({...formData, rejection_date: e.target.value})} />
                <select className="border p-2 rounded" onChange={e => setFormData({...formData, rejected_by: e.target.value})}>
                  <option>Rejeitado por...</option>
                  <option>Cliente</option>
                  <option>Escritório</option>
                </select>
                <select className="border p-2 rounded" onChange={e => setFormData({...formData, rejection_reason: e.target.value})}>
                  <option>Motivo...</option>
                  <option>Cliente declinou</option>
                  <option>Cliente não retornou</option>
                  <option>Caso ruim</option>
                  <option>Conflito de interesses</option>
                </select>
              </div>
            )}
          </section>

          {/* OBSERVAÇÕES */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Observações Gerais</label>
            <textarea 
              className="w-full border border-gray-300 rounded-lg p-3 text-sm h-24 focus:ring-2 focus:ring-salomao-blue outline-none" 
              value={formData.observations} 
              onChange={(e) => setFormData({...formData, observations: toTitleCase(e.target.value)})}
            ></textarea>
          </div>

          {/* TIMELINE VISUAL */}
          {isEditing && timelineData.length > 0 && (
            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center">
                  <HistoryIcon className="w-4 h-4 mr-2" /> Timeline do Caso
                </h3>
                <span className="bg-salomao-gold/10 text-salomao-gold px-3 py-1 rounded-full text-xs font-bold border border-salomao-gold/20 flex items-center">
                  <Hourglass className="w-3 h-3 mr-1" /> Total: {getTotalDuration(timelineData, formData)}
                </span>
              </div>

              <div className="relative border-l-2 border-gray-100 ml-3 space-y-8 pb-4">
                {timelineData.map((t, idx) => {
                  // Calcular duração usando as datas reais do form (se disponíveis)
                  const currentEventDate = getEffectiveDate(t.new_status, t.changed_at, formData);
                  const nextEvent = timelineData[idx + 1];
                  
                  let duration = 'Início';
                  if (nextEvent) {
                    const prevEventDate = getEffectiveDate(nextEvent.new_status, nextEvent.changed_at, formData);
                    duration = getDuration(prevEventDate, currentEventDate);
                  }

                  const isCurrent = idx === 0;

                  return (
                    <div key={t.id} className="relative pl-8">
                      {/* Bolinha da Timeline */}
                      <span className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 ${isCurrent ? 'bg-salomao-blue border-blue-200' : 'bg-gray-200 border-white'}`}></span>
                      
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between bg-gray-50 p-4 rounded-lg border border-gray-100 hover:border-blue-100 transition-colors">
                        <div>
                          <h4 className={`text-sm font-bold ${isCurrent ? 'text-salomao-blue' : 'text-gray-600'}`}>
                            {getStatusLabel(t.new_status)}
                          </h4>
                          <p className="text-xs text-gray-400 mt-1 flex items-center">
                            <CalendarCheck className="w-3 h-3 mr-1" />
                            {/* Mostra a data efetiva (negócio) ou a data de sistema se não houver data de negócio */}
                            {currentEventDate.toLocaleDateString('pt-BR')}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Alterado por: <span className="font-medium text-gray-600">{t.changed_by}</span>
                          </p>
                        </div>

                        {/* Badge de Duração */}
                        <div className="mt-2 sm:mt-0 flex flex-col items-end">
                          <span className="text-[10px] uppercase font-bold text-gray-400 mb-1">Duração da fase anterior</span>
                          <span className="bg-white px-2 py-1 rounded border border-gray-200 text-xs font-mono text-gray-600 shadow-sm">
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

        {/* FOOTER */}
        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
          <button 
            onClick={onClose} 
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={onSave} 
            disabled={loading} 
            className="px-6 py-2 bg-salomao-blue text-white rounded-lg hover:bg-blue-900 shadow-lg flex items-center transition-all transform active:scale-95"
          >
            {loading ? 'Salvando...' : <><Save className="w-4 h-4 mr-2" /> Salvar Caso</>}
          </button>
        </div>
      </div>
    </div>
  );
}