import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, Search, Download, CheckCircle2, Circle, Clock, Loader2, 
  CalendarDays, Receipt, X, Filter, MapPin, Hash, FileText, 
  AlertTriangle, Plus, ChevronDown, FileDown, Briefcase
} from 'lucide-react';
import { FinancialInstallment, Partner } from '../types';
import { EmptyState } from '../components/ui/EmptyState';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

// --- COMPONENTES AUXILIARES ---

const FilterSelect = ({ icon: Icon, value, onChange, options, placeholder }: { icon?: React.ElementType, value: string, onChange: (val: string) => void, options: { label: string, value: string }[], placeholder: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const displayValue = options.find((opt) => opt.value === value)?.label || placeholder;

  return (
    <div className="relative min-w-[160px]" ref={wrapperRef}>
      <div
        className="flex items-center bg-white px-3 py-2 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors select-none shadow-sm h-[40px]"
        onClick={() => setIsOpen(!isOpen)}
      >
        {Icon && <Icon className="w-4 h-4 text-gray-500 mr-2 shrink-0" />}
        <span className="text-sm text-gray-700 flex-1 truncate">{displayValue}</span>
        <ChevronDown className={`w-3 h-3 text-gray-500 ml-2 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto flex flex-col animate-in fade-in zoom-in-95">
          {options.map((opt) => (
            <div
              key={opt.value}
              className={`px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 cursor-pointer ${value === opt.value ? 'bg-blue-50 font-medium' : ''}`}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export function Finance() {
  const navigate = useNavigate();
  
  // --- STATES ---
  const [userRole, setUserRole] = useState<'admin' | 'editor' | 'viewer' | null>(null);
  const [installments, setInstallments] = useState<FinancialInstallment[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [selectedPartner, setSelectedPartner] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, paid, overdue
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [locations, setLocations] = useState<string[]>([]);

  // Modais e Edição
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<FinancialInstallment | null>(null);
  const [billingDate, setBillingDate] = useState(new Date().toISOString().split('T')[0]);

  const [isDueDateModalOpen, setIsDueDateModalOpen] = useState(false);
  const [installmentToEdit, setInstallmentToEdit] = useState<FinancialInstallment | null>(null);
  const [newDueDate, setNewDueDate] = useState('');

  useEffect(() => {
    checkUserRole();
    fetchData();
  }, []);

  // Fechar busca ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        if (!searchTerm) setIsSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchRef, searchTerm]);

  // --- LOGIC ---
  const checkUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
        if (profile) setUserRole(profile.role as 'admin' | 'editor' | 'viewer');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    
    // Busca parceiros
    const { data: partnersData } = await supabase.from('partners').select('*').order('name');
    if (partnersData) setPartners(partnersData);

    // Busca parcelas
    const { data: installmentsData } = await supabase
      .from('financial_installments')
      .select(`
        *,
        contracts (
          id, seq_id, hon_number, client_name, partner_id, billing_location, status,
          partners (name)
        )
      `)
      .order('due_date', { ascending: true });

    if (installmentsData) {
      const activeInstallments = installmentsData.filter((i: any) => i.contracts?.status === 'active');

      const formatted = activeInstallments.map((i: any) => ({
        ...i,
        contract: {
          ...i.contracts,
          partner_name: i.contracts?.partners?.name,
          display_id: i.contracts?.seq_id ? String(i.contracts.seq_id).padStart(6, '0') : '-'
        }
      }));
      setInstallments(formatted);

      const locs = Array.from(new Set(formatted.map((i: any) => i.contract?.billing_location).filter(Boolean))) as string[];
      setLocations(locs);
    }
    setLoading(false);
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const isOverdue = (inst: FinancialInstallment) => {
    if (inst.status !== 'pending' || !inst.due_date) return false;
    const dueDateStr = inst.due_date.split('T')[0];
    return dueDateStr < todayStr;
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'pro_labore': return 'Pró-Labore';
      case 'success_fee': return 'Êxito';
      case 'final_success_fee': return 'Êxito Final';
      case 'fixed_monthly_fee': return 'Mensal';
      case 'hourly_fee': return 'Horas';
      default: return type;
    }
  };

  // --- NOVA FUNÇÃO: FILTRAR APENAS VENCIDAS ---
  const handleFilterOverdue = () => {
    setStatusFilter('overdue');
    setSearchTerm('');
    setSelectedPartner('');
    setSelectedLocation('');
    setStartDate('');
    setEndDate('');
    setIsSearchOpen(false);
    
    const overdueCount = installments.filter(i => isOverdue(i)).length;
    toast.info(`Filtrando ${overdueCount} parcela${overdueCount !== 1 ? 's' : ''} vencida${overdueCount !== 1 ? 's' : ''}`, {
      description: 'Exibindo apenas parcelas com vencimento atrasado',
      duration: 3000,
    });
  };

  // --- FILTROS ---
  const filteredInstallments = installments.filter(i => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = i.contract?.client_name?.toLowerCase().includes(term) || 
                          i.contract?.hon_number?.includes(searchTerm) ||
                          (i.contract as any)?.display_id?.includes(searchTerm);
    
    const matchesPartner = selectedPartner ? i.contract?.partner_id === selectedPartner : true;
    const matchesLocation = selectedLocation ? i.contract?.billing_location === selectedLocation : true;
    
    // Filtro de Data
    let matchesDate = true;
    if (startDate || endDate) {
        const dateToCheck = i.paid_at ? new Date(i.paid_at) : (i.due_date ? new Date(i.due_date) : null);
        if (dateToCheck) {
            if (startDate && dateToCheck < new Date(startDate)) matchesDate = false;
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                if (dateToCheck > end) matchesDate = false;
            }
        } else {
            matchesDate = false;
        }
    }

    // Filtro de Status
    let matchesStatus = true;
    if (statusFilter === 'pending') matchesStatus = i.status === 'pending';
    if (statusFilter === 'paid') matchesStatus = i.status === 'paid';
    if (statusFilter === 'overdue') matchesStatus = isOverdue(i);

    return matchesSearch && matchesPartner && matchesLocation && matchesStatus && matchesDate;
  });

  // --- TOTAIS E CÁLCULOS ---
  const totalPending = filteredInstallments.filter(i => i.status === 'pending').reduce((acc, curr) => acc + curr.amount, 0);
  const totalPaid = filteredInstallments.filter(i => i.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0);
  
  // IMPORTANTE: totalOverdueCount sempre calculado do TOTAL de installments (não filtrado)
  const totalPendingCount = filteredInstallments.filter(i => i.status === 'pending').length;
  const totalOverdueCount = installments.filter(i => isOverdue(i)).length;

  // --- AÇÕES ---
  const handleMarkAsPaid = (installment: FinancialInstallment) => {
    setSelectedInstallment(installment);
    setBillingDate(todayStr);
    setIsDateModalOpen(true);
  };

  const confirmPayment = async () => {
    if (!selectedInstallment) return;
    await supabase.from('financial_installments').update({ status: 'paid', paid_at: billingDate }).eq('id', selectedInstallment.id);
    setIsDateModalOpen(false);
    toast.success('Faturamento confirmado!');
    fetchData();
  };

  const handleEditDueDate = (installment: FinancialInstallment) => {
    setInstallmentToEdit(installment);
    setNewDueDate(installment.due_date ? installment.due_date.split('T')[0] : '');
    setIsDueDateModalOpen(true);
  };

  const confirmDueDateChange = async () => {
    if (!installmentToEdit || !newDueDate) return;
    await supabase.from('financial_installments').update({ due_date: newDueDate }).eq('id', installmentToEdit.id);
    setIsDueDateModalOpen(false);
    toast.success('Vencimento atualizado!');
    fetchData();
  };

  const handleDownloadContractPDF = (contractId: string) => {
    toast.info(`Baixando contrato...`);
  };

  const handleNavigateToContract = (contractId: string) => navigate(`/contracts/${contractId}`);

  const handleNewInvoice = () => {
     alert("Abrir modal de Cadastro de Casos / Faturamento avulso");
  };

  const exportToExcel = () => {
    const data = filteredInstallments.map(i => ({
      'ID': (i.contract as any)?.display_id,
      'Cliente': i.contract?.client_name,
      'HON': i.contract?.hon_number,
      'Cláusula': (i as any).clause || '',
      'Tipo': getTypeLabel(i.type),
      'Parcela': `${i.installment_number}/${i.total_installments}`,
      'Valor': i.amount,
      'Vencimento': new Date(i.due_date!).toLocaleDateString(),
      'Status': i.status === 'paid' ? 'Faturado' : 'Pendente',
      'Data Faturamento': i.paid_at ? new Date(i.paid_at).toLocaleDateString() : '-'
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Financeiro");
    XLSX.writeFile(wb, "Relatorio_Financeiro.xlsx");
  };

  const clearFilters = () => {
      setSearchTerm('');
      setSelectedPartner('');
      setSelectedLocation('');
      setStatusFilter('all');
      setStartDate('');
      setEndDate('');
      setIsSearchOpen(false);
  };

  const hasActiveFilters = searchTerm || selectedPartner || selectedLocation || statusFilter !== 'all' || startDate || endDate;

  // Options
  const statusOptions = [
      { label: 'Todos Status', value: 'all' },
      { label: 'Pendentes', value: 'pending' },
      { label: 'Faturados', value: 'paid' },
      { label: 'Vencidos', value: 'overdue' },
  ];

  const locationOptions = [{ label: 'Todos Locais', value: '' }, ...locations.map(l => ({ label: l, value: l }))];
  const partnerOptions = [{ label: 'Todos Sócios', value: '' }, ...partners.map(p => ({ label: p.name, value: p.id }))];

  return (
    <div className="p-8 animate-in fade-in duration-500">
      
      {/* HEADER: Título (Esq) + Filtros/Ações (Dir) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-salomao-blue flex items-center gap-2">
            <DollarSign className="w-8 h-8" /> Controle Financeiro
          </h1>
          <div className="flex items-center mt-1">
             <p className="text-gray-500 mr-3">Gestão de faturamento, recebíveis e fluxo de caixa.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
            <FilterSelect icon={Filter} value={statusFilter} onChange={setStatusFilter} options={statusOptions} placeholder="Status" />
            <FilterSelect icon={MapPin} value={selectedLocation} onChange={setSelectedLocation} options={locationOptions} placeholder="Locais" />
            <FilterSelect icon={Briefcase} value={selectedPartner} onChange={setSelectedPartner} options={partnerOptions} placeholder="Sócios" />
            
            {userRole !== 'viewer' && (
                <button onClick={handleNewInvoice} className="bg-salomao-gold hover:bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-md transition-colors flex items-center font-bold h-[40px] whitespace-nowrap">
                    <Plus className="w-5 h-5 mr-2" /> Novo Faturamento
                </button>
            )}
        </div>
      </div>

      {/* CARDS DE TOTAIS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* CARD 1: ALERTA DE PARCELAS VENCIDAS - CLICÁVEL */}
        <div 
          onClick={totalOverdueCount > 0 ? handleFilterOverdue : undefined}
          className={`p-6 rounded-2xl shadow-sm border flex flex-col justify-center transition-all duration-300 ${
            totalOverdueCount > 0 
              ? 'bg-red-50 border-red-200 cursor-pointer hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]' 
              : 'bg-white border-gray-100'
          }`}
          title={totalOverdueCount > 0 ? `Clique para filtrar ${totalOverdueCount} parcela${totalOverdueCount !== 1 ? 's' : ''} vencida${totalOverdueCount !== 1 ? 's' : ''}` : ''}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
                <p className={`text-sm font-bold uppercase tracking-wider ${totalOverdueCount > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                    {totalOverdueCount > 0 ? '⚠️ Atenção: Atrasados' : 'A Receber (Qtd)'}
                </p>
                <h3 className={`text-3xl font-bold mt-1 ${totalOverdueCount > 0 ? 'text-red-700' : 'text-gray-800'}`}>
                    {totalPendingCount} <span className={`text-sm font-normal ${totalOverdueCount > 0 ? 'text-red-400' : 'text-gray-400'}`}>parcelas</span>
                </h3>
                {totalOverdueCount > 0 && (
                    <div className="flex items-center mt-2 gap-1">
                        <div className="flex items-center text-red-600 font-bold text-xs animate-pulse">
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            {totalOverdueCount} vencida{totalOverdueCount !== 1 ? 's' : ''}
                        </div>
                        <span className="text-red-500 font-normal text-xs">• Clique para filtrar</span>
                    </div>
                )}
            </div>
            <div className={`p-3 rounded-full ${totalOverdueCount > 0 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-blue-50 text-blue-500'}`}>
                {totalOverdueCount > 0 ? <AlertTriangle className="w-6 h-6" /> : <Hash className="w-6 h-6" />}
            </div>
          </div>
        </div>

        {/* CARD 2: PENDENTE R$ */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Pendente (R$)</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-1">{totalPending.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3>
            </div>
            <div className="bg-orange-50 p-3 rounded-full text-orange-500"><Clock className="w-6 h-6" /></div>
          </div>
        </div>

        {/* CARD 3: FATURADO R$ */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Faturado (R$)</p>
                <h3 className="text-3xl font-bold text-green-600 mt-1">{totalPaid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3>
            </div>
            <div className="bg-green-50 p-3 rounded-full text-green-500"><CheckCircle2 className="w-6 h-6" /></div>
          </div>
        </div>
      </div>

      {/* BARRA DE CONTROLES INFERIOR */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm items-center justify-between">
         {/* Total Count */}
         <div className="flex items-center gap-3 pr-4 border-r border-gray-100 mr-2 min-w-[200px]">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Receipt className="w-5 h-5" />
            </div>
            <div>
                <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">Total Lançamentos</p>
                <p className="text-xl font-bold text-gray-800 leading-none">{filteredInstallments.length}</p>
            </div>
         </div>

         {/* Ferramentas: Busca, Data, Export */}
         <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end flex-1">
            {/* Busca Animada */}
            <div 
              ref={searchRef}
              className={`
                flex items-center overflow-hidden transition-all duration-300 ease-in-out bg-white
                ${isSearchOpen ? 'w-64 border border-gray-200 shadow-sm px-3 rounded-lg' : 'w-10 border border-transparent justify-center cursor-pointer hover:bg-gray-50 rounded-lg'}
                h-[42px]
              `}
              onClick={() => !isSearchOpen && setIsSearchOpen(true)}
            >
                <Search className={`w-5 h-5 text-gray-400 shrink-0 ${!isSearchOpen && 'cursor-pointer'}`} />
                <input
                    type="text"
                    placeholder="Buscar..."
                    className={`ml-2 bg-transparent outline-none text-sm w-full text-gray-700 ${!isSearchOpen && 'hidden'}`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus={isSearchOpen}
                />
                {isSearchOpen && searchTerm && (
                    <button onClick={(e) => { e.stopPropagation(); setSearchTerm(''); }} className="ml-1 text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                )}
            </div>

            <div className="h-6 w-px bg-gray-200 mx-1 hidden md:block"></div>

            {/* Inputs de Data */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 h-[42px]">
                 <span className="text-xs text-gray-400 mr-2">De</span>
                 <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-sm text-gray-700 outline-none w-[110px]" />
              </div>
              <div className="flex items-center bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 h-[42px]">
                 <span className="text-xs text-gray-400 mr-2">Até</span>
                 <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-sm text-gray-700 outline-none w-[110px]" />
              </div>
            </div>

            {/* Exportar */}
            <button onClick={exportToExcel} className="flex items-center px-3 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium whitespace-nowrap h-[42px]">
                <Download className="w-4 h-4 mr-2" /> XLS
            </button>

            {/* Limpar Filtros */}
            {hasActiveFilters && (
                <button onClick={clearFilters} className="flex items-center px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors h-[42px]" title="Limpar Filtros">
                    <X className="w-4 h-4" />
                </button>
            )}
         </div>
      </div>

      {/* LISTAGEM */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-salomao-gold animate-spin" /></div>
      ) : filteredInstallments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-96">
               <EmptyState
                  icon={Receipt}
                  title="Nenhum lançamento encontrado"
                  description={hasActiveFilters ? "Nenhum resultado para os filtros aplicados." : "Ainda não existem lançamentos financeiros cadastrados."}
                  actionLabel={hasActiveFilters ? "Limpar Filtros" : undefined}
                  onAction={hasActiveFilters ? clearFilters : undefined}
                  className="h-full justify-center"
               />
          </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Vencimento</th>
                    <th className="p-3">Cliente</th>
                    <th className="p-3">HON / Cláusula</th>
                    <th className="p-3">Tipo / Parcela</th>
                    <th className="p-3">Sócio / Local</th>
                    <th className="p-3 text-right">Valor</th>
                    <th className="p-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredInstallments.map((item) => (
                  <tr 
                    key={item.id} 
                    className="hover:bg-gray-50 transition-colors cursor-pointer group"
                    onClick={() => handleNavigateToContract(item.contract!.id)}
                  >
                    <td className="p-3 font-mono text-gray-500">{(item.contract as any)?.display_id}</td>
                    <td className="p-3">
                      {item.status === 'paid' 
                        ? <span className="flex items-center text-green-600 font-bold uppercase"><CheckCircle2 className="w-3 h-3 mr-1" /> Faturado</span> 
                        : <span className="flex items-center text-orange-500 font-bold uppercase"><Circle className="w-3 h-3 mr-1" /> Pendente</span>
                      }
                    </td>
                    <td className="p-3">
                      {item.paid_at ? (
                        <span className="text-green-600 font-medium">Pago: {new Date(item.paid_at).toLocaleDateString()}</span>
                      ) : (
                        <span className={`font-medium ${isOverdue(item) ? "text-red-600 flex items-center" : "text-gray-700"}`}>
                          {isOverdue(item) && <AlertTriangle className="w-3 h-3 mr-1" />}
                          {item.due_date ? new Date(item.due_date).toLocaleDateString() : '-'}
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-medium text-gray-800">{item.contract?.client_name}</td>
                    <td className="p-3 text-gray-600">
                        <div>HON: {item.contract?.hon_number || '-'}</div>
                        <div className="text-[10px] text-gray-400 truncate max-w-[150px]">{(item as any).clause}</div>
                    </td>
                    <td className="p-3">
                        <div className="text-gray-700">{getTypeLabel(item.type)}</div>
                        <div className="text-[10px] text-gray-400">Parcela {item.installment_number}/{item.total_installments}</div>
                    </td>
                    <td className="p-3">
                        <div className="text-salomao-blue font-medium">{item.contract?.partner_name || '-'}</div>
                        <div className="text-[10px] text-gray-400">{item.contract?.billing_location || '-'}</div>
                    </td>
                    <td className="p-3 text-right font-bold text-gray-800">{item.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    <td className="p-3 text-right">
                      {item.status === 'pending' && userRole !== 'viewer' && (
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                          <button onClick={(e) => { e.stopPropagation(); handleEditDueDate(item); }} className="text-blue-600 hover:bg-blue-50 p-1 rounded" title="Alterar Vencimento"><CalendarDays className="w-4 h-4" /></button>
                          <button onClick={(e) => { e.stopPropagation(); handleDownloadContractPDF(item.contract!.id); }} className="text-gray-500 hover:bg-gray-100 p-1 rounded" title="Baixar PDF"><FileDown className="w-4 h-4" /></button>
                          <button onClick={(e) => { e.stopPropagation(); handleMarkAsPaid(item); }} className="bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded hover:bg-green-100 text-[10px] font-bold uppercase flex items-center"><DollarSign className="w-3 h-3 mr-1" /> Faturar</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: DATA DE FATURAMENTO */}
      {isDateModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-sm animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Confirmar Faturamento</h3>
            <p className="text-sm text-gray-500 mb-4">Confirma o recebimento desta parcela?</p>
            <label className="block text-sm font-medium text-gray-600 mb-2">Data do Recebimento</label>
            <input type="date" className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-salomao-blue outline-none mb-6" value={billingDate} onChange={(e) => setBillingDate(e.target.value)}/>
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsDateModalOpen(false)} className="text-gray-500 hover:text-gray-800 font-medium text-sm">Cancelar</button>
              <button onClick={confirmPayment} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 shadow-lg font-bold text-sm">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ALTERAR VENCIMENTO */}
      {isDueDateModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-sm animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Alterar Vencimento</h3>
            <label className="block text-sm font-medium text-gray-600 mb-2">Nova Data de Vencimento</label>
            <input type="date" className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-salomao-blue outline-none mb-6" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)}/>
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsDueDateModalOpen(false)} className="text-gray-500 hover:text-gray-800 font-medium text-sm">Cancelar</button>
              <button onClick={confirmDueDateChange} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-lg font-bold text-sm">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
