import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Search, SlidersHorizontal, Download, AlertCircle, Loader2, Edit, Trash2, ArrowUpDown, User, LayoutGrid, List } from 'lucide-react';
import * as XLSX from 'xlsx';
import { ContractFormModal } from '../components/contracts/ContractFormModal';
import { PartnerManagerModal } from '../components/partners/PartnerManagerModal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { Contract, Partner, ContractProcess, TimelineEvent } from '../types';
import { CustomSelect } from '../components/ui/CustomSelect';

export function Contracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [partnerFilter, setPartnerFilter] = useState<string>(''); 
  const [sortBy, setSortBy] = useState<string>('newest'); 
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<Contract | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [formData, setFormData] = useState<Contract>({
    status: 'analysis', cnpj: '', has_no_cnpj: false, client_name: '', client_position: 'Autor',
    company_name: '', has_legal_process: true, uf: '', area: '', partner_id: '', observations: '', physical_signature: undefined
  });

  const [processes, setProcesses] = useState<ContractProcess[]>([]);
  const [currentProcess, setCurrentProcess] = useState<ContractProcess>({ process_number: '', cause_value: '', court: '', judge: '' });
  const [editingProcessIndex, setEditingProcessIndex] = useState<number | null>(null);
  const [newIntermediateFee, setNewIntermediateFee] = useState('');
  const [timelineData, setTimelineData] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    fetchContracts();
    fetchPartners();
  }, []);

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

  const handleEdit = async (contract: Contract, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsEditing(true);
    setFormData(contract);
    
    setProcesses([]);
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
        const { error } = await supabase.from('contracts').update(contractData).eq('id', contractId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('contracts').insert(contractData).select().single();
        if (error) throw error;
        contractId = data.id;
      }

      if (contractId) {
        await supabase.from('contract_processes').delete().eq('contract_id', contractId);
        if (processes.length > 0) {
          const processesToSave = processes.map(p => ({
            contract_id: contractId,
            process_number: p.process_number,
            court: p.court,
            judge: p.judge,
            cause_value: p.cause_value
          }));
          await supabase.from('contract_processes').insert(processesToSave);
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

  const handleProcessAction = () => {
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

  const filteredContracts = contracts
    .filter(c => {
      const matchesSearch = c.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.hon_number?.includes(searchTerm);
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchesPartner = partnerFilter === '' || c.partner_id === partnerFilter;
      return matchesSearch && matchesStatus && matchesPartner;
    })
    .sort((a, b) => {
      if (sortBy === 'client') return a.client_name.localeCompare(b.client_name);
      if (sortBy === 'oldest') return new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime();
      if (sortBy === 'partner') return (a.partner_name || '').localeCompare(b.partner_name || '');
      return new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime();
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

  const statusFilterOptions = [
    { label: 'Todos os Status', value: 'all' },
    { label: 'Sob Análise', value: 'analysis' },
    { label: 'Proposta Enviada', value: 'proposal' },
    { label: 'Contrato Fechado', value: 'active' },
    { label: 'Rejeitada', value: 'rejected' },
    { label: 'Probono', value: 'probono' }
  ];

  const partnerFilterOptions = [
    { label: 'Todos os Sócios', value: '' },
    ...partners.map(p => ({ label: p.name, value: p.id }))
  ];

  const sortOptions = [
    { label: 'Mais Recentes', value: 'newest' },
    { label: 'Mais Antigos', value: 'oldest' },
    { label: 'Cliente A-Z', value: 'client' },
    { label: 'Por Sócio', value: 'partner' }
  ];

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      
      <div className="flex justify-between items-center">
        <div><h1 className="text-3xl font-bold text-salomao-blue">Gestão de Contratos</h1><p className="text-gray-500 mt-1">Gerencie o ciclo de vida dos seus casos jurídicos.</p></div>
        <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-salomao-gold hover:bg-yellow-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center font-bold active:scale-95"><Plus className="w-5 h-5 mr-2" /> Novo Caso</button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col xl:flex-row gap-4 items-center">
        <div className="flex-1 w-full relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input type="text" placeholder="Buscar por cliente, número HON..." className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-salomao-blue outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto items-center">
          <div className="w-full sm:w-40"><CustomSelect value={statusFilter} onChange={setStatusFilter} options={statusFilterOptions} placeholder="Status" actionIcon={SlidersHorizontal} /></div>
          <div className="w-full sm:w-40"><CustomSelect value={partnerFilter} onChange={setPartnerFilter} options={partnerFilterOptions} placeholder="Sócio" actionIcon={User} /></div>
          <div className="w-full sm:w-40"><CustomSelect value={sortBy} onChange={setSortBy} options={sortOptions} placeholder="Ordenar" actionIcon={ArrowUpDown} /></div>
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white text-salomao-blue shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}><LayoutGrid className="w-4 h-4" /></button>
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white text-salomao-blue shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}><List className="w-4 h-4" /></button>
          </div>
          <button onClick={exportToExcel} className="bg-green-600 border border-transparent text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition-colors shadow-sm font-medium flex items-center justify-center min-w-[100px]"><Download className="w-4 h-4 mr-2" /> XLS</button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 text-salomao-gold animate-spin" /></div>
      ) : filteredContracts.length === 0 ? (
        <div className="text-center py-20 text-gray-400">Nenhum contrato encontrado.</div>
      ) : (
        <>
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredContracts.map((contract) => (
                <div key={contract.id} onClick={() => handleEdit(contract)} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer group relative overflow-hidden">
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(contract.status)}`}>{getStatusLabel(contract.status)}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => handleEdit(contract, e)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                      <button onClick={(e) => requestDelete(contract, e)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <h3 className="font-bold text-gray-800 text-lg leading-tight mb-1 group-hover:text-salomao-blue transition-colors line-clamp-2">{contract.client_name}</h3>
                  <p className="text-xs text-gray-400 mb-4">{contract.area} • {contract.uf}</p>
                  {contract.hon_number && <div className="mb-4"><span className="font-mono text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-100">HON: {contract.hon_number}</span></div>}
                  <div className="space-y-2 border-t border-gray-100 pt-4">
                    <div className="flex justify-between text-xs"><span className="text-gray-500">Valor Causa</span><span className="font-medium text-gray-800">{contract.final_success_fee || '-'}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-gray-500">Sócio Resp.</span><span className="font-medium text-salomao-blue">{contract.partner_name || 'N/A'}</span></div>
                  </div>
                  {contract.status === 'active' && contract.physical_signature === false && <div className="mt-4 flex items-center text-[10px] text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-100 w-full justify-center"><AlertCircle className="w-3 h-3 mr-1" /> Assinatura Pendente</div>}
                </div>
              ))}
            </div>
          )}
          {viewMode === 'list' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-600">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-bold border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Número HON</th>
                      <th className="px-6 py-4">Cliente / Área</th>
                      <th className="px-6 py-4">Sócio Resp.</th>
                      <th className="px-6 py-4 text-right">Valor</th>
                      <th className="px-6 py-4">Data</th>
                      <th className="px-6 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredContracts.map((contract) => (
                      <tr key={contract.id} onClick={() => handleEdit(contract)} className="hover:bg-gray-50 cursor-pointer transition-colors group">
                        <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(contract.status)} whitespace-nowrap`}>{getStatusLabel(contract.status)}</span></td>
                        <td className="px-6 py-4 font-mono text-xs">{contract.hon_number || '-'}</td>
                        <td className="px-6 py-4"><div className="font-bold text-gray-800">{contract.client_name}</div><div className="text-xs text-gray-400">{contract.area} - {contract.uf}</div></td>
                        <td className="px-6 py-4 text-salomao-blue font-medium">{contract.partner_name || '-'}</td>
                        <td className="px-6 py-4 text-right font-medium text-gray-800">{contract.final_success_fee || '-'}</td>
                        <td className="px-6 py-4 text-xs">{new Date(contract.created_at!).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => handleEdit(contract, e)} className="p-1.5 text-blue-500 hover:bg-blue-100 rounded"><Edit className="w-4 h-4" /></button>
                            <button onClick={(e) => requestDelete(contract, e)} className="p-1.5 text-red-500 hover:bg-red-100 rounded"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
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
        // Props adicionais de Analista (se necessário, ou manter vazio se ainda não implementado no fluxo principal)
        analysts={[]} onOpenAnalystManager={() => {}}
      />

      <PartnerManagerModal isOpen={isPartnerModalOpen} onClose={() => setIsPartnerModalOpen(false)} onPartnersUpdate={fetchPartners} />
      <ConfirmModal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={confirmDelete} title="Excluir Contrato" message={`Tem certeza que deseja remover o contrato de "${contractToDelete?.client_name}"?`} loading={deleteLoading} confirmLabel="Sim, Excluir" variant="danger" />
    </div>
  );
}
