import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit, Save, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Partner } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (newId?: string) => void;
}

export function PartnerManagerModal({ isOpen, onClose, onUpdate }: Props) {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Estado unificado para formulário (nome e email)
  const [formData, setFormData] = useState({ name: '', email: '' });

  useEffect(() => {
    if (isOpen) fetchPartners();
  }, [isOpen]);

  const fetchPartners = async () => {
    setLoading(true);
    const { data } = await supabase.from('partners').select('*').order('name');
    if (data) setPartners(data);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;

    setLoading(true);
    try {
        if (editingId) {
            // Atualizar
            const { error } = await supabase
                .from('partners')
                .update({ 
                    name: formData.name.trim(),
                    email: formData.email.trim() 
                })
                .eq('id', editingId);
            if (error) throw error;

            setFormData({ name: '', email: '' });
            setEditingId(null);
            fetchPartners();
            if (onUpdate) onUpdate();
        } else {
            // Criar novo
            const { data, error } = await supabase
                .from('partners')
                .insert([{ 
                    name: formData.name.trim(), 
                    email: formData.email.trim(),
                    active: true 
                }])
                .select()
                .single();
            
            if (error) throw error;

            // Limpa formulário
            setFormData({ name: '', email: '' });
            
            // Passa o ID do novo item e fecha o modal
            if (onUpdate) onUpdate(data.id);
            onClose();
        }
    } catch (error: any) {
        console.error('Erro ao salvar sócio:', error);
        alert('Erro ao salvar: ' + error.message);
    } finally {
        setLoading(false);
    }
  };

  const handleEdit = (partner: Partner) => {
    setEditingId(partner.id);
    setFormData({ 
        name: partner.name,
        email: partner.email || '' 
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', email: '' });
  };

  const handleToggleActive = async (partner: Partner) => {
    try {
        await supabase.from('partners').update({ active: !partner.active }).eq('id', partner.id);
        fetchPartners();
        if (onUpdate) onUpdate();
    } catch (error) {
        console.error("Erro ao alterar status:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
          <h3 className="font-bold text-gray-800">Gerenciar Sócios</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
        </div>
        
        {/* Formulário */}
        <div className="p-6 border-b border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
             <div className="md:col-span-5">
                <label className="block text-xs font-medium text-gray-600 mb-1">Nome do Sócio *</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-salomao-blue outline-none" 
                  placeholder="Nome completo" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  disabled={loading}
                />
             </div>
             <div className="md:col-span-5">
                <label className="block text-xs font-medium text-gray-600 mb-1">E-mail</label>
                <input 
                  type="email" 
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-salomao-blue outline-none" 
                  placeholder="email@exemplo.com" 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  disabled={loading}
                />
             </div>
             <div className="md:col-span-2 flex items-end">
                {editingId ? (
                    <div className="flex gap-1 w-full">
                        <button onClick={handleSave} disabled={loading} className="flex-1 bg-green-600 text-white p-2.5 rounded-lg hover:bg-green-700 flex justify-center"><Save className="w-4 h-4" /></button>
                        <button onClick={handleCancelEdit} disabled={loading} className="flex-1 bg-gray-200 text-gray-600 p-2.5 rounded-lg hover:bg-gray-300 flex justify-center"><X className="w-4 h-4" /></button>
                    </div>
                ) : (
                    <button onClick={handleSave} disabled={loading || !formData.name.trim()} className="w-full bg-salomao-blue text-white p-2.5 rounded-lg hover:bg-blue-900 flex justify-center items-center gap-1 text-sm font-medium">
                        <Plus className="w-4 h-4" /> Add
                    </button>
                )}
             </div>
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto p-6">
           {loading && partners.length === 0 ? (
               <div className="text-center py-8 text-gray-400">Carregando...</div>
           ) : partners.length === 0 ? (
               <div className="text-center py-8 text-gray-400">Nenhum sócio cadastrado</div>
           ) : (
            <div className="space-y-2">
                {partners.map(partner => (
                <div key={partner.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                        <h3 className={`font-medium ${!partner.active ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{partner.name}</h3>
                        {partner.email && <p className="text-xs text-gray-500">{partner.email}</p>}
                    </div>
                    
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(partner)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Editar"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleToggleActive(partner)} className={`p-2 rounded-lg ${partner.active ? "text-red-500 hover:bg-red-50" : "text-green-500 hover:bg-green-50"}`} title={partner.active ? "Desativar" : "Ativar"}>
                        {partner.active ? <Trash2 className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                    </button>
                    </div>
                </div>
                ))}
            </div>
           )}
        </div>
      </div>
    </div>
  );
}