import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, X, Save, Settings, Check, ChevronDown, Clock, History as HistoryIcon, ArrowRight, Edit, Trash2, CalendarCheck, Hourglass, Upload, FileText, Download, AlertCircle, Search, Loader2, Link as LinkIcon, MapPin, DollarSign, Tag, Gavel, Eye } from 'lucide-react';
import { Contract, Partner, ContractProcess, TimelineEvent, ContractDocument, Analyst, Magistrate } from '../../types';
import { maskCNPJ, maskMoney, maskHon, maskCNJ, toTitleCase, parseCurrency } from '../../utils/masks';
import { decodeCNJ } from '../../utils/cnjDecoder';
import { addDays, addMonths } from 'date-fns';
import { CustomSelect } from '../ui/CustomSelect';

const UFS = [ { sigla: 'AC', nome: 'Acre' }, { sigla: 'AL', nome: 'Alagoas' }, { sigla: 'AP', nome: 'Amapá' }, { sigla: 'AM', nome: 'Amazonas' }, { sigla: 'BA', nome: 'Bahia' }, { sigla: 'CE', nome: 'Ceará' }, { sigla: 'DF', nome: 'Distrito Federal' }, { sigla: 'ES', nome: 'Espírito Santo' }, { sigla: 'GO', nome: 'Goiás' }, { sigla: 'MA', nome: 'Maranhão' }, { sigla: 'MT', nome: 'Mato Grosso' }, { sigla: 'MS', nome: 'Mato Grosso do Sul' }, { sigla: 'MG', nome: 'Minas Gerais' }, { sigla: 'PA', nome: 'Pará' }, { sigla: 'PB', nome: 'Paraíba' }, { sigla: 'PR', nome: 'Paraná' }, { sigla: 'PE', nome: 'Pernambuco' }, { sigla: 'PI', nome: 'Piauí' }, { sigla: 'RJ', nome: 'Rio de Janeiro' }, { sigla: 'RN', nome: 'Rio Grande do Norte' }, { sigla: 'RS', nome: 'Rio Grande do Sul' }, { sigla: 'RO', nome: 'Rondônia' }, { sigla: 'RR', nome: 'Roraima' }, { sigla: 'SC', nome: 'Santa Catarina' }, { sigla: 'SP', nome: 'São Paulo' }, { sigla: 'SE', nome: 'Sergipe' }, { sigla: 'TO', nome: 'Tocantins' } ];

