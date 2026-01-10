import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Search, Building2, User, Globe, Mail, MapPin, Briefcase, Edit, Trash2, Loader2, Filter } from 'lucide-react';
import { Client, Partner } from '../types';
import { ClientFormModal } from '../components/clients/ClientFormModal';
import { useNavigate } from 'react-router-dom';
import { CustomSelect } from '../components/ui/CustomSelect';

export function Clients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]); // Estado para sócios
  const [loading, setLoading] = useState(true);
  
  // FILTROS
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPartner, setSelectedPartner] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<Client>({
    name: '', cnpj: '', is_person: false
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // 1. Busca Sócios
    const { data: partnersData } = await supabase.from('partners').select('*').order('name');
    if (partnersData) setPartners(partnersData);

    // 2. Busca Clientes
    const { data: clientsData } = await supabase.from('clients').select('*').order('name');
    
    if (clientsData) {
      // 3. Busca contratos para métricas
      const clientsWithDetails = await Promise.all(clientsData.map(async (client) => {
        const { data: contracts } = await supabase
          .from('contracts')
          .select('id, status, hon_number')
          .eq('client_id', client.id);
        
        const activeContracts = contracts?.filter(c => c.status === 'active') || [];
        
        // Encontra nome do sócio
        const partner = partnersData?.find(p => p.id === client.partner_id);

        return {
          ...client,
          active_contracts_count: activeContracts.length,
          contracts_hon: activeContracts.map(c => c.hon_number).filter(Boolean),
          partner_name: partner ? partner.name : null
        };
      }));
      
      setClients(clientsWithDetails as Client[]);
    }
    setLoading(false);
  };

  const handleOpenModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData(client);
    } else {
      setEditingClient(null);
      setFormData({ name: '', cnpj: '', is_person: false });
    }
    setIsModalOpen(true);
  };

  const handleDeleteClient = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Tem certeza que deseja excluir este cliente? Todos os vínculos com contratos serão removidos.')) return;

    setLoading(true);
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) {
      alert('Erro ao excluir: ' + error.message);
    } else {
      setClients(clients.filter(c => c.id !== id));
    }
    setLoading(false);
  };

  const handleSave = async () => {
    const { active_contracts_count, contracts_hon, partner_name, ...saveData } = formData;
    
    if (editingClient?.id) {
      await supabase.from('clients').update(saveData).eq('id', editingClient.id);
    } else {
      await supabase.from('clients').insert(saveData);
    }
    setIsModalOpen(false);
    fetchData(); // Recarrega para atualizar vínculos e nomes
  };

  // Lógica de Filtragem
  const filteredClients = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.cnpj.includes(searchTerm);
    const matchesPartner = selectedPartner ? c.partner_id === selectedPartner : true;
    const matchesType = selectedType ? (selectedType === 'pf' ? c.is_person : !c.is_person) : true;
    
    return matchesSearch && matchesPartner && matchesType;
  });

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-salomao-blue">Carteira de Clientes</h1>
          <p className="text-gray-500 mt-1">Gerenciamento de contatos e empresas.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="bg-salomao-gold hover:bg-yellow-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center font-bold active:scale-95">
          <Plus className="w-5 h-5 mr-2" /> Novo Cliente
        </button>
      </div>

      {/* BARRA DE FILTROS (Igual Contratos) */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
        
        {/* Busca */}
        <div className="flex-1 w-full relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Buscar por nome ou documento..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-salomao-blue outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filtro Sócio */}
        <div className="w-full md:w-64">
          <CustomSelect 
            value={selectedPartner}
            onChange={setSelectedPartner}
            options={[{ label: 'Todos os Sócios', value: '' }, ...partners.map(p => ({ label: p.name, value: p.id }))]}
            placeholder="Filtrar por Sócio"
          />
        </div>

        {/* Filtro Tipo */}
        <div className="w-full md:w-48">
          <CustomSelect 
            value={selectedType}
            onChange={setSelectedType}
            options={[
              { label: 'Todos os Tipos', value: '' },
              { label: 'Pessoa Física', value: 'pf' },
              { label: 'Pessoa Jurídica', value: 'pj' }
            ]}
            placeholder="Tipo de Pessoa"
          />
        </div>
      </div>

      {/* LISTAGEM */}
      {loading && clients.length === 0 ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-salomao-gold animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <div 
              key={client.id} 
              onClick={() => handleOpenModal(client)} 
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer group relative overflow-hidden"
            >
              <div className={`absolute top-0 left-0 w-1 h-full ${client.is_person ? 'bg-purple-500' : 'bg-blue-500'}`}></div>
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${client.is_person ? 'bg-purple-50' : 'bg-blue-50'}`}>
                    {client.is_person ? <User className="w-5 h-5 text-purple-600" /> : <Building2 className="w-5 h-5 text-blue-600" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg leading-tight group-hover:text-salomao-blue transition-colors line-clamp-1" title={client.name}>
                      {client.name}
                    </h3>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">{client.cnpj}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleOpenModal(client); }} 
                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => handleDeleteClient(client.id!, e)} 
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* DADOS DE CONTATO & SÓCIO */}
              <div className="space-y-2 mb-4 min-h-[80px]">
                {/* Exibe o Sócio Responsável se houver */}
                {client.partner_name && (
                  <div className="flex items-center text-xs text-salomao-blue font-medium bg-blue-50 w-fit px-2 py-1 rounded mb-2">
                    <User className="w-3 h-3 mr-1" /> Resp: {client.partner_name}
                  </div>
                )}

                {client.email ? (
                  <div className="flex items-center text-xs text-gray-500 truncate" title={client.email}>
                    <Mail className="w-3 h-3 mr-2 text-gray-300 flex-shrink-0" /> {client.email}
                  </div>
                ) : (
                  <div className="flex items-center text-xs text-gray-300 italic"><Mail className="w-3 h-3 mr-2 opacity-50" /> Sem e-mail</div>
                )}
                
                {client.city ? (
                  <div className="flex items-center text-xs text-gray-500">
                    <MapPin className="w-3 h-3 mr-2 text-gray-300 flex-shrink-0" /> {client.city}/{client.uf}
                  </div>
                ) : (
                  <div className="flex items-center text-xs text-gray-300 italic"><MapPin className="w-3 h-3 mr-2 opacity-50" /> Sem endereço</div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-600">
                  <Briefcase className="w-3.5 h-3.5" />
                  {client.active_contracts_count} Contratos Ativos
                </div>
                
                <div className="flex gap-1">
                  {client.contracts_hon?.slice(0, 3).map((hon, idx) => (
                    <span 
                      key={idx} 
                      onClick={(e) => { e.stopPropagation(); navigate('/contratos'); }}
                      className="bg-green-50 text-green-700 border border-green-100 px-1.5 py-0.5 rounded text-[10px] font-mono hover:bg-green-100 transition-colors"
                    >
                      #{hon}
                    </span>
                  ))}
                  {(client.contracts_hon?.length || 0) > 3 && (
                    <span className="text-[10px] text-gray-400 font-medium">+{client.contracts_hon!.length - 3}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ClientFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        formData={formData} 
        setFormData={setFormData} 
        onSave={handleSave} 
        loading={false} 
        isEditing={!!editingClient}
        partners={partners} // Passa sócios para o modal
      />
    </div>
  );
}