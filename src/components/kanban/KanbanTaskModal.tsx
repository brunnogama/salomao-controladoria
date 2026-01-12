import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Calendar, User, AlignLeft, Flag, Link as LinkIcon, FileText } from 'lucide-react';
import { KanbanTask, Contract } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  task: KanbanTask | null;
  onSave: (task: Partial<KanbanTask>) => void;
  onDelete: (id: string) => void;
  contracts: Contract[];
}

export function KanbanTaskModal({ isOpen, onClose, task, onSave, onDelete, contracts }: Props) {
  const [formData, setFormData] = useState<Partial<KanbanTask>>({
    title: '',
    description: '',
    status: 'todo',
    priority: 'Média',
    assignee: '',
    due_date: '',
    contract_id: '',
    observation: ''
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        assignee: task.assignee || '',
        due_date: task.due_date ? task.due_date.split('T')[0] : '',
        contract_id: task.contract_id || '',
        observation: task.observation || ''
      });
    } else {
      setFormData({
        title: '',
        description: '',
        status: 'todo',
        priority: 'Média',
        assignee: '',
        due_date: '',
        contract_id: '',
        observation: ''
      });
    }
  }, [task, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      alert('O título é obrigatório.');
      return;
    }
    
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95">
        
        {/* HEADER */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">
            {task ? 'Editar Tarefa' : 'Nova Tarefa'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* CONTENT */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TÍTULO */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título da Tarefa *</label>
            <input 
              type="text" 
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-salomao-blue outline-none"
              placeholder="Ex: Elaborar minuta de defesa..."
              value={formData.title || ''}
              onChange={e => setFormData({...formData, title: e.target.value})}
              autoFocus
            />
          </div>

          {/* DESCRIÇÃO */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center">
              <AlignLeft className="w-4 h-4 mr-1" /> Descrição
            </label>
            <textarea 
              className="w-full border border-gray-300 rounded-lg p-3 text-sm h-24 focus:ring-2 focus:ring-salomao-blue outline-none resize-none"
              placeholder="Detalhes sobre a tarefa..."
              value={formData.description || ''}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* STATUS E PRIORIDADE */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                <select 
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-salomao-blue outline-none"
                  value={formData.status || 'todo'}
                  onChange={e => setFormData({...formData, status: e.target.value as any})}
                >
                  <option value="todo">A Fazer</option>
                  <option value="doing">Em Andamento</option>
                  <option value="signature">Assinatura</option>
                  <option value="done">Concluído</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center">
                  <Flag className="w-4 h-4 mr-1" /> Prioridade
                </label>
                <select 
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-salomao-blue outline-none"
                  value={formData.priority || 'Média'}
                  onChange={e => setFormData({...formData, priority: e.target.value as any})}
                >
                  <option value="Baixa">Baixa</option>
                  <option value="Média">Média</option>
                  <option value="Alta">Alta</option>
                </select>
              </div>
            </div>

            {/* PRAZO E RESPONSÁVEL */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center">
                  <Calendar className="w-4 h-4 mr-1" /> Prazo (Due Date)
                </label>
                <input 
                  type="date" 
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-salomao-blue outline-none"
                  value={formData.due_date || ''}
                  onChange={e => setFormData({...formData, due_date: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center">
                  <User className="w-4 h-4 mr-1" /> Responsável
                </label>
                <input 
                  type="text" 
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-salomao-blue outline-none"
                  placeholder="Nome do responsável"
                  value={formData.assignee || ''}
                  onChange={e => setFormData({...formData, assignee: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* VÍNCULO COM CONTRATO */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center">
              <LinkIcon className="w-4 h-4 mr-1" /> Vincular a Caso (Contrato Ativo)
            </label>
            <select 
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-salomao-blue outline-none"
              value={formData.contract_id || ''}
              onChange={e => setFormData({...formData, contract_id: e.target.value})}
            >
              <option value="">Sem vínculo</option>
              {contracts.map(c => (
                <option key={c.id} value={c.id}>
                  {c.client_name} {c.hon_number ? `(HON: ${c.hon_number})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* OBSERVAÇÃO */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center">
              <FileText className="w-4 h-4 mr-1" /> Observação
            </label>
            <input 
              type="text" 
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-salomao-blue outline-none"
              placeholder="Notas adicionais..."
              value={formData.observation || ''}
              onChange={e => setFormData({...formData, observation: e.target.value})}
            />
          </div>

        </form>

        {/* FOOTER */}
        <div className="p-6 border-t border-gray-100 flex justify-between bg-gray-50 rounded-b-2xl">
          {task ? (
            <button 
              onClick={() => onDelete(task.id)}
              className="text-red-500 hover:text-red-700 font-medium text-sm flex items-center px-3 py-2 rounded hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Excluir
            </button>
          ) : (
            <div></div> 
          )}
          
          <div className="flex gap-3">
            <button 
              type="button"
              onClick={onClose} 
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="button"
              onClick={handleSubmit}
              className="px-6 py-2 bg-salomao-blue text-white rounded-lg hover:bg-blue-900 shadow-md flex items-center transition-all font-bold"
            >
              <Save className="w-4 h-4 mr-2" /> Salvar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}