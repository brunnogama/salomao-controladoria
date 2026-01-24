import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, X, Save, Settings, Check, ChevronDown, Clock, History as HistoryIcon, ArrowRight, Edit, Trash2, CalendarCheck, Hourglass, Upload, FileText, Download, AlertCircle, Search, Loader2, Link as LinkIcon, MapPin, DollarSign, Tag, Gavel, Eye, AlertTriangle, TrendingUp, TrendingDown, Pencil } from 'lucide-react';
import { Contract, Partner, ContractProcess, TimelineEvent, ContractDocument, Analyst, Magistrate } from '../../types';
import { maskCNPJ, maskMoney, maskHon, maskCNJ, toTitleCase, parseCurrency } from '../../utils/masks';
import { decodeCNJ } from '../../utils/cnjDecoder';
import { addDays, addMonths } from 'date-fns';

// Componentes Modularizados
import { OptionManager } from './components/OptionManager';
import { ContractDocuments } from './components/ContractDocuments';
import { ProcessDetailsModal } from './components/ProcessDetailsModal';
import { StatusAndDatesSection } from './components/StatusAndDatesSection';
import { ClientFormSection } from './components/ClientFormSection';
import { LegalProcessForm } from './components/LegalProcessForm';
import { LegalProcessList } from './components/LegalProcessList';

// Utilitários e Hooks
import { formatForInput, ensureDateValue, localMaskCNJ, safeParseFloat, ensureArray, getThemeBackground } from '../../utils/contractHelpers';
import { generateFinancialInstallments, forceUpdateFinancials } from '../../services/contractFinancialService';
import { useContractOptions } from '../../hooks/useContractOptions';

