import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus } from 'lucide-react';
import * as XLSX from 'xlsx';

import { Contract, Partner, ContractProcess, TimelineEvent } from '../types';
import { maskHon, unmaskMoney, toTitleCase } from '../utils/masks';
import { ContractFilters } from '../components/contracts/ContractFilters';
import { ContractTable } from '../components/contracts/ContractTable';
import { ContractCards } from '../components/contracts/ContractCards';
import { ContractFormModal } from '../components/contracts/ContractFormModal';
import { PartnerManagerModal } from '../components/contracts/PartnerManagerModal';

export function Contracts() {
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [contracts, setContracts] = useState<any[]>([]);
  
  // Edit State
  const [editingContractId, setEditingContractId] = useState<string | null>(null);
  const [initialStatus, setInitialStatus] = useState<string>('');
  const [timelineData, setTimelineData] = useState<TimelineEvent[]>([]);

  // Partner Management State
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isPartnerManagerOpen, setIsPartnerManagerOpen] = useState(false);
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
    timesheet: false,
    physical_signature: false // Novo campo
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
    let query = supabase.from('contracts').select(`*, clients(name), partners(name), contract_processes(count)`);
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

  const fetchProcessesForContract = async (contractId: string) => {
    const { data } = await supabase.from('contract_processes').select('*').eq('contract_id', contractId);
    if (data) setProcesses(data);
  };

  const fetchTimeline = async (contractId: string) => {
    const { data } = await supabase.from('contract_timeline').select('*').eq('contract_id', contractId).order('changed_at', { ascending: false });
    if (data) setTimelineData(data);
  };

  // --- ACTIONS ---
  const handleEdit = async (contract: any) => {
    setLoading(true);
    setEditingContractId(contract.id);
    setInitialStatus(contract.status);
    
    // Popula o form
    const baseData = { ...contract };
    if (contract.hon_number) baseData.hon_number = maskHon(contract.hon_number);
    // Garante que o boolean venha correto
    baseData.physical_signature = contract.physical_signature || false;
    
    setFormData(baseData);
    
    await fetchProcessesForContract(contract.id);
    await fetchTimeline(contract.id);
    setLoading(false);
    setIsModalOpen(true);
  };

  const handleCreateNew = () => {
    setEditingContractId(null);
    setFormData(initialFormState);
    setProcesses([]);
    setTimelineData([]);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userName = user?.email?.split('@')[0] || 'Sistema';

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

      const payload: any = {
        status: formData.status,
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
        physical_signature: formData.physical_signature, // Salva o novo campo
        financial_data: financialData
      };

      if (clientId) payload.client_id = clientId;

      let contractId = editingContractId;

      if (editingContractId) {
        const { error } = await supabase.from('contracts').update(payload).eq('id', editingContractId);
        if (error) throw error;
        if (initialStatus !== formData.status) {
          await supabase.from('contract_timeline').insert({
            contract_id: editingContractId,
            previous_status: initialStatus,
            new_status: formData.status,
            changed_by: toTitleCase(userName)
          });
        }
      } else {
        const { data, error } = await supabase.from('contracts').insert(payload).select('id').single();
        if (error) throw error;
        contractId = data.id;
        await supabase.from('contract_timeline').insert({
          contract_id: contractId,
          previous_status: 'Criação',
          new_status: formData.status,
          changed_by: toTitleCase(userName)
        });
      }

      if (contractId) {
        await supabase.from('contract_processes').delete().eq('contract_id', contractId);
        if (processes.length > 0) {
          const processesToSave = processes.map(p => ({
            contract_id: contractId,
            process_number: p.process_number,
            cause_value: unmaskMoney(p.cause_value.toString()),
            court: p.court,
            judge: p.judge
          }));
          await supabase.from('contract_processes').insert(processesToSave);
        }
      }

      setIsModalOpen(false);
      fetchContracts();
    } catch (error: any) {
      alert('Erro ao salvar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContract = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Tem certeza que deseja excluir este caso?')) return;
    const { error } = await supabase.from('contracts').delete().eq('id', id);
    if (!error) setContracts(contracts.filter(c => c.id !== id));
  };

  // --- PARTNER MANAGER ---
  const handleAddPartner = async () => {
    if (!newPartnerName) return;
    const { data, error } = await supabase.from('partners').insert({ name: toTitleCase(newPartnerName) }).select().single();
    if (!error && data) { setPartners([...partners, data]); setNewPartnerName(''); }
  };

  const handleUpdatePartner = async () => {
    if (!editingPartner || !newPartnerName) return;
    const { error } = await supabase.from('partners').update({ name: toTitleCase(newPartnerName) }).eq('id', editingPartner.id);
    if (!error) {
      setPartners(partners.map(p => p.id === editingPartner.id ? { ...p, name: toTitleCase(newPartnerName) } : p));
      setEditingPartner(null); setNewPartnerName('');
    }
  };

  const handleDeletePartner = async (id: string) => {
    if (!confirm('Remover sócio?')) return;
    const { error } = await supabase.from('partners').update({ active: false }).eq('id', id);
    if (!error) setPartners(partners.filter(p => p.id !== id));
  };

  // --- HELPERS ---
  const handleCNPJSearch = async () => {
    const cleanCNPJ = formData.cnpj.replace(/\D/g, '');
    if (cleanCNPJ.length !== 14) return alert('CNPJ inválido');
    setLoading(true);
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCNPJ}`);
      const data = await response.json();
      if (data.razao_social) setFormData(prev => ({ ...prev, client_name: toTitleCase(data.razao_social) }));
    } catch (e) { alert('Erro ao buscar CNPJ.'); } finally { setLoading(false); }
  };

  const handleProcessAction = () => {
    if (!currentProcess.process_number) return;
    if (editingProcessIndex !== null) {
      const updated = [...processes]; updated[editingProcessIndex] = currentProcess; setProcesses(updated); setEditingProcessIndex(null);
    } else { setProcesses(prev => [...prev, currentProcess]); }
    setCurrentProcess({ process_number: '', cause_value: '', court: '', judge: '' });
  };

  const editProcess = (index: number) => { setCurrentProcess(processes[index]); setEditingProcessIndex(index); };
  const removeProcess = (index: number) => { setProcesses(processes.filter((_, i) => i !== index)); };
  
  const addIntermediateFee = () => { 
    if (!newIntermediateFee) return; 
    setFormData(prev => ({ ...prev, intermediate_fees: [...(prev.intermediate_fees || []), newIntermediateFee] })); 
    setNewIntermediateFee(''); 
  };
  const removeIntermediateFee = (index: number) => { setFormData(prev => ({ ...prev, intermediate_fees: (prev.intermediate_fees || []).filter((_, i) => i !== index) })); };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(contracts);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Contratos");
    XLSX.writeFile(wb, "salomao_contratos.xlsx");
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
        <div><h1 className="text-2xl font-bold text-gray-800">Gestão de Contratos</h1><p className="text-gray-500 text-sm">Controle unificado de casos, clientes e jurimetria.</p></div>
        <button onClick={handleCreateNew} className="bg-salomao-gold hover:bg-yellow-600 text-white px-4 py-2 rounded-lg flex items-center shadow-lg transition-all"><Plus className="w-5 h-5 mr-2" />Novo Caso</button>
      </div>

      <ContractFilters 
        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
        statusFilter={statusFilter} setStatusFilter={setStatusFilter}
        partnerFilter={partnerFilter} setPartnerFilter={setPartnerFilter} partners={partners}
        sortOrder={sortOrder} setSortOrder={setSortOrder}
        viewMode={viewMode} setViewMode={setViewMode}
        onExport={exportToExcel}
      />

      {viewMode === 'list' ? (
        <ContractTable 
          contracts={filteredAndSortedContracts} 
          onEdit={handleEdit} 
          onDelete={handleDeleteContract}
          getStatusColor={getStatusColor}
          getStatusLabel={getStatusLabel}
        />
      ) : (
        <ContractCards 
          contracts={filteredAndSortedContracts} 
          onEdit={handleEdit} 
          onDelete={handleDeleteContract}
          getStatusColor={getStatusColor}
          getStatusLabel={getStatusLabel}
        />
      )}

      <ContractFormModal
        isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        formData={formData} setFormData={setFormData} onSave={handleSave} loading={loading} isEditing={!!editingContractId}
        partners={partners} onOpenPartnerManager={() => setIsPartnerManagerOpen(true)} onCNPJSearch={handleCNPJSearch}
        processes={processes} currentProcess={currentProcess} setCurrentProcess={setCurrentProcess} editingProcessIndex={editingProcessIndex}
        handleProcessAction={handleProcessAction} editProcess={editProcess} removeProcess={removeProcess}
        newIntermediateFee={newIntermediateFee} setNewIntermediateFee={setNewIntermediateFee} addIntermediateFee={addIntermediateFee} removeIntermediateFee={removeIntermediateFee}
        timelineData={timelineData} getStatusColor={getStatusColor} getStatusLabel={getStatusLabel}
      />

      <PartnerManagerModal 
        isOpen={isPartnerManagerOpen} onClose={() => setIsPartnerManagerOpen(false)}
        partners={partners} newPartnerName={newPartnerName} setNewPartnerName={setNewPartnerName}
        editingPartner={editingPartner} setEditingPartner={setEditingPartner}
        onAdd={handleAddPartner} onUpdate={handleUpdatePartner} onDelete={handleDeletePartner}
      />
    </div>
  );
}