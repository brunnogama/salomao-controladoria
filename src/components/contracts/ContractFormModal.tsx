import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, X, Save, Settings, Check, ChevronDown, Clock, History as HistoryIcon, ArrowRight, Edit, Trash2, CalendarCheck, Hourglass, Upload, FileText, Download, AlertCircle, Search, Loader2, Link as LinkIcon } from 'lucide-react';
import { Contract, Partner, ContractProcess, TimelineEvent, ContractDocument } from '../../types';
import { maskCNPJ, maskMoney, maskHon, maskCNJ, toTitleCase } from '../../utils/masks';
import { decodeCNJ } from '../../utils/cnjDecoder';

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
  processes: ContractProcess[];
  currentProcess: ContractProcess;
  // CORREÇÃO AQUI: Tipagem correta para o setter do useState
  setCurrentProcess: React.Dispatch<React.SetStateAction<ContractProcess>>;
  editingProcessIndex: number | null;
  handleProcessAction: () => void;
  editProcess: (idx: number) => void;
  removeProcess: (idx: number) => void;
  newIntermediateFee: string;
  setNewIntermediateFee: (v: string) => void;
  addIntermediateFee: () => void;
  removeIntermediateFee: (idx: number) => void;
  timelineData: TimelineEvent[];
  getStatusColor: (s: string) => string;
  getStatusLabel: (s: string) => string;
}

const getEffectiveDate = (status: string, defaultDate: string, formData: Contract) => {
  let businessDate = null;
  switch (status) {
    case 'analysis': businessDate = formData.prospect_date; break;
    case 'proposal': businessDate = formData.proposal_date; break;
    case 'active': businessDate = formData.contract_date; break;
    case 'rejected': businessDate = formData.rejection_date; break;
    case 'probono': businessDate = formData.probono_date; break;
  }
  return businessDate ? new Date(businessDate + 'T12:00:00') : new Date(defaultDate);
};

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

const getTotalDuration = (timelineData: TimelineEvent[], formData: Contract) => {
  if (timelineData.length === 0) return '0 dias';
  const firstEvent = timelineData[timelineData.length - 1];
  const firstDate = getEffectiveDate(firstEvent.new_status, firstEvent.changed_at, formData);
  const lastEvent = timelineData[0];
  const lastDate = getEffectiveDate(lastEvent.new_status, lastEvent.changed_at, formData);
  return getDuration(firstDate, lastDate);
};

const getThemeBackground = (status: string) => {
  switch (status) {
    case 'analysis': return 'bg-yellow-50';
    case 'proposal': return 'bg-blue-50';
    case 'active': return 'bg-green-50';
    case 'rejected': return 'bg-red-50';
    case 'probono': return 'bg-purple-50';
    default: return 'bg-white';
  }
};

