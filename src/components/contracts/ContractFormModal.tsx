import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, X, Save, Settings, Check, ChevronDown, Clock, History as HistoryIcon, ArrowRight, Edit, Trash2, CalendarCheck, Hourglass, Upload, FileText, Download, AlertCircle, Search, Loader2, Link as LinkIcon, MapPin, DollarSign, Tag } from 'lucide-react';
import { Contract, Partner, ContractProcess, TimelineEvent, ContractDocument, Analyst } from '../../types';
import { maskCNPJ, maskMoney, maskHon, maskCNJ, toTitleCase, parseCurrency } from '../../utils/masks';
import { decodeCNJ } from '../../utils/cnjDecoder';
import { addDays, addMonths } from 'date-fns';
import { CustomSelect } from '../ui/CustomSelect';

const UFS = [ { sigla: 'AC', nome: 'Acre' }, { sigla: 'AL', nome: 'Alagoas' }, { sigla: 'AP', nome: 'Amapá' }, { sigla: 'AM', nome: 'Amazonas' }, { sigla: 'BA', nome: 'Bahia' }, { sigla: 'CE', nome: 'Ceará' }, { sigla: 'DF', nome: 'Distrito Federal' }, { sigla: 'ES', nome: 'Espírito Santo' }, { sigla: 'GO', nome: 'Goiás' }, { sigla: 'MA', nome: 'Maranhão' }, { sigla: 'MT', nome: 'Mato Grosso' }, { sigla: 'MS', nome: 'Mato Grosso do Sul' }, { sigla: 'MG', nome: 'Minas Gerais' }, { sigla: 'PA', nome: 'Pará' }, { sigla: 'PB', nome: 'Paraíba' }, { sigla: 'PR', nome: 'Paraná' }, { sigla: 'PE', nome: 'Pernambuco' }, { sigla: 'PI', nome: 'Piauí' }, { sigla: 'RJ', nome: 'Rio de Janeiro' }, { sigla: 'RN', nome: 'Rio Grande do Norte' }, { sigla: 'RS', nome: 'Rio Grande do Sul' }, { sigla: 'RO', nome: 'Rondônia' }, { sigla: 'RR', nome: 'Roraima' }, { sigla: 'SC', nome: 'Santa Catarina' }, { sigla: 'SP', nome: 'São Paulo' }, { sigla: 'SE', nome: 'Sergipe' }, { sigla: 'TO', nome: 'Tocantins' } ];

