import React, { useState, useEffect } from 'react';
import { 
  DragDropContext, 
  Droppable, 
  Draggable, 
  DropResult, 
  DroppableProvided, 
  DraggableProvided, 
  DraggableStateSnapshot 
} from '@hello-pangea/dnd';
import { Plus, MoreHorizontal, Calendar, User, Search, Filter, Loader2, AlertCircle, Trash2, Edit2, KanbanSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { KanbanTask, Contract } from '../types';
import { KanbanTaskModal } from '../components/kanban/KanbanTaskModal';

// REMOVIDOS: billing e review
const columns: Record<string, { id: string; title: string; color: string }> = {
  todo: { id: 'todo', title: 'A Fazer', color: 'bg-gray-100' },
  doing: { id: 'doing', title: 'Em Andamento', color: 'bg-blue-50' },
  signature: { id: 'signature', title: 'Assinatura', color: 'bg-orange-50' },
  done: { id: 'done', title: 'Concluído', color: 'bg-green-50' }
};

export function Kanban() {
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<KanbanTask | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);

  useEffect(() => {
    fetchTasks();
    fetchContracts();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('kanban_tasks')
      .select('*, contract:contracts(client_name)')
      .order('position');
    
    if (data) setTasks(data);
    setLoading(false);
  };

  const fetchContracts = async () => {
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('status', 'active')
      .order('client_name');
    
    if (error) {
      console.error('Erro ao buscar contratos:', error);
    }
    if (data) {
      console.log('Contratos carregados:', data.length);
      setContracts(data);
    }
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const newTasks = Array.from(tasks);
    const movedTaskIndex = newTasks.findIndex(t => t.id === draggableId);
    const [movedTask] = newTasks.splice(movedTaskIndex, 1);
    
    const newStatus = destination.droppableId as KanbanTask['status'];
    movedTask.status = newStatus;

    const destinationTasks = newTasks.filter(t => t.status === newStatus);
    destinationTasks.splice(destination.index, 0, movedTask);

    const otherTasks = newTasks.filter(t => t.status !== newStatus);
    const finalTasks = [...otherTasks, ...destinationTasks];
    
    setTasks(finalTasks);

    await supabase.from('kanban_tasks').update({ 
      status: newStatus, 
      position: destination.index 
    }).eq('id', draggableId);
  };

  const handleAddTask = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: KanbanTask) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleDeleteTask = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return;
    
    await supabase.from('kanban_tasks').delete().eq('id', id);
    setTasks(tasks.filter(t => t.id !== id));
    setIsModalOpen(false);
  };

  const handleSaveTask = async (taskData: Partial<KanbanTask>) => {
    const cleanData = { ...taskData };
    
    // Remove contract_id se for vazio
    if (!cleanData.contract_id || cleanData.contract_id === '') {
      delete cleanData.contract_id;
    }

    // Tratamento para data vazia ser salva como NULL
    if (!cleanData.due_date || cleanData.due_date === '') {
      cleanData.due_date = null as any; 
    }
    
    if (editingTask) {
      const { error } = await supabase
        .from('kanban_tasks')
        .update(cleanData)
        .eq('id', editingTask.id);
        
      if (!error) {
        fetchTasks();
      } else {
        console.error('Erro ao atualizar:', error);
        alert('Erro ao salvar tarefa: ' + error.message);
      }
    } else {
      const { error } = await supabase
        .from('kanban_tasks')
        .insert([cleanData]); 
        
      if (!error) {
        fetchTasks();
      } else {
        console.error('Erro ao criar:', error);
        alert('Erro ao criar tarefa: ' + error.message);
      }
    }
    setIsModalOpen(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Alta': return 'bg-red-100 text-red-700';
      case 'Média': return 'bg-yellow-100 text-yellow-700';
      case 'Baixa': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.contract?.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 h-full flex flex-col animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-salomao-blue flex items-center gap-2">
            <KanbanSquare className="w-8 h-8" /> Kanban de Tarefas
          </h1>
          <p className="text-gray-500 mt-1">Gerencie fluxo de trabalho e pendências.</p>
        </div>
        <button onClick={handleAddTask} className="bg-salomao-gold hover:bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-md transition-colors flex items-center font-bold">
          <Plus className="w-5 h-5 mr-2" /> Nova Tarefa
        </button>
      </div>

      <div className="flex items-center mb-6 bg-white p-2 rounded-xl border border-gray-100 shadow-sm w-full max-w-md">
        <Search className="w-5 h-5 text-gray-400 ml-2" />
        <input 
          type="text" 
          placeholder="Filtrar tarefas..." 
          className="flex-1 p-2 outline-none text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex-1 flex justify-center items-center"><Loader2 className="w-8 h-8 text-salomao-gold animate-spin" /></div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
            <div className="flex gap-6 h-full min-w-max">
              {Object.entries(columns).map(([columnId, column]) => {
                const columnTasks = filteredTasks.filter(t => t.status === columnId);
                
                return (
                  <div key={columnId} className="w-80 flex flex-col bg-gray-50/50 rounded-xl border border-gray-200/60 max-h-full">
                    <div className={`p-4 border-b border-gray-100 rounded-t-xl flex justify-between items-center ${column.color}`}>
                      <h3 className="font-bold text-gray-700">{column.title}</h3>
                      <span className="bg-white/50 px-2 py-0.5 rounded text-xs font-bold text-gray-600">{columnTasks.length}</span>
                    </div>
                    
                    <Droppable droppableId={columnId}>
                      {(provided: DroppableProvided, snapshot: any) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className={`flex-1 p-3 overflow-y-auto min-h-[150px] transition-colors ${snapshot.isDraggingOver ? 'bg-blue-50/30' : ''}`}
                        >
                          {columnTasks.map((task, index) => (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onClick={() => handleEditTask(task)}
                                  className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-3 cursor-pointer group hover:shadow-md hover:border-salomao-blue/30 transition-all relative ${snapshot.isDragging ? 'rotate-2 shadow-lg ring-2 ring-salomao-blue ring-opacity-50' : ''}`}
                                >
                                  {/* Botões de Ação Rápida (Hover) */}
                                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/90 rounded p-1 shadow-sm">
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); handleEditTask(task); }} 
                                      className="p-1 hover:bg-blue-50 rounded text-blue-600" 
                                      title="Editar"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button 
                                      onClick={(e) => handleDeleteTask(task.id, e)} 
                                      className="p-1 hover:bg-red-50 rounded text-red-600" 
                                      title="Excluir"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>

                                  <div className="flex justify-between items-start mb-2 pr-6">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getPriorityColor(task.priority)}`}>
                                      {task.priority}
                                    </span>
                                    {task.contract?.client_name && (
                                      <span className="text-[10px] text-gray-400 truncate max-w-[100px]" title={task.contract.client_name}>
                                        {task.contract.client_name}
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="text-sm font-bold text-gray-800 mb-2 leading-tight">{task.title}</h4>
                                  
                                  <div className="flex items-center justify-between text-xs text-gray-400 mt-3 pt-3 border-t border-gray-50">
                                    <div className="flex items-center">
                                      <Calendar className="w-3 h-3 mr-1" />
                                      {task.due_date ? new Date(task.due_date).toLocaleDateString('pt-BR') : '-'}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </div>
        </DragDropContext>
      )}

      <KanbanTaskModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        task={editingTask}
        onSave={handleSaveTask}
        onDelete={() => { if(editingTask) handleDeleteTask(editingTask.id) }}
        contracts={contracts}
      />
    </div>
  );
}