export function ContractFormModal({
  isOpen, onClose, formData, setFormData, onSave, loading, isEditing,
  partners, onOpenPartnerManager, onCNPJSearch,
  processes, currentProcess, setCurrentProcess, editingProcessIndex, handleProcessAction, editProcess, removeProcess,
  newIntermediateFee, setNewIntermediateFee, addIntermediateFee, removeIntermediateFee,
  timelineData, getStatusColor, getStatusLabel
}: Props) {
  
  const [documents, setDocuments] = useState<ContractDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [searchingCNJ, setSearchingCNJ] = useState(false);

  useEffect(() => {
    if (isOpen && formData.id) {
      fetchDocuments();
    } else {
      setDocuments([]);
    }
  }, [isOpen, formData.id]);

  const fetchDocuments = async () => {
    const { data } = await supabase.from('contract_documents').select('*').eq('contract_id', formData.id).order('uploaded_at', { ascending: false });
    if (data) setDocuments(data);
  };

  // --- LÓGICA DE BUSCA DO CNJ ---
  const handleCNJSearch = async () => {
    const cnjRaw = currentProcess.process_number || '';
    const cnj = cnjRaw.replace(/\D/g, '');
    
    if (cnj.length < 15) {
      alert('Digite um número CNJ válido para buscar.');
      return;
    }

    setSearchingCNJ(true);

    // Simula delay de rede e uso da utilitário
    setTimeout(() => {
      const info = decodeCNJ(cnj);
      
      if (info) {
        setCurrentProcess(prev => ({
          ...prev,
          court: info.tribunal,
          // Mantém o que o usuário já digitou ou usa placeholder
          judge: prev.judge || '', 
          cause_value: prev.cause_value || ''
        }));
      } else {
        alert('Número de CNJ inválido ou fora do padrão (NNNNNNN-DD.AAAA.J.TR.OOOO).');
      }
      setSearchingCNJ(false);
    }, 600);
  };

  const handleOpenJusbrasil = () => {
    const cnjRaw = currentProcess.process_number || '';
    const cleanCNJ = cnjRaw.replace(/\D/g, '');
    if (cleanCNJ.length > 5) {
      window.open(`https://www.jusbrasil.com.br/processos/busca/${cleanCNJ}`, '_blank');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'proposal' | 'contract') => {
    if (!e.target.files || e.target.files.length === 0) return;
    if (!formData.id || !formData.client_name) {
      alert('Salve o contrato primeiro para anexar arquivos.');
      return;
    }

    setUploading(true);
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${toTitleCase(formData.client_name)}/${formData.id}/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage.from('ged').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from('contract_documents').insert({
        contract_id: formData.id,
        file_name: file.name,
        file_path: filePath,
        file_type: type,
        hon_number_ref: type === 'contract' ? formData.hon_number : null
      });

      if (dbError) throw dbError;
      fetchDocuments();
    } catch (error: any) {
      alert('Erro ao enviar arquivo: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (path: string, filename: string) => {
    const { data } = await supabase.storage.from('ged').createSignedUrl(path, 60);
    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank');
    }
  };

  const handleDeleteDocument = async (id: string, path: string) => {
    if (!confirm('Deseja excluir este arquivo?')) return;
    try {
      await supabase.storage.from('ged').remove([path]);
      await supabase.from('contract_documents').delete().eq('id', id);
      setDocuments(documents.filter(d => d.id !== id));
    } catch (error) {
      alert('Erro ao excluir.');
    }
  };

  const handleTextChange = (field: keyof Contract, value: string) => {
    setFormData({ ...formData, [field]: toTitleCase(value) });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[50] p-4 overflow-y-auto">
      <div className={`w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[95vh] animate-in fade-in zoom-in duration-200 transition-colors duration-500 ease-in-out ${getThemeBackground(formData.status)}`}>
        
        <div className="p-6 border-b border-black/5 flex justify-between items-center bg-white/50 backdrop-blur-sm rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{isEditing ? 'Editar Caso' : 'Novo Caso'}</h2>
            <p className="text-xs text-gray-500 uppercase tracking-wider">{isEditing ? 'Visualização e Edição Completa' : 'Cadastro Unificado'}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500"><X className="w-6 h-6" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          
          <div className="bg-white/60 p-6 rounded-xl border border-white/40 shadow-sm backdrop-blur-sm">
            <label className="block text-sm font-bold text-gray-700 mb-2">Status Atual do Caso</label>
            <div className="relative">
              <select className="w-full p-3 border border-gray-200 rounded-lg bg-white/80 font-medium text-salomao-blue appearance-none focus:ring-2 focus:ring-salomao-blue outline-none" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value as any})}>
                <option value="analysis">Sob Análise</option><option value="proposal">Proposta Enviada</option><option value="active">Contrato Fechado</option><option value="rejected">Rejeitada</option><option value="probono">Probono</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-salomao-blue w-5 h-5 pointer-events-none" />
            </div>
          </div>

          <section className="space-y-5">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b border-black/5 pb-2">Dados do Cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">CNPJ/CPF</label>
                <div className="flex gap-2">
                  <input type="text" disabled={formData.has_no_cnpj} className="flex-1 border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-salomao-blue disabled:bg-gray-100 bg-white" placeholder="00.000.000/0000-00" value={formData.cnpj} onChange={(e) => setFormData({...formData, cnpj: maskCNPJ(e.target.value)})}/>
                  <button onClick={onCNPJSearch} disabled={formData.has_no_cnpj || !formData.cnpj} className="bg-white hover:bg-gray-50 text-gray-600 p-2.5 rounded-lg border border-gray-300 disabled:opacity-50"><Plus className="w-4 h-4" /></button>
                </div>
                <div className="flex items-center mt-2"><input type="checkbox" id="no_cnpj" className="rounded text-salomao-blue focus:ring-salomao-blue" checked={formData.has_no_cnpj} onChange={(e) => setFormData({...formData, has_no_cnpj: e.target.checked, cnpj: ''})}/><label htmlFor="no_cnpj" className="ml-2 text-xs text-gray-500">Sem CNPJ (Pessoa Física)</label></div>
              </div>
              <div className="md:col-span-6"><label className="block text-xs font-medium text-gray-600 mb-1">Nome do Cliente</label><input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-salomao-blue bg-white" value={formData.client_name} onChange={(e) => handleTextChange('client_name', e.target.value)} /></div>
              <div className="md:col-span-3"><label className="block text-xs font-medium text-gray-600 mb-1">Posição no Processo</label><div className="relative"><select className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white appearance-none" value={formData.client_position} onChange={(e) => setFormData({...formData, client_position: e.target.value})}><option value="Autor">Autor</option><option value="Réu">Réu</option><option value="Terceiro">Terceiro Interessado</option></select><ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" /></div></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Estado (UF)</label><div className="relative"><select className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white appearance-none" value={formData.uf} onChange={(e) => setFormData({...formData, uf: e.target.value})}><option value="">Selecione...</option>{UFS.map(uf => <option key={uf.sigla} value={uf.sigla}>{uf.nome}</option>)}</select><ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" /></div></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Área do Direito</label><input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white" placeholder="Ex: Trabalhista, Cível..." value={formData.area} onChange={(e) => handleTextChange('area', e.target.value)} /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Responsável (Sócio)</label><div className="flex gap-2"><div className="relative flex-1"><select className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white appearance-none" value={formData.partner_id} onChange={(e) => setFormData({...formData, partner_id: e.target.value})}><option value="">Selecione...</option>{partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select><ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" /></div><button onClick={onOpenPartnerManager} className="bg-white hover:bg-gray-50 border border-gray-300 rounded-lg px-3 text-gray-600 transition-colors" title="Gerenciar Sócios"><Settings className="w-4 h-4" /></button></div></div>
            </div>
          </section>

          <section className="space-y-4 bg-white/60 p-5 rounded-xl border border-white/40 shadow-sm backdrop-blur-sm">
            <div className="flex justify-between items-center"><h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Processos Judiciais</h3><div className="flex items-center"><input type="checkbox" id="no_process" checked={!formData.has_legal_process} onChange={(e) => setFormData({...formData, has_legal_process: !e.target.checked})} className="rounded text-salomao-blue" /><label htmlFor="no_process" className="ml-2 text-xs text-gray-600">Caso sem processo judicial</label></div></div>
            {formData.has_legal_process && (
              <div className="space-y-4">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Contrário (Parte Oposta)</label><input type="text" className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white" placeholder="Nome da parte contrária" value={formData.company_name} onChange={(e) => handleTextChange('company_name', e.target.value)} /></div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                  
                  {/* CAMPO CNJ COM IDENTIFICAÇÃO AUTOMÁTICA */}
                  <div className="md:col-span-3">
                    <label className="text-[10px] text-gray-500 uppercase font-bold flex justify-between">
                      Número CNJ
                      {currentProcess.process_number && (
                        <button onClick={handleOpenJusbrasil} className="text-[10px] text-blue-500 hover:underline flex items-center" title="Abrir no Jusbrasil"><LinkIcon className="w-3 h-3 mr-1" /> Ver Externo</button>
                      )}
                    </label>
                    <div className="flex relative items-center">
                      <input 
                        type="text" 
                        className="w-full border-b border-gray-300 focus:border-salomao-blue outline-none py-1 text-sm font-mono pr-8" 
                        placeholder="0000000-00..." 
                        value={currentProcess.process_number} 
                        onChange={(e) => setCurrentProcess({...currentProcess, process_number: maskCNJ(e.target.value)})} 
                      />
                      <button 
                        onClick={handleCNJSearch}
                        disabled={searchingCNJ || !currentProcess.process_number}
                        className="absolute right-0 text-salomao-blue hover:text-salomao-gold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Identificar Tribunal (Algoritmo CNJ)"
                      >
                        {searchingCNJ ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="md:col-span-2"><label className="text-[10px] text-gray-500 uppercase font-bold">Valor Causa</label><input type="text" className="w-full border-b border-gray-300 focus:border-salomao-blue outline-none py-1 text-sm" value={currentProcess.cause_value} onChange={(e) => setCurrentProcess({...currentProcess, cause_value: maskMoney(e.target.value)})} /></div>
                  <div className="md:col-span-3"><label className="text-[10px] text-gray-500 uppercase font-bold">Tribunal / Vara</label><input type="text" className="w-full border-b border-gray-300 focus:border-salomao-blue outline-none py-1 text-sm" value={currentProcess.court} onChange={(e) => setCurrentProcess({...currentProcess, court: e.target.value})} /></div>
                  <div className="md:col-span-3"><label className="text-[10px] text-gray-500 uppercase font-bold">Juiz</label><input type="text" className="w-full border-b border-gray-300 focus:border-salomao-blue outline-none py-1 text-sm" value={currentProcess.judge} onChange={(e) => setCurrentProcess({...currentProcess, judge: e.target.value})} /></div>
                  <div className="md:col-span-1"><button onClick={handleProcessAction} className="w-full bg-salomao-blue text-white rounded p-1.5 hover:bg-blue-900 transition-colors">{editingProcessIndex !== null ? <Check className="w-4 h-4 mx-auto" /> : <Plus className="w-4 h-4 mx-auto" />}</button></div>
                </div>
                {processes.length > 0 && (<div className="space-y-2">{processes.map((p, idx) => (<div key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:border-blue-200 transition-colors group"><div className="grid grid-cols-4 gap-4 flex-1 text-xs"><span className="font-mono font-medium text-gray-800">{p.process_number}</span><span className="text-gray-600">{p.cause_value}</span><span className="text-gray-500">{p.court}</span><span className="text-gray-500 truncate">{p.judge}</span></div><div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => editProcess(idx)} className="text-blue-500 hover:bg-blue-50 p-1 rounded"><Edit className="w-4 h-4" /></button><button onClick={() => removeProcess(idx)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 className="w-4 h-4" /></button></div></div>))}</div>)}
              </div>
            )}
          </section>

          <section className="border-t border-black/5 pt-6">
            <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-6 flex items-center">
              <Clock className="w-4 h-4 mr-2" />Detalhes da Fase: {getStatusLabel(formData.status)}
            </h3>

            {(formData.status === 'proposal' || formData.status === 'active') && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-xs font-bold text-gray-500 uppercase flex items-center"><FileText className="w-4 h-4 mr-2" />Arquivos & Documentos ({formData.status === 'active' ? 'Contratos' : 'Propostas'})</label>
                  {!isEditing ? (<span className="text-xs text-orange-500 flex items-center"><AlertCircle className="w-3 h-3 mr-1" /> Salve o caso para anexar arquivos</span>) : (<label className="cursor-pointer bg-white border border-dashed border-salomao-blue text-salomao-blue px-4 py-2 rounded-lg text-xs font-medium hover:bg-blue-50 transition-colors flex items-center">{uploading ? 'Enviando...' : <><Upload className="w-3 h-3 mr-2" /> Anexar PDF</>}<input type="file" accept="application/pdf" className="hidden" disabled={uploading} onChange={(e) => handleFileUpload(e, formData.status === 'active' ? 'contract' : 'proposal')} /></label>)}
                </div>
                {documents.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{documents.map((doc) => (<div key={doc.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 group"><div className="flex items-center overflow-hidden"><div className="bg-red-100 p-2 rounded text-red-600 mr-3"><FileText className="w-4 h-4" /></div><div className="flex-1 min-w-0"><p className="text-xs font-medium text-gray-700 truncate" title={doc.file_name}>{doc.file_name}</p><div className="flex items-center text-[10px] text-gray-400 mt-0.5"><span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>{doc.hon_number_ref && (<span className="ml-2 bg-green-100 text-green-700 px-1.5 py-0.5 rounded border border-green-200">HON: {maskHon(doc.hon_number_ref)}</span>)}</div></div></div><div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => handleDownload(doc.file_path, doc.file_name)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded"><Download className="w-4 h-4" /></button><button onClick={() => handleDeleteDocument(doc.id, doc.file_path)} className="p-1.5 text-red-600 hover:bg-red-100 rounded"><Trash2 className="w-4 h-4" /></button></div></div>))}</div>
                ) : (isEditing && <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-lg text-xs text-gray-400">Nenhum arquivo anexado.</div>)}
              </div>
            )}

            {formData.status === 'analysis' && (<div className="grid grid-cols-2 gap-5"><div><label className="text-xs font-medium block mb-1">Data Prospect</label><input type="date" className="w-full border border-gray-300 p-2.5 rounded-lg text-sm bg-white" value={formData.prospect_date} onChange={e => setFormData({...formData, prospect_date: e.target.value})} /></div><div><label className="text-xs font-medium block mb-1">Analisado Por</label><input type="text" className="w-full border border-gray-300 p-2.5 rounded-lg text-sm bg-white" value={formData.analyzed_by} onChange={e => setFormData({...formData, analyzed_by: toTitleCase(e.target.value)})} /></div></div>)}
            {(formData.status === 'proposal' || formData.status === 'active') && (
              <div className="space-y-6 animate-in slide-in-from-top-2">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                   <div><label className="text-xs font-medium block mb-1">Data Proposta</label><input type="date" className="w-full border border-gray-300 p-2.5 rounded-lg text-sm bg-white" value={formData.proposal_date} onChange={e => setFormData({...formData, proposal_date: e.target.value})} /></div>
                   <div><label className="text-xs font-medium block mb-1">Pró-Labore (R$)</label><input type="text" className="w-full border border-gray-300 p-2.5 rounded-lg text-sm bg-white" value={formData.pro_labore} onChange={e => setFormData({...formData, pro_labore: maskMoney(e.target.value)})} /></div>
                   <div><label className="text-xs font-medium block mb-1">Êxito Final (R$)</label><input type="text" className="w-full border border-gray-300 p-2.5 rounded-lg text-sm bg-white" value={formData.final_success_fee} onChange={e => setFormData({...formData, final_success_fee: maskMoney(e.target.value)})} /></div>
                   <div><label className="text-xs font-medium block mb-1">Êxito Final (%)</label><input type="text" className="w-full border border-gray-300 p-2.5 rounded-lg text-sm bg-white" placeholder="Ex: 20%" value={formData.final_success_percent} onChange={e => setFormData({...formData, final_success_percent: e.target.value})} /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div><label className="text-xs font-medium text-gray-600 block mb-1">Êxitos Intermediários</label><div className="flex gap-2"><input type="text" className="flex-1 border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-salomao-blue bg-white" placeholder="R$ 0,00" value={newIntermediateFee} onChange={e => setNewIntermediateFee(maskMoney(e.target.value))} /><button onClick={addIntermediateFee} className="bg-white hover:bg-gray-50 text-gray-600 p-2.5 rounded-lg border border-gray-300 transition-colors" title="Adicionar"><Plus className="w-4 h-4" /></button></div><div className="flex flex-wrap gap-2 mt-2">{formData.intermediate_fees?.map((fee, idx) => (<span key={idx} className="bg-white border border-blue-100 px-3 py-1 rounded-full text-xs text-blue-800 flex items-center shadow-sm">{fee}<button onClick={() => removeIntermediateFee(idx)} className="ml-2 text-blue-400 hover:text-red-500"><X className="w-3 h-3" /></button></span>))}</div></div>
                  <div className="flex gap-4"><div className="flex-1"><label className="text-xs font-medium text-gray-600 block mb-1">Outros Honorários</label><input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-salomao-blue bg-white" placeholder="Descrição/Valor" value={formData.other_fees} onChange={e => setFormData({...formData, other_fees: toTitleCase(e.target.value)})} /></div><div className="flex items-end pb-3"><div className="flex items-center"><input type="checkbox" id="timesheet" checked={formData.timesheet} onChange={e => setFormData({...formData, timesheet: e.target.checked})} className="w-4 h-4 text-salomao-blue rounded border-gray-300 focus:ring-salomao-blue" /><label htmlFor="timesheet" className="ml-2 text-sm text-gray-700 font-medium whitespace-nowrap">Hon. de Timesheet</label></div></div></div>
                </div>
              </div>
            )}

            {formData.status === 'active' && (
              <div className="mt-6 p-4 bg-white/70 border border-green-200 rounded-xl animate-in fade-in">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                  <div className="md:col-span-4"><label className="text-xs font-medium block mb-1 text-green-800">Número HON (Único)</label><input type="text" className="w-full border-2 border-green-200 p-2.5 rounded-lg text-green-900 font-mono font-bold bg-white focus:border-green-500 outline-none" placeholder="0000000/000" value={formData.hon_number} onChange={e => setFormData({...formData, hon_number: maskHon(e.target.value)})} /></div>
                  <div className="md:col-span-4"><label className="text-xs font-medium block mb-1 text-green-800">Data Assinatura</label><input type="date" className="w-full border border-green-200 p-2.5 rounded-lg text-sm bg-white focus:border-green-500 outline-none" value={formData.contract_date} onChange={e => setFormData({...formData, contract_date: e.target.value})} /></div>
                  <div className="md:col-span-4"><label className="flex items-center p-2.5 bg-white border border-green-200 rounded-lg cursor-pointer hover:border-green-400 transition-colors"><input type="checkbox" className="w-4 h-4 text-green-600 rounded focus:ring-green-500 border-gray-300" checked={formData.physical_signature} onChange={(e) => setFormData({...formData, physical_signature: e.target.checked})} /><span className="ml-2 text-sm font-medium text-green-800">Possui Assinatura Física?</span></label></div>
                </div>
              </div>
            )}

            {formData.status === 'rejected' && (<div className="grid grid-cols-3 gap-4"><input type="date" className="border p-2 rounded bg-white" onChange={e => setFormData({...formData, rejection_date: e.target.value})} /><select className="border p-2 rounded bg-white" onChange={e => setFormData({...formData, rejected_by: e.target.value})}><option>Rejeitado por...</option><option>Cliente</option><option>Escritório</option></select><select className="border p-2 rounded bg-white" onChange={e => setFormData({...formData, rejection_reason: e.target.value})}><option>Motivo...</option><option>Cliente declinou</option><option>Cliente não retornou</option><option>Caso ruim</option><option>Conflito de interesses</option></select></div>)}
          </section>

          <div><label className="block text-xs font-medium text-gray-600 mb-1">Observações Gerais</label><textarea className="w-full border border-gray-300 rounded-lg p-3 text-sm h-24 focus:ring-2 focus:ring-salomao-blue outline-none bg-white" value={formData.observations} onChange={(e) => setFormData({...formData, observations: toTitleCase(e.target.value)})}></textarea></div>

          {isEditing && timelineData.length > 0 && (
            <div className="border-t border-black/5 pt-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center"><HistoryIcon className="w-4 h-4 mr-2" /> Timeline do Caso</h3>
                <span className="bg-white/80 text-salomao-gold px-3 py-1 rounded-full text-xs font-bold border border-salomao-gold/20 flex items-center"><Hourglass className="w-3 h-3 mr-1" /> Total: {getTotalDuration(timelineData, formData)}</span>
              </div>
              <div className="relative border-l-2 border-black/5 ml-3 space-y-8 pb-4">
                {timelineData.map((t, idx) => {
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
                      <span className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 ${isCurrent ? 'bg-salomao-blue border-blue-200' : 'bg-gray-300 border-white'}`}></span>
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between bg-white p-4 rounded-lg border border-gray-100 hover:border-blue-100 transition-colors shadow-sm">
                        <div>
                          <h4 className={`text-sm font-bold ${isCurrent ? 'text-salomao-blue' : 'text-gray-600'}`}>{getStatusLabel(t.new_status)}</h4>
                          <p className="text-xs text-gray-400 mt-1 flex items-center"><CalendarCheck className="w-3 h-3 mr-1" />{currentEventDate.toLocaleDateString('pt-BR')}</p>
                          <p className="text-xs text-gray-400 mt-0.5">Alterado por: <span className="font-medium text-gray-600">{t.changed_by}</span></p>
                        </div>
                        <div className="mt-2 sm:mt-0 flex flex-col items-end"><span className="text-[10px] uppercase font-bold text-gray-400 mb-1">Duração da fase anterior</span><span className="bg-gray-50 px-2 py-1 rounded border border-gray-200 text-xs font-mono text-gray-600">{duration}</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        <div className="p-6 border-t border-black/5 flex justify-end gap-3 bg-white/50 backdrop-blur-sm rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors">Cancelar</button>
          <button onClick={onSave} disabled={loading} className="px-6 py-2 bg-salomao-blue text-white rounded-lg hover:bg-blue-900 shadow-lg flex items-center transition-all transform active:scale-95">{loading ? 'Salvando...' : <><Save className="w-4 h-4 mr-2" /> Salvar Caso</>}</button>
        </div>
      </div>
    </div>
  );
}