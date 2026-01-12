import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Filter, MoreHorizontal, Calendar, DollarSign, User, Briefcase, FileText, 
  CheckCircle2, Clock, XCircle, AlertCircle, Scale, Tag, Loader2, 
  LayoutGrid, List, Download, ArrowUpDown, Edit, Trash2, Bell, ArrowDownAZ, ArrowUpAZ
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import { Contract, Partner, ContractProcess, TimelineEvent, Analyst } from '../types';
import { ContractFormModal } from '../components/contracts/ContractFormModal';
import { PartnerManagerModal } from '../components/partners/PartnerManagerModal';
import { AnalystManagerModal } from '../components/analysts/AnalystManagerModal';
import { parseCurrency } from '../utils/masks';

// ... (getStatusColor, getStatusLabel, formatMoney MANTIDOS)
const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800 border-green-200';
    case 'analysis': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'proposal': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
    case 'probono': return 'bg-purple-100 text-purple-800 border-purple-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'active': return 'Contrato Fechado';
    case 'analysis': return 'Sob Análise';
    case 'proposal': return 'Proposta Enviada';
    case 'rejected': return 'Rejeitada';
    case 'probono': return 'Probono';
    default: return status;
  }
};

const formatMoney = (val: number | string | undefined) => {
  if (!val) return 'R$ 0,00';
  const num = typeof val === 'string' ? parseCurrency(val) : val;
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// Nova função auxiliar para somar êxitos
const calculateTotalSuccess = (c: Contract) => {
    let total = parseCurrency(c.final_success_fee);
    if (c.intermediate_fees && Array.isArray(c.intermediate_fees)) {
        c.intermediate_fees.forEach(fee => total += parseCurrency(fee));
    }
    return total;
};

export function Contracts() {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [analysts, setAnalysts] = useState<Analyst[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Filtros e Ordenação
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [partnerFilter, setPartnerFilter] = useState(''); // Novo filtro de sócio
  
  // Alterado padrão para Nome e Lista
  const [sortBy, setSortBy] = useState<'name' | 'date'>('name');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [isAnalystModalOpen, setIsAnalystModalOpen] = useState(false);
  
  const emptyContract: Contract = {
    cnpj: '', has_no_cnpj: false, client_name: '', client_position: 'Autor', area: '', uf: 'RJ', partner_id: '', has_legal_process: true,
    status: 'analysis', physical_signature: false
  };
  const [formData, setFormData] = useState<Contract>(emptyContract);
  const [currentProcess, setCurrentProcess] = useState<ContractProcess>({ process_number: '' });
  const [processes, setProcesses] = useState<ContractProcess[]>([]);
  const [editingProcessIndex, setEditingProcessIndex] = useState<number | null>(null);
  const [newIntermediateFee, setNewIntermediateFee] = useState('');
  const [timelineData, setTimelineData] = useState<TimelineEvent[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchData();
    fetchNotifications();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [contractsRes, partnersRes, analystsRes] = await Promise.all([
      supabase.from('contracts').select(`*, partner:partners(name), analyst:analysts(name), processes:contract_processes(*)`).order('created_at', { ascending: false }),
      supabase.from('partners').select('*').eq('active', true),
      supabase.from('analysts').select('*').eq('active', true)
    ]);

    if (contractsRes.data) {
        const formatted = contractsRes.data.map(c => ({
            ...c,
            partner_name: c.partner?.name,
            analyzed_by_name: c.analyst?.name,
            process_count: c.processes?.length || 0
        }));
        setContracts(formatted);
    }
    if (partnersRes.data) setPartners(partnersRes.data);
    if (analystsRes.data) setAnalysts(analystsRes.data);
    setLoading(false);
  };

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('kanban_tasks')
      .select('id, title, due_date')
      .eq('status', 'signature')
      .order('due_date', { ascending: true });
    
    if (data) setNotifications(data);
  };

  const handleNotificationClick = (taskId: string) => {
    navigate('/kanban', { state: { openTaskId: taskId } });
  };

  const handleNew = () => {
    setFormData(emptyContract);
    setProcesses([]);
    setCurrentProcess({ process_number: '' });
    setTimelineData([]);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleEdit = async (contract: Contract) => {
    setFormData(contract);
    setIsEditing(true);
    
    const [procRes, timeRes] = await Promise.all([
        supabase.from('contract_processes').select('*').eq('contract_id', contract.id),
        supabase.from('contract_timeline').select('*').eq('contract_id', contract.id).order('changed_at', { ascending: false })
    ]);

    if (procRes.data) setProcesses(procRes.data);
    if (timeRes.data) setTimelineData(timeRes.data);
    
    setIsModalOpen(true);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir este contrato?')) {
      const { error } = await supabase.from('contracts').delete().eq('id', id);
      if (!error) fetchData();
    }
  };

  const handleSave = () => {
    fetchData(); 
    fetchNotifications(); 
  };

  const handleProcessAction = () => {
    if (!currentProcess.process_number) return;
    if (editingProcessIndex !== null) {
      const updated = [...processes];
      updated[editingProcessIndex] = currentProcess;
      setProcesses(updated);
      setEditingProcessIndex(null);
    } else {
      setProcesses([...processes, currentProcess]);
    }
    setCurrentProcess({ process_number: '' });
  };

  const editProcess = (idx: number) => {
    setCurrentProcess(processes[idx]);
    setEditingProcessIndex(idx);
  };

  const removeProcess = (idx: number) => {
    setProcesses(processes.filter((_, i) => i !== idx));
  };

  const addIntermediateFee = () => {
    if (!newIntermediateFee) return;
    setFormData(prev => ({
      ...prev,
      intermediate_fees: [...(prev.intermediate_fees || []), newIntermediateFee]
    }));
    setNewIntermediateFee('');
  };

  const removeIntermediateFee = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      intermediate_fees: prev.intermediate_fees?.filter((_, i) => i !== idx)
    }));
  };

  const exportToExcel = () => {
    const data = filteredContracts.map(c => ({
      'Status': getStatusLabel(c.status),
      'Cliente': c.client_name,
      'CNPJ/CPF': c.cnpj || '-',
      'Processos': (c as any).processes?.map((p: any) => p.process_number).join(', ') || '-',
      'Sócio': c.partner_name,
      'Área': c.area,
      'UF': c.uf,
      'HON': c.hon_number || '-',
      'Data Status': new Date(getRelevantDate(c) || '').toLocaleDateString(),
      'Data Assinatura': c.contract_date ? new Date(c.contract_date).toLocaleDateString() : '-',
      'Pró-Labore': formatMoney(c.pro_labore),
      'Fixo Mensal': formatMoney(c.fixed_monthly_fee),
      'Êxito Final': formatMoney(c.final_success_fee),
      'Observações': c.observations || '-'
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Contratos");
    XLSX.writeFile(wb, "Relatorio_Contratos.xlsx");
  };

  // Helper para obter a data relevante com base no status
  const getRelevantDate = (c: Contract) => {
    switch (c.status) {
        case 'analysis': return c.prospect_date || c.created_at;
        case 'proposal': return c.proposal_date || c.created_at;
        case 'active': return c.contract_date || c.created_at;
        case 'rejected': return c.rejection_date || c.created_at;
        case 'probono': return c.probono_date || c.contract_date || c.created_at;
        default: return c.created_at;
    }
  };

  const filteredContracts = contracts.filter(c => {
    const matchesSearch = c.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.hon_number?.includes(searchTerm) ||
                          c.cnpj?.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesPartner = partnerFilter === '' || c.partner_id === partnerFilter;
    return matchesSearch && matchesStatus && matchesPartner;
  }).sort((a, b) => {
    if (sortBy === 'name') {
        const nameA = a.client_name || '';
        const nameB = b.client_name || '';
        return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    } else {
        const dateA = new Date(getRelevantDate(a) || 0).getTime();
        const dateB = new Date(getRelevantDate(b) || 0).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    }
  });

  return (
    <div className="p-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-salomao-blue flex items-center gap-2">
            <Briefcase className="w-8 h-8" /> Contratos
          </h1>
          <div className="flex items-center mt-1">
            <p className="text-gray-500 mr-3">Gestão completa de casos e propostas.</p>
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center">
              <Briefcase className="w-3 h-3 mr-1" /> Total: {contracts.length}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-2 rounded-full relative transition-all ${
                notifications.length > 0 
                  ? 'bg-red-50 text-red-500 hover:bg-red-100' 
                  : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
              }`}
            >
              <Bell className={`w-6 h-6 ${notifications.length > 0 ? 'animate-pulse' : ''}`} />
              {notifications.length > 0 && (
                <span className="absolute top-0 right-0 w-3 h-3 bg-red-600 border-2 border-white rounded-full"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95">
                <div className="p-3 border-b border-gray-50 bg-gray-50 flex justify-between items-center">
                  <h4 className="text-xs font-bold text-gray-700 uppercase">Tarefas de Assinatura</h4>
                  <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded text-[10px] font-bold">{notifications.length}</span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-400">Nenhuma pendência.</div>
                  ) : (
                    notifications.map(notif => (
                      <div 
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif.id)}
                        className="p-3 border-b border-gray-50 last:border-0 hover:bg-blue-50 cursor-pointer transition-colors"
                      >
                        <p className="text-sm font-medium text-gray-800 line-clamp-1">{notif.title}</p>
                        <p className="text-xs text-gray-500 flex items-center mt-1">
                          <Calendar className="w-3 h-3 mr-1" /> 
                          Vence: {new Date(notif.due_date).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button onClick={handleNew} className="bg-salomao-gold hover:bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-md transition-colors flex items-center font-bold">
            <Plus className="w-5 h-5 mr-2" /> Novo Caso
          </button>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-4 mb-6 bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
        {/* ... (Resto do componente inalterado) ... */}
        <div className="flex-1 flex items-center bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
          <Search className="w-5 h-5 text-gray-400 mr-2" />
          <input 
            type="text" 
            placeholder="Buscar por cliente, HON ou CNPJ..." 
            className="flex-1 bg-transparent outline-none text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 xl:pb-0 items-center">
          {/* Filtro de Status */}
          <div className="flex items-center bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 min-w-[150px]">
            <Filter className="w-4 h-4 text-gray-500 mr-2" />
            <select 
              className="bg-transparent outline-none text-sm w-full cursor-pointer text-gray-700"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Todos Status</option>
              <option value="analysis">Sob Análise</option>
              <option value="proposal">Proposta Enviada</option>
              <option value="active">Contrato Fechado</option>
              <option value="rejected">Rejeitada</option>
              <option value="probono">Probono</option>
            </select>
          </div>

          {/* Filtro de Sócio (Adicionado) */}
          <div className="flex items-center bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 min-w-[150px]">
            <User className="w-4 h-4 text-gray-500 mr-2" />
            <select 
              className="bg-transparent outline-none text-sm w-full cursor-pointer text-gray-700"
              value={partnerFilter}
              onChange={(e) => setPartnerFilter(e.target.value)}
            >
              <option value="">Todos Sócios</option>
              {partners.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Ordenação por Nome/Data */}
          <div className="flex bg-gray-50 rounded-lg p-1 border border-gray-200">
            <button 
                onClick={() => { if(sortBy !== 'name') { setSortBy('name'); setSortOrder('asc'); } else { setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); } }}
                className={`flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-all ${sortBy === 'name' ? 'bg-white shadow text-salomao-blue' : 'text-gray-500 hover:text-gray-700'}`}
                title="Ordenar por Nome"
            >
                Nome
                {sortBy === 'name' && (sortOrder === 'asc' ? <ArrowDownAZ className="w-3 h-3 ml-1" /> : <ArrowUpAZ className="w-3 h-3 ml-1" />)}
            </button>
            <button 
                onClick={() => { if(sortBy !== 'date') { setSortBy('date'); setSortOrder('desc'); } else { setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); } }}
                className={`flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-all ${sortBy === 'date' ? 'bg-white shadow text-salomao-blue' : 'text-gray-500 hover:text-gray-700'}`}
                title="Ordenar por Data do Status Atual"
            >
                Data
                {sortBy === 'date' && <ArrowUpDown className="w-3 h-3 ml-1" />}
            </button>
          </div>

          <div className="flex bg-gray-50 rounded-lg p-1 border border-gray-200">
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm text-salomao-blue' : 'text-gray-400 hover:text-gray-600'}`}><LayoutGrid className="w-4 h-4" /></button>
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-sm text-salomao-blue' : 'text-gray-400 hover:text-gray-600'}`}><List className="w-4 h-4" /></button>
          </div>

          <button onClick={exportToExcel} className="flex items-center px-3 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium whitespace-nowrap">
            <Download className="w-4 h-4 mr-2" /> XLS
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 text-salomao-gold animate-spin" /></div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredContracts.map((contract) => {
                const totalExito = calculateTotalSuccess(contract);
                return (
                  <div key={contract.id} onClick={() => handleEdit(contract)} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group relative">
                    
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0 pr-8">
                        <h3 className="font-bold text-gray-800 text-sm truncate" title={contract.client_name}>{contract.client_name}</h3>
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase mt-1 border ${getStatusColor(contract.status)}`}>
                          {getStatusLabel(contract.status)}
                        </span>
                      </div>
                      <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white pl-2">
                          <button onClick={(e) => { e.stopPropagation(); handleEdit(contract); }} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-3.5 h-3.5" /></button>
                          <button onClick={(e) => handleDelete(e, contract.id!)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-gray-600">
                      <div className="flex items-center">
                         {/* ALTERADO DE ÁREA PARA PROCESSOS NO MODO GRID */}
                        <Scale className="w-3.5 h-3.5 mr-2 text-gray-400" />
                        <span className="truncate">
                          {(contract as any).processes && (contract as any).processes.length > 0 
                            ? (contract as any).processes.map((p: any) => p.process_number).join(', ') 
                            : 'Sem processos'}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <User className="w-3.5 h-3.5 mr-2 text-salomao-gold" />
                        <span className="truncate">{contract.partner_name || 'Sem sócio'}</span>
                      </div>
                      {/* Removido o item antigo de Scale que mostrava a contagem de processos, já que agora mostramos os números */}
                      {contract.status === 'active' && contract.hon_number && (
                        <div className="flex items-center">
                          <Tag className="w-3.5 h-3.5 mr-2 text-gray-400" />
                          <span className="font-mono bg-gray-100 px-1 rounded text-[10px]">{contract.hon_number}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-gray-50 flex justify-between items-end">
                      <div className="text-[10px] text-gray-400">
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(getRelevantDate(contract) || '').toLocaleDateString()}
                        </div>
                      </div>
                      {contract.status === 'active' && (
                        <div className="text-right">
                          {contract.pro_labore && parseCurrency(contract.pro_labore) > 0 && (
                            <div className="text-xs font-bold text-green-700">{formatMoney(contract.pro_labore)}</div>
                          )}
                          {totalExito > 0 && (
                            <div className="text-[10px] text-gray-500">+ {formatMoney(totalExito)} êxito (Total)</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                        <tr>
                            <th className="p-3">Status</th>
                            <th className="p-3">Cliente</th>
                            {/* ALTERADO DE ÁREA PARA PROCESSOS NA TABELA */}
                            <th className="p-3">Processos</th>
                            <th className="p-3">Sócio</th>
                            <th className="p-3">HON</th>
                            <th className="p-3 text-right">Data Relevante</th>
                            <th className="p-3 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredContracts.map(contract => (
                            <tr key={contract.id} onClick={() => handleEdit(contract)} className="hover:bg-gray-50 cursor-pointer group">
                                <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(contract.status)}`}>{getStatusLabel(contract.status)}</span></td>
                                <td className="p-3 font-medium text-gray-800">{contract.client_name}</td>
                                {/* ALTERADO DE ÁREA PARA PROCESSOS NA CÉLULA */}
                                <td className="p-3 text-gray-600 max-w-[200px] truncate" title={(contract as any).processes?.map((p: any) => p.process_number).join(', ')}>
                                    {(contract as any).processes && (contract as any).processes.length > 0 
                                      ? (contract as any).processes.map((p: any) => p.process_number).join(', ') 
                                      : '-'}
                                </td>
                                <td className="p-3 text-gray-600">{contract.partner_name}</td>
                                <td className="p-3 font-mono text-gray-500">{contract.hon_number || '-'}</td>
                                <td className="p-3 text-right text-gray-500">{new Date(getRelevantDate(contract) || '').toLocaleDateString()}</td>
                                <td className="p-3 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100">
                                        <button onClick={(e) => { e.stopPropagation(); handleEdit(contract); }} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><Edit className="w-4 h-4" /></button>
                                        <button onClick={(e) => handleDelete(e, contract.id!)} className="text-red-600 hover:bg-red-50 p-1 rounded"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          )}
        </>
      )}

      <ContractFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        formData={formData}
        setFormData={setFormData}
        onSave={handleSave}
        loading={loading}
        isEditing={isEditing}
        partners={partners}
        onOpenPartnerManager={() => setIsPartnerModalOpen(true)}
        analysts={analysts}
        onOpenAnalystManager={() => setIsAnalystModalOpen(true)}
        onCNPJSearch={() => {}}
        processes={processes}
        currentProcess={currentProcess}
        setCurrentProcess={setCurrentProcess}
        editingProcessIndex={editingProcessIndex}
        handleProcessAction={handleProcessAction}
        editProcess={editProcess}
        removeProcess={removeProcess}
        newIntermediateFee={newIntermediateFee}
        setNewIntermediateFee={setNewIntermediateFee}
        addIntermediateFee={addIntermediateFee}
        removeIntermediateFee={removeIntermediateFee}
        timelineData={timelineData}
        getStatusColor={getStatusColor}
        getStatusLabel={getStatusLabel}
      />

      <PartnerManagerModal isOpen={isPartnerModalOpen} onClose={() => setIsPartnerModalOpen(false)} onUpdate={fetchData} />
      <AnalystManagerModal isOpen={isAnalystModalOpen} onClose={() => setIsAnalystModalOpen(false)} onUpdate={fetchData} />
    </div>
  );
}