import React, { useState, useEffect } from 'react';
import { Plus, Search, Building2, MapPin, Mail, Phone, MoreHorizontal, User, Edit, Trash2, FileText, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Client, Partner } from '../types';
import { ClientFormModal } from '../components/clients/ClientFormModal';
import { maskCNPJ } from '../utils/masks';

export function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  useEffect(() => {
    fetchClients();
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    const { data } = await supabase.from('partners').select('*').eq('active', true);
    if (data) setPartners(data);
  };

  const fetchClients = async () => {
    setLoading(true);
    try {
      // Ajuste na query para buscar o nome do sócio e contagem de contratos
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          partner:partners(name),
          contracts:contracts(count)
        `)
        .order('name');

      if (error) throw error;

      if (data) {
        const formattedClients = data.map((client: any) => ({
          ...client,
          partner_name: client.partner?.name, // Mapeia o nome do sócio
          active_contracts_count: client.contracts?.[0]?.count || 0
        }));
        setClients(formattedClients);
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    fetchClients();
    setIsModalOpen(false);
    setEditingClient(null);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (!error) fetchClients();
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.cnpj.includes(searchTerm)
  );

  return (
    <div className="p-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-salomao-blue">Clientes</h1>
          <div className="flex items-center mt-1">
            <p className="text-gray-500 mr-3">Gerencie sua base de clientes.</p>
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center">
              <Users className="w-3 h-3 mr-1" /> Total: {clients.length}
            </span>
          </div>
        </div>
        <button
          onClick={() => { setEditingClient(null); setIsModalOpen(true); }}
          className="bg-salomao-gold hover:bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-md transition-colors flex items-center font-bold"
        >
          <Plus className="w-5 h-5 mr-2" /> Novo Cliente
        </button>
      </div>

      <div className="flex items-center mb-6 bg-white p-2 rounded-xl border border-gray-100 shadow-sm w-full max-w-md">
        <Search className="w-5 h-5 text-gray-400 ml-2" />
        <input
          type="text"
          placeholder="Buscar por nome ou CNPJ..."
          className="flex-1 p-2 outline-none text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center p-8 text-gray-500">Carregando...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredClients.map((client) => (
            <div key={client.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all group relative">
              
              {/* Header Compacto */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-800 truncate" title={client.name}>{client.name}</h3>
                  <div className="flex items-center text-xs text-gray-500 mt-0.5">
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] font-mono mr-2">{maskCNPJ(client.cnpj)}</span>
                    {client.uf && <span className="flex items-center"><MapPin className="w-3 h-3 mr-0.5" />{client.uf}</span>}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4 bg-white pl-2">
                  <button onClick={() => handleEdit(client)} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded"><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => client.id && handleDelete(client.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>

              {/* Informações Compactas */}
              <div className="space-y-1.5 text-xs border-t border-gray-50 pt-2 mb-3">
                {client.partner_name && (
                  <div className="flex items-center text-gray-600" title="Sócio Responsável">
                    <User className="w-3.5 h-3.5 mr-2 text-salomao-gold" />
                    <span className="truncate">{client.partner_name}</span>
                  </div>
                )}
                {client.city && (
                  <div className="flex items-center text-gray-500">
                    <Building2 className="w-3.5 h-3.5 mr-2" />
                    <span className="truncate">{client.city}</span>
                  </div>
                )}
                {client.email && (
                  <div className="flex items-center text-gray-500">
                    <Mail className="w-3.5 h-3.5 mr-2" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
              </div>

              {/* Footer Compacto */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                <span className={`px-2 py-0.5 rounded-full font-medium ${client.active_contracts_count ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                  {client.active_contracts_count} Contratos Ativos
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <ClientFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        clientToEdit={editingClient}
        onSave={handleSave}
        partners={partners}
      />
    </div>
  );
}