// Função auxiliar aprimorada para garantir formatação R$ ao carregar do banco
const formatForInput = (val: string | number | undefined) => {
  if (val === undefined || val === null) return '';
  if (typeof val === 'number') return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  if (typeof val === 'string' && !val.includes('R$') && !isNaN(parseFloat(val)) && val.trim() !== '') {
      return parseFloat(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
  return val;
};

// Componente visualmente idêntico ao CustomSelect para uso em espaços restritos (como input groups)
const MinimalSelect = ({ value, onChange, options }: { value: string, onChange: (val: string) => void, options: string[] }) => {
    return (
        <div className="relative h-full w-full">
            <select
                className="w-full h-full appearance-none bg-transparent pl-3 pr-8 text-xs font-medium text-gray-700 outline-none cursor-pointer focus:bg-gray-50 transition-colors"
                value={value || '1x'}
                onChange={(e) => onChange(e.target.value)}
            >
                {options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
        </div>
    );
};

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
          className={`flex-1 border border-gray-300 rounded-l-lg p-2.5 text-sm bg-white focus:border-salomao-blue outline-none min-w-0 ${!onAdd ? 'rounded-r-none border-r-0' : ''}`}
          value={value || ''} 
          onChange={(e) => onChangeValue(maskMoney(e.target.value))}
          placeholder="R$ 0,00"
        />
        <div className={`w-20 border-y border-r border-gray-300 bg-gray-50 ${!onAdd ? 'rounded-r-lg' : ''}`}>
           <MinimalSelect value={installments || '1x'} onChange={onChangeInstallments} options={installmentOptions} />
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
  const [interimInstallments, setInterimInstallments] = useState('1x');
  const [legalAreas, setLegalAreas] = useState<string[]>(['Trabalhista', 'Cível', 'Tributário', 'Empresarial', 'Previdenciário', 'Família', 'Criminal', 'Consumidor']);
  const [showAreaManager, setShowAreaManager] = useState(false);
  
  // Estado local para adicionar magistrados
  const [newMagistrateTitle, setNewMagistrateTitle] = useState('Juiz');
  const [newMagistrateName, setNewMagistrateName] = useState('');
  
  // Estado para controlar o tipo de numeração do processo (CNJ ou Outro)
  const [isStandardCNJ, setIsStandardCNJ] = useState(true);
  
  // Novo estado para o tipo de processo "Outro/Antigo"
  const [otherProcessType, setOtherProcessType] = useState('');
  
  // Novo estado para adicionar assuntos
  const [newSubject, setNewSubject] = useState('');

  // Estados para menus suspensos (Tabelas do Supabase)
  const [justiceOptions, setJusticeOptions] = useState<string[]>(['Estadual', 'Federal', 'Trabalho', 'Eleitoral', 'Militar']);
  const [varaOptions, setVaraOptions] = useState<string[]>(['Cível', 'Criminal', 'Família', 'Trabalho', 'Fazenda Pública', 'Juizado Especial', 'Execuções Fiscais']);
  const [courtOptions, setCourtOptions] = useState<string[]>([]);
  const [comarcaOptions, setComarcaOptions] = useState<string[]>([]); 
  const [classOptions, setClassOptions] = useState<string[]>([]);
  const [subjectOptions, setSubjectOptions] = useState<string[]>([]);
  const [magistrateOptions, setMagistrateOptions] = useState<string[]>([]);
  const [opponentOptions, setOpponentOptions] = useState<string[]>([]);

  // Opções de Numerais para o select
  const numeralOptions = Array.from({ length: 100 }, (_, i) => ({ label: `${i + 1}º`, value: `${i + 1}º` }));
  
  // Estado para modal de visualização do processo
  const [viewProcess, setViewProcess] = useState<ContractProcess | null>(null);
  const [viewProcessIndex, setViewProcessIndex] = useState<number | null>(null);

  const isLoading = parentLoading || localLoading;

  useEffect(() => {
    if (isOpen) {
      fetchStatuses();
      fetchAuxiliaryTables(); // Carrega todas as tabelas auxiliares
      if (formData.id) fetchDocuments();
    } else {
      setDocuments([]);
      setClientExtraData({ address: '', number: '', complement: '', city: '', email: '', is_person: false });
      setInterimInstallments('1x');
      setIsStandardCNJ(true);
      setOtherProcessType('');
      // Limpar UF do processo ao abrir novo modal
      setCurrentProcess(prev => ({ ...prev, process_number: '', uf: '' })); 
      setNewSubject('');
    }
  }, [isOpen, formData.id]);

  // Função central para carregar dados do Supabase
  const fetchAuxiliaryTables = async () => {
    // Tribunais
    const { data: courts } = await supabase.from('courts').select('name').order('name');
    if (courts) setCourtOptions(courts.map(c => c.name));

    // Classes
    const { data: classes } = await supabase.from('process_classes').select('name').order('name');
    if (classes) setClassOptions(classes.map(c => c.name));

    // Assuntos
    const { data: subjects } = await supabase.from('process_subjects').select('name').order('name');
    if (subjects) setSubjectOptions(subjects.map(s => s.name));

    // Magistrados
    const { data: mags } = await supabase.from('magistrates').select('name').order('name');
    if (mags) setMagistrateOptions(mags.map(m => m.name));

    // Oponentes
    const { data: opps } = await supabase.from('opponents').select('name').order('name');
    if (opps) setOpponentOptions(opps.map(o => o.name));

    // Comarcas (Inicialmente todas ou por UF se já tiver UF selecionada)
    fetchComarcas(currentProcess.uf);
  };

  const fetchComarcas = async (uf?: string) => {
    let query = supabase.from('comarcas').select('name');
    if (uf) query = query.eq('uf', uf);
    const { data } = await query.order('name');
    if (data) setComarcaOptions(data.map(c => c.name));
  };

  // Atualizar Comarcas quando UF muda
  useEffect(() => {
    fetchComarcas(currentProcess.uf);
  }, [currentProcess.uf]);

  // Atualizar o processo atual quando o tipo de processo "Outro" muda
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
    if (!formData.client_name) return null;

    const clientData = {
      name: formData.client_name,
      cnpj: (formData.has_no_cnpj || !formData.cnpj) ? null : formData.cnpj,
      is_person: clientExtraData.is_person || formData.has_no_cnpj || (formData.cnpj.length > 0 && formData.cnpj.length <= 14),
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

  const handleAddToList = (listField: string, valueField: keyof Contract) => {
    const value = (formData as any)[valueField];
    if (!value || value === 'R$ 0,00' || value === '') return;
    setFormData(prev => ({ ...prev, [listField]: [...(prev as any)[listField] || [], value], [valueField]: '' }));
  };

  const removeExtra = (field: string, index: number) => {
    setFormData((prev: any) => {
      const newList = [...(prev[field] || [])];
      newList.splice(index, 1);
      return { ...prev, [field]: newList };
    });
  };

  // Funções para Magistrados
  const addMagistrate = () => {
    if (!newMagistrateName.trim()) return;
    const newMagistrate: Magistrate = { title: newMagistrateTitle, name: newMagistrateName };
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

  // --- FUNÇÕES DE ADIÇÃO DE ITENS (COM SUPABASE) ---

  const handleAddJustice = () => {
    const newJustice = window.prompt("Digite o novo tipo de Justiça:");
    if (newJustice && !justiceOptions.includes(newJustice)) {
      setJusticeOptions([...justiceOptions, toTitleCase(newJustice)]);
    }
  };

  const handleAddVara = () => {
    const newVara = window.prompt("Digite o novo tipo de Vara:");
    if (newVara && !varaOptions.includes(newVara)) {
      setVaraOptions([...varaOptions, toTitleCase(newVara)]);
    }
  };

  const handleAddCourt = async () => {
    const newCourt = window.prompt("Digite a sigla do novo Tribunal:");
    if (newCourt) {
        const cleanCourt = newCourt.toUpperCase();
        if (!courtOptions.includes(cleanCourt)) {
            const { error } = await supabase.from('courts').insert({ name: cleanCourt });
            if (!error) {
                setCourtOptions([...courtOptions, cleanCourt].sort());
                setCurrentProcess({...currentProcess, court: cleanCourt});
            } else {
                alert("Erro ao salvar tribunal: " + error.message);
            }
        }
    }
  };

  // Adicionar novo magistrado ao banco
  const handleAddMagistrateName = async () => {
    const name = window.prompt("Digite o nome do Magistrado:");
    if (name) {
        const cleanName = toTitleCase(name.trim());
        if (!magistrateOptions.includes(cleanName)) {
            const { error } = await supabase
                .from('magistrates')
                .insert({ name: cleanName, title: newMagistrateTitle });
            
            if (!error) {
                setMagistrateOptions([...magistrateOptions, cleanName].sort());
                setNewMagistrateName(cleanName);
            } else {
                alert("Erro ao salvar magistrado: " + error.message);
            }
        }
    }
  };

  // Adicionar novo oponente ao banco
  const handleAddOpponent = async () => {
    const newOpponent = window.prompt("Digite o nome da Parte Oposta:");
    if (newOpponent) {
        const cleanOpponent = toTitleCase(newOpponent);
        if (!opponentOptions.includes(cleanOpponent)) {
            const { error } = await supabase
                .from('opponents')
                .insert({ name: cleanOpponent });
            
            if (!error) {
                setOpponentOptions([...opponentOptions, cleanOpponent].sort());
                setCurrentProcess({...currentProcess, opponent: cleanOpponent});
            } else {
                alert("Erro ao salvar oponente: " + error.message);
            }
        }
    }
  };

  const handleAddComarca = async () => {
    if (!currentProcess.uf) return alert("Selecione um Estado (UF) antes de adicionar uma comarca.");
    
    const newComarca = window.prompt(`Digite a nova Comarca para ${currentProcess.uf}:`);
    if (newComarca) {
        const cleanComarca = toTitleCase(newComarca);
        if (!comarcaOptions.includes(cleanComarca)) {
            const { error } = await supabase.from('comarcas').insert({ name: cleanComarca, uf: currentProcess.uf });
            if (!error) {
                setComarcaOptions([...comarcaOptions, cleanComarca].sort());
                setCurrentProcess({...currentProcess, comarca: cleanComarca});
            } else {
                alert("Erro ao salvar comarca: " + error.message);
            }
        }
    }
  };

  const handleAddClass = async () => {
    const newClass = window.prompt("Digite a nova Classe Processual:");
    if (newClass) {
        const cleanClass = toTitleCase(newClass);
        if (!classOptions.includes(cleanClass)) {
            const { error } = await supabase.from('process_classes').insert({ name: cleanClass });
            if (!error) {
                setClassOptions([...classOptions, cleanClass].sort());
                setCurrentProcess({...currentProcess, process_class: cleanClass});
            } else {
                alert("Erro ao salvar classe: " + error.message);
            }
        }
    }
  };

  // Funções para Assuntos
  // O componente CustomSelect chama onAction para criar novo. 
  // Para adicionar à lista do select (banco) e selecionar no input
  const handleCreateSubjectOption = async () => {
      const newSubjectName = window.prompt("Digite o novo Assunto:");
      if (newSubjectName) {
          const cleanSubject = toTitleCase(newSubjectName);
          if (!subjectOptions.includes(cleanSubject)) {
              const { error } = await supabase.from('process_subjects').insert({ name: cleanSubject });
              if (!error) {
                  setSubjectOptions([...subjectOptions, cleanSubject].sort());
                  // Opcional: já seleciona no input
                  setNewSubject(cleanSubject);
              } else {
                  alert("Erro ao salvar assunto: " + error.message);
              }
          }
      }
  };

  // Adiciona o assunto selecionado (do input/select) à lista de tags do processo
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

  // --- FIM FUNÇÕES ADIÇÃO ---

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

    if (formData.intermediate_fees && formData.intermediate_fees.length > 0) {
      formData.intermediate_fees.forEach(fee => {
        const val = parseCurrency(fee);
        if (val > 0) installmentsToInsert.push({ contract_id: contractId, type: 'intermediate_fee', installment_number: 1, total_installments: 1, amount: val, status: 'pending', due_date: addMonths(new Date(), 1).toISOString() });
      });
    }
    if (installmentsToInsert.length > 0) await supabase.from('financial_installments').insert(installmentsToInsert);
  };

  const forceUpdateFinancials = async (contractId: string) => {
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
        if (!clientId) {
            throw new Error("Falha ao salvar dados do cliente (CNPJ Duplicado ou Inválido).");
        }
        
        const contractPayload: any = {
            ...formData,
            client_id: clientId,
            pro_labore: parseCurrency(formData.pro_labore),
            final_success_fee: parseCurrency(formData.final_success_fee),
            fixed_monthly_fee: parseCurrency(formData.fixed_monthly_fee),
            other_fees: parseCurrency(formData.other_fees),
            
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
            await forceUpdateFinancials(savedId);
            await generateFinancialInstallments(savedId);
            
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
             alert(`Erro Técnico: Tentativa de salvar campo inválido (${column}).`);
        } else {
            alert(`Não foi possível salvar as alterações.\n\n${error.message}`);
        }
    } finally {
        setLocalLoading(false);
    }
  };

  const handleAddLocation = () => {
    const newLocation = window.prompt("Digite o novo local de faturamento:");
    if (newLocation && !billingLocations.includes(newLocation)) {
      setBillingLocations([...billingLocations, newLocation]);
    }
  };
const handleCNPJSearch = async () => {
    if (!formData.cnpj || formData.has_no_cnpj) return;
    
    const cnpjLimpo = formData.cnpj.replace(/\D/g, '');
    if (cnpjLimpo.length !== 14) {
      alert('CNPJ inválido. Digite 14 dígitos.');
      return;
    }

    setLocalLoading(true);
    try {
      let data;
      
      // Tentativa 1: BrasilAPI (sem v1 no path)
      try {
         const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);
         if (!response.ok) throw new Error('Falha BrasilAPI');
         data = await response.json();
         
         // Se retornou erro da API
         if (data.type === 'not_found' || data.message) {
           throw new Error('CNPJ não encontrado');
         }
         
      } catch (err) {
         console.warn('BrasilAPI falhou, tentando API CNPJA...');
         
         // Tentativa 2: CNPJA (API Gratuita sem CORS)
         try {
           const responseBackup = await fetch(`https://api.cnpja.com/companies/${cnpjLimpo}`);
           if (!responseBackup.ok) throw new Error('CNPJ não encontrado');
           const cnpjaData = await responseBackup.json();
           
           // Normalizar dados da CNPJA para formato esperado
           data = {
             razao_social: cnpjaData.name || cnpjaData.alias?.name,
             nome_fantasia: cnpjaData.alias?.name || cnpjaData.name,
             logradouro: cnpjaData.address?.street,
             numero: cnpjaData.address?.number,
             complemento: cnpjaData.address?.details,
             municipio: cnpjaData.address?.city,
             uf: cnpjaData.address?.state,
             email: cnpjaData.emails?.[0]?.address
           };
         } catch (err2) {
           throw new Error('CNPJ não encontrado nas bases de dados disponíveis');
         }
      }
      
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
      alert(`❌ Não foi possível consultar o CNPJ.\n\n${error.message}\n\n💡 Você pode preencher manualmente.`);
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
          setCourtOptions([...courtOptions, decoded.tribunal].sort());
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

  const partnerSelectOptions = partners.map(p => ({ label: p.name, value: p.id }));
  const analystSelectOptions = analysts ? analysts.map(a => ({ label: a.name, value: a.id })) : [];
  const ufOptions = UFS.map(uf => ({ label: uf.nome, value: uf.sigla }));
  const positionOptions = [{ label: 'Autor', value: 'Autor' }, { label: 'Réu', value: 'Réu' }, { label: 'Terceiro Interessado', value: 'Terceiro' }];
  const billingOptions = billingLocations.map(l => ({ label: l, value: l }));
  const signatureOptions = [{ label: 'Sim', value: 'true' }, { label: 'Não (Cobrar)', value: 'false' }];
  const rejectionByOptions = [{ label: 'Cliente', value: 'Cliente' }, { label: 'Escritório', value: 'Escritório' }];
  const rejectionReasonOptions = [{ label: 'Cliente declinou', value: 'Cliente declinou' }, { label: 'Cliente não retornou', value: 'Cliente não retornou' }, { label: 'Caso ruim', value: 'Caso ruim' }, { label: 'Conflito de interesses', value: 'Conflito de interesses' }];
  const areaOptions = legalAreas.map(a => ({ label: a, value: a }));
  const magistrateTypes = [{ label: 'Juiz', value: 'Juiz' }, { label: 'Desembargador', value: 'Desembargador' }, { label: 'Ministro', value: 'Ministro' }];
  
  // Opções formatadas para CustomSelect
  const justiceSelectOptions = justiceOptions.map(j => ({ label: j, value: j }));
  const varaSelectOptions = varaOptions.map(v => ({ label: v, value: v }));
  const courtSelectOptions = courtOptions.map(c => ({ label: c, value: c }));
  const comarcaSelectOptions = comarcaOptions.map(c => ({ label: c, value: c }));
  const classSelectOptions = classOptions.map(c => ({ label: c, value: c }));
  const subjectSelectOptions = subjectOptions.map(s => ({ label: s, value: s }));

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
  {/* 1. STATUS ATUAL DO CASO + DATA DA FASE */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div className="bg-white/60 p-6 rounded-xl border border-white/40 shadow-sm backdrop-blur-sm relative z-50">
      <CustomSelect label="Status Atual do Caso" value={formData.status} onChange={(val: any) => setFormData({...formData, status: val})} options={statusOptions} onAction={handleCreateStatus} actionIcon={Plus} actionLabel="Adicionar Novo Status" />
    </div>
    
    <div className="bg-white/60 p-6 rounded-xl border border-white/40 shadow-sm backdrop-blur-sm">
      {formData.status === 'analysis' && (
        <div>
          <label className="text-xs font-medium block mb-1 text-gray-600">Data Prospect <span className="text-red-500">*</span></label>
          <input type="date" className="w-full border border-gray-300 p-2.5 rounded-lg text-sm bg-white focus:border-salomao-blue outline-none" value={formData.prospect_date || ''} onChange={e => setFormData({...formData, prospect_date: e.target.value})} />
        </div>
      )}
      {formData.status === 'proposal' && (
        <div>
          <label className="text-xs font-medium block mb-1 text-gray-600">Data Proposta <span className="text-red-500">*</span></label>
          <input type="date" className="w-full border border-gray-300 p-2.5 rounded-lg text-sm bg-white focus:border-salomao-blue outline-none" value={formData.proposal_date || ''} onChange={e => setFormData({...formData, proposal_date: e.target.value})} />
        </div>
      )}
      {formData.status === 'active' && (
        <div>
          <label className="text-xs font-medium block mb-1 text-gray-600">Data Assinatura <span className="text-red-500">*</span></label>
          <input type="date" className="w-full border border-gray-300 p-2.5 rounded-lg text-sm bg-white focus:border-salomao-blue outline-none" value={formData.contract_date || ''} onChange={e => setFormData({...formData, contract_date: e.target.value})} />
        </div>
      )}
      {formData.status === 'rejected' && (
        <div>
          <label className="text-xs font-medium block mb-1 text-gray-600">Data Rejeição</label>
          <input type="date" className="w-full border border-gray-300 p-2.5 rounded-lg text-sm bg-white focus:border-salomao-blue outline-none" value={formData.rejection_date || ''} onChange={e => setFormData({...formData, rejection_date: e.target.value})} />
        </div>
      )}
      {!['analysis', 'proposal', 'active', 'rejected'].includes(formData.status) && (
        <div className="text-center text-sm text-gray-400 py-3">Selecione um status</div>
      )}
    </div>
  </div>

  {/* 2. DETALHES DA FASE */}
  <section className="border-t border-black/5 pt-6">
    <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-6 flex items-center"><Clock className="w-4 h-4 mr-2" />Detalhes da Fase: {getStatusLabel(formData.status)}</h3>
    
    {formData.status === 'analysis' && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 bg-yellow-50 rounded-xl border border-yellow-100">
        <div><CustomSelect label="Analisado Por" value={formData.analyst_id || ''} onChange={(val: string) => setFormData({...formData, analyst_id: val})} options={analystSelectOptions} onAction={onOpenAnalystManager} actionIcon={Settings} actionLabel="Gerenciar Analistas" className="border-yellow-200" /></div>
      </div>
    )}
    
    {(formData.status === 'proposal' || formData.status === 'active') && (
      <div className="space-y-6 animate-in slide-in-from-top-2">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-start">
          <div>
            <FinancialInputWithInstallments 
              label="Pró-Labore (R$)" 
              value={formatForInput(formData.pro_labore)} 
              onChangeValue={(v: any) => setFormData({...formData, pro_labore: v})}
              installments={formData.pro_labore_installments} onChangeInstallments={(v: any) => setFormData({...formData, pro_labore_installments: v})}
            />
          </div>
          <div>
            <FinancialInputWithInstallments 
              label="Êxito Intermediário" 
              value={newIntermediateFee} onChangeValue={setNewIntermediateFee}
              installments={interimInstallments} onChangeInstallments={setInterimInstallments}
              onAdd={() => { addIntermediateFee(); setInterimInstallments('1x'); }}
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
              value={formatForInput(formData.final_success_fee)} 
              onChangeValue={(v: any) => setFormData({...formData, final_success_fee: v})}
              installments={formData.final_success_fee_installments} onChangeInstallments={(v: any) => setFormData({...formData, final_success_fee_installments: v})}
            />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Êxito %</label>
            <div className="flex rounded-lg shadow-sm">
              <input type="text" className="flex-1 border border-gray-300 rounded-l-lg p-2.5 text-sm bg-white focus:border-salomao-blue outline-none min-w-0" placeholder="Ex: 20%" value={formData.final_success_percent} onChange={e => setFormData({...formData, final_success_percent: e.target.value})} />
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
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
          <div>
            <FinancialInputWithInstallments 
              label="Outros Honorários (R$)" 
              value={formatForInput(formData.other_fees)} onChangeValue={(v: any) => setFormData({...formData, other_fees: v})} 
              installments={formData.other_fees_installments} onChangeInstallments={(v: any) => setFormData({...formData, other_fees_installments: v})}
            />
          </div>
          <div>
            <FinancialInputWithInstallments 
              label="Fixo Mensal (R$)" 
              value={formatForInput(formData.fixed_monthly_fee)} onChangeValue={(v: any) => setFormData({...formData, fixed_monthly_fee: v})}
              installments={formData.fixed_monthly_fee_installments} onChangeInstallments={(v: any) => setFormData({...formData, fixed_monthly_fee_installments: v})}
            />
          </div>
        </div>
        <div className="flex items-end pb-3"><div className="flex items-center"><input type="checkbox" id="timesheet" checked={formData.timesheet} onChange={e => setFormData({...formData, timesheet: e.target.checked})} className="w-4 h-4 text-salomao-blue rounded border-gray-300 focus:ring-0" /><label htmlFor="timesheet" className="ml-2 text-sm text-gray-700 font-medium whitespace-nowrap">Hon. de Timesheet</label></div></div>
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
      <div className="grid grid-cols-2 gap-4">
        <CustomSelect label="Rejeitado por" value={formData.rejected_by || ''} onChange={(val: string) => setFormData({...formData, rejected_by: val})} options={rejectionByOptions} />
        <CustomSelect label="Motivo" value={formData.rejection_reason || ''} onChange={(val: string) => setFormData({...formData, rejection_reason: val})} options={rejectionReasonOptions} />
      </div>
    )}
  </section>

  {/* 3. DADOS DO CLIENTE */}
  <section className="space-y-5 border-t border-black/5 pt-6">
    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b border-black/5 pb-2">Dados do Cliente</h3>
    <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
      <div className="md:col-span-3">
        <label className="block text-xs font-medium text-gray-600 mb-1">CNPJ/CPF</label>
        <div className="flex gap-2 items-center">
          <input type="text" disabled={formData.has_no_cnpj} className="flex-1 border border-gray-300 rounded-lg p-2.5 text-sm bg-white focus:border-salomao-blue outline-none min-w-0" placeholder="00.000.000/0000-00" value={formData.cnpj} onChange={(e) => setFormData({...formData, cnpj: maskCNPJ(e.target.value)})}/>
          <button type="button" onClick={handleCNPJSearch} disabled={formData.has_no_cnpj || !formData.cnpj} className="bg-white hover:bg-gray-50 text-gray-600 p-2.5 rounded-lg border border-gray-300 disabled:opacity-50 shrink-0"><Search className="w-4 h-4" /></button>
        </div>
        <div className="flex items-center mt-2"><input type="checkbox" id="no_cnpj" className="rounded text-salomao-blue focus:ring-salomao-blue" checked={formData.has_no_cnpj} onChange={(e) => setFormData({...formData, has_no_cnpj: e.target.checked, cnpj: ''})}/><label htmlFor="no_cnpj" className="ml-2 text-xs text-gray-500">Sem CNPJ (Pessoa Física)</label></div>
      </div>
      <div className="md:col-span-9"><label className="block text-xs font-medium text-gray-600 mb-1">Nome do Cliente <span className="text-red-500">*</span></label><input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-salomao-blue outline-none bg-white" value={formData.client_name} onChange={(e) => handleTextChange('client_name', e.target.value)} /></div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div><CustomSelect label="Área do Direito" value={formData.area || ''} onChange={(val: string) => setFormData({...formData, area: val})} options={areaOptions} onAction={() => setShowAreaManager(true)} actionIcon={Settings} actionLabel="Gerenciar Áreas" placeholder="Selecione" /></div>
      <div><CustomSelect label="Responsável (Sócio) *" value={formData.partner_id} onChange={(val: string) => setFormData({...formData, partner_id: val})} options={partnerSelectOptions} onAction={onOpenPartnerManager} actionIcon={Settings} actionLabel="Gerenciar Sócios" /></div>
    </div>
  </section>

  {/* 4. PROCESSOS JUDICIAIS */}
  <section className="space-y-4 bg-white/60 p-5 rounded-xl border border-white/40 shadow-sm backdrop-blur-sm">
    <div className="flex justify-between items-center"><h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Processos Judiciais</h3><div className="flex items-center"><input type="checkbox" id="no_process" checked={!formData.has_legal_process} onChange={(e) => setFormData({...formData, has_legal_process: !e.target.checked})} className="rounded text-salomao-blue" /><label htmlFor="no_process" className="ml-2 text-xs text-gray-600">Caso sem processo judicial</label></div></div>
    {formData.has_legal_process && (
      <div className="space-y-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          {/* Todo o conteúdo do formulário de processos permanece igual */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4 items-end">
            <div className={isStandardCNJ ? "md:col-span-5" : "md:col-span-4"}>
                <label className="text-[10px] text-gray-500 uppercase font-bold flex justify-between mb-1">
                    Número do Processo *
                    {currentProcess.process_number && (<button onClick={handleOpenJusbrasil} className="text-[10px] text-blue-500 hover:underline flex items-center" title="Abrir no Jusbrasil"><LinkIcon className="w-3 h-3 mr-1" /> Ver Externo</button>)}
                </label>
                <div className="flex items-center">
                    <CustomSelect 
                        value={isStandardCNJ ? 'cnj' : 'other'}
                        onChange={(val: string) => {
                            setIsStandardCNJ(val === 'cnj');
                            if (val === 'cnj') {
                                setCurrentProcess({...currentProcess, process_number: maskCNJ(currentProcess.process_number || '')});
                                setOtherProcessType('');
                            }
                        }}
                        options={[
                            { label: 'CNJ', value: 'cnj' },
                            { label: 'Outro', value: 'other' }
                        ]}
                        className="mr-2 w-24"
                    />
                    
                    <div className="flex-1 relative">
                        <input 
                            type="text" 
                            className="w-full border-b border-gray-300 focus:border-salomao-blue outline-none py-1.5 text-sm font-mono pr-8" 
                            placeholder={isStandardCNJ ? "0000000-00..." : "Nº Processo"} 
                            value={currentProcess.process_number} 
                            onChange={(e) => setCurrentProcess({
                                ...currentProcess, 
                                process_number: isStandardCNJ ? maskCNJ(e.target.value) : e.target.value
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
                </div>
            </div>
            
            {!isStandardCNJ && (
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
            
            <div className="md:col-span-2">
                <CustomSelect 
                    label="Tribunal *" 
                    value={currentProcess.court || ''} 
                    onChange={(val: string) => setCurrentProcess({...currentProcess, court: val})} 
                    options={courtSelectOptions} 
                    onAction={handleAddCourt}
                    actionLabel="Adicionar Tribunal"
                    placeholder="Selecione"
                    className="custom-select-small" 
                />
            </div>
            <div className="md:col-span-2"><CustomSelect label="Estado (UF) *" value={currentProcess.uf || ''} onChange={(val: string) => setCurrentProcess({...currentProcess, uf: val})} options={ufOptions} placeholder="UF" className="custom-select-small" /></div>
            <div className={isStandardCNJ ? "md:col-span-3" : "md:col-span-2"}><CustomSelect label="Posição no Processo" value={currentProcess.position || formData.client_position || ''} onChange={(val: string) => setCurrentProcess({...currentProcess, position: val})} options={positionOptions} className="custom-select-small" /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
            <div className="md:col-span-5">
                <CustomSelect 
                    label="Contrário (Parte Oposta) *" 
                    value={currentProcess.opponent || formData.company_name || ''} 
                    onChange={(val: string) => setCurrentProcess({...currentProcess, opponent: val})} 
                    options={opponentOptions.map(o => ({ label: o, value: o }))}
                    onAction={handleAddOpponent}
                    actionLabel="Adicionar Parte Oposta"
                    placeholder="Selecione ou adicione"
                />
            </div>
            <div className="md:col-span-7">
                <label className="text-[10px] text-gray-500 uppercase font-bold">Magistrado (Adicionar Lista) **</label>
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
                            onAction={handleAddMagistrateName}
                            actionLabel="Adicionar Novo Magistrado"
                        />
                    </div>
                    <button onClick={addMagistrate} className="text-salomao-blue hover:text-blue-700 font-bold px-2 rounded-lg bg-blue-50">+</button>
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
            <div className="md:col-span-5">
                <CustomSelect 
                    label="Vara" 
                    value={currentProcess.vara || ''} 
                    onChange={(val: string) => setCurrentProcess({...currentProcess, vara: val})} 
                    options={varaSelectOptions}
                    onAction={handleAddVara}
                    actionLabel="Adicionar Vara"
                    placeholder="Selecione ou adicione"
                />
            </div>
            <div className="md:col-span-4">
                <CustomSelect 
                    label="Comarca" 
                    value={currentProcess.comarca || ''} 
                    onChange={(val: string) => setCurrentProcess({...currentProcess, comarca: val})} 
                    options={comarcaSelectOptions} 
                    onAction={handleAddComarca}
                    actionLabel="Adicionar Comarca"
                    placeholder={currentProcess.uf ? "Selecione a Comarca" : "Selecione o Estado Primeiro"}
                    disabled={!currentProcess.uf}
                />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
            <div className="md:col-span-3"><label className="text-[10px] text-gray-500 uppercase font-bold">Data da Distribuição</label><input type="date" className="w-full border-b border-gray-300 focus:border-salomao-blue outline-none py-1 text-sm bg-transparent" value={currentProcess.distribution_date || ''} onChange={(e) => setCurrentProcess({...currentProcess, distribution_date: e.target.value})} /></div>
            <div className="md:col-span-4"><CustomSelect label="Justiça" value={currentProcess.justice_type || ''} onChange={(val: string) => setCurrentProcess({...currentProcess, justice_type: val})} options={justiceSelectOptions} onAction={handleAddJustice} actionLabel="Adicionar Justiça" /></div>
            <div className="md:col-span-5"><label className="text-[10px] text-gray-500 uppercase font-bold">Valor da Causa (R$)</label><input type="text" className="w-full border-b border-gray-300 focus:border-salomao-blue outline-none py-1 text-sm" value={currentProcess.cause_value || ''} onChange={(e) => setCurrentProcess({...currentProcess, cause_value: maskMoney(e.target.value)})} /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
                <CustomSelect 
                    label="Classe" 
                    value={currentProcess.process_class || ''} 
                    onChange={(val: string) => setCurrentProcess({...currentProcess, process_class: val})} 
                    options={classSelectOptions}
                    onAction={handleAddClass}
                    actionLabel="Adicionar Classe"
                    placeholder="Selecione a Classe"
                />
            </div>
            
            <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold">Assunto</label>
                <div className="flex gap-2">
                      <div className="flex-1">
                        <CustomSelect 
                            value={newSubject}
                            onChange={(val: string) => setNewSubject(val)}
                            options={subjectSelectOptions}
                            placeholder="Selecione ou digite novo"
                            onAction={handleCreateSubjectOption}
                            actionLabel="Criar Novo Assunto no Banco"
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
          <div className="flex justify-end mt-4">
                <button onClick={handleProcessAction} className="bg-salomao-blue text-white rounded px-4 py-2 hover:bg-blue-900 transition-colors flex items-center justify-center shadow-md text-sm font-bold w-full md:w-auto">
                    {editingProcessIndex !== null ? <><Check className="w-4 h-4 mr-2" /> Atualizar Processo</> : <><Plus className="w-4 h-4 mr-2" /> Adicionar Processo</>}
                </button>
          </div>
        </div>
        {processes.length > 0 && (
          <div className="space-y-2 mt-4">
            {processes.map((p, idx) => (
              <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:border-blue-200 transition-colors group">
                <div className="grid grid-cols-3 gap-4 flex-1 text-xs">
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

  {/* 5. ARQUIVOS & DOCUMENTOS */}
  {(formData.status === 'analysis' || formData.status === 'proposal' || formData.status === 'active') && (
    <div className="border-t border-black/5 pt-6">
      <div className="flex items-center justify-between mb-4"><label className="text-xs font-bold text-gray-500 uppercase flex items-center"><FileText className="w-4 h-4 mr-2" />Arquivos & Documentos</label>{!isEditing ? (<span className="text-xs text-orange-500 flex items-center"><AlertCircle className="w-3 h-3 mr-1" /> Salve o caso para anexar arquivos</span>) : (<label className="cursor-pointer bg-white border border-dashed border-salomao-blue text-salomao-blue px-4 py-2 rounded-lg text-xs font-medium hover:bg-blue-50 transition-colors flex items-center">{uploading ? 'Enviando...' : <><Upload className="w-3 h-3 mr-2" /> Anexar PDF</>}<input type="file" accept="application/pdf" className="hidden" disabled={uploading} onChange={(e) => handleFileUpload(e, formData.status === 'active' ? 'contract' : 'proposal')} /></label>)}</div>
      {documents.length > 0 ? (<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{documents.map((doc) => (<div key={doc.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 group"><div className="flex items-center overflow-hidden"><div className="bg-red-100 p-2 rounded text-red-600 mr-3"><FileText className="w-4 h-4" /></div><div className="flex-1 min-w-0"><p className="text-xs font-medium text-gray-700 truncate" title={doc.file_name}>{doc.file_name}</p><div className="flex items-center text-[10px] text-gray-400 mt-0.5"><span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>{doc.hon_number_ref && (<span className="ml-2 bg-green-100 text-green-700 px-1.5 py-0.5 rounded border border-green-200">HON: {maskHon(doc.hon_number_ref)}</span>)}</div></div></div><div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => handleDownload(doc.file_path)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded"><Download className="w-4 h-4" /></button><button onClick={() => handleDeleteDocument(doc.id, doc.file_path)} className="p-1.5 text-red-600 hover:bg-red-100 rounded"><Trash2 className="w-4 h-4" /></button></div></div>))}</div>) : (isEditing && <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-lg text-xs text-gray-400">Nenhum arquivo anexado.</div>)}
    </div>
  )}

  {/* 6. OBSERVAÇÕES GERAIS */}
  <div className="border-t border-black/5 pt-6">
    <label className="block text-xs font-medium text-gray-600 mb-1">Observações Gerais</label>
    <textarea className="w-full border border-gray-300 rounded-lg p-3 text-sm h-24 focus:border-salomao-blue outline-none bg-white" value={formData.observations} onChange={(e) => setFormData({...formData, observations: toTitleCase(e.target.value)})}></textarea>
  </div>

  {/* 7. TIMELINE */}
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

      {/* Modal de Gerenciamento de Áreas */}
      {showAreaManager && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70]">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">Gerenciar Áreas do Direito</h3>
              <button onClick={() => setShowAreaManager(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            
            <div className="p-4">
              <div className="flex gap-2 mb-4">
                <input 
                  type="text" 
                  className="flex-1 border border-gray-300 rounded-lg p-2 text-sm"
                  placeholder="Nome da nova área"
                  id="new-area-input"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.target as HTMLInputElement;
                      const value = input.value.trim();
                      if (value && !legalAreas.includes(value)) {
                        setLegalAreas([...legalAreas, toTitleCase(value)].sort());
                        input.value = '';
                      }
                    }
                  }}
                />
                <button 
                  onClick={() => {
                    const input = document.getElementById('new-area-input') as HTMLInputElement;
                    const value = input.value.trim();
                    if (value && !legalAreas.includes(value)) {
                      setLegalAreas([...legalAreas, toTitleCase(value)].sort());
                      input.value = '';
                    }
                  }}
                  className="bg-salomao-blue text-white p-2 rounded-lg"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {legalAreas.map(area => (
                  <div key={area} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg group">
                    <span className="text-sm text-gray-700">{area}</span>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setLegalAreas(legalAreas.filter(a => a !== area))} 
                        className="text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Visualização Detalhada do Processo */}
      {viewProcess && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
                <div className="bg-salomao-blue text-white p-6 flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="text-lg font-bold">Detalhes do Processo</h3>
                        <p className="text-xs text-blue-200 mt-1 font-mono">{viewProcess.process_number}</p>
                    </div>
                    <button onClick={() => setViewProcess(null)} className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Tribunal</span>
                            <span className="text-sm font-medium text-gray-800">{viewProcess.court || '-'}</span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Estado (UF)</span>
                            <span className="text-sm font-medium text-gray-800">{viewProcess.uf || '-'}</span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Vara</span>
                            <span className="text-sm font-medium text-gray-800">{viewProcess.vara || '-'}</span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Comarca</span>
                            <span className="text-sm font-medium text-gray-800">{viewProcess.comarca || '-'}</span>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Magistrados</span>
                        {viewProcess.magistrates && viewProcess.magistrates.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {viewProcess.magistrates.map((m, idx) => (
                                    <span key={idx} className="inline-flex items-center px-2 py-1 rounded bg-white border border-gray-200 text-xs text-gray-700">
                                        <Gavel size={10} className="mr-1 text-gray-400" />
                                        <span className="font-semibold mr-1">{m.title}:</span> {m.name}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <span className="text-sm text-gray-500 italic">Nenhum magistrado cadastrado.</span>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Parte Oposta</span>
                            <span className="text-sm font-medium text-gray-800">{viewProcess.opponent || '-'}</span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Posição</span>
                            <span className="text-sm font-medium text-gray-800">{viewProcess.position || '-'}</span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Tipo de Ação</span>
                            <span className="text-sm font-medium text-gray-800">{viewProcess.action_type || '-'}</span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Data Distribuição</span>
                            <span className="text-sm font-medium text-gray-800">{viewProcess.distribution_date ? new Date(viewProcess.distribution_date).toLocaleDateString('pt-BR') : '-'}</span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Justiça</span>
                            <span className="text-sm font-medium text-gray-800">{viewProcess.justice_type || '-'}</span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Instância</span>
                            <span className="text-sm font-medium text-gray-800">{viewProcess.instance || '-'}</span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Classe</span>
                            <span className="text-sm font-medium text-gray-800">{viewProcess.process_class || '-'}</span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Assunto</span>
                            <span className="text-sm font-medium text-gray-800">{viewProcess.subject || '-'}</span>
                        </div>
                    </div>
                     <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex justify-between items-center">
                        <span className="text-xs uppercase font-bold text-blue-600">Valor da Causa</span>
                        <span className="text-lg font-bold text-blue-900">{viewProcess.cause_value || 'R$ 0,00'}</span>
                    </div>
                </div>
                
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 shrink-0">
                    <button 
                        onClick={() => setViewProcess(null)} 
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Fechar
                    </button>
                    <button 
                        onClick={() => {
                            if (viewProcessIndex !== null) {
                                setViewProcess(null); // Fecha o modal de visualização
                                editProcess(viewProcessIndex); // Abre o modo de edição do formulário
                            }
                        }} 
                        className="px-4 py-2 bg-salomao-blue text-white rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors flex items-center"
                    >
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
