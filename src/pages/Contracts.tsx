import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { maskCNPJ, maskCNJ, maskMoney, maskHon, unmaskMoney } from '../utils/masks';
import { Search, Plus, Filter, FileSpreadsheet, LayoutGrid, List as ListIcon, Trash2, Edit, X, Save, CheckCircle, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

// --- TYPES ---
interface Partner { id: string; name: string; }
interface ContractProcess {
  id?: string;
  process_number: string;
  cause_value: string; // formatted
  court: string;
  judge: string;
}
interface Contract {
  id?: string;
  status: 'analysis' | 'proposal' | 'active' | 'rejected' | 'probono';
  cnpj: string;
  has_no_cnpj: boolean;
  client_name: string;
  company_name: string; // Contrário
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
  // Financial (JSON structure flattened for form)
  pro_labore?: string;
  final_success_fee?: string;
  final_success_percent?: string;
  intermediate_fees?: string[]; // Array of formatted strings
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
  const [partners, setPartners] = useState<Partner[]>([]);
  
  // --- FORM STATE ---
  const initialFormState: Contract = {
    status: 'analysis',
    cnpj: '',
    has_no_cnpj: false,
    client_name: '',
    company_name: '',
    has_legal_process: true,
    uf: '',
    area: '',
    partner_id: '',
    observations: '',
    intermediate_fees: []
  };
  const [formData, setFormData] = useState<Contract>(initialFormState);
  const [processes, setProcesses] = useState<ContractProcess[]>([]);
  const [currentProcess, setCurrentProcess] = useState<ContractProcess>({ process_number: '', cause_value: '', court: '', judge: '' });

  // --- FILTERS ---
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // --- DATA FETCHING ---
  useEffect(() => {
    fetchPartners();
    fetchContracts();
  }, []);

  const fetchPartners = async () => {
    const { data } = await supabase.from('partners').select('*').eq('active', true);
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
    
    // Simple ordering
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (!error && data) {
      // Map data for display
      const formatted = data.map(d => ({
        ...d,
        client_name: d.clients?.name,
        partner_name: d.partners?.name,
        process_count: d.contract_processes?.[0]?.count || 0
      }));
      setContracts(formatted);
    }
    setLoading(false);
  };

  // --- ACTIONS ---
  const handleCNPJSearch = async () => {
    const cleanCNPJ = formData.cnpj.replace(/\D/g, '');
    if (cleanCNPJ.length !== 14) return alert('CNPJ inválido');
    
    setLoading(true);
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCNPJ}`);
      const data = await response.json();
      if (data.razao_social) {
        setFormData(prev => ({ ...prev, client_name: data.razao_social }));
      }
    } catch (e) {
      alert('Erro ao buscar CNPJ. Preencha manualmente.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProcess = () => {
    if (!currentProcess.process_number) return;
    setProcesses(prev => [...prev, currentProcess]);
    setCurrentProcess({ process_number: '', cause_value: '', court: '', judge: '' });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // 1. Create/Get Client
      let clientId = null;
      if (formData.cnpj) {
        const { data: clientData } = await supabase.from('clients').upsert({ 
          cnpj: formData.cnpj, 
          name: formData.client_name 
        }, { onConflict: 'cnpj' }).select('id').single();
        clientId = clientData?.id;
      } else {
        const { data: clientData } = await supabase.from('clients').insert({ 
          name: formData.client_name 
        }).select('id').single();
        clientId = clientData?.id;
      }

      // 2. Save Contract
      const financialData = {
        pro_labore: formData.pro_labore,
        final_success_fee: formData.final_success_fee,
        final_success_percent: formData.final_success_percent,
        intermediate_fees: formData.intermediate_fees,
        other_fees: formData.other_fees,
        timesheet: formData.timesheet
      };

      const { data: contractData, error: contractError } = await supabase.from('contracts').upsert({
        status: formData.status,
        client_id: clientId,
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

      if (contractError) throw contractError;

      // 3. Save Processes
      if (contractData && processes.length > 0) {
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

  // --- RENDER HELPERS ---
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

  // --- MAIN RENDER ---
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

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Buscar por cliente, empresa ou OAB..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-salomao-blue focus:border-transparent outline-none"
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
          </select>
          
          {(searchTerm || statusFilter) && (
             <button onClick={() => { setSearchTerm(''); setStatusFilter(''); }} className="text-red-500 text-sm hover:underline">Limpar</button>
          )}
        </div>

        <div className="flex items-center gap-3 border-l pl-4 border-gray-200">
          <button 
            onClick={exportToExcel}
            className="text-green-600 hover:bg-green-50 p-2 rounded-lg transition-colors" 
            title="Exportar Excel"
          >
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
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Empresa/Contrário</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Proc. Vinculados</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {contracts.filter(c => 
                (statusFilter ? c.status === statusFilter : true) &&
                (searchTerm ? c.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) : true)
              ).map((contract) => (
                <tr key={contract.id} className="hover:bg-gray-50 transition-colors group cursor-pointer" onClick={() => {/* Open detail */}}>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(contract.status)}`}>
                      {getStatusLabel(contract.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">{contract.client_name}</td>
                  <td className="px-6 py-4 text-gray-600">{contract.company_name || '-'}</td>
                  <td className="px-6 py-4 text-gray-600">
                    <div className="flex items-center gap-2">
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-bold text-gray-700">{contract.process_count}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4" /></button>
                      <button className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contracts.map(c => (
             <div key={c.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(c.status)}`}>
                    {getStatusLabel(c.status)}
                  </span>
                  <button className="text-gray-400 hover:text-salomao-blue"><Edit className="w-4 h-4" /></button>
                </div>
                <h3 className="font-bold text-gray-800 text-lg mb-1">{c.client_name}</h3>
                <p className="text-sm text-gray-500 mb-4">{c.company_name}</p>
                <div className="flex items-center justify-between text-xs text-gray-400 border-t pt-4">
                  <span>{c.process_count} Processos</span>
                  <span>Resp: {c.partner_name}</span>
                </div>
             </div>
          ))}
        </div>
      )}

      {/* --- MODAL DE NOVO CASO --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Novo Caso / Contrato</h2>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Cadastro Unificado</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500"><X className="w-6 h-6" /></button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              
              {/* 1. STATUS SELECTION */}
              <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100">
                <label className="block text-sm font-bold text-gray-700 mb-2">Status Atual do Caso</label>
                <select 
                  className="w-full p-3 border border-blue-200 rounded-lg bg-white font-medium text-salomao-blue outline-none focus:ring-2 focus:ring-salomao-blue"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                >
                  <option value="analysis">Sob Análise</option>
                  <option value="proposal">Proposta Enviada</option>
                  <option value="active">Contrato Fechado</option>
                  <option value="rejected">Rejeitada</option>
                  <option value="probono">Probono</option>
                </select>
              </div>

              {/* 2. DADOS COMUNS (Geral) */}
              <section className="space-y-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b pb-2">Dados Cadastrais</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* CNPJ Input */}
                  <div className="md:col-span-4">
                    <label className="block text-xs font-medium text-gray-600 mb-1">CNPJ</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        disabled={formData.has_no_cnpj}
                        className="flex-1 border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-salomao-blue disabled:bg-gray-100"
                        placeholder="00.000.000/0000-00"
                        value={formData.cnpj}
                        onChange={(e) => setFormData({...formData, cnpj: maskCNPJ(e.target.value)})}
                      />
                      <button 
                        onClick={handleCNPJSearch}
                        disabled={formData.has_no_cnpj || !formData.cnpj}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2.5 rounded-lg border border-gray-300 disabled:opacity-50"
                      >
                        <Search className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center mt-2">
                      <input 
                        type="checkbox" 
                        id="no_cnpj" 
                        className="rounded text-salomao-blue focus:ring-salomao-blue"
                        checked={formData.has_no_cnpj}
                        onChange={(e) => setFormData({...formData, has_no_cnpj: e.target.checked, cnpj: ''})}
                      />
                      <label htmlFor="no_cnpj" className="ml-2 text-xs text-gray-500">Sem CNPJ (Pessoa Física)</label>
                    </div>
                  </div>

                  {/* Client Name */}
                  <div className="md:col-span-5">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Nome do Cliente</label>
                    <input 
                      type="text" 
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-salomao-blue"
                      value={formData.client_name}
                      onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                    />
                  </div>

                  {/* Contrário */}
                  <div className="md:col-span-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Contrário (Réu/Autor)</label>
                    <input 
                      type="text" 
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-salomao-blue"
                      value={formData.company_name}
                      onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Estado (UF)</label>
                    <select 
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white"
                      value={formData.uf}
                      onChange={(e) => setFormData({...formData, uf: e.target.value})}
                    >
                      <option value="">Selecione...</option>
                      {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Área do Direito</label>
                    <input 
                      type="text" 
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
                      placeholder="Ex: Trabalhista, Cível..."
                      value={formData.area}
                      onChange={(e) => setFormData({...formData, area: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Responsável (Sócio)</label>
                    <select 
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white"
                      value={formData.partner_id}
                      onChange={(e) => setFormData({...formData, partner_id: e.target.value})}
                    >
                      <option value="">Selecione...</option>
                      {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>
              </section>

              {/* 3. PROCESSOS JUDICIAIS */}
              <section className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="flex justify-between items-center">
                   <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Processos Judiciais</h3>
                   <div className="flex items-center">
                     <input 
                        type="checkbox" 
                        id="no_process"
                        checked={!formData.has_legal_process}
                        onChange={(e) => setFormData({...formData, has_legal_process: !e.target.checked})}
                        className="rounded text-salomao-blue"
                     />
                     <label htmlFor="no_process" className="ml-2 text-xs text-gray-600">Caso sem processo judicial</label>
                   </div>
                </div>

                {formData.has_legal_process && (
                  <>
                    <div className="grid grid-cols-12 gap-3 items-end">
                      <div className="col-span-4">
                        <label className="text-xs text-gray-500">Número CNJ</label>
                        <input 
                          type="text" 
                          className="w-full border border-gray-300 rounded p-2 text-xs" 
                          placeholder="0000000-00.0000.0.00.0000"
                          value={currentProcess.process_number}
                          onChange={(e) => setCurrentProcess({...currentProcess, process_number: maskCNJ(e.target.value)})}
                        />
                      </div>
                      <div className="col-span-3">
                         <label className="text-xs text-gray-500">Valor Causa</label>
                         <input 
                            type="text" 
                            className="w-full border border-gray-300 rounded p-2 text-xs"
                            value={currentProcess.cause_value}
                            onChange={(e) => setCurrentProcess({...currentProcess, cause_value: maskMoney(e.target.value)})}
                         />
                      </div>
                      <div className="col-span-4">
                         <label className="text-xs text-gray-500">Tribunal / Vara</label>
                         <input 
                            type="text" 
                            className="w-full border border-gray-300 rounded p-2 text-xs"
                            placeholder="Ex: 3ª Vara Cível TJSP"
                            value={currentProcess.court}
                            onChange={(e) => setCurrentProcess({...currentProcess, court: e.target.value})}
                         />
                      </div>
                      <div className="col-span-1">
                        <button 
                          onClick={handleAddProcess}
                          className="w-full bg-salomao-blue text-white rounded p-2 hover:bg-blue-900"
                        >
                          <Plus className="w-4 h-4 mx-auto" />
                        </button>
                      </div>
                    </div>

                    {/* Lista de processos adicionados */}
                    {processes.length > 0 && (
                      <div className="space-y-2 mt-2">
                        {processes.map((p, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border border-gray-200 text-xs">
                            <span className="font-mono">{p.process_number}</span>
                            <span>{p.cause_value}</span>
                            <span className="text-gray-500">{p.court}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </section>

              {/* 4. DADOS CONDICIONAIS POR STATUS */}
              <section className="border-t pt-6">
                <h3 className="text-sm font-bold text-salomao-gold uppercase tracking-wider mb-4">
                  Detalhes da Fase: {getStatusLabel(formData.status)}
                </h3>

                {/* --- SOB ANÁLISE --- */}
                {formData.status === 'analysis' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="text-xs font-medium block mb-1">Data Prospect</label>
                       <input type="date" className="w-full border p-2 rounded" 
                          value={formData.prospect_date} onChange={e => setFormData({...formData, prospect_date: e.target.value})}
                       />
                    </div>
                    <div>
                       <label className="text-xs font-medium block mb-1">Analisado Por</label>
                       <input type="text" className="w-full border p-2 rounded" 
                          value={formData.analyzed_by} onChange={e => setFormData({...formData, analyzed_by: e.target.value})}
                       />
                    </div>
                  </div>
                )}

                {/* --- PROPOSTA ENVIADA --- */}
                {formData.status === 'proposal' && (
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-4">
                       <label className="text-xs font-medium block mb-1">Data Proposta</label>
                       <input type="date" className="w-full border p-2 rounded" 
                          value={formData.proposal_date} onChange={e => setFormData({...formData, proposal_date: e.target.value})}
                       />
                    </div>
                    <div className="col-span-4">
                       <label className="text-xs font-medium block mb-1">Pró-Labore</label>
                       <input type="text" className="w-full border p-2 rounded" 
                          value={formData.pro_labore} onChange={e => setFormData({...formData, pro_labore: maskMoney(e.target.value)})}
                       />
                    </div>
                    {/* Mais campos financeiros aqui (resumido para caber) */}
                  </div>
                )}

                {/* --- CONTRATO FECHADO --- */}
                {formData.status === 'active' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="text-xs font-medium block mb-1 text-green-700">Número HON (Único)</label>
                          <input type="text" className="w-full border-2 border-green-100 p-2 rounded text-green-800 font-mono font-bold" 
                              placeholder="0000000/000"
                              value={formData.hon_number} 
                              onChange={e => setFormData({...formData, hon_number: maskHon(e.target.value)})}
                          />
                       </div>
                       <div>
                          <label className="text-xs font-medium block mb-1">Data Contrato</label>
                          <input type="date" className="w-full border p-2 rounded" 
                              value={formData.contract_date} onChange={e => setFormData({...formData, contract_date: e.target.value})}
                          />
                       </div>
                    </div>
                    {/* Campos Financeiros Repetidos aqui (idealmente extrair componente) */}
                    <div className="grid grid-cols-3 gap-4 bg-green-50 p-4 rounded border border-green-100">
                        <div>
                           <label className="text-xs block">Pró-Labore</label>
                           <input type="text" className="w-full border p-1 rounded" 
                              value={formData.pro_labore} onChange={e => setFormData({...formData, pro_labore: maskMoney(e.target.value)})} />
                        </div>
                        <div>
                           <label className="text-xs block">Êxito Final</label>
                           <input type="text" className="w-full border p-1 rounded" 
                              value={formData.final_success_fee} onChange={e => setFormData({...formData, final_success_fee: maskMoney(e.target.value)})} />
                        </div>
                        <div>
                           <label className="text-xs block">% Êxito</label>
                           <input type="text" className="w-full border p-1 rounded" placeholder="20%"
                              value={formData.final_success_percent} onChange={e => setFormData({...formData, final_success_percent: e.target.value})} />
                        </div>
                    </div>
                  </div>
                )}
                
                {/* --- REJEITADA --- */}
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

              {/* OBSERVAÇÕES */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Observações Gerais</label>
                <textarea 
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm h-24"
                  value={formData.observations}
                  onChange={(e) => setFormData({...formData, observations: e.target.value})}
                ></textarea>
              </div>

            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                disabled={loading}
                className="px-6 py-2 bg-salomao-blue text-white rounded-lg hover:bg-blue-900 shadow-lg flex items-center"
              >
                {loading ? 'Salvando...' : (
                  <><Save className="w-4 h-4 mr-2" /> Salvar Caso</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}