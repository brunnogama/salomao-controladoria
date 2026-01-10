import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { maskCNPJ, maskCNJ, maskMoney, maskHon, unmaskMoney, toTitleCase } from '../utils/masks';
import { Search, Plus, Filter, FileSpreadsheet, LayoutGrid, List as ListIcon, Trash2, Edit, X, Save, Settings, Check, ChevronDown, Clock, ArrowDownAZ, Calendar } from 'lucide-react';
import * as XLSX from 'xlsx';

// --- TYPES ---
interface Partner { id: string; name: string; active: boolean; }
interface ContractProcess {
  id?: string;
  process_number: string;
  cause_value: string;
  court: string;
  judge: string;
}
interface Contract {
  id?: string;
  status: 'analysis' | 'proposal' | 'active' | 'rejected' | 'probono';
  cnpj: string;
  has_no_cnpj: boolean;
  client_name: string;
  client_position: string;
  company_name: string;
  has_legal_process: boolean;
  uf: string;
  area: string;
  partner_id: string;
  observations: string;
  
  // Specifics
  prospect_date?: string;
  analyzed_by?: string;
  proposal_date?: string;
  contract_date?: string;
  hon_number?: string;
  rejection_date?: string;
  rejected_by?: string;
  rejection_reason?: string;
  probono_date?: string;
  
  // Financial
  pro_labore?: string;
  final_success_fee?: string;
  final_success_percent?: string;
  intermediate_fees?: string[];
  timesheet?: boolean;
  other_fees?: string;
}

// --- CONSTANTS ---
const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

