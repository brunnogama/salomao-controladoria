import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, X, Save, Settings, Check, ChevronDown, Clock, History as HistoryIcon, ArrowRight, Edit, Trash2, CalendarCheck, Hourglass, Upload, FileText, Download, AlertCircle, Search, Loader2, Link as LinkIcon, MapPin, DollarSign, Tag } from 'lucide-react';
import { Contract, Partner, ContractProcess, TimelineEvent, ContractDocument } from '../../types';
import { maskCNPJ, maskMoney, maskHon, maskCNJ, toTitleCase, parseCurrency } from '../../utils/masks';
import { decodeCNJ } from '../../utils/cnjDecoder';
import { addDays, addMonths } from 'date-fns';
import { CustomSelect } from '../ui/CustomSelect';

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

const FinancialInputWithInstallments = ({ 
  label, value, onChangeValue, installments, onChangeInstallments 
}: { 
  label: string, value: string | undefined, onChangeValue: (val: string) => void, installments: string | undefined, onChangeInstallments: (val: string) => void 
}) => {
  const installmentOptions = Array.from({ length: 24 }, (_, i) => `${i + 1}x`);
  return (
    <div>
      <label className="text-xs font-medium block mb-1 text-gray-600">{label}</label>
      <div className="flex rounded-lg shadow-sm">
        <input type="text" className="flex-1 border border-gray-300 rounded-l-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-salomao-blue outline-none min-w-0" value={value || ''} onChange={(e) => onChangeValue(maskMoney(e.target.value))} placeholder="R$ 0,00"/>
        <div className="relative w-24">
          <select className="w-full h-full border-y border-r border-l-0 border-gray-300 rounded-r-lg bg-gray-50 text-xs font-medium text-gray-700 px-2 outline-none appearance-none hover:bg-gray-100 cursor-pointer text-center" value={installments || '1x'} onChange={(e) => onChangeInstallments(e.target.value)}>
            {installmentOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
        </div>
      </div>
    </div>
  );
};

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
    default: return 'bg-gray-50';
  }
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  formData: Contract;
  setFormData: React.Dispatch<React.SetStateAction<Contract>>;
  onSave: () => void;
  loading: boolean;
  isEditing: boolean;
  partners: Partner[];
  onOpenPartnerManager: () => void;
  onCNPJSearch: () => void;
  processes: ContractProcess[];
  currentProcess: ContractProcess;
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

