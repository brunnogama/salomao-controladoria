import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { DollarSign, Search, Download, CheckCircle2, Circle, Clock, Loader2, CalendarDays, Receipt, X, Filter, Shield, Hash } from 'lucide-react';
import { FinancialInstallment, Partner } from '../types';
import { CustomSelect } from '../components/ui/CustomSelect';
import { EmptyState } from '../components/ui/EmptyState';
import * as XLSX from 'xlsx';

export function Finance() {
  // --- ROLE STATE ---
  const [userRole, setUserRole] = useState<'admin' | 'editor' | 'viewer' | null>(null);

  const [installments, setInstallments] = useState<FinancialInstallment[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [selectedPartner, setSelectedPartner] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<FinancialInstallment | null>(null);
  const [billingDate, setBillingDate] = useState(new Date().toISOString().split('T')[0]);

  const [isDueDateModalOpen, setIsDueDateModalOpen] = useState(false);
  const [installmentToEdit, setInstallmentToEdit] = useState<FinancialInstallment | null>(null);
  const [newDueDate, setNewDueDate] = useState('');

  const [locations, setLocations] = useState<string[]>([]);

  useEffect(() => {
    checkUserRole();
    fetchData();

    // Click outside handler for search
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        if (searchTerm === '') {
          setIsSearchExpanded(false);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchTerm]);

  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchExpanded]);

  // --- ROLE CHECK ---
  const checkUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
        if (profile) {
            setUserRole(profile.role as 'admin' | 'editor' | 'viewer');
        }
    }
  };

  const fetchData = async () => {
    setLoading(true);
    
    // Busca parceiros
    const { data: partnersData } = await supabase.from('partners').select('*').order('name');
    if (partnersData) setPartners(partnersData);

    // Busca parcelas trazendo o ID fixo (seq_id) e STATUS do contrato
    const { data: installmentsData } = await supabase
      .from('financial_installments')
      .select(`
        *,
        contracts (
          id,
          seq_id,
          hon_number,
          client_name,
          partner_id,
          billing_location,
          status,
          partners (name)
        )
      `)
      .order('due_date', { ascending: true });

    if (installmentsData) {
      // Filtrar apenas parcelas de contratos que estão ATIVOS (active)
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

  const handleMarkAsPaid = (installment: FinancialInstallment) => {
    setSelectedInstallment(installment);
    setBillingDate(new Date().toISOString().split('T')[0]);
    setIsDateModalOpen(true);
  };

  const confirmPayment = async () => {
    if (!selectedInstallment) return;
    
    await supabase
      .from('financial_installments')
      .update({ status: 'paid', paid_at: billingDate })
      .eq('id', selectedInstallment.id);
    
    setIsDateModalOpen(false);
    fetchData();
  };

  const handleEditDueDate = (installment: FinancialInstallment) => {
    setInstallmentToEdit(installment);
    setNewDueDate(installment.due_date ? installment.due_date.split('T')[0] : '');
    setIsDueDateModalOpen(true);
  };

  const confirmDueDateChange = async () => {
    if (!installmentToEdit || !newDueDate) return;

    await supabase
      .from('financial_installments')
      .update({ due_date: newDueDate })
      .eq('id', installmentToEdit.id);

    setIsDueDateModalOpen(false);
    fetchData();
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'pro_labore': return 'Pró-Labore';
      case 'success_fee': return 'Êxito (Geral)';
      case 'final_success_fee': return 'Êxito Final';
      case 'intermediate_fee': return 'Êxito Intermediário';
      case 'fixed': 
      case 'fixed_monthly_fee': return 'Honorários Mensais';
      case 'other': 
      case 'other_fees': return 'Outros Honorários';
      default: return type;
    }
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
      setIsSearchExpanded(false);
  };

  const filteredInstallments = installments.filter(i => {
    const matchesSearch = i.contract?.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          i.contract?.hon_number?.includes(searchTerm) ||
                          (i.contract as any)?.display_id?.includes(searchTerm);
    const matchesPartner = selectedPartner ? i.contract?.partner_id === selectedPartner : true;
    const matchesLocation = selectedLocation ? i.contract?.billing_location === selectedLocation : true;
    return matchesSearch && matchesPartner && matchesLocation;
  });

  const totalPending = filteredInstallments.filter(i => i.status === 'pending').reduce((acc, curr) => acc + curr.amount, 0);
  const totalPaid = filteredInstallments.filter(i => i.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0);
  
  // Novo cálculo: Quantidade de parcelas pendentes
  const totalPendingCount = filteredInstallments.filter(i => i.status === 'pending').length;

  // --- CÁLCULO DISCRIMINADO ---
  const calculateBreakdown = (status: 'pending' | 'paid') => {
      const list = filteredInstallments.filter(i => i.status === status);
      const proLabore = list.filter(i => i.type === 'pro_labore').reduce((acc, curr) => acc + curr.amount, 0);
      const exitos = list.filter(i => ['success_fee', 'final_success_fee', 'intermediate_fee'].includes(i.type)).reduce((acc, curr) => acc + curr.amount, 0);
      const fixed = list.filter(i => ['fixed', 'fixed_monthly_fee'].includes(i.type)).reduce((acc, curr) => acc + curr.amount, 0);
      const other = list.filter(i => ['other', 'other_fees'].includes(i.type)).reduce((acc, curr) => acc + curr.amount, 0);
      
      return { proLabore, exitos, fixed, other };
  };

  const pendingBreakdown = calculateBreakdown('pending');
  const paidBreakdown = calculateBreakdown('paid');

  const hasActiveFilters = searchTerm || selectedPartner || selectedLocation;

  const BreakdownItem = ({ label, value, colorClass }: { label: string, value: number, colorClass: string }) => (
      <div className="flex justify-between items-center text-xs py-1 border-b border-gray-50 last:border-0">
          <span className="text-gray-500">{label}</span>
          <span className={`font-bold ${colorClass}`}>{value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
      </div>
  );

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-salomao-blue flex items-center gap-2">
            <DollarSign className="w-8 h-8" /> Controle Financeiro
          </h1>
          <p className="text-gray-500 mt-1">Gestão de faturamento e recebíveis.</p>
        </div>
      </div>

      {/* ÁREA DE FILTROS E AÇÕES */}
      <div className="flex flex-col xl:flex-row gap-4 items-center justify-between">
        {/* Filtros à Esquerda */}
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
          <div className="w-full sm:w-48">
              <CustomSelect 
                value={selectedPartner} 
                onChange={setSelectedPartner} 
                options={[{ label: 'Todos Sócios', value: '' }, ...partners.map(p => ({ label: p.name, value: p.id }))]} 
                placeholder="Sócio" 
              />
          </div>
          <div className="w-full sm:w-48">
              <CustomSelect 
                value={selectedLocation} 
                onChange={setSelectedLocation} 
                options={[{ label: 'Todos Locais', value: '' }, ...locations.map(l => ({ label: l, value: l }))]} 
                placeholder="Local Faturamento" 
              />
          </div>
        </div>

        {/* Ações e Pesquisa à Direita */}
        <div className="flex items-center gap-3 w-full xl:w-auto justify-end">
            {hasActiveFilters && (
              <button 
                onClick={clearFilters} 
                className="text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
              >
                  <X className="w-4 h-4" /> Limpar
              </button>
            )}

            {/* Pesquisa Expansível */}
            <div 
              ref={searchContainerRef}
              className={`flex items-center bg-white border transition-all duration-300 ease-out rounded-full overflow-hidden ${
                isSearchExpanded ? 'w-64 border-salomao-blue ring-2 ring-salomao-blue/10 shadow-sm' : 'w-10 border-transparent bg-transparent'
              }`}
            >
              <button 
                onClick={() => setIsSearchExpanded(true)}
                className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
                  isSearchExpanded ? 'text-salomao-blue' : 'text-gray-400 hover:text-salomao-blue hover:bg-gray-100'
                }`}
              >
                <Search className="w-5 h-5" />
              </button>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar financeiro..."
                className={`w-full bg-transparent border-none focus:ring-0 text-sm text-gray-700 placeholder-gray-400 px-2 ${
                  isSearchExpanded ? 'opacity-100' : 'opacity-0'
                }`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <button 
              onClick={exportToExcel} 
              className="bg-green-600 text-white w-10 h-10 rounded-full hover:bg-green-700 transition-all shadow-sm flex items-center justify-center"
              title="Exportar Excel"
            >
              <Download className="w-4 h-4" />
            </button>
        </div>
      </div>

      {/* CARDS DE TOTAIS (Grid de 3) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* CARD QUANTIDADE */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden flex flex-col justify-center">
          <div className="flex items-center justify-between mb-2">
            <div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Parcelas a Receber</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-1">{totalPendingCount}</h3>
            </div>
            <div className="bg-blue-50 p-3 rounded-full text-blue-500"><Hash className="w-6 h-6" /></div>
          </div>
          <p className="text-xs text-gray-400 mt-1">Lançamentos pendentes</p>
        </div>

        {/* CARD A FATURAR */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden flex flex-col justify-center">
          <div className="flex items-center justify-between mb-2">
            <div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">A Faturar (R$)</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-1">{totalPending.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3>
            </div>
            <div className="bg-orange-50 p-3 rounded-full text-orange-500"><Clock className="w-6 h-6" /></div>
          </div>
          
          {selectedPartner && (
              <div className="mt-4 pt-3 border-t border-gray-100 animate-in slide-in-from-top-2">
                  <div className="space-y-1">
                      <BreakdownItem label="Pró-Labore" value={pendingBreakdown.proLabore} colorClass="text-gray-700" />
                      <BreakdownItem label="Êxito" value={pendingBreakdown.exitos} colorClass="text-gray-700" />
                  </div>
              </div>
          )}
        </div>

        {/* CARD FATURADO */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden flex flex-col justify-center">
          <div className="flex items-center justify-between mb-2">
            <div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Faturado (R$)</p>
                <h3 className="text-3xl font-bold text-green-600 mt-1">{totalPaid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3>
            </div>
            <div className="bg-green-50 p-3 rounded-full text-green-500"><CheckCircle2 className="w-6 h-6" /></div>
          </div>

          {selectedPartner && (
              <div className="mt-4 pt-3 border-t border-gray-100 animate-in slide-in-from-top-2">
                  <div className="space-y-1">
                      <BreakdownItem label="Pró-Labore" value={paidBreakdown.proLabore} colorClass="text-green-700" />
                      <BreakdownItem label="Êxito" value={paidBreakdown.exitos} colorClass="text-green-700" />
                  </div>
              </div>
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
                  description={
                      hasActiveFilters
                      ? "Nenhum resultado para os filtros aplicados."
                      : "Ainda não existem lançamentos financeiros cadastrados."
                  }
                  actionLabel={hasActiveFilters ? "Limpar Filtros" : undefined}
                  onAction={hasActiveFilters ? clearFilters : undefined}
                  className="h-full justify-center"
               />
          </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-bold border-b border-gray-100">
                <tr><th className="px-6 py-4">ID</th><th className="px-6 py-4">Status / HON</th><th className="px-6 py-4">Vencimento</th><th className="px-6 py-4">Cláusula</th><th className="px-6 py-4">Cliente</th><th className="px-6 py-4">Tipo / Parcela</th><th className="px-6 py-4">Sócio / Local</th><th className="px-6 py-4 text-right">Valor</th><th className="px-6 py-4 text-right">Ação</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredInstallments.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">{(item.contract as any)?.display_id}</td>
                    <td className="px-6 py-4">
                      {item.status === 'paid' ? <span className="flex items-center text-green-600 font-bold text-xs uppercase mb-1"><CheckCircle2 className="w-4 h-4 mr-1" /> Faturado</span> : <span className="flex items-center text-orange-500 font-bold text-xs uppercase mb-1"><Circle className="w-4 h-4 mr-1" /> Pendente</span>}
                      <div className="text-xs font-mono text-gray-500">HON: {item.contract?.hon_number || '-'}</div>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono">{item.paid_at ? <span className="text-green-600">Pago: {new Date(item.paid_at).toLocaleDateString()}</span> : item.due_date ? new Date(item.due_date).toLocaleDateString() : '-'}</td>
                    <td className="px-6 py-4 text-xs font-bold text-gray-700">{(item as any).clause || '-'}</td>
                    <td className="px-6 py-4"><div className="font-bold text-gray-800">{item.contract?.client_name}</div></td>
                    <td className="px-6 py-4"><div className="text-gray-700 font-medium">{getTypeLabel(item.type)}</div><div className="text-xs text-gray-400">Parcela {item.installment_number}/{item.total_installments}</div></td>
                    <td className="px-6 py-4 text-xs"><div className="text-salomao-blue font-medium">{item.contract?.partner_name || '-'}</div><div className="text-gray-400">{item.contract?.billing_location || '-'}</div></td>
                    <td className="px-6 py-4 text-right font-bold text-gray-800">{item.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    <td className="px-6 py-4 text-right">
                      {item.status === 'pending' && userRole !== 'viewer' && (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleEditDueDate(item)} className="bg-blue-50 text-blue-700 border border-blue-200 p-1.5 rounded-lg hover:bg-blue-100 transition-colors" title="Alterar Vencimento"><CalendarDays className="w-4 h-4" /></button>
                          <button onClick={() => handleMarkAsPaid(item)} className="bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors text-xs font-bold flex items-center"><DollarSign className="w-3 h-3 mr-1" /> Faturar</button>
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

      {isDateModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-sm animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Confirmar Faturamento</h3>
            <p className="text-sm text-gray-500 mb-4">Tem certeza que deseja faturar esta parcela?</p>
            <label className="block text-sm font-medium text-gray-600 mb-2">Data do Faturamento</label>
            <input type="date" className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-salomao-blue outline-none mb-6" value={billingDate} onChange={(e) => setBillingDate(e.target.value)}/>
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsDateModalOpen(false)} className="text-gray-500 hover:text-gray-800 font-medium text-sm">Cancelar</button>
              <button onClick={confirmPayment} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 shadow-lg font-bold text-sm">Confirmar Faturamento</button>
            </div>
          </div>
        </div>
      )}

      {isDueDateModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-sm animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Alterar Vencimento</h3>
            <label className="block text-sm font-medium text-gray-600 mb-2">Nova Data de Vencimento</label>
            <input type="date" className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-salomao-blue outline-none mb-6" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)}/>
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsDueDateModalOpen(false)} className="text-gray-500 hover:text-gray-800 font-medium text-sm">Cancelar</button>
              <button onClick={confirmDueDateChange} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-lg font-bold text-sm">Salvar Nova Data</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}