export function Contracts() {
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [contracts, setContracts] = useState<any[]>([]);
  
  // Partner Management State
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isManagingPartners, setIsManagingPartners] = useState(false);
  const [newPartnerName, setNewPartnerName] = useState('');
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);

  // Form State
  const initialFormState: Contract = {
    status: 'analysis',
    cnpj: '',
    has_no_cnpj: false,
    client_name: '',
    client_position: 'Autor',
    company_name: '',
    has_legal_process: true,
    uf: '',
    area: '',
    partner_id: '',
    observations: '',
    intermediate_fees: [],
    timesheet: false
  };
  const [formData, setFormData] = useState<Contract>(initialFormState);
  
  // Process State
  const [processes, setProcesses] = useState<ContractProcess[]>([]);
  const [currentProcess, setCurrentProcess] = useState<ContractProcess>({ process_number: '', cause_value: '', court: '', judge: '' });
  const [editingProcessIndex, setEditingProcessIndex] = useState<number | null>(null);

  // Fee State
  const [newIntermediateFee, setNewIntermediateFee] = useState('');

  // Filters & Sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [partnerFilter, setPartnerFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<'name' | 'date'>('name');

  // --- INIT ---
  useEffect(() => {
    fetchPartners();
    fetchContracts();
  }, []);

  // --- DATA FETCHING ---
  const fetchPartners = async () => {
    const { data } = await supabase.from('partners').select('*').eq('active', true).order('name');
    if (data) setPartners(data);
  };

  const fetchContracts = async () => {
    setLoading(true);
    let query = supabase.from('contracts').select(`
      *,
      clients(name),
      partners(name),
      contract_processes(count)
    `);

    const { data, error } = await query;
    if (!error && data) {
      const formatted = data.map(d => ({
        ...d,
        client_name: d.clients?.name,
        partner_name: d.partners?.name,
        process_count: d.contract_processes?.[0]?.count || 0,
        ...d.financial_data
      }));
      setContracts(formatted);
    }
    setLoading(false);
  };

  // --- FILTERING & SORTING LOGIC ---
  const filteredAndSortedContracts = contracts
    .filter(c => {
      const matchesStatus = statusFilter ? c.status === statusFilter : true;
      const matchesPartner = partnerFilter ? c.partner_id === partnerFilter : true;
      const matchesSearch = searchTerm ? 
        (c.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
         c.hon_number?.includes(searchTerm)) : true;
      return matchesStatus && matchesPartner && matchesSearch;
    })
    .sort((a, b) => {
      if (sortOrder === 'name') {
        return (a.client_name || '').localeCompare(b.client_name || '');
      } else {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  // --- PARTNER ACTIONS ---
  const handleAddPartner = async () => {
    if (!newPartnerName) return;
    const { data, error } = await supabase.from('partners').insert({ name: toTitleCase(newPartnerName) }).select().single();
    if (!error && data) {
      setPartners([...partners, data]);
      setNewPartnerName('');
    }
  };

  const handleUpdatePartner = async () => {
    if (!editingPartner || !newPartnerName) return;
    const { error } = await supabase.from('partners').update({ name: toTitleCase(newPartnerName) }).eq('id', editingPartner.id);
    if (!error) {
      setPartners(partners.map(p => p.id === editingPartner.id ? { ...p, name: toTitleCase(newPartnerName) } : p));
      setEditingPartner(null);
      setNewPartnerName('');
    }
  };

  const handleDeletePartner = async (id: string) => {
    const { error } = await supabase.from('partners').update({ active: false }).eq('id', id);
    if (!error) {
      setPartners(partners.filter(p => p.id !== id));
    }
  };

  // --- FORM ACTIONS ---
  const handleCNPJSearch = async () => {
    const cleanCNPJ = formData.cnpj.replace(/\D/g, '');
    if (cleanCNPJ.length !== 14) return alert('CNPJ inválido');
    setLoading(true);
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCNPJ}`);
      const data = await response.json();
      if (data.razao_social) {
        setFormData(prev => ({ ...prev, client_name: toTitleCase(data.razao_social) }));
      }
    } catch (e) {
      alert('Erro ao buscar CNPJ. Preencha manualmente.');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessAction = () => {
    if (!currentProcess.process_number) return;
    if (editingProcessIndex !== null) {
      const updated = [...processes];
      updated[editingProcessIndex] = currentProcess;
      setProcesses(updated);
      setEditingProcessIndex(null);
    } else {
      setProcesses(prev => [...prev, currentProcess]);
    }
    setCurrentProcess({ process_number: '', cause_value: '', court: '', judge: '' });
  };

  const editProcess = (index: number) => {
    setCurrentProcess(processes[index]);
    setEditingProcessIndex(index);
  };

  const removeProcess = (index: number) => {
    setProcesses(processes.filter((_, i) => i !== index));
  };

  const addIntermediateFee = () => {
    if (!newIntermediateFee) return;
    setFormData(prev => ({
      ...prev,
      intermediate_fees: [...(prev.intermediate_fees || []), newIntermediateFee]
    }));
    setNewIntermediateFee('');
  };

  const removeIntermediateFee = (index: number) => {
    setFormData(prev => ({
      ...prev,
      intermediate_fees: (prev.intermediate_fees || []).filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let clientId = null;
      if (formData.cnpj) {
        const { data } = await supabase.from('clients').upsert({ cnpj: formData.cnpj, name: formData.client_name }, { onConflict: 'cnpj' }).select('id').single();
        clientId = data?.id;
      } else {
        const { data } = await supabase.from('clients').insert({ name: formData.client_name }).select('id').single();
        clientId = data?.id;
      }

      const financialData = {
        pro_labore: formData.pro_labore,
        final_success_fee: formData.final_success_fee,
        final_success_percent: formData.final_success_percent,
        intermediate_fees: formData.intermediate_fees,
        other_fees: formData.other_fees,
        timesheet: formData.timesheet
      };

      const { data: contractData, error } = await supabase.from('contracts').upsert({
        status: formData.status,
        client_id: clientId,
        client_position: formData.client_position,
        company_name: formData.company_name,
        has_legal_process: formData.has_legal_process,
        uf: formData.uf,
        area: formData.area,
        partner_id: formData.partner_id,
        observations: formData.observations,
        prospect_date: formData.prospect_date || null,
        analyzed_by: formData.analyzed_by,
        proposal_date: formData.proposal_date || null,
        contract_date: formData.contract_date || null,
        hon_number: formData.hon_number,
        rejection_date: formData.rejection_date || null,
        rejected_by: formData.rejected_by,
        rejection_reason: formData.rejection_reason,
        probono_date: formData.probono_date || null,
        financial_data: financialData
      }).select('id').single();

      if (error) throw error;

      if (contractData && processes.length > 0) {
        await supabase.from('contract_processes').delete().eq('contract_id', contractData.id);
        const processesToSave = processes.map(p => ({
          contract_id: contractData.id,
          process_number: p.process_number,
          cause_value: unmaskMoney(p.cause_value),
          court: p.court,
          judge: p.judge
        }));
        await supabase.from('contract_processes').insert(processesToSave);
      }

      setIsModalOpen(false);
      fetchContracts();
      setFormData(initialFormState);
      setProcesses([]);
    } catch (error: any) {
      alert('Erro ao salvar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(contracts);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Contratos");
    XLSX.writeFile(wb, "salomao_contratos.xlsx");
  };

  // --- HELPERS ---
  const handleTextChange = (field: keyof Contract, value: string) => {
    setFormData({ ...formData, [field]: toTitleCase(value) });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'analysis': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'proposal': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'probono': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100';
    }
  };

  const getStatusLabel = (status: string) => {
    const map: any = { 'analysis': 'Sob Análise', 'proposal': 'Proposta Enviada', 'active': 'Contrato Fechado', 'rejected': 'Rejeitado', 'probono': 'Probono' };
    return map[status] || status;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestão de Contratos</h1>
          <p className="text-gray-500 text-sm">Controle unificado de casos, clientes e jurimetria.</p>
        </div>
        <button 
          onClick={() => { setFormData(initialFormState); setIsModalOpen(true); }}
          className="bg-salomao-gold hover:bg-yellow-600 text-white px-4 py-2 rounded-lg flex items-center shadow-lg transition-all"
        >
          <Plus className="w-5 h-5 mr-2" />
          Novo Caso
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search & Filters */}
        <div className="flex flex-1 gap-3 w-full">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Buscar por cliente..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-salomao-blue outline-none"
            />
          </div>
          
          <select 
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-salomao-blue"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todos Status</option>
            <option value="analysis">Sob Análise</option>
            <option value="proposal">Proposta Enviada</option>
            <option value="active">Contrato Fechado</option>
            <option value="rejected">Rejeitado</option>
          </select>

          <select 
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-salomao-blue"
            value={partnerFilter}
            onChange={(e) => setPartnerFilter(e.target.value)}
          >
            <option value="">Todos Sócios</option>
            {partners.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Tools: Sort, Export, View */}
        <div className="flex items-center gap-3 border-l pl-4 border-gray-200">
           {/* Sorting */}
           <div className="flex bg-gray-100 rounded-lg p-1 mr-2">
            <button 
              onClick={() => setSortOrder('name')} 
              className={`p-1.5 rounded flex items-center gap-1 text-xs font-medium transition-all ${sortOrder === 'name' ? 'bg-white shadow text-salomao-blue' : 'text-gray-400'}`}
              title="Ordenar por Nome"
            >
              <ArrowDownAZ className="w-4 h-4" /> Nome
            </button>
            <button 
              onClick={() => setSortOrder('date')} 
              className={`p-1.5 rounded flex items-center gap-1 text-xs font-medium transition-all ${sortOrder === 'date' ? 'bg-white shadow text-salomao-blue' : 'text-gray-400'}`}
              title="Ordenar por Data"
            >
              <Calendar className="w-4 h-4" /> Data
            </button>
           </div>

          <button onClick={exportToExcel} className="text-green-600 hover:bg-green-50 p-2 rounded-lg transition-colors" title="Exportar Excel">
            <FileSpreadsheet className="w-5 h-5" />
          </button>
          
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow text-salomao-blue' : 'text-gray-400'}`}>
              <ListIcon className="w-5 h-5" />
            </button>
            <button onClick={() => setViewMode('card')} className={`p-1.5 rounded ${viewMode === 'card' ? 'bg-white shadow text-salomao-blue' : 'text-gray-400'}`}>
              <LayoutGrid className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'list' ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Cliente</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Sócio Responsável</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Proc. Vinculados</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAndSortedContracts.length === 0 ? (
                 <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-400">Nenhum contrato encontrado com esses filtros.</td>
                 </tr>
              ) : (
                filteredAndSortedContracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(contract.status)}`}>
                        {getStatusLabel(contract.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{contract.client_name} <span className="text-gray-400 text-xs font-normal">({contract.client_position})</span></td>
                    <td className="px-6 py-4 text-gray-600 flex items-center gap-2">
                       <div className="w-6 h-6 rounded-full bg-salomao-blue text-white flex items-center justify-center text-xs">
                          {contract.partner_name?.charAt(0)}
                       </div>
                       {contract.partner_name || '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-600"><span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-bold text-gray-700">{contract.process_count}</span></td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredAndSortedContracts.map(c => (
             <div key={c.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(c.status)}`}>{getStatusLabel(c.status)}</span>
                </div>
                <h3 className="font-bold text-gray-800 text-lg mb-1">{c.client_name}</h3>
                <p className="text-sm text-gray-500 mb-4">{c.client_position}</p>
                <div className="border-t pt-4 flex justify-between items-center text-xs text-gray-500">
                   <span>{c.process_count} Processos</span>
                   <span className="font-semibold text-salomao-blue">{c.partner_name}</span>
                </div>
             </div>
          ))}
        </div>
      )}

      {/* --- MODAL (Mantido igual) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[95vh] animate-in fade-in zoom-in duration-200">
            
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Novo Caso / Contrato</h2>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Cadastro Unificado</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500"><X className="w-6 h-6" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              
              <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100">
                <label className="block text-sm font-bold text-gray-700 mb-2">Status Atual do Caso</label>
                <div className="relative">
                  <select 
                    className="w-full p-3 border border-blue-200 rounded-lg bg-white font-medium text-salomao-blue appearance-none focus:ring-2 focus:ring-salomao-blue outline-none"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                  >
                    <option value="analysis">Sob Análise</option>
                    <option value="proposal">Proposta Enviada</option>
                    <option value="active">Contrato Fechado</option>
                    <option value="rejected">Rejeitada</option>
                    <option value="probono">Probono</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-salomao-blue w-5 h-5 pointer-events-none" />
                </div>
              </div>

              <section className="space-y-5">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b pb-2">Dados do Cliente</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                  <div className="md:col-span-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">CNPJ/CPF</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        disabled={formData.has_no_cnpj}
                        className="flex-1 border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-salomao-blue disabled:bg-gray-100"
                        placeholder="00.000.000/0000-00"
                        value={formData.cnpj}
                        onChange={(e) => setFormData({...formData, cnpj: maskCNPJ(e.target.value)})}
                      />
                      <button onClick={handleCNPJSearch} disabled={formData.has_no_cnpj || !formData.cnpj} className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2.5 rounded-lg border border-gray-300 disabled:opacity-50">
                        <Search className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center mt-2">
                      <input type="checkbox" id="no_cnpj" className="rounded text-salomao-blue focus:ring-salomao-blue" checked={formData.has_no_cnpj} onChange={(e) => setFormData({...formData, has_no_cnpj: e.target.checked, cnpj: ''})}/>
                      <label htmlFor="no_cnpj" className="ml-2 text-xs text-gray-500">Sem CNPJ (Pessoa Física)</label>
                    </div>
                  </div>

                  <div className="md:col-span-6">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Nome do Cliente</label>
                    <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-salomao-blue" value={formData.client_name} onChange={(e) => handleTextChange('client_name', e.target.value)} />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Posição no Processo</label>
                    <div className="relative">
                      <select 
                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white appearance-none"
                        value={formData.client_position}
                        onChange={(e) => setFormData({...formData, client_position: e.target.value})}
                      >
                        <option value="Autor">Autor</option>
                        <option value="Réu">Réu</option>
                        <option value="Terceiro">Terceiro Interessado</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Estado (UF)</label>
                    <div className="relative">
                      <select className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white appearance-none" value={formData.uf} onChange={(e) => setFormData({...formData, uf: e.target.value})}>
                        <option value="">Selecione...</option>
                        {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Área do Direito</label>
                    <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" placeholder="Ex: Trabalhista, Cível..." value={formData.area} onChange={(e) => handleTextChange('area', e.target.value)} />
                  </div>
                  
                  {/* PARTNER MANAGER */}
                  <div className="relative">
                    <label className="block text-xs font-medium text-gray-600 mb-1 flex justify-between">
                      Responsável (Sócio)
                      <button onClick={() => setIsManagingPartners(!isManagingPartners)} className="text-salomao-blue hover:underline text-[10px] flex items-center">
                        <Settings className="w-3 h-3 mr-1" /> Gerenciar
                      </button>
                    </label>
                    
                    {!isManagingPartners ? (
                      <div className="relative">
                        <select className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white appearance-none" value={formData.partner_id} onChange={(e) => setFormData({...formData, partner_id: e.target.value})}>
                          <option value="">Selecione...</option>
                          {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                      </div>
                    ) : (
                      <div className="absolute top-0 left-0 w-full bg-white border border-gray-200 rounded-lg shadow-xl p-3 z-10 mt-6">
                        <div className="flex gap-2 mb-2">
                          <input type="text" className="flex-1 border rounded p-1 text-xs" placeholder="Nome do Sócio" value={newPartnerName} onChange={(e) => setNewPartnerName(toTitleCase(e.target.value))} />
                          {editingPartner ? (
                            <button onClick={handleUpdatePartner} className="bg-green-500 text-white p-1 rounded"><Check className="w-4 h-4" /></button>
                          ) : (
                            <button onClick={handleAddPartner} className="bg-blue-500 text-white p-1 rounded"><Plus className="w-4 h-4" /></button>
                          )}
                        </div>
                        <ul className="max-h-32 overflow-y-auto space-y-1">
                          {partners.map(p => (
                            <li key={p.id} className="text-xs flex justify-between items-center bg-gray-50 p-1 rounded">
                              {p.name}
                              <div className="flex gap-1">
                                <button onClick={() => { setEditingPartner(p); setNewPartnerName(p.name); }} className="text-blue-500"><Edit className="w-3 h-3" /></button>
                                <button onClick={() => handleDeletePartner(p.id)} className="text-red-500"><Trash2 className="w-3 h-3" /></button>
                              </div>
                            </li>
                          ))}
                        </ul>
                        <button onClick={() => setIsManagingPartners(false)} className="w-full text-center text-xs text-gray-500 mt-2 hover:bg-gray-100 p-1 rounded">Fechar</button>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* PROCESSOS JUDICIAIS */}
              <section className="space-y-4 bg-gray-50 p-5 rounded-xl border border-gray-200">
                <div className="flex justify-between items-center">
                   <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Processos Judiciais</h3>
                   <div className="flex items-center">
                     <input type="checkbox" id="no_process" checked={!formData.has_legal_process} onChange={(e) => setFormData({...formData, has_legal_process: !e.target.checked})} className="rounded text-salomao-blue" />
                     <label htmlFor="no_process" className="ml-2 text-xs text-gray-600">Caso sem processo judicial</label>
                   </div>
                </div>

                {formData.has_legal_process && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Contrário (Parte Oposta)</label>
                      <input type="text" className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white" placeholder="Nome da parte contrária" value={formData.company_name} onChange={(e) => handleTextChange('company_name', e.target.value)} />
                    </div>

                    <div className="grid grid-cols-12 gap-3 items-end p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div className="col-span-3">
                        <label className="text-[10px] text-gray-500 uppercase font-bold">Número CNJ</label>
                        <input type="text" className="w-full border-b border-gray-300 focus:border-salomao-blue outline-none py-1 text-sm font-mono" placeholder="0000000-00..." value={currentProcess.process_number} onChange={(e) => setCurrentProcess({...currentProcess, process_number: maskCNJ(e.target.value)})} />
                      </div>
                      <div className="col-span-2">
                         <label className="text-[10px] text-gray-500 uppercase font-bold">Valor Causa</label>
                         <input type="text" className="w-full border-b border-gray-300 focus:border-salomao-blue outline-none py-1 text-sm" value={currentProcess.cause_value} onChange={(e) => setCurrentProcess({...currentProcess, cause_value: maskMoney(e.target.value)})} />
                      </div>
                      <div className="col-span-3">
                         <label className="text-[10px] text-gray-500 uppercase font-bold">Tribunal / Vara</label>
                         <input type="text" className="w-full border-b border-gray-300 focus:border-salomao-blue outline-none py-1 text-sm" value={currentProcess.court} onChange={(e) => setCurrentProcess({...currentProcess, court: toTitleCase(e.target.value)})} />
                      </div>
                      <div className="col-span-3">
                         <label className="text-[10px] text-gray-500 uppercase font-bold">Juiz</label>
                         <input type="text" className="w-full border-b border-gray-300 focus:border-salomao-blue outline-none py-1 text-sm" value={currentProcess.judge} onChange={(e) => setCurrentProcess({...currentProcess, judge: toTitleCase(e.target.value)})} />
                      </div>
                      <div className="col-span-1">
                        <button onClick={handleProcessAction} className="w-full bg-salomao-blue text-white rounded p-1.5 hover:bg-blue-900 transition-colors">
                          {editingProcessIndex !== null ? <Check className="w-4 h-4 mx-auto" /> : <Plus className="w-4 h-4 mx-auto" />}
                        </button>
                      </div>
                    </div>

                    {processes.length > 0 && (
                      <div className="space-y-2">
                        {processes.map((p, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:border-blue-200 transition-colors group">
                            <div className="grid grid-cols-4 gap-4 flex-1 text-xs">
                              <span className="font-mono font-medium text-gray-800">{p.process_number}</span>
                              <span className="text-gray-600">{p.cause_value}</span>
                              <span className="text-gray-500">{p.court}</span>
                              <span className="text-gray-500 truncate">{p.judge}</span>
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

              <section className="border-t pt-6">
                <h3 className="text-sm font-bold text-salomao-gold uppercase tracking-wider mb-6 flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Detalhes da Fase: {getStatusLabel(formData.status)}
                </h3>

                {formData.status === 'analysis' && (
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                       <label className="text-xs font-medium block mb-1">Data Prospect</label>
                       <input type="date" className="w-full border border-gray-300 p-2.5 rounded-lg text-sm" value={formData.prospect_date} onChange={e => setFormData({...formData, prospect_date: e.target.value})} />
                    </div>
                    <div>
                       <label className="text-xs font-medium block mb-1">Analisado Por</label>
                       <input type="text" className="w-full border border-gray-300 p-2.5 rounded-lg text-sm" value={formData.analyzed_by} onChange={e => setFormData({...formData, analyzed_by: toTitleCase(e.target.value)})} />
                    </div>
                  </div>
                )}

                {(formData.status === 'proposal' || formData.status === 'active') && (
                  <div className="space-y-6 animate-in slide-in-from-top-2">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                       <div>
                          <label className="text-xs font-medium block mb-1">Data Proposta</label>
                          <input type="date" className="w-full border border-gray-300 p-2.5 rounded-lg text-sm" value={formData.proposal_date} onChange={e => setFormData({...formData, proposal_date: e.target.value})} />
                       </div>
                       <div>
                          <label className="text-xs font-medium block mb-1">Pró-Labore (R$)</label>
                          <input type="text" className="w-full border border-gray-300 p-2.5 rounded-lg text-sm" value={formData.pro_labore} onChange={e => setFormData({...formData, pro_labore: maskMoney(e.target.value)})} />
                       </div>
                       <div>
                          <label className="text-xs font-medium block mb-1">Êxito Final (R$)</label>
                          <input type="text" className="w-full border border-gray-300 p-2.5 rounded-lg text-sm" value={formData.final_success_fee} onChange={e => setFormData({...formData, final_success_fee: maskMoney(e.target.value)})} />
                       </div>
                       <div>
                          <label className="text-xs font-medium block mb-1">Êxito Final (%)</label>
                          <input type="text" className="w-full border border-gray-300 p-2.5 rounded-lg text-sm" placeholder="Ex: 20%" value={formData.final_success_percent} onChange={e => setFormData({...formData, final_success_percent: e.target.value})} />
                       </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Êxitos Intermediários</label>
                      <div className="flex gap-2 mb-3">
                        <input type="text" className="flex-1 border border-gray-300 p-2 rounded text-sm" placeholder="Ex: R$ 5.000,00 na Liminar" value={newIntermediateFee} onChange={e => setNewIntermediateFee(e.target.value)} />
                        <button onClick={addIntermediateFee} className="bg-salomao-blue text-white px-3 rounded hover:bg-blue-900 text-xs">Adicionar</button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.intermediate_fees?.map((fee, idx) => (
                          <span key={idx} className="bg-white border border-gray-200 px-3 py-1 rounded-full text-xs text-gray-700 flex items-center shadow-sm">
                            {fee}
                            <button onClick={() => removeIntermediateFee(idx)} className="ml-2 text-red-400 hover:text-red-600"><X className="w-3 h-3" /></button>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="text-xs font-medium block mb-1">Outros Honorários</label>
                        <input type="text" className="w-full border border-gray-300 p-2.5 rounded-lg text-sm" value={formData.other_fees} onChange={e => setFormData({...formData, other_fees: toTitleCase(e.target.value)})} />
                      </div>
                      <div className="flex items-center h-full pt-6">
                         <input type="checkbox" id="timesheet" checked={formData.timesheet} onChange={e => setFormData({...formData, timesheet: e.target.checked})} className="w-4 h-4 text-salomao-blue rounded border-gray-300 focus:ring-salomao-blue" />
                         <label htmlFor="timesheet" className="ml-2 text-sm text-gray-700 font-medium">Requer Timesheet (Horas)</label>
                      </div>
                    </div>
                  </div>
                )}

                {formData.status === 'active' && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-100 rounded-xl animate-in fade-in">
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="text-xs font-medium block mb-1 text-green-800">Número HON (Único)</label>
                          <input type="text" className="w-full border-2 border-green-200 p-2.5 rounded-lg text-green-900 font-mono font-bold" placeholder="0000000/000" value={formData.hon_number} onChange={e => setFormData({...formData, hon_number: maskHon(e.target.value)})} />
                       </div>
                       <div>
                          <label className="text-xs font-medium block mb-1">Data Assinatura</label>
                          <input type="date" className="w-full border border-gray-300 p-2.5 rounded-lg" value={formData.contract_date} onChange={e => setFormData({...formData, contract_date: e.target.value})} />
                       </div>
                    </div>
                  </div>
                )}
                
                {formData.status === 'rejected' && (
                   <div className="grid grid-cols-3 gap-4">
                      <input type="date" className="border p-2 rounded" onChange={e => setFormData({...formData, rejection_date: e.target.value})} />
                      <select className="border p-2 rounded" onChange={e => setFormData({...formData, rejected_by: e.target.value})}>
                        <option>Rejeitado por...</option>
                        <option>Cliente</option>
                        <option>Escritório</option>
                      </select>
                      <select className="border p-2 rounded" onChange={e => setFormData({...formData, rejection_reason: e.target.value})}>
                        <option>Motivo...</option>
                        <option>Cliente declinou</option>
                        <option>Cliente não retornou</option>
                        <option>Caso ruim</option>
                        <option>Conflito de interesses</option>
                      </select>
                   </div>
                )}
              </section>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Observações Gerais</label>
                <textarea className="w-full border border-gray-300 rounded-lg p-3 text-sm h-24 focus:ring-2 focus:ring-salomao-blue outline-none" value={formData.observations} onChange={(e) => setFormData({...formData, observations: toTitleCase(e.target.value)})}></textarea>
              </div>

            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors">Cancelar</button>
              <button onClick={handleSave} disabled={loading} className="px-6 py-2 bg-salomao-blue text-white rounded-lg hover:bg-blue-900 shadow-lg flex items-center transition-all transform active:scale-95">
                {loading ? 'Salvando...' : <><Save className="w-4 h-4 mr-2" /> Salvar Caso</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}