export function ContractFormModal(props: Props) {
  const { 
    isOpen, onClose, formData, setFormData, onSave, loading, isEditing,
    partners, onOpenPartnerManager, 
    processes, currentProcess, setCurrentProcess, editingProcessIndex, handleProcessAction, editProcess, removeProcess,
    newIntermediateFee, setNewIntermediateFee, addIntermediateFee, removeIntermediateFee,
    timelineData, getStatusLabel
  } = props;
  
  const [documents, setDocuments] = useState<ContractDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [searchingCNJ, setSearchingCNJ] = useState(false);
  const [statusOptions, setStatusOptions] = useState<{label: string, value: string}[]>([]);
  const [billingLocations, setBillingLocations] = useState(['Salomão RJ', 'Salomão SP', 'Salomão SC', 'Salomão ES']);
  const [clientExtraData, setClientExtraData] = useState({ address: '', number: '', complement: '', city: '', email: '', is_person: false });

  useEffect(() => {
    if (isOpen) {
      fetchStatuses();
      if (formData.id) fetchDocuments();
    } else {
      setDocuments([]);
      setClientExtraData({ address: '', number: '', complement: '', city: '', email: '', is_person: false });
    }
  }, [isOpen, formData.id]);

  const fetchStatuses = async () => {
    const { data } = await supabase.from('contract_statuses').select('*').order('label');
    if (data) {
      const options = data.map(s => ({ label: s.label, value: s.value }));
      setStatusOptions(options);
    }
  };

  const handleCreateStatus = async () => {
    const newLabel = window.prompt("Digite o nome do novo Status:");
    if (!newLabel) return;
    const newValue = newLabel.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_");
    if (statusOptions.some(s => s.value === newValue)) return alert("Este status já existe.");
    try {
      const { error } = await supabase.from('contract_statuses').insert({ label: toTitleCase(newLabel), value: newValue, color: 'bg-gray-100 text-gray-800 border-gray-200' });
      if (error) throw error;
      await fetchStatuses();
      setFormData({ ...formData, status: newValue as any });
    } catch (err) { alert("Erro ao criar status."); }
  };

  const fetchDocuments = async () => {
    const { data } = await supabase.from('contract_documents').select('*').eq('contract_id', formData.id).order('uploaded_at', { ascending: false });
    if (data) setDocuments(data);
  };

  const upsertClient = async () => {
    if (!formData.cnpj || !formData.client_name) return null;
    const clientData = {
      name: formData.client_name,
      cnpj: formData.cnpj,
      is_person: clientExtraData.is_person || (!formData.has_no_cnpj && formData.cnpj.length <= 14),
      uf: formData.uf,
      address: clientExtraData.address || undefined,
      city: clientExtraData.city || undefined,
      complement: clientExtraData.complement || undefined,
      number: clientExtraData.number || undefined,
      email: clientExtraData.email || undefined
    };
    const { data: existingClient } = await supabase.from('clients').select('id').eq('cnpj', formData.cnpj).single();
    let clientId = existingClient?.id;
    if (clientId) {
      await supabase.from('clients').update(clientData).eq('id', clientId);
    } else {
      const { data: newClient } = await supabase.from('clients').insert(clientData).select().single();
      clientId = newClient?.id;
    }
    return clientId;
  };

  const generateFinancialInstallments = async (contractId: string) => {
    if (formData.status !== 'active') return;
    await supabase.from('financial_installments').delete().eq('contract_id', contractId).eq('status', 'pending');
    const installmentsToInsert: any[] = [];
    const addInstallments = (totalValueStr: string | undefined, installmentsStr: string | undefined, type: string) => {
      const totalValue = parseCurrency(totalValueStr);
      if (totalValue <= 0) return;
      const numInstallments = parseInt((installmentsStr || '1x').replace('x', '')) || 1;
      const amountPerInstallment = totalValue / numInstallments;
      for (let i = 1; i <= numInstallments; i++) {
        installmentsToInsert.push({ contract_id: contractId, type: type, installment_number: i, total_installments: numInstallments, amount: amountPerInstallment, status: 'pending', due_date: addMonths(new Date(), i).toISOString() });
      }
    };
    addInstallments(formData.pro_labore, formData.pro_labore_installments, 'pro_labore');
    addInstallments(formData.final_success_fee, formData.final_success_fee_installments, 'success_fee');
    addInstallments(formData.other_fees, formData.other_fees_installments, 'other');
    if (formData.intermediate_fees && formData.intermediate_fees.length > 0) {
      formData.intermediate_fees.forEach(fee => {
        const val = parseCurrency(fee);
        if (val > 0) installmentsToInsert.push({ contract_id: contractId, type: 'success_fee', installment_number: 1, total_installments: 1, amount: val, status: 'pending', due_date: addMonths(new Date(), 1).toISOString() });
      });
    }
    if (installmentsToInsert.length > 0) await supabase.from('financial_installments').insert(installmentsToInsert);
  };

  const handleSaveWithIntegrations = async () => {
    const clientId = await upsertClient();
    onSave(); 
    if (formData.id) {
        if (clientId) await supabase.from('contracts').update({ client_id: clientId }).eq('id', formData.id);
        await generateFinancialInstallments(formData.id);
    }
    if (formData.status === 'active' && formData.physical_signature === false && formData.id) {
        const { data } = await supabase.from('kanban_tasks').select('id').eq('contract_id', formData.id).eq('status', 'signature').single();
        if (!data) {
          const dueDate = addDays(new Date(), 5);
          await supabase.from('kanban_tasks').insert({ title: `Coletar Assinatura: ${formData.client_name}`, description: `Contrato fechado em ${new Date().toLocaleDateString()}. Coletar assinatura física.`, priority: 'Alta', status: 'signature', contract_id: formData.id, due_date: dueDate.toISOString(), position: 0 });
        }
    }
  };

  const handleAddLocation = () => {
    const newLoc = window.prompt("Digite o nome do novo local de faturamento:");
    if (newLoc && !billingLocations.includes(newLoc)) {
      setBillingLocations([...billingLocations, newLoc]);
      setFormData({...formData, billing_location: newLoc});
    }
  };

  const handleCNPJSearch = async () => {
    const cleanCNPJ = formData.cnpj.replace(/\D/g, '');
    if (cleanCNPJ.length !== 14) return alert('CNPJ inválido');
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCNPJ}`);
      const data = await response.json();
      if (data.razao_social) {
        setFormData(prev => ({ ...prev, client_name: toTitleCase(data.razao_social), uf: data.uf }));
        setClientExtraData(prev => ({ ...prev, address: toTitleCase(data.logradouro), number: data.numero, complement: toTitleCase(data.complemento), city: toTitleCase(data.municipio), email: data.email, is_person: false }));
      }
    } catch (e) { alert('Erro ao buscar CNPJ.'); }
  };

  const handleCNJSearch = async () => {
    const cnjRaw = currentProcess.process_number || '';
    const cnj = cnjRaw.replace(/\D/g, '');
    if (cnj.length < 15) return alert('CNPJ inválido.');
    setSearchingCNJ(true);
    setTimeout(() => {
      const info = decodeCNJ(cnj);
      if (info) {
        setCurrentProcess(prev => ({ ...prev, court: info.tribunal, judge: prev.judge || '', cause_value: prev.cause_value || '' }));
        if (info.uf) setFormData(prev => ({ ...prev, uf: info.uf }));
      } else alert('Número de CNJ inválido.');
      setSearchingCNJ(false);
    }, 600);
  };

  const handleOpenJusbrasil = () => {
    const cnjRaw = currentProcess.process_number || '';
    if (cnjRaw.replace(/\D/g, '').length > 5) window.open(`https://www.jusbrasil.com.br/processos/busca/${cnjRaw.replace(/\D/g, '')}`, '_blank');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'proposal' | 'contract') => {
    if (!e.target.files || !e.target.files.length) return;
    if (!formData.id) return alert('Salve o contrato primeiro.');
    setUploading(true);
    try {
      const file = e.target.files[0];
      const fileName = `${Date.now()}.${file.name.split('.').pop()}`;
      const filePath = `${toTitleCase(formData.client_name)}/${formData.id}/${fileName}`;
      await supabase.storage.from('ged').upload(filePath, file);
      await supabase.from('contract_documents').insert({ contract_id: formData.id, file_name: file.name, file_path: filePath, file_type: type, hon_number_ref: type === 'contract' ? formData.hon_number : null });
      fetchDocuments();
    } catch (error: any) { alert('Erro: ' + error.message); } finally { setUploading(false); }
  };

  const handleDownload = async (path: string) => {
    const { data } = await supabase.storage.from('ged').createSignedUrl(path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  };

  const handleDeleteDocument = async (id: string, path: string) => {
    if (!confirm('Excluir arquivo?')) return;
    await supabase.storage.from('ged').remove([path]);
    await supabase.from('contract_documents').delete().eq('id', id);
    setDocuments(documents.filter(d => d.id !== id));
  };

  const handleTextChange = (field: keyof Contract, value: string) => {
    setFormData({ ...formData, [field]: toTitleCase(value) });
  };

  const positionOptions = [{ label: 'Autor', value: 'Autor' }, { label: 'Réu', value: 'Réu' }, { label: 'Terceiro Interessado', value: 'Terceiro' }];
  const ufOptions = UFS.map(uf => ({ label: uf.nome, value: uf.sigla }));
  const partnerOptions = partners.map(p => ({ label: p.name, value: p.id }));
  const billingOptions = billingLocations.map(l => ({ label: l, value: l }));
  const signatureOptions = [{ label: 'Sim', value: 'true' }, { label: 'Não (Cobrar)', value: 'false' }];
  const rejectionByOptions = [{ label: 'Cliente', value: 'Cliente' }, { label: 'Escritório', value: 'Escritório' }];
  const rejectionReasonOptions = [{ label: 'Cliente declinou', value: 'Cliente declinou' }, { label: 'Cliente não retornou', value: 'Cliente não retornou' }, { label: 'Caso ruim', value: 'Caso ruim' }, { label: 'Conflito de interesses', value: 'Conflito de interesses' }];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[50] p-4 overflow-y-auto">
      <div className={`w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[95vh] animate-in fade-in zoom-in duration-200 transition-colors duration-500 ease-in-out ${getThemeBackground(formData.status)}`}>
        <div className="p-6 border-b border-black/5 flex justify-between items-center bg-white/50 backdrop-blur-sm rounded-t-2xl">
          <div><h2 className="text-xl font-bold text-gray-800">{isEditing ? 'Editar Caso' : 'Novo Caso'}</h2><p className="text-xs text-gray-500 uppercase tracking-wider">{isEditing ? 'Visualização e Edição Completa' : 'Cadastro Unificado'}</p></div>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500"><X className="w-6 h-6" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          <div className="bg-white/60 p-6 rounded-xl border border-white/40 shadow-sm backdrop-blur-sm">
            <CustomSelect label="Status Atual do Caso" value={formData.status} onChange={(val: any) => setFormData({...formData, status: val})} options={statusOptions} onAction={handleCreateStatus} actionIcon={Plus} actionLabel="Adicionar Novo Status" />
          </div>
          <section className="space-y-5">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b border-black/5 pb-2">Dados do Cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">CNPJ/CPF</label>
                <div className="flex gap-2">
                  <input type="text" disabled={formData.has_no_cnpj} className="flex-1 border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-salomao-blue disabled:bg-gray-100 bg-white" placeholder="00.000.000/0000-00" value={formData.cnpj} onChange={(e) => setFormData({...formData, cnpj: maskCNPJ(e.target.value)})}/>
                  {/* ÍCONE DE LUPA AQUI */}
                  <button onClick={handleCNPJSearch} disabled={formData.has_no_cnpj || !formData.cnpj} className="bg-white hover:bg-gray-50 text-gray-600 p-2.5 rounded-lg border border-gray-300 disabled:opacity-50"><Search className="w-4 h-4" /></button>
                </div>
                <div className="flex items-center mt-2"><input type="checkbox" id="no_cnpj" className="rounded text-salomao-blue focus:ring-salomao-blue" checked={formData.has_no_cnpj} onChange={(e) => setFormData({...formData, has_no_cnpj: e.target.checked, cnpj: ''})}/><label htmlFor="no_cnpj" className="ml-2 text-xs text-gray-500">Sem CNPJ (Pessoa Física)</label></div>
              </div>
              <div className="md:col-span-6"><label className="block text-xs font-medium text-gray-600 mb-1">Nome do Cliente</label><input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-salomao-blue bg-white" value={formData.client_name} onChange={(e) => handleTextChange('client_name', e.target.value)} /></div>
              <div className="md:col-span-3"><CustomSelect label="Posição no Processo" value={formData.client_position} onChange={(val: string) => setFormData({...formData, client_position: val})} options={positionOptions} /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Área do Direito</label><input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white" placeholder="Ex: Trabalhista, Cível..." value={formData.area} onChange={(e) => handleTextChange('area', e.target.value)} /></div>
              <div><CustomSelect label="Responsável (Sócio)" value={formData.partner_id} onChange={(val: string) => setFormData({...formData, partner_id: val})} options={partnerOptions} onAction={onOpenPartnerManager} actionIcon={Settings} actionLabel="Gerenciar Sócios" /></div>
            </div>
          </section>
          <section className="space-y-4 bg-white/60 p-5 rounded-xl border border-white/40 shadow-sm backdrop-blur-sm">
            <div className="flex justify-between items-center"><h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Processos Judiciais</h3><div className="flex items-center"><input type="checkbox" id="no_process" checked={!formData.has_legal_process} onChange={(e) => setFormData({...formData, has_legal_process: !e.target.checked})} className="rounded text-salomao-blue" /><label htmlFor="no_process" className="ml-2 text-xs text-gray-600">Caso sem processo judicial</label></div></div>
            {formData.has_legal_process && (
              <div className="space-y-4">
                <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
                    <div className="md:col-span-5"><label className="text-[10px] text-gray-500 uppercase font-bold flex justify-between">Número CNJ{currentProcess.process_number && (<button onClick={handleOpenJusbrasil} className="text-[10px] text-blue-500 hover:underline flex items-center" title="Abrir no Jusbrasil"><LinkIcon className="w-3 h-3 mr-1" /> Ver Externo</button>)}</label><div className="flex relative items-center"><input type="text" className="w-full border-b border-gray-300 focus:border-salomao-blue outline-none py-1 text-sm font-mono pr-8" placeholder="0000000-00..." value={currentProcess.process_number} onChange={(e) => setCurrentProcess({...currentProcess, process_number: maskCNJ(e.target.value)})} /><button onClick={handleCNJSearch} disabled={searchingCNJ || !currentProcess.process_number} className="absolute right-0 text-salomao-blue hover:text-salomao-gold disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Identificar Tribunal e UF">{searchingCNJ ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}</button></div></div>
                    <div className="md:col-span-5"><label className="text-[10px] text-gray-500 uppercase font-bold">Tribunal / Turma</label><input type="text" className="w-full border-b border-gray-300 focus:border-salomao-blue outline-none py-1 text-sm" value={currentProcess.court} onChange={(e) => setCurrentProcess({...currentProcess, court: e.target.value})} /></div>
                    <div className="md:col-span-2"><CustomSelect label="Estado (UF)" value={formData.uf} onChange={(val: string) => setFormData({...formData, uf: val})} options={ufOptions} placeholder="UF" className="custom-select-small" /></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    <div className="md:col-span-4"><label className="text-[10px] text-gray-500 uppercase font-bold">Contrário (Parte Oposta)</label><input type="text" className="w-full border-b border-gray-300 focus:border-salomao-blue outline-none py-1 text-sm" placeholder="Nome da parte..." value={formData.company_name} onChange={(e) => handleTextChange('company_name', e.target.value)} /></div>
                    <div className="md:col-span-4"><label className="text-[10px] text-gray-500 uppercase font-bold">Juiz</label><input type="text" className="w-full border-b border-gray-300 focus:border-salomao-blue outline-none py-1 text-sm" value={currentProcess.judge} onChange={(e) => setCurrentProcess({...currentProcess, judge: e.target.value})} /></div>
                    <div className="md:col-span-3"><label className="text-[10px] text-gray-500 uppercase font-bold">Valor Causa</label><input type="text" className="w-full border-b border-gray-300 focus:border-salomao-blue outline-none py-1 text-sm" value={currentProcess.cause_value} onChange={(e) => setCurrentProcess({...currentProcess, cause_value: maskMoney(e.target.value)})} /></div>
                    <div className="md:col-span-1"><button onClick={handleProcessAction} className="w-full bg-salomao-blue text-white rounded p-1.5 hover:bg-blue-900 transition-colors flex items-center justify-center shadow-md">{editingProcessIndex !== null ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}</button></div>
                  </div>
                </div>
                {processes.length > 0 && (<div className="space-y-2 mt-4">{processes.map((p, idx) => (<div key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:border-blue-200 transition-colors group"><div className="grid grid-cols-4 gap-4 flex-1 text-xs"><span className="font-mono font-medium text-gray-800">{p.process_number}</span><span className="text-gray-600">{p.court} ({formData.uf})</span><span className="text-gray-500 truncate">{p.judge}</span><span className="text-gray-600 font-medium">{p.cause_value}</span></div><div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => editProcess(idx)} className="text-blue-500 hover:bg-blue-50 p-1 rounded"><Edit className="w-4 h-4" /></button><button onClick={() => removeProcess(idx)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 className="w-4 h-4" /></button></div></div>))}</div>)}
              </div>
            )}
          </section>
          {/* ... Resto do componente mantido ... */}
          <section className="border-t border-black/5 pt-6">
            <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-6 flex items-center"><Clock className="w-4 h-4 mr-2" />Detalhes da Fase: {getStatusLabel(formData.status)}</h3>
            {(formData.status === 'proposal' || formData.status === 'active') && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4"><label className="text-xs font-bold text-gray-500 uppercase flex items-center"><FileText className="w-4 h-4 mr-2" />Arquivos & Documentos</label>{!isEditing ? (<span className="text-xs text-orange-500 flex items-center"><AlertCircle className="w-3 h-3 mr-1" /> Salve o caso para anexar arquivos</span>) : (<label className="cursor-pointer bg-white border border-dashed border-salomao-blue text-salomao-blue px-4 py-2 rounded-lg text-xs font-medium hover:bg-blue-50 transition-colors flex items-center">{uploading ? 'Enviando...' : <><Upload className="w-3 h-3 mr-2" /> Anexar PDF</>}<input type="file" accept="application/pdf" className="hidden" disabled={uploading} onChange={(e) => handleFileUpload(e, formData.status === 'active' ? 'contract' : 'proposal')} /></label>)}</div>
                {documents.length > 0 ? (<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{documents.map((doc) => (<div key={doc.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 group"><div className="flex items-center overflow-hidden"><div className="bg-red-100 p-2 rounded text-red-600 mr-3"><FileText className="w-4 h-4" /></div><div className="flex-1 min-w-0"><p className="text-xs font-medium text-gray-700 truncate" title={doc.file_name}>{doc.file_name}</p><div className="flex items-center text-[10px] text-gray-400 mt-0.5"><span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>{doc.hon_number_ref && (<span className="ml-2 bg-green-100 text-green-700 px-1.5 py-0.5 rounded border border-green-200">HON: {maskHon(doc.hon_number_ref)}</span>)}</div></div></div><div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => handleDownload(doc.file_path)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded"><Download className="w-4 h-4" /></button><button onClick={() => handleDeleteDocument(doc.id, doc.file_path)} className="p-1.5 text-red-600 hover:bg-red-100 rounded"><Trash2 className="w-4 h-4" /></button></div></div>))}</div>) : (isEditing && <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-lg text-xs text-gray-400">Nenhum arquivo anexado.</div>)}
              </div>
            )}
            {(formData.status === 'proposal' || formData.status === 'active') && (
              <div className="space-y-6 animate-in slide-in-from-top-2">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                   <div><label className="text-xs font-medium block mb-1">{formData.status === 'proposal' ? 'Data Proposta' : 'Data Assinatura'}</label><input type="date" className="w-full border border-gray-300 p-2.5 rounded-lg text-sm bg-white" value={formData.status === 'proposal' ? formData.proposal_date : formData.contract_date} onChange={e => setFormData({...formData, [formData.status === 'proposal' ? 'proposal_date' : 'contract_date']: e.target.value})} /></div>
                   <FinancialInputWithInstallments label="Pró-Labore (R$)" value={formData.pro_labore} onChangeValue={(v) => setFormData({...formData, pro_labore: v})} installments={formData.pro_labore_installments} onChangeInstallments={(v) => setFormData({...formData, pro_labore_installments: v})} />
                   <FinancialInputWithInstallments label="Êxito Final (R$)" value={formData.final_success_fee} onChangeValue={(v) => setFormData({...formData, final_success_fee: v})} installments={formData.final_success_fee_installments} onChangeInstallments={(v) => setFormData({...formData, final_success_fee_installments: v})} />
                   <div><label className="text-xs font-medium block mb-1">Êxito Final (%)</label><input type="text" className="w-full border border-gray-300 p-2.5 rounded-lg text-sm bg-white" placeholder="Ex: 20%" value={formData.final_success_percent} onChange={e => setFormData({...formData, final_success_percent: e.target.value})} /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div><label className="text-xs font-medium text-gray-600 block mb-1">Êxitos Intermediários</label><div className="flex gap-2"><input type="text" className="flex-1 border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-salomao-blue bg-white" placeholder="R$ 0,00" value={newIntermediateFee} onChange={e => setNewIntermediateFee(maskMoney(e.target.value))} /><button onClick={addIntermediateFee} className="bg-white hover:bg-gray-50 text-gray-600 p-2.5 rounded-lg border border-gray-300 transition-colors" title="Adicionar"><Plus className="w-4 h-4" /></button></div><div className="flex flex-wrap gap-2 mt-2">{formData.intermediate_fees?.map((fee, idx) => (<span key={idx} className="bg-white border border-blue-100 px-3 py-1 rounded-full text-xs text-blue-800 flex items-center shadow-sm">{fee}<button onClick={() => removeIntermediateFee(idx)} className="ml-2 text-blue-400 hover:text-red-500"><X className="w-3 h-3" /></button></span>))}</div></div>
                  <div className="flex gap-4">
                    <div className="flex-1"><FinancialInputWithInstallments label="Outros Honorários" value={formData.other_fees} onChangeValue={(v) => setFormData({...formData, other_fees: toTitleCase(v)})} installments={formData.other_fees_installments} onChangeInstallments={(v) => setFormData({...formData, other_fees_installments: v})} /></div>
                    <div className="flex items-end pb-3"><div className="flex items-center"><input type="checkbox" id="timesheet" checked={formData.timesheet} onChange={e => setFormData({...formData, timesheet: e.target.checked})} className="w-4 h-4 text-salomao-blue rounded border-gray-300 focus:ring-salomao-blue" /><label htmlFor="timesheet" className="ml-2 text-sm text-gray-700 font-medium whitespace-nowrap">Hon. de Timesheet</label></div></div>
                  </div>
                </div>
              </div>
            )}
            {formData.status === 'active' && (
              <div className="mt-6 p-4 bg-white/70 border border-green-200 rounded-xl animate-in fade-in">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                  <div className="md:col-span-4"><label className="text-xs font-medium block mb-1 text-green-800">Número HON (Único)</label><input type="text" className="w-full border-2 border-green-200 p-2.5 rounded-lg text-green-900 font-mono font-bold bg-white focus:border-green-500 outline-none" placeholder="0000000/000" value={formData.hon_number} onChange={e => setFormData({...formData, hon_number: maskHon(e.target.value)})} /></div>
                  <div className="md:col-span-4"><CustomSelect label="Local Faturamento" value={formData.billing_location || ''} onChange={(val: string) => setFormData({...formData, billing_location: val})} options={billingOptions} onAction={handleAddLocation} actionLabel="Adicionar Local" /></div>
                  <div className="md:col-span-4"><CustomSelect label="Possui Assinatura Física?" value={formData.physical_signature === true ? 'true' : formData.physical_signature === false ? 'false' : ''} onChange={(val: string) => { setFormData({...formData, physical_signature: val === 'true' ? true : val === 'false' ? false : undefined}); }} options={signatureOptions} /></div>
                </div>
              </div>
            )}
            {formData.status === 'rejected' && (
              <div className="grid grid-cols-3 gap-4">
                <div><label className="text-xs font-medium block mb-1">Data Rejeição</label><input type="date" className="w-full border border-gray-300 p-2.5 rounded-lg text-sm bg-white" onChange={e => setFormData({...formData, rejection_date: e.target.value})} /></div>
                <CustomSelect label="Rejeitado por" value={formData.rejected_by || ''} onChange={(val: string) => setFormData({...formData, rejected_by: val})} options={rejectionByOptions} />
                <CustomSelect label="Motivo" value={formData.rejection_reason || ''} onChange={(val: string) => setFormData({...formData, rejection_reason: val})} options={rejectionReasonOptions} />
              </div>
            )}
          </section>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Observações Gerais</label><textarea className="w-full border border-gray-300 rounded-lg p-3 text-sm h-24 focus:ring-2 focus:ring-salomao-blue outline-none bg-white" value={formData.observations} onChange={(e) => setFormData({...formData, observations: toTitleCase(e.target.value)})}></textarea></div>
          {isEditing && timelineData.length > 0 && (
            <div className="border-t border-black/5 pt-6">
              <div className="flex justify-between items-center mb-6"><h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center"><HistoryIcon className="w-4 h-4 mr-2" /> Timeline do Caso</h3><span className="bg-white/80 text-salomao-gold px-3 py-1 rounded-full text-xs font-bold border border-salomao-gold/20 flex items-center"><Hourglass className="w-3 h-3 mr-1" /> Total: {getTotalDuration(timelineData, formData)}</span></div>
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
                        <div><h4 className={`text-sm font-bold ${isCurrent ? 'text-salomao-blue' : 'text-gray-600'}`}>{getStatusLabel(t.new_status)}</h4><p className="text-xs text-gray-400 mt-1 flex items-center"><CalendarCheck className="w-3 h-3 mr-1" />{currentEventDate.toLocaleDateString('pt-BR')}</p><p className="text-xs text-gray-400 mt-0.5">Alterado por: <span className="font-medium text-gray-600">{t.changed_by}</span></p></div>
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
          <button onClick={handleSaveWithIntegrations} disabled={loading} className="px-6 py-2 bg-salomao-blue text-white rounded-lg hover:bg-blue-900 shadow-lg flex items-center transition-all transform active:scale-95">{loading ? 'Salvando...' : <><Save className="w-4 h-4 mr-2" /> Salvar Caso</>}</button>
        </div>
      </div>
    </div>
  );
}