import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Search, Plus, Filter, User, MapPin, Phone, Mail, Edit, Trash2, Building, Briefcase } from 'lucide-react';
import { Client, Partner } from '../types';
import { ClientFormModal } from '../components/clients/ClientFormModal';
import { maskCNPJ } from '../utils/masks';

export function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | undefined>(undefined);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    const { data: partnersData } = await supabase.from('partners').select('*').order('name');
    if (partnersData) setPartners(partnersData);

    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        partner:partners(name),
        contracts:contracts(count)
      `)
      .order('name');

    if (!error && data) {
      const formatted = data.map((c: any) => ({
        ...c,
        partner_name: c.partner?.name,
        active_contracts_count: c.contracts?.[0]?.count || 0
      }));
      setClients(formatted);
    }
    setLoading(false);
  };

  const handleEdit = (client: Client) => {
    setClientToEdit(client);
    setIsModalOpen(true);
  };

  const handleNew = () => {
    setClientToEdit(undefined);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (!error) fetchData();
    else alert('Erro ao excluir: ' + error.message);
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.cnpj?.includes(searchTerm) ||
    c.email?.toLowerCase().includes(searchTerm)
  );

  return (
    <div className="p-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-salomao-blue flex items-center gap-2">
            <Users className="w-8 h-8" /> Clientes
          </h1>
          <p className="text-gray-500 mt-1">Gestão da base de clientes do escritório.</p>
        </div>
        <button onClick={handleNew} className="bg-salomao-gold hover:bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-md transition-colors flex items-center font-bold">
          <Plus className="w-5 h-5 mr-2" /> Novo Cliente
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6 flex items-center">
        <div className="flex-1 flex items-center bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
          <Search className="w-5 h-5 text-gray-400 mr-2" />
          <input 
            type="text" 
            placeholder="Buscar por nome, CNPJ ou email..." 
            className="flex-1 bg-transparent outline-none text-sm"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="ml-4 text-sm text-gray-500">
            Total: <b>{filteredClients.length}</b>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredClients.map(client => (
            <div key={client.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${client.is_person ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                        {client.is_person ? <User className="w-5 h-5" /> : <Building className="w-5 h-5" />}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 line-clamp-1">{client.name}</h3>
                        <p className="text-xs text-gray-500 font-mono">{client.cnpj ? maskCNPJ(client.cnpj) : 'Sem documento'}</p>
                    </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button onClick={() => handleEdit(client)} className="p-1.5 hover:bg-gray-100 rounded text-blue-600"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(client.id!)} className="p-1.5 hover:bg-gray-100 rounded text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="space-y-2 text-xs text-gray-600 mt-4">
                <div className="flex items-center">
                    <Mail className="w-3.5 h-3.5 mr-2 text-gray-400" />
                    <span className="truncate">{client.email || '-'}</span>
                </div>
                <div className="flex items-center">
                    <Phone className="w-3.5 h-3.5 mr-2 text-gray-400" />
                    <span>{client.phone || '-'}</span>
                </div>
                <div className="flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-2 text-gray-400" />
                    <span className="truncate">{client.city ? `${client.city}/${client.uf}` : '-'}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-50 flex justify-between items-center text-xs">
                 <div className="flex items-center text-gray-500" title="Sócio Responsável">
                    <User className="w-3 h-3 mr-1 text-salomao-gold" />
                    {client.partner_name || 'N/A'}
                 </div>
                 {client.active_contracts_count !== undefined && client.active_contracts_count > 0 && (
                     <div className="flex items-center text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                        <Briefcase className="w-3 h-3 mr-1" />
                        {client.active_contracts_count} Casos
                     </div>
                 )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ClientFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        client={clientToEdit} 
        onSave={fetchData}
      />
    </div>
  );
}