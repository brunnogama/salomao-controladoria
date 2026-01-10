import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, MoreVertical, Calendar, AlertCircle, CheckCircle2, Clock, X, Save } from 'lucide-react';
import { KanbanTask } from '../types';
import { addDays, format } from 'date-fns';

const COLUMNS = {
  todo: { id: 'todo', title: 'A Fazer', color: 'bg-gray-100' },
  doing: { id: 'doing', title: 'Em Progresso', color: 'bg-blue-50' },
  done: { id: 'done', title: 'Concluídos', color: 'bg-green-50' },
  signature: { id: 'signature', title: 'Cobrar Assinatura', color: 'bg-orange-50' }
};

export function Kanban() {
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<KanbanTask | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Média' as 'Alta' | 'Média' | 'Baixa',
    observation: '',
    due_date: ''
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('kanban_tasks')
      .select('*')
      .order('position');
    
    if (data) setTasks(data);
    setLoading(false);
  };

  // --- DRAG AND DROP LOGIC ---
  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // Clone tasks to update UI optimistically
    const newTasks = Array.from(tasks);
    const movedTask = newTasks.find(t => t.id === draggableId);
    if (!movedTask) return;

    // Atualiza status se mudou de coluna
    const newStatus = destination.droppableId as any;
    
    // Remove da posição original
    const sourceColumnTasks = newTasks.filter(t => t.status === source.droppableId).sort((a, b) => a.position - b.position);
    const destColumnTasks = source.droppableId === destination.droppableId 
      ? sourceColumnTasks 
      : newTasks.filter(t => t.status === newStatus).sort((a, b) => a.position - b.position);

    // Ajuste de posições é complexo, vamos simplificar atualizando o status e posição no banco
    // Para simplificar a UX, apenas atualizamos o status e fazemos o update no banco
    // A reordenação fina exigiria recalcular todos os indexes.
    
    movedTask.status = newStatus;
    
    // Atualiza UI
    setTasks(newTasks.map(t => t.id === draggableId ? { ...t, status: newStatus } : t));

    // Atualiza Banco
    await supabase.from('kanban_tasks').update({ status: newStatus }).eq('id', draggableId);
  };

  // --- ACTIONS ---
  const handleCreateTask = async () => {
    if (!formData.title) return;

    // Se prioridade for Alta, coloca no topo (position -1 ou menor que 0)
    // Caso contrário, coloca no fim.
    const position = formData.priority === 'Alta' ? -1 : 1000;

    const newTask = {
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      status: 'todo',
      position: position
    };

    const { data, error } = await supabase.from('kanban_tasks').insert(newTask).select().single();
    
    if (data) {
      setTasks(prev => {
        const updated = [...prev, data];
        // Reordena localmente se for alta
        return updated.sort((a, b) => {
           if (a.priority === 'Alta' && b.priority !== 'Alta') return -1;
           return 0;
        });
      });
      setIsModalOpen(false);
      setFormData({ title: '', description: '', priority: 'Média', observation: '', due_date: '' });
    }
  };

  const handleUpdateTask = async () => {
    if (!currentTask) return;

    const updates: any = {
      description: formData.description,
      priority: formData.priority,
      observation: formData.observation
    };

    if (formData.due_date) updates.due_date = formData.due_date;

    const { error } = await supabase.from('kanban_tasks').update(updates).eq('id', currentTask.id);
    
    if (!error) {
      setTasks(tasks.map(t => t.id === currentTask.id ? { ...t, ...updates } : t));
      setIsEditModalOpen(false);
    }
  };

  const openEditModal = (task: KanbanTask) => {
    setCurrentTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      observation: task.observation || '',
      due_date: task.due_date ? task.due_date.split('T')[0] : ''
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteTask = async () => {
    if (!currentTask || !confirm('Excluir tarefa?')) return;
    await supabase.from('kanban_tasks').delete().eq('id', currentTask.id);
    setTasks(tasks.filter(t => t.id !== currentTask.id));
    setIsEditModalOpen(false);
  };

  const getPriorityColor = (p: string) => {
    if (p === 'Alta') return 'bg-red-100 text-red-700 border-red-200';
    if (p === 'Média') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-blue-100 text-blue-700 border-blue-200';
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Fluxo de Trabalho (Kanban)</h1>
          <p className="text-gray-500 text-sm">Gerencie tarefas e acompanhe assinaturas pendentes.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-salomao-blue text-white px-4 py-2 rounded-lg flex items-center shadow-lg hover:bg-blue-900 transition-colors">
          <Plus className="w-5 h-5 mr-2" /> Nova Tarefa
        </button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
          {Object.entries(COLUMNS).map(([columnId, column]) => (
            <div key={columnId} className={`flex-shrink-0 w-80 flex flex-col rounded-xl border border-gray-200 ${column.color}`}>
              {/* Column Header */}
              <div className="p-4 border-b border-gray-200/50 flex justify-between items-center bg-white/50 rounded-t-xl">
                <h3 className="font-bold text-gray-700 flex items-center">
                  {columnId === 'signature' && <AlertCircle className="w-4 h-4 mr-2 text-orange-500" />}
                  {column.title}
                </h3>
                <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold text-gray-500 border border-gray-100">
                  {tasks.filter(t => t.status === columnId).length}
                </span>
              </div>

              {/* Column Body */}
              <Droppable droppableId={columnId}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex-1 p-3 overflow-y-auto space-y-3 min-h-[100px]"
                  >
                    {tasks
                      .filter(t => t.status === columnId)
                      .sort((a, b) => {
                         // Ordem: Alta primeiro, depois pela posição
                         if(a.priority === 'Alta' && b.priority !== 'Alta') return -1;
                         if(b.priority === 'Alta' && a.priority !== 'Alta') return 1;
                         return a.position - b.position;
                      })
                      .map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => openEditModal(task)}
                            className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer group relative"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                              </span>
                              {task.due_date && (
                                <span className={`text-[10px] flex items-center ${new Date(task.due_date) < new Date() ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                                  <Clock className="w-3 h-3 mr-1" />
                                  {new Date(task.due_date).toLocaleDateString('pt-BR')}
                                </span>
                              )}
                            </div>
                            
                            <h4 className="text-sm font-bold text-gray-800 mb-1 leading-tight">{task.title}</h4>
                            {task.description && <p className="text-xs text-gray-500 line-clamp-2">{task.description}</p>}
                            
                            {task.contract_id && (
                              <div className="mt-3 pt-2 border-t border-gray-50 flex items-center text-[10px] text-orange-600 font-medium">
                                <AlertCircle className="w-3 h-3 mr-1" /> Contrato Pendente
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-xl shadow-xl p-6 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Nova Tarefa</h3>
              <button onClick={() => setIsModalOpen(false)}><X className="text-gray-400 hover:text-gray-600" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Título da Tarefa</label>
                <input type="text" className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-salomao-blue" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Ex: Analisar Minuta..." autoFocus />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Descrição</label>
                <textarea className="w-full border border-gray-300 rounded-lg p-2 text-sm h-20" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Prioridade</label>
                <select className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as any})}>
                  <option value="Baixa">Baixa</option>
                  <option value="Média">Média</option>
                  <option value="Alta">Alta (Topo da Lista)</option>
                </select>
              </div>
              <button onClick={handleCreateTask} className="w-full bg-salomao-blue text-white py-2 rounded-lg font-medium hover:bg-blue-900 transition-colors">Criar Tarefa</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL (COM OPÇÕES EXTRAS PARA ASSINATURA) */}
      {isEditModalOpen && currentTask && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-xl shadow-xl p-6 animate-in zoom-in-95">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">{currentTask.title}</h3>
                <span className="text-xs text-gray-400">Em: {COLUMNS[currentTask.status].title}</span>
              </div>
              <button onClick={() => setIsEditModalOpen(false)}><X className="text-gray-400 hover:text-gray-600" /></button>
            </div>

            <div className="space-y-4">
              {/* Campos Específicos para Coluna de Assinatura */}
              {currentTask.status === 'signature' && (
                <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 mb-4">
                  <div className="flex items-center text-orange-700 text-xs font-bold mb-2">
                    <AlertCircle className="w-3 h-3 mr-1" /> Acompanhamento de Assinatura
                  </div>
                  <div className="mb-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Data Limite (Reagendar)</label>
                    <input type="date" className="w-full border border-orange-200 rounded p-1.5 text-sm" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Observações do Motoboy/Cliente</label>
                    <textarea className="w-full border border-orange-200 rounded p-1.5 text-sm h-16" placeholder="Ex: Cliente pediu para retirar dia..." value={formData.observation} onChange={e => setFormData({...formData, observation: e.target.value})}></textarea>
                  </div>
                </div>
              )}

              {currentTask.status !== 'signature' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Descrição</label>
                    <textarea className="w-full border border-gray-300 rounded-lg p-2 text-sm h-24" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Prioridade</label>
                    <select className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as any})}>
                      <option value="Baixa">Baixa</option>
                      <option value="Média">Média</option>
                      <option value="Alta">Alta</option>
                    </select>
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-2">
                <button onClick={handleDeleteTask} className="flex-1 bg-red-50 text-red-600 border border-red-100 py-2 rounded-lg font-medium hover:bg-red-100 transition-colors">Excluir</button>
                <button onClick={handleUpdateTask} className="flex-[2] bg-salomao-blue text-white py-2 rounded-lg font-medium hover:bg-blue-900 transition-colors flex items-center justify-center">
                  <Save className="w-4 h-4 mr-2" /> Salvar Alterações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}