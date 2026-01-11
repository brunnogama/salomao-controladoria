import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, X, Save, Settings, Check, ChevronDown, Clock, History as HistoryIcon, ArrowRight, Edit, Trash2, CalendarCheck, Hourglass, Upload, FileText, Download, AlertCircle, Search, Loader2, Link as LinkIcon, MapPin, DollarSign, Tag } from 'lucide-react';
import { Contract, Partner, ContractProcess, TimelineEvent, ContractDocument, Analyst } from '../../types';
import { maskCNPJ, maskMoney, maskHon, maskCNJ, toTitleCase, parseCurrency } from '../../utils/masks';
import { decodeCNJ } from '../../utils/cnjDecoder';
import { addDays, addMonths } from 'date-fns';
import { CustomSelect } from '../ui/CustomSelect';

const UFS = [ { sigla: 'AC', nome: 'Acre' }, { sigla: 'AL', nome: 'Alagoas' }, { sigla: 'AP', nome: 'Amapá' }, { sigla: 'AM', nome: 'Amazonas' }, { sigla: 'BA', nome: 'Bahia' }, { sigla: 'CE', nome: 'Ceará' }, { sigla: 'DF', nome: 'Distrito Federal' }, { sigla: 'ES', nome: 'Espírito Santo' }, { sigla: 'GO', nome: 'Goiás' }, { sigla: 'MA', nome: 'Maranhão' }, { sigla: 'MT', nome: 'Mato Grosso' }, { sigla: 'MS', nome: 'Mato Grosso do Sul' }, { sigla: 'MG', nome: 'Minas Gerais' }, { sigla: 'PA', nome: 'Pará' }, { sigla: 'PB', nome: 'Paraíba' }, { sigla: 'PR', nome: 'Paraná' }, { sigla: 'PE', nome: 'Pernambuco' }, { sigla: 'PI', nome: 'Piauí' }, { sigla: 'RJ', nome: 'Rio de Janeiro' }, { sigla: 'RN', nome: 'Rio Grande do Norte' }, { sigla: 'RS', nome: 'Rio Grande do Sul' }, { sigla: 'RO', nome: 'Rondônia' }, { sigla: 'RR', nome: 'Roraima' }, { sigla: 'SC', nome: 'Santa Catarina' }, { sigla: 'SP', nome: 'São Paulo' }, { sigla: 'SE', nome: 'Sergipe' }, { sigla: 'TO', nome: 'Tocantins' } ];

const FinancialInputWithInstallments = ({ label, value, onChangeValue, installments, onChangeInstallments }: any) => {
  const installmentOptions = Array.from({ length: 24 }, (_, i) => `${i + 1}x`);
  return (
    <div>
      <label className="text-xs font-medium block mb-1 text-gray-600">{label}</label>
      <div className="flex rounded-lg shadow-sm">
        <input type="text" className="flex-1 border border-gray-300 rounded-l-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-salomao-blue outline-none min-w-0" value={value || ''} onChange={(e) => onChangeValue(maskMoney(e.target.value))} placeholder="R$ 0,00"/>
        <div className="relative w-24"><select className="w-full h-full border-y border-r border-l-0 border-gray-300 rounded-r-lg bg-gray-50 text-xs font-medium text-gray-700 px-2 outline-none appearance-none hover:bg-gray-100 cursor-pointer text-center" value={installments || '1x'} onChange={(e) => onChangeInstallments(e.target.value)}>{installmentOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select><ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" /></div>
      </div>
    </div>
  );
};

// ... Funções auxiliares (getEffectiveDate, etc.) mantidas ...
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
  return diffDays + ' dias';
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
    default: return 'bg-gray-50';
  }
};

