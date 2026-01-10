import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Search, Download, AlertCircle, Loader2, Edit, Trash2, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { ContractFormModal } from '../components/contracts/ContractFormModal';
import { PartnerManagerModal } from '../components/partners/PartnerManagerModal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { Contract, Partner, ContractProcess, TimelineEvent } from '../types';
import { CustomSelect } from '../components/ui/CustomSelect';

export function Contracts() {
  // --- ESTADOS ---
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros e Ordenação
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest'); // 'newest', 'oldest', 'name'
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Exclusão
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<Contract | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form States
  const [formData, setFormData] = useState<Contract>({
    status: 'analysis', cnpj: '', has_no_cnpj: false, client_name: '', client_position: 'Autor',
    company_name: '', has_legal_process: true, uf: '', area: '', partner_id: '', observations: '', physical_signature: undefined
  });

  const [processes, setProcesses] = useState<ContractProcess[]>([]);
  const [currentProcess, setCurrentProcess] = useState<ContractProcess>({ process_number: '', cause_value: '', court: '', judge: '' });
  const [editingProcessIndex, setEditingProcessIndex] = useState<number | null>(null);
  const [newIntermediateFee, setNewIntermediateFee] = useState('');
  const [timelineData, setTimelineData] = useState<TimelineEvent[]>([]);

  // --- EFEITOS ---
  useEffect(() => {
    fetchContracts();
    fetchPartners();
  }, []);

  // --- FETCH DATA ---
  const fetchContracts = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('contracts').select(`*, partners (name)`).order('created_at', { ascending: false });
    if (data) {
      setContracts(data.map((item: any) => ({ ...item, partner_name: item.partners?.name })));
    }
    setLoading(false);
  };

  const fetchPartners = async () => {
    const { data } = await supabase.from('partners').select('*').order('name');
    if (data) setPartners(data);
  };

  // --- ACTIONS ---
  const handleEdit = async (contract: Contract, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsEditing(true);
    setFormData(contract);
    
    const { data: procData } = await supabase.from('contract_processes').select('*').eq('contract_id', contract.id);
    if (procData) setProcesses(procData);

    const { data: timeline } = await supabase.from('contract_timeline').select('*').eq('contract_id', contract.id).order('changed_at', { ascending: false });
    if (timeline) setTimelineData(timeline);

    setIsModalOpen(true);
  };

  const requestDelete = (contract: Contract, e: React.MouseEvent) => {
    e.stopPropagation();
    setContractToDelete(contract);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!contractToDelete?.id) return;
    setDeleteLoading(true);
    try {
      // Exclui dependências primeiro (ou deixa o banco lidar com cascade se configurado)
      await supabase.from('contract_processes').delete().eq('contract_id', contractToDelete.id);
      await supabase.from('contract_documents').delete().eq('contract_id', contractToDelete.id);
      await supabase.from('kanban_tasks').delete().eq('contract_id', contractToDelete.id);
      
      const { error } = await supabase.from('contracts').delete().eq('id', contractToDelete.id);
      if (error) throw error;
      
      setContracts(contracts.filter(c => c.id !== contractToDelete.id));
      setDeleteModalOpen(false);
      setContractToDelete(null);
    } catch (error: any) {
      alert('Erro ao excluir: ' + error.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const contractData = { ...formData, process_count: processes.length };
      let contractId = formData.id;

      if (isEditing && contractId) {
        await supabase.from('contracts').update(contractData).eq('id', contractId);
      } else {
        const { data, error } = await supabase.from('contracts').insert(contractData).select().single();
        if (error) throw error;
        contractId = data.id;
      }

      if (contractId) {
        await supabase.from('contract_processes').delete().eq('contract_id', contractId);
        if (processes.length > 0) {
          await supabase.from('contract_processes').insert(processes.map(p => ({ contract_id: contractId, ...p })));
        }
      }
      setIsModalOpen(false);
      resetForm();
      fetchContracts();
    } catch (error: any) {
      alert('Erro ao salvar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      status: 'analysis', cnpj: '', has_no_cnpj: false, client_name: '', client_position: 'Autor',
      company_name: '', has_legal_process: true, uf: '', area: '', partner_id: '', observations: '', physical_signature: undefined
    });
    setProcesses([]); setTimelineData([]); setIsEditing(false);
  };

  const exportToExcel = () => {
    const data = filteredContracts.map(c => ({
      'Cliente': c.client_name, 'Status': getStatusLabel(c.status), 'Processo': c.hon_number || '-',
      'Valor': c.final_success_fee || '-', 'Sócio': c.partner_name || '-', 'Data': new Date(c.created_at!).toLocaleDateString()
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Contratos");
    XLSX.writeFile(wb, "Relatorio_Contratos.xlsx");
  };

  // --- HELPERS ---
  const handleProcessAction = () => { /* Lógica mantida... */ 
    if (!currentProcess.process_number) return alert('Preencha o número.');
    if (editingProcessIndex !== null) {
      const updated = [...processes]; updated[editingProcessIndex] = currentProcess; setProcesses(updated); setEditingProcessIndex(null);
    } else setProcesses([...processes, currentProcess]);
    setCurrentProcess({ process_number: '', cause_value: '', court: '', judge: '' });
  };
  const editProcess = (i: number) => { setCurrentProcess(processes[i]); setEditingProcessIndex(i); };
  const removeProcess = (i: number) => setProcesses(processes.filter((_, idx) => idx !== i));
  const addIntermediateFee = () => { if(newIntermediateFee) { setFormData(prev => ({...prev, intermediate_fees: [...(prev.intermediate_fees||[]), newIntermediateFee]})); setNewIntermediateFee(''); }};
  const removeIntermediateFee = (i: number) => setFormData(prev => ({...prev, intermediate_fees: prev.intermediate_fees?.filter((_, idx) => idx !== i)}));

  // --- FILTROS ---
  const filteredContracts = contracts
    .filter(c => {
      const matchesSearch = c.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.hon_number?.includes(searchTerm);
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.client_name.localeCompare(b.client_name);
      if (sortBy === 'oldest') return new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime();
      return new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime(); // newest
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'analysis': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'proposal': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'probono': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const map: any = { analysis: 'Sob Análise', proposal: 'Proposta Enviada', active: 'Contrato Fechado', rejected: 'Rejeitada', probono: 'Probono' };
    return map[status] || status;
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-salomao-blue">Gestão de Contratos</h1>
          <p className="text-gray-500 mt-1">Gerencie o ciclo de vida dos seus casos jurídicos.</p>
        </div>
        <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-salomao-gold hover:bg-yellow-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center font-bold active:scale-95">
          <Plus className="w-5 h-5 mr-2" /> Novo Caso
        </button>
      </div>

      {/* BARRA DE FERRAMENTAS UNIFICADA */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col xl:flex-row gap-4 items-center">
        
        {/* Busca */}
        <div className="flex-1 w-full relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Buscar por cliente, número HON..." 
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-salomao-blue outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Grupo de Filtros e Ações */}
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
          <div className="w-full sm:w-48">
            <CustomSelect 
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { label: 'Todos os Status', value: 'all' },
                { label: 'Sob Análise', value: 'analysis' },
                { label: 'Proposta Enviada', value: 'proposal' },
                { label: 'Contrato Fechado', value: 'active' },
                { label: 'Rejeitada', value: 'rejected' },
                { label: 'Probono', value: 'probono' }
              ]}
              placeholder="Status"
              actionIcon={SlidersHorizontal}
            />
          </div>

          <div className="w-full sm:w-48">
            <CustomSelect 
              value={sortBy}
              onChange={setSortBy}
              options={[
                { label: 'Mais Recentes', value: 'newest' },
                { label: 'Mais Antigos', value: 'oldest' },
                { label: 'Ordem Alfabética', value: 'name' }
              ]}
              placeholder="Ordenar"
              actionIcon={ArrowUpDown}
            />
          </div>

          <button onClick={exportToExcel} className="bg-white border border-gray-200 text-gray-600 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-medium flex items-center justify-center min-w-[100px]">
            <Download className="w-4 h-4 mr-2" /> Exportar XLS
          </button>
        </div>
      </div>

      {/* LISTAGEM */}
      {loading ? (
        <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 text-salomao-gold animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredContracts.map((contract) => (
            <div 
              key={contract.id} 
              onClick={() => handleEdit(contract)} 
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer group relative overflow-hidden"
            >
              {/* STATUS & ACTIONS */}
              <div className="flex justify-between items-start mb-4">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(contract.status)}`}>
                  {getStatusLabel(contract.status)}
                </span>
                
                {/* BOTÕES DE AÇÃO (EDITAR/EXCLUIR) */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => handleEdit(contract, e)} 
                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar Contrato"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => requestDelete(contract, e)} 
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Excluir Contrato"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* CONTEÚDO */}
              <h3 className="font-bold text-gray-800 text-lg leading-tight mb-1 group-hover:text-salomao-blue transition-colors line-clamp-2">
                {contract.client_name}
              </h3>
              <p className="text-xs text-gray-400 mb-4">{contract.area} • {contract.uf}</p>

              {contract.hon_number && (
                <div className="mb-4">
                  <span className="font-mono text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                    HON: {contract.hon_number}
                  </span>
                </div>
              )}

              <div className="space-y-2 border-t border-gray-100 pt-4">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Valor Causa</span>
                  <span className="font-medium text-gray-800">{contract.final_success_fee || '-'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Sócio Resp.</span>
                  <span className="font-medium text-salomao-blue">{contract.partner_name || 'N/A'}</span>
                </div>
              </div>

              {/* ALERTA ASSINATURA */}
              {contract.status === 'active' && contract.physical_signature === false && (
                <div className="mt-4 flex items-center text-[10px] text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-100 w-full justify-center">
                  <AlertCircle className="w-3 h-3 mr-1" /> Assinatura Pendente
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* MODALS */}
      <ContractFormModal 
        isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        formData={formData} setFormData={setFormData} onSave={async () => { await handleSave(); }}
        loading={loading} isEditing={isEditing} partners={partners} onOpenPartnerManager={() => setIsPartnerModalOpen(true)}
        processes={processes} currentProcess={currentProcess} setCurrentProcess={setCurrentProcess} editingProcessIndex={editingProcessIndex}
        handleProcessAction={handleProcessAction} editProcess={editProcess} removeProcess={removeProcess} onCNPJSearch={async () => {}}
        newIntermediateFee={newIntermediateFee} setNewIntermediateFee={setNewIntermediateFee} addIntermediateFee={addIntermediateFee} removeIntermediateFee={removeIntermediateFee}
        timelineData={timelineData} getStatusColor={getStatusColor} getStatusLabel={getStatusLabel}
      />

      <PartnerManagerModal isOpen={isPartnerModalOpen} onClose={() => setIsPartnerModalOpen(false)} onPartnersUpdate={fetchPartners} />
      
      <ConfirmModal
        isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={confirmDelete}
        title="Excluir Contrato" message={`Tem certeza que deseja remover o contrato de "${contractToDelete?.client_name}"? Esta ação é irreversível.`}
        loading={deleteLoading} confirmLabel="Sim, Excluir" variant="danger"
      />
    </div>
  );
}