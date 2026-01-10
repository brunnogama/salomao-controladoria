import { Plus, X, Save, Settings, Check, ChevronDown, Clock, History as HistoryIcon, ArrowRight, Edit, Trash2 } from 'lucide-react';
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
        
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{isEditing ? 'Editar Caso' : 'Novo Caso'}</h2>
            <p className="text-xs text-gray-500 uppercase tracking-wider">{isEditing ? 'Visualização e Edição Completa' : 'Cadastro Unificado'}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500"><X className="w-6 h-6" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          
          <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100">
            <label className="block text-sm font-bold text-gray-700 mb-2">Status Atual do Caso</label>
            <div className="relative">
              <select 
                className="w-full p-3 border border-blue-200 rounded-lg bg-white font-medium text-salomao-blue appearance-none focus:ring-2 focus:ring-salomao-blue outline-none"
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value as any})}
              >
                <option value="analysis">Sob Análise</option><option value="proposal">Proposta Enviada</option><option value="active">Contrato Fechado</option><option value="rejected">Rejeitada</option><option value="probono">Probono</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-salomao-blue w-5 h-5 pointer-events-none" />
            </div>
          </div>

          <section className="space-y-5">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b pb-2">Dados do Cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">CNPJ/CPF</label>
                <div className="flex gap-2">
                  <input type="text" disabled={formData.has_no_cnpj} className="flex-1 border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-salomao-blue disabled:bg-gray-100" placeholder="00.000.000/0000-00" value={formData.cnpj} onChange={(e) => setFormData({...formData, cnpj: maskCNPJ(e.target.value)})}/>
                  <button onClick={onCNPJSearch} disabled={formData.has_no_cnpj || !formData.cnpj} className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2.5 rounded-lg border border-gray-300 disabled:opacity-50"><Plus className="w-4 h-4" /></button>
                </div>
                <div className="flex items-center mt-2"><input type="checkbox" id="no_cnpj" className="rounded text-salomao-blue focus:ring-salomao-blue" checked={formData.has_no_cnpj} onChange={(e) => setFormData({...formData, has_no_cnpj: e.target.checked, cnpj: ''})}/><label htmlFor="no_cnpj" className="ml-2 text-xs text-gray-500">Sem CNPJ (Pessoa Física)</label></div>
              </div>
              <div className="md:col-span-6"><label className="block text-xs font-medium text-gray-600 mb-1">Nome do Cliente</label><input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-salomao-blue" value={formData.client_name} onChange={(e) => handleTextChange('client_name', e.target.value)} /></div>
              <div className="md:col-span-3"><label className="block text-xs font-medium text-gray-600 mb-1">Posição no Processo</label><div className="relative"><select className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white appearance-none" value={formData.client_position} onChange={(e) => setFormData({...formData, client_position: e.target.value})}><option value="Autor">Autor</option><option value="Réu">Réu</option><option value="Terceiro">Terceiro Interessado</option></select><ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" /></div></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Estado (UF)</label><div className="relative"><select className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white appearance-none" value={formData.uf} onChange={(e) => setFormData({...formData, uf: e.target.value})}><option value="">Selecione...</option>{UFS.map(uf => <option key={uf.sigla} value={uf.sigla}>{uf.nome}</option>)}</select><ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" /></div></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Área do Direito</label><input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" placeholder="Ex: Trabalhista, Cível..." value={formData.area} onChange={(e) => handleTextChange('area', e.target.value)} /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Responsável (Sócio)</label><div className="flex gap-2"><div className="relative flex-1"><select className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white appearance-none" value={formData.partner_id} onChange={(e) => setFormData({...formData, partner_id: e.target.value})}><option value="">Selecione...</option>{partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select><ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" /></div><button onClick={onOpenPartnerManager} className="bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg px-3 text-gray-600 transition-colors" title="Gerenciar Sócios"><Settings className="w-4 h-4" /></button></div></div>
            </div>
          </section>

          <section className="space-y-4 bg-gray-50 p-5 rounded-xl border border-gray-200">
            <div className="flex justify-between items-center"><h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Processos Judiciais</h3><div className="flex items-center"><input type="checkbox" id="no_process" checked={!formData.has_legal_process} onChange={(e) => setFormData({...formData, has_legal_process: !e.target.checked})} className="rounded text-salomao-blue" /><label htmlFor="no_process" className="ml-2 text-xs text-gray-600">Caso sem processo judicial</label></div></div>
            {formData.has_legal_process && (
              <div className="space-y-4">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Contrário (Parte Oposta)</label><input type="text" className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white" placeholder="Nome da parte contrária" value={formData.company_name} onChange={(e) => handleTextChange('company_name', e.target.value)} /></div>
                <div className="grid grid-cols-12 gap-3 items-end p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="col-span-3"><label className="text-[10px] text-gray-500 uppercase font-bold">Número CNJ</label><input type="text" className="w-full border-b border-gray-300 focus:border-salomao-blue outline-none py-1 text-sm font-mono" placeholder="0000000-00..." value={currentProcess.process_number} onChange={(e) => setCurrentProcess({...currentProcess, process_number: maskCNJ(e.target.value)})} /></div>
                  <div className="col-span-2"><label className="text-[10px] text-gray-500 uppercase font-bold">Valor Causa</label><input type="text" className="w-full border-b border-gray-300 focus:border-salomao-blue outline-none py-1 text-sm" value={currentProcess.cause_value} onChange={(e) => setCurrentProcess({...currentProcess, cause_value: maskMoney(e.target.value)})} /></div>
                  <div className="col-span-3"><label className="text-[10px] text-gray-500 uppercase font-bold">Tribunal / Vara</label><input type="text" className="w-full border-b border-gray-300 focus:border-salomao-blue outline-none py-1 text-sm" value={currentProcess.court} onChange={(e) => setCurrentProcess({...currentProcess, court: e.target.value})} /></div>
                  <div className="col-span-3"><label className="text-[10px] text-gray-500 uppercase font-bold">Juiz</label><input type="text" className="w-full border-b border-gray-300 focus:border-salomao-blue outline-none py-1 text-sm" value={currentProcess.judge} onChange={(e) => setCurrentProcess({...currentProcess, judge: e.target.value})} /></div>
                  <div className="col-span-1"><button onClick={handleProcessAction} className="w-full bg-salomao-blue text-white rounded p-1.5 hover:bg-blue-900 transition-colors">{editingProcessIndex !== null ? <Check className="w-4 h-4 mx-auto" /> : <Plus className="w-4 h-4 mx-auto" />}</button></div>
                </div>
                {processes.length > 0 && (<div className="space-y-2">{processes.map((p, idx) => (<div key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:border-blue-200 transition-colors group"><div className="grid grid-cols-4 gap-4 flex-1 text-xs"><span className="font-mono font-medium text-gray-800">{p.process_number}</span><span className="text-gray-600">{p.cause_value}</span><span className="text-gray-500">{p.court}</span><span className="text-gray-500 truncate">{p.judge}</span></div><div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => editProcess(idx)} className="text-blue-500 hover:bg-blue-50 p-1 rounded"><Edit className="w-4 h-4" /></button><button onClick={() => removeProcess(idx)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 className="w-4 h-4" /></button></div></div>))}</div>)}
              </div>
            )}
          </section>

          <section className="border-t pt-6">
            <h3 className="text-sm font-bold text-salomao-gold uppercase tracking-wider mb-6 flex items-center"><Clock className="w-4 h-4 mr-2" />Detalhes da Fase: {getStatusLabel(formData.status)}</h3>
            {formData.status === 'analysis' && (<div className="grid grid-cols-2 gap-5"><div><label className="text-xs font-medium block mb-1">Data Prospect</label><input type="date" className="w-full border border-gray-300 p-2.5 rounded-lg text-sm" value={formData.prospect_date} onChange={e => setFormData({...formData, prospect_date: e.target.value})} /></div><div><label className="text-xs font-medium block mb-1">Analisado Por</label><input type="text" className="w-full border border-gray-300 p-2.5 rounded-lg text-sm" value={formData.analyzed_by} onChange={e => setFormData({...formData, analyzed_by: toTitleCase(e.target.value)})} /></div></div>)}
            
            {/* --- SEÇÃO CORRIGIDA DE PROPOSTA/CONTRATO --- */}
            {(formData.status === 'proposal' || formData.status === 'active') && (
              <div className="space-y-6 animate-in slide-in-from-top-2">
                
                {/* LINHA 1: Campos Financeiros Principais (Limpos) */}
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
                     <input type="text" className="w-full border border-gray-300 p-2.5 rounded-lg text-