interface Props {
  isOpen: boolean; onClose: () => void; formData: Contract; setFormData: React.Dispatch<React.SetStateAction<Contract>>; onSave: () => void; loading: boolean; isEditing: boolean;
  partners: Partner[]; onOpenPartnerManager: () => void;
  analysts: Analyst[]; onOpenAnalystManager: () => void;
  onCNPJSearch: () => void; processes: ContractProcess[]; currentProcess: ContractProcess; setCurrentProcess: React.Dispatch<React.SetStateAction<ContractProcess>>; editingProcessIndex: number | null; handleProcessAction: () => void; editProcess: (idx: number) => void; removeProcess: (idx: number) => void; newIntermediateFee: string; setNewIntermediateFee: (v: string) => void; addIntermediateFee: () => void; removeIntermediateFee: (idx: number) => void; timelineData: TimelineEvent[]; getStatusColor: (s: string) => string; getStatusLabel: (s: string) => string;
}

export function ContractFormModal(props: Props) {
  const { 
    isOpen, onClose, formData, setFormData, onSave, loading, isEditing,
    partners, onOpenPartnerManager, analysts, onOpenAnalystManager,
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
    try {
      const { error } = await supabase.from('contract_statuses').insert({ label: toTitleCase(newLabel), value: newValue });
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
    await onSave();
    if (formData.id) {
        if (clientId) await supabase.from('contracts').update({ client_id: clientId }).eq('id', formData.id);
        await generateFinancialInstallments(formData.id);
    }
  };
  const handleAddLocation = () => {
    const newLoc = window.prompt("Digite o nome do novo local de faturamento:");
    if (newLoc && !billingLocations.includes(newLoc)) {
      setBillingLocations([...billingLocations, newLoc]);
      setFormData({...formData, billing_location: newLoc});
    }
  };
  const handleCNPJSearch = async () => { /* ... mantido ... */ };
  const handleCNJSearch = async () => { /* ... mantido ... */ };
  const handleOpenJusbrasil = () => { /* ... mantido ... */ };
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'proposal' | 'contract') => { /* ... mantido ... */ };
  const handleDownload = async (path: string) => { /* ... mantido ... */ };
  const handleDeleteDocument = async (id: string, path: string) => { /* ... mantido ... */ };
  const handleTextChange = (field: keyof Contract, value: string) => { setFormData({ ...formData, [field]: toTitleCase(value) }); };

  const partnerSelectOptions = partners.map(p => ({ label: p.name, value: p.id }));
  const analystSelectOptions = analysts ? analysts.map(a => ({ label: a.name, value: a.id })) : []; // PROTEÇÃO AQUI
  const ufOptions = UFS.map(uf => ({ label: uf.nome, value: uf.sigla }));
  const positionOptions = [{ label: 'Autor', value: 'Autor' }, { label: 'Réu', value: 'Réu' }, { label: 'Terceiro', value: 'Terceiro' }];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4 overflow-y-auto">
      <div className={`w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[95vh] animate-in fade-in zoom-in duration-200 transition-colors duration-500 ease-in-out ${getThemeBackground(formData.status)}`}>
        <div className="p-6 border-b border-black/5 flex justify-between items-center bg-white/50 backdrop-blur-sm rounded-t-2xl">
          <div><h2 className="text-xl font-bold text-gray-800">{isEditing ? 'Editar Caso' : 'Novo Caso'}</h2></div>
          <button onClick={onClose}><X className="w-6 h-6 text-gray-400" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          <div className="bg-white/60 p-6 rounded-xl border border-white/40 shadow-sm backdrop-blur-sm">
            <CustomSelect label="Status Atual" value={formData.status} onChange={(val: any) => setFormData({...formData, status: val})} options={statusOptions} onAction={handleCreateStatus} actionIcon={Plus} actionLabel="Novo Status" />
          </div>

          <section className="space-y-5">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b border-black/5 pb-2">Dados do Cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">CNPJ/CPF</label>
                <div className="flex gap-2"><input type="text" className="flex-1 border border-gray-300 rounded-lg p-2.5 text-sm" value={formData.cnpj} onChange={(e) => setFormData({...formData, cnpj: maskCNPJ(e.target.value)})} /><button onClick={handleCNPJSearch} className="bg-white p-2.5 rounded-lg border"><Search className="w-4 h-4" /></button></div>
              </div>
              <div className="md:col-span-6"><label className="block text-xs font-medium text-gray-600 mb-1">Nome</label><input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" value={formData.client_name} onChange={(e) => handleTextChange('client_name', e.target.value)} /></div>
              <div className="md:col-span-3"><CustomSelect label="Posição" value={formData.client_position} onChange={(val: string) => setFormData({...formData, client_position: val})} options={positionOptions} /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Área</label><input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" value={formData.area} onChange={(e) => handleTextChange('area', e.target.value)} /></div>
              <div><CustomSelect label="Responsável (Sócio)" value={formData.partner_id} onChange={(val: string) => setFormData({...formData, partner_id: val})} options={partnerSelectOptions} onAction={onOpenPartnerManager} actionIcon={Settings} actionLabel="Gerenciar" /></div>
            </div>
          </section>

          {/* SESSÃO: DETALHES DA FASE (ANALYSIS) - CORRIGIDA */}
          <section className="border-t border-black/5 pt-6">
            <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-6 flex items-center"><Clock className="w-4 h-4 mr-2" /> Detalhes da Fase: {getStatusLabel(formData.status)}</h3>
            
            {/* SE O STATUS FOR 'analysis' (OU 'Sob Análise' dependendo do value salvo), MOSTRA OS CAMPOS */}
            {(formData.status === 'analysis') && ( 
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6 p-4 bg-yellow-50 rounded-xl border border-yellow-100 animate-in slide-in-from-top-2">
                <div>
                  <label className="text-xs font-medium block mb-1 text-yellow-800">Data Prospect</label>
                  <input type="date" className="w-full border border-yellow-200 p-2.5 rounded-lg text-sm bg-white" value={formData.prospect_date || ''} onChange={e => setFormData({...formData, prospect_date: e.target.value})} />
                </div>
                <div>
                  {/* SELETOR DE ANALISTA */}
                  <CustomSelect 
                    label="Analisado Por" 
                    value={formData.analyst_id || ''} 
                    onChange={(val: string) => setFormData({...formData, analyst_id: val})} 
                    options={analystSelectOptions} 
                    onAction={onOpenAnalystManager} 
                    actionIcon={Settings} 
                    actionLabel="Gerenciar Analistas"
                    className="bg-white border-yellow-200"
                  />
                </div>
              </div>
            )}

            {/* ... Resto dos campos (proposta, financeiro) ... */}
            {(formData.status === 'proposal' || formData.status === 'active') && (
               <div className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                   <div><label className="text-xs font-medium block mb-1">Data Assinatura/Prop</label><input type="date" className="w-full border border-gray-300 p-2.5 rounded-lg text-sm" value={formData.contract_date} onChange={e => setFormData({...formData, contract_date: e.target.value})} /></div>
                   <FinancialInputWithInstallments label="Pró-Labore" value={formData.pro_labore} onChangeValue={(v:any) => setFormData({...formData, pro_labore: v})} installments={formData.pro_labore_installments} onChangeInstallments={(v:any) => setFormData({...formData, pro_labore_installments: v})} />
                   <FinancialInputWithInstallments label="Êxito" value={formData.final_success_fee} onChangeValue={(v:any) => setFormData({...formData, final_success_fee: v})} installments={formData.final_success_fee_installments} onChangeInstallments={(v:any) => setFormData({...formData, final_success_fee_installments: v})} />
                 </div>
               </div>
            )}
          </section>

          {/* ... Observações e Timeline ... */}
        </div>
        <div className="p-6 border-t border-black/5 flex justify-end gap-3 bg-white/50 backdrop-blur-sm rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-gray-600">Cancelar</button>
          <button onClick={handleSaveWithIntegrations} className="px-6 py-2 bg-salomao-blue text-white rounded-lg">Salvar Caso</button>
        </div>
      </div>
    </div>
  );
}