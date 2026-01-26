import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { supabase } from '../lib/supabase';
import { Contract, ContractProcess } from '../types';
import { Loader2, Share2, Gavel, Scale, FileText, Maximize2, Minimize2, Search, Filter, X, Shield } from 'lucide-react';
import { EmptyState } from '../components/ui/EmptyState';

// Interfaces
interface GraphNode {
  id: string;
  group: string; // 'contract' | 'judge' | 'subject' | 'court'
  label: string;
  val: number;
  fullData?: any;
  role?: string;
  x?: number;
  y?: number;
  color?: string;
  hidden?: boolean; // Para filtro
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  type: string;
  hidden?: boolean; // Para filtro
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

interface StatsCount {
  judges: Record<string, number>;
  subjects: Record<string, number>;
  courts: Record<string, number>;
}

export function Jurimetria() {
  // --- ROLE STATE ---
  const [userRole, setUserRole] = useState<'admin' | 'editor' | 'viewer' | null>(null);

  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [fullGraphData, setFullGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [filteredGraphData, setFilteredGraphData] = useState<GraphData>({ nodes: [], links: [] });
  
  const [dimensions, setDimensions] = useState({ w: 800, h: 600 });
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // --- FILTROS ---
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<{
      judge: string | null;
      subject: string | null;
      court: string | null;
  }>({ judge: null, subject: null, court: null });

  useEffect(() => {
    checkUserRole();
    fetchJurimetriaData();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setTimeout(handleResize, 500);
  }, [containerRef.current, isFullscreen]);

  // --- ROLE CHECK ---
  const checkUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
        if (profile) {
            setUserRole(profile.role as 'admin' | 'editor' | 'viewer');
        }
    }
  };

