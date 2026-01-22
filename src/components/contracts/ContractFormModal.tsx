src/components/contracts/ContractFormModal.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, X, Save, Settings, Check, ChevronDown, Clock, History as HistoryIcon, ArrowRight, Edit, Trash2, CalendarCheck, Hourglass, Upload, FileText, Download, AlertCircle, Search, Loader2, Link as LinkIcon, MapPin, DollarSign, Tag, Gavel, Eye, AlertTriangle, TrendingUp, TrendingDown, Pencil } from 'lucide-react';
import { Contract, Partner, ContractProcess, TimelineEvent, ContractDocument, Analyst, Magistrate } from '../../types';
import { maskCNPJ, maskMoney, maskHon, maskCNJ, toTitleCase, parseCurrency } from '../../utils/masks';
import { decodeCNJ } from '../../utils/cnjDecoder';
import { addDays, addMonths } from 'date-fns';
import { CustomSelect } from '../ui/CustomSelect';

// Componentes Modularizados Existentes
import { OptionManager } from './components/OptionManager';
import { FinancialInputWithInstallments } from './components/FinancialInputWithInstallments';
import { ContractDocuments } from './components/ContractDocuments';
import { ProcessDetailsModal } from './components/ProcessDetailsModal';

// Novos Componentes Modularizados (Serão criados a seguir)
import { StatusAndDatesSection } from './components/StatusAndDatesSection';
import { ClientFormSection } from './components/ClientFormSection';

const UFS = [ { sigla: 'AC', nome: 'Acre' }, { sigla: 'AL', nome: 'Alagoas' }, { sigla: 'AP', nome: 'Amapá' }, { sigla: 'AM', nome: 'Amazonas' }, { sigla: 'BA', nome: 'Bahia' }, { sigla: 'CE', nome: 'Ceará' }, { sigla: 'DF', nome: 'Distrito Federal' }, { sigla: 'ES', nome: 'Espírito Santo' }, { sigla: 'GO', nome: 'Goiás' }, { sigla: 'MA', nome: 'Maranhão' }, { sigla: 'MT', nome: 'Mato Grosso' }, { sigla: 'MS', nome: 'Mato Grosso do Sul' }, { sigla: 'MG', nome: 'Minas Gerais' }, { sigla: 'PA', nome: 'Pará' }, { sigla: 'PB', nome: 'Paraíba' }, { sigla: 'PR', nome: 'Paraná' }, { sigla: 'PE', nome: 'Pernambuco' }, { sigla: 'PI', nome: 'Piauí' }, { sigla: 'RJ', nome: 'Rio de Janeiro' }, { sigla: 'RN', nome: 'Rio Grande do Norte' }, { sigla: 'RS', nome: 'Rio Grande do Sul' }, { sigla: 'RO', nome: 'Rondônia' }, { sigla: 'RR', nome: 'Roraima' }, { sigla: 'SC', nome: 'Santa Catarina' }, { sigla: 'SP', nome: 'São Paulo' }, { sigla: 'SE', nome: 'Sergipe' }, { sigla: 'TO', nome: 'Tocantins' } ];

// Dados Padrão
const DEFAULT_COURTS = ['STF', 'STJ', 'TST', 'TRF1', 'TRF2', 'TRF3', 'TRF4', 'TRF5', 'TJSP', 'TJRJ', 'TJMG', 'TJRS', 'TJPR', 'TJSC', 'TJBA', 'TJDFT', 'TRT1', 'TRT2', 'TRT15'];
const DEFAULT_CLASSES = ['Procedimento Comum', 'Execução de Título Extrajudicial', 'Monitória', 'Mandado de Segurança', 'Ação Trabalhista - Rito Ordinário', 'Ação Trabalhista - Rito Sumaríssimo', 'Recurso Ordinário', 'Agravo de Instrumento', 'Apelação'];
const DEFAULT_SUBJECTS = ['Dano Moral', 'Dano Material', 'Inadimplemento', 'Rescisão Indireta', 'Verbas Rescisórias', 'Acidente de Trabalho', 'Doença Ocupacional', 'Horas Extras', 'Assédio Moral'];
const DEFAULT_POSITIONS = ['Autor', 'Réu', 'Terceiro Interessado', 'Exequente', 'Executado', 'Reclamante', 'Reclamado', 'Apelante', 'Apelado', 'Agravante', 'Agravado', 'Impetrante', 'Impetrado'];
// Novos Defaults para garantir persistência visual correta
const DEFAULT_VARAS = ['Cível', 'Criminal', 'Família', 'Trabalho', 'Fazenda Pública', 'Juizado Especial', 'Execuções Fiscais'];
const DEFAULT_JUSTICES = ['Estadual', 'Federal', 'Trabalho', 'Eleitoral', 'Militar'];

