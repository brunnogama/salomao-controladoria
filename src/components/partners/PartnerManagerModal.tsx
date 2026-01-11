import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Partner } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void; // Adicionado aqui
}

export function PartnerManagerModal({ isOpen, onClose, onUpdate }: Props) {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [newPartnerName, setNewPartnerName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    if (isOpen) fetchPartners();
  }, [isOpen]);

  const fetchPartners = async () => {
    const { data } = await supabase.from('partners').select('*').order('name');
    if (data) setPartners(data);
  };

  const handleAdd = async () => {
    if (!newPartnerName.trim()) return;
    await supabase.from('partners').insert([{ name: newPartnerName, active: true }]);
    setNewPartnerName('');
    fetchPartners();
    if (onUpdate) onUpdate();
  };

  const handleEdit = (partner: Partner) => {
    setEditingId(partner.id);
    setEditName(partner.name);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim() || !editingId) return;
    await supabase.from('partners').update({ name: editName }).eq('id', editingId);
    setEditingId(null);
    setEditName('');
    fetchPartners();
    if (onUpdate) onUpdate();
  };

  const handleToggleActive = async (partner: Partner) => {
    await supabase.from('partners').update({ active: !partner.active }).eq('id', partner.id);
    fetchPartners();
    if (onUpdate) onUpdate();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800">Gerenciar Sócios</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        
        <div className="p-4">
          <div className="flex gap-2 mb-4">
            <input 
              type="text" 
              className="flex-1 border border-gray-300 rounded-lg p-2 text-sm"
              placeholder="Nome do novo sócio"
              value={newPartnerName}
              onChange={e => setNewPartnerName(e.target.value)}
            />
            <button onClick={handleAdd} className="bg-salomao-blue text-white p-2 rounded-lg"><Plus className="w-5 h-5" /></button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {partners.map(partner => (
              <div key={partner.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg group">
                {editingId === partner.id ? (
                  <div className="flex flex-1 gap-2">
                    <input 
                      className="flex-1 border border-blue-300 rounded px-2 py-1 text-sm" 
                      value={editName} 
                      onChange={e => setEditName(e.target.value)} 
                      autoFocus
                    />
                    <button onClick={handleSaveEdit} className="text-green-600"><Save className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <span className={`text-sm ${!partner.active ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{partner.name}</span>
                )}
                
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(partner)} className="text-blue-500"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleToggleActive(partner)} className={partner.active ? "text-red-500" : "text-green-500"}>
                    {partner.active ? <Trash2 className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Pequeno helper para o icone Check que faltava no import acima se necessário
function Check({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12"></polyline></svg>
    )
}
