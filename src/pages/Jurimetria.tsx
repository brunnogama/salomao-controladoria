import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Contract, ContractProcess } from '../types';
import { Loader2, Share2, Gavel, Scale, FileText, Maximize2, Minimize2, Search, Filter, X, BarChart3, PieChart } from 'lucide-react';
import { EmptyState } from '../components/ui/EmptyState';

// Interfaces
interface StatsCount {
  judges: Record<string, number>;
  subjects: Record<string, number>;
  courts: Record<string, number>;
}

export function Jurimetria() {
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<Contract[]>([]);
  
  const [isFullscreen, setIsFullscreen] = useState(false);

  // --- FILTROS ---
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<{
      judge: string | null;
      subject: string | null;
      court: string | null;
  }>({ judge: null, subject: null, court: null });

  useEffect(() => {
    fetchJurimetriaData();
  }, []);

  const fetchJurimetriaData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contracts')
        .select(`*, processes:contract_processes(*)`)
        .eq('status', 'active');

      if (error) throw error;
      if (data) {
        setContracts(data);
      }
    } catch (error) {
      console.error("Erro Jurimetria:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- Estatísticas ---
  const stats = useMemo(() => {
    const counts: StatsCount = { judges: {}, subjects: {}, courts: {} };
    contracts.forEach(c => {
      if(c.processes && Array.isArray(c.processes)) {
        c.processes.forEach((p: ContractProcess) => {
          if (p.subject) counts.subjects[p.subject.trim()] = (counts.subjects[p.subject.trim()] || 0) + 1;
          if (p.court) counts.courts[p.court.trim()] = (counts.courts[p.court.trim()] || 0) + 1;
          if (p.magistrates && Array.isArray(p.magistrates)) {
            p.magistrates.forEach((m: any) => {
              if (m.name) counts.judges[m.name.trim()] = (counts.judges[m.name.trim()] || 0) + 1;
            });
          }
        });
      }
    });
    
    // Helper para ordenar e pegar top 10
    const sortObj = (obj: Record<string, number>) => Object.entries(obj).sort(([,a], [,b]) => b - a).slice(0, 10);
    
    return {
      topJudges: sortObj(counts.judges),
      topSubjects: sortObj(counts.subjects),
      topCourts: sortObj(counts.courts)
    };
  }, [contracts]);

  // Handler para toggles de filtro
  const toggleFilter = (type: 'judge' | 'subject' | 'court', value: string) => {
      setSelectedFilters(prev => ({
          ...prev,
          [type]: prev[type] === value ? null : value // Toggle
      }));
  };

  const clearFilters = () => {
      setSearchTerm('');
      setSelectedFilters({ judge: null, subject: null, court: null });
  };

  // Componente interno para Barra de Progresso
  const DataBar = ({ label, value, max, colorClass, icon: Icon }: any) => {
    const percentage = Math.round((value / max) * 100);
    return (
        <div className="mb-4">
            <div className="flex justify-between items-center mb-1 text-sm">
                <span className="font-medium text-gray-700 flex items-center gap-2">
                    {Icon && <Icon className={`w-4 h-4 ${colorClass}`} />}
                    {label}
                </span>
                <span className="font-bold text-gray-900">{value}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div 
                    className={`h-2.5 rounded-full ${colorClass.replace('text-', 'bg-')}`} 
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
  };

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 text-salomao-gold animate-spin" /></div>;

  return (
    <div className={`p-6 animate-in fade-in duration-500 h-full flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-[#F8FAFC] p-0' : ''}`}>
      
      <div className={`flex justify-between items-start mb-6 ${isFullscreen ? 'p-6 bg-white shadow-sm' : ''}`}>
        <div>
          <h1 className="text-3xl font-bold text-salomao-blue flex items-center gap-2">
            <Share2 className="w-8 h-8" /> Jurimetria & Dados
          </h1>
          <p className="text-gray-500 mt-1">Análise quantitativa de processos, magistrados e competências.</p>
        </div>
        <div className="flex gap-2">
           {/* Barra de Busca Global */}
           <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
               <input 
                   type="text" 
                   placeholder="Buscar dados..." 
                   className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-64 focus:ring-2 focus:ring-salomao-blue outline-none"
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
               />
               {(searchTerm || selectedFilters.judge || selectedFilters.subject || selectedFilters.court) && (
                   <button onClick={clearFilters} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
               )}
           </div>

           <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 border border-gray-200 bg-white">
             {isFullscreen ? <Minimize2 /> : <Maximize2 />}
           </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        
        {/* Painel Esquerdo - Listas */}
        <div className="w-full lg:w-80 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
            {/* Card Juízes */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-3"><Gavel className="w-4 h-4 text-salomao-gold" /> Top Magistrados</h3>
                <div className="space-y-1">
                    {stats.topJudges.length > 0 ? stats.topJudges.map(([name, count], i) => (
                        <div 
                            key={i} 
                            onClick={() => toggleFilter('judge', name)}
                            className={`flex justify-between items-center text-sm p-1.5 rounded cursor-pointer transition-colors ${selectedFilters.judge === name ? 'bg-yellow-100 border border-yellow-300' : 'hover:bg-gray-50'}`}
                        >
                            <span className="text-gray-600 truncate flex-1 pr-2" title={name}>{name}</span>
                            <span className="bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-bold">{count}</span>
                        </div>
                    )) : <p className="text-xs text-gray-400">Nenhum dado encontrado.</p>}
                </div>
            </div>

            {/* Card Assuntos */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-3"><FileText className="w-4 h-4 text-blue-500" /> Assuntos</h3>
                <div className="space-y-1">
                    {stats.topSubjects.length > 0 ? stats.topSubjects.map(([name, count], i) => (
                        <div 
                            key={i} 
                            onClick={() => toggleFilter('subject', name)}
                            className={`flex justify-between items-center text-sm p-1.5 rounded cursor-pointer transition-colors ${selectedFilters.subject === name ? 'bg-blue-100 border border-blue-300' : 'hover:bg-gray-50'}`}
                        >
                            <span className="text-gray-600 truncate flex-1 pr-2" title={name}>{name}</span>
                            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold">{count}</span>
                        </div>
                    )) : <p className="text-xs text-gray-400">Nenhum dado encontrado.</p>}
                </div>
            </div>

             {/* Card Tribunais */}
             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-3"><Scale className="w-4 h-4 text-green-500" /> Tribunais</h3>
                <div className="space-y-1">
                    {stats.topCourts.length > 0 ? stats.topCourts.map(([name, count], i) => (
                        <div 
                            key={i} 
                            onClick={() => toggleFilter('court', name)}
                            className={`flex justify-between items-center text-sm p-1.5 rounded cursor-pointer transition-colors ${selectedFilters.court === name ? 'bg-green-100 border border-green-300' : 'hover:bg-gray-50'}`}
                        >
                            <span className="text-gray-600 truncate flex-1 pr-2" title={name}>{name}</span>
                            <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold">{count}</span>
                        </div>
                    )) : <p className="text-xs text-gray-400">Nenhum dado encontrado.</p>}
                </div>
            </div>
        </div>

        {/* Área Visualização de Dados (Antigo Grafo) */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6 overflow-y-auto">
            
            {contracts.length === 0 && !loading && (
                 <div className="h-full flex items-center justify-center">
                      <EmptyState 
                          icon={Filter} 
                          title="Nenhum dado encontrado" 
                          description="Não há contratos ativos com processos para análise."
                      />
                 </div>
            )}

            {contracts.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                    
                    {/* Resumo Geral */}
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <span className="text-blue-600 text-sm font-medium flex items-center gap-2"><FileText className="w-4 h-4"/> Total Processos</span>
                            <p className="text-2xl font-bold text-blue-900 mt-1">{contracts.reduce((acc, c) => acc + (c.processes?.length || 0), 0)}</p>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                            <span className="text-yellow-600 text-sm font-medium flex items-center gap-2"><Gavel className="w-4 h-4"/> Magistrados</span>
                            <p className="text-2xl font-bold text-yellow-900 mt-1">{stats.topJudges.length}</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                            <span className="text-green-600 text-sm font-medium flex items-center gap-2"><Scale className="w-4 h-4"/> Tribunais</span>
                            <p className="text-2xl font-bold text-green-900 mt-1">{stats.topCourts.length}</p>
                        </div>
                    </div>

                    {/* Gráfico: Top Assuntos */}
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <PieChart className="w-5 h-5 text-blue-500" /> Distribuição por Assunto
                        </h4>
                        <div className="space-y-2">
                            {stats.topSubjects.slice(0, 8).map(([name, count], i) => (
                                <DataBar 
                                    key={i}
                                    label={name}
                                    value={count}
                                    max={stats.topSubjects[0][1]}
                                    colorClass="text-blue-500"
                                />
                            ))}
                        </div>
                    </div>

                    {/* Gráfico: Top Tribunais */}
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-green-500" /> Principais Tribunais
                        </h4>
                        <div className="space-y-2">
                            {stats.topCourts.slice(0, 8).map(([name, count], i) => (
                                <DataBar 
                                    key={i}
                                    label={name}
                                    value={count}
                                    max={stats.topCourts[0][1]}
                                    colorClass="text-green-500"
                                />
                            ))}
                        </div>
                    </div>

                    {/* Gráfico: Top Magistrados (Full Width) */}
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm md:col-span-2">
                        <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <Gavel className="w-5 h-5 text-salomao-gold" /> Magistrados Mais Recorrentes
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                             {stats.topJudges.slice(0, 10).map(([name, count], i) => (
                                <DataBar 
                                    key={i}
                                    label={name}
                                    value={count}
                                    max={stats.topJudges[0][1]}
                                    colorClass="text-yellow-500"
                                    icon={Gavel}
                                />
                            ))}
                        </div>
                    </div>

                </div>
            )}
        </div>

      </div>
    </div>
  );
}