export const formatForInput = (val: string | number | undefined) => {
  if (val === undefined || val === null) return '';
  if (typeof val === 'number') return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  if (typeof val === 'string' && !val.includes('R$') && !isNaN(parseFloat(val)) && val.trim() !== '') {
      return parseFloat(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
  return val;
};

export const ensureDateValue = (dateStr?: string | null) => {
    if (!dateStr) return '';
    return dateStr.split('T')[0];
};

const localMaskCNJ = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    return cleanValue
        .replace(/^(\d{7})(\d)/, '$1-$2')
        .replace(/^(\d{7}-\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{7}-\d{2}\.\d{4})(\d)/, '$1.$2')
        .replace(/^(\d{7}-\d{2}\.\d{4}\.\d)(\d)/, '$1.$2')
        .replace(/^(\d{7}-\d{2}\.\d{4}\.\d\.\d{2})(\d)/, '$1.$2')
        .substring(0, 25);
};

// Função interna robusta para converter string BRL para float antes de salvar
const safeParseFloat = (value: string | number | undefined | null): number => {
    if (!value) return 0;
    if (typeof value === 'number') return value;
    
    // Remove "R$", espaços, pontos de milhar e substitui vírgula por ponto
    const cleanStr = value.toString().replace(/[^\d,-]/g, '').replace(',', '.');
    const floatVal = parseFloat(cleanStr);
    
    return isNaN(floatVal) ? 0 : floatVal;
};

// HELPER ESSENCIAL: Garante que o valor seja um array, mesmo que venha como string JSON do banco
export const ensureArray = (val: any): string[] => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
        const trimmed = val.trim();
        if (trimmed.startsWith('[')) {
            try { return JSON.parse(trimmed); } catch { return []; }
        }
    }
    return [];
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
  const [billingLocations, setBillingLocations] = useState(['Salomão RJ', 'Salomão SP', 'Salomão SC', 'Salomão ES', 'Salomão DF']);
  const [clientExtraData, setClientExtraData] = useState({ address: '', number: '', complement: '', city: '', email: '', is_person: false });
  const [interimInstallments, setInterimInstallments] = useState('1x');
  const [interimClause, setInterimClause] = useState(''); // Estado local para cláusula intermediária
  const [legalAreas, setLegalAreas] = useState<string[]>(['Trabalhista', 'Cível', 'Tributário', 'Empresarial', 'Previdenciário', 'Família', 'Criminal', 'Consumidor']);
  
  // Estado Unificado de Gerenciamento
  const [activeManager, setActiveManager] = useState<string | null>(null); // 'area', 'position', 'court', 'vara', 'comarca', 'class', 'subject', 'justice', 'magistrate', 'opponent', 'location', 'client', 'author'
  
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

  // Modais Internos
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
  const [authorOptions, setAuthorOptions] = useState<string[]>([]); // New Author Options
  const [clientOptions, setClientOptions] = useState<string[]>([]);

  const numeralOptions = Array.from({ length: 100 }, (_, i) => ({ label: `${i + 1}º`, value: `${i + 1}º` }));
    
  const isLoading = parentLoading || localLoading;

  useEffect(() => {
    if (isOpen) {
      fetchStatuses();
      fetchAuxiliaryTables();
      if (formData.id) fetchDocuments();
      setInitialFormData(JSON.parse(JSON.stringify(formData)));
      
      // Default installments to 1x if null
      if (!formData.pro_labore_installments) setFormData(prev => ({...prev, pro_labore_installments: '1x'}));
      if (!formData.final_success_fee_installments) setFormData(prev => ({...prev, final_success_fee_installments: '1x'}));
      if (!formData.fixed_monthly_fee_installments) setFormData(prev => ({...prev, fixed_monthly_fee_installments: '1x'}));
      if (!formData.other_fees_installments) setFormData(prev => ({...prev, other_fees_installments: '1x'}));

    } else {
      setDocuments([]);
      setClientExtraData({ address: '', number: '', complement: '', city: '', email: '', is_person: false });
      setInterimInstallments('1x');
      setInterimClause('');
      setIsStandardCNJ(true);
      setOtherProcessType('');
      setCurrentProcess(prev => ({ ...prev, process_number: '', uf: '', position: '' })); 
      setNewSubject('');
      setDuplicateClientCases([]);
      setDuplicateOpponentCases([]);
      setDuplicateProcessWarning(false);
      setInitialFormData(null);
      setActiveManager(null);
    }
  }, [isOpen, formData.id]);

  useEffect(() => {
    const checkClientDuplicates = async () => {
        if (!formData.client_name || formData.client_name.length < 3) {
            setDuplicateClientCases([]);
            return;
        }
        
        const { data } = await supabase
            .from('contracts')
            .select('id, hon_number, status')
            .ilike('client_name', `%${formData.client_name}%`)
            .neq('id', formData.id || '00000000-0000-0000-0000-000000000000') 
            .limit(5);
            
        if (data) setDuplicateClientCases(data);
    };
    
    const timer = setTimeout(checkClientDuplicates, 800);
    return () => clearTimeout(timer);
  }, [formData.client_name, formData.id]);

  useEffect(() => {
    const checkOpponentDuplicates = async () => {
        if (!currentProcess.opponent || currentProcess.opponent.length < 3) {
            setDuplicateOpponentCases([]);
            return;
        }

        const { data } = await supabase
            .from('contract_processes')
            .select('contract_id, contracts(id, client_name, hon_number)')
            .ilike('opponent', `%${currentProcess.opponent}%`)
            .limit(5);
            
        if (data) {
            const uniqueCases = data.reduce((acc: any[], current: any) => {
                const x = acc.find(item => item.contracts?.id === current.contracts?.id);
                if (!x && current.contracts) {
                    return acc.concat([current]);
                } else {
                    return acc;
                }
            }, []);
            setDuplicateOpponentCases(uniqueCases);
        }
    };

    const timer = setTimeout(checkOpponentDuplicates, 800);
    return () => clearTimeout(timer);
  }, [currentProcess.opponent]);

  useEffect(() => {
    const checkProcessNumber = async () => {
        if (!currentProcess.process_number || currentProcess.process_number.length < 15 || currentProcess.process_number === 'CONSULTORIA' || currentProcess.process_number === 'ASSESSORIA JURÍDICA') {
            setDuplicateProcessWarning(false);
            return;
        }
        
        const { data } = await supabase
            .from('contract_processes')
            .select('id')
            .eq('process_number', currentProcess.process_number)
            .limit(1);
            
        if (data && data.length > 0) {
            setDuplicateProcessWarning(true);
        } else {
            setDuplicateProcessWarning(false);
        }
    };

    const timer = setTimeout(checkProcessNumber, 800);
    return () => clearTimeout(timer);
  }, [currentProcess.process_number]);

  const fetchAuxiliaryTables = async () => {
    const { data: courts } = await supabase.from('courts').select('name').order('name');
    if (courts) setCourtOptions(Array.from(new Set([...DEFAULT_COURTS, ...courts.map(c => c.name)])).sort((a, b) => a.localeCompare(b)));

    const { data: classes } = await supabase.from('process_classes').select('name').order('name');
    if (classes) setClassOptions(Array.from(new Set([...DEFAULT_CLASSES, ...classes.map(c => c.name)])).sort((a, b) => a.localeCompare(b)));

    const { data: subjects } = await supabase.from('process_subjects').select('name').order('name');
    if (subjects) setSubjectOptions(Array.from(new Set([...DEFAULT_SUBJECTS, ...subjects.map(s => s.name)])).sort((a, b) => a.localeCompare(b)));

    const { data: positions } = await supabase.from('process_positions').select('name').order('name');
    if (positions) setPositionsList(Array.from(new Set([...DEFAULT_POSITIONS, ...positions.map(p => p.name)])).sort((a, b) => a.localeCompare(b)));

    // Correção: Buscar Varas e Justiças também se existirem as tabelas e MERGE com defaults
    const { data: varas } = await supabase.from('process_varas').select('name').order('name');
    if (varas) setVaraOptions(Array.from(new Set([...DEFAULT_VARAS, ...varas.map(v => v.name)])).sort((a, b) => a.localeCompare(b)));

    const { data: justices } = await supabase.from('process_justice_types').select('name').order('name');
    if (justices) setJusticeOptions(Array.from(new Set([...DEFAULT_JUSTICES, ...justices.map(j => j.name)])).sort((a, b) => a.localeCompare(b)));

    const { data: mags } = await supabase.from('magistrates').select('name').order('name');
    if (mags) setMagistrateOptions(mags.map(m => m.name));

    const { data: opps } = await supabase.from('opponents').select('name').order('name');
    if (opps) setOpponentOptions(opps.map(o => o.name));
    
    // Fetch Authors
    const { data: authors } = await supabase.from('authors').select('name').order('name');
    if (authors) setAuthorOptions(authors.map(a => a.name));

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

  useEffect(() => {
    fetchComarcas(currentProcess.uf);
  }, [currentProcess.uf]);

  useEffect(() => {
    if (!isStandardCNJ) {
       // Logica para tipo outro
    }
  }, [otherProcessType]);

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
      const options = [{ label: 'Selecione', value: '' }, ...sortedData.map(s => ({ label: s.label, value: s.value }))];
      setStatusOptions(options);
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
      const { data: existingClient } = await supabase.from('clients').select('id').eq('cnpj', clientData.cnpj).single();
        
      if (existingClient) {
        await supabase.from('clients').update(clientData).eq('id', existingClient.id);
        return existingClient.id;
      } else {
        const { data: newClient, error } = await supabase.from('clients').insert(clientData).select().single();
        if (error) { 
            console.error('Erro ao criar cliente com CNPJ:', error); 
            return null; 
        }
        return newClient.id;
      }
    } else {
      if (formData.client_id) {
         const { error } = await supabase.from('clients').update(clientData).eq('id', formData.client_id);
         if (error) console.error("Erro ao atualizar cliente sem CNPJ:", error);
         return formData.client_id;
      } else {
         const { data: newClient, error } = await supabase.from('clients').insert(clientData).select().single();
         if (error) { 
             console.error('Erro ao criar cliente sem CNPJ:', error); 
             return null; 
         }
         return newClient.id;
      }
    }
  };

  const handleAddToList = (listField: string, valueField: keyof Contract, installmentsListField?: string, installmentsSourceField?: keyof Contract) => {
    const value = (formData as any)[valueField];
    const clauseValue = (formData as any)[valueField + '_clause'];
    if (!value || value === 'R$ 0,00' || value === '') return;
    
    const currentList = (formData as any)[listField] || [];
    // CORREÇÃO: Usar ensureArray para garantir que sempre seja array
    const rawClauses = (formData as any)[listField + '_clauses'];
    const currentClausesList = ensureArray(rawClauses);

    const updates: any = {
        [listField]: [...currentList, value],
        [listField + '_clauses']: [...currentClausesList, clauseValue || ''], 
        [valueField]: '',
        [valueField + '_clause']: ''
    };

    // Adicionar as parcelas se fornecido
    if (installmentsListField && installmentsSourceField) {
        const installmentsValue = (formData as any)[installmentsSourceField] || '1x';
        const rawInstallments = (formData as any)[installmentsListField];
        const currentInstallmentsList = ensureArray(rawInstallments);
        
        updates[installmentsListField] = [...currentInstallmentsList, installmentsValue];
        updates[installmentsSourceField] = '1x'; // Resetar para 1x
    }

    setFormData(prev => ({ 
        ...prev, 
        ...updates
    }));
  };

  const removeExtra = (field: string, index: number, installmentsListField?: string) => {
    setFormData((prev: any) => {
      const newList = [...(prev[field] || [])];
      // CORREÇÃO: Usar ensureArray
      const rawClauses = prev[field + '_clauses'];
      const newClausesList = [...ensureArray(rawClauses)];
      
      newList.splice(index, 1);
      if(newClausesList.length > index) newClausesList.splice(index, 1);
      
      const updates: any = { [field]: newList, [field + '_clauses']: newClausesList };

      if (installmentsListField) {
          const rawInst = prev[installmentsListField];
          const newInstList = [...ensureArray(rawInst)];
          if (newInstList.length > index) newInstList.splice(index, 1);
          updates[installmentsListField] = newInstList;
      }
      
      return { ...prev, ...updates };
    });
  };

  const handleAddIntermediateFee = () => {
      if(!newIntermediateFee) return;
      addIntermediateFee(); 
      
      // CORREÇÃO: Usar ensureArray
      const rawClauses = (formData as any).intermediate_fees_clauses;
      const currentClauses = ensureArray(rawClauses);
      
      // Adicionar parcelas
      const rawInstallments = (formData as any).intermediate_fees_installments;
      const currentInstallments = ensureArray(rawInstallments);

      setFormData(prev => ({
          ...prev,
          intermediate_fees_clauses: [...currentClauses, interimClause],
          intermediate_fees_installments: [...currentInstallments, interimInstallments]
      } as any));
      setInterimClause('');
      setInterimInstallments('1x');
  };
    
  const handleRemoveIntermediateFee = (idx: number) => {
      removeIntermediateFee(idx);
      // CORREÇÃO: Usar ensureArray
      const raw = (formData as any).intermediate_fees_clauses;
      const currentClauses = [...ensureArray(raw)];
      currentClauses.splice(idx, 1);

      const rawInst = (formData as any).intermediate_fees_installments;
      const currentInst = [...ensureArray(rawInst)];
      currentInst.splice(idx, 1);
      
      setFormData(prev => ({ ...prev, intermediate_fees_clauses: currentClauses, intermediate_fees_installments: currentInst } as any));
  };

  const addMagistrate = (magistrateName = newMagistrateName) => {
    if (!magistrateName.trim()) return;
    const newMagistrate: Magistrate = { title: newMagistrateTitle, name: magistrateName };
    setCurrentProcess(prev => ({
      ...prev,
      magistrates: [...(prev.magistrates || []), newMagistrate]
    }));
    setNewMagistrateName('');
  };

  const removeMagistrate = (index: number) => {
    setCurrentProcess(prev => {
      const newList = [...(prev.magistrates || [])];
      newList.splice(index, 1);
      return { ...prev, magistrates: newList };
    });
  };

  // Funções de Gerenciamento Genérico
  const handleGenericAdd = async (value: string) => {
      const cleanValue = toTitleCase(value.trim());
      if (!cleanValue) return false;

      let error = null;
      
      switch(activeManager) {
        case 'area':
            if (!legalAreas.includes(cleanValue)) {
                setLegalAreas(prev => [...prev, cleanValue].sort((a,b)=>a.localeCompare(b)));
                setFormData(prev => ({ ...prev, area: cleanValue }));
            }
            break;
        case 'position':
            if (!positionsList.includes(cleanValue)) {
                const { error: err } = await supabase.from('process_positions').insert({ name: cleanValue });
                error = err;
                if (!err) {
                    setPositionsList(prev => [...prev, cleanValue].sort((a,b)=>a.localeCompare(b)));
                    setCurrentProcess(prev => ({ ...prev, position: cleanValue }));
                }
            }
            break;
        case 'court':
             if (!courtOptions.includes(cleanValue.toUpperCase())) {
                const { error: err } = await supabase.from('courts').insert({ name: cleanValue.toUpperCase() });
                error = err;
                if (!err) {
                   setCourtOptions(prev => [...prev, cleanValue.toUpperCase()].sort((a,b)=>a.localeCompare(b)));
                   setCurrentProcess(prev => ({ ...prev, court: cleanValue.toUpperCase() }));
                }
             }
             break;
        case 'vara':
             if (!varaOptions.includes(cleanValue)) {
                 // Adicionada persistência no Supabase para Varas
                 const { error: err } = await supabase.from('process_varas').insert({ name: cleanValue });
                 // Se der erro (tabela não existir), salvamos localmente para não bloquear o usuário
                 if (err) console.warn("Aviso: Não foi possível salvar vara no banco, usando local.", err);
                 
                 setVaraOptions(prev => [...prev, cleanValue].sort((a,b)=>a.localeCompare(b)));
                 setCurrentProcess(prev => ({ ...prev, vara: cleanValue }));
             }
             break;
        case 'comarca':
             if (!currentProcess.uf) {
                 alert("Selecione um Estado (UF) antes de adicionar Comarca.");
                 return false;
             }
             if (!comarcaOptions.includes(cleanValue)) {
                 const { error: err } = await supabase.from('comarcas').insert({ name: cleanValue, uf: currentProcess.uf });
                 error = err;
                 if (!err) {
                    setComarcaOptions(prev => [...prev, cleanValue].sort((a,b)=>a.localeCompare(b)));
                    setCurrentProcess(prev => ({ ...prev, comarca: cleanValue }));
                 }
             }
             break;
        case 'class':
             if (!classOptions.includes(cleanValue)) {
                 const { error: err } = await supabase.from('process_classes').insert({ name: cleanValue });
                 error = err;
                 if (!err) {
                    setClassOptions(prev => [...prev, cleanValue].sort((a,b)=>a.localeCompare(b)));
                    setCurrentProcess(prev => ({ ...prev, process_class: cleanValue }));
                 }
             }
             break;
        case 'subject':
             if (!subjectOptions.includes(cleanValue)) {
                 const { error: err } = await supabase.from('process_subjects').insert({ name: cleanValue });
                 error = err;
                 if (!err) {
                    setSubjectOptions(prev => [...prev, cleanValue].sort((a,b)=>a.localeCompare(b)));
                    setNewSubject(cleanValue); // Set input for adding to process
                 }
             }
             break;
        case 'justice':
             if (!justiceOptions.includes(cleanValue)) {
                 // Adicionada persistência para Justiça
                 const { error: err } = await supabase.from('process_justice_types').insert({ name: cleanValue });
                 if (err) console.warn("Aviso: Não foi possível salvar justiça no banco, usando local.", err);

                 setJusticeOptions(prev => [...prev, cleanValue].sort((a,b)=>a.localeCompare(b)));
                 setCurrentProcess(prev => ({ ...prev, justice_type: cleanValue }));
             }
             break;
        case 'magistrate':
             if (!magistrateOptions.includes(cleanValue)) {
                 const { error: err } = await supabase.from('magistrates').insert({ name: cleanValue, title: newMagistrateTitle });
                 error = err;
                 if (!err) {
                     setMagistrateOptions(prev => [...prev, cleanValue].sort((a,b)=>a.localeCompare(b)));
                     setNewMagistrateName(cleanValue);
                 }
             }
             break;
        case 'opponent':
             if (!opponentOptions.includes(cleanValue)) {
                 const { error: err } = await supabase.from('opponents').insert({ name: cleanValue });
                 error = err;
                 if (!err) {
                     setOpponentOptions(prev => [...prev, cleanValue].sort((a,b)=>a.localeCompare(b)));
                     setCurrentProcess(prev => ({ ...prev, opponent: cleanValue }));
                 }
             }
             break;
        case 'author':
             if (!authorOptions.includes(cleanValue)) {
                 const { error: err } = await supabase.from('authors').insert({ name: cleanValue });
                 error = err;
                 if (!err) {
                     setAuthorOptions(prev => [...prev, cleanValue].sort((a,b)=>a.localeCompare(b)));
                     setCurrentProcess(prev => ({ ...prev, author: cleanValue } as any));
                 }
             }
             break;
        case 'location':
             if (!billingLocations.includes(cleanValue)) {
                 setBillingLocations(prev => [...prev, cleanValue].sort((a,b)=>a.localeCompare(b)));
                 setFormData(prev => ({ ...prev, billing_location: cleanValue }));
             }
             break;
        case 'client':
             if (!clientOptions.includes(cleanValue)) {
                 const { error: err } = await supabase.from('clients').insert({ name: cleanValue });
                 error = err;
                 if (!err) {
                     setClientOptions(prev => [...prev, cleanValue].sort((a,b)=>a.localeCompare(b)));
                     setFormData(prev => ({ ...prev, client_name: cleanValue }));
                 }
             }
             break;
      }

      if (error) {
          alert("Erro ao salvar: " + error.message);
          return false;
      }
      return true;
  };

  const handleGenericEdit = async (oldValue: string, newValue: string) => {
        const cleanOld = oldValue;
        const cleanNew = toTitleCase(newValue.trim());
        if (!cleanNew || cleanNew === cleanOld) return false;

        let error = null;

        switch(activeManager) {
            case 'area':
                setLegalAreas(prev => prev.map(i => i === cleanOld ? cleanNew : i).sort((a,b)=>a.localeCompare(b)));
                if(formData.area === cleanOld) setFormData(prev => ({...prev, area: cleanNew}));
                break;
            case 'position':
                const { error: errPos } = await supabase.from('process_positions').update({ name: cleanNew }).eq('name', cleanOld);
                error = errPos;
                if (!errPos) {
                    setPositionsList(prev => prev.map(i => i === cleanOld ? cleanNew : i).sort((a,b)=>a.localeCompare(b)));
                    if(currentProcess.position === cleanOld) setCurrentProcess(prev => ({...prev, position: cleanNew}));
                }
                break;
            case 'court':
                const { error: errCrt } = await supabase.from('courts').update({ name: cleanNew.toUpperCase() }).eq('name', cleanOld);
                error = errCrt;
                if (!errCrt) {
                    setCourtOptions(prev => prev.map(i => i === cleanOld ? cleanNew.toUpperCase() : i).sort((a,b)=>a.localeCompare(b)));
                    if(currentProcess.court === cleanOld) setCurrentProcess(prev => ({...prev, court: cleanNew.toUpperCase()}));
                }
                break;
            case 'vara':
                const { error: errVar } = await supabase.from('process_varas').update({ name: cleanNew }).eq('name', cleanOld);
                if (errVar) console.warn("Erro ao atualizar vara (banco):", errVar);
                setVaraOptions(prev => prev.map(i => i === cleanOld ? cleanNew : i).sort((a,b)=>a.localeCompare(b)));
                if(currentProcess.vara === cleanOld) setCurrentProcess(prev => ({...prev, vara: cleanNew}));
                break;
            case 'comarca':
                const { error: errCom } = await supabase.from('comarcas').update({ name: cleanNew }).eq('name', cleanOld).eq('uf', currentProcess.uf);
                error = errCom;
                if (!errCom) {
                    setComarcaOptions(prev => prev.map(i => i === cleanOld ? cleanNew : i).sort((a,b)=>a.localeCompare(b)));
                    if(currentProcess.comarca === cleanOld) setCurrentProcess(prev => ({...prev, comarca: cleanNew}));
                }
                break;
            case 'class':
                const { error: errCls } = await supabase.from('process_classes').update({ name: cleanNew }).eq('name', cleanOld);
                error = errCls;
                if (!errCls) {
                    setClassOptions(prev => prev.map(i => i === cleanOld ? cleanNew : i).sort((a,b)=>a.localeCompare(b)));
                    if(currentProcess.process_class === cleanOld) setCurrentProcess(prev => ({...prev, process_class: cleanNew}));
                }
                break;
            case 'subject':
                const { error: errSub } = await supabase.from('process_subjects').update({ name: cleanNew }).eq('name', cleanOld);
                error = errSub;
                if (!errSub) {
                    setSubjectOptions(prev => prev.map(i => i === cleanOld ? cleanNew : i).sort((a,b)=>a.localeCompare(b)));
                }
                break;
            case 'justice':
                const { error: errJus } = await supabase.from('process_justice_types').update({ name: cleanNew }).eq('name', cleanOld);
                if (errJus) console.warn("Erro ao atualizar justiça (banco):", errJus);
                setJusticeOptions(prev => prev.map(i => i === cleanOld ? cleanNew : i).sort((a,b)=>a.localeCompare(b)));
                if(currentProcess.justice_type === cleanOld) setCurrentProcess(prev => ({...prev, justice_type: cleanNew}));
                break;
            case 'magistrate':
                const { error: errMag } = await supabase.from('magistrates').update({ name: cleanNew }).eq('name', cleanOld);
                error = errMag;
                if (!errMag) {
                    setMagistrateOptions(prev => prev.map(i => i === cleanOld ? cleanNew : i).sort((a,b)=>a.localeCompare(b)));
                }
                break;
            case 'opponent':
                const { error: errOpp } = await supabase.from('opponents').update({ name: cleanNew }).eq('name', cleanOld);
                error = errOpp;
                if (!errOpp) {
                    setOpponentOptions(prev => prev.map(i => i === cleanOld ? cleanNew : i).sort((a,b)=>a.localeCompare(b)));
                    if(currentProcess.opponent === cleanOld) setCurrentProcess(prev => ({...prev, opponent: cleanNew}));
                }
                break;
            case 'author':
                const { error: errAuth } = await supabase.from('authors').update({ name: cleanNew }).eq('name', cleanOld);
                error = errAuth;
                if (!errAuth) {
                    setAuthorOptions(prev => prev.map(i => i === cleanOld ? cleanNew : i).sort((a,b)=>a.localeCompare(b)));
                    if((currentProcess as any).author === cleanOld) setCurrentProcess(prev => ({...prev, author: cleanNew} as any));
                }
                break;
            case 'location':
                setBillingLocations(prev => prev.map(i => i === cleanOld ? cleanNew : i).sort((a,b)=>a.localeCompare(b)));
                if(formData.billing_location === cleanOld) setFormData(prev => ({...prev, billing_location: cleanNew}));
                break;
            case 'client':
                const { error: errCli } = await supabase.from('clients').update({ name: cleanNew }).eq('name', cleanOld);
                error = errCli;
                if(!errCli) {
                    setClientOptions(prev => prev.map(i => i === cleanOld ? cleanNew : i).sort((a,b)=>a.localeCompare(b)));
                    if(formData.client_name === cleanOld) setFormData(prev => ({...prev, client_name: cleanNew}));
                }
                break;
        }

        if (error) {
            alert("Erro ao editar: " + error.message);
            return false;
        }
        return true;
  };

  const handleGenericRemove = (value: string) => {
      // Implementação visual de remoção (a maioria não deleta do banco para integridade)
      switch(activeManager) {
          case 'area': setLegalAreas(prev => prev.filter(i => i !== value)); break;
          case 'location': setBillingLocations(prev => prev.filter(i => i !== value)); break;
          // Para itens de banco, apenas removemos da lista visual nesta sessão
          case 'position': setPositionsList(prev => prev.filter(i => i !== value)); break;
          case 'court': setCourtOptions(prev => prev.filter(i => i !== value)); break;
          case 'vara': setVaraOptions(prev => prev.filter(i => i !== value)); break;
          case 'comarca': setComarcaOptions(prev => prev.filter(i => i !== value)); break;
          case 'class': setClassOptions(prev => prev.filter(i => i !== value)); break;
          case 'subject': setSubjectOptions(prev => prev.filter(i => i !== value)); break;
          case 'justice': setJusticeOptions(prev => prev.filter(i => i !== value)); break;
          case 'magistrate': setMagistrateOptions(prev => prev.filter(i => i !== value)); break;
          case 'opponent': setOpponentOptions(prev => prev.filter(i => i !== value)); break;
          case 'author': setAuthorOptions(prev => prev.filter(i => i !== value)); break;
          case 'client': setClientOptions(prev => prev.filter(i => i !== value)); break;
      }
  };

  const addSubjectToProcess = () => {
    if (!newSubject.trim()) return;
    const cleanSubject = toTitleCase(newSubject.trim());
    const currentSubjects = currentProcess.subject ? currentProcess.subject.split(';').map(s => s.trim()).filter(s => s !== '') : [];
    
    if (!currentSubjects.includes(cleanSubject)) {
        const updatedSubjects = [...currentSubjects, cleanSubject];
        setCurrentProcess(prev => ({ ...prev, subject: updatedSubjects.join('; ') }));
    }
    setNewSubject('');
  };

  const removeSubject = (subjectToRemove: string) => {
    if (!currentProcess.subject) return;
    const currentSubjects = currentProcess.subject.split(';').map(s => s.trim()).filter(s => s !== '');
    const updatedSubjects = currentSubjects.filter(s => s !== subjectToRemove);
    setCurrentProcess(prev => ({ ...prev, subject: updatedSubjects.join('; ') }));
  };

  const generateFinancialInstallments = async (contractId: string, sourceData = formData) => {
    if (sourceData.status !== 'active') return;
    const { error: deleteError } = await supabase.from('financial_installments').delete().eq('contract_id', contractId).eq('status', 'pending');
    if (deleteError) console.error("Erro ao limpar parcelas pendentes:", deleteError);
    
    const installmentsToInsert: any[] = [];
    
    const addInstallments = (totalValueStr: string | undefined, installmentsStr: string | undefined, type: string, clause?: string) => {
      const totalValue = safeParseFloat(totalValueStr);
      if (totalValue <= 0) return;
      
      // Força garantia de valor numérico válido ANTES de qualquer processamento
      const numInstallments = (() => {
        if (!installmentsStr) return 1;
        const cleanStr = String(installmentsStr).replace(/[^0-9]/g, '');
        const parsed = parseInt(cleanStr, 10);
        return (parsed > 0) ? parsed : 1;
      })();
      
      const rawAmount = totalValue / numInstallments;
      // Arredondar para 2 casas decimais para evitar erros de inserção no banco (ex: dízimas)
      const amountPerInstallment = parseFloat(rawAmount.toFixed(2));

      for (let i = 1; i <= numInstallments; i++) {
        installmentsToInsert.push({ 
            contract_id: contractId, 
            type: type, 
            installment_number: i, 
            total_installments: numInstallments, 
            amount: amountPerInstallment, 
            status: 'pending', 
            due_date: addMonths(new Date(), i).toISOString(),
            clause: clause || null
        });
      }
    };

    // Main values com cláusulas
    addInstallments(sourceData.pro_labore, sourceData.pro_labore_installments, 'pro_labore', (sourceData as any).pro_labore_clause);
    addInstallments(sourceData.final_success_fee, sourceData.final_success_fee_installments, 'final_success_fee', (sourceData as any).final_success_fee_clause);
    addInstallments(sourceData.fixed_monthly_fee, sourceData.fixed_monthly_fee_installments, 'fixed', (sourceData as any).fixed_monthly_fee_clause);
    addInstallments(sourceData.other_fees, sourceData.other_fees_installments, 'other', (sourceData as any).other_fees_clause);

    // Helper para processar extras com parcelamento individual
    const addExtraInstallments = (
        values: string[], 
        clauses: string[], 
        installments: string[], 
        type: string
    ) => {
        values.forEach((fee, idx) => {
            const val = safeParseFloat(fee);
            if (val <= 0) return;

            const instStr = installments[idx] || '1x';
            const cleanStr = String(instStr).replace(/[^0-9]/g, '');
            const numInst = parseInt(cleanStr || '1', 10);
            const clause = clauses[idx];
            
            const amountPer = parseFloat((val / numInst).toFixed(2));

            for(let i=1; i<=numInst; i++) {
                installmentsToInsert.push({ 
                    contract_id: contractId, 
                    type: type, 
                    installment_number: i, 
                    total_installments: numInst, 
                    amount: amountPer, 
                    status: 'pending', 
                    due_date: addMonths(new Date(), i).toISOString(), 
                    clause: clause || null 
                });
            }
        });
    };

    // Intermediate Fees Logic (Updated with Clauses and Array Check)
    if (sourceData.intermediate_fees && sourceData.intermediate_fees.length > 0) {
      const clausesList = ensureArray((sourceData as any).intermediate_fees_clauses);
      const installmentsList = ensureArray((sourceData as any).intermediate_fees_installments);
      addExtraInstallments(sourceData.intermediate_fees, clausesList, installmentsList, 'intermediate_fee');
    }

    // Pro Labore Extras
    if ((sourceData as any).pro_labore_extras && (sourceData as any).pro_labore_extras.length > 0) {
        const clausesList = ensureArray((sourceData as any).pro_labore_extras_clauses);
        const installmentsList = ensureArray((sourceData as any).pro_labore_extras_installments);
        addExtraInstallments((sourceData as any).pro_labore_extras, clausesList, installmentsList, 'pro_labore');
    }

    // Final Success Extras
    if ((sourceData as any).final_success_extras && (sourceData as any).final_success_extras.length > 0) {
        const clausesList = ensureArray((sourceData as any).final_success_extras_clauses);
        const installmentsList = ensureArray((sourceData as any).final_success_extras_installments);
        addExtraInstallments((sourceData as any).final_success_extras, clausesList, installmentsList, 'final_success_fee');
    }

    // Other Fees Extras
    if ((sourceData as any).other_fees_extras && (sourceData as any).other_fees_extras.length > 0) {
        const clausesList = ensureArray((sourceData as any).other_fees_extras_clauses);
        const installmentsList = ensureArray((sourceData as any).other_fees_extras_installments);
        addExtraInstallments((sourceData as any).other_fees_extras, clausesList, installmentsList, 'other');
    }

    // Fixed Monthly Extras
    if ((sourceData as any).fixed_monthly_extras && (sourceData as any).fixed_monthly_extras.length > 0) {
        const clausesList = ensureArray((sourceData as any).fixed_monthly_extras_clauses);
        const installmentsList = ensureArray((sourceData as any).fixed_monthly_extras_installments);
        addExtraInstallments((sourceData as any).fixed_monthly_extras, clausesList, installmentsList, 'fixed');
    }

    if (installmentsToInsert.length > 0) {
        const { error: insertError } = await supabase.from('financial_installments').insert(installmentsToInsert);
        if (insertError) console.error("Erro ao gerar parcelas financeiras:", insertError);
    }
  };

  const forceUpdateFinancials = async (contractId: string, sourceData = formData) => {
    const cleanPL = safeParseFloat(sourceData.pro_labore || "");
    const cleanSuccess = safeParseFloat(sourceData.final_success_fee || "");
    const cleanFixed = safeParseFloat(sourceData.fixed_monthly_fee || "");
    const cleanOther = safeParseFloat(sourceData.other_fees || "");

    await supabase.from('contracts').update({
      pro_labore: cleanPL,
      final_success_fee: cleanSuccess,
      fixed_monthly_fee: cleanFixed,
      other_fees: cleanOther,
      
      // GARANTINDO QUE AS PARCELAS SEJAM SALVAS EXPLICITAMENTE
      pro_labore_installments: (sourceData as any).pro_labore_installments,
      final_success_fee_installments: (sourceData as any).final_success_fee_installments,
      fixed_monthly_fee_installments: (sourceData as any).fixed_monthly_fee_installments,
      other_fees_installments: (sourceData as any).other_fees_installments,

      // Garantindo que os extras também sejam salvos
      pro_labore_extras: (sourceData as any).pro_labore_extras,
      final_success_extras: (sourceData as any).final_success_extras,
      fixed_monthly_extras: (sourceData as any).fixed_monthly_extras,
      other_fees_extras: (sourceData as any).other_fees_extras,
      // Salvar timesheet se existir
      timesheet: (sourceData as any).timesheet,
      
      // Salvar as cláusulas principais
      pro_labore_clause: (sourceData as any).pro_labore_clause,
      final_success_fee_clause: (sourceData as any).final_success_fee_clause,
      fixed_monthly_fee_clause: (sourceData as any).fixed_monthly_fee_clause,
      other_fees_clause: (sourceData as any).other_fees_clause,

      // Salvar arrays de cláusulas extras (com ensureArray para limpar strings)
      pro_labore_extras_clauses: ensureArray((sourceData as any).pro_labore_extras_clauses),
      final_success_extras_clauses: ensureArray((sourceData as any).final_success_extras_clauses),
      fixed_monthly_extras_clauses: ensureArray((sourceData as any).fixed_monthly_extras_clauses),
      other_fees_extras_clauses: ensureArray((sourceData as any).other_fees_extras_clauses),
      intermediate_fees_clauses: ensureArray((sourceData as any).intermediate_fees_clauses),
      
      // Salvar arrays de parcelas dos extras
      pro_labore_extras_installments: ensureArray((sourceData as any).pro_labore_extras_installments),
      final_success_extras_installments: ensureArray((sourceData as any).final_success_extras_installments),
      fixed_monthly_extras_installments: ensureArray((sourceData as any).fixed_monthly_extras_installments),
      other_fees_extras_installments: ensureArray((sourceData as any).other_fees_extras_installments),
      intermediate_fees_installments: ensureArray((sourceData as any).intermediate_fees_installments),

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
      if (formData.physical_signature === undefined || formData.physical_signature === null) return alert('Informe se "Possui Assinatura Física" para Contratos Fechados.');
    }

    setLocalLoading(true);
    try {
        const clientId = await upsertClient();
        if (!clientId) {
            throw new Error("Falha ao salvar dados do cliente (CNPJ Duplicado ou Inválido).");
        }
        
        const contractPayload: any = {
            ...formData,
            client_id: clientId,
            pro_labore: safeParseFloat(formData.pro_labore),
            final_success_fee: safeParseFloat(formData.final_success_fee),
            fixed_monthly_fee: safeParseFloat(formData.fixed_monthly_fee),
            other_fees: safeParseFloat(formData.other_fees),
            
            // Garantindo que os arrays extras sejam salvos
            pro_labore_extras: (formData as any).pro_labore_extras,
            final_success_extras: (formData as any).final_success_extras,
            fixed_monthly_extras: (formData as any).fixed_monthly_extras,
            other_fees_extras: (formData as any).other_fees_extras,
            timesheet: (formData as any).timesheet,

            // Salvar cláusulas no payload
            pro_labore_clause: (formData as any).pro_labore_clause,
            final_success_fee_clause: (formData as any).final_success_fee_clause,
            fixed_monthly_fee_clause: (formData as any).fixed_monthly_fee_clause,
            other_fees_clause: (formData as any).other_fees_clause,
            
            // Salvar arrays de cláusulas (Limpando sujeira)
            pro_labore_extras_clauses: ensureArray((formData as any).pro_labore_extras_clauses),
            final_success_extras_clauses: ensureArray((formData as any).final_success_extras_clauses),
            fixed_monthly_extras_clauses: ensureArray((formData as any).fixed_monthly_extras_clauses),
            other_fees_extras_clauses: ensureArray((formData as any).other_fees_extras_clauses),
            intermediate_fees_clauses: ensureArray((formData as any).intermediate_fees_clauses),

            // Salvar arrays de parcelas dos extras
            pro_labore_extras_installments: ensureArray((formData as any).pro_labore_extras_installments),
            final_success_extras_installments: ensureArray((formData as any).final_success_extras_installments),
            fixed_monthly_extras_installments: ensureArray((formData as any).fixed_monthly_extras_installments),
            other_fees_extras_installments: ensureArray((formData as any).other_fees_extras_installments),
            intermediate_fees_installments: ensureArray((formData as any).intermediate_fees_installments),
            
            // Campos de relacionamento/UI a serem ignorados
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
            display_id: undefined, 
        };

        // LÓGICA DE SNAPSHOT (PROPOSTA -> ATIVO)
        const isProposalToActive = formData.status === 'active' && initialFormData && initialFormData.status === 'proposal';

        if (isProposalToActive) {
            const snapshot = {
                pro_labore: initialFormData.pro_labore,
                final_success_fee: initialFormData.final_success_fee,
                fixed_monthly_fee: initialFormData.fixed_monthly_fee,
                other_fees: initialFormData.other_fees,
                pro_labore_extras: (initialFormData as any).pro_labore_extras,
                final_success_extras: (initialFormData as any).final_success_extras,
                fixed_monthly_extras: (initialFormData as any).fixed_monthly_extras,
                other_fees_extras: (initialFormData as any).other_fees_extras,
                proposal_date: initialFormData.proposal_date,
                saved_at: new Date().toISOString()
            };
            contractPayload.proposal_snapshot = snapshot;
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
            
            // Salvar processos
            if (processes.length > 0) {
                await supabase.from('contract_processes').delete().eq('contract_id', savedId);
                const processesToInsert = processes.map(p => ({ ...p, contract_id: savedId }));
                await supabase.from('contract_processes').insert(processesToInsert);
            }
            
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
            alert('⚠️ Duplicidade de Caso Detectada\n\nJá existe um contrato cadastrado com este Número HON.');
        } else if (error.code === 'PGRST204') {
             console.warn('Erro de estrutura de dados:', error.message);
             const column = error.message.match(/'([^']+)'/)?.[1];
             alert(`Erro Técnico: Tentativa de salvar campo inválido (${column}).\n\nSOLUÇÃO: Rode o SQL fornecido no Supabase para criar as colunas que faltam.`);
        } else {
            alert(`Não foi possível salvar as alterações.\n\n${error.message}`);
        }
    } finally {
        setLocalLoading(false);
    }
  };

  const handleCNPJSearch = async () => {
    if (!formData.cnpj || formData.has_no_cnpj) return;
    
    // CORREÇÃO AQUI: Garantindo que seja string
    const cnpjLimpo = (formData.cnpj || '').replace(/\D/g, '');
    
    if (cnpjLimpo.length !== 14) {
      alert('CNPJ inválido. Digite 14 dígitos.');
      return;
    }

    setLocalLoading(true);
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);
      
      if (!response.ok) throw new Error('CNPJ não encontrado na Receita Federal');
      
      const data = await response.json();
      
      setFormData(prev => ({
        ...prev,
        client_name: toTitleCase(data.razao_social || data.nome_fantasia || ''),
        uf: data.uf || prev.uf
      }));

      setClientExtraData({
        address: toTitleCase(data.logradouro || ''),
        number: data.numero || '',
        complement: toTitleCase(data.complemento || ''),
        city: toTitleCase(data.municipio || ''),
        email: data.email || '',
        is_person: false
      });

      const { data: existingClient } = await supabase
        .from('clients')
        .select('id, name')
        .eq('cnpj', cnpjLimpo)
        .single();

      if (existingClient) {
        setFormData(prev => ({ ...prev, client_id: existingClient.id }));
      }

    } catch (error: any) {
      console.error('Erro ao buscar CNPJ:', error);
      alert(`❌ ${error.message}\n\n💡 Você pode preencher manualmente.`);
    } finally {
      setLocalLoading(false);
    }
  };

  const handlePartyCNPJSearch = async (type: 'author' | 'opponent') => {
    const cnpj = type === 'author' ? (currentProcess as any).author_cnpj : (currentProcess as any).opponent_cnpj;
    if (!cnpj) return;
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    if (cleanCNPJ.length !== 14) {
        alert('CNPJ inválido. Digite 14 dígitos.');
        return;
    }

    setLocalLoading(true);
    try {
        const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCNPJ}`);
        if (!response.ok) throw new Error('CNPJ não encontrado.');
        const data = await response.json();
        const name = toTitleCase(data.razao_social || data.nome_fantasia || '');

        if (type === 'author') {
              setCurrentProcess(prev => ({ ...prev, author: name } as any));
        } else {
              setCurrentProcess(prev => ({ ...prev, opponent: name }));
        }
    } catch (error: any) {
        alert(`Erro ao buscar CNPJ: ${error.message}`);
    } finally {
        setLocalLoading(false);
    }
  };

  const handleCNJSearch = async () => {
    if (!currentProcess.process_number) return;
    
    const numeroLimpo = currentProcess.process_number.replace(/\D/g, '');
    if (numeroLimpo.length !== 20) {
      alert('Número de processo inválido. Deve ter 20 dígitos.');
      return;
    }

    setSearchingCNJ(true);
    try {
      const decoded = decodeCNJ(numeroLimpo);
      if (!decoded) {
        throw new Error('Não foi possível decodificar o número do processo');
      }
      
      const uf = decoded.tribunal === 'STF' ? 'DF' : decoded.uf;
      
      // Tenta adicionar o tribunal à lista local e ao banco se não existir
      if (!courtOptions.includes(decoded.tribunal)) {
          // Tenta inserir no Supabase (silenciosamente se falhar/já existir)
          await supabase.from('courts').insert({ name: decoded.tribunal }).select();
          setCourtOptions([...courtOptions, decoded.tribunal].sort((a,b)=>a.localeCompare(b)));
      }
      
      setCurrentProcess(prev => ({ ...prev, court: decoded.tribunal, uf: uf })); // Atualiza UF do processo também
    } catch (error: any) {
      alert(`❌ Erro ao decodificar CNJ: ${error.message}`);
    } finally {
      setSearchingCNJ(false);
    }
  };

  const handleOpenJusbrasil = () => {
    if (currentProcess.process_number) {
      const numero = currentProcess.process_number.replace(/\D/g, '');
      window.open(`https://www.jusbrasil.com.br/processos/numero/${numero}`, '_blank');
    }
  };
    
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!formData.id) {
      alert("⚠️ Você precisa salvar o contrato pelo menos uma vez antes de anexar arquivos.");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const sanitizedFileName = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
      const filePath = `${formData.id}/${Date.now()}_${sanitizedFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('contract-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: docData, error: dbError } = await supabase
        .from('contract_documents')
        .insert({
          contract_id: formData.id,
          file_name: file.name,
          file_path: filePath,
          file_type: type,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      if (docData) {
          setDocuments(prev => [docData, ...prev]);
      }

    } catch (error: any) {
      console.error("Upload error:", error);
      alert("Erro ao anexar arquivo: " + error.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDownload = async (path: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('contract-documents')
        .download(path);
        
      if (error) throw error;
      
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      const fileName = path.split('_').slice(1).join('_') || 'documento.pdf';
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Download error:", error);
      alert("Erro ao baixar arquivo: " + error.message);
    }
  };

  const handleDeleteDocument = async (id: string, path: string) => {
    if (!confirm("Tem certeza que deseja excluir este documento?")) return;

    try {
      const { error: storageError } = await supabase.storage
        .from('contract-documents')
        .remove([path]);

      if (storageError) {
          console.warn("Aviso: Erro ao remover do storage (pode já ter sido deletado)", storageError);
      }

      const { error: dbError } = await supabase
        .from('contract_documents')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      setDocuments(prev => prev.filter(d => d.id !== id));

    } catch (error: any) {
      console.error("Delete error:", error);
      alert("Erro ao excluir documento: " + error.message);
    }
  };

  const handleTextChange = (field: keyof Contract, value: string) => { setFormData({ ...formData, [field]: toTitleCase(value) }); };

  const handleClientChange = async (name: string) => {
    const newName = toTitleCase(name);
    setFormData(prev => ({ ...prev, client_name: newName }));
    
    if (!newName) return;

    // Busca automática do CNPJ
    const { data } = await supabase
        .from('clients')
        .select('cnpj, id')
        .eq('name', newName)
        .single();
    
    if (data && data.cnpj) {
        setFormData(prev => ({
            ...prev,
            client_name: newName,
            client_id: data.id,
            cnpj: maskCNPJ(data.cnpj)
        }));
    }
  };

  // PREPENDED SELECIONE OPTION TO ALL GENERATED OPTIONS
  const partnerSelectOptions = [{ label: 'Selecione', value: '' }, ...partners.map(p => ({ label: p.name, value: p.id }))];
  const analystSelectOptions = [{ label: 'Selecione', value: '' }, ...(analysts ? analysts.map(a => ({ label: a.name, value: a.id })) : [])];
  const ufOptions = [{ label: 'Selecione', value: '' }, ...UFS.map(uf => ({ label: uf.nome, value: uf.sigla }))];
  const billingOptions = [{ label: 'Selecione', value: '' }, ...billingLocations.map(l => ({ label: l, value: l }))];
  const signatureOptions = [{ label: 'Selecione', value: '' }, { label: 'Sim', value: 'true' }, { label: 'Não (Cobrar)', value: 'false' }];
  const rejectionByOptions = [{ label: 'Selecione', value: '' }, { label: 'Cliente', value: 'Cliente' }, { label: 'Escritório', value: 'Escritório' }];
  const rejectionReasonOptions = [{ label: 'Selecione', value: '' }, { label: 'Cliente declinou', value: 'Cliente declinou' }, { label: 'Cliente não retornou', value: 'Cliente não retornou' }, { label: 'Caso ruim', value: 'Caso ruim' }, { label: 'Conflito de interesses', value: 'Conflito de interesses' }];
  const areaOptions = [{ label: 'Selecione', value: '' }, ...legalAreas.map(a => ({ label: a, value: a }))];
  const positionOptions = [{ label: 'Selecione', value: '' }, ...positionsList.map(p => ({ label: p, value: p }))];
  const magistrateTypes = [{ label: 'Selecione', value: '' }, { label: 'Juiz', value: 'Juiz' }, { label: 'Desembargador', value: 'Desembargador' }, { label: 'Ministro', value: 'Ministro' }];
    
  // Opções formatadas para CustomSelect
  const justiceSelectOptions = [{ label: 'Selecione', value: '' }, ...justiceOptions.map(j => ({ label: j, value: j }))];
  const varaSelectOptions = [{ label: 'Selecione', value: '' }, ...[...varaOptions].sort((a, b) => a.localeCompare(b)).map(v => ({ label: v, value: v }))];
  const courtSelectOptions = [{ label: 'Selecione', value: '' }, ...courtOptions.map(c => ({ label: c, value: c }))];
  const comarcaSelectOptions = [{ label: 'Selecione', value: '' }, ...comarcaOptions.map(c => ({ label: c, value: c }))];
  const classSelectOptions = [{ label: 'Selecione', value: '' }, ...classOptions.map(c => ({ label: c, value: c }))];
  const subjectSelectOptions = [{ label: 'Selecione', value: '' }, ...subjectOptions.map(s => ({ label: s, value: s }))];
  
  // Opções de Clientes
  const clientSelectOptions = [{ label: 'Selecione', value: '' }, ...clientOptions.map(c => ({ label: c, value: c }))];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[50] p-4 overflow-y-auto">
      <div className={`w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[95vh] animate-in fade-in zoom-in duration-200 transition-colors duration-500 ease-in-out ${getThemeBackground(formData.status)}`}>
        {/* Header */}
        <div className="p-6 border-b border-black/5 flex justify-between items-center bg-white/50 backdrop-blur-sm rounded-t-2xl">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-800">{isEditing ? 'Editar Caso' : 'Novo Caso'}</h2>
            {(formData as any).display_id && (
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-sm font-mono font-bold border border-gray-200">
                    ID: {(formData as any).display_id}
                </span>
            )}
          </div>
          <button onClick={onClose}><X className="w-6 h-6 text-gray-400" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
            
           {/* Componente Modularizado de Status, Datas e Financeiro */}
           <StatusAndDatesSection
             formData={formData}
             setFormData={setFormData}
             statusOptions={statusOptions}
             handleCreateStatus={handleCreateStatus}
             ensureDateValue={ensureDateValue}
             analystSelectOptions={analystSelectOptions}
             onOpenAnalystManager={onOpenAnalystManager}
             rejectionByOptions={rejectionByOptions}
             rejectionReasonOptions={rejectionReasonOptions}
             partnerSelectOptions={partnerSelectOptions}
             billingOptions={billingOptions}
             maskHon={maskHon}
             setActiveManager={setActiveManager}
             signatureOptions={signatureOptions}
             formatForInput={formatForInput}
             handleAddToList={handleAddToList}
             removeExtra={removeExtra}
             newIntermediateFee={newIntermediateFee}
             setNewIntermediateFee={setNewIntermediateFee}
             interimInstallments={interimInstallments}
             setInterimInstallments={setInterimInstallments}
             handleAddIntermediateFee={handleAddIntermediateFee}
             interimClause={interimClause}
             setInterimClause={setInterimClause}
             handleRemoveIntermediateFee={handleRemoveIntermediateFee}
             ensureArray={ensureArray}
           />

          {/* Componente Modularizado de Dados do Cliente */}
          <ClientFormSection
             formData={formData}
             setFormData={setFormData}
             maskCNPJ={maskCNPJ}
             handleCNPJSearch={handleCNPJSearch}
             clientSelectOptions={clientSelectOptions}
             handleClientChange={handleClientChange}
             setActiveManager={setActiveManager}
             duplicateClientCases={duplicateClientCases}
             getStatusLabel={getStatusLabel}
             areaOptions={areaOptions}
             partnerSelectOptions={partnerSelectOptions}
             onOpenPartnerManager={onOpenPartnerManager}
          />

          {/* SESSÃO DE PROCESSOS (UI RICA DO SEGUNDO CODIGO) */}
          <section className="space-y-4 bg-white/60 p-5 rounded-xl border border-white/40 shadow-sm backdrop-blur-sm relative z-30">
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Processos Judiciais</h3>
                <div className="flex items-center gap-3">
                    <button 
                        type="button" 
                        onClick={() => {
                            setIsStandardCNJ(false);
                            setCurrentProcess({ ...currentProcess, process_number: 'CONSULTORIA', uf: currentProcess.uf || '' });
                            setOtherProcessType('');
                        }}
                        className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded border border-blue-100 hover:bg-blue-100 font-medium transition-colors"
                    >
                        Consultoria
                    </button>
                    <button 
                        type="button" 
                        onClick={() => {
                            setIsStandardCNJ(false);
                            setCurrentProcess({ ...currentProcess, process_number: 'ASSESSORIA JURÍDICA', uf: currentProcess.uf || '' });
                            setOtherProcessType('');
                        }}
                        className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded border border-blue-100 hover:bg-blue-100 font-medium transition-colors"
                    >
                        Assessoria Jurídica
                    </button>
                    <div className="flex items-center">
                        <input type="checkbox" id="no_process" checked={!formData.has_legal_process} onChange={(e) => setFormData({...formData, has_legal_process: !e.target.checked})} className="rounded text-salomao-blue" />
                        <label htmlFor="no_process" className="ml-2 text-xs text-gray-600">Caso sem processo judicial</label>
                    </div>
                </div>
            </div>
            {formData.has_legal_process && (
              <div className="space-y-4">
                <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                  {/* Linha 1: Numero, Tribunal, UF, Posição */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4 items-end">
                    <div className={isStandardCNJ ? "md:col-span-5" : "md:col-span-4"}>
                        <label className="text-[10px] text-gray-500 uppercase font-bold flex justify-between mb-1">
                            Número do Processo *
                            {currentProcess.process_number && currentProcess.process_number !== 'CONSULTORIA' && currentProcess.process_number !== 'ASSESSORIA JURÍDICA' && (<button onClick={handleOpenJusbrasil} className="text-[10px] text-blue-500 hover:underline flex items-center" title="Abrir no Jusbrasil"><LinkIcon className="w-3 h-3 mr-1" /> Ver Externo</button>)}
                        </label>
                        <div className="flex items-center">
                            <CustomSelect 
                                value={currentProcess.process_number === 'CONSULTORIA' || currentProcess.process_number === 'ASSESSORIA JURÍDICA' ? 'other' : (isStandardCNJ ? 'cnj' : 'other')}
                                onChange={(val: string) => {
                                    if (val === 'cnj') {
                                        setIsStandardCNJ(true);
                                        setCurrentProcess({ ...currentProcess, process_number: '' });
                                    } else {
                                        setIsStandardCNJ(false);
                                        if (currentProcess.process_number === 'CONSULTORIA' || currentProcess.process_number === 'ASSESSORIA JURÍDICA') setCurrentProcess({ ...currentProcess, process_number: '' });
                                    }
                                }}
                                options={[
                                    { label: 'CNJ', value: 'cnj' },
                                    { label: 'Outro', value: 'other' }
                                ]}
                                className="mr-2 w-28"
                            />
                            
                            {currentProcess.process_number !== 'CONSULTORIA' && currentProcess.process_number !== 'ASSESSORIA JURÍDICA' && (
                              <div className="flex-1 relative">
                                  <input 
                                      type="text" 
                                      className={`w-full border-b ${duplicateProcessWarning ? 'border-orange-300 bg-orange-50' : 'border-gray-300'} focus:border-salomao-blue outline-none py-1.5 text-sm font-mono pr-8`} 
                                      placeholder={isStandardCNJ ? "0000000-00..." : "Nº Processo"} 
                                      value={currentProcess.process_number} 
                                      onChange={(e) => setCurrentProcess({
                                          ...currentProcess, 
                                          process_number: isStandardCNJ ? localMaskCNJ(e.target.value) : e.target.value
                                      })} 
                                  />
                                  <button 
                                      onClick={handleCNJSearch} 
                                      disabled={!isStandardCNJ || searchingCNJ || !currentProcess.process_number} 
                                      className="absolute right-0 top-1/2 -translate-y-1/2 text-salomao-blue hover:text-salomao-gold disabled:opacity-30 disabled:cursor-not-allowed transition-colors" 
                                      title={isStandardCNJ ? "Identificar Tribunal e UF (Apenas CNJ)" : "Busca automática indisponível para este formato"}
                                  >
                                                  {searchingCNJ ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                  </button>
                              </div>
                            )}
                            {(currentProcess.process_number === 'CONSULTORIA' || currentProcess.process_number === 'ASSESSORIA JURÍDICA') && (
                               <div className="flex-1">
                                  <input type="text" disabled value={currentProcess.process_number} className="w-full border-b border-gray-200 bg-gray-50 text-gray-500 py-1.5 text-sm font-bold" />
                               </div>
                            )}
                        </div>
                        {duplicateProcessWarning && (
                          <div className="text-[10px] text-orange-600 mt-1 flex items-center font-bold">
                             <AlertTriangle className="w-3 h-3 mr-1" /> Já cadastrado em outro caso.
                          </div>
                        )}
                    </div>
                    
                    {/* Campo Extra para Tipo de Processo (se não for CNJ e nem Consultoria/Assessoria) */}
                    {!isStandardCNJ && currentProcess.process_number !== 'CONSULTORIA' && currentProcess.process_number !== 'ASSESSORIA JURÍDICA' && (
                        <div className="md:col-span-2">
                            <label className="text-[10px] text-gray-500 uppercase font-bold">Tipo (ex: AgInt)</label>
                            <input 
                                type="text" 
                                className="w-full border-b border-gray-300 focus:border-salomao-blue outline-none py-1.5 text-sm" 
                                value={otherProcessType} 
                                onChange={(e) => {
                                    setOtherProcessType(e.target.value);
                                }} 
                            />
                        </div>
                    )}
                    
                    {/* TRIBUNAL como CustomSelect */}
                    <div className="md:col-span-2">
                        <CustomSelect 
                            label="Tribunal *" 
                            value={currentProcess.court || ''} 
                            onChange={(val: string) => setCurrentProcess({...currentProcess, court: val})} 
                            options={courtSelectOptions} 
                            onAction={() => setActiveManager('court')}
                            actionLabel="Gerenciar Tribunais"
                            actionIcon={Settings}
                            placeholder="Selecione"
                            className="custom-select-small" 
                        />
                    </div>
                    <div className="md:col-span-2"><CustomSelect label="Estado (UF) *" value={currentProcess.uf || ''} onChange={(val: string) => setCurrentProcess({...currentProcess, uf: val})} options={ufOptions} placeholder="UF" className="custom-select-small" /></div>
                    <div className={isStandardCNJ ? "md:col-span-3" : "md:col-span-2"}><CustomSelect label="Posição do Cliente" value={currentProcess.position || formData.client_position || ''} onChange={(val: string) => setCurrentProcess({...currentProcess, position: val})} options={positionOptions} className="custom-select-small" onAction={() => setActiveManager('position')} actionLabel="Gerenciar Posições" actionIcon={Settings} /></div>
                  </div>

                  {/* Linha 2: Partes (Autor e Contrário) com CNPJ */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
                    {/* CNPJ Autor */}
                    <div className="md:col-span-2">
                        <label className="text-[10px] text-gray-500 uppercase font-bold">CNPJ</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                className="w-full border-b border-gray-300 focus:border-salomao-blue outline-none py-1.5 text-sm"
                                value={(currentProcess as any).author_cnpj || ''}
                                onChange={(e) => setCurrentProcess({ ...currentProcess, author_cnpj: maskCNPJ(e.target.value) } as any)}
                            />
                            <button 
                                onClick={() => handlePartyCNPJSearch('author')}
                                className="absolute right-0 top-1/2 -translate-y-1/2 text-salomao-blue hover:text-salomao-gold"
                            >
                                <Search className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Autor */}
                    <div className="md:col-span-4">
                        <CustomSelect 
                            label="Autor" 
                            value={(currentProcess as any).author || ''} 
                            onChange={(val: string) => setCurrentProcess({...currentProcess, author: val} as any)} 
                            options={authorOptions.map(o => ({ label: o, value: o }))}
                            onAction={() => setActiveManager('author')}
                            actionLabel="Gerenciar Autores"
                            actionIcon={Settings}
                            placeholder="Selecione ou adicione"
                        />
                    </div>

                    {/* CNPJ Contrário */}
                    <div className="md:col-span-2">
                        <label className="text-[10px] text-gray-500 uppercase font-bold">CNPJ</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                className="w-full border-b border-gray-300 focus:border-salomao-blue outline-none py-1.5 text-sm"
                                value={(currentProcess as any).opponent_cnpj || ''}
                                onChange={(e) => setCurrentProcess({ ...currentProcess, opponent_cnpj: maskCNPJ(e.target.value) } as any)}
                            />
                            <button 
                                onClick={() => handlePartyCNPJSearch('opponent')}
                                className="absolute right-0 top-1/2 -translate-y-1/2 text-salomao-blue hover:text-salomao-gold"
                            >
                                <Search className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Contrário */}
                    <div className="md:col-span-4">
                        <CustomSelect 
                            label="Contrário (Parte Oposta) *" 
                            value={currentProcess.opponent || formData.company_name || ''} 
                            onChange={(val: string) => setCurrentProcess({...currentProcess, opponent: val})} 
                            options={opponentOptions.map(o => ({ label: o, value: o }))}
                            onAction={() => setActiveManager('opponent')}
                            actionLabel="Gerenciar Parte Oposta"
                            actionIcon={Settings}
                            placeholder="Selecione ou adicione"
                        />
                         {duplicateOpponentCases.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                                <span className="text-[10px] text-blue-600 font-bold mr-1">Similar:</span>
                                {duplicateOpponentCases.map(c => (
                                    <a key={c.contract_id} href={`/contracts/${c.contracts?.id}`} target="_blank" rel="noopener noreferrer" className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100 hover:bg-blue-100 truncate max-w-[150px]">
                                                    {c.contracts?.client_name}
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                  </div>

                  {/* Linha 3: Magistrado */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
                    <div className="md:col-span-12">
                        <label className="text-[10px] text-gray-500 uppercase font-bold">Magistrado</label>
                        <div className="flex gap-2">
                            <div className="w-40">
                                <CustomSelect 
                                    value={newMagistrateTitle} 
                                    onChange={(val: string) => setNewMagistrateTitle(val)} 
                                    options={magistrateTypes} 
                                />
                            </div>
                            <div className="flex-1">
                                <CustomSelect 
                                    value={newMagistrateName}
                                    onChange={(val: string) => setNewMagistrateName(val)}
                                    options={magistrateOptions.map(m => ({ label: m, value: m }))}
                                    placeholder="Selecione magistrado"
                                    onAction={() => setActiveManager('magistrate')}
                                    actionLabel="Gerenciar Magistrados"
                                    actionIcon={Settings}
                                />
                            </div>
                            <button onClick={() => addMagistrate(newMagistrateName)} className="text-salomao-blue hover:text-blue-700 font-bold px-2 rounded-lg bg-blue-50">+</button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {currentProcess.magistrates?.map((m, idx) => (
                                <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs flex items-center gap-1 border border-gray-200">
                                    <Gavel size={10} className="text-gray-400" />
                                    <b>{m.title}:</b> {m.name}
                                    <button onClick={() => removeMagistrate(idx)} className="ml-1 text-red-400 hover:text-red-600"><X size={10} /></button>
                                </span>
                            ))}
                        </div>
                    </div>
                  </div>

                  {/* Linha 4: Numeral | Vara | Comarca */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
                    <div className="md:col-span-3">
                        <CustomSelect 
                            label="Numeral" 
                            value={(currentProcess as any).numeral || ''} 
                            onChange={(val: string) => setCurrentProcess({...currentProcess, numeral: val} as any)} 
                            options={numeralOptions} 
                            placeholder="Nº"
                        />
                    </div>
                    {/* VARA COMO MENU SUSPENSO */}
                    <div className="md:col-span-5">
                        <CustomSelect 
                            label="Vara" 
                            value={currentProcess.vara || ''} 
                            onChange={(val: string) => setCurrentProcess({...currentProcess, vara: val})} 
                            options={varaSelectOptions}
                            onAction={() => setActiveManager('vara')}
                            actionLabel="Gerenciar Varas"
                            actionIcon={Settings}
                            placeholder="Selecione ou adicione"
                        />
                    </div>
                    {/* COMARCA COMO MENU SUSPENSO */}
                    <div className="md:col-span-4">
                        <CustomSelect 
                            label="Comarca" 
                            value={currentProcess.comarca || ''} 
                            onChange={(val: string) => setCurrentProcess({...currentProcess, comarca: val})} 
                            options={comarcaSelectOptions} 
                            onAction={() => setActiveManager('comarca')}
                            actionLabel="Gerenciar Comarcas"
                            actionIcon={Settings}
                            placeholder={currentProcess.uf ? "Selecione a Comarca" : "Selecione o Estado Primeiro"}
                            disabled={!currentProcess.uf}
                        />
                    </div>
                  </div>

                  {/* Linha 5: Data Distribuição, Justiça, Valor da Causa */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
                    <div className="md:col-span-3"><label className="text-[10px] text-gray-500 uppercase font-bold">Data da Distribuição</label><input type="date" className="w-full border-b border-gray-300 focus:border-salomao-blue outline-none py-1 text-sm bg-transparent" value={ensureDateValue(currentProcess.distribution_date)} onChange={(e) => setCurrentProcess({...currentProcess, distribution_date: e.target.value})} /></div>
                    <div className="md:col-span-4"><CustomSelect label="Justiça" value={currentProcess.justice_type || ''} onChange={(val: string) => setCurrentProcess({...currentProcess, justice_type: val})} options={justiceSelectOptions} onAction={() => setActiveManager('justice')} actionLabel="Gerenciar Justiças" actionIcon={Settings} /></div>
                    <div className="md:col-span-5"><label className="text-[10px] text-gray-500 uppercase font-bold">Valor da Causa (R$)</label><input type="text" className="w-full border-b border-gray-300 focus:border-salomao-blue outline-none py-1 text-sm" value={currentProcess.cause_value || ''} onChange={(e) => setCurrentProcess({...currentProcess, cause_value: maskMoney(e.target.value)})} /></div>
                  </div>

                  {/* Linha 6: Classe, Assunto */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* CLASSE COMO MENU SUSPENSO */}
                    <div>
                        <CustomSelect 
                            label="Classe" 
                            value={currentProcess.process_class || ''} 
                            onChange={(val: string) => setCurrentProcess({...currentProcess, process_class: val})} 
                            options={classSelectOptions}
                            onAction={() => setActiveManager('class')}
                            actionLabel="Gerenciar Classes"
                            actionIcon={Settings}
                            placeholder="Selecione a Classe"
                        />
                    </div>
                    
                    {/* ASSUNTO COM MENU SUSPENSO (ADAPTADO PARA INPUT/SELECT) */}
                    <div>
                        <label className="text-[10px] text-gray-500 uppercase font-bold">Assunto</label>
                        <div className="flex gap-2">
                             <div className="flex-1">
                                <CustomSelect 
                                    value={newSubject}
                                    onChange={(val: string) => setNewSubject(val)}
                                    options={subjectSelectOptions}
                                    placeholder="Selecione ou digite novo"
                                    onAction={() => setActiveManager('subject')}
                                    actionLabel="Gerenciar Assuntos"
                                    actionIcon={Settings}
                                />
                             </div>
                            <button onClick={addSubjectToProcess} className="text-salomao-blue hover:text-blue-700 font-bold px-3 rounded-lg bg-blue-50">+</button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {currentProcess.subject && currentProcess.subject.split(';').map(s => s.trim()).filter(s => s !== '').map((subj, idx) => (
                                <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs flex items-center gap-1 border border-gray-200">
                                    {subj}
                                    <button onClick={() => removeSubject(subj)} className="ml-1 text-red-400 hover:text-red-600"><X size={10} /></button>
                                </span>
                            ))}
                        </div>
                    </div>
                  </div>

                  {/* Botão de Ação */}
                  <div className="flex justify-end mt-4">
                        <button onClick={handleProcessAction} className="bg-salomao-blue text-white rounded px-4 py-2 hover:bg-blue-900 transition-colors flex items-center justify-center shadow-md text-sm font-bold w-full md:w-auto">
                            {editingProcessIndex !== null ? <><Check className="w-4 h-4 mr-2" /> Atualizar Processo</> : <><Plus className="w-4 h-4 mr-2" /> Adicionar Processo</>}
                        </button>
                  </div>
                </div>

                {/* Lista de Processos */}
                {processes.length > 0 && (
                  <div className="space-y-2 mt-4">
                    {processes.map((p, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:border-blue-200 transition-colors group">
                        <div className="grid grid-cols-3 gap-4 flex-1 text-xs">
                          {/* NÚMERO CLICÁVEL */}
                          <span 
                            onClick={() => { setViewProcess(p); setViewProcessIndex(idx); }} 
                            className="font-mono font-medium text-salomao-blue hover:underline cursor-pointer flex items-center"
                            title="Clique para ver detalhes do processo"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            {p.process_number}
                          </span>
                          <span className="text-gray-600">{p.court} ({p.uf})</span>
                          <span className="text-gray-500 truncate">{p.opponent}</span>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => editProcess(idx)} className="text-blue-500 hover:bg-blue-50 p-1 rounded"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => removeProcess(idx)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

           <section className="border-t border-black/5 pt-6">

            {/* SEÇÃO DE DOCUMENTOS E REFERÊNCIA (DO SEGUNDO CÓDIGO) */}
            {(formData.status === 'analysis' || formData.status === 'proposal' || formData.status === 'active') && (
              <>
                
                {/* Exibe Referência APENAS se NÃO for Análise */}
                {(formData.status === 'proposal' || formData.status === 'active') && (
                    <div className="mt-6 mb-2">
                        <label className="text-xs font-medium block mb-1">Referência</label>
                        <textarea 
                            className="w-full border border-gray-300 p-2.5 rounded-lg text-sm bg-white focus:border-salomao-blue outline-none h-24 resize-none" 
                            value={(formData as any).reference || ''} 
                            onChange={e => setFormData({...formData, reference: e.target.value} as any)} 
                            placeholder="Ex: Proposta 123/2025" 
                        />
                    </div>
                )}

                {/* Componente Modularizado de Documentos */}
                <ContractDocuments 
                    documents={documents} 
                    isEditing={isEditing} 
                    uploading={uploading} 
                    status={formData.status} 
                    onUpload={handleFileUpload} 
                    onDownload={handleDownload} 
                    onDelete={handleDeleteDocument} 
                />

              </>
            )}

            {/* OBSERVAÇÕES NO FINAL (MOVIDO ANTES DOS BOTOES) */}
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Observações Gerais</label><textarea className="w-full border border-gray-300 rounded-lg p-3 text-sm h-24 focus:border-salomao-blue outline-none bg-white" value={formData.observations} onChange={(e) => setFormData({...formData, observations: toTitleCase(e.target.value)})}></textarea></div>

           </section>
        </div>

        {/* BOTOES NO FINAL (MOVIDO DEPOIS DAS OBSERVACOES) */}
        <div className="p-6 border-t border-black/5 flex justify-end gap-3 bg-white/50 backdrop-blur-sm rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors">Cancelar</button>
          <button onClick={handleSaveWithIntegrations} disabled={isLoading} className="px-6 py-2 bg-salomao-blue text-white rounded-lg hover:bg-blue-900 shadow-lg flex items-center transition-all transform active:scale-95">{isLoading ? 'Salvando...' : <><Save className="w-4 h-4 mr-2" /> Salvar Caso</>}</button>
        </div>
      </div>

       {/* Modal Genérico de Gerenciamento */}
       {activeManager && (
         <OptionManager 
           title={
               activeManager === 'area' ? "Gerenciar Áreas" :
               activeManager === 'position' ? "Gerenciar Posições" :
               activeManager === 'court' ? "Gerenciar Tribunais" :
               activeManager === 'vara' ? "Gerenciar Varas" :
               activeManager === 'comarca' ? "Gerenciar Comarcas" :
               activeManager === 'class' ? "Gerenciar Classes" :
               activeManager === 'subject' ? "Gerenciar Assuntos" :
               activeManager === 'justice' ? "Gerenciar Justiças" :
               activeManager === 'magistrate' ? "Gerenciar Magistrados" :
               activeManager === 'opponent' ? "Gerenciar Parte Oposta" :
               activeManager === 'author' ? "Gerenciar Autores" :
               activeManager === 'location' ? "Gerenciar Locais de Faturamento" :
               activeManager === 'client' ? "Gerenciar Clientes" :
               "Gerenciar"
           }
           options={
               activeManager === 'area' ? legalAreas :
               activeManager === 'position' ? positionsList :
               activeManager === 'court' ? courtOptions :
               activeManager === 'vara' ? varaOptions :
               activeManager === 'comarca' ? comarcaOptions :
               activeManager === 'class' ? classOptions :
               activeManager === 'subject' ? subjectOptions :
               activeManager === 'justice' ? justiceOptions :
               activeManager === 'magistrate' ? magistrateOptions :
               activeManager === 'opponent' ? opponentOptions :
               activeManager === 'author' ? authorOptions :
               activeManager === 'location' ? billingLocations :
               activeManager === 'client' ? clientOptions :
               []
           }
           onAdd={handleGenericAdd}
           onRemove={handleGenericRemove}
           onEdit={handleGenericEdit}
           onClose={() => setActiveManager(null)}
           placeholder={
               activeManager === 'comarca' && !currentProcess.uf ? "Selecione a UF primeiro" : "Digite o nome"
           }
        />
       )}
       
      {/* Componente Modularizado de Detalhes do Processo */}
      <ProcessDetailsModal 
        process={viewProcess} 
        onClose={() => setViewProcess(null)} 
        onEdit={() => {
            if (viewProcessIndex !== null) {
                setViewProcess(null);
                editProcess(viewProcessIndex);
            }
        }} 
      />
    </div>
  );
}