  // Aplicar Filtros
  useEffect(() => {
    if (fullGraphData.nodes.length === 0) return;

    let nodes = fullGraphData.nodes;
    let links = fullGraphData.links;

    // Filtro de Texto Global (Busca)
    if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        // Encontra nós que dão match
        const matchingNodes = new Set(
            nodes.filter(n => n.label.toLowerCase().includes(lowerSearch)).map(n => n.id)
        );
        
        // Se encontrou algo, mostra esses nós e seus vizinhos diretos
        if (matchingNodes.size > 0) {
            const connectedNodes = new Set(matchingNodes);
            const visibleLinks = links.filter(l => {
                const sourceId = typeof l.source === 'object' ? (l.source as any).id : l.source;
                const targetId = typeof l.target === 'object' ? (l.target as any).id : l.target;
                
                const isMatch = matchingNodes.has(sourceId) || matchingNodes.has(targetId);
                if (isMatch) {
                    connectedNodes.add(sourceId);
                    connectedNodes.add(targetId);
                }
                return isMatch;
            });
            
            nodes = nodes.filter(n => connectedNodes.has(n.id));
            links = visibleLinks;
        }
    }

    // Filtros Específicos (Click nos Cards)
    if (selectedFilters.judge || selectedFilters.subject || selectedFilters.court) {
        const filterNodes = new Set<string>();
        
        // Identificar IDs dos filtros selecionados
        if (selectedFilters.judge) filterNodes.add(`J-${selectedFilters.judge}`);
        if (selectedFilters.subject) filterNodes.add(`S-${selectedFilters.subject}`);
        if (selectedFilters.court) filterNodes.add(`T-${selectedFilters.court}`);

        // Encontrar vizinhos (contratos) e vizinhos dos vizinhos
        const relevantNodes = new Set(filterNodes);
        
        // Passo 1: Links diretos dos filtros (Filtro -> Contrato)
        const directLinks = links.filter(l => {
            const s = typeof l.source === 'object' ? (l.source as any).id : l.source;
            const t = typeof l.target === 'object' ? (l.target as any).id : l.target;
            return filterNodes.has(s) || filterNodes.has(t);
        });

        directLinks.forEach(l => {
             const s = typeof l.source === 'object' ? (l.source as any).id : l.source;
             const t = typeof l.target === 'object' ? (l.target as any).id : l.target;
             relevantNodes.add(s);
             relevantNodes.add(t);
        });

        // Filtrar
        nodes = nodes.filter(n => relevantNodes.has(n.id));
        links = directLinks;
    }

    setFilteredGraphData({ nodes, links });
    
    // Auto-zoom se filtrou
    if ((searchTerm || selectedFilters.judge || selectedFilters.subject || selectedFilters.court) && graphRef.current) {
        setTimeout(() => graphRef.current.zoomToFit(400, 50), 200);
    }

  }, [searchTerm, selectedFilters, fullGraphData]);


  const handleResize = () => {
    if (containerRef.current) {
      setDimensions({
        w: containerRef.current.offsetWidth,
        h: containerRef.current.offsetHeight
      });
    }
  };

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
        processGraphData(data);
      }
    } catch (error) {
      console.error("Erro Jurimetria:", error);
    } finally {
      setLoading(false);
    }
  };

  const processGraphData = (data: Contract[]) => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const nodeIds = new Set();

    const addNode = (id: string, group: string, label: string, val: number, details?: any) => {
      const cleanId = id.trim();
      if (!nodeIds.has(cleanId)) {
        nodes.push({ id: cleanId, group, label: label.trim(), val, ...details });
        nodeIds.add(cleanId);
      } else {
        const node = nodes.find(n => n.id === cleanId);
        if (node) node.val += 0.5; 
      }
      return cleanId;
    };

    data.forEach(c => {
      const contractId = `C-${c.id}`;
      addNode(contractId, 'contract', c.client_name, 8, { fullData: c });

      if (c.processes && Array.isArray(c.processes)) {
        c.processes.forEach((p: ContractProcess) => {
          if (p.magistrates && Array.isArray(p.magistrates)) {
            p.magistrates.forEach(m => {
              if (m.name) {
                const judgeId = `J-${m.name.trim()}`;
                addNode(judgeId, 'judge', m.name, 5, { role: m.title });
                links.push({ source: contractId, target: judgeId, type: 'judged_by' });
              }
            });
          }
          if (p.subject) {
            const subjectId = `S-${p.subject.trim()}`;
            addNode(subjectId, 'subject', p.subject, 3);
            links.push({ source: contractId, target: subjectId, type: 'about' });
          }
          if (p.court) {
            const courtId = `T-${p.court.trim()}`;
            addNode(courtId, 'court', p.court, 3);
            links.push({ source: contractId, target: courtId, type: 'at' });
          }
        });
      }
    });

    setFullGraphData({ nodes, links });
    setFilteredGraphData({ nodes, links }); // Inicialmente igual
  };

  // --- Estatísticas (Calculadas sobre o TOTAL, não sobre o filtrado, para servir de menu) ---
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
    const sortObj = (obj: Record<string, number>) => Object.entries(obj).sort(([,a], [,b]) => b - a).slice(0, 10);
    return {
      topJudges: sortObj(counts.judges),
      topSubjects: sortObj(counts.subjects),
      topCourts: sortObj(counts.courts)
    };
  }, [contracts]);

  const drawNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.label;
    const fontSize = 12 / globalScale;
    let color = '#ccc';
    switch(node.group) {
        case 'contract': color = '#0F2C4C'; break;
        case 'judge': color = '#D4AF37'; break; 
        case 'subject': color = '#22C55E'; break;
        case 'court': color = '#64748B'; break;
    }
    node.color = color;
    const radius = 5;
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = color;
    ctx.fill();

    if (globalScale > 1.2 || node.group === 'contract' || node.group === 'judge' || node === selectedNode) {
        ctx.font = `${fontSize}px Sans-Serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#000';
        ctx.fillText(label, node.x, node.y + radius + 1);
    }
  }, [selectedNode]);

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
      graphRef.current?.zoomToFit(400);
  };

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 text-salomao-gold animate-spin" /></div>;

  return (
    <div className={`p-6 animate-in fade-in duration-500 h-full flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-[#F8FAFC] p-0' : ''}`}>
      
      <div className={`flex justify-between items-start mb-6 ${isFullscreen ? 'p-6 bg-white shadow-sm' : ''}`}>
        <div>
          <h1 className="text-3xl font-bold text-salomao-blue flex items-center gap-2">
            <Share2 className="w-8 h-8" /> Jurimetria & Conexões
          </h1>
          <div className="flex items-center gap-2 mt-1">
                <p className="text-gray-500">Análise gráfica de correlações entre processos, juízes e assuntos.</p>
                {/* Badge de Perfil */}
                {userRole && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border flex items-center gap-1 ${
                        userRole === 'admin' 
                            ? 'bg-purple-100 text-purple-700 border-purple-200' 
                            : userRole === 'editor' 
                                ? 'bg-blue-100 text-blue-700 border-blue-200'
                                : 'bg-gray-100 text-gray-600 border-gray-200'
                    }`}>
                        <Shield className="w-3 h-3" />
                        {userRole === 'admin' ? 'Administrador' : userRole === 'editor' ? 'Editor' : 'Visualizador'}
                    </span>
                )}
          </div>
        </div>
        <div className="flex gap-2">
           {/* Barra de Busca Global */}
           <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
               <input 
                   type="text" 
                   placeholder="Buscar nó..." 
                   className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-64 focus:ring-2 focus:ring-salomao-blue outline-none"
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
               />
               {(searchTerm || selectedFilters.judge || selectedFilters.subject || selectedFilters.court) && (
                   <button onClick={clearFilters} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
               )}
           </div>

           <button onClick={() => { setIsFullscreen(!isFullscreen); setTimeout(handleResize, 100); }} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 border border-gray-200 bg-white">
             {isFullscreen ? <Minimize2 /> : <Maximize2 />}
           </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        
        {/* Painel Esquerdo - Estatísticas e Filtros */}
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

        {/* Área do Grafo */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 relative overflow-hidden flex flex-col" ref={containerRef}>
            
            {/* Legenda Flutuante */}
            <div className="absolute top-4 left-4 z-10 flex gap-2 pointer-events-none">
                <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-lg text-xs font-bold border border-gray-200 flex items-center gap-1 shadow-sm"><span className="w-2 h-2 rounded-full bg-salomao-blue"></span> Contrato</span>
                <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-lg text-xs font-bold border border-gray-200 flex items-center gap-1 shadow-sm"><span className="w-2 h-2 rounded-full bg-salomao-gold"></span> Juiz</span>
                <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-lg text-xs font-bold border border-gray-200 flex items-center gap-1 shadow-sm"><span className="w-2 h-2 rounded-full bg-green-500"></span> Assunto</span>
            </div>

            {/* Empty State do Grafo */}
            {filteredGraphData.nodes.length === 0 && !loading && (
                 <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                      <EmptyState 
                          icon={Filter} 
                          title="Nenhum dado encontrado" 
                          description="Tente limpar os filtros ou buscar por outro termo."
                          actionLabel="Limpar Filtros"
                          onAction={clearFilters}
                      />
                 </div>
            )}

            {/* Detalhes do Nó Selecionado */}
            {selectedNode && (
                <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur p-4 rounded-xl border border-gray-200 shadow-lg max-w-sm animate-in slide-in-from-bottom-5">
                    <button onClick={() => setSelectedNode(null)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                    <h4 className="font-bold text-salomao-blue text-lg mb-1">{selectedNode.label}</h4>
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{selectedNode.group === 'contract' ? 'Contrato' : selectedNode.group === 'judge' ? 'Magistrado' : selectedNode.group === 'subject' ? 'Assunto' : 'Tribunal'}</span>
                    
                    {selectedNode.group === 'contract' && selectedNode.fullData && (
                        <div className="mt-3 text-sm space-y-1">
                            <p><span className="font-bold">Valor:</span> {selectedNode.fullData.pro_labore ? selectedNode.fullData.pro_labore.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ -'}</p>
                            <p><span className="font-bold">Status:</span> {selectedNode.fullData.status}</p>
                        </div>
                    )}
                </div>
            )}

            <ForceGraph2D
                ref={graphRef}
                width={dimensions.w}
                height={dimensions.h}
                graphData={filteredGraphData}
                nodeCanvasObject={drawNode}
                nodeRelSize={6}
                linkColor={() => '#E2E8F0'}
                onNodeClick={(node) => {
                    setSelectedNode(node);
                    graphRef.current?.centerAt(node.x, node.y, 1000);
                    graphRef.current?.zoom(4, 2000);
                }}
                cooldownTicks={100}
                onEngineStop={() => {
                    if (filteredGraphData.nodes.length > 0 && !searchTerm && !selectedFilters.judge) {
                       graphRef.current?.zoomToFit(400);
                    }
                }}
            />
        </div>

      </div>
    </div>
  );
}