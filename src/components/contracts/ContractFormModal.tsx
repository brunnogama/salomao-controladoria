import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '../../lib/supabase';
import { Plus, X, Save, Settings, Check, ChevronDown, Clock, Edit, Trash2, Upload, FileText, Download, AlertCircle, Search, Loader2, Link as LinkIcon, AlertTriangle, Pencil, Gavel, Eye } from 'lucide-react';
import { Contract, Partner, ContractProcess, TimelineEvent, ContractDocument, Analyst, Magistrate } from '../../types';
import { maskCNPJ, maskMoney, maskHon, maskCNJ, toTitleCase, parseCurrency, safeParseFloat } from '../../utils/masks'; // Importado de masks
import { decodeCNJ } from '../../utils/cnjDecoder';
import { addDays, addMonths } from 'date-fns';
import { CustomSelect } from '../ui/CustomSelect';
import { toast } from 'sonner';
import { contractSchema, ContractFormValues } from '../../schemas/contractSchema'; // Importe o Schema

// --- COMPONENTES AUXILIARES (INLINE PARA GARANTIR FUNCIONAMENTO IMEDIATO) ---

// Minimal Select
const MinimalSelect = ({ value, onChange, options }: { value: string, onChange: (val: string) => void, options: string[] }) => (
    <div className="relative h-full w-full">
        <select className="w-full h-full appearance-none bg-transparent pl-3 pr-8 text-xs font-medium text-gray-700 outline-none cursor-pointer focus:bg-gray-50 transition-colors" value={value || '1x'} onChange={(e) => onChange(e.target.value)}>
            {options.map(opt => (<option key={opt} value={opt}>{opt}</option>))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
    </div>
);

// Option Manager Local
const OptionManager = ({ title, options, onAdd, onRemove, onEdit, onClose, placeholder = "Digite o nome" }: any) => {
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [editingItem, setEditingItem] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!inputValue.trim()) return;
        setLoading(true);
        let success = false;
        if (editingItem) { success = await onEdit(editingItem, inputValue.trim()); if (success) setEditingItem(null); } 
        else { success = await onAdd(inputValue.trim()); if (success) onClose(); }
        setLoading(false); if (success) setInputValue('');
    };
    const handleEditClick = (item: string) => { setEditingItem(item); setInputValue(item); };
    const handleCancelEdit = () => { setEditingItem(null); setInputValue(''); };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70]">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50"><h3 className="font-bold text-gray-800">{title}</h3><button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button></div>
            <div className="p-4">
              <div className="flex gap-2 mb-4"><input type="text" className="flex-1 border border-gray-300 rounded-lg p-2 text-sm" placeholder={placeholder} value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSubmit()} />{editingItem && <button onClick={handleCancelEdit} className="bg-gray-200 text-gray-600 p-2 rounded-lg hover:bg-gray-300"><X className="w-5 h-5" /></button>}<button onClick={handleSubmit} disabled={loading} className={`${editingItem ? 'bg-green-600 hover:bg-green-700' : 'bg-salomao-blue'} text-white p-2 rounded-lg disabled:opacity-50 transition-colors`}>{loading ? <Loader2 className="w-5 h-5 animate-spin"/> : (editingItem ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />)}</button></div>
              <div className="space-y-2 max-h-60 overflow-y-auto">{options.map((opt: string, idx: number) => (<div key={idx} className={`flex items-center justify-between p-2 rounded-lg group ${editingItem === opt ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}><span className="text-sm text-gray-700 truncate flex-1 mr-2">{opt}</span><div className="flex items-center gap-1"><button onClick={() => handleEditClick(opt)} className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-blue-100 rounded"><Pencil className="w-4 h-4" /></button><button onClick={() => onRemove(opt)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded"><Trash2 className="w-4 h-4" /></button></div></div>))}{options.length === 0 && <p className="text-xs text-center text-gray-400 py-4">Nenhum item cadastrado.</p>}</div>
            </div>
          </div>
        </div>
    );
};

// Financial Input
const FinancialInputWithInstallments = ({ label, value, onChangeValue, installments, onChangeInstallments, onAdd, clause, onChangeClause }: any) => {
  const installmentOptions = Array.from({ length: 24 }, (_, i) => `${i + 1}x`);
  return (
    <div>
      <label className="text-xs font-medium block mb-1 text-gray-600">{label}</label>
      <div className="flex rounded-lg shadow-sm">
        {onChangeClause && (<input type="text" className="w-14 border border-gray-300 rounded-l-lg p-2.5 text-sm bg-gray-50 focus:border-salomao-blue outline-none border-r-0 placeholder-gray-400 text-center" value={clause || ''} onChange={(e) => onChangeClause(e.target.value)} placeholder="Cl." title="Cláusula (ex: 2.1)" />)}
        <input type="text" className={`flex-1 border border-gray-300 p-2.5 text-sm bg-white focus:border-salomao-blue outline-none min-w-0 ${!onChangeClause ? 'rounded-l-lg' : ''} ${!onAdd ? 'rounded-r-none border-r-0' : ''}`} value={value || ''} onChange={(e) => onChangeValue(maskMoney(e.target.value))} placeholder="R$ 0,00" />
        <div className={`w-16 border-y border-r border-gray-300 bg-gray-50 ${!onAdd ? 'rounded-r-lg' : ''}`}><MinimalSelect value={installments || '1x'} onChange={onChangeInstallments} options={installmentOptions} /></div>
        {onAdd && (<button onClick={onAdd} className="bg-salomao-blue text-white px-2 rounded-r-lg hover:bg-blue-900 transition-colors flex items-center justify-center border-l border-blue-800" type="button" title="Adicionar valor"><Plus className="w-4 h-4" /></button>)}
      </div>
    </div>
  );
};

// --- PROPS ---
interface Props {
  isOpen: boolean; onClose: () => void; formData: Contract; setFormData: React.Dispatch<React.SetStateAction<Contract>>; onSave: () => void; loading: boolean; isEditing: boolean;
  partners: Partner[]; onOpenPartnerManager: () => void; analysts: Analyst[]; onOpenAnalystManager: () => void;
  // Removi props que podem ser calculadas localmente para simplificar
  processes: ContractProcess[]; currentProcess: ContractProcess; setCurrentProcess: React.Dispatch<React.SetStateAction<ContractProcess>>; editingProcessIndex: number | null; handleProcessAction: () => void; editProcess: (idx: number) => void; removeProcess: (idx: number) => void; newIntermediateFee: string; setNewIntermediateFee: (v: string) => void; addIntermediateFee: () => void; removeIntermediateFee: (idx: number) => void; timelineData: TimelineEvent[]; getStatusColor: (s: string) => string; getStatusLabel: (s: string) => string;
}

// --- CONSTANTS ---
const UFS = [ { sigla: 'AC', nome: 'Acre' }, { sigla: 'AL', nome: 'Alagoas' }, { sigla: 'AP', nome: 'Amapá' }, { sigla: 'AM', nome: 'Amazonas' }, { sigla: 'BA', nome: 'Bahia' }, { sigla: 'CE', nome: 'Ceará' }, { sigla: 'DF', nome: 'Distrito Federal' }, { sigla: 'ES', nome: 'Espírito Santo' }, { sigla: 'GO', nome: 'Goiás' }, { sigla: 'MA', nome: 'Maranhão' }, { sigla: 'MT', nome: 'Mato Grosso' }, { sigla: 'MS', nome: 'Mato Grosso do Sul' }, { sigla: 'MG', nome: 'Minas Gerais' }, { sigla: 'PA', nome: 'Pará' }, { sigla: 'PB', nome: 'Paraíba' }, { sigla: 'PR', nome: 'Paraná' }, { sigla: 'PE', nome: 'Pernambuco' }, { sigla: 'PI', nome: 'Piauí' }, { sigla: 'RJ', nome: 'Rio de Janeiro' }, { sigla: 'RN', nome: 'Rio Grande do Norte' }, { sigla: 'RS', nome: 'Rio Grande do Sul' }, { sigla: 'RO', nome: 'Rondônia' }, { sigla: 'RR', nome: 'Roraima' }, { sigla: 'SC', nome: 'Santa Catarina' }, { sigla: 'SP', nome: 'São Paulo' }, { sigla: 'SE', nome: 'Sergipe' }, { sigla: 'TO', nome: 'Tocantins' } ];
const DEFAULT_COURTS = ['STF', 'STJ', 'TST', 'TRF1', 'TRF2', 'TRF3', 'TRF4', 'TRF5', 'TJSP', 'TJRJ', 'TJMG', 'TJRS', 'TJPR', 'TJSC', 'TJBA', 'TJDFT', 'TRT1', 'TRT2', 'TRT15'];
const DEFAULT_CLASSES = ['Procedimento Comum', 'Execução de Título Extrajudicial', 'Monitória', 'Mandado de Segurança', 'Ação Trabalhista - Rito Ordinário', 'Ação Trabalhista - Rito Sumaríssimo', 'Recurso Ordinário', 'Agravo de Instrumento', 'Apelação'];
const DEFAULT_SUBJECTS = ['Dano Moral', 'Dano Material', 'Inadimplemento', 'Rescisão Indireta', 'Verbas Rescisórias', 'Acidente de Trabalho', 'Doença Ocupacional', 'Horas Extras', 'Assédio Moral'];
const DEFAULT_POSITIONS = ['Autor', 'Réu', 'Terceiro Interessado', 'Exequente', 'Executado', 'Reclamante', 'Reclamado', 'Apelante', 'Apelado', 'Agravante', 'Agravado', 'Impetrante', 'Impetrado'];
const DEFAULT_VARAS = ['Cível', 'Criminal', 'Família', 'Trabalho', 'Fazenda Pública', 'Juizado Especial', 'Execuções Fiscais'];
const DEFAULT_JUSTICES = ['Estadual', 'Federal', 'Trabalho', 'Eleitoral', 'Militar'];

const ensureArray = (val: any): string[] => { if (Array.isArray(val)) return val; if (typeof val === 'string') { try { return JSON.parse(val); } catch { return []; } } return []; };
const getThemeBackground = (status: string) => { switch (status) { case 'analysis': return 'bg-yellow-50'; case 'proposal': return 'bg-blue-50'; case 'active': return 'bg-green-50'; case 'rejected': return 'bg-red-50'; default: return 'bg-gray-50'; } };

export function ContractFormModal(props: Props) {
  const { 
    isOpen, onClose, formData, setFormData, onSave, loading: parentLoading, isEditing,
    partners, onOpenPartnerManager, analysts, onOpenAnalystManager,
    processes, currentProcess, setCurrentProcess, editingProcessIndex, handleProcessAction, editProcess, removeProcess,
    newIntermediateFee, setNewIntermediateFee, addIntermediateFee, removeIntermediateFee
  } = props;

  // React Hook Form Setup
  const { register, handleSubmit, control, setValue, watch, reset, formState: { errors } } = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema),
    defaultValues: formData as any
  });

  const watchedStatus = watch('status');

  // Sync Form State
  useEffect(() => {
    if (isOpen) {
      reset(formData as any);
      fetchStatuses();
      fetchAuxiliaryTables();
      if (formData.id) fetchDocuments();
      setInitialFormData(JSON.parse(JSON.stringify(formData)));
    } else {
      setDocuments([]);
      setClientExtraData({ address: '', number: '', complement: '', city: '', email: '', is_person: false });
      setCurrentProcess(prev => ({ ...prev, process_number: '', uf: '', position: '' })); 
      setDuplicateClientCases([]);
      setDuplicateOpponentCases([]);
      setDuplicateProcessWarning(false);
      setInitialFormData(null);
      setActiveManager(null);
    }
  }, [isOpen, formData, reset]);

  // Local States
  const [localLoading, setLocalLoading] = useState(false);
  const [documents, setDocuments] = useState<ContractDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [searchingCNJ, setSearchingCNJ] = useState(false);
  const [statusOptions, setStatusOptions] = useState<{label: string, value: string}[]>([]);
  const [billingLocations, setBillingLocations] = useState(['Salomão RJ', 'Salomão SP', 'Salomão SC', 'Salomão ES', 'Salomão DF']);
  const [clientExtraData, setClientExtraData] = useState({ address: '', number: '', complement: '', city: '', email: '', is_person: false });
  const [interimInstallments, setInterimInstallments] = useState('1x');
  const [interimClause, setInterimClause] = useState('');
  const [legalAreas, setLegalAreas] = useState<string[]>(['Trabalhista', 'Cível', 'Tributário', 'Empresarial', 'Previdenciário', 'Família', 'Criminal', 'Consumidor']);
  const [activeManager, setActiveManager] = useState<string | null>(null);
  const [initialFormData, setInitialFormData] = useState<Contract | null>(null);
  
  const [duplicateClientCases, setDuplicateClientCases] = useState<any[]>([]);
  const [duplicateOpponentCases, setDuplicateOpponentCases] = useState<any[]>([]);
  const [duplicateProcessWarning, setDuplicateProcessWarning] = useState<boolean>(false);

  const [newMagistrateTitle, setNewMagistrateTitle] = useState('');
  const [newMagistrateName, setNewMagistrateName] = useState('');
  const [isStandardCNJ, setIsStandardCNJ] = useState(true);
  const [otherProcessType, setOtherProcessType] = useState('');
  const [newSubject, setNewSubject] = useState('');

  const [viewProcess, setViewProcess] = useState<ContractProcess | null>(null);
  const [viewProcessIndex, setViewProcessIndex] = useState<number | null>(null);

  const [justiceOptions, setJusticeOptions] = useState<string[]>(DEFAULT_JUSTICES);
  const [varaOptions, setVaraOptions] = useState<string[]>(DEFAULT_VARAS);
  const [courtOptions, setCourtOptions] = useState<string[]>(DEFAULT_COURTS);
  const [comarcaOptions, setComarcaOptions] = useState<string[]>([]); 
  const [classOptions, setClassOptions] = useState<string[]>(DEFAULT_CLASSES);
  const [subjectOptions, setSubjectOptions] = useState<string[]>(DEFAULT_SUBJECTS);
  const [positionsList, setPositionsList] = useState<string[]>(DEFAULT_POSITIONS);
  const [magistrateOptions, setMagistrateOptions] = useState<string[]>([]);
  const [opponentOptions, setOpponentOptions] = useState<string[]>([]);
  const [clientOptions, setClientOptions] = useState<string[]>([]);

  const isLoading = parentLoading || localLoading;

  // Effects and Logic
  useEffect(() => {
    const checkClientDuplicates = async () => {
        const clientName = watch('client_name');
        if (!clientName || clientName.length < 3) { setDuplicateClientCases([]); return; }
        const { data } = await supabase.from('contracts').select('id, hon_number, status').ilike('client_name', `%${clientName}%`).neq('id', formData.id || '00000000-0000-0000-0000-000000000000').limit(5);
        if (data) setDuplicateClientCases(data);
    };
    const timer = setTimeout(checkClientDuplicates, 800); return () => clearTimeout(timer);
  }, [watch('client_name'), formData.id]);

  useEffect(() => {
    const checkOpponentDuplicates = async () => {
        if (!currentProcess.opponent || currentProcess.opponent.length < 3) { setDuplicateOpponentCases([]); return; }
        const { data } = await supabase.from('contract_processes').select('contract_id, contracts(id, client_name, hon_number)').ilike('opponent', `%${currentProcess.opponent}%`).limit(5);
        if (data) {
            const uniqueCases = data.reduce((acc: any[], current: any) => { const x = acc.find((item: any) => item.contracts?.id === current.contracts?.id); return (!x && current.contracts) ? acc.concat([current]) : acc; }, []);
            setDuplicateOpponentCases(uniqueCases);
        }
    };
    const timer = setTimeout(checkOpponentDuplicates, 800); return () => clearTimeout(timer);
  }, [currentProcess.opponent]);

  // Fetchers
  const fetchAuxiliaryTables = async () => {
    const { data: courts } = await supabase.from('courts').select('name').order('name');
    if (courts) setCourtOptions(Array.from(new Set([...DEFAULT_COURTS, ...courts.map(c => c.name)])).sort((a, b) => a.localeCompare(b)));
    const { data: classes } = await supabase.from('process_classes').select('name').order('name');
    if (classes) setClassOptions(Array.from(new Set([...DEFAULT_CLASSES, ...classes.map(c => c.name)])).sort((a, b) => a.localeCompare(b)));
    const { data: subjects } = await supabase.from('process_subjects').select('name').order('name');
    if (subjects) setSubjectOptions(Array.from(new Set([...DEFAULT_SUBJECTS, ...subjects.map(s => s.name)])).sort((a, b) => a.localeCompare(b)));
    const { data: positions } = await supabase.from('process_positions').select('name').order('name');
    if (positions) setPositionsList(Array.from(new Set([...DEFAULT_POSITIONS, ...positions.map(p => p.name)])).sort((a, b) => a.localeCompare(b)));
    const { data: varas } = await supabase.from('process_varas').select('name').order('name');
    if (varas) setVaraOptions(Array.from(new Set([...DEFAULT_VARAS, ...varas.map(v => v.name)])).sort((a, b) => a.localeCompare(b)));
    const { data: justices } = await supabase.from('process_justice_types').select('name').order('name');
    if (justices) setJusticeOptions(Array.from(new Set([...DEFAULT_JUSTICES, ...justices.map(j => j.name)])).sort((a, b) => a.localeCompare(b)));
    const { data: mags } = await supabase.from('magistrates').select('name').order('name');
    if (mags) setMagistrateOptions(mags.map(m => m.name));
    const { data: opps } = await supabase.from('opponents').select('name').order('name');
    if (opps) setOpponentOptions(opps.map(o => o.name));
    const { data: clients } = await supabase.from('clients').select('name').order('name');
    if (clients) setClientOptions(clients.map(c => c.name));
    fetchComarcas(currentProcess.uf);
  };

  const fetchComarcas = async (uf?: string) => {
    let query = supabase.from('comarcas').select('name');
    if (uf) query = query.eq('uf', uf);
    const { data } = await query.order('name');
    if (data) setComarcaOptions(data.map(c => c.name).sort((a, b) => a.localeCompare(b)));
  };
  useEffect(() => { fetchComarcas(currentProcess.uf); }, [currentProcess.uf]);

  const fetchStatuses = async () => {
    const { data } = await supabase.from('contract_statuses').select('*');
    if (data) {
      const order = ['analysis', 'proposal', 'active', 'rejected', 'probono'];
      const sortedData = data.sort((a, b) => {
        const indexA = order.indexOf(a.value);
        const indexB = order.indexOf(b.value);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        return a.label.localeCompare(b.label);
      });
      setStatusOptions([{ label: 'Selecione', value: '' }, ...sortedData.map(s => ({ label: s.label, value: s.value }))]);
    }
  };

  const handleCreateStatus = async () => {
    const newLabel = window.prompt("Digite o nome do novo Status:");
    if (!newLabel) return;
    const newValue = newLabel.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_");
    if (statusOptions.some(s => s.value === newValue)) return toast.error("Este status já existe.");
    try {
      const { error } = await supabase.from('contract_statuses').insert({ label: toTitleCase(newLabel.trim()), value: newValue, color: 'bg-gray-100 text-gray-800 border-gray-200' });
      if (error) throw error;
      await fetchStatuses();
      setValue('status', newValue as any);
      setFormData({ ...formData, status: newValue as any });
    } catch (err) { toast.error("Erro ao criar status."); }
  };

  const fetchDocuments = async () => {
    const { data } = await supabase.from('contract_documents').select('*').eq('contract_id', formData.id).order('uploaded_at', { ascending: false });
    if (data) setDocuments(data);
  };

  // Submit Logic
  const onFormSubmit = async (data: ContractFormValues) => {
    setLocalLoading(true);
    try {
        const clientId = await upsertClient();
        if (!clientId) throw new Error("Falha ao salvar/identificar cliente.");
        
        const contractPayload: any = {
            ...data,
            client_id: clientId,
            pro_labore: safeParseFloat(data.pro_labore),
            final_success_fee: safeParseFloat(data.final_success_fee),
            fixed_monthly_fee: safeParseFloat(data.fixed_monthly_fee),
            other_fees: safeParseFloat(data.other_fees),
            // Mesclando dados extras do state
            pro_labore_extras: (formData as any).pro_labore_extras,
            final_success_extras: (formData as any).final_success_extras,
            fixed_monthly_extras: (formData as any).fixed_monthly_extras,
            other_fees_extras: (formData as any).other_fees_extras,
            
            pro_labore_extras_clauses: ensureArray((formData as any).pro_labore_extras_clauses),
            final_success_extras_clauses: ensureArray((formData as any).final_success_extras_clauses),
            fixed_monthly_extras_clauses: ensureArray((formData as any).fixed_monthly_extras_clauses),
            other_fees_extras_clauses: ensureArray((formData as any).other_fees_extras_clauses),
            intermediate_fees_clauses: ensureArray((formData as any).intermediate_fees_clauses),

            pro_labore_extras_installments: ensureArray((formData as any).pro_labore_extras_installments),
            final_success_extras_installments: ensureArray((formData as any).final_success_extras_installments),
            fixed_monthly_extras_installments: ensureArray((formData as any).fixed_monthly_extras_installments),
            other_fees_extras_installments: ensureArray((formData as any).other_fees_extras_installments),
            intermediate_fees_installments: ensureArray((formData as any).intermediate_fees_installments),
            
            partner_name: undefined, analyzed_by_name: undefined, process_count: undefined, analyst: undefined, analysts: undefined, client: undefined, partner: undefined, processes: undefined, partners: undefined, id: undefined, display_id: undefined, 
        };

        const isProposalToActive = data.status === 'active' && initialFormData && initialFormData.status === 'proposal';
        if (isProposalToActive) {
            contractPayload.proposal_snapshot = {
                pro_labore: initialFormData?.pro_labore,
                final_success_fee: initialFormData?.final_success_fee,
                fixed_monthly_fee: initialFormData?.fixed_monthly_fee,
                other_fees: initialFormData?.other_fees,
                proposal_date: initialFormData?.proposal_date,
                saved_at: new Date().toISOString()
            };
        }

        Object.keys(contractPayload).forEach(key => contractPayload[key] === undefined && delete contractPayload[key]);

        let savedId = formData.id;
        if (formData.id) {
            const { error } = await supabase.from('contracts').update(contractPayload).eq('id', formData.id);
            if (error) throw error;
        } else {
            const { data: newContract, error } = await supabase.from('contracts').insert(contractPayload).select().single();
            if (error) throw error;
            savedId = newContract.id;
        }

        if (savedId) {
            await forceUpdateFinancials(savedId, formData);
            await generateFinancialInstallments(savedId, formData);
            if (processes.length > 0) {
                await supabase.from('contract_processes').delete().eq('contract_id', savedId);
                const processesToInsert = processes.map(p => ({ ...p, contract_id: savedId }));
                await supabase.from('contract_processes').insert(processesToInsert);
            }
            if (data.status === 'active' && data.physical_signature === false) {
                const { data: task } = await supabase.from('kanban_tasks').select('id').eq('contract_id', savedId).eq('status', 'signature').single();
                if (!task) {
                  await supabase.from('kanban_tasks').insert({ title: `Coletar Assinatura: ${data.client_name}`, description: `Contrato fechado. Coletar assinatura física.`, priority: 'Alta', status: 'signature', contract_id: savedId, due_date: addDays(new Date(), 5).toISOString(), position: 0 });
                }
            }
        }

        toast.success(isEditing ? 'Caso atualizado!' : 'Caso criado!');
        onSave();
        onClose();

    } catch (error: any) {
        toast.error(`Erro ao salvar: ${error.message}`);
    } finally {
        setLocalLoading(false);
    }
  };

  const upsertClient = async () => {
    const clientName = watch('client_name');
    if (!clientName) return null;
    const currentCnpj = watch('cnpj');
    const hasNoCnpj = watch('has_no_cnpj');
    
    const clientData = {
      name: clientName,
      cnpj: (hasNoCnpj || !currentCnpj) ? null : currentCnpj,
      is_person: clientExtraData.is_person || hasNoCnpj || ((currentCnpj || '').length > 0 && (currentCnpj || '').length <= 14),
      uf: watch('uf'),
      address: clientExtraData.address,
      city: clientExtraData.city,
      complement: clientExtraData.complement,
      number: clientExtraData.number,
      email: clientExtraData.email,
      partner_id: watch('partner_id')
    };

    if (clientData.cnpj) {
      const { data: existingClient } = await supabase.from('clients').select('id').eq('cnpj', clientData.cnpj).single();
      if (existingClient) {
        await supabase.from('clients').update(clientData).eq('id', existingClient.id);
        return existingClient.id;
      } else {
        const { data: newClient } = await supabase.from('clients').insert(clientData).select().single();
        return newClient?.id;
      }
    } else {
      if (formData.client_id) {
         await supabase.from('clients').update(clientData).eq('id', formData.client_id);
         return formData.client_id;
      } else {
         const { data: newClient } = await supabase.from('clients').insert(clientData).select().single();
         return newClient?.id;
      }
    }
  };

  const handleClientChange = async (name: string) => {
    const newName = toTitleCase(name);
    setValue('client_name', newName);
    setFormData(prev => ({ ...prev, client_name: newName }));
    if (!newName) return;
    const { data } = await supabase.from('clients').select('cnpj, id').eq('name', newName).single();
    if (data && data.cnpj) {
        setValue('client_id', data.id);
        setValue('cnpj', maskCNPJ(data.cnpj));
        setFormData(prev => ({ ...prev, client_id: data.id, cnpj: maskCNPJ(data.cnpj) }));
    }
  };

  // Funções Auxiliares
  const handleAddToList = (listField: string, valueField: keyof Contract, installmentsListField?: string, installmentsSourceField?: keyof Contract) => {
    const value = watch(valueField as any);
    const clauseValue = watch((valueField + '_clause') as any);
    if (!value || value === 'R$ 0,00' || value === '') return;
    const currentList = (formData as any)[listField] || [];
    const currentClausesList = ensureArray((formData as any)[listField + '_clauses']);
    const updates: any = { [listField]: [...currentList, value], [listField + '_clauses']: [...currentClausesList, clauseValue || ''], [valueField]: '', [valueField + '_clause']: '' };
    if (installmentsListField && installmentsSourceField) {
        const installmentsValue = watch(installmentsSourceField as any) || '1x';
        const currentInstallmentsList = ensureArray((formData as any)[installmentsListField]);
        updates[installmentsListField] = [...currentInstallmentsList, installmentsValue];
        updates[installmentsSourceField] = '1x';
        setValue(installmentsSourceField as any, '1x');
    }
    setFormData(prev => ({ ...prev, ...updates }));
    setValue(valueField as any, '');
    setValue((valueField + '_clause') as any, '');
  };

  const removeExtra = (field: string, index: number, installmentsListField?: string) => {
    setFormData((prev: any) => {
      const newList = [...(prev[field] || [])];
      const newClausesList = [...ensureArray(prev[field + '_clauses'])];
      newList.splice(index, 1);
      if(newClausesList.length > index) newClausesList.splice(index, 1);
      const updates: any = { [field]: newList, [field + '_clauses']: newClausesList };
      if (installmentsListField) {
          const newInstList = [...ensureArray(prev[installmentsListField])];
          if (newInstList.length > index) newInstList.splice(index, 1);
          updates[installmentsListField] = newInstList;
      }
      return { ...prev, ...updates };
    });
  };

  const handleAddIntermediateFee = () => {
      if(!newIntermediateFee) return;
      addIntermediateFee(); 
      const currentClauses = ensureArray((formData as any).intermediate_fees_clauses);
      const currentInstallments = ensureArray((formData as any).intermediate_fees_installments);
      setFormData(prev => ({ ...prev, intermediate_fees_clauses: [...currentClauses, interimClause], intermediate_fees_installments: [...currentInstallments, interimInstallments] } as any));
      setInterimClause(''); setInterimInstallments('1x');
  };
    
  const handleRemoveIntermediateFee = (idx: number) => {
      removeIntermediateFee(idx);
      const currentClauses = [...ensureArray((formData as any).intermediate_fees_clauses)];
      currentClauses.splice(idx, 1);
      const currentInst = [...ensureArray((formData as any).intermediate_fees_installments)];
      currentInst.splice(idx, 1);
      setFormData(prev => ({ ...prev, intermediate_fees_clauses: currentClauses, intermediate_fees_installments: currentInst } as any));
  };

  const addMagistrate = (magistrateName = newMagistrateName) => { if (!magistrateName.trim()) return; const newMagistrate: Magistrate = { title: newMagistrateTitle, name: magistrateName }; setCurrentProcess(prev => ({ ...prev, magistrates: [...(prev.magistrates || []), newMagistrate] })); setNewMagistrateName(''); };
  const removeMagistrate = (index: number) => { setCurrentProcess(prev => { const newList = [...(prev.magistrates || [])]; newList.splice(index, 1); return { ...prev, magistrates: newList }; }); };
  const addSubjectToProcess = () => { if (!newSubject.trim()) return; const cleanSubject = toTitleCase(newSubject.trim()); const currentSubjects = currentProcess.subject ? currentProcess.subject.split(';').map(s => s.trim()).filter(s => s !== '') : []; if (!currentSubjects.includes(cleanSubject)) { const updatedSubjects = [...currentSubjects, cleanSubject]; setCurrentProcess(prev => ({ ...prev, subject: updatedSubjects.join('; ') })); } setNewSubject(''); };
  const removeSubject = (subjectToRemove: string) => { if (!currentProcess.subject) return; const currentSubjects = currentProcess.subject.split(';').map(s => s.trim()).filter(s => s !== ''); const updatedSubjects = currentSubjects.filter(s => s !== subjectToRemove); setCurrentProcess(prev => ({ ...prev, subject: updatedSubjects.join('; ') })); };
  
  const handleProcessAction = () => { if (!currentProcess.process_number) return; if (editingProcessIndex !== null) { const updated = [...processes]; updated[editingProcessIndex] = currentProcess; props.handleProcessAction(); } else { props.handleProcessAction(); } };
  
  const handleGenericAdd = async (value: string) => { 
      const cleanValue = toTitleCase(value.trim()); if(!cleanValue) return false; let error=null; 
      switch(activeManager) { 
          case 'area': if(!legalAreas.includes(cleanValue)) { setLegalAreas(prev=>[...prev, cleanValue]); setValue('area', cleanValue); setFormData(prev=>({...prev, area: cleanValue})); } break; 
          case 'client': const {error: err}=await supabase.from('clients').insert({name: cleanValue}); error=err; if(!err) { setClientOptions(prev=>[...prev, cleanValue]); setValue('client_name', cleanValue); setFormData(prev=>({...prev, client_name: cleanValue})); } break; 
          case 'court': const {error: errCrt}=await supabase.from('courts').insert({name: cleanValue.toUpperCase()}); error=errCrt; if(!errCrt) { setCourtOptions(prev=>[...prev, cleanValue.toUpperCase()]); setCurrentProcess(prev=>({...prev, court: cleanValue.toUpperCase()})); } break;
      } 
      if(error) { toast.error("Erro: "+error.message); return false; } return true; 
  }; 
  const handleGenericRemove = (value: string) => { };
  const handleGenericEdit = async (oldVal: string, newVal: string) => { return true; }; 

  const forceUpdateFinancials = async (contractId: string, sourceData = formData) => { 
      const cleanPL = safeParseFloat(sourceData.pro_labore || "");
      const cleanSuccess = safeParseFloat(sourceData.final_success_fee || "");
      const cleanFixed = safeParseFloat(sourceData.fixed_monthly_fee || "");
      const cleanOther = safeParseFloat(sourceData.other_fees || "");
      await supabase.from('contracts').update({ pro_labore: cleanPL, final_success_fee: cleanSuccess, fixed_monthly_fee: cleanFixed, other_fees: cleanOther, pro_labore_installments: (sourceData as any).pro_labore_installments, final_success_fee_installments: (sourceData as any).final_success_fee_installments, fixed_monthly_fee_installments: (sourceData as any).fixed_monthly_fee_installments, other_fees_installments: (sourceData as any).other_fees_installments }).eq('id', contractId); 
  };
  const generateFinancialInstallments = async (contractId: string, sourceData = formData) => { };
  
  const handleCNPJSearch = async () => { 
      const cnpj = watch('cnpj')?.replace(/\D/g, ''); if(!cnpj || cnpj.length !== 14) return toast.error("CNPJ Inválido"); setLocalLoading(true);
      try { const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`); if(!res.ok) throw new Error("CNPJ não encontrado"); const data = await res.json();
      setValue('client_name', toTitleCase(data.razao_social || data.nome_fantasia)); setValue('uf', data.uf); setFormData(prev=>({...prev, client_name: toTitleCase(data.razao_social), uf: data.uf}));
      } catch(err: any) { toast.error(err.message); } finally { setLocalLoading(false); }
  };
  const handleCNJSearch = async () => { 
      if(!currentProcess.process_number) return; const num = currentProcess.process_number.replace(/\D/g, ''); if(num.length !== 20) return toast.error("CNJ Inválido"); setSearchingCNJ(true);
      try { const decoded = decodeCNJ(num); if(!decoded) throw new Error("Erro CNJ"); if(!courtOptions.includes(decoded.tribunal)) { await supabase.from('courts').insert({name: decoded.tribunal}); setCourtOptions(prev=>[...prev, decoded.tribunal]); } setCurrentProcess(prev=>({...prev, court: decoded.tribunal, uf: decoded.tribunal === 'STF' ? 'DF' : decoded.uf})); } catch(e: any) { toast.error(e.message); } finally { setSearchingCNJ(false); }
  };
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => { 
      const file = e.target.files?.[0]; if(!file || !formData.id) return; setUploading(true);
      try { const path = `${formData.id}/${Date.now()}_${file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase()}`; 
      await supabase.storage.from('contract-documents').upload(path, file); 
      const {data} = await supabase.from('contract_documents').insert({contract_id: formData.id, file_name: file.name, file_path: path, file_type: type}).select().single();
      if(data) setDocuments(prev=>[data, ...prev]); toast.success("Arquivo anexado!"); } catch(e: any) { toast.error("Erro upload: "+e.message); } finally { setUploading(false); }
  };
  const handleDownload = async (path: string) => { 
      try { const {data} = await supabase.storage.from('contract-documents').download(path); if(data) { const url = URL.createObjectURL(data); const a = document.createElement('a'); a.href = url; a.download = path.split('/').pop() || 'doc'; a.click(); } } catch(e) { toast.error("Erro download"); }
  };
  const handleDeleteDocument = async (id: string, path: string) => { 
      if(!confirm("Excluir?")) return; try { await supabase.storage.from('contract-documents').remove([path]); await supabase.from('contract_documents').delete().eq('id', id); setDocuments(prev=>prev.filter(d=>d.id!==id)); toast.success("Excluído!"); } catch(e) { toast.error("Erro ao excluir"); }
  };
  const handleOpenJusbrasil = () => { if(currentProcess.process_number) window.open(`https://www.jusbrasil.com.br/processos/numero/${currentProcess.process_number.replace(/\D/g, '')}`, '_blank'); };

  // Select Options (Merged)
  const partnerSelectOptions = [{ label: 'Selecione', value: '' }, ...partners.map(p => ({ label: p.name, value: p.id }))];
  const analystSelectOptions = [{ label: 'Selecione', value: '' }, ...(analysts ? analysts.map(a => ({ label: a.name, value: a.id })) : [])];
  const clientSelectOptions = [{ label: 'Selecione', value: '' }, ...clientOptions.map(c => ({ label: c, value: c }))];
  const areaOptions = [{ label: 'Selecione', value: '' }, ...legalAreas.map(a => ({ label: a, value: a }))];
  const billingOptions = [{ label: 'Selecione', value: '' }, ...billingLocations.map(l => ({ label: l, value: l }))];
  const signatureOptions = [{ label: 'Selecione', value: '' }, { label: 'Sim', value: 'true' }, { label: 'Não (Cobrar)', value: 'false' }];
  const rejectionByOptions = [{ label: 'Selecione', value: '' }, { label: 'Cliente', value: 'Cliente' }, { label: 'Escritório', value: 'Escritório' }];
  const rejectionReasonOptions = [{ label: 'Selecione', value: '' }, { label: 'Cliente declinou', value: 'Cliente declinou' }, { label: 'Cliente não retornou', value: 'Cliente não retornou' }, { label: 'Caso ruim', value: 'Caso ruim' }, { label: 'Conflito de interesses', value: 'Conflito de interesses' }];
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[50] p-4 overflow-y-auto">
      <form onSubmit={handleSubmit(onFormSubmit)} className={`w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[95vh] animate-in fade-in zoom-in duration-200 transition-colors duration-500 ease-in-out ${getThemeBackground(watchedStatus || 'analysis')}`}>
        
        <div className="p-6 border-b border-black/5 flex justify-between items-center bg-white/50 backdrop-blur-sm rounded-t-2xl">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-800">{isEditing ? 'Editar Caso' : 'Novo Caso'}</h2>
            {(formData as any).display_id && <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded font-mono text-sm">ID: {(formData as any).display_id}</span>}
          </div>
          <button type="button" onClick={onClose}><X className="w-6 h-6 text-gray-400" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
           
           {/* STATUS E DATA */}
           <div className="bg-white/60 p-6 rounded-xl border border-white/40 shadow-sm backdrop-blur-sm relative z-50 mb-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                 <div>
                    <Controller
                        name="status"
                        control={control}
                        render={({ field }) => (
                            <CustomSelect 
                                label="Status Atual *" 
                                value={field.value} 
                                onChange={(val) => { field.onChange(val); setFormData(prev => ({...prev, status: val as any})); }} 
                                options={statusOptions} 
                                onAction={handleCreateStatus} actionIcon={Plus} actionLabel="Adicionar Novo Status"
                            />
                        )}
                    />
                    {errors.status && <span className="text-xs text-red-500 mt-1">{errors.status.message}</span>}
                 </div>

                 {watchedStatus && (
                    <div className="animate-in fade-in">
                        <label className="text-xs font-medium block mb-1 text-gray-600">
                             {watchedStatus === 'analysis' ? 'Data do Prospect' :
                              watchedStatus === 'proposal' ? 'Data da Proposta' :
                              watchedStatus === 'active' ? 'Data da Assinatura' :
                              watchedStatus === 'rejected' ? 'Data da Rejeição' : 'Data'}
                        </label>
                        <input 
                            type="date" 
                            className={`w-full border p-2.5 rounded-lg text-sm outline-none ${errors[watchedStatus === 'analysis' ? 'prospect_date' : watchedStatus === 'proposal' ? 'proposal_date' : watchedStatus === 'active' ? 'contract_date' : 'created_at'] ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white focus:border-salomao-blue'}`}
                            {...register(watchedStatus === 'analysis' ? 'prospect_date' : watchedStatus === 'proposal' ? 'proposal_date' : watchedStatus === 'active' ? 'contract_date' : 'created_at')}
                        />
                        {watchedStatus === 'active' && errors.contract_date && <span className="text-xs text-red-500">{errors.contract_date.message}</span>}
                    </div>
                 )}
             </div>
             
             {/* Sub-opções baseadas no status (Ex: Analista, Rejeição) */}
             {watchedStatus === 'analysis' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in slide-in-from-top-2">
                    <div>
                        <Controller name="analyst_id" control={control} render={({ field }) => (
                            <CustomSelect label="Analisado Por" value={field.value || ''} onChange={(val) => { field.onChange(val); setFormData({...formData, analyst_id: val}) }} options={analystSelectOptions} onAction={onOpenAnalystManager} actionIcon={Settings} actionLabel="Gerenciar Analistas" />
                        )}/>
                    </div>
                </div>
             )}
           </div>

           {/* DADOS DO CLIENTE */}
           <section className="space-y-5">
            <h3 className="text-sm font-bold text-gray-500 uppercase border-b border-black/5 pb-2">Dados do Cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                <div className="md:col-span-9">
                    <Controller name="client_name" control={control} render={({ field }) => (
                        <CustomSelect label="Nome do Cliente *" value={field.value} onChange={(val) => { field.onChange(val); handleClientChange(val); }} options={clientSelectOptions} onAction={() => setActiveManager('client')} actionLabel="Gerenciar Clientes" actionIcon={Settings} placeholder="Selecione ou digite" />
                    )}/>
                    {errors.client_name && <span className="text-xs text-red-500">{errors.client_name.message}</span>}
                </div>
                <div className="md:col-span-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">CNPJ/CPF</label>
                    <div className="flex gap-2 items-center">
                        <input type="text" disabled={watch('has_no_cnpj')} className="flex-1 border border-gray-300 rounded-lg p-2.5 text-sm" placeholder="00.000..." {...register('cnpj')} onChange={(e) => setValue('cnpj', maskCNPJ(e.target.value))} />
                        <button type="button" onClick={handleCNPJSearch} className="bg-white p-2.5 rounded-lg border border-gray-300"><Search className="w-4 h-4" /></button>
                    </div>
                    <div className="flex items-center mt-2"><input type="checkbox" id="no_cnpj" {...register('has_no_cnpj')} /><label htmlFor="no_cnpj" className="ml-2 text-xs text-gray-500">Sem CNPJ</label></div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <Controller name="area" control={control} render={({ field }) => (
                        <CustomSelect label="Área do Direito" value={field.value || ''} onChange={field.onChange} options={areaOptions} onAction={() => setActiveManager('area')} actionLabel="Gerenciar Áreas" actionIcon={Settings} />
                    )}/>
                </div>
                <div>
                    <Controller name="partner_id" control={control} render={({ field }) => (
                        <CustomSelect label="Responsável (Sócio) *" value={field.value} onChange={field.onChange} options={partnerSelectOptions} onAction={onOpenPartnerManager} actionLabel="Gerenciar Sócios" actionIcon={Settings} />
                    )}/>
                    {errors.partner_id && <span className="text-xs text-red-500">{errors.partner_id.message}</span>}
                </div>
            </div>
           </section>

           {/* PROCESSOS (MANTENDO LÓGICA UI RICA) */}
           <section className="space-y-4 bg-white/60 p-5 rounded-xl border border-white/40 shadow-sm backdrop-blur-sm relative z-30">
             <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Processos Judiciais</h3>
                <div className="flex items-center gap-3">
                    <button type="button" onClick={() => { setIsStandardCNJ(false); setCurrentProcess({ ...currentProcess, process_number: 'CONSULTORIA', uf: currentProcess.uf || '' }); }} className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded border border-blue-100">Consultoria</button>
                    <div className="flex items-center">
                        <input type="checkbox" id="no_process" checked={!watch('has_legal_process')} onChange={(e) => setValue('has_legal_process', !e.target.checked)} className="rounded text-salomao-blue" />
                        <label htmlFor="no_process" className="ml-2 text-xs text-gray-600">Caso sem processo judicial</label>
                    </div>
                </div>
             </div>
             {watch('has_legal_process') && (
                 <div className="space-y-4">
                    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4 items-end">
                            <div className="md:col-span-5">
                                <label className="text-[10px] text-gray-500 uppercase font-bold">Número do Processo *</label>
                                <div className="flex items-center">
                                   <input type="text" className="w-full border-b border-gray-300 outline-none py-1.5 text-sm font-mono" value={currentProcess.process_number} onChange={(e) => setCurrentProcess({...currentProcess, process_number: e.target.value})} placeholder="Nº Processo" />
                                   <button onClick={handleCNJSearch} className="ml-2 text-salomao-blue"><Search className="w-4 h-4" /></button>
                                </div>
                            </div>
                            <div className="md:col-span-3">
                                 <CustomSelect label="Tribunal" value={currentProcess.court || ''} onChange={(val) => setCurrentProcess({...currentProcess, court: val})} options={courtOptions.map(c=>({label:c, value:c}))} />
                            </div>
                            <div className="md:col-span-2">
                                <CustomSelect label="UF" value={currentProcess.uf || ''} onChange={(val) => setCurrentProcess({...currentProcess, uf: val})} options={UFS.map(u=>({label:u.nome, value:u.sigla}))} />
                            </div>
                        </div>
                        <div className="flex justify-end mt-4">
                            <button type="button" onClick={handleProcessAction} className="bg-salomao-blue text-white rounded px-4 py-2 hover:bg-blue-900 flex items-center justify-center shadow-md text-sm font-bold"><Plus className="w-4 h-4 mr-2" /> Adicionar Processo</button>
                        </div>
                    </div>
                    {/* Lista de Processos */}
                    {processes.length > 0 && (
                        <div className="space-y-2 mt-4">
                            {processes.map((p, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                                    <span className="font-mono font-medium text-salomao-blue">{p.process_number}</span>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => editProcess(idx)} className="text-blue-500"><Edit className="w-4 h-4" /></button>
                                        <button type="button" onClick={() => removeProcess(idx)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                 </div>
             )}
           </section>

           {/* FINANCEIRO (APENAS SE ATIVO/PROPOSTA) */}
           {(watchedStatus === 'active' || watchedStatus === 'proposal') && (
               <section className="space-y-5 pt-4 border-t">
                   <h3 className="text-sm font-bold text-gray-500 uppercase border-b pb-2">Financeiro</h3>
                   {watchedStatus === 'active' && (
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div>
                               <label className="text-xs font-medium block mb-1">Número HON *</label>
                               <input type="text" {...register('hon_number')} className={`w-full border p-2.5 rounded-lg text-sm font-mono ${errors.hon_number ? 'border-red-500' : 'border-gray-300'}`} placeholder="00.000.000/000" onChange={(e) => setValue('hon_number', maskHon(e.target.value))} />
                               {errors.hon_number && <span className="text-xs text-red-500">{errors.hon_number.message}</span>}
                           </div>
                           <div>
                               <Controller name="billing_location" control={control} render={({ field }) => (
                                   <CustomSelect label="Local Faturamento *" value={field.value || ''} onChange={field.onChange} options={billingOptions} />
                               )}/>
                               {errors.billing_location && <span className="text-xs text-red-500">{errors.billing_location.message}</span>}
                           </div>
                       </div>
                   )}

                   <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                       <FinancialInputWithInstallments 
                           label="Pró-Labore (R$)" 
                           value={watch('pro_labore')} 
                           onChangeValue={(v: string) => setValue('pro_labore', v)}
                           installments={watch('pro_labore_installments')}
                           onChangeInstallments={(v: string) => setValue('pro_labore_installments', v)}
                           onAdd={() => handleAddToList('pro_labore_extras', 'pro_labore', 'pro_labore_extras_installments', 'pro_labore_installments')}
                           clause={watch('pro_labore_clause')}
                           onChangeClause={(v: string) => setValue('pro_labore_clause', v)}
                       />
                       <FinancialInputWithInstallments 
                           label="Fixo Mensal (R$)" 
                           value={watch('fixed_monthly_fee')} 
                           onChangeValue={(v: string) => setValue('fixed_monthly_fee', v)}
                           installments={watch('fixed_monthly_fee_installments')}
                           onChangeInstallments={(v: string) => setValue('fixed_monthly_fee_installments', v)}
                           onAdd={() => handleAddToList('fixed_monthly_extras', 'fixed_monthly_fee', 'fixed_monthly_extras_installments', 'fixed_monthly_fee_installments')}
                           clause={watch('fixed_monthly_fee_clause')}
                           onChangeClause={(v: string) => setValue('fixed_monthly_fee_clause', v)}
                       />
                       <FinancialInputWithInstallments 
                           label="Êxito Final (R$)" 
                           value={watch('final_success_fee')} 
                           onChangeValue={(v: string) => setValue('final_success_fee', v)}
                           installments={watch('final_success_fee_installments')}
                           onChangeInstallments={(v: string) => setValue('final_success_fee_installments', v)}
                           onAdd={() => handleAddToList('final_success_extras', 'final_success_fee', 'final_success_extras_installments', 'final_success_fee_installments')}
                           clause={watch('final_success_fee_clause')}
                           onChangeClause={(v: string) => setValue('final_success_fee_clause', v)}
                       />
                       
                       <div className="flex flex-col gap-1 mt-2 max-h-24 overflow-y-auto">
                            {(formData as any).pro_labore_extras?.map((val: string, idx: number) => (
                                <div key={idx} className="bg-white border border-blue-100 px-2 py-1.5 rounded-lg text-xs text-blue-800 flex items-center justify-between shadow-sm">
                                    <span className="font-medium">{val}</span>
                                    <button type="button" onClick={() => removeExtra('pro_labore_extras', idx, 'pro_labore_extras_installments')} className="text-blue-300 hover:text-red-500 p-1"><X className="w-3 h-3" /></button>
                                </div>
                            ))}
                       </div>
                   </div>
               </section>
           )}

           {/* DOCUMENTOS */}
           <section className="border-t border-black/5 pt-6">
                <div className="mb-8 mt-6">
                    <div className="flex items-center justify-between mb-4"><label className="text-xs font-bold text-gray-500 uppercase flex items-center"><FileText className="w-4 h-4 mr-2" />Arquivos & Documentos</label><label className="cursor-pointer bg-white border border-dashed border-salomao-blue text-salomao-blue px-4 py-2 rounded-lg text-xs font-medium hover:bg-blue-50 transition-colors flex items-center">{uploading ? 'Enviando...' : <><Upload className="w-3 h-3 mr-2" /> Anexar PDF</>}<input type="file" accept="application/pdf" className="hidden" disabled={uploading} onChange={(e) => handleFileUpload(e, watchedStatus === 'active' ? 'contract' : 'proposal')} /></label></div>
                    {documents.length > 0 && <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{documents.map((doc) => (<div key={doc.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 group"><span className="text-xs font-medium text-gray-700 truncate">{doc.file_name}</span><button type="button" onClick={() => handleDeleteDocument(doc.id, doc.file_path)} className="text-red-600 hover:bg-red-100 rounded p-1"><Trash2 className="w-4 h-4" /></button></div>))}</div>}
                </div>
           </section>

        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors">Cancelar</button>
          <button type="submit" disabled={isLoading} className="px-6 py-2 bg-salomao-blue text-white rounded-lg hover:bg-blue-900 shadow-lg flex items-center transition-all transform active:scale-95">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {isLoading ? 'Salvando...' : 'Salvar Caso'}
          </button>
        </div>
      </form>
      
      {/* Modais auxiliares */}
      {activeManager && (
         <OptionManager 
            title="Gerenciar Opções" 
            options={/* Lógica de opções baseada no activeManager */ []} 
            onAdd={handleGenericAdd} 
            onRemove={handleGenericRemove} 
            onEdit={handleGenericEdit}
            onClose={() => setActiveManager(null)} 
         />
      )}
    </div>
  );
}