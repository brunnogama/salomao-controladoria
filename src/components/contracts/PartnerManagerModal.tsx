import { Plus, X, Edit, Trash2, Check, UserPlus } from 'lucide-react';
import { Partner } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  partners: Partner[];
  newPartnerName: string;
  setNewPartnerName: (v: string) => void;
  editingPartner: Partner | null;
  setEditingPartner: (p: Partner | null) => void;
  onAdd: () => void;
  onUpdate: () => void;
  onDelete: (id: string) => void;
}

export function PartnerManagerModal({ 
  isOpen, onClose, partners, newPartnerName, setNewPartnerName, 
  editingPartner, setEditingPartner, onAdd, onUpdate, onDelete 
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95">
         <div className="flex justify-between items-center mb-6"><div><h3 className="text-lg font-bold text-gray-800">Sócios Responsáveis</h3><p className="text-xs text-gray-500">Adicione ou remova sócios da lista.</p></div><button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button></div>
         <div className="flex gap-2 mb-4"><div className="relative flex-1"><UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" /><input type="text" className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-salomao-blue outline-none" placeholder="Nome do Sócio" value={newPartnerName} onChange={(e) => setNewPartnerName(e.target.value)} /></div>{editingPartner ? (<button onClick={onUpdate} className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition-colors"><Check className="w-4 h-4" /></button>) : (<button onClick={onAdd} className="bg-salomao-blue text-white p-2 rounded-lg hover:bg-blue-900 transition-colors"><Plus className="w-4 h-4" /></button>)}</div>
         <div className="max-h-60 overflow-y-auto pr-1 space-y-2">{partners.length === 0 ? (<p className="text-center text-sm text-gray-400 py-4">Nenhum sócio cadastrado.</p>) : (partners.map(p => (<div key={p.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-salomao-blue">{p.name.charAt(0)}</div><span className="text-sm font-medium text-gray-700">{p.name}</span></div><div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => { setEditingPartner(p); setNewPartnerName(p.name); }} className="text-blue-500 p-1.5 hover:bg-blue-100 rounded-md"><Edit className="w-4 h-4" /></button><button onClick={() => onDelete(p.id)} className="text-red-500 p-1.5 hover:bg-red-100 rounded-md"><Trash2 className="w-4 h-4" /></button></div></div>)))}</div>
         <div className="mt-6 border-t pt-4 flex justify-end"><button onClick={onClose} className="text-sm text-gray-600 hover:text-gray-900 font-medium">Concluir</button></div>
      </div>
    </div>
  );
}
