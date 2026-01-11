import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Analyst } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void; // Adicionado aqui
}

export function AnalystManagerModal({ isOpen, onClose, onUpdate }: Props) {
  const [analysts, setAnalysts] = useState<Analyst[]>([]);
  const [newAnalystName, setNewAnalystName] = useState('');
  const [newAnalystEmail, setNewAnalystEmail] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    if (isOpen) fetchAnalysts();
  }, [isOpen]);

  const fetchAnalysts = async () => {
    const { data } = await supabase.from('analysts').select('*').order('name');
    if (data) setAnalysts(data);
  };

  const handleAdd = async () => {
    if (!newAnalystName.trim()) return;
    await supabase.from('analysts').insert([{ name: newAnalystName, email: newAnalystEmail, active: true }]);
    setNewAnalystName('');
    setNewAnalystEmail('');
    fetchAnalysts();
    if (onUpdate) onUpdate();
  };

  const handleEdit = (analyst: Analyst) => {
    setEditingId(analyst.id);
    setEditName(analyst.name);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim() || !editingId) return;
    await supabase.from('analysts').update({ name: editName }).eq('id', editingId);
    setEditingId(null);
    setEditName('');
    fetchAnalysts();
    if (onUpdate) onUpdate();
  };

  const handleDelete = async (id: string) => {
    if(confirm("Remover analista?")) {
        await supabase.from('analysts').delete().eq('id', id);
        fetchAnalysts();
        if (onUpdate) onUpdate();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800">Gerenciar Analistas</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        
        <div className="p-4">
          <div className="flex flex-col gap-2 mb-4">
            <input 
              type="text" 
              className="border border-gray-300 rounded-lg p-2 text-sm"
              placeholder="Nome do analista"
              value={newAnalystName}
              onChange={e => setNewAnalystName(e.target.value)}
            />
            <div className="flex gap-2">
                <input 
                type="text" 
                className="flex-1 border border-gray-300 rounded-lg p-2 text-sm"
                placeholder="Email (opcional)"
                value={newAnalystEmail}
                onChange={e => setNewAnalystEmail(e.target.value)}
                />
                <button onClick={handleAdd} className="bg-salomao-blue text-white p-2 rounded-lg"><Plus className="w-5 h-5" /></button>
            </div>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {analysts.map(analyst => (
              <div key={analyst.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg group">
                {editingId === analyst.id ? (
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
                  <div className="flex flex-col">
                      <span className="text-sm text-gray-700 font-medium">{analyst.name}</span>
                      <span className="text-xs text-gray-400">{analyst.email}</span>
                  </div>
                )}
                
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(analyst)} className="text-blue-500"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(analyst.id)} className="text-red-500">
                    <Trash2 className="w-4 h-4" />
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
