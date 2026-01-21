import React, { useState, useEffect, useMemo, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { supabase } from '../lib/supabase';
import { Contract, ContractProcess } from '../types';
import { Loader2, Share2, Gavel, Scale, FileText, Filter, Maximize2, Minimize2 } from 'lucide-react';

interface GraphNode {
  id: string;
  group: string;
  label: string;
  val: number;
  fullData?: any;
  role?: string;
}

interface GraphLink {
  source: string;
  target: string;
  type: string;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export function Jurimetria() {
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<Contract[]>([]);
  // Correção 1: Tipagem explícita para o estado do grafo
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [dimensions, setDimensions] = useState({ w: 800, h: 600 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Estados de Filtro
  const [filterType, setFilterType] = useState('all'); // all, judge, subject, court

  useEffect(() => {
    fetchJurimetriaData();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      // Buscamos contratos E seus processos aninhados
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *, 
          processes:contract_processes(*)
        `)
        .eq('status', 'active'); // Focamos em contratos ativos para jurimetria

      if (error) throw error;
      if (data) {
        setContracts(data);
        processGraphData(data);
      }
    } catch (error) {
      console.error("Erro Jurimetria:", error);
    } finally {
      setLoading(false);
      setTimeout(handleResize, 100); // Ajusta tamanho após render
    }
  };

  const processGraphData = (data: Contract[]) => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const nodeIds = new Set();

    // Helper para adicionar nó único
    const addNode = (id: string, group: string, label: string, val: number, details?: any) => {
      if (!nodeIds.has(id)) {
        nodes.push({ id, group, label, val, ...details });
        nodeIds.add(id);
      } else {
        // Incrementa valor/peso se já existe (ex: juiz que aparece mto)
        const node = nodes.find(n => n.id === id);
        if (node) node.val += 0.5;
      }
    };

    data.forEach(c => {
      // 1. Nó do Contrato (Centro da teia local)
      const contractId = `C-${c.id}`;
      addNode(contractId, 'contract', c.client_name, 5, { fullData: c });

      if (c.processes && Array.isArray(c.processes)) {
        c.processes.forEach((p: ContractProcess) => {
          // 2. Nó do Processo (Opcional, pode poluir, vamos ligar direto às entidades)
          // Vamos ligar Contrato -> Juiz, Contrato -> Assunto, etc.

          // Nó de Juiz (Magistrado)
          if (p.magistrates && Array.isArray(p.magistrates)) {
            p.magistrates.forEach(m => {
              const judgeId = `J-${m.name}`;
              addNode(judgeId, 'judge', m.name, 3, { role: m.title });
              links.push({ source: contractId, target: judgeId, type: 'judged_by' });
            });
          }

          // Nó de Assunto
          if (p.subject) {
            const subjectId = `S-${p.subject}`;
            addNode(subjectId, 'subject', p.subject, 2);
            links.push({ source: contractId, target: subjectId, type: 'about' });
          }

          // Nó de Tribunal/Vara
          if (p.court) {
            const courtId = `T-${p.court}`;
            addNode(courtId, 'court', p.court, 2);
            links.push({ source: contractId, target: courtId, type: 'at' });
          }
        });
      }
    });

    setGraphData({ nodes, links });
  };

  // --- Estatísticas Calculadas ---
  const stats = useMemo(() => {
    // Correção 2: Tipagem para o objeto de contagem (Record<string, number>)
    const counts: { 
      judges: Record<string, number>; 
      subjects: Record<string, number>; 
      courts: Record<string, number>; 
    } = { judges: {}, subjects: {}, courts: {} };
    
    contracts.forEach(c => {
      if(c.processes) {
        c.processes.forEach((p: any) => {
          if (p.subject) counts.subjects[p.subject] = (counts.subjects[p.subject] || 0) + 1;
          if (p.court) counts.courts[p.court] = (counts.courts[p.court] || 0) + 1;
          if (p.magistrates) {
            p.magistrates.forEach((m: any) => {
              counts.judges[m.name] = (counts.judges[m.name] || 0) + 1;
            });
          }
        });
      }
    });

    const sortObj = (obj: Record<string, number>) => Object.entries(obj).sort(([,a], [,b]) => b - a).slice(0, 5);

    return {
      topJudges: sortObj(counts.judges),
      topSubjects: sortObj(counts.subjects),
      topCourts: sortObj(counts.courts)
    };
  }, [contracts]);

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 text-salomao-gold animate-spin" /></div>;

  return (
    <div className={`p-6 animate-in fade-in duration-500 h-full flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-[#F8FAFC] p-0' : ''}`}>
      
      {/* Header */}
      <div className={`flex justify-between items-start mb-6 ${isFullscreen ? 'p-6 bg-white shadow-sm' : ''}`}>
        <div>
          <h1 className="text-3xl font-bold text-salomao-blue flex items-center gap-2">
            <Share2 className="w-8 h-8" /> Jurimetria & Conexões
          </h1>
          <p className="text-gray-500 mt-1">Análise gráfica de correlações entre processos, juízes e assuntos.</p>
        </div>
        <div className="flex gap-2">
           <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
             {isFullscreen ? <Minimize2 /> : <Maximize2 />}
           </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        
        {/* Painel Esquerdo - Estatísticas */}
        <div className="w-full lg:w-80 flex flex-col gap-4 overflow-y-auto pr-2">
            {/* Card Juízes */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-3"><Gavel className="w-4 h-4 text-salomao-gold" /> Top Magistrados</h3>
                <div className="space-y-2">
                    {stats.topJudges.map(([name, count], i) => (
                        <div key={i} className="flex justify-between items-center text-sm">
                            <span className="text-gray-600 truncate flex-1" title={name}>{name}</span>
                            <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-bold">{count}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Card Assuntos */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-3"><FileText className="w-4 h-4 text-blue-500" /> Assuntos Recorrentes</h3>
                <div className="space-y-2">
                    {stats.topSubjects.map(([name, count], i) => (
                        <div key={i} className="flex justify-between items-center text-sm">
                            <span className="text-gray-600 truncate flex-1" title={name}>{name}</span>
                            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold">{count}</span>
                        </div>
                    ))}
                </div>
            </div>

             {/* Card Tribunais */}
             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-3"><Scale className="w-4 h-4 text-green-500" /> Tribunais / Varas</h3>
                <div className="space-y-2">
                    {stats.topCourts.map(([name, count], i) => (
                        <div key={i} className="flex justify-between items-center text-sm">
                            <span className="text-gray-600 truncate flex-1" title={name}>{name}</span>
                            <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold">{count}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Área do Grafo */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 relative overflow-hidden flex flex-col" ref={containerRef}>
            <div className="absolute top-4 left-4 z-10 flex gap-2">
                <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-lg text-xs font-bold border border-gray-200 flex items-center gap-1 shadow-sm"><span className="w-2 h-2 rounded-full bg-salomao-blue"></span> Contrato</span>
                <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-lg text-xs font-bold border border-gray-200 flex items-center gap-1 shadow-sm"><span className="w-2 h-2 rounded-full bg-salomao-gold"></span> Juiz</span>
                <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-lg text-xs font-bold border border-gray-200 flex items-center gap-1 shadow-sm"><span className="w-2 h-2 rounded-full bg-green-500"></span> Assunto</span>
            </div>

            {/* Informação do Nó Selecionado */}
            {selectedNode && (
                <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur p-4 rounded-xl border border-gray-200 shadow-lg max-w-sm animate-in slide-in-from-bottom-5">
                    <button onClick={() => setSelectedNode(null)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"><Minimize2 className="w-4 h-4" /></button>
                    <h4 className="font-bold text-salomao-blue text-lg mb-1">{selectedNode.label}</h4>
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{selectedNode.group === 'contract' ? 'Contrato' : selectedNode.group === 'judge' ? 'Magistrado' : selectedNode.group === 'subject' ? 'Assunto' : 'Tribunal'}</span>
                    
                    {selectedNode.group === 'contract' && (
                        <div className="mt-3 text-sm space-y-1">
                            <p><span className="font-bold">Valor:</span> {selectedNode.fullData.pro_labore}</p>
                            <p><span className="font-bold">Status:</span> {selectedNode.fullData.status}</p>
                        </div>
                    )}
                </div>
            )}

            <ForceGraph2D
                width={dimensions.w}
                height={dimensions.h}
                graphData={graphData}
                nodeLabel="label"
                nodeColor={(node: any) => {
                    switch(node.group) {
                        case 'contract': return '#0F2C4C'; // salomao-blue
                        case 'judge': return '#D4AF37'; // salomao-gold
                        case 'subject': return '#22C55E'; // green
                        case 'court': return '#64748B'; // gray
                        default: return '#ccc';
                    }
                }}
                nodeRelSize={6}
                linkColor={() => '#E2E8F0'}
                onNodeClick={(node) => {
                    setSelectedNode(node);
                    // Zoom logic could go here
                }}
                cooldownTicks={100}
                onEngineStop={() => {}}
            />
        </div>

      </div>
    </div>
  );
}