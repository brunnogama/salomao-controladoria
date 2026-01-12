import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Plus, Edit, Trash2, Save } from 'lucide-react';
import { Analyst } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function AnalystManagerModal({ isOpen, onClose, onUpdate }: Props) {
  const [analysts, setAnalysts] = useState<Analyst[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '' });

  useEffect(() => {
    if (isOpen) {
      fetchAnalysts();
    }
  }, [isOpen]);

  const fetchAnalysts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('analysts')
      .select('*')
      .order('name', { ascending: true });
    
    if (data) setAnalysts(data);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Nome é obrigatório');
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from('analysts')
          .update({ 
            name: formData.name.trim()
          })
          .eq('id', editingId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('analysts')
          .insert([{ 
            name: formData.name.trim(),
            active: true
          }]);
        
        if (error) throw error;
      }
      
      setFormData({ name: '' });
      setEditingId(null);
      fetchAnalysts();
      onUpdate();
    } catch (error: any) {
      console.error('Erro ao salvar analista:', error);
      alert('Erro ao salvar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (analyst: Analyst) => {
    setEditingId(analyst.id);
    setFormData({ 
      name: analyst.name
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este analista?')) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('analysts')
        .update({ active: false })
        .eq('id', id);
      
      if (error) throw error;
      
      fetchAnalysts();
      onUpdate();
    } catch (error: any) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({ name: '' });
    setEditingId(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Gerenciar Analistas</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 border-b border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-10">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Nome do Analista <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-salomao-blue outline-none"
                placeholder="Nome completo"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={loading}
              />
            </div>

            <div className="md:col-span-2 flex items-end gap-2">
              <button
                onClick={handleSave}
                disabled={loading || !formData.name.trim()}
                className="flex-1 bg-salomao-blue text-white px-4 py-2.5 rounded-lg hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium"
              >
                {editingId ? <><Save className="w-4 h-4" /> Salvar</> : <><Plus className="w-4 h-4" /> Adicionar</>}
              </button>
              {editingId && (
                <button
                  onClick={handleCancel}
                  className="px-3 py-2.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && analysts.length === 0 ? (
            <div className="text-center py-8 text-gray-400">Carregando...</div>
          ) : analysts.length === 0 ? (
            <div className="text-center py-8 text-gray-400">Nenhum analista cadastrado</div>
          ) : (
            <div className="space-y-2">
              {analysts.map((analyst) => (
                <div
                  key={analyst.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800">{analyst.name}</h3>
                  </div>
                  
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(analyst)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(analyst.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}