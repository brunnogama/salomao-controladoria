import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Save, Building2, User, Globe, Mail, MapPin, Search, Loader2 } from 'lucide-react';
import { Client } from '../../types';
import { maskCNPJ, toTitleCase } from '../../utils/masks';
import { CustomSelect } from '../ui/CustomSelect';

const UFS = [
  { label: 'AC', value: 'AC' }, { label: 'AL', value: 'AL' }, { label: 'AP', value: 'AP' },
  { label: 'AM', value: 'AM' }, { label: 'BA', value: 'BA' }, { label: 'CE', value: 'CE' },
  { label: 'DF', value: 'DF' }, { label: 'ES', value: 'ES' }, { label: 'GO', value: 'GO' },
  { label: 'MA', value: 'MA' }, { label: 'MT', value: 'MT' }, { label: 'MS', value: 'MS' },
  { label: 'MG', value: 'MG' }, { label: 'PA', value: 'PA' }, { label: 'PB', value: 'PB' },
  { label: 'PR', value: 'PR' }, { label: 'PE', value: 'PE' }, { label: 'PI', value: 'PI' },
  { label: 'RJ', value: 'RJ' }, { label: 'RN', value: 'RN' }, { label: 'RS', value: 'RS' },
  { label: 'RO', value: 'RO' }, { label: 'RR', value: 'RR' }, { label: 'SC', value: 'SC' },
  { label: 'SP', value: 'SP' }, { label: 'SE', value: 'SE' }, { label: 'TO', value: 'TO' }
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  formData: Client;
  setFormData: React.Dispatch<React.SetStateAction<Client>>;
  onSave: () => void;
  loading: boolean;
  isEditing: boolean;
}

export function ClientFormModal({ isOpen, onClose, formData, setFormData, onSave, loading, isEditing }: Props) {
  const [searching, setSearching] = useState(false);

  const handleCNPJSearch = async () => {
    const cleanCNPJ = formData.cnpj.replace(/\D/g, '');
    if (cleanCNPJ.length !== 14) return alert('CNPJ inválido para busca automática.');
    
    setSearching(true);
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCNPJ}`);
      const data = await response.json();
      
      if (data.razao_social) {
        setFormData(prev => ({ 
          ...prev, 
          name: toTitleCase(data.razao_social),
          address: toTitleCase(data.logradouro),
          number: data.numero,
          complement: toTitleCase(data.complemento),
          city: toTitleCase(data.municipio),
          uf: data.uf,
          email: data.email ? data.email.toLowerCase() : prev.email
        }));
      }
    } catch (e) {
      alert('Erro ao buscar CNPJ. Verifique se está correto.');
    } finally {
      setSearching(false);
    }
  };

  const handleTextChange = (field: keyof Client, value: string) => {
    setFormData({ ...formData, [field]: field === 'email' || field === 'website' ? value : toTitleCase(value) });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[50] p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        
        {/* HEADER */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${formData.is_person ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
              {formData.is_person ? <User className="w-6 h-6" /> : <Building2 className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{isEditing ? 'Editar Cliente' : 'Novo Cliente'}</h2>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Gestão de Carteira</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500"><X className="w-6 h-6" /></button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* TIPO DE PESSOA */}
            <div className="md:col-span-12 flex gap-4">
               <label className="flex items-center p-3 border rounded-xl cursor-pointer transition-colors hover:bg-gray-50 w-full md:w-auto">
                 <input type="radio" name="type" className="mr-2" checked={!formData.is_person} onChange={() => setFormData({...formData, is_person: false})} />
                 <span className="text-sm font-bold text-gray-700">Pessoa Jurídica (CNPJ)</span>
               </label>
               <label className="flex items-center p-3 border rounded-xl cursor-pointer transition-colors hover:bg-gray-50 w-full md:w-auto">
                 <input type="radio" name="type" className="mr-2" checked={formData.is_person} onChange={() => setFormData({...formData, is_person: true})} />
                 <span className="text-sm font-bold text-gray-700">Pessoa Física (CPF)</span>
               </label>
            </div>

            {/* CNPJ/CPF + NOME */}
            <div className="md:col-span-4">
              <label className="block text-xs font-medium text-gray-600 mb-1">{formData.is_person ? 'CPF' : 'CNPJ'}</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  className="flex-1 border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-salomao-blue outline-none font-mono" 
                  placeholder={formData.is_person ? "000.000.000-00" : "00.000.000/0000-00"} 
                  value={formData.cnpj} 
                  onChange={(e) => setFormData({...formData, cnpj: maskCNPJ(e.target.value)})}
                />
                {!formData.is_person && (
                  <button onClick={handleCNPJSearch} disabled={!formData.cnpj} className="bg-salomao-blue text-white p-2.5 rounded-lg hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed">
                    {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>

            <div className="md:col-span-8">
              <label className="block text-xs font-medium text-gray-600 mb-1">Nome Completo / Razão Social</label>
              <input 
                type="text" 
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-salomao-blue outline-none" 
                value={formData.name} 
                onChange={(e) => handleTextChange('name', e.target.value)} 
              />
            </div>

            {/* CONTATO */}
            <div className="md:col-span-6">
              <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center"><Mail className="w-3 h-3 mr-1"/> E-mail</label>
              <input type="email" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-salomao-blue outline-none" value={formData.email || ''} onChange={(e) => handleTextChange('email', e.target.value)} />
            </div>
            <div className="md:col-span-6">
              <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center"><Globe className="w-3 h-3 mr-1"/> Site</label>
              <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-salomao-blue outline-none" placeholder="www.empresa.com.br" value={formData.website || ''} onChange={(e) => handleTextChange('website', e.target.value)} />
            </div>

            {/* ENDEREÇO */}
            <div className="md:col-span-12 pt-4 border-t border-gray-100">
              <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center"><MapPin className="w-4 h-4 mr-2 text-salomao-blue"/> Endereço</h4>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-6">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Logradouro</label>
                  <input type="text" className="w-full border-b border-gray-300 focus:border-salomao-blue outline-none py-1 text-sm" value={formData.address || ''} onChange={(e) => handleTextChange('address', e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Número</label>
                  <input type="text" className="w-full border-b border-gray-300 focus:border-salomao-blue outline-none py-1 text-sm" value={formData.number || ''} onChange={(e) => handleTextChange('number', e.target.value)} />
                </div>
                <div className="md:col-span-4">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Complemento</label>
                  <input type="text" className="w-full border-b border-gray-300 focus:border-salomao-blue outline-none py-1 text-sm" value={formData.complement || ''} onChange={(e) => handleTextChange('complement', e.target.value)} />
                </div>
                <div className="md:col-span-5">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Cidade</label>
                  <input type="text" className="w-full border-b border-gray-300 focus:border-salomao-blue outline-none py-1 text-sm" value={formData.city || ''} onChange={(e) => handleTextChange('city', e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <CustomSelect 
                    label="UF"
                    value={formData.uf || ''}
                    onChange={(val: string) => setFormData({...formData, uf: val})}
                    options={UFS}
                    placeholder="UF"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* FOOTER */}
        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors">Cancelar</button>
          <button onClick={onSave} disabled={loading} className="px-6 py-2 bg-salomao-blue text-white rounded-lg hover:bg-blue-900 shadow-lg flex items-center transition-all transform active:scale-95">
            {loading ? 'Salvando...' : <><Save className="w-4 h-4 mr-2" /> Salvar Cliente</>}
          </button>
        </div>
      </div>
    </div>
  );
}