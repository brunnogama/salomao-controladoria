import React, { useState, useEffect } from 'react';
import { X, Save, Search, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Client, Partner } from '../../types'; // Agora a interface Client existe
import { maskCNPJ, toTitleCase } from '../../utils/masks';
import { CustomSelect } from '../ui/CustomSelect';

const UFS = [ { sigla: 'AC', nome: 'Acre' }, { sigla: 'AL', nome: 'Alagoas' }, { sigla: 'AP', nome: 'Amapá' }, { sigla: 'AM', nome: 'Amazonas' }, { sigla: 'BA', nome: 'Bahia' }, { sigla: 'CE', nome: 'Ceará' }, { sigla: 'DF', nome: 'Distrito Federal' }, { sigla: 'ES', nome: 'Espírito Santo' }, { sigla: 'GO', nome: 'Goiás' }, { sigla: 'MA', nome: 'Maranhão' }, { sigla: 'MT', nome: 'Mato Grosso' }, { sigla: 'MS', nome: 'Mato Grosso do Sul' }, { sigla: 'MG', nome: 'Minas Gerais' }, { sigla: 'PA', nome: 'Pará' }, { sigla: 'PB', nome: 'Paraíba' }, { sigla: 'PR', nome: 'Paraná' }, { sigla: 'PE', nome: 'Pernambuco' }, { sigla: 'PI', nome: 'Piauí' }, { sigla: 'RJ', nome: 'Rio de Janeiro' }, { sigla: 'RN', nome: 'Rio Grande do Norte' }, { sigla: 'RS', nome: 'Rio Grande do Sul' }, { sigla: 'RO', nome: 'Rondônia' }, { sigla: 'RR', nome: 'Roraima' }, { sigla: 'SC', nome: 'Santa Catarina' }, { sigla: 'SP', nome: 'São Paulo' }, { sigla: 'SE', nome: 'Sergipe' }, { sigla: 'TO', nome: 'Tocantins' } ];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  client?: Client;
  onSave: () => void;
}

