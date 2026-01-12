import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { DollarSign, Search, Download, CheckCircle2, Circle, Clock, Loader2, CalendarDays, Edit2 } from 'lucide-react';
import { FinancialInstallment, Partner } from '../types';
import { CustomSelect } from '../components/ui/CustomSelect';
import * as XLSX from 'xlsx';

export function Finance() {
  const [installments, setInstallments] = useState<FinancialInstallment[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
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
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    const { data: partnersData } = await supabase.from('partners').select('*').order('name');
    if (partnersData) setPartners(partnersData);

    const { data: installmentsData } = await supabase
      .from('financial_installments')
      .select(`
        *,
        contracts (
          id,
          hon_number,
          client_name,
          partner_id,
          billing_location,
          partners (name)
        )
      `)
      .order('due_date', { ascending: true });

    if (installmentsData) {
      const formatted = installmentsData.map((i: any) => ({
        ...i,
        contract: {
          ...i.contracts,
          partner_name: i.contracts?.partners?.name
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
      case 'fixed': return 'Valor Fixo'; // MUDANÇA PARA REFLETIR NOVO TIPO
      case 'other': return 'Outros';
      default: return type;
    }
  };

  const exportToExcel = () => {
    const data = filteredInstallments.map(i => ({
      'Cliente': i.contract?.client_name,
      'HON': i.contract?.hon_number,
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

  const filteredInstallments = installments.filter(i => {
    const matchesSearch = i.contract?.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) || i.contract?.hon_number?.includes(searchTerm);
    const matchesPartner = selectedPartner ? i.contract?.partner_id === selectedPartner : true;
    const matchesLocation = selectedLocation ? i.contract?.billing_location === selectedLocation : true;
    return matchesSearch && matchesPartner && matchesLocation;
  });

  const totalPending = filteredInstallments.filter(i => i.status === 'pending').reduce((acc, curr) => acc + curr.amount, 0);
  const totalPaid = filteredInstallments.filter(i => i.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0);

  // --- CÁLCULO DETALHADO POR SÓCIO (NOVO) ---
  const partnerStats = partners.map(p => {
    const partnerInstallments = filteredInstallments.filter(i => i.contract?.partner_id === p.id);
    
    const pendingTotal = partnerInstallments.filter(i => i.status === 'pending').reduce((acc, curr) => acc + curr.amount, 0);
    const paidTotal = partnerInstallments.filter(i => i.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0);

    // Subtotais (independente se pago ou não, para visão geral, ou podemos filtrar)
    // Aqui vou somar TUDO (pago + pendente) por categoria para o resumo, ou apenas pendente?
    // O pedido foi "total de valores por socio (valor a faturar e valor faturado), separado por..."
    // Vou separar os subtotais globais (pago + pendente) para simplificar a visualização no card
    
    const pendingProLabore = partnerInstallments.filter(i => i.status === 'pending' && i.type === 'pro_labore').reduce((acc, curr) => acc + curr.amount, 0);
    const pendingExitos = partnerInstallments.filter(i => i.status === 'pending' && ['success_fee', 'final_success_fee', 'intermediate_fee'].includes(i.type)).reduce((acc, curr) => acc + curr.amount, 0);
    const pendingFixed = partnerInstallments.filter(i => i.status === 'pending' && i.type === 'fixed').reduce((acc, curr) => acc + curr.amount, 0);

    const paidProLabore = partnerInstallments.filter(i => i.status === 'paid' && i.type === 'pro_labore').reduce((acc, curr) => acc + curr.amount, 0);
    const paidExitos = partnerInstallments.filter(i => i.status === 'paid' && ['success_fee', 'final_success_fee', 'intermediate_fee'].includes(i.type)).reduce((acc, curr) => acc + curr.amount, 0);
    const paidFixed = partnerInstallments.filter(i => i.status === 'paid' && i.type === 'fixed').reduce((acc, curr) => acc + curr.amount, 0);

    return { 
      name: p.name, 
      pendingTotal, 
      paidTotal,
      pendingDetails: { proLabore: pendingProLabore, exitos: pendingExitos, fixed: pendingFixed },
      paidDetails: { proLabore: paidProLabore, exitos: paidExitos, fixed: paidFixed }
    };
  }).filter(s => s.pendingTotal > 0 || s.paidTotal > 0);

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-salomao-blue flex items-center gap-2">
            <DollarSign className="w-8 h-8" /> Controle Financeiro
          </h1>
          <p className="text-gray-500 mt-1">Gestão de faturamento e recebíveis.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* CARD A FATURAR */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div><p className="text-sm font-bold text-gray-400 uppercase tracking-wider">A Faturar (Pendente)</p><h3 className="text-3xl font-bold text-gray-800 mt-1">{totalPending.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3></div>
            <div className="bg-orange-50 p-3 rounded-full text-orange-500"><Clock className="w-6 h-6" /></div>
          </div>
          <div className="border-t border-gray-100 pt-3 mt-2 space-y-3">
            {partnerStats.map((stat, idx) => stat.pendingTotal > 0 && (
              <div key={idx} className="text-xs">
                <div className="flex justify-between font-bold text-gray-700 mb-1">
                  <span>{stat.name}</span>
                  <span>{stat.pendingTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
                <div className="grid grid-cols-3 gap-1 text-[10px] text-gray-500 pl-2 border-l-2 border-orange-100">
                  <div>PL: {stat.pendingDetails.proLabore.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                  <div>Êxito: {stat.pendingDetails.exitos.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                  <div>Fixo: {stat.pendingDetails.fixed.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CARD FATURADO */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div><p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Faturado</p><h3 className="text-3xl font-bold text-green-600 mt-1">{totalPaid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3></div>
            <div className="bg-green-50 p-3 rounded-full text-green-500"><CheckCircle2 className="w-6 h-6" /></div>
          </div>
          <div className="border-t border-gray-100 pt-3 mt-2 space-y-3">
            {partnerStats.map((stat, idx) => stat.paidTotal > 0 && (
              <div key={idx} className="text-xs">
                <div className="flex justify-between font-bold text-gray-700 mb-1">
                  <span>{stat.name}</span>
                  <span className="text-green-600">{stat.paidTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
                <div className="grid grid-cols-3 gap-1 text-[10px] text-gray-500 pl-2 border-l-2 border-green-100">
                  <div>PL: {stat.paidDetails.proLabore.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                  <div>Êxito: {stat.paidDetails.exitos.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                  <div>Fixo: {stat.paidDetails.fixed.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col xl:flex-row gap-4 items-center">
        <div className="flex-1 w-full relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" /><input type="text" placeholder="Buscar por cliente, HON..." className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-salomao-blue outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto items-center">
          <div className="w-full sm:w-48"><CustomSelect value={selectedPartner} onChange={setSelectedPartner} options={[{ label: 'Todos Sócios', value: '' }, ...partners.map(p => ({ label: p.name, value: p.id }))]} placeholder="Sócio" /></div>
          <div className="w-full sm:w-48"><CustomSelect value={selectedLocation} onChange={setSelectedLocation} options={[{ label: 'Todos Locais', value: '' }, ...locations.map(l => ({ label: l, value: l }))]} placeholder="Local Faturamento" /></div>
          <button onClick={exportToExcel} className="bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition-colors shadow-sm font-medium flex items-center justify-center min-w-[100px]"><Download className="w-4 h-4 mr-2" /> XLS</button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-salomao-gold animate-spin" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-bold border-b border-gray-100">
                <tr><th className="px-6 py-4">Status / HON</th><th className="px-6 py-4">Vencimento</th><th className="px-6 py-4">Cliente</th><th className="px-6 py-4">Tipo / Parcela</th><th className="px-6 py-4">Sócio / Local</th><th className="px-6 py-4 text-right">Valor</th><th className="px-6 py-4 text-right">Ação</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredInstallments.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      {item.status === 'paid' ? <span className="flex items-center text-green-600 font-bold text-xs uppercase mb-1"><CheckCircle2 className="w-4 h-4 mr-1" /> Faturado</span> : <span className="flex items-center text-orange-500 font-bold text-xs uppercase mb-1"><Circle className="w-4 h-4 mr-1" /> Pendente</span>}
                      <div className="text-xs font-mono text-gray-500">HON: {item.contract?.hon_number || '-'}</div>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono">{item.paid_at ? <span className="text-green-600">Pago: {new Date(item.paid_at).toLocaleDateString()}</span> : item.due_date ? new Date(item.due_date).toLocaleDateString() : '-'}</td>
                    <td className="px-6 py-4"><div className="font-bold text-gray-800">{item.contract?.client_name}</div></td>
                    <td className="px-6 py-4"><div className="text-gray-700 font-medium">{getTypeLabel(item.type)}</div><div className="text-xs text-gray-400">Parcela {item.installment_number}/{item.total_installments}</div></td>
                    <td className="px-6 py-4 text-xs"><div className="text-salomao-blue font-medium">{item.contract?.partner_name || '-'}</div><div className="text-gray-400">{item.contract?.billing_location || '-'}</div></td>
                    <td className="px-6 py-4 text-right font-bold text-gray-800">{item.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    <td className="px-6 py-4 text-right">
                      {item.status === 'pending' && (
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