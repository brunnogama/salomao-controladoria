import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Plus, Trash2, CheckCircle2, XCircle, User, Loader2 } from 'lucide-react';
import { Partner } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onPartnersUpdate: () => void;
}

export function PartnerManagerModal({ isOpen, onClose, onPartnersUpdate }: Props) {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [newPartnerName, setNewPartnerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPartners();
    }
  }, [isOpen]);

  const fetchPartners = async () => {
    setLoading(true);
    const { data } = await supabase.from('partners').select('*').order('name');
    if (data) setPartners(data);
    setLoading(false);
  };

  const handleAddPartner = async () => {
    if (!newPartnerName.trim()) return;
    setAdding(true);
    try {
      const { error } = await supabase.from('partners').insert({ name: newPartnerName, active: true });
      if (error) throw error;
      setNewPartnerName('');
      fetchPartners();
      onPartnersUpdate(); // Atualiza a lista no componente pai
    } catch (error) {
      alert('Erro ao adicionar sócio.');
    } finally {
      setAdding(false);
    }
  };

  const togglePartnerStatus = async (partner: Partner) => {
    const { error } = await supabase
      .from('partners')
      .update({ active: !partner.active })
      .eq('id', partner.id);

    if (!error) {
      fetchPartners();
      onPartnersUpdate();
    }
  };

  const deletePartner = async (id: string) => {
    if (!confirm('Tem certeza? Isso pode afetar contratos vinculados.')) return;
    const { error } = await supabase.from('partners').delete().eq('id', id);
    if (!error) {
      fetchPartners();
      onPartnersUpdate();
    } else {
      alert('Não é possível excluir sócios que já possuem contratos vinculados. Desative-o em vez disso.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-2xl">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Gerenciar Sócios</h3>
            <p className="text-xs text-gray-500">Adicione ou remova responsáveis.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-6">
          
          {/* Adicionar Novo */}
          <div className="flex gap-2">
            <input 
              type="text" 
              className="flex-1 border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-salomao-blue outline-none"
              placeholder="Nome do novo sócio..."
              value={newPartnerName}
              onChange={(e) => setNewPartnerName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddPartner()}
            />
            <button 
              onClick={handleAddPartner} 
              disabled={adding || !newPartnerName.trim()}
              className="bg-salomao-blue text-white px-4 rounded-lg hover:bg-blue-900 disabled:opacity-50 transition-colors flex items-center justify-center min-w-[3rem]"
            >
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-5 h-5" />}
            </button>
          </div>

          {/* Lista */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Sócios Cadastrados</h4>
            
            {loading ? (
              <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 text-salomao-gold animate-spin" /></div>
            ) : partners.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Nenhum sócio cadastrado.</p>
            ) : (
              partners.map(partner => (
                <div key={partner.id} className={`flex items-center justify-between p-3 rounded-lg border ${partner.active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-75'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${partner.active ? 'bg-blue-50 text-salomao-blue' : 'bg-gray-200 text-gray-400'}`}>
                      <User className="w-4 h-4" />
                    </div>
                    <span className={`text-sm font-medium ${partner.active ? 'text-gray-700' : 'text-gray-400 line-through'}`}>
                      {partner.name}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => togglePartnerStatus(partner)}
                      className={`p-1.5 rounded-md transition-colors ${partner.active ? 'text-green-500 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-200'}`}
                      title={partner.active ? "Desativar" : "Ativar"}
                    >
                      {partner.active ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </button>
                    
                    <button 
                      onClick={() => deletePartner(partner.id)}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50/50 rounded-b-2xl border-t border-gray-100 flex justify-end">
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-800 font-medium px-4 py-2">
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
}