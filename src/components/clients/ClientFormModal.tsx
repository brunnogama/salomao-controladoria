import React, { useState, useEffect } from 'react';
import { X, Save, Building2, MapPin, Mail, User, AlertCircle, Search, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Client, Partner } from '../../types';
import { maskCNPJ } from '../../utils/masks';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  clientToEdit: Client | null;
  onSave: () => void;
  partners: Partner[];
}

export function ClientFormModal({ isOpen, onClose, clientToEdit, onSave, partners }: Props) {
  const [formData, setFormData] = useState<Client>({
    name: '', cnpj: '', is_person: false, uf: '', address: '', number: '', complement: '', city: '', email: '', partner_id: ''
  });
  const [loading, setLoading] = useState(false);
  const [searchingCNPJ, setSearchingCNPJ] = useState(false);

  useEffect(() => {
    if (clientToEdit) {
      setFormData(clientToEdit);
    } else {
      setFormData({
        name: '', cnpj: '', is_person: false, uf: '', address: '', number: '', complement: '', city: '', email: '', partner_id: ''
      });
    }
  }, [clientToEdit, isOpen]);

  const handleSearchCNPJ = async () => {
    const cleanCNPJ = formData.cnpj.replace(/\D/g, '');
    if (cleanCNPJ.length !== 14) return alert('CNPJ inválido');
    
    setSearchingCNPJ(true);
    try {
      const response = await fetch(`https://publica.cnpj.ws/cnpj/${cleanCNPJ}`);
      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({
          ...prev,
          name: data.razao_social,
          address: data.estabelecimento.logradouro,
          number: data.estabelecimento.numero,
          complement: data.estabelecimento.complemento,
          city: data.estabelecimento.cidade.nome,
          uf: data.estabelecimento.estado.sigla,
          email: data.estabelecimento.email
        }));
      } else {
        alert('CNPJ não encontrado.');
      }
    } catch (error) {
      console.error(error);
      alert('Erro ao buscar CNPJ.');
    } finally {
      setSearchingCNPJ(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return alert('Nome é obrigatório');
    
    setLoading(true);
    try {
      // CORREÇÃO: Criamos um payload limpo apenas com os campos da tabela.
      // Isso remove campos virtuais como 'partner_name' ou 'contracts' que causam erro 400.
      const payload = {
          name: formData.name,
          cnpj: formData.cnpj || null,
          is_person: formData.is_person,
          uf: formData.uf,
          address: formData.address,
          number: formData.number,
          complement: formData.complement,
          city: formData.city,
          email: formData.email,
          partner_id: formData.partner_id || null // Garante envio correto do sócio
      };

      if (clientToEdit?.id) {
        const { error } = await supabase.from('clients').update(payload).eq('id', clientToEdit.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('clients').insert([payload]);
        if (error) throw error;
      }
      onSave();
    } catch (error: any) {
      console.error(error);
      if (error.code === '23505') {
          alert('Erro: Já existe um cliente com este CNPJ cadastrado.');
      } else {
          alert('Erro ao salvar cliente: ' + (error.message || 'Erro desconhecido'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">{clientToEdit ? 'Editar Cliente' : 'Novo Cliente'}</h2>
          <button onClick={onClose}><X className="w-6 h-6 text-gray-400 hover:text-gray-600" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ / CPF</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  className="flex-1 border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-salomao-blue outline-none"
                  value={formData.cnpj || ''}
                  onChange={e => setFormData({...formData, cnpj: maskCNPJ(e.target.value)})}
                  placeholder="00.000.000/0000-00"
                />
                <button type="button" onClick={handleSearchCNPJ} disabled={searchingCNPJ} className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 rounded-lg border border-gray-300">
                  {searchingCNPJ ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                </button>
              </div>
              <div className="mt-2 flex items-center">
                <input type="checkbox" id="is_person" className="rounded text-salomao-blue" checked={formData.is_person} onChange={e => setFormData({...formData, is_person: e.target.checked})} />
                <label htmlFor="is_person" className="ml-2 text-sm text-gray-600">Pessoa Física</label>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome / Razão Social *</label>
              <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-salomao-blue outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sócio Responsável</label>
              <select className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-salomao-blue outline-none bg-white" value={formData.partner_id || ''} onChange={e => setFormData({...formData, partner_id: e.target.value})}>
                <option value="">Selecione...</option>
                {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-salomao-blue outline-none" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>

            <div className="md:col-span-2 grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5" value={formData.number || ''} onChange={e => setFormData({...formData, number: e.target.value})} />
              </div>
            </div>

            <div className="md:col-span-2 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5" value={formData.city || ''} onChange={e => setFormData({...formData, city: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">UF</label>
                <input type="text" maxLength={2} className="w-full border border-gray-300 rounded-lg p-2.5 uppercase" value={formData.uf || ''} onChange={e => setFormData({...formData, uf: e.target.value.toUpperCase()})} />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium">Cancelar</button>
            <button type="submit" disabled={loading} className="px-6 py-2 bg-salomao-blue text-white rounded-lg hover:bg-blue-900 shadow-md font-bold flex items-center">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />} Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}