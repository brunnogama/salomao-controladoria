import React, { useState } from 'react';
import { X, Loader2, Check, Plus, Pencil, Trash2 } from 'lucide-react';

interface OptionManagerProps {
  title: string;
  options: string[];
  onAdd: (val: string) => Promise<boolean>;
  onRemove: (val: string) => void;
  onEdit: (oldVal: string, newVal: string) => Promise<boolean>;
  onClose: () => void;
  placeholder?: string;
}

export const OptionManager = ({ 
  title, 
  options, 
  onAdd, 
  onRemove, 
  onEdit,
  onClose,
  placeholder = "Digite o nome"
}: OptionManagerProps) => {
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [editingItem, setEditingItem] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!inputValue.trim()) return;
        setLoading(true);
        let success = false;
        
        if (editingItem) {
            success = await onEdit(editingItem, inputValue.trim());
            if (success) setEditingItem(null);
        } else {
            success = await onAdd(inputValue.trim());
            if (success) onClose();
        }
        
        setLoading(false);
        if (success) setInputValue('');
    };

    const handleEditClick = (item: string) => {
        setEditingItem(item);
        setInputValue(item);
    };

    const handleCancelEdit = () => {
        setEditingItem(null);
        setInputValue('');
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70]">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">{title}</h3>
              <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            
            <div className="p-4">
              <div className="flex gap-2 mb-4">
                <input 
                  type="text" 
                  className="flex-1 border border-gray-300 rounded-lg p-2 text-sm"
                  placeholder={placeholder}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                />
                {editingItem && (
                    <button 
                        onClick={handleCancelEdit}
                        className="bg-gray-200 text-gray-600 p-2 rounded-lg hover:bg-gray-300"
                        title="Cancelar edição"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
                <button 
                  onClick={handleSubmit}
                  disabled={loading}
                  className={`${editingItem ? 'bg-green-600 hover:bg-green-700' : 'bg-salomao-blue'} text-white p-2 rounded-lg disabled:opacity-50 transition-colors`}
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : (editingItem ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />)}
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {options.map((opt, idx) => (
                  <div key={idx} className={`flex items-center justify-between p-2 rounded-lg group ${editingItem === opt ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}>
                    <span className="text-sm text-gray-700 truncate flex-1 mr-2">{opt}</span>
                    <div className="flex items-center gap-1">
                        <button 
                            onClick={() => handleEditClick(opt)} 
                            className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-blue-100 rounded"
                            title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => onRemove(opt)} 
                            className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded"
                            title="Remover"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                  </div>
                ))}
                {options.length === 0 && <p className="text-xs text-center text-gray-400 py-4">Nenhum item cadastrado.</p>}
              </div>
            </div>
          </div>
        </div>
    );
};