const UFS = [ { sigla: 'AC', nome: 'Acre' }, { sigla: 'AL', nome: 'Alagoas' }, { sigla: 'AP', nome: 'Amapá' }, { sigla: 'AM', nome: 'Amazonas' }, { sigla: 'BA', nome: 'Bahia' }, { sigla: 'CE', nome: 'Ceará' }, { sigla: 'DF', nome: 'Distrito Federal' }, { sigla: 'ES', nome: 'Espírito Santo' }, { sigla: 'GO', nome: 'Goiás' }, { sigla: 'MA', nome: 'Maranhão' }, { sigla: 'MT', nome: 'Mato Grosso' }, { sigla: 'MS', nome: 'Mato Grosso do Sul' }, { sigla: 'MG', nome: 'Minas Gerais' }, { sigla: 'PA', nome: 'Pará' }, { sigla: 'PB', nome: 'Paraíba' }, { sigla: 'PR', nome: 'Paraná' }, { sigla: 'PE', nome: 'Pernambuco' }, { sigla: 'PI', nome: 'Piauí' }, { sigla: 'RJ', nome: 'Rio de Janeiro' }, { sigla: 'RN', nome: 'Rio Grande do Norte' }, { sigla: 'RS', nome: 'Rio Grande do Sul' }, { sigla: 'RO', nome: 'Rondônia' }, { sigla: 'RR', nome: 'Roraima' }, { sigla: 'SC', nome: 'Santa Catarina' }, { sigla: 'SP', nome: 'São Paulo' }, { sigla: 'SE', nome: 'Sergipe' }, { sigla: 'TO', nome: 'Tocantins' } ];

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
    newIntermediateFee, setNewIntermediateFee, addIntermediateFee, removeIntermediateFee, getStatusLabel
  } = props;
    
  const [localLoading, setLocalLoading] = useState(false);
  const [documents, setDocuments] = useState<ContractDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [searchingCNJ, setSearchingCNJ] = useState(false);
  const [statusOptions, setStatusOptions] = useState<{label: string, value: string}[]>([]);
  const [clientExtraData, setClientExtraData] = useState({ address: '', number: '', complement: '', city: '', email: '', is_person: false });
  const [interimInstallments, setInterimInstallments] = useState('1x');
  const [interimClause, setInterimClause] = useState('');
  
  // Estado Unificado de Gerenciamento
  const [activeManager, setActiveManager] = useState<string | null>(null);
  
  const [initialFormData, setInitialFormData] = useState<Contract | null>(null);
  const [duplicateClientCases, setDuplicateClientCases] = useState<any[]>([]);
  const [duplicateOpponentCases, setDuplicateOpponentCases] = useState<any[]>([]);
  const [duplicateProcessWarning, setDuplicateProcessWarning] = useState<boolean>(false);

  // Estados do UI Rico (Processos)
  const [newMagistrateTitle, setNewMagistrateTitle] = useState('');
  const [newMagistrateName, setNewMagistrateName] = useState('');
  const [isStandardCNJ, setIsStandardCNJ] = useState(true);
  const [otherProcessType, setOtherProcessType] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [viewProcess, setViewProcess] = useState<ContractProcess | null>(null);
  const [viewProcessIndex, setViewProcessIndex] = useState<number | null>(null);
  const numeralOptions = Array.from({ length: 100 }, (_, i) => ({ label: `${i + 1}º`, value: `${i + 1}º` }));

  // Estado para controle das abas
  const [activeTab, setActiveTab] = useState(1);

  // Novo Hook de Opções
  const options = useContractOptions({ formData, setFormData, currentProcess, setCurrentProcess, activeManager });
    
  const isLoading = parentLoading || localLoading;

  useEffect(() => {
    if (isOpen) {
      fetchStatuses();
      options.fetchAuxiliaryTables();
      if (formData.id) fetchDocuments();
      setInitialFormData(JSON.parse(JSON.stringify(formData)));
      
      if (!formData.pro_labore_installments) setFormData(prev => ({...prev, pro_labore_installments: '1x'}));
      if (!formData.final_success_fee_installments) setFormData(prev => ({...prev, final_success_fee_installments: '1x'}));
      if (!formData.fixed_monthly_fee_installments) setFormData(prev => ({...prev, fixed_monthly_fee_installments: '1x'}));
      if (!formData.other_fees_installments) setFormData(prev => ({...prev, other_fees_installments: '1x'}));

      // Define "Selecione" como padrão se a posição estiver vazia ao abrir
      setCurrentProcess(prev => ({ ...prev, position: prev.position || '' }));

      // Se for um novo contrato, força a assinatura física para undefined (Selecione)
      if (!formData.id) {
        setFormData(prev => ({ ...prev, physical_signature: undefined }));
      }

    } else {
      setDocuments([]);
      setClientExtraData({ address: '', number: '', complement: '', city: '', email: '', is_person: false });
      setInterimInstallments('1x');
      setInterimClause('');
      setIsStandardCNJ(true);
      setOtherProcessType('');
      // Reseta a posição para "Selecione"
      setCurrentProcess(prev => ({ ...prev, process_number: '', uf: '', position: '' })); 
      setNewSubject('');
      setDuplicateClientCases([]);
      setDuplicateOpponentCases([]);
      setDuplicateProcessWarning(false);
      setInitialFormData(null);
      setActiveManager(null);
      setActiveTab(1); // Resetar para a primeira aba
    }
  }, [isOpen, formData.id]);

  useEffect(() => {
    const checkClientDuplicates = async () => {
        if (!formData.client_name || formData.client_name.length < 3) return setDuplicateClientCases([]);
        const { data } = await supabase.from('contracts').select('id, hon_number, status').ilike('client_name', `%${formData.client_name}%`).neq('id', formData.id || '00000000-0000-0000-0000-000000000000').limit(5);
        if (data) setDuplicateClientCases(data);
    };
    const timer = setTimeout(checkClientDuplicates, 800);
    return () => clearTimeout(timer);
  }, [formData.client_name, formData.id]);

  useEffect(() => {
    const checkOpponentDuplicates = async () => {
        if (!currentProcess.opponent || currentProcess.opponent.length < 3) return setDuplicateOpponentCases([]);
        const { data } = await supabase.from('contract_processes').select('contract_id, contracts(id, client_name, hon_number)').ilike('opponent', `%${currentProcess.opponent}%`).limit(5);
        if (data) {
            const uniqueCases = data.reduce((acc: any[], current: any) => {
                const x = acc.find(item => item.contracts?.id === current.contracts?.id);
                return (!x && current.contracts) ? acc.concat([current]) : acc;
            }, []);
            setDuplicateOpponentCases(uniqueCases);
        }
    };
    const timer = setTimeout(checkOpponentDuplicates, 800);
    return () => clearTimeout(timer);
  }, [currentProcess.opponent]);

  useEffect(() => {
    const checkProcessNumber = async () => {
        // Se houver um otherProcessType definido (Consultoria, Administrativo, etc), não valida duplicidade de processo
        if (otherProcessType) return setDuplicateProcessWarning(false);
        if (!currentProcess.process_number || currentProcess.process_number.length < 15 || ['CONSULTORIA', 'ASSESSORIA JURÍDICA', 'PROCESSO ADMINISTRATIVO', 'OUTROS'].includes(currentProcess.process_number)) return setDuplicateProcessWarning(false);
        const { data } = await supabase.from('contract_processes').select('id').eq('process_number', currentProcess.process_number).limit(1);
        setDuplicateProcessWarning(!!(data && data.length > 0));
    };
    const timer = setTimeout(checkProcessNumber, 800);
    return () => clearTimeout(timer);
  }, [currentProcess.process_number, otherProcessType]);

  // EFEITO: Auto-preenchimento de CNPJ do Autor
  useEffect(() => {
    const fetchAuthorCNPJ = async () => {
        const authorName = (currentProcess as any).author;
        if (!authorName || authorName.length < 3) return;
        const { data } = await supabase.from('authors').select('cnpj').eq('name', authorName).single();
        if (data && data.cnpj) setCurrentProcess(prev => ({ ...prev, author_cnpj: maskCNPJ(data.cnpj) }));
    };
    const timer = setTimeout(fetchAuthorCNPJ, 800);
    return () => clearTimeout(timer);
  }, [(currentProcess as any).author]);

  // EFEITO: Auto-preenchimento de CNPJ do Contrário
  useEffect(() => {
    const fetchOpponentCNPJ = async () => {
        if (!currentProcess.opponent || currentProcess.opponent.length < 3) return;
        const { data } = await supabase.from('opponents').select('cnpj').eq('name', currentProcess.opponent).single();
        if (data && data.cnpj) setCurrentProcess(prev => ({ ...prev, opponent_cnpj: maskCNPJ(data.cnpj) }));
    };
    const timer = setTimeout(fetchOpponentCNPJ, 800);
    return () => clearTimeout(timer);
  }, [currentProcess.opponent]);

  // EFEITO: Geração Automática de Parcelas Detalhadas
  useEffect(() => {
    if (!['proposal', 'active'].includes(formData.status)) return;

    const fees = [
        { field: 'pro_labore', installField: 'pro_labore_installments', breakdownField: 'pro_labore_breakdown' },
        { field: 'final_success_fee', installField: 'final_success_fee_installments', breakdownField: 'final_success_fee_breakdown' },
        { field: 'fixed_monthly_fee', installField: 'fixed_monthly_fee_installments', breakdownField: 'fixed_monthly_fee_breakdown' },
        { field: 'other_fees', installField: 'other_fees_installments', breakdownField: 'other_fees_breakdown' }
    ];

    let hasChanges = false;
    let newFormData = { ...formData };

    fees.forEach(({ field, installField, breakdownField }) => {
        const valStr = (formData as any)[field];
        const instStr = (formData as any)[installField];
        
        // Se não houver valor ou parcelas, ou for 1x, limpa o breakdown se existir
        if (!valStr || !instStr || instStr === '1x' || valStr === 'R$ 0,00' || valStr === '') {
            // (newFormData as any)[breakdownField] = []; // Opcional: limpar se necessário
            return;
        }

        const count = parseInt(instStr.replace('x', '')) || 1;
        const currentBreakdown = (formData as any)[breakdownField] || [];

        // Se o tamanho do array não bater com o número de parcelas, regenera
        if (currentBreakdown.length !== count && count > 1) {
            const total = safeParseFloat(valStr);
            const baseValue = total / count;
            
            const newBreakdown = Array.from({ length: count }, (_, i) => ({
                date: addDays(new Date(), i * 30).toISOString().split('T')[0],
                value: maskMoney(baseValue.toFixed(2))
            }));
            
            (newFormData as any)[breakdownField] = newBreakdown;
            hasChanges = true;
        }
    });

    if (hasChanges) {
        setFormData(newFormData);
    }
  }, [
    formData.status,
    formData.pro_labore, formData.pro_labore_installments,
    formData.final_success_fee, formData.final_success_fee_installments,
    formData.fixed_monthly_fee, formData.fixed_monthly_fee_installments,
    formData.other_fees, formData.other_fees_installments
  ]);

  const fetchStatuses = async () => {
    const { data } = await supabase.from('contract_statuses').select('*');
    if (data) {
      const order = ['analysis', 'proposal', 'active', 'rejected', 'probono'];
      const sortedData = data.sort((a, b) => {
        const iA = order.indexOf(a.value), iB = order.indexOf(b.value);
        if (iA !== -1 && iB !== -1) return iA - iB;
        return (iA !== -1 ? -1 : (iB !== -1 ? 1 : a.label.localeCompare(b.label)));
      });
      setStatusOptions([{ label: 'Selecione', value: '' }, ...sortedData.map(s => ({ label: s.label, value: s.value }))]);
    }
  };

  const handleCreateStatus = async () => {
    const newLabel = window.prompt("Digite o nome do novo Status:");
    if (!newLabel) return;
    const newValue = newLabel.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_");
    if (statusOptions.some(s => s.value === newValue)) return alert("Este status já existe.");
    try {
      const { error } = await supabase.from('contract_statuses').insert({ label: toTitleCase(newLabel.trim()), value: newValue, color: 'bg-gray-100 text-gray-800 border-gray-200' });
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
    if (!formData.client_name) return null;
    const clientData = {
      name: formData.client_name,
      cnpj: (formData.has_no_cnpj || !formData.cnpj) ? null : formData.cnpj,
      is_person: clientExtraData.is_person || formData.has_no_cnpj || ((formData.cnpj || '').length > 0 && (formData.cnpj || '').length <= 14),
      uf: formData.uf,
      address: clientExtraData.address || undefined,
      city: clientExtraData.city || undefined,
      complement: clientExtraData.complement || undefined,
      number: clientExtraData.number || undefined,
      email: clientExtraData.email || undefined,
      partner_id: formData.partner_id
    };

    if (clientData.cnpj) {
      // FIX: Use maybeSingle instead of single to avoid 406 error
      const { data: existingClient } = await supabase.from('clients').select('id').eq('cnpj', clientData.cnpj).maybeSingle();
      if (existingClient) {
        await supabase.from('clients').update(clientData).eq('id', existingClient.id);
        return existingClient.id;
      } else {
        const { data: newClient, error } = await supabase.from('clients').insert(clientData).select().single();
        if (error) return console.error('Erro ao criar cliente com CNPJ:', error), null;
        return newClient.id;
      }
    } else {
      if (formData.client_id) {
         await supabase.from('clients').update(clientData).eq('id', formData.client_id);
         return formData.client_id;
      } else {
         const { data: newClient, error } = await supabase.from('clients').insert(clientData).select().single();
         if (error) return console.error('Erro ao criar cliente sem CNPJ:', error), null;
         return newClient.id;
      }
    }
  };

  const handleAddToList = (listField: string, valueField: keyof Contract, installmentsListField?: string, installmentsSourceField?: keyof Contract) => {
    const value = (formData as any)[valueField], clauseValue = (formData as any)[valueField + '_clause'];
    if (!value || value === 'R$ 0,00' || value === '') return;
    const currentList = (formData as any)[listField] || [];
    const currentClausesList = ensureArray((formData as any)[listField + '_clauses']);
    const updates: any = { [listField]: [...currentList, value], [listField + '_clauses']: [...currentClausesList, clauseValue || ''], [valueField]: '', [valueField + '_clause']: '' };
    if (installmentsListField && installmentsSourceField) {
       updates[installmentsListField] = [...ensureArray((formData as any)[installmentsListField]), (formData as any)[installmentsSourceField] || '1x'];
       updates[installmentsSourceField] = '1x';
    }
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const removeExtra = (field: string, index: number, installmentsListField?: string) => {
    setFormData((prev: any) => {
      const newList = [...(prev[field] || [])], newClausesList = [...ensureArray(prev[field + '_clauses'])];
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
      setFormData(prev => ({ ...prev, intermediate_fees_clauses: [...ensureArray((prev as any).intermediate_fees_clauses), interimClause], intermediate_fees_installments: [...ensureArray((prev as any).intermediate_fees_installments), interimInstallments] } as any));
      setInterimClause('');
      setInterimInstallments('1x');
  };
    
  const handleRemoveIntermediateFee = (idx: number) => {
      removeIntermediateFee(idx);
      const currentClauses = [...ensureArray((formData as any).intermediate_fees_clauses)]; currentClauses.splice(idx, 1);
      const currentInst = [...ensureArray((formData as any).intermediate_fees_installments)]; currentInst.splice(idx, 1);
      setFormData(prev => ({ ...prev, intermediate_fees_clauses: currentClauses, intermediate_fees_installments: currentInst } as any));
  };

  const addMagistrate = (magistrateName = newMagistrateName) => {
    if (!magistrateName.trim()) return;
    setCurrentProcess(prev => ({ ...prev, magistrates: [...(prev.magistrates || []), { title: newMagistrateTitle, name: magistrateName }] }));
    setNewMagistrateName('');
  };

  const removeMagistrate = (index: number) => {
    setCurrentProcess(prev => {
      const newList = [...(prev.magistrates || [])];
      newList.splice(index, 1);
      return { ...prev, magistrates: newList };
    });
  };

  const addSubjectToProcess = () => {
    if (!newSubject.trim()) return;
    const cleanSubject = toTitleCase(newSubject.trim());
    const currentSubjects = currentProcess.subject ? currentProcess.subject.split(';').map(s => s.trim()).filter(s => s !== '') : [];
    if (!currentSubjects.includes(cleanSubject)) setCurrentProcess(prev => ({ ...prev, subject: [...currentSubjects, cleanSubject].join('; ') }));
    setNewSubject('');
  };

  const removeSubject = (subjectToRemove: string) => {
    if (!currentProcess.subject) return;
    const updatedSubjects = currentProcess.subject.split(';').map(s => s.trim()).filter(s => s !== '' && s !== subjectToRemove);
    setCurrentProcess(prev => ({ ...prev, subject: updatedSubjects.join('; ') }));
  };

  const handleSaveWithIntegrations = async () => {
    // Validação: Processo pendente de adição/edição
    if (editingProcessIndex !== null) return alert('⚠️ Finalize a edição do processo (clique no check ✔️) antes de salvar o caso.');
    if (currentProcess.process_number || otherProcessType) return alert('⚠️ Você inseriu dados de um processo mas não o adicionou.\n\nClique no botão Adicionar (+) na aba Dados do Objeto para incluir o processo no caso antes de salvar.');

    if (!formData.client_name) return alert('O "Nome do Cliente" é obrigatório.');
    if (!formData.partner_id) return alert('O "Responsável (Sócio)" é obrigatório.');
    if (formData.status === 'analysis' && !formData.prospect_date) return alert('A "Data Prospect" é obrigatória para contratos em Análise.');
    if (formData.status === 'proposal' && !formData.proposal_date) return alert('A "Data Proposta" é obrigatória para Propostas Enviadas.');
    if (formData.status === 'active') {
      if (!formData.contract_date) return alert('A "Data Assinatura" é obrigatória para Contratos Fechados.');
      if (!formData.hon_number) return alert('O "Número HON" é obrigatório para Contratos Fechados.');
      if (!formData.billing_location) return alert('O "Local Faturamento" é obrigatório para Contratos Fechados.');
      // Validação reforçada para Assinatura Física (Obrigatório e não pode ser vazio/undefined)
      if (formData.physical_signature === undefined || formData.physical_signature === null || (formData.physical_signature as any) === '') return alert('Informe se "Possui Assinatura Física" para Contratos Fechados.');
    }

    setLocalLoading(true);
    try {
        const clientId = await upsertClient();
        if (!clientId) throw new Error("Falha ao salvar dados do cliente (CNPJ Duplicado ou Inválido).");
        
        const contractPayload: any = {
            ...formData, client_id: clientId, pro_labore: safeParseFloat(formData.pro_labore), final_success_fee: safeParseFloat(formData.final_success_fee), fixed_monthly_fee: safeParseFloat(formData.fixed_monthly_fee), other_fees: safeParseFloat(formData.other_fees),
            pro_labore_extras: (formData as any).pro_labore_extras, final_success_extras: (formData as any).final_success_extras, fixed_monthly_extras: (formData as any).fixed_monthly_extras, other_fees_extras: (formData as any).other_fees_extras, timesheet: (formData as any).timesheet,
            pro_labore_clause: (formData as any).pro_labore_clause, final_success_fee_clause: (formData as any).final_success_fee_clause, fixed_monthly_fee_clause: (formData as any).fixed_monthly_fee_clause, other_fees_clause: (formData as any).other_fees_clause,
            pro_labore_extras_clauses: ensureArray((formData as any).pro_labore_extras_clauses), final_success_extras_clauses: ensureArray((formData as any).final_success_extras_clauses), fixed_monthly_extras_clauses: ensureArray((formData as any).fixed_monthly_extras_clauses), other_fees_extras_clauses: ensureArray((formData as any).other_fees_extras_clauses), intermediate_fees_clauses: ensureArray((formData as any).intermediate_fees_clauses),
            pro_labore_extras_installments: ensureArray((formData as any).pro_labore_extras_installments), final_success_extras_installments: ensureArray((formData as any).final_success_extras_installments), fixed_monthly_extras_installments: ensureArray((formData as any).fixed_monthly_extras_installments), other_fees_extras_installments: ensureArray((formData as any).other_fees_extras_installments), intermediate_fees_installments: ensureArray((formData as any).intermediate_fees_installments),
            // Incluir os novos campos de detalhamento no payload para salvar
            pro_labore_breakdown: (formData as any).pro_labore_breakdown, final_success_fee_breakdown: (formData as any).final_success_fee_breakdown, fixed_monthly_fee_breakdown: (formData as any).fixed_monthly_fee_breakdown, other_fees_breakdown: (formData as any).other_fees_breakdown,
            partner_name: undefined, analyzed_by_name: undefined, process_count: undefined, analyst: undefined, analysts: undefined, client: undefined, partner: undefined, processes: undefined, partners: undefined, id: undefined, display_id: undefined, contract_documents: undefined, documents: undefined,
        };

        if (formData.status === 'active' && initialFormData && initialFormData.status === 'proposal') {
            contractPayload.proposal_snapshot = { pro_labore: initialFormData.pro_labore, final_success_fee: initialFormData.final_success_fee, fixed_monthly_fee: initialFormData.fixed_monthly_fee, other_fees: initialFormData.other_fees, pro_labore_extras: (initialFormData as any).pro_labore_extras, final_success_extras: (initialFormData as any).final_success_extras, fixed_monthly_extras: (initialFormData as any).fixed_monthly_extras, other_fees_extras: (initialFormData as any).other_fees_extras, proposal_date: initialFormData.proposal_date, saved_at: new Date().toISOString() };
        }
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
            await forceUpdateFinancials(savedId, formData);
            await generateFinancialInstallments(savedId, formData);
            if (processes.length > 0) {
                await supabase.from('contract_processes').delete().eq('contract_id', savedId);
                const processesToInsert = processes.map(p => { 
                    const { 
                        id, 
                        created_at, 
                        author_cnpj, 
                        opponent_cnpj, 
                        cause_value, // Extrai cause_value para removê-lo do objeto enviado
                        ...rest 
                    } = p as any; 
                    
                    return { 
                        ...rest, 
                        contract_id: savedId,
                        // Mapeia cause_value (string com R$) para value_of_cause (number no banco)
                        value_of_cause: cause_value ? safeParseFloat(cause_value) : 0
                    }; 
                });
                
                const { error: processError } = await supabase.from('contract_processes').insert(processesToInsert);
                if (processError) throw processError;
            }
            if (formData.status === 'active' && formData.physical_signature === false) {
                // FIX: Use maybeSingle instead of single
                const { data } = await supabase.from('kanban_tasks').select('id').eq('contract_id', savedId).eq('status', 'signature').maybeSingle();
                if (!data) await supabase.from('kanban_tasks').insert({ title: `Coletar Assinatura: ${formData.client_name}`, description: `Contrato fechado em ${new Date().toLocaleDateString()}. Coletar assinatura física.`, priority: 'Alta', status: 'signature', contract_id: savedId, due_date: addDays(new Date(), 5).toISOString(), position: 0 });
            }
        }
        onSave();
        onClose();
    } catch (error: any) {
        if (error.code === '23505' || error.message?.includes('contracts_hon_number_key')) alert('⚠️ Duplicidade de Caso Detectada\n\nJá existe um contrato cadastrado com este Número HON.');
        else if (error.code === 'PGRST204') alert(`Erro Técnico: Tentativa de salvar campo inválido.\n\nSOLUÇÃO: Rode o SQL fornecido no Supabase.`);
        else alert(`Não foi possível salvar as alterações.\n\n${error.message}`);
    } finally {
        setLocalLoading(false);
    }
  };

  const handleCNPJSearch = async () => {
    if (!formData.cnpj || formData.has_no_cnpj) return;
    const cnpjLimpo = (formData.cnpj || '').replace(/\D/g, '');
    if (cnpjLimpo.length !== 14) return alert('CNPJ inválido. Digite 14 dígitos.');

    setLocalLoading(true);
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);
      if (!response.ok) throw new Error('CNPJ não encontrado na Receita Federal');
      const data = await response.json();
      setFormData(prev => ({ ...prev, client_name: toTitleCase(data.razao_social || data.nome_fantasia || ''), uf: data.uf || prev.uf }));
      setClientExtraData({ address: toTitleCase(data.logradouro || ''), number: data.numero || '', complement: toTitleCase(data.complemento || ''), city: toTitleCase(data.municipio || ''), email: data.email || '', is_person: false });
      
      // FIX: Use maybeSingle instead of single
      const { data: existingClient } = await supabase.from('clients').select('id, name').eq('cnpj', cnpjLimpo).maybeSingle();
      if (existingClient) setFormData(prev => ({ ...prev, client_id: existingClient.id }));
    } catch (error: any) { alert(`❌ ${error.message}\n\n💡 Você pode preencher manualmente.`); } finally { setLocalLoading(false); }
  };

  const handlePartyCNPJSearch = async (type: 'author' | 'opponent') => {
    const cnpj = type === 'author' ? (currentProcess as any).author_cnpj : (currentProcess as any).opponent_cnpj;
    if (!cnpj) return;
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    if (cleanCNPJ.length !== 14) return alert('CNPJ inválido. Digite 14 dígitos.');

    setLocalLoading(true);
    try {
        const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCNPJ}`);
        if (!response.ok) throw new Error('CNPJ não encontrado.');
        const data = await response.json();
        const name = toTitleCase(data.razao_social || data.nome_fantasia || '');
        if (type === 'author') {
             if (!options.authorOptions.includes(name)) { await supabase.from('authors').insert({ name }); options.setAuthorOptions(prev => [...prev, name].sort((a,b)=>a.localeCompare(b))); }
             setCurrentProcess(prev => ({ ...prev, author: name } as any));
        } else {
             if (!options.opponentOptions.includes(name)) { await supabase.from('opponents').insert({ name }); options.setOpponentOptions(prev => [...prev, name].sort((a,b)=>a.localeCompare(b))); }
             setCurrentProcess(prev => ({ ...prev, opponent: name }));
        }
    } catch (error: any) { alert(`Erro ao buscar CNPJ: ${error.message}`); } finally { setLocalLoading(false); }
  };

  const handleCNJSearch = async () => {
    if (!currentProcess.process_number) return;
    const numeroLimpo = currentProcess.process_number.replace(/\D/g, '');
    if (numeroLimpo.length !== 20) return alert('Número de processo inválido. Deve ter 20 dígitos.');
    setSearchingCNJ(true);
    try {
      const decoded = decodeCNJ(numeroLimpo);
      if (!decoded) throw new Error('Não foi possível decodificar o número do processo');
      const uf = decoded.tribunal === 'STF' ? 'DF' : decoded.uf;
      if (!options.courtOptions.includes(decoded.tribunal)) {
          await supabase.from('courts').insert({ name: decoded.tribunal }).select();
          options.setCourtOptions([...options.courtOptions, decoded.tribunal].sort((a,b)=>a.localeCompare(b)));
      }
      setCurrentProcess(prev => ({ ...prev, court: decoded.tribunal, uf: uf }));
    } catch (error: any) { alert(`❌ Erro ao decodificar CNJ: ${error.message}`); } finally { setSearchingCNJ(false); }
  };

  const handleOpenJusbrasil = () => {
    if (currentProcess.process_number) window.open(`https://www.jusbrasil.com.br/processos/numero/${currentProcess.process_number.replace(/\D/g, '')}`, '_blank');
  };
    
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!formData.id) return alert("⚠️ Você precisa salvar o contrato pelo menos uma vez antes de anexar arquivos.");

    setUploading(true);
    try {
      const filePath = `${formData.id}/${Date.now()}_${file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase()}`;
      const { error: uploadError } = await supabase.storage.from('contract-documents').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: docData, error: dbError } = await supabase.from('contract_documents').insert({ contract_id: formData.id, file_name: file.name, file_path: filePath, file_type: type }).select().single();
      if (dbError) throw dbError;
      if (docData) setDocuments(prev => [docData, ...prev]);
    } catch (error: any) { alert("Erro ao anexar arquivo: " + error.message); } finally { setUploading(false); e.target.value = ''; }
  };

  const handleDownload = async (path: string) => {
    try {
      const { data, error } = await supabase.storage.from('contract-documents').download(path);
      if (error) throw error;
      const url = URL.createObjectURL(data), a = document.createElement('a');
      a.href = url; a.download = path.split('_').slice(1).join('_') || 'documento.pdf';
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch (error: any) { alert("Erro ao baixar arquivo: " + error.message); }
  };

  const handleDeleteDocument = async (id: string, path: string) => {
    if (!confirm("Tem certeza que deseja excluir este documento?")) return;
    try {
      await supabase.storage.from('contract-documents').remove([path]);
      const { error: dbError } = await supabase.from('contract_documents').delete().eq('id', id);
      if (dbError) throw dbError;
      setDocuments(prev => prev.filter(d => d.id !== id));
    } catch (error: any) { alert("Erro ao excluir documento: " + error.message); }
  };

  const handleClientChange = async (name: string) => {
    const newName = toTitleCase(name);
    setFormData(prev => ({ ...prev, client_name: newName }));
    if (!newName) return;
    const { data } = await supabase.from('clients').select('cnpj, id').eq('name', newName).single();
    if (data && data.cnpj) setFormData(prev => ({ ...prev, client_name: newName, client_id: data.id, cnpj: maskCNPJ(data.cnpj) }));
  };

  const partnerSelectOptions = [{ label: 'Selecione', value: '' }, ...partners.map(p => ({ label: p.name, value: p.id }))];
  const analystSelectOptions = [{ label: 'Selecione', value: '' }, ...(analysts ? analysts.map(a => ({ label: a.name, value: a.id })) : [])];
  const ufOptions = [{ label: 'Selecione', value: '' }, ...UFS.map(uf => ({ label: uf.nome, value: uf.sigla }))];
  const billingOptions = [{ label: 'Selecione', value: '' }, ...options.billingLocations.map(l => ({ label: l, value: l }))];
  const signatureOptions = [{ label: 'Selecione', value: '' }, { label: 'Sim', value: 'true' }, { label: 'Não (Cobrar)', value: 'false' }];
  const rejectionByOptions = [{ label: 'Selecione', value: '' }, { label: 'Cliente', value: 'Cliente' }, { label: 'Escritório', value: 'Escritório' }];
  const rejectionReasonOptions = [{ label: 'Selecione', value: '' }, { label: 'Cliente declinou', value: 'Cliente declinou' }, { label: 'Cliente não retornou', value: 'Cliente não retornou' }, { label: 'Caso ruim', value: 'Caso ruim' }, { label: 'Conflito de interesses', value: 'Conflito de interesses' }];
  const areaOptions = [{ label: 'Selecione', value: '' }, ...options.legalAreas.map(a => ({ label: a, value: a }))];
  const positionOptions = [{ label: 'Selecione', value: '' }, ...options.positionsList.map(p => ({ label: p, value: p }))];
  const magistrateTypes = [{ label: 'Selecione', value: '' }, { label: 'Juiz', value: 'Juiz' }, { label: 'Desembargador', value: 'Desembargador' }, { label: 'Ministro', value: 'Ministro' }];
  
  const justiceSelectOptions = [{ label: 'Selecione', value: '' }, ...options.justiceOptions.map(j => ({ label: j, value: j }))];
  const varaSelectOptions = [{ label: 'Selecione', value: '' }, ...options.varaOptions.map(v => ({ label: v, value: v }))];
  const courtSelectOptions = [{ label: 'Selecione', value: '' }, ...options.courtOptions.map(c => ({ label: c, value: c }))];
  const comarcaSelectOptions = [{ label: 'Selecione', value: '' }, ...options.comarcaOptions.map(c => ({ label: c, value: c }))];
  const classSelectOptions = [{ label: 'Selecione', value: '' }, ...options.classOptions.map(c => ({ label: c, value: c }))];
  const subjectSelectOptions = [{ label: 'Selecione', value: '' }, ...options.subjectOptions.map(s => ({ label: s, value: s }))];
  const clientSelectOptions = [{ label: 'Selecione', value: '' }, ...options.clientOptions.map(c => ({ label: c, value: c }))];

  const handleTypeChange = (type: string) => {
    setOtherProcessType(type);
    setCurrentProcess(prev => ({ ...prev, process_number: '' }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[50] p-4">
      <div className={`w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200 transition-colors duration-500 ease-in-out ${getThemeBackground(formData.status)}`}>
        <div className="p-6 border-b border-black/5 flex justify-between items-center bg-white/50 backdrop-blur-sm rounded-t-2xl">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-800">{isEditing ? 'Editar Caso' : 'Novo Caso'}</h2>
            {(formData as any).display_id && ( <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-sm font-mono font-bold border border-gray-200"> ID: {(formData as any).display_id} </span> )}
          </div>
          <button onClick={onClose}><X className="w-6 h-6 text-gray-400" /></button>
        </div>

        <div className="flex-1 p-8 space-y-8 overflow-y-auto">
            {/* Abas */}
            <div className="flex gap-2 border-b border-gray-200 mb-6">
                <button
                    onClick={() => setActiveTab(1)}
                    className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                        activeTab === 1 
                        ? 'border-salomao-blue text-salomao-blue' 
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Dados do Cliente
                </button>
                <button
                    onClick={() => setActiveTab(2)}
                    className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                        activeTab === 2 
                        ? 'border-salomao-blue text-salomao-blue' 
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Status
                </button>
                <button
                    onClick={() => setActiveTab(3)}
                    className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                        activeTab === 3 
                        ? 'border-salomao-blue text-salomao-blue' 
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Dados do Objeto
                </button>
                <button
                    onClick={() => setActiveTab(4)}
                    className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                        activeTab === 4
                        ? 'border-salomao-blue text-salomao-blue' 
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    GED
                </button>
            </div>

            {/* Conteúdo da Aba 1: Dados do Cliente */}
            {activeTab === 1 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-left-2 duration-200">
                    <ClientFormSection formData={formData} setFormData={setFormData} maskCNPJ={maskCNPJ} handleCNPJSearch={handleCNPJSearch} clientSelectOptions={clientSelectOptions} handleClientChange={handleClientChange} setActiveManager={setActiveManager} duplicateClientCases={duplicateClientCases} getStatusLabel={getStatusLabel} areaOptions={areaOptions} partnerSelectOptions={partnerSelectOptions} onOpenPartnerManager={onOpenPartnerManager} />
                </div>
            )}

            {/* Conteúdo da Aba 2: Status */}
            {activeTab === 2 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-left-2 duration-200">
                    <StatusAndDatesSection formData={formData} setFormData={setFormData} statusOptions={statusOptions} handleCreateStatus={handleCreateStatus} ensureDateValue={ensureDateValue} analystSelectOptions={analystSelectOptions} onOpenAnalystManager={onOpenAnalystManager} rejectionByOptions={rejectionByOptions} rejectionReasonOptions={rejectionReasonOptions} partnerSelectOptions={partnerSelectOptions} billingOptions={billingOptions} maskHon={maskHon} setActiveManager={setActiveManager} signatureOptions={signatureOptions} formatForInput={formatForInput} handleAddToList={handleAddToList} removeExtra={removeExtra} newIntermediateFee={newIntermediateFee} setNewIntermediateFee={setNewIntermediateFee} interimInstallments={interimInstallments} setInterimInstallments={setInterimInstallments} handleAddIntermediateFee={handleAddIntermediateFee} interimClause={interimClause} setInterimClause={setInterimClause} handleRemoveIntermediateFee={handleRemoveIntermediateFee} ensureArray={ensureArray} />
                    
                    {(formData.status === 'analysis' || formData.status === 'proposal' || formData.status === 'active') && (
                        <div className="pt-6 border-t border-black/5 space-y-6">
                            {(formData.status === 'proposal' || formData.status === 'active') && ( 
                                <div className="mb-2"> 
                                    <label className="text-xs font-medium block mb-1">Referência</label> 
                                    <textarea className="w-full border border-gray-300 p-2.5 rounded-lg text-sm bg-white focus:border-salomao-blue outline-none h-24 resize-none" value={(formData as any).reference || ''} onChange={e => setFormData({...formData, reference: e.target.value} as any)} placeholder="Ex: Proposta 123/2025" /> 
                                </div> 
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Conteúdo da Aba 3: Dados do Objeto */}
            {activeTab === 3 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-left-2 duration-200">
                    <section className="space-y-4 bg-white/60 p-5 rounded-xl border border-white/40 shadow-sm backdrop-blur-sm relative z-30">
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Casos</h3>
                        
                        <div className="flex flex-wrap gap-2 mb-4">
                            <button onClick={() => { handleTypeChange(''); setIsStandardCNJ(true); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!otherProcessType ? 'bg-salomao-blue text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Processos Judiciais</button>
                            <button onClick={() => handleTypeChange('Processo Administrativo')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${otherProcessType === 'Processo Administrativo' ? 'bg-salomao-blue text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Processo Administrativo</button>
                            <button onClick={() => handleTypeChange('Consultoria')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${otherProcessType === 'Consultoria' ? 'bg-salomao-blue text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Consultoria</button>
                            <button onClick={() => handleTypeChange('Assessoria Jurídica')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${otherProcessType === 'Assessoria Jurídica' ? 'bg-salomao-blue text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Assessoria Jurídica</button>
                            <button onClick={() => handleTypeChange('Outros')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${otherProcessType === 'Outros' ? 'bg-salomao-blue text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Outros</button>
                        </div>

                        <LegalProcessForm formData={formData} setFormData={setFormData} currentProcess={currentProcess} setCurrentProcess={setCurrentProcess} isStandardCNJ={isStandardCNJ} setIsStandardCNJ={setIsStandardCNJ} otherProcessType={otherProcessType} setOtherProcessType={setOtherProcessType} duplicateProcessWarning={duplicateProcessWarning} searchingCNJ={searchingCNJ} handleCNJSearch={handleCNJSearch} handleOpenJusbrasil={handleOpenJusbrasil} courtSelectOptions={courtSelectOptions} ufOptions={ufOptions} positionOptions={positionOptions} authorOptions={options.authorOptions} opponentOptions={options.opponentOptions} duplicateOpponentCases={duplicateOpponentCases} magistrateTypes={magistrateTypes} magistrateOptions={options.magistrateOptions} newMagistrateTitle={newMagistrateTitle} setNewMagistrateTitle={setNewMagistrateTitle} newMagistrateName={newMagistrateName} setNewMagistrateName={setNewMagistrateName} addMagistrate={addMagistrate} removeMagistrate={removeMagistrate} numeralOptions={numeralOptions} varaSelectOptions={varaSelectOptions} comarcaSelectOptions={comarcaSelectOptions} justiceSelectOptions={justiceSelectOptions} classSelectOptions={classSelectOptions} subjectSelectOptions={subjectSelectOptions} newSubject={newSubject} setNewSubject={setNewSubject} addSubjectToProcess={addSubjectToProcess} removeSubject={removeSubject} editingProcessIndex={editingProcessIndex} handleProcessAction={handleProcessAction} handlePartyCNPJSearch={handlePartyCNPJSearch} localMaskCNJ={localMaskCNJ} ensureDateValue={ensureDateValue} setActiveManager={setActiveManager} />
                        <LegalProcessList processes={processes} setViewProcess={setViewProcess} setViewProcessIndex={setViewProcessIndex} editProcess={editProcess} removeProcess={removeProcess} />
                    </section>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Observações Gerais</label>
                        <textarea className="w-full border border-gray-300 rounded-lg p-3 text-sm h-24 focus:border-salomao-blue outline-none bg-white" value={formData.observations} onChange={(e) => setFormData({...formData, observations: toTitleCase(e.target.value)})}></textarea>
                    </div>
                </div>
            )}

            {/* Conteúdo da Aba 4: GED */}
            {activeTab === 4 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-left-2 duration-200">
                    <ContractDocuments documents={documents} isEditing={isEditing} uploading={uploading} status={formData.status} onUpload={handleFileUpload} onDownload={handleDownload} onDelete={handleDeleteDocument} />
                </div>
            )}

        </div>
        <div className="p-6 border-t border-black/5 flex justify-end gap-3 bg-white/50 backdrop-blur-sm rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors">Cancelar</button>
          <button onClick={handleSaveWithIntegrations} disabled={isLoading} className="px-6 py-2 bg-salomao-blue text-white rounded-lg hover:bg-blue-900 shadow-lg flex items-center transition-all transform active:scale-95">{isLoading ? 'Salvando...' : <><Save className="w-4 h-4 mr-2" /> Salvar Caso</>}</button>
        </div>
      </div>

       {activeManager && (
         <OptionManager 
           title={activeManager === 'area' ? "Gerenciar Áreas" : activeManager === 'position' ? "Gerenciar Posições" : activeManager === 'court' ? "Gerenciar Tribunais" : activeManager === 'vara' ? "Gerenciar Varas" : activeManager === 'comarca' ? "Gerenciar Comarcas" : activeManager === 'class' ? "Gerenciar Classes" : activeManager === 'subject' ? "Gerenciar Assuntos" : activeManager === 'justice' ? "Gerenciar Justiças" : activeManager === 'magistrate' ? "Gerenciar Magistrados" : activeManager === 'opponent' ? "Gerenciar Contrário" : activeManager === 'author' ? "Gerenciar Autores" : activeManager === 'location' ? "Gerenciar Locais de Faturamento" : activeManager === 'client' ? "Gerenciar Clientes" : "Gerenciar"}
           options={activeManager === 'area' ? options.legalAreas : activeManager === 'position' ? options.positionsList : activeManager === 'court' ? options.courtOptions : activeManager === 'vara' ? options.varaOptions : activeManager === 'comarca' ? options.comarcaOptions : activeManager === 'class' ? options.classOptions : activeManager === 'subject' ? options.subjectOptions : activeManager === 'justice' ? options.justiceOptions : activeManager === 'magistrate' ? options.magistrateOptions : activeManager === 'opponent' ? options.opponentOptions : activeManager === 'author' ? options.authorOptions : activeManager === 'location' ? options.billingLocations : activeManager === 'client' ? options.clientOptions : []}
           onAdd={(v) => options.handleGenericAdd(v, { title: newMagistrateTitle, setNewSubject, setNewMagistrateName })}
           onRemove={options.handleGenericRemove}
           onEdit={options.handleGenericEdit}
           onClose={() => setActiveManager(null)}
           placeholder={activeManager === 'comarca' && !currentProcess.uf ? "Selecione a UF primeiro" : "Digite o nome"}
        />
       )}
       
      <ProcessDetailsModal process={viewProcess} onClose={() => setViewProcess(null)} onEdit={() => { if (viewProcessIndex !== null) { setViewProcess(null); editProcess(viewProcessIndex); } }} />
    </div>
  );
}
