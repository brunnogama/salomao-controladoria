import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  History as HistoryIcon, 
  Search, 
  Filter, 
  Clock, 
  User, 
  FileText, 
  Trash2, 
  PlusCircle, 
  Edit3,
  ArrowRight,
  Database
} from 'lucide-react';

interface LogItem {
  id: string;
  table_name: string;
  record_id: string; // Adicionado para corrigir o erro de tipo
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  old_data: any;
  new_data: any;
  changed_at: string;
  user_id: string;
  user_email?: string;
}

export function History() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      // Busca os logs (limite de 100 para performance)
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('changed_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      setLogs(data || []);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTableName = (table: string) => {
    switch (table) {
      case 'contracts': return 'Contratos';
      case 'clients': return 'Clientes';
      case 'kanban_tasks': return 'Tarefas Kanban';
      case 'financial_installments': return 'Financeiro';
      default: return table;
    }
  };

  const getActionStyle = (action: string) => {
    switch (action) {
      case 'INSERT': return { color: 'text-green-600', bg: 'bg-green-100', icon: PlusCircle, label: 'Criação' };
      case 'DELETE': return { color: 'text-red-600', bg: 'bg-red-100', icon: Trash2, label: 'Exclusão' };
      case 'UPDATE': return { color: 'text-blue-600', bg: 'bg-blue-100', icon: Edit3, label: 'Edição' };
      default: return { color: 'text-gray-600', bg: 'bg-gray-100', icon: Database, label: 'Sistema' };
    }
  };

  const formatDiff = (log: LogItem) => {
    if (log.action === 'DELETE') {
      return <span className="text-gray-500 italic">Item excluído permanentemente.</span>;
    }
    
    if (log.action === 'INSERT') {
      const name = log.new_data?.client_name || log.new_data?.title || log.new_data?.name || 'Novo Registro';
      return <span className="font-medium text-gray-700">Novo item criado: "{name}"</span>;
    }

    if (log.action === 'UPDATE' && log.old_data && log.new_data) {
      const changes: string[] = [];
      Object.keys(log.new_data).forEach(key => {
        if (JSON.stringify(log.new_data[key]) !== JSON.stringify(log.old_data[key])) {
          if (['updated_at', 'created_at'].includes(key)) return;
          changes.push(key);
        }
      });

      if (changes.length === 0) return <span className="text-gray-400">Atualização interna do sistema.</span>;

      return (
        <div className="flex flex-wrap gap-2">
          <span className="text-gray-500 mr-1">Alterou:</span>
          {changes.slice(0, 3).map(key => (
            <span key={key} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded border border-gray-200 font-mono">
              {key}
            </span>
          ))}
          {changes.length > 3 && <span className="text-xs text-gray-400">+{changes.length - 3} outros</span>}
        </div>
      );
    }
    return null;
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.table_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.record_id && log.record_id.includes(searchTerm));
    const matchesFilter = filterAction === 'ALL' || log.action === filterAction;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-salomao-blue flex items-center gap-3">
          <HistoryIcon className="w-8 h-8" /> Histórico de Atividades
        </h1>
        <p className="text-gray-500 mt-1">Monitoramento completo de alterações no sistema (Audit Log).</p>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar por módulo ou ID..." 
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-salomao-blue"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
          {['ALL', 'INSERT', 'UPDATE', 'DELETE'].map(type => (
            <button
              key={type}
              onClick={() => setFilterAction(type)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                filterAction === type 
                  ? 'bg-salomao-blue text-white shadow-md' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {type === 'ALL' ? 'Todos' : type === 'INSERT' ? 'Criações' : type === 'UPDATE' ? 'Edições' : 'Exclusões'}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Carregando histórico...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
            <HistoryIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Nenhum registro encontrado.</p>
            <p className="text-xs text-gray-400 mt-1">Realize alterações no sistema para gerar logs.</p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const style = getActionStyle(log.action);
            const date = new Date(log.changed_at);
            
            return (
              <div key={log.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${style.bg.replace('bg-', 'bg-').replace('100', '500')}`}></div>
                
                <div className="flex flex-col md:flex-row gap-4 items-start">
                  <div className="flex-shrink-0 flex flex-col items-center min-w-[100px]">
                    <div className={`w-10 h-10 rounded-full ${style.bg} flex items-center justify-center mb-2`}>
                      <style.icon className={`w-5 h-5 ${style.color}`} />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold text-gray-700">{date.toLocaleDateString()}</p>
                      <p className="text-[10px] text-gray-400">{date.toLocaleTimeString()}</p>
                    </div>
                  </div>

                  <div className="flex-1 w-full">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded uppercase tracking-wider ${style.bg} ${style.color}`}>
                            {style.label}
                          </span>
                          <span className="text-sm font-medium text-gray-600">em</span>
                          <span className="text-sm font-bold text-salomao-blue uppercase">{formatTableName(log.table_name)}</span>
                        </h3>
                      </div>
                      <div className="flex items-center text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full border border-gray-100">
                        <User className="w-3 h-3 mr-1" />
                        <span className="truncate max-w-[150px]" title={log.user_id}>
                          {log.user_email || 'Usuário do Sistema'}
                        </span>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 text-sm">
                      {formatDiff(log)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}