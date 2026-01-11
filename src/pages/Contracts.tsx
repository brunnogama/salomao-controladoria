import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, MoreHorizontal, Calendar, DollarSign, User, Briefcase, FileText, CheckCircle2, Clock, XCircle, AlertCircle, Scale, Tag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Contract, Partner, ContractProcess, TimelineEvent, Analyst } from '../types';
import { ContractFormModal } from '../components/contracts/ContractFormModal';
import { PartnerManagerModal } from '../components/partners/PartnerManagerModal';
import { AnalystManagerModal } from '../components/analysts/AnalystManagerModal';
import { parseCurrency } from '../utils/masks';

// ... (Manter as mesmas funções auxiliares getStatusColor e getStatusLabel)
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

export function Contracts() {
  // ... (Manter todos os estados existentes)
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [analysts, setAnalysts] = useState<Analyst[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [isAnalystModalOpen, setIsAnalystModalOpen] = useState(false);
  
  // Estados do formulário (Manter igual)
  const emptyContract: Contract = {
    cnpj: '', has_no_cnpj: false, client_name: '', client_position: 'Autor', area: '', uf: 'RJ', partner_id: '', has_legal_process: false,
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

  // ... (Manter todas as funções de manipulação: handleNew, handleEdit, handleSave, processAction, etc.)
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
    
    // Fetch related data
    const [procRes, timeRes] = await Promise.all([
        supabase.from('contract_processes').select('*').eq('contract_id', contract.id),
        supabase.from('contract_timeline').select('*').eq('contract_id', contract.id).order('changed_at', { ascending: false })
    ]);

    if (procRes.data) setProcesses(procRes.data);
    if (timeRes.data) setTimelineData(timeRes.data);
    
    setIsModalOpen(true);
  };

  const handleSave = () => {
    fetchData(); 
    // O fechamento do modal é controlado pelo próprio modal após sucesso
  };

  // ... (Funções de processo e fees omitidas para brevidade, mas devem ser mantidas no arquivo original)
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

  // Filtragem
  const filteredContracts = contracts.filter(c => {
    const matchesSearch = c.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.hon_number?.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-salomao-blue">Contratos</h1>
          <div className="flex items-center mt-1">
            <p className="text-gray-500 mr-3">Gestão completa de casos e propostas.</p>
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center">
              <Briefcase className="w-3 h-3 mr-1" /> Total: {contracts.length}
            </span>
          </div>
        </div>
        <button onClick={handleNew} className="bg-salomao-gold hover:bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-md transition-colors flex items-center font-bold">
          <Plus className="w-5 h-5 mr-2" /> Novo Caso
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 flex items-center bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
          <Search className="w-5 h-5 text-gray-400 ml-2" />
          <input 
            type="text" 
            placeholder="Buscar por cliente ou HON..." 
            className="flex-1 p-2 outline-none text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center bg-white p-2 rounded-xl border border-gray-100 shadow-sm min-w-[200px]">
          <Filter className="w-5 h-5 text-gray-400 ml-2" />
          <select 
            className="flex-1 p-2 outline-none text-sm bg-transparent"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Todos os Status</option>
            <option value="analysis">Sob Análise</option>
            <option value="proposal">Proposta Enviada</option>
            <option value="active">Contrato Fechado</option>
            <option value="rejected">Rejeitada</option>
            <option value="probono">Probono</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 text-salomao-gold animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredContracts.map((contract) => (
            <div key={contract.id} onClick={() => handleEdit(contract)} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group">
              
              {/* Header Compacto */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0 pr-2">
                  <h3 className="font-bold text-gray-800 text-sm truncate" title={contract.client_name}>{contract.client_name}</h3>
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase mt-1 border ${getStatusColor(contract.status)}`}>
                    {getStatusLabel(contract.status)}
                  </span>
                </div>
                {contract.status === 'active' && contract.hon_number && (
                  <span className="text-[10px] font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 whitespace-nowrap">
                    {contract.hon_number}
                  </span>
                )}
              </div>

              {/* Informações Densas */}
              <div className="space-y-1.5 text-xs text-gray-600">
                <div className="flex items-center">
                  <Briefcase className="w-3.5 h-3.5 mr-2 text-salomao-blue" />
                  <span className="truncate">{contract.area || 'Área não inf.'}</span>
                </div>
                <div className="flex items-center">
                  <User className="w-3.5 h-3.5 mr-2 text-salomao-gold" />
                  <span className="truncate">{contract.partner_name || 'Sem sócio'}</span>
                </div>
                <div className="flex items-center">
                  <Scale className="w-3.5 h-3.5 mr-2 text-gray-400" />
                  <span>{contract.process_count || 0} Processos</span>
                </div>
              </div>

              {/* Footer Financeiro e Datas */}
              <div className="mt-3 pt-2 border-t border-gray-50 flex justify-between items-end">
                <div className="text-[10px] text-gray-400">
                  <div className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {new Date(contract.created_at || '').toLocaleDateString()}
                  </div>
                </div>
                {contract.status === 'active' && (
                  <div className="text-right">
                    {contract.pro_labore && parseCurrency(contract.pro_labore) > 0 && (
                      <div className="text-xs font-bold text-green-700">{contract.pro_labore}</div>
                    )}
                    {contract.final_success_fee && parseCurrency(contract.final_success_fee) > 0 && (
                      <div className="text-[10px] text-gray-500">+ {contract.final_success_fee} êxito</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modais */}
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
        onCNPJSearch={() => {}} // Placeholder
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

      <PartnerManagerModal 
        isOpen={isPartnerModalOpen} 
        onClose={() => setIsPartnerModalOpen(false)} 
        onUpdate={fetchData} 
      />

      <AnalystManagerModal
        isOpen={isAnalystModalOpen}
        onClose={() => setIsAnalystModalOpen(false)}
        onUpdate={fetchData}
      />
    </div>
  );
}