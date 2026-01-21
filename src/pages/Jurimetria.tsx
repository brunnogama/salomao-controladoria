import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { supabase } from '../lib/supabase';
import { Contract, ContractProcess } from '../types';
import { Loader2, Share2, Gavel, Scale, FileText, Maximize2, Minimize2 } from 'lucide-react';

// Interfaces para tipagem do Grafo
interface GraphNode {
  id: string;
  group: string;
  label: string;
  val: number;
  fullData?: any;
  role?: string;
  x?: number;
  y?: number;
  color?: string;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  type: string;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

// Interface para as estatísticas
interface StatsCount {
  judges: Record<string, number>;
  subjects: Record<string, number>;
  courts: Record<string, number>;
}

export function Jurimetria() {
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [dimensions, setDimensions] = useState({ w: 800, h: 600 });
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    fetchJurimetriaData();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Pequeno delay para garantir que o container já tenha tamanho
    setTimeout(handleResize, 500);
  }, [containerRef.current, isFullscreen]);

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
        .select(`
          *, 
          processes:contract_processes(*)
        `)
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
      // Normalizar ID para evitar duplicatas por espaços
      const cleanId = id.trim();
      
      if (!nodeIds.has(cleanId)) {
        nodes.push({ id: cleanId, group, label: label.trim(), val, ...details });
        nodeIds.add(cleanId);
      } else {
        const node = nodes.find(n => n.id === cleanId);
        if (node) node.val += 0.5; // Aumenta o peso se aparecer mais vezes
      }
      return cleanId;
    };

    data.forEach(c => {
      const contractId = `C-${c.id}`;
      addNode(contractId, 'contract', c.client_name, 8, { fullData: c });

      if (c.processes && Array.isArray(c.processes)) {
        c.processes.forEach((p: ContractProcess) => {
          
          // Magistrados
          if (p.magistrates && Array.isArray(p.magistrates)) {
            p.magistrates.forEach(m => {
              if (m.name) {
                const judgeId = `J-${m.name.trim()}`;
                addNode(judgeId, 'judge', m.name, 5, { role: m.title });
                links.push({ source: contractId, target: judgeId, type: 'judged_by' });
              }
            });
          }

          // Assuntos
          if (p.subject) {
            const subjectId = `S-${p.subject.trim()}`;
            addNode(subjectId, 'subject', p.subject, 3);
            links.push({ source: contractId, target: subjectId, type: 'about' });
          }

          // Tribunais/Varas
          if (p.court) {
            const courtId = `T-${p.court.trim()}`;
            addNode(courtId, 'court', p.court, 3);
            links.push({ source: contractId, target: courtId, type: 'at' });
          }
        });
      }
    });

    setGraphData({ nodes, links });
  };

  // --- Estatísticas Calculadas (Com Normalização) ---
  const stats = useMemo(() => {
    const counts: StatsCount = { judges: {}, subjects: {}, courts: {} };
    
    contracts.forEach(c => {
      if(c.processes && Array.isArray(c.processes)) {
        c.processes.forEach((p: ContractProcess) => {
          
          // Contagem Assuntos
          if (p.subject) {
            const subj = p.subject.trim(); // Normaliza removendo espaços extras
            counts.subjects[subj] = (counts.subjects[subj] || 0) + 1;
          }
          
          // Contagem Tribunais
          if (p.court) {
            const court = p.court.trim();
            counts.courts[court] = (counts.courts[court] || 0) + 1;
          }
          
          // Contagem Magistrados
          if (p.magistrates && Array.isArray(p.magistrates)) {
            p.magistrates.forEach((m: any) => {
              if (m.name) {
                const name = m.name.trim();
                counts.judges[name] = (counts.judges[name] || 0) + 1;
              }
            });
          }
        });
      }
    });

    const sortObj = (obj: Record<string, number>) => Object.entries(obj).sort(([,a], [,b]) => b - a).slice(0, 10); // Top 10

    return {
      topJudges: sortObj(counts.judges),
      topSubjects: sortObj(counts.subjects),
      topCourts: sortObj(counts.courts)
    };
  }, [contracts]);

  // Função para desenhar nó customizado (Texto sempre visível)
  const drawNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.label;
    const fontSize = 12 / globalScale;
    
    // Define cores baseadas no grupo
    let color = '#ccc';
    switch(node.group) {
        case 'contract': color = '#0F2C4C'; break;
        case 'judge': color = '#D4AF37'; break; // Dourado
        case 'subject': color = '#22C55E'; break;
        case 'court': color = '#64748B'; break;
    }
    node.color = color;

    // Desenha o círculo do nó
    const radius = 5;
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = color;
    ctx.fill();

    // Desenha o Texto (Label)
    // Só desenha texto se o zoom for suficiente ou se for um nó importante (Contrato ou Juiz)
    if (globalScale > 1.2 || node.group === 'contract' || node.group === 'judge') {
        ctx.font = `${fontSize}px Sans-Serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = node.group === 'contract' ? '#000' : '#666'; // Texto preto para contratos, cinza para outros
        ctx.fillText(label, node.x, node.y + radius + 1);
    }
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 text-salomao-gold animate-spin" /></div>;

  return (
    <div className={`p-6 animate-in fade-in duration-500 h-full flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-[#F8FAFC] p-0' : ''}`}>
      
      <div className={`flex justify-between items-start mb-6 ${isFullscreen ? 'p-6 bg-white shadow-sm' : ''}`}>
        <div>
          <h1 className="text-3xl font-bold text-salomao-blue flex items-center gap-2">
            <Share2 className="w-8 h-8" /> Jurimetria & Conexões
          </h1>
          <p className="text-gray-500 mt-1">Análise gráfica de correlações entre processos, juízes e assuntos.</p>
        </div>
        <div className="flex gap-2">
           <button onClick={() => { setIsFullscreen(!isFullscreen); setTimeout(handleResize, 100); }} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
             {isFullscreen ? <Minimize2 /> : <Maximize2 />}
           </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        
        {/* Painel Esquerdo - Estatísticas */}
        <div className="w-full lg:w-80 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
            {/* Card Juízes */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-3"><Gavel className="w-4 h-4 text-salomao-gold" /> Top Magistrados</h3>
                <div className="space-y-2">
                    {stats.topJudges.length > 0 ? stats.topJudges.map(([name, count], i) => (
                        <div key={i} className="flex justify-between items-center text-sm border-b border-gray-50 pb-1 last:border-0">
                            <span className="text-gray-600 truncate flex-1 pr-2" title={name}>{name}</span>
                            <span className="bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-bold">{count}</span>
                        </div>
                    )) : <p className="text-xs text-gray-400">Nenhum dado encontrado.</p>}
                </div>
            </div>

            {/* Card Assuntos */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-3"><FileText className="w-4 h-4 text-blue-500" /> Assuntos Recorrentes</h3>
                <div className="space-y-2">
                    {stats.topSubjects.length > 0 ? stats.topSubjects.map(([name, count], i) => (
                        <div key={i} className="flex justify-between items-center text-sm border-b border-gray-50 pb-1 last:border-0">
                            <span className="text-gray-600 truncate flex-1 pr-2" title={name}>{name}</span>
                            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold">{count}</span>
                        </div>
                    )) : <p className="text-xs text-gray-400">Nenhum dado encontrado.</p>}
                </div>
            </div>

             {/* Card Tribunais */}
             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-3"><Scale className="w-4 h-4 text-green-500" /> Tribunais / Varas</h3>
                <div className="space-y-2">
                    {stats.topCourts.length > 0 ? stats.topCourts.map(([name, count], i) => (
                        <div key={i} className="flex justify-between items-center text-sm border-b border-gray-50 pb-1 last:border-0">
                            <span className="text-gray-600 truncate flex-1 pr-2" title={name}>{name}</span>
                            <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold">{count}</span>
                        </div>
                    )) : <p className="text-xs text-gray-400">Nenhum dado encontrado.</p>}
                </div>
            </div>
        </div>

        {/* Área do Grafo */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 relative overflow-hidden flex flex-col" ref={containerRef}>
            <div className="absolute top-4 left-4 z-10 flex gap-2 pointer-events-none">
                <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-lg text-xs font-bold border border-gray-200 flex items-center gap-1 shadow-sm"><span className="w-2 h-2 rounded-full bg-salomao-blue"></span> Contrato</span>
                <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-lg text-xs font-bold border border-gray-200 flex items-center gap-1 shadow-sm"><span className="w-2 h-2 rounded-full bg-salomao-gold"></span> Juiz</span>
                <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-lg text-xs font-bold border border-gray-200 flex items-center gap-1 shadow-sm"><span className="w-2 h-2 rounded-full bg-green-500"></span> Assunto</span>
            </div>

            {selectedNode && (
                <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur p-4 rounded-xl border border-gray-200 shadow-lg max-w-sm animate-in slide-in-from-bottom-5">
                    <button onClick={() => setSelectedNode(null)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"><Minimize2 className="w-4 h-4" /></button>
                    <h4 className="font-bold text-salomao-blue text-lg mb-1">{selectedNode.label}</h4>
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{selectedNode.group === 'contract' ? 'Contrato' : selectedNode.group === 'judge' ? 'Magistrado' : selectedNode.group === 'subject' ? 'Assunto' : 'Tribunal'}</span>
                    
                    {selectedNode.group === 'contract' && selectedNode.fullData && (
                        <div className="mt-3 text-sm space-y-1">
                            <p><span className="font-bold">Valor:</span> {selectedNode.fullData.pro_labore || 'R$ -'}</p>
                            <p><span className="font-bold">Status:</span> {selectedNode.fullData.status}</p>
                        </div>
                    )}
                </div>
            )}

            <ForceGraph2D
                ref={graphRef}
                width={dimensions.w}
                height={dimensions.h}
                graphData={graphData}
                nodeCanvasObject={drawNode} // <--- A Mágica acontece aqui (desenho manual)
                nodeRelSize={6}
                linkColor={() => '#E2E8F0'}
                onNodeClick={(node) => {
                    setSelectedNode(node);
                    // Zoom suave no nó clicado
                    graphRef.current?.centerAt(node.x, node.y, 1000);
                    graphRef.current?.zoom(4, 2000);
                }}
                cooldownTicks={100}
                onEngineStop={() => {
                    // Opcional: Zoom to fit inicial
                    if (graphData.nodes.length > 0) {
                       graphRef.current?.zoomToFit(400);
                    }
                }}
            />
        </div>

      </div>
    </div>
  );
}