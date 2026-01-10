import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Search, Building2, User, Globe, Mail, MapPin, Briefcase, Edit, Trash2, Loader2, AlertCircle, Download, ArrowUpDown, SlidersHorizontal, LayoutGrid, List } from 'lucide-react';
import { Client, Partner } from '../types';
import { ClientFormModal } from '../components/clients/ClientFormModal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { CustomSelect } from '../components/ui/CustomSelect';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';

export function Clients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  
  // VISUALIZAÇÃO, FILTROS & ORDENAÇÃO
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid'); // NOVO
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPartner, setSelectedPartner] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('name');
  
  // MODALS
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
  // Exclusão
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState<Client>({ name: '', cnpj: '', is_person: false });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: partnersData } = await supabase.from('partners').select('*').order('name');
    if (partnersData) setPartners(partnersData);

    const { data: clientsData } = await supabase.from('clients').select('*').order('name');
    
    if (clientsData) {
      const clientsWithDetails = await Promise.all(clientsData.map(async (client) => {
        const { data: contracts } = await supabase.from('contracts').select('id, status, hon_number').eq('client_id', client.id);
        const activeContracts = contracts?.filter(c => c.status === 'active') || [];
        const partner = partnersData?.find(p => p.id === client.partner_id);
        return { ...client, active_contracts_count: activeContracts.length, contracts_hon: activeContracts.map(c => c.hon_number).filter(Boolean), partner_name: partner ? partner.name : null };
      }));
      setClients(clientsWithDetails as Client[]);
    }
    setLoading(false);
  };

  const handleOpenModal = (client?: Client) => {
    setErrorMessage(null);
    if (client) { setEditingClient(client); setFormData(client); } 
    else { setEditingClient(null); setFormData({ name: '', cnpj: '', is_person: false }); }
    setIsModalOpen(true);
  };

  const requestDelete = (client: Client, e: React.MouseEvent) => {
    e.stopPropagation(); setErrorMessage(null); setClientToDelete(client); setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!clientToDelete?.id) return;
    setDeleteLoading(true); setErrorMessage(null);
    try {
      const { error } = await supabase.from('clients').delete().eq('id', clientToDelete.id);
      if (error) {
        if (error.code === '23503') setErrorMessage("Não é possível excluir este cliente pois existem Contratos vinculados. Desvincule os contratos primeiro.");
        else setErrorMessage("Ocorreu um erro ao excluir.");
      } else {
        setClients(clients.filter(c => c.id !== clientToDelete.id));
        setDeleteModalOpen(false);
        setClientToDelete(null);
      }
    } catch (err) { setErrorMessage("Erro inesperado."); } 
    finally { setDeleteLoading(false); }
  };

  const handleSave = async () => {
    const { active_contracts_count, contracts_hon, partner_name, ...saveData } = formData;
    if (editingClient?.id) await supabase.from('clients').update(saveData).eq('id', editingClient.id);
    else await supabase.from('clients').insert(saveData);
    setIsModalOpen(false); fetchData();
  };

  const exportToExcel = () => {
    const data = filteredClients.map(c => ({
      'Nome': c.name, 'Documento': c.cnpj, 'Tipo': c.is_person ? 'Pessoa Física' : 'Pessoa Jurídica',
      'E-mail': c.email || '-', 'Sócio': c.partner_name || '-', 'Contratos Ativos': c.active_contracts_count || 0
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Clientes");
    XLSX.writeFile(wb, "Relatorio_Clientes.xlsx");
  };

  const filteredClients = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.cnpj.includes(searchTerm);
    const matchesPartner = selectedPartner ? c.partner_id === selectedPartner : true;
    const matchesType = selectedType ? (selectedType === 'pf' ? c.is_person : !c.is_person) : true;
    return matchesSearch && matchesPartner && matchesType;
  }).sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
  });

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 relative">
      
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-salomao-blue">Carteira de Clientes</h1>
          <p className="text-gray-500 mt-1">Gerenciamento de contatos e empresas.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="bg-salomao-gold hover:bg-yellow-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center font-bold active:scale-95">
          <Plus className="w-5 h-5 mr-2" /> Novo Cliente
        </button>
      </div>

      {/* ERROR BANNER */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 animate-in slide-in-from-top-2 shadow-sm">
          <div className="bg-red-100 p-2 rounded-full text-red-600"><AlertCircle className="w-5 h-5" /></div>
          <div className="flex-1"><h4 className="text-sm font-bold text-red-800">Ação Bloqueada</h4><p className="text-sm text-red-600">{errorMessage}</p></div>
          <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-red-700 font-bold text-sm">Dispensar</button>
        </div>
      )}

      {/* BARRA DE FERRAMENTAS UNIFICADA */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col xl:flex-row gap-4 items-center">
        
        {/* Busca */}
        <div className="flex-1 w-full relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input type="text" placeholder="Buscar por nome ou documento..." className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-salomao-blue outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto items-center">
          <div className="w-full sm:w-48">
            <CustomSelect value={selectedPartner} onChange={setSelectedPartner} options={[{ label: 'Todos os Sócios', value: '' }, ...partners.map(p => ({ label: p.name, value: p.id }))]} placeholder="Sócio" actionIcon={User} />
          </div>
          <div className="w-full sm:w-40">
            <CustomSelect value={selectedType} onChange={setSelectedType} options={[{ label: 'Todos Tipos', value: '' }, { label: 'Pessoa Física', value: 'pf' }, { label: 'Pessoa Jurídica', value: 'pj' }]} placeholder="Tipo" actionIcon={SlidersHorizontal} />
          </div>
          <div className="w-full sm:w-40">
            <CustomSelect value={sortBy} onChange={setSortBy} options={[{ label: 'Cliente A-Z', value: 'name' }, { label: 'Mais Recentes', value: 'newest' }]} placeholder="Ordenar" actionIcon={ArrowUpDown} />
          </div>
          
          {/* TOGGLE VIEW BUTTONS */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white text-salomao-blue shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white text-salomao-blue shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
              <List className="w-4 h-4" />
            </button>
          </div>

          <button onClick={exportToExcel} className="bg-green-600 border border-transparent text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition-colors shadow-sm font-medium flex items-center justify-center min-w-[100px]">
            <Download className="w-4 h-4 mr-2" /> XLS
          </button>
        </div>
      </div>

      {/* LISTAGEM */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-salomao-gold animate-spin" /></div>
      ) : filteredClients.length === 0 ? (
        <div className="text-center py-20 text-gray-400">Nenhum cliente encontrado.</div>
      ) : (
        <>
          {/* MODO GRADE (CARDS) */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredClients.map((client) => (
                <div key={client.id} onClick={() => handleOpenModal(client)} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer group relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-1 h-full ${client.is_person ? 'bg-purple-500' : 'bg-blue-500'}`}></div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${client.is_person ? 'bg-purple-50' : 'bg-blue-50'}`}>
                        {client.is_person ? <User className="w-5 h-5 text-purple-600" /> : <Building2 className="w-5 h-5 text-blue-600" />}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800 text-lg leading-tight group-hover:text-salomao-blue transition-colors line-clamp-1" title={client.name}>{client.name}</h3>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">{client.cnpj}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); handleOpenModal(client); }} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                      <button onClick={(e) => requestDelete(client, e)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4 min-h-[80px]">
                    {client.partner_name && <div className="flex items-center text-xs text-salomao-blue font-medium bg-blue-50 w-fit px-2 py-1 rounded mb-2"><User className="w-3 h-3 mr-1" /> Resp: {client.partner_name}</div>}
                    {client.email ? <div className="flex items-center text-xs text-gray-500 truncate"><Mail className="w-3 h-3 mr-2 text-gray-300 flex-shrink-0" /> {client.email}</div> : <div className="flex items-center text-xs text-gray-300 italic"><Mail className="w-3 h-3 mr-2 opacity-50" /> Sem e-mail</div>}
                    {client.city ? <div className="flex items-center text-xs text-gray-500"><MapPin className="w-3 h-3 mr-2 text-gray-300 flex-shrink-0" /> {client.city}/{client.uf}</div> : <div className="flex items-center text-xs text-gray-300 italic"><MapPin className="w-3 h-3 mr-2 opacity-50" /> Sem endereço</div>}
                  </div>
                  <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-600"><Briefcase className="w-3.5 h-3.5" /> {client.active_contracts_count} Contratos Ativos</div>
                    <div className="flex gap-1">
                      {client.contracts_hon?.slice(0, 3).map((hon, idx) => (<span key={idx} onClick={(e) => { e.stopPropagation(); navigate('/contratos'); }} className="bg-green-50 text-green-700 border border-green-100 px-1.5 py-0.5 rounded text-[10px] font-mono hover:bg-green-100 transition-colors">#{hon}</span>))}
                      {(client.contracts_hon?.length || 0) > 3 && <span className="text-[10px] text-gray-400 font-medium">+{client.contracts_hon!.length - 3}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* MODO LISTA (TABELA) */}
          {viewMode === 'list' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-600">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-bold border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4">Nome / Razão Social</th>
                      <th className="px-6 py-4">Documento</th>
                      <th className="px-6 py-4">Tipo</th>
                      <th className="px-6 py-4">Sócio Resp.</th>
                      <th className="px-6 py-4">Localização</th>
                      <th className="px-6 py-4 text-center">Contratos</th>
                      <th className="px-6 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredClients.map((client) => (
                      <tr key={client.id} onClick={() => handleOpenModal(client)} className="hover:bg-gray-50 cursor-pointer transition-colors group">
                        <td className="px-6 py-4 font-bold text-gray-800">{client.name}</td>
                        <td className="px-6 py-4 font-mono text-xs">{client.cnpj}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${client.is_person ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {client.is_person ? 'Física' : 'Jurídica'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-salomao-blue font-medium">{client.partner_name || '-'}</td>
                        <td className="px-6 py-4 text-xs">{client.city ? `${client.city}/${client.uf}` : '-'}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded font-bold text-xs">{client.active_contracts_count}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); handleOpenModal(client); }} className="p-1.5 text-blue-500 hover:bg-blue-100 rounded"><Edit className="w-4 h-4" /></button>
                            <button onClick={(e) => requestDelete(client, e)} className="p-1.5 text-red-500 hover:bg-red-100 rounded"><Trash2 className="w-4 h-4" /></button>
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

      <ClientFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} formData={formData} setFormData={setFormData} onSave={handleSave} loading={false} isEditing={!!editingClient} partners={partners} />
      <ConfirmModal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={confirmDelete} title="Excluir Cliente" message={`Tem certeza que deseja remover o cliente "${clientToDelete?.name}"?`} loading={deleteLoading} confirmLabel="Sim, Excluir" variant="danger" />
    </div>
  );
}