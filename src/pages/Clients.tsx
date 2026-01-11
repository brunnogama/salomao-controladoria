import React, { useState, useEffect } from 'react';
import { Plus, Search, Building2, MapPin, Mail, Phone, MoreHorizontal, User, Edit, Trash2, FileText, Users, LayoutGrid, List, ArrowUpDown, Download, Filter, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import * as XLSX from 'xlsx';
import { Client, Partner } from '../types';
import { ClientFormModal } from '../components/clients/ClientFormModal';
import { maskCNPJ } from '../utils/masks';

export function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Toolbar States
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
      const { data, error } = await supabase
        .from('clients')
        .select(`*, partner:partners(name), contracts:contracts(count)`)
        .order('name');

      if (error) throw error;

      if (data) {
        const formattedClients = data.map((client: any) => ({
          ...client,
          partner_name: Array.isArray(client.partner) ? client.partner[0]?.name : client.partner?.name,
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

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (!error) fetchClients();
    }
  };

  const exportToExcel = () => {
    const data = filteredClients.map(c => ({
      'Nome': c.name,
      'CNPJ/CPF': c.cnpj,
      'Sócio Responsável': c.partner_name,
      'Email': c.email,
      'Cidade': c.city,
      'UF': c.uf,
      'Contratos Ativos': c.active_contracts_count
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Clientes");
    XLSX.writeFile(wb, "Relatorio_Clientes.xlsx");
  };

  const filteredClients = clients.filter(client =>
    (client.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.cnpj || '').includes(searchTerm)
  ).sort((a, b) => {
    const nameA = a.name || '';
    const nameB = b.name || '';
    return sortOrder === 'asc' 
      ? nameA.localeCompare(nameB) 
      : nameB.localeCompare(nameA);
  });

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

      <div className="flex flex-col xl:flex-row gap-4 mb-6 bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex-1 flex items-center bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
          <Search className="w-5 h-5 text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Buscar por nome ou CNPJ..."
            className="flex-1 bg-transparent outline-none text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto">
          <button 
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="flex items-center px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors text-sm whitespace-nowrap"
          >
            <ArrowUpDown className="w-4 h-4 mr-2" />
            {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
          </button>

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
        <div className="flex justify-center p-8 text-gray-500">Carregando...</div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredClients.map((client) => (
                <div key={client.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all group relative">
                  
                  {/* Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0 pr-8">
                      <h3 className="font-bold text-gray-800 truncate" title={client.name}>{client.name}</h3>
                      <div className="flex items-center text-xs text-gray-500 mt-0.5">
                        <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] font-mono mr-2">{maskCNPJ(client.cnpj || '')}</span>
                        {client.uf && <span className="flex items-center"><MapPin className="w-3 h-3 mr-0.5" />{client.uf}</span>}
                      </div>
                    </div>
                    <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white pl-2">
                      <button onClick={() => handleEdit(client)} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded"><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={(e) => client.id && handleDelete(e, client.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>

                  {/* Info */}
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

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                    <span className={`px-2 py-0.5 rounded-full font-medium ${client.active_contracts_count ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                      {client.active_contracts_count} Contratos Ativos
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                        <tr>
                            <th className="p-3">Nome / Razão Social</th>
                            <th className="p-3">CNPJ/CPF</th>
                            <th className="p-3">Sócio</th>
                            <th className="p-3">Email</th>
                            <th className="p-3">Localização</th>
                            <th className="p-3 text-right">Contratos</th>
                            <th className="p-3 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredClients.map(client => (
                            <tr key={client.id} className="hover:bg-gray-50 group">
                                <td className="p-3 font-medium text-gray-800">{client.name}</td>
                                <td className="p-3 font-mono text-gray-500">{maskCNPJ(client.cnpj || '')}</td>
                                <td className="p-3 text-gray-600">{client.partner_name || '-'}</td>
                                <td className="p-3 text-gray-600 truncate max-w-[200px]">{client.email || '-'}</td>
                                <td className="p-3 text-gray-600">{client.city ? `${client.city}/${client.uf}` : '-'}</td>
                                <td className="p-3 text-right">
                                    <span className={`px-2 py-0.5 rounded-full font-bold ${client.active_contracts_count ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                                        {client.active_contracts_count}
                                    </span>
                                </td>
                                <td className="p-3 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100">
                                        <button onClick={() => handleEdit(client)} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><Edit className="w-4 h-4" /></button>
                                        <button onClick={(e) => client.id && handleDelete(e, client.id)} className="text-red-600 hover:bg-red-50 p-1 rounded"><Trash2 className="w-4 h-4" /></button>
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