const FinancialInputWithInstallments = ({ 
  label, value, onChangeValue, installments, onChangeInstallments, onAdd 
}: { 
  label: string, value: string | undefined, onChangeValue: (val: string) => void, installments: string | undefined, onChangeInstallments: (val: string) => void, onAdd?: () => void 
}) => {
  const installmentOptions = Array.from({ length: 24 }, (_, i) => `${i + 1}x`);
  return (
    <div>
      <label className="text-xs font-medium block mb-1 text-gray-600">{label}</label>
      <div className="flex rounded-lg shadow-sm">
        <input 
          type="text" 
          className={`flex-1 border border-gray-300 rounded-l-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-salomao-blue outline-none min-w-0 ${!onAdd ? 'rounded-r-none border-r-0' : ''}`}
          value={value || ''} 
          onChange={(e) => onChangeValue(maskMoney(e.target.value))}
          placeholder="R$ 0,00"
        />
        <div className={`relative w-20 border-y border-gray-300 bg-gray-50 ${!onAdd ? 'border-r rounded-r-lg' : 'border-r'}`}>
          <select 
            className="w-full h-full bg-transparent text-xs font-medium text-gray-700 px-2 outline-none appearance-none hover:bg-gray-100 cursor-pointer text-center z-10 relative"
            value={installments || '1x'}
            onChange={(e) => onChangeInstallments(e.target.value)}
          >
            {installmentOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
        </div>
        {onAdd && (
          <button 
            onClick={onAdd}
            className="bg-salomao-blue text-white px-2 rounded-r-lg hover:bg-blue-900 transition-colors flex items-center justify-center border-l border-blue-800"
            type="button"
            title="Adicionar valor"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

const getEffectiveDate = (status: string, fallbackDate: string, formData: Contract) => {
  let businessDateString = null;
  switch (status) {
    case 'analysis': businessDateString = formData.prospect_date; break;
    case 'proposal': businessDateString = formData.proposal_date; break;
    case 'active': businessDateString = formData.contract_date; break;
    case 'rejected': businessDateString = formData.rejection_date; break;
    case 'probono': businessDateString = formData.probono_date || formData.contract_date; break;
  }
  if (businessDateString) return new Date(businessDateString + 'T12:00:00');
  return new Date(fallbackDate);
};
const getDurationBetween = (startDate: Date, endDate: Date) => {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
  if (diffDays === 0) return 'Mesmo dia';
  return diffDays + ' dias';
};
const getTotalDuration = (timelineData: TimelineEvent[], formData: Contract) => {
  if (timelineData.length === 0) return '0 dias';
  const latestEvent = timelineData[0];
  const oldestEvent = timelineData[timelineData.length - 1];
  const endDate = getEffectiveDate(latestEvent.new_status, latestEvent.changed_at, formData);
  const startDate = getEffectiveDate(oldestEvent.new_status, oldestEvent.changed_at, formData);
  return getDurationBetween(startDate, endDate);
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
  partners: Partner[]; onOpenPartnerManager: () => void; analysts: Analyst[]; onOpenAnalystManager: () => void;
  onCNPJSearch: () => void; processes: ContractProcess[]; currentProcess: ContractProcess; setCurrentProcess: React.Dispatch<React.SetStateAction<ContractProcess>>; editingProcessIndex: number | null; handleProcessAction: () => void; editProcess: (idx: number) => void; removeProcess: (idx: number) => void; newIntermediateFee: string; setNewIntermediateFee: (v: string) => void; addIntermediateFee: () => void; removeIntermediateFee: (idx: number) => void; timelineData: TimelineEvent[]; getStatusColor: (s: string) => string; getStatusLabel: (s: string) => string;
}

export function ContractFormModal(props: Props) {
  const { 
    isOpen, onClose, formData, setFormData, onSave, loading: parentLoading, isEditing,
    partners, onOpenPartnerManager, analysts, onOpenAnalystManager,
    processes, currentProcess, setCurrentProcess, editingProcessIndex, handleProcessAction, editProcess, removeProcess,
    newIntermediateFee, setNewIntermediateFee, addIntermediateFee, removeIntermediateFee,
    timelineData, getStatusLabel
  } = props;
  
  const [localLoading, setLocalLoading] = useState(false);
  const [documents, setDocuments] = useState<ContractDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [searchingCNJ, setSearchingCNJ] = useState(false);
  const [statusOptions, setStatusOptions] = useState<{label: string, value: string}[]>([]);
  const [billingLocations, setBillingLocations] = useState(['Salomão RJ', 'Salomão SP', 'Salomão SC', 'Salomão ES']);
  const [clientExtraData, setClientExtraData] = useState({ address: '', number: '', complement: '', city: '', email: '', is_person: false });

  const isLoading = parentLoading || localLoading;

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
    const { data } = await supabase.from('contract_statuses').select('*');
    if (data) {
      const order = ['analysis', 'proposal', 'active', 'rejected', 'probono'];
      const sortedData = data.sort((a, b) => {
        const indexA = order.indexOf(a.value);
        const indexB = order.indexOf(b.value);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.label.localeCompare(b.label);
      });
      const options = sortedData.map(s => ({ label: s.label, value: s.value }));
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

  const handleAddToList = (listField: string, valueField: keyof Contract) => {
    const value = (formData as any)[valueField];
    if (!value || value === 'R$ 0,00' || value === '') return;

    setFormData(prev => ({
      ...prev,
      [listField]: [...(prev as any)[listField] || [], value],
      [valueField]: '' 
    }));
  };

  const removeExtra = (field: string, index: number) => {
    setFormData((prev: any) => {
      const newList = [...(prev[field] || [])];
      newList.splice(index, 1);
      return { ...prev, [field]: newList };
    });
  };

  const updateExtra = (field: string, index: number, value: string) => {
    setFormData((prev: any) => {
      const newList = [...(prev[field] || [])];
      newList[index] = value;
      return { ...prev, [field]: newList };
    });
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
    addInstallments(formData.final_success_fee, formData.final_success_fee_installments, 'final_success_fee');
    addInstallments(formData.fixed_monthly_fee, formData.fixed_monthly_fee_installments, 'fixed');
    addInstallments(formData.other_fees, formData.other_fees_installments, 'other');

    const extrasConfig = [
      { field: 'pro_labore_extras', type: 'pro_labore' },
      { field: 'final_success_extras', type: 'final_success_fee' },
      { field: 'fixed_monthly_extras', type: 'fixed' },
      { field: 'other_fees_extras', type: 'other' }
    ];

    extrasConfig.forEach(config => {
      const list = (formData as any)[config.field];
      if (list && Array.isArray(list)) {
        list.forEach((val: string) => {
          const amount = parseCurrency(val);
          if (amount > 0) {
            installmentsToInsert.push({ 
              contract_id: contractId, 
              type: config.type, 
              installment_number: 1, 
              total_installments: 1, 
              amount: amount, 
              status: 'pending', 
              due_date: addMonths(new Date(), 1).toISOString() 
            });
          }
        });
      }
    });

    if (formData.intermediate_fees && formData.intermediate_fees.length > 0) {
      formData.intermediate_fees.forEach(fee => {
        const val = parseCurrency(fee);
        if (val > 0) installmentsToInsert.push({ contract_id: contractId, type: 'intermediate_fee', installment_number: 1, total_installments: 1, amount: val, status: 'pending', due_date: addMonths(new Date(), 1).toISOString() });
      });
    }
    if (installmentsToInsert.length > 0) await supabase.from('financial_installments').insert(installmentsToInsert);
  };

  const forceUpdateFinancials = async (contractId: string) => {
    // Garante que pegamos os valores ou strings vazias, e o parseCurrency limpará
    const cleanPL = parseCurrency(formData.pro_labore || "");
    const cleanSuccess = parseCurrency(formData.final_success_fee || "");
    const cleanFixed = parseCurrency(formData.fixed_monthly_fee || "");
    const cleanOther = parseCurrency(formData.other_fees || "");

    await supabase.from('contracts').update({
      pro_labore: cleanPL,
      final_success_fee: cleanSuccess,
      fixed_monthly_fee: cleanFixed,
      other_fees: cleanOther
    }).eq('id', contractId);
  };

  const handleSaveWithIntegrations = async () => {
    if (!formData.client_name) return alert('O "Nome do Cliente" é obrigatório.');
    if (!formData.partner_id) return alert('O "Responsável (Sócio)" é obrigatório.');

    if (formData.status === 'analysis' && !formData.prospect_date) return alert('A "Data Prospect" é obrigatória para contratos em Análise.');
    if (formData.status === 'proposal' && !formData.proposal_date) return alert('A "Data Proposta" é obrigatória para Propostas Enviadas.');
    if (formData.status === 'active') {
      if (!formData.contract_date) return alert('A "Data Assinatura" é obrigatória para Contratos Fechados.');
      if (!formData.hon_number) return alert('O "Número HON" é obrigatório para Contratos Fechados.');
      if (!formData.billing_location) return alert('O "Local Faturamento" é obrigatório para Contratos Fechados.');
      if (formData.physical_signature === undefined) return alert('Informe se "Possui Assinatura Física" para Contratos Fechados.');
    }

    setLocalLoading(true);
    try {
        const clientId = await upsertClient();
        
        const contractPayload: any = {
            ...formData,
            client_id: clientId || formData.client_id,
            pro_labore: parseCurrency(formData.pro_labore),
            final_success_fee: parseCurrency(formData.final_success_fee),
            fixed_monthly_fee: parseCurrency(formData.fixed_monthly_fee),
            other_fees: parseCurrency(formData.other_fees),
            
            // REMOVE CAMPOS VIRTUAIS/ESTRANGEIROS
            partner_name: undefined,
            analyzed_by_name: undefined,
            process_count: undefined,
            analyst: undefined,
            analysts: undefined, 
            client: undefined,   
            partner: undefined,  
            processes: undefined,
            partners: undefined,
            id: undefined,
            
            // Remove arrays de controle local
            pro_labore_extras: undefined,
            final_success_extras: undefined,
            fixed_monthly_extras: undefined,
            other_fees_extras: undefined,
            percent_extras: undefined
        };

        Object.keys(contractPayload).forEach(key => contractPayload[key] === undefined && delete contractPayload[key]);

        let savedId = formData.id;

        if (formData.id) {
            const { error } = await supabase.from('contracts').update(contractPayload).eq('id', formData.id);
            if (error) throw error;
        } else {
            const { data, error } = await supabase.from('contracts').insert(contractPayload).select().single();
            if (error) throw error;
            savedId = data.id;
        }

        if (savedId) {
            // --- AQUI ESTAVA FALTANDO A CHAMADA ---
            await forceUpdateFinancials(savedId); 
            // -------------------------------------

            await generateFinancialInstallments(savedId);
            
            if (formData.status === 'active' && formData.physical_signature === false) {
                const { data } = await supabase.from('kanban_tasks').select('id').eq('contract_id', savedId).eq('status', 'signature').single();
                if (!data) {
                  const dueDate = addDays(new Date(), 5);
                  await supabase.from('kanban_tasks').insert({ title: `Coletar Assinatura: ${formData.client_name}`, description: `Contrato fechado em ${new Date().toLocaleDateString()}. Coletar assinatura física.`, priority: 'Alta', status: 'signature', contract_id: savedId, due_date: dueDate.toISOString(), position: 0 });
                }
            }
        }

        onSave();
        onClose();

    } catch (error: any) {
        console.error('Erro ao salvar contrato:', error);
        if (error.code === '23505' || error.message?.includes('contracts_hon_number_key')) {
            alert('⚠️ Duplicidade de Caso Detectada\n\nJá existe um contrato cadastrado com este Número HON.\n\nPor favor, verifique se o número foi digitado corretamente ou se este caso já foi inserido anteriormente.');
        } else if (error.code === 'PGRST204') {
             console.warn('Erro de estrutura de dados:', error.message);
             const column = error.message.match(/'([^']+)'/)?.[1];
             alert(`Erro Técnico: O sistema tentou salvar um campo inválido (${column || 'desconhecido'}).\n\nIsso geralmente ocorre ao editar dados carregados. Tente recarregar a página.`);
        } else {
            alert('Não foi possível salvar as alterações.\n\nVerifique sua conexão com a internet e se todos os campos obrigatórios (*) estão preenchidos.');
        }
    } finally {
        setLocalLoading(false);
    }
  };

  // ... (Resto do componente inalterado) ...
  const handleAddLocation = () => { /* ... */ };
  const handleCNPJSearch = async () => { /* ... */ };
  const handleCNJSearch = async () => { /* ... */ };
  const handleOpenJusbrasil = () => { /* ... */ };
  const handleFileUpload = async (e: any, t: any) => { /* ... */ };
  const handleDownload = async (p: string) => { /* ... */ };
  const handleDeleteDocument = async (id: string, p: string) => { /* ... */ };
  const handleTextChange = (field: keyof Contract, value: string) => { setFormData({ ...formData, [field]: toTitleCase(value) }); };

  const partnerSelectOptions = partners.map(p => ({ label: p.name, value: p.id }));
  const analystSelectOptions = analysts ? analysts.map(a => ({ label: a.name, value: a.id })) : [];
  const ufOptions = UFS.map(uf => ({ label: uf.nome, value: uf.sigla }));
  const positionOptions = [{ label: 'Autor', value: 'Autor' }, { label: 'Réu', value: 'Réu' }, { label: 'Terceiro Interessado', value: 'Terceiro' }];
  const billingOptions = billingLocations.map(l => ({ label: l, value: l }));
  const signatureOptions = [{ label: 'Sim', value: 'true' }, { label: 'Não (Cobrar)', value: 'false' }];
  const rejectionByOptions = [{ label: 'Cliente', value: 'Cliente' }, { label: 'Escritório', value: 'Escritório' }];
  const rejectionReasonOptions = [{ label: 'Cliente declinou', value: 'Cliente declinou' }, { label: 'Cliente não retornou', value: 'Cliente não retornou' }, { label: 'Caso ruim', value: 'Caso ruim' }, { label: 'Conflito de interesses', value: 'Conflito de interesses' }];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[50] p-4 overflow-y-auto">
      <div className={`w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[95vh] animate-in fade-in zoom-in duration-200 transition-colors duration-500 ease-in-out ${getThemeBackground(formData.status)}`}>
        {/* Header */}
        <div className="p-6 border-b border-black/5 flex justify-between items-center bg-white/50 backdrop-blur-sm rounded-t-2xl">
          <div><h2 className="text-xl font-bold text-gray-800">{isEditing ? 'Editar Caso' : 'Novo Caso'}</h2></div>
          <button onClick={onClose}><X className="w-6 h-6 text-gray-400" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          <div className="bg-white/60 p-6 rounded-xl border border-white/40 shadow-sm backdrop-blur-sm relative z-50">
            <CustomSelect label="Status Atual do Caso" value={formData.status} onChange={(val: any) => setFormData({...formData, status: val})} options={statusOptions} onAction={handleCreateStatus} actionIcon={Plus} actionLabel="Adicionar Novo Status" />
          </div>

          <section className="space-y-5">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b border-black/5 pb-2">Dados do Cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">CNPJ/CPF</label>
                <div className="flex gap-2">
                  <input type="text" disabled={formData.has_no_cnpj} className="flex-1 border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-salomao-blue disabled:bg-gray-100 bg-white" placeholder="00.000.000/0000-00" value={formData.cnpj} onChange={(e) => setFormData({...formData, cnpj: maskCNPJ(e.target.value)})}/>
                  <button onClick={handleCNPJSearch} disabled={formData.has_no_cnpj || !formData.cnpj} className="bg-white hover:bg-gray-50 text-gray-600 p-2.5 rounded-lg border border-gray-300 disabled:opacity-50"><Search className="w-4 h-4" /></button>
                </div>
                <div className="flex items-center mt-2"><input type="checkbox" id="no_cnpj" className="rounded text-salomao-blue focus:ring-salomao-blue" checked={formData.has_no_cnpj} onChange={(e) => setFormData({...formData, has_no_cnpj: e.target.checked, cnpj: ''})}/><label htmlFor="no_cnpj" className="ml-2 text-xs text-gray-500">Sem CNPJ (Pessoa Física)</label></div>
              </div>
              <div className="md:col-span-6"><label className="block text-xs font-medium text-gray-600 mb-1">Nome do Cliente <span className="text-red-500">*</span></label><input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-salomao-blue bg-white" value={formData.client_name} onChange={(e) => handleTextChange('client_name', e.target.value)} /></div>
              <div className="md:col-span-3"><CustomSelect label="Posição no Processo" value={formData.client_position} onChange={(val: string) => setFormData({...formData, client_position: val})} options={positionOptions} /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Área do Direito</label><input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white" placeholder="Ex: Trabalhista, Cível..." value={formData.area} onChange={(e) => handleTextChange('area', e.target.value)} /></div>
              <div><CustomSelect label="Responsável (Sócio) *" value={formData.partner_id} onChange={(val: string) => setFormData({...formData, partner_id: val})} options={partnerSelectOptions} onAction={onOpenPartnerManager} actionIcon={Settings} actionLabel="Gerenciar Sócios" /></div>
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
                {processes.length > 0 && (<div className="space-y-2 mt-4">{processes.map((p, idx) => (<div key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:border-blue-200 transition-colors group"><div className="grid grid-cols-3 gap-4 flex-1 text-xs"><span className="font-mono font-medium text-gray-800">{p.process_number}</span><span className="text-gray-600">{p.court} ({formData.uf})</span><span className="text-gray-500 truncate">{p.judge}</span></div><div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => editProcess(idx)} className="text-blue-500 hover:bg-blue-50 p-1 rounded"><Edit className="w-4 h-4" /></button><button onClick={() => removeProcess(idx)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 className="w-4 h-4" /></button></div></div>))}</div>)}
              </div>
            )}
          </section>

          <section className="border-t border-black/5 pt-6">
            <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-6 flex items-center"><Clock className="w-4 h-4 mr-2" />Detalhes da Fase: {getStatusLabel(formData.status)}</h3>
            
            {(formData.status === 'analysis') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6 p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                <div><label className="text-xs font-medium block mb-1 text-yellow-800">Data Prospect <span className="text-red-500">*</span></label><input type="date" className="w-full border border-yellow-200 p-2.5 rounded-lg text-sm bg-white" value={formData.prospect_date || ''} onChange={e => setFormData({...formData, prospect_date: e.target.value})} /></div>
                <div><CustomSelect label="Analisado Por" value={formData.analyst_id || ''} onChange={(val: string) => setFormData({...formData, analyst_id: val})} options={analystSelectOptions} onAction={onOpenAnalystManager} actionIcon={Settings} actionLabel="Gerenciar Analistas" className="bg-white border-yellow-200" /></div>
              </div>
            )}
            
            {(formData.status === 'proposal' || formData.status === 'active') && (
              <div className="space-y-6 animate-in slide-in-from-top-2">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-start">
                   <div>
                     <label className="text-xs font-medium block mb-1">{formData.status === 'proposal' ? 'Data Proposta *' : 'Data Assinatura *'}</label>
                     <input type="date" className="w-full border border-gray-300 p-2.5 rounded-lg text-sm bg-white" value={formData.status === 'proposal' ? formData.proposal_date : formData.contract_date} onChange={e => setFormData({...formData, [formData.status === 'proposal' ? 'proposal_date' : 'contract_date']: e.target.value})} />
                   </div>
                   <div>
                     <FinancialInputWithInstallments 
                       label="Pró-Labore (R$)" 
                       value={formData.pro_labore} onChangeValue={(v: any) => setFormData({...formData, pro_labore: v})}
                       installments={formData.pro_labore_installments} onChangeInstallments={(v: any) => setFormData({...formData, pro_labore_installments: v})}
                       onAdd={() => handleAddToList('pro_labore_extras', 'pro_labore')} 
                     />
                     <div className="flex flex-wrap gap-2 mt-2">
                       {(formData as any).pro_labore_extras?.map((val: string, idx: number) => (
                         <span key={idx} className="bg-white border border-blue-100 px-3 py-1 rounded-full text-xs text-blue-800 flex items-center shadow-sm">
                           {val}<button onClick={() => removeExtra('pro_labore_extras', idx)} className="ml-2 text-blue-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                         </span>
                       ))}
                     </div>
                   </div>
                   <div>
                     <FinancialInputWithInstallments 
                       label="Êxito Intermediário" 
                       value={newIntermediateFee} onChangeValue={setNewIntermediateFee}
                       installments="1x" onChangeInstallments={() => {}} 
                       onAdd={addIntermediateFee}
                     />
                     <div className="flex flex-wrap gap-2 mt-2">
                       {formData.intermediate_fees?.map((fee, idx) => (
                         <span key={idx} className="bg-white border border-blue-100 px-3 py-1 rounded-full text-xs text-blue-800 flex items-center shadow-sm">{fee}<button onClick={() => removeIntermediateFee(idx)} className="ml-2 text-blue-400 hover:text-red-500"><X className="w-3 h-3" /></button></span>
                       ))}
                     </div>
                   </div>
                   <div>
                     <FinancialInputWithInstallments 
                       label="Êxito Final (R$)" 
                       value={formData.final_success_fee} onChangeValue={(v: any) => setFormData({...formData, final_success_fee: v})}
                       installments={formData.final_success_fee_installments} onChangeInstallments={(v: any) => setFormData({...formData, final_success_fee_installments: v})}
                       onAdd={() => handleAddToList('final_success_extras', 'final_success_fee')}
                     />
                     <div className="flex flex-wrap gap-2 mt-2">
                       {(formData as any).final_success_extras?.map((val: string, idx: number) => (
                         <span key={idx} className="bg-white border border-blue-100 px-3 py-1 rounded-full text-xs text-blue-800 flex items-center shadow-sm">
                           {val}<button onClick={() => removeExtra('final_success_extras', idx)} className="ml-2 text-blue-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                         </span>
                       ))}
                     </div>
                   </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
                  <div>
                    <label className="text-xs font-medium block mb-1">Êxito %</label>
                    <div className="flex rounded-lg shadow-sm">
                      <input type="text" className="flex-1 border border-gray-300 rounded-l-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-salomao-blue outline-none min-w-0" placeholder="Ex: 20%" value={formData.final_success_percent} onChange={e => setFormData({...formData, final_success_percent: e.target.value})} />
                      <button className="bg-salomao-blue text-white px-3 rounded-r-lg hover:bg-blue-900 border-l border-blue-800" type="button" onClick={() => handleAddToList('percent_extras', 'final_success_percent')}><Plus className="w-4 h-4" /></button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                       {(formData as any).percent_extras?.map((val: string, idx: number) => (
                         <span key={idx} className="bg-white border border-blue-100 px-3 py-1 rounded-full text-xs text-blue-800 flex items-center shadow-sm">
                           {val}<button onClick={() => removeExtra('percent_extras', idx)} className="ml-2 text-blue-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                         </span>
                       ))}
                     </div>
                  </div>
                  <div>
                    <FinancialInputWithInstallments 
                      label="Outros Honorários (R$)" 
                      value={formData.other_fees} onChangeValue={(v: any) => setFormData({...formData, other_fees: v})} 
                      installments={formData.other_fees_installments} onChangeInstallments={(v: any) => setFormData({...formData, other_fees_installments: v})}
                      onAdd={() => handleAddToList('other_fees_extras', 'other_fees')}
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                       {(formData as any).other_fees_extras?.map((val: string, idx: number) => (
                         <span key={idx} className="bg-white border border-blue-100 px-3 py-1 rounded-full text-xs text-blue-800 flex items-center shadow-sm">
                           {val}<button onClick={() => removeExtra('other_fees_extras', idx)} className="ml-2 text-blue-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                         </span>
                       ))}
                     </div>
                  </div>
                  <div>
                    <FinancialInputWithInstallments 
                      label="Fixo Mensal (R$)" 
                      value={formData.fixed_monthly_fee} onChangeValue={(v: any) => setFormData({...formData, fixed_monthly_fee: v})}
                      installments={formData.fixed_monthly_fee_installments} onChangeInstallments={(v: any) => setFormData({...formData, fixed_monthly_fee_installments: v})}
                      onAdd={() => handleAddToList('fixed_monthly_extras', 'fixed_monthly_fee')}
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                       {(formData as any).fixed_monthly_extras?.map((val: string, idx: number) => (
                         <span key={idx} className="bg-white border border-blue-100 px-3 py-1 rounded-full text-xs text-blue-800 flex items-center shadow-sm">
                           {val}<button onClick={() => removeExtra('fixed_monthly_extras', idx)} className="ml-2 text-blue-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                         </span>
                       ))}
                     </div>
                  </div>
                </div>
                <div className="flex items-end pb-3"><div className="flex items-center"><input type="checkbox" id="timesheet" checked={formData.timesheet} onChange={e => setFormData({...formData, timesheet: e.target.checked})} className="w-4 h-4 text-salomao-blue rounded border-gray-300 focus:ring-salomao-blue" /><label htmlFor="timesheet" className="ml-2 text-sm text-gray-700 font-medium whitespace-nowrap">Hon. de Timesheet</label></div></div>
              </div>
            )}

            {(formData.status === 'proposal' || formData.status === 'active') && (
              <div className="mb-8 mt-6">
                <div className="flex items-center justify-between mb-4"><label className="text-xs font-bold text-gray-500 uppercase flex items-center"><FileText className="w-4 h-4 mr-2" />Arquivos & Documentos</label>{!isEditing ? (<span className="text-xs text-orange-500 flex items-center"><AlertCircle className="w-3 h-3 mr-1" /> Salve o caso para anexar arquivos</span>) : (<label className="cursor-pointer bg-white border border-dashed border-salomao-blue text-salomao-blue px-4 py-2 rounded-lg text-xs font-medium hover:bg-blue-50 transition-colors flex items-center">{uploading ? 'Enviando...' : <><Upload className="w-3 h-3 mr-2" /> Anexar PDF</>}<input type="file" accept="application/pdf" className="hidden" disabled={uploading} onChange={(e) => handleFileUpload(e, formData.status === 'active' ? 'contract' : 'proposal')} /></label>)}</div>
                {documents.length > 0 ? (<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{documents.map((doc) => (<div key={doc.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 group"><div className="flex items-center overflow-hidden"><div className="bg-red-100 p-2 rounded text-red-600 mr-3"><FileText className="w-4 h-4" /></div><div className="flex-1 min-w-0"><p className="text-xs font-medium text-gray-700 truncate" title={doc.file_name}>{doc.file_name}</p><div className="flex items-center text-[10px] text-gray-400 mt-0.5"><span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>{doc.hon_number_ref && (<span className="ml-2 bg-green-100 text-green-700 px-1.5 py-0.5 rounded border border-green-200">HON: {maskHon(doc.hon_number_ref)}</span>)}</div></div></div><div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => handleDownload(doc.file_path)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded"><Download className="w-4 h-4" /></button><button onClick={() => handleDeleteDocument(doc.id, doc.file_path)} className="p-1.5 text-red-600 hover:bg-red-100 rounded"><Trash2 className="w-4 h-4" /></button></div></div>))}</div>) : (isEditing && <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-lg text-xs text-gray-400">Nenhum arquivo anexado.</div>)}
              </div>
            )}

            {formData.status === 'active' && (
              <div className="mt-6 p-4 bg-white/70 border border-green-200 rounded-xl animate-in fade-in">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                  <div className="md:col-span-4"><label className="text-xs font-medium block mb-1 text-green-800">Número HON (Único) <span className="text-red-500">*</span></label><input type="text" className="w-full border-2 border-green-200 p-2.5 rounded-lg text-green-900 font-mono font-bold bg-white focus:border-green-500 outline-none" placeholder="0000000/000" value={formData.hon_number} onChange={e => setFormData({...formData, hon_number: maskHon(e.target.value)})} /></div>
                  <div className="md:col-span-4"><CustomSelect label="Local Faturamento *" value={formData.billing_location || ''} onChange={(val: string) => setFormData({...formData, billing_location: val})} options={billingOptions} onAction={handleAddLocation} actionLabel="Adicionar Local" /></div>
                  <div className="md:col-span-4"><CustomSelect label="Possui Assinatura Física? *" value={formData.physical_signature === true ? 'true' : formData.physical_signature === false ? 'false' : ''} onChange={(val: string) => { setFormData({...formData, physical_signature: val === 'true' ? true : val === 'false' ? false : undefined}); }} options={signatureOptions} /></div>
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
                    duration = getDurationBetween(prevEventDate, currentEventDate);
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
          <button onClick={handleSaveWithIntegrations} disabled={isLoading} className="px-6 py-2 bg-salomao-blue text-white rounded-lg hover:bg-blue-900 shadow-lg flex items-center transition-all transform active:scale-95">{isLoading ? 'Salvando...' : <><Save className="w-4 h-4 mr-2" /> Salvar Caso</>}</button>
        </div>
      </div>
    </div>
  );
}