export function ClientFormModal({ isOpen, onClose, client, onSave }: Props) {
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [partners, setPartners] = useState<Partner[]>([]);
  
  const emptyClient: Client = {
    name: '',
    cnpj: '',
    email: '',
    phone: '',
    address: '',
    number: '',
    complement: '',
    city: '',
    uf: 'RJ',
    is_person: false,
    active: true
  };

  const [formData, setFormData] = useState<Client>(emptyClient);

  useEffect(() => {
    if (isOpen) {
      setFormData(client ? { ...client } : emptyClient);
      fetchPartners();
    }
  }, [isOpen, client]);

  const fetchPartners = async () => {
    const { data } = await supabase.from('partners').select('*').eq('active', true).order('name');
    if (data) setPartners(data);
  };

  const handleSave = async () => {
    if (!formData.name) return alert('Nome é obrigatório');

    setLoading(true);
    try {
      const payload = { ...formData };
      
      // Limpeza de dados
      if (payload.cnpj) payload.cnpj = payload.cnpj.replace(/\D/g, '');
      if (!payload.cnpj) delete payload.cnpj;

      if (client?.id) {
        const { error } = await supabase.from('clients').update(payload).eq('id', client.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('clients').insert(payload);
        if (error) throw error;
      }
      
      onSave();
      onClose();
    } catch (error: any) {
      alert('Erro ao salvar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCNPJSearch = async () => {
    if (!formData.cnpj) return;
    const cnpjLimpo = formData.cnpj.replace(/\D/g, '');
    if (cnpjLimpo.length !== 14) return alert('CNPJ inválido');

    setSearching(true);
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);
      if (!response.ok) throw new Error('CNPJ não encontrado');
      const data = await response.json();

      // CORREÇÃO: Tipando explicitamente o prev para evitar erro TS7006
      setFormData((prev: Client) => ({
        ...prev,
        name: toTitleCase(data.razao_social || data.nome_fantasia || ''),
        address: toTitleCase(data.logradouro || ''),
        number: data.numero || '',
        complement: toTitleCase(data.complemento || ''),
        city: toTitleCase(data.municipio || ''),
        uf: data.uf || prev.uf,
        email: data.email || prev.email,
        phone: data.ddd_telefone_1 || prev.phone
      }));
    } catch (error) {
      alert('Erro ao buscar CNPJ');
    } finally {
      setSearching(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">{client ? 'Editar Cliente' : 'Novo Cliente'}</h2>
          <button onClick={onClose}><X className="w-6 h-6 text-gray-400 hover:text-gray-600" /></button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[80vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* CNPJ / Tipo */}
            <div className="md:col-span-2 flex gap-4 items-start">
               <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">CPF/CNPJ</label>
                  <div className="flex gap-2">
                    <input 
                        type="text" 
                        disabled={formData.is_person}
                        className="flex-1 border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-salomao-blue disabled:bg-gray-100"
                        value={formData.cnpj || ''}
                        onChange={e => setFormData({...formData, cnpj: maskCNPJ(e.target.value)})}
                        placeholder="00.000.000/0000-00"
                    />
                    <button 
                        onClick={handleCNPJSearch}
                        disabled={formData.is_person || !formData.cnpj}
                        className="p-2.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                    >
                        {searching ? <Loader2 className="w-4 h-4 animate-spin"/> : <Search className="w-4 h-4"/>}
                    </button>
                  </div>
                  <div className="mt-2 flex items-center">
                    <input 
                        type="checkbox" 
                        id="is_person" 
                        checked={formData.is_person} 
                        onChange={e => setFormData({...formData, is_person: e.target.checked, cnpj: undefined})}
                        className="rounded text-salomao-blue"
                    />
                    <label htmlFor="is_person" className="ml-2 text-xs text-gray-500">Pessoa Física (Sem CNPJ)</label>
                  </div>
               </div>
               <div className="flex-1">
                  <CustomSelect 
                    label="Sócio Responsável"
                    value={formData.partner_id || ''}
                    onChange={val => setFormData({...formData, partner_id: val})}
                    options={[{label: 'Selecione', value: ''}, ...partners.map(p => ({label: p.name, value: p.id}))]}
                  />
               </div>
            </div>

            {/* Nome */}
            <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Nome Completo *</label>
                <input 
                    type="text" 
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-salomao-blue"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: toTitleCase(e.target.value)})}
                />
            </div>

            {/* Contato */}
            <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">E-mail</label>
                <input 
                    type="email" 
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-salomao-blue"
                    value={formData.email || ''}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                />
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Telefone</label>
                <input 
                    type="text" 
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-salomao-blue"
                    value={formData.phone || ''}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                />
            </div>

            {/* Endereço */}
            <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Endereço</label>
                <input 
                    type="text" 
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-salomao-blue"
                    value={formData.address || ''}
                    onChange={e => setFormData({...formData, address: toTitleCase(e.target.value)})}
                />
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Número</label>
                <input 
                    type="text" 
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-salomao-blue"
                    value={formData.number || ''}
                    onChange={e => setFormData({...formData, number: e.target.value})}
                />
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Complemento</label>
                <input 
                    type="text" 
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-salomao-blue"
                    value={formData.complement || ''}
                    onChange={e => setFormData({...formData, complement: toTitleCase(e.target.value)})}
                />
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Cidade</label>
                <input 
                    type="text" 
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-salomao-blue"
                    value={formData.city || ''}
                    onChange={e => setFormData({...formData, city: toTitleCase(e.target.value)})}
                />
            </div>
            <div>
                <CustomSelect 
                    label="Estado (UF)"
                    value={formData.uf || ''}
                    onChange={val => setFormData({...formData, uf: val})}
                    options={UFS.map(u => ({label: u.nome, value: u.sigla}))}
                />
            </div>

          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
            <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium">Cancelar</button>
            <button 
                onClick={handleSave} 
                disabled={loading}
                className="px-6 py-2 bg-salomao-blue text-white rounded-lg hover:bg-blue-900 flex items-center shadow-lg transition-transform active:scale-95"
            >
                {loading ? 'Salvando...' : <><Save className="w-4 h-4 mr-2" /> Salvar Cliente</>}
            </button>
        </div>
      </div>
    </div>
  );
}