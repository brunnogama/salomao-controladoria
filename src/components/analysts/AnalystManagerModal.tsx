import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Plus, Trash2, CheckCircle2, XCircle, User, Loader2 } from 'lucide-react';

export interface Analyst {
  id: string;
  name: string;
  active: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAnalystsUpdate: () => void;
}

export function AnalystManagerModal({ isOpen, onClose, onAnalystsUpdate }: Props) {
  const [analysts, setAnalysts] = useState<Analyst[]>([]);
  const [newAnalystName, setNewAnalystName] = useState('');
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (isOpen) fetchAnalysts();
  }, [isOpen]);

  const fetchAnalysts = async () => {
    setLoading(true);
    const { data } = await supabase.from('analysts').select('*').order('name');
    if (data) setAnalysts(data);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newAnalystName.trim()) return;
    setAdding(true);
    try {
      await supabase.from('analysts').insert({ name: newAnalystName, active: true });
      setNewAnalystName('');
      fetchAnalysts();
      onAnalystsUpdate();
    } catch (error) { alert('Erro ao adicionar analista.'); } 
    finally { setAdding(false); }
  };

  const toggleStatus = async (analyst: Analyst) => {
    await supabase.from('analysts').update({ active: !analyst.active }).eq('id', analyst.id);
    fetchAnalysts();
    onAnalystsUpdate();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este analista?')) return;
    const { error } = await supabase.from('analysts').delete().eq('id', id);
    if (!error) { fetchAnalysts(); onAnalystsUpdate(); }
    else alert('Não é possível excluir analistas vinculados a contratos.');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[80vh] animate-in zoom-in-95">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-2xl">
          <div><h3 className="text-lg font-bold text-gray-800">Gerenciar Analistas</h3><p className="text-xs text-gray-500">Adicione ou remova analistas.</p></div>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-red-500" /></button>
        </div>
        <div className="p-5 overflow-y-auto flex-1 space-y-6">
          <div className="flex gap-2">
            <input type="text" className="flex-1 border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-salomao-blue" placeholder="Nome do analista..." value={newAnalystName} onChange={(e) => setNewAnalystName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdd()} />
            <button onClick={handleAdd} disabled={adding || !newAnalystName.trim()} className="bg-salomao-blue text-white px-4 rounded-lg hover:bg-blue-900 disabled:opacity-50 flex items-center justify-center">{adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-5 h-5" />}</button>
          </div>
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Analistas Cadastrados</h4>
            {loading ? <div className="flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-salomao-gold" /></div> : analysts.map(an => (
              <div key={an.id} className={`flex items-center justify-between p-3 rounded-lg border ${an.active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-75'}`}>
                <div className="flex items-center gap-3"><div className={`p-2 rounded-full ${an.active ? 'bg-purple-50 text-purple-600' : 'bg-gray-200 text-gray-400'}`}><User className="w-4 h-4" /></div><span className={`text-sm font-medium ${!an.active && 'line-through text-gray-400'}`}>{an.name}</span></div>
                <div className="flex gap-1"><button onClick={() => toggleStatus(an)} className={`p-1.5 rounded ${an.active ? 'text-green-500 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-200'}`}>{an.active ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}</button><button onClick={() => handleDelete(an.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button></div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 bg-gray-50/50 rounded-b-2xl border-t border-gray-100 flex justify-end"><button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-800 font-medium px-4 py-2">Concluir</button></div>
      </div>
    </div>
  );
}