import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  CalendarDays, CalendarRange, ArrowRight, Filter, BarChart3, Camera, FileSignature,
  Loader2, BarChart4, Layers, XCircle, CheckCircle2, Briefcase, Clock, Mail,
  LayoutDashboard, TrendingUp, TrendingDown, Minus, Ban, Scale, Activity, DollarSign,
  ArrowUpRight, GitCommit, HeartHandshake, AlertCircle, FileSearch, Lightbulb,
  Percent, Users, Banknote
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDashboardData } from '../hooks/useDashboardData';
import { EmptyState } from '../components/ui/EmptyState';

// Tipagem para o componente interno FinItem
interface FinItemProps {
  label: string;
  value: number;
  colorClass?: string;
}

export function Dashboard() {
  const navigate = useNavigate();
  const {
    loading, metrics, funil, evolucaoMensal, financeiro12Meses, statsFinanceiro,
    propostas12Meses, statsPropostas, mediasFinanceiras, mediasPropostas,
    rejectionData, contractsByPartner
  } = useDashboardData();

  const [exporting, setExporting] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const handleExportAndEmail = async () => {
    if (!dashboardRef.current) return;
    setExporting(true);
    try {
        const canvas = await html2canvas(dashboardRef.current, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#F8FAFC',
            ignoreElements: (element) => element.id === 'export-button-container'
        });

        const imgData = canvas.toDataURL('image/png');
        const dateStr = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');

        const linkPng = document.createElement('a');
        linkPng.href = imgData;
        linkPng.download = `Relatorio_Dashboard_${dateStr}.png`;
        linkPng.click();

        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Relatorio_Dashboard_${dateStr}.pdf`);

        const subject = encodeURIComponent(`Panorama dos Contratos atualizado - ${dateStr}`);
        const body = encodeURIComponent(`Caros,\n\nSegue em anexo o panorama atualizado dos contratos.\n\nAtenciosamente,\nMarcio Gama - Controladoria.`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;

    } catch (error) {
        console.error("Erro ao exportar:", error);
        alert("Houve um erro ao gerar o relatório.");
    } finally {
        setExporting(false);
    }
  };

  // Função para navegação contextual (Drill-down)
  const handleDrillDown = (status: string) => {
    navigate('/contratos', { state: { status } });
  };

  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val || 0);
  
  // Formatador compacto para gráficos (sem centavos)
  const formatCompact = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val || 0);

  const FinItem = ({ label, value, colorClass = 'text-gray-700' }: FinItemProps) => {
    if (!value || value === 0) return null;
    return (
        <div className='flex justify-between items-end text-sm mt-1 border-b border-gray-100 pb-1 last:border-0 last:pb-0'>
            <span className='text-gray-600 text-xs'>{label}</span>
            <span className={`font-bold ${colorClass}`}>{formatMoney(value)}</span>
        </div>
    );
  };

  if (loading) return <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 text-salomao-gold animate-spin" /></div>;

  // Cálculos protegidos com fallback para 0
  const totalNegociacao = (metrics?.geral?.valorEmNegociacaoPL || 0) + (metrics?.geral?.valorEmNegociacaoExito || 0);
  const totalCarteira = (metrics?.geral?.totalFechadoPL || 0) + (metrics?.geral?.totalFechadoExito || 0) + (metrics?.geral?.receitaRecorrenteAtiva || 0);

  const calcDelta = (atual: number, anterior: number) => {
      if (anterior === 0) return atual > 0 ? 100 : 0;
      return ((atual - anterior) / anterior) * 100;
  };

  const valPropSemana = (metrics?.semana?.propPL || 0) + (metrics?.semana?.propExito || 0) + (metrics?.semana?.propMensal || 0);
  const valPropSemanaAnt = (metrics?.semanaAnterior?.propPL || 0) + (metrics?.semanaAnterior?.propExito || 0) + (metrics?.semanaAnterior?.propMensal || 0);
  const deltaPropSemana = calcDelta(valPropSemana, valPropSemanaAnt);

  const valFechSemana = (metrics?.semana?.fechPL || 0) + (metrics?.semana?.fechExito || 0) + (metrics?.semana?.fechMensal || 0);
  const valFechSemanaAnt = (metrics?.semanaAnterior?.fechPL || 0) + (metrics?.semanaAnterior?.fechExito || 0) + (metrics?.semanaAnterior?.fechMensal || 0);
  const deltaFechSemana = calcDelta(valFechSemana, valFechSemanaAnt);

  const maxSemanaChart = Math.max(valPropSemana, valPropSemanaAnt, valFechSemana, valFechSemanaAnt, 100);

  const valPropMes = (metrics?.executivo?.mesAtual?.propPL || 0) + (metrics?.executivo?.mesAtual?.propExito || 0) + (metrics?.executivo?.mesAtual?.propMensal || 0);
  const valPropMesAnt = (metrics?.executivo?.mesAnterior?.propPL || 0) + (metrics?.executivo?.mesAnterior?.propExito || 0) + (metrics?.executivo?.mesAnterior?.propMensal || 0);
  const deltaPropMes = calcDelta(valPropMes, valPropMesAnt);

  const valFechMes = (metrics?.executivo?.mesAtual?.fechPL || 0) + (metrics?.executivo?.mesAtual?.fechExito || 0) + (metrics?.executivo?.mesAtual?.fechMensal || 0);
  const valFechMesAnt = (metrics?.executivo?.mesAnterior?.fechPL || 0) + (metrics?.executivo?.mesAnterior?.fechExito || 0) + (metrics?.executivo?.mesAnterior?.fechMensal || 0);
  const deltaFechMes = calcDelta(valFechMes, valFechMesAnt);

  const maxMesChart = Math.max(valPropMes, valPropMesAnt, valFechMes, valFechMesAnt, 100);

  const deltaNovos = calcDelta(metrics?.executivo?.mesAtual?.novos || 0, metrics?.executivo?.mesAnterior?.novos || 0);
  const deltaPropQtd = calcDelta(metrics?.executivo?.mesAtual?.propQtd || 0, metrics?.executivo?.mesAnterior?.propQtd || 0);
  const deltaFechQtd = calcDelta(metrics?.executivo?.mesAtual?.fechQtd || 0, metrics?.executivo?.mesAnterior?.fechQtd || 0);
  
  const totalEntrada12 = evolucaoMensal.reduce((acc, curr) => acc + curr.qtd, 0);
  const mediaEntrada = evolucaoMensal.length > 0 ? (totalEntrada12 / evolucaoMensal.length).toFixed(1) : '0';
  const ultimoQtd = evolucaoMensal.length > 0 ? evolucaoMensal[evolucaoMensal.length - 1].qtd : 0;
  const penultimoQtd = evolucaoMensal.length > 1 ? evolucaoMensal[evolucaoMensal.length - 2].qtd : 0;
  const diffEntrada = ultimoQtd - penultimoQtd;

  // Calculos Assinatura
  const totalAssinaturasCalculo = (metrics?.geral?.assinados || 0) + (metrics?.geral?.naoAssinados || 0);
  const percentualSemAssinatura = totalAssinaturasCalculo > 0 
    ? ((metrics?.geral?.naoAssinados || 0) / totalAssinaturasCalculo) * 100 
    : 0;

  // Helpers para Insights
  const getTrendText = (delta: number, context: string) => {
    // Formata o valor para não mostrar números gigantes
    const displayDelta = Math.abs(delta) > 999 ? '>999' : Math.abs(delta).toFixed(0);
    
    if (delta > 0) return `Crescimento de ${displayDelta}% em ${context}.`;
    if (delta < 0) return `Redução de ${displayDelta}% em ${context}.`;
    return `Estabilidade em ${context}.`;
  };

  const insightSemana = `${getTrendText(deltaFechSemana, 'fechamento de contratos')} ${getTrendText(deltaPropSemana, 'envio de propostas')}`;
  const insightMes = `${getTrendText(deltaNovos, 'novas demandas')} ${getTrendText(deltaFechMes, 'faturamento fechado')}`;

  return (
    <div className='w-full space-y-8 pb-10 animate-in fade-in duration-500 p-8'>
      
      <div className="flex justify-between items-start mb-8">
        <div>
            <h1 className='text-3xl font-bold text-salomao-blue flex items-center gap-2'>
              <LayoutDashboard className="w-8 h-8" /> Controladoria Jurídica
            </h1>
            <p className='text-gray-600 mt-1'>Visão estratégica de contratos e resultados.</p>
        </div>
        <div id="export-button-container">
            <button 
                onClick={handleExportAndEmail} 
                disabled={exporting}
                className="flex items-center bg-salomao-blue text-white px-4 py-2 rounded-lg hover:bg-blue-900 transition-colors shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                Enviar por E-mail
            </button>
        </div>
      </div>

      <div ref={dashboardRef} className="space-y-8 bg-[#F8FAFC] p-2">

        {/* 1. FUNIL DE EFICIÊNCIA */}
         <div className='bg-white p-6 rounded-2xl shadow-sm border border-gray-200'>
            <div className='flex items-center gap-2 mb-6 border-b pb-4'><Filter className='text-blue-600' size={24} /><div><h2 className='text-xl font-bold text-gray-800'>Funil de Eficiência</h2><p className='text-xs text-gray-600'>Taxa de conversão e tempo médio.</p></div></div>
            <div className='grid grid-cols-1 md:grid-cols-5 gap-4 items-center'>
            <div className='md:col-span-1 bg-gray-50 p-4 rounded-xl border border-gray-200 text-center relative'><p className='text-xs font-bold text-gray-600 uppercase tracking-wider'>1. Prospects</p><p className='text-3xl font-bold text-gray-800 mt-2'>{funil.totalEntrada}</p><div className='hidden md:block absolute -right-6 top-1/2 -translate-y-1/2 z-10'><ArrowRight className='text-gray-300' /></div></div>
            
            <div className='md:col-span-1 flex flex-col items-center justify-center space-y-3'>
                <div className='bg-blue-50 text-blue-700 border border-blue-100 text-xs font-bold px-3 py-1 rounded-full shadow-sm'>{funil.taxaConversaoProposta}% Avançam</div>
                <div className='text-[10px] text-red-500 flex items-center gap-1 opacity-80'><XCircle size={10} /> {funil.perdaAnalise} Rejeitados</div>
                <div className='flex flex-col items-center mt-1'>
                    <span className='text-[9px] text-gray-500 uppercase font-bold mb-1'>Tempo Médio</span>
                    <span className='text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded-md border border-gray-200 flex items-center gap-1'><Clock size={10} /> {funil.tempoMedioProspectProposta} dias</span>
                </div>
            </div>

            <div className='md:col-span-1 bg-blue-50 p-4 rounded-xl border border-blue-100 text-center relative'><p className='text-xs font-bold text-blue-600 uppercase tracking-wider'>2. Propostas</p><p className='text-3xl font-bold text-blue-900 mt-2'>{funil.qualificadosProposta}</p><div className='hidden md:block absolute -right-6 top-1/2 -translate-y-1/2 z-10'><ArrowRight className='text-blue-200' /></div></div>
            
            <div className='md:col-span-1 flex flex-col items-center justify-center space-y-3'>
                <div className='bg-green-50 text-green-700 border border-green-100 text-xs font-bold px-3 py-1 rounded-full shadow-sm'>{funil.taxaConversaoFechamento}% Fecham</div>
                <div className='text-[10px] text-red-500 flex items-center gap-1 opacity-80'><XCircle size={10} /> {funil.perdaNegociacao} Rejeitados</div>
                <div className='flex flex-col items-center mt-1'>
                    <span className='text-[9px] text-blue-400 uppercase font-bold mb-1'>Tempo Médio</span>
                    <span className='text-xs font-bold text-blue-800 bg-blue-50/50 px-2 py-1 rounded-md border border-blue-100 flex items-center gap-1'><Clock size={10} /> {funil.tempoMedioPropostaFechamento} dias</span>
                </div>
            </div>

            <div className='md:col-span-1 bg-green-50 p-4 rounded-xl border border-green-100 text-center'><p className='text-xs font-bold text-green-600 uppercase tracking-wider'>3. Fechados</p><p className='text-3xl font-bold text-green-900 mt-2'>{funil.fechados}</p></div>
            </div>
        </div>

        {/* 2. SNAPSHOTS: CARTEIRA ATUAL (5 cols) | FINANCEIRA TOTAL (7 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Esquerda: Fotografia da Carteira Atual (Cards) */}
            <div className='lg:col-span-5 bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full flex flex-col'>
                <div className='flex items-center justify-between mb-6 border-b pb-4'>
                    <div className='flex items-center gap-2'>
                        <Camera className='text-[#0F2C4C]' size={24} />
                        <div>
                            <h2 className='text-xl font-bold text-gray-800'>Fotografia da Carteira Atual</h2>
                            <p className='text-xs text-gray-600'>Quantidade atual por status.</p>
                        </div>
                    </div>
                </div>
                {/* --- CARDS CLICÁVEIS PARA DRILL-DOWN --- */}
                <div className='grid grid-cols-2 gap-4 flex-1 content-start'>
                    <div onClick={() => handleDrillDown('analysis')} className='bg-yellow-50 p-4 rounded-lg border border-yellow-100 text-center cursor-pointer hover:shadow-md transition-all'><Clock className='mx-auto text-yellow-600 mb-2' size={20} /><p className='text-2xl font-bold text-yellow-800'>{metrics.geral.emAnalise}</p><p className='text-xs text-yellow-700 font-bold uppercase mt-1'>Sob Análise</p></div>
                    <div onClick={() => handleDrillDown('proposal')} className='bg-blue-50 p-4 rounded-lg border border-blue-100 text-center cursor-pointer hover:shadow-md transition-all'><Briefcase className='mx-auto text-blue-600 mb-2' size={20} /><p className='text-2xl font-bold text-blue-800'>{metrics.geral.propostasAtivas}</p><p className='text-xs text-blue-700 font-bold uppercase mt-1'>Propostas</p></div>
                    <div onClick={() => handleDrillDown('active')} className='bg-green-50 p-4 rounded-lg border border-green-100 text-center cursor-pointer hover:shadow-md transition-all'><CheckCircle2 className='mx-auto text-green-600 mb-2' size={20} /><p className='text-2xl font-bold text-green-800'>{metrics.geral.fechados}</p><p className='text-xs text-green-700 font-bold uppercase mt-1'>Fechados</p></div>
                    <div onClick={() => handleDrillDown('rejected')} className='bg-red-50 p-4 rounded-lg border border-red-100 text-center cursor-pointer hover:shadow-md transition-all'><XCircle className='mx-auto text-red-600 mb-2' size={20} /><p className='text-2xl font-bold text-red-800'>{metrics.geral.rejeitados}</p><p className='text-xs text-red-700 font-bold uppercase mt-1'>Rejeitados</p></div>
                    <div onClick={() => handleDrillDown('probono')} className='bg-purple-50 p-4 rounded-lg border border-purple-100 text-center cursor-pointer hover:shadow-md transition-all'><HeartHandshake className='mx-auto text-purple-600 mb-2' size={20} /><p className='text-2xl font-bold text-purple-800'>{metrics.geral.probono}</p><p className='text-xs text-purple-700 font-bold uppercase mt-1'>Probono</p></div>
                    <div onClick={() => handleDrillDown('all')} className='bg-gray-50 p-4 rounded-lg border border-gray-200 text-center cursor-pointer hover:shadow-md transition-all'><Layers className='mx-auto text-gray-600 mb-2' size={20} /><p className='text-2xl font-bold text-gray-800'>{metrics.geral.totalCasos}</p><p className='text-xs text-gray-700 font-bold uppercase mt-1'>Total Geral</p></div>
                </div>
            </div>

            {/* Direita: Fotografia Financeira Total */}
            <div className='lg:col-span-7 bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full flex flex-col'>
                <div className='border-b pb-4 mb-6'>
                    <h3 className='font-bold text-xl text-gray-800 flex items-center gap-2'><Camera className='text-[#0F2C4C]' size={24} /> Fotografia Financeira Total</h3>
                    <p className='text-xs text-gray-600 mt-1'>Visão consolidada de oportunidades e receita garantida.</p>
                </div>
                
                <div className='grid grid-cols-1 md:grid-cols-2 gap-8 flex-1'>
                    <div>
                        <p className='text-xs text-blue-600 font-bold uppercase mb-4'>Valores em Negociação (Ativo)</p>
                        <div className='space-y-4'>
                            <div>
                                <p className='text-xs text-gray-500 font-medium'>Pró-labore</p>
                                <div className='flex items-baseline gap-2'>
                                    <span className='text-3xl font-bold text-gray-700'>{formatMoney(metrics.geral.valorEmNegociacaoPL)}</span>
                                    <span className='text-xs font-medium text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full'>
                                        Média: {formatMoney(metrics.geral.mediaMensalNegociacaoPL)}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <p className='text-xs text-gray-500 font-medium'>Êxito</p>
                                <div className='flex items-baseline gap-2'>
                                    <span className='text-3xl font-bold text-gray-700'>{formatMoney(metrics.geral.valorEmNegociacaoExito)}</span>
                                    <span className='text-xs font-medium text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full'>
                                        Média: {formatMoney(metrics.geral.mediaMensalNegociacaoExito)}
                                    </span>
                                </div>
                            </div>
                            <div className='flex justify-between items-end border-t border-gray-200 pt-3 mt-2'>
                                <span className='text-sm font-bold text-gray-600 uppercase tracking-wider'>TOTAL GERAL</span>
                                <span className='text-xl font-bold text-[#0F2C4C]'>{formatMoney(totalNegociacao)}</span>
                            </div>
                        </div>
                    </div>
                    <div className='md:border-l md:pl-8 border-gray-100'>
                        <p className='text-xs text-green-600 font-bold uppercase mb-4'>Carteira Ativa (Receita)</p>
                        <div className='space-y-4'>
                            <div>
                                <p className='text-xs text-gray-500 font-medium'>Pró-labore (Fechado)</p>
                                <div className='flex items-baseline gap-2'>
                                    <span className='text-3xl font-bold text-green-700'>{formatMoney(metrics.geral.totalFechadoPL)}</span>
                                    <span className='text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full'>
                                        Média: {formatMoney(metrics.geral.mediaMensalCarteiraPL)}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <p className='text-xs text-gray-500 font-medium'>Êxito (Fechado)</p>
                                <div className='flex items-baseline gap-2'>
                                    <span className='text-3xl font-bold text-green-700'>{formatMoney(metrics.geral.totalFechadoExito)}</span>
                                    <span className='text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full'>
                                        Média: {formatMoney(metrics.geral.mediaMensalCarteiraExito)}
                                    </span>
                                </div>
                            </div>
                            <div className='flex justify-between items-end border-t border-gray-200 pt-3 mt-2'>
                                <span className='text-sm font-bold text-gray-600 uppercase tracking-wider'>TOTAL GERAL</span>
                                <span className='text-xl font-bold text-green-700'>{formatMoney(totalCarteira)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* 3. RESUMO DA SEMANA */}
        <div className='bg-blue-50/50 p-6 rounded-2xl border border-blue-100'>
            <div className='flex items-center gap-2 mb-4'><CalendarDays className='text-blue-700' size={24} /><h2 className='text-xl font-bold text-blue-900'>Resumo da Semana</h2></div>
            <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4'>
                <div className='bg-white p-5 rounded-xl shadow-sm border border-blue-200 flex flex-col justify-between'>
                    <div>
                        <div className='flex justify-between items-start'>
                            <p className='text-[10px] text-blue-800 font-bold uppercase tracking-wider'>Casos com Atividade</p>
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded flex items-center gap-1"><Layers size={8} /> Geral</span>
                        </div>
                        <p className='text-3xl font-bold text-blue-900 mt-2'>{metrics.semana.totalUnico}</p>
                    </div>
                    <div className='mt-2 pt-2 border-t border-blue-100'>
                        <p className='text-[10px] text-gray-500 leading-tight italic'>
                            Casos movimentados (que tiveram atividade), e não apenas novos cadastros.
                        </p>
                    </div>
                </div>
                
                <div className='bg-white p-5 rounded-xl shadow-sm border border-blue-100 flex flex-col justify-between'>
                    <div>
                        <div className='flex justify-between items-start'>
                            <p className='text-[10px] text-gray-600 font-bold uppercase tracking-wider'>Sob Análise</p>
                            <span className="text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded flex items-center gap-1"><ArrowUpRight size={8} /> Entrada</span>
                        </div>
                        <p className='text-3xl font-bold text-gray-800 mt-2'>{metrics.semana.novos}</p>
                    </div>
                </div>

                <div className='bg-white p-5 rounded-xl shadow-sm border border-blue-100'>
                    <div className='mb-3'>
                        <div className='flex justify-between items-start'>
                            <p className='text-[10px] text-blue-600 font-bold uppercase tracking-wider'>Propostas Enviadas</p>
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded flex items-center gap-1"><GitCommit size={8} /> Atualização</span>
                        </div>
                        <p className='text-3xl font-bold text-gray-800 mt-1'>{metrics.semana.propQtd}</p>
                    </div>
                    <div className='bg-blue-50/50 p-2 rounded-lg space-y-1'><FinItem label='PL + Fixos' value={(metrics.semana.propPL || 0) + (metrics.semana.propMensal || 0)} colorClass='text-blue-700' /><FinItem label='Êxito' value={metrics.semana.propExito} colorClass='text-blue-700' /></div>
                </div>

                <div className='bg-white p-5 rounded-xl shadow-sm border border-blue-100'>
                    <div className='mb-3'>
                        <div className='flex justify-between items-start'>
                            <p className='text-[10px] text-green-600 font-bold uppercase tracking-wider'>Contratos Fechados</p>
                            <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded flex items-center gap-1"><GitCommit size={8} /> Atualização</span>
                        </div>
                        <p className='text-3xl font-bold text-gray-800 mt-1'>{metrics.semana.fechQtd}</p>
                    </div>
                    <div className='bg-green-50/50 p-2 rounded-lg space-y-1'><FinItem label='PL + Fixos' value={(metrics.semana.fechPL || 0) + (metrics.semana.fechMensal || 0)} colorClass='text-green-700' /><FinItem label='Êxito' value={metrics.semana.fechExito} colorClass='text-green-700' /></div>
                </div>

                <div className='bg-white p-5 rounded-xl shadow-sm border border-red-100 flex flex-col justify-between'>
                    <div>
                        <div className='flex justify-between items-start'>
                            <p className='text-[10px] text-red-500 font-bold uppercase tracking-wider'>Rejeitados</p>
                            <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded flex items-center gap-1"><GitCommit size={8} /> Atualização</span>
                        </div>
                        <p className='text-3xl font-bold text-red-700 mt-2'>{metrics.semana.rejeitados}</p>
                    </div>
                </div>

                <div className='bg-white p-5 rounded-xl shadow-sm border border-purple-100 flex flex-col justify-between'>
                    <div>
                        <div className='flex justify-between items-start'>
                            <p className='text-[10px] text-purple-500 font-bold uppercase tracking-wider'>Probono</p>
                            <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded flex items-center gap-1"><GitCommit size={8} /> Atualização</span>
                        </div>
                        <p className='text-3xl font-bold text-purple-700 mt-2'>{metrics.semana.probono}</p>
                    </div>
                </div>
            </div>
            
            {/* Gráfico Semana + Insights */}
            <div className="mt-4 flex flex-col md:flex-row gap-4">
                 <div className="bg-white p-4 rounded-xl border border-blue-100 flex-1 h-64"> 
                    <p className="text-sm font-bold text-gray-600 uppercase mb-4 border-b border-gray-100 pb-2 flex justify-between">
                        <span>Comparativo Financeiro (Semana Atual vs Anterior)</span>
                        <span className="text-gray-500 font-normal normal-case">Valores totais</span>
                    </p>
                    <div className="grid grid-cols-2 gap-8 h-48">
                        {/* Propostas */}
                        <div className="flex flex-col justify-end relative border-r border-gray-100 pr-4">
                            <p className="text-xs font-bold text-blue-600 uppercase mb-2 text-center">Propostas</p>
                            <div className="flex items-end justify-center gap-3 h-full">
                                <div className="flex flex-col items-center justify-end h-full w-14 group">
                                    <span className="text-xs text-gray-500 mb-1 font-extrabold">{formatMoney(valPropSemanaAnt)}</span>
                                    <div className="w-full bg-gray-300 rounded-t transition-all" style={{ height: `${valPropSemanaAnt > 0 ? (valPropSemanaAnt / maxSemanaChart) * 60 : 2}%` }}></div>
                                    <span className="text-[10px] text-gray-500 mt-1 font-semibold">Anterior</span>
                                </div>
                                <div className="flex flex-col items-center justify-end h-full w-14 group relative">
                                    <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded mb-1 ${deltaPropSemana >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {deltaPropSemana > 0 ? '+' : ''}{deltaPropSemana.toFixed(0)}%
                                    </div>
                                    <span className={`text-xs mb-1 font-extrabold ${deltaPropSemana >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                                        {formatMoney(valPropSemana)}
                                    </span>
                                    <div className="w-full bg-blue-500 rounded-t transition-all" style={{ height: `${valPropSemana > 0 ? (valPropSemana / maxSemanaChart) * 60 : 2}%` }}></div>
                                    <span className="text-[10px] text-blue-600 font-semibold mt-1">Atual</span>
                                </div>
                            </div>
                        </div>

                        {/* Fechados */}
                        <div className="flex flex-col justify-end relative">
                            <p className="text-xs font-bold text-green-600 uppercase mb-2 text-center">Fechados</p>
                            <div className="flex items-end justify-center gap-3 h-full">
                                <div className="flex flex-col items-center justify-end h-full w-14 group">
                                    <span className="text-xs text-gray-500 mb-1 font-extrabold">{formatMoney(valFechSemanaAnt)}</span>
                                    <div className="w-full bg-gray-300 rounded-t transition-all" style={{ height: `${valFechSemanaAnt > 0 ? (valFechSemanaAnt / maxSemanaChart) * 60 : 2}%` }}></div>
                                    <span className="text-[10px] text-gray-500 mt-1 font-semibold">Anterior</span>
                                </div>
                                <div className="flex flex-col items-center justify-end h-full w-14 group relative">
                                    <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded mb-1 ${deltaFechSemana >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {deltaFechSemana > 0 ? '+' : ''}{deltaFechSemana.toFixed(0)}%
                                    </div>
                                    <span className={`text-xs mb-1 font-extrabold ${deltaFechSemana >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                        {formatMoney(valFechSemana)}
                                    </span>
                                    <div className="w-full bg-green-500 rounded-t transition-all" style={{ height: `${valFechSemana > 0 ? (valFechSemana / maxSemanaChart) * 60 : 2}%` }}></div>
                                    <span className="text-[10px] text-green-600 font-semibold mt-1">Atual</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Insight Box da Semana */}
                <div className="bg-blue-100/50 p-4 rounded-xl border border-blue-200 flex flex-col justify-center w-full md:w-64">
                    <div className="flex items-center gap-2 mb-2 text-blue-800 font-bold text-sm uppercase">
                        <Lightbulb size={16} /> Insight Semanal
                    </div>
                    <p className="text-xs text-blue-900 leading-relaxed">
                        {insightSemana}
                    </p>
                </div>
            </div>

        </div>

        {/* 4. RESUMO DO MÊS */}
        <div className='bg-blue-50/50 p-6 rounded-2xl border border-blue-100'>
            <div className='flex items-center gap-2 mb-4'><CalendarRange className='text-blue-700' size={24} /><h2 className='text-xl font-bold text-blue-900'>Resumo do Mês</h2></div>
            <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4'>
                <div className='bg-white p-5 rounded-xl shadow-sm border border-blue-200 flex flex-col justify-between'>
                    <div>
                        <div className='flex justify-between items-start'>
                            <p className='text-[10px] text-blue-800 font-bold uppercase tracking-wider'>Casos com Atividade</p>
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded flex items-center gap-1"><Layers size={8} /> Geral</span>
                        </div>
                        <p className='text-3xl font-bold text-blue-900 mt-2'>{metrics.mes.totalUnico}</p>
                    </div>
                      {/* Insight adicionado */}
                      <div className='mt-2 pt-2 border-t border-blue-100'>
                        <p className='text-[10px] text-gray-500 leading-tight italic'>
                            Casos movimentados (que tiveram atividade), e não apenas novos cadastros.
                        </p>
                    </div>
                </div>

                <div className='bg-white p-5 rounded-xl shadow-sm border border-blue-100 flex flex-col justify-between'>
                    <div>
                        <div className='flex justify-between items-start'>
                            <p className='text-[10px] text-gray-600 font-bold uppercase tracking-wider'>Sob Análise</p>
                            <span className="text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded flex items-center gap-1"><ArrowUpRight size={8} /> Entrada</span>
                        </div>
                        <p className='text-3xl font-bold text-gray-800 mt-2'>{metrics.mes.analysis}</p>
                    </div>
                </div>

                <div className='bg-white p-5 rounded-xl shadow-sm border border-blue-100'>
                    <div className='mb-3'>
                        <div className='flex justify-between items-start'>
                            <p className='text-[10px] text-blue-600 font-bold uppercase tracking-wider'>Propostas Enviadas</p>
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded flex items-center gap-1"><GitCommit size={8} /> Atualização</span>
                        </div>
                        <p className='text-3xl font-bold text-gray-800 mt-1'>{metrics.mes.propQtd}</p>
                    </div>
                    <div className='bg-blue-50/50 p-2 rounded-lg space-y-1'><FinItem label='PL + Fixos' value={(metrics.mes.propPL || 0) + (metrics.mes.propMensal || 0)} colorClass='text-blue-700' /><FinItem label='Êxito' value={metrics.mes.propExito} colorClass='text-blue-700' /></div>
                </div>

                <div className='bg-white p-5 rounded-xl shadow-sm border border-blue-100'>
                    <div className='mb-3'>
                        <div className='flex justify-between items-start'>
                            <p className='text-[10px] text-green-600 font-bold uppercase tracking-wider'>Contratos Fechados</p>
                            <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded flex items-center gap-1"><GitCommit size={8} /> Atualização</span>
                        </div>
                        <p className='text-3xl font-bold text-gray-800 mt-1'>{metrics.mes.fechQtd}</p>
                    </div>
                    <div className='bg-green-50/50 p-2 rounded-lg space-y-1'><FinItem label='PL + Fixos' value={(metrics.mes.fechPL || 0) + (metrics.mes.fechMensal || 0)} colorClass='text-green-700' /><FinItem label='Êxito' value={metrics.mes.fechExito} colorClass='text-green-700' /></div>
                </div>

                <div className='bg-white p-5 rounded-xl shadow-sm border border-red-100 flex flex-col justify-between'>
                    <div>
                        <div className='flex justify-between items-start'>
                            <p className='text-[10px] text-red-500 font-bold uppercase tracking-wider'>Rejeitados</p>
                            <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded flex items-center gap-1"><GitCommit size={8} /> Atualização</span>
                        </div>
                        <p className='text-3xl font-bold text-red-700 mt-2'>{metrics.mes.rejected}</p>
                    </div>
                </div>

                <div className='bg-white p-5 rounded-xl shadow-sm border border-purple-100 flex flex-col justify-between'>
                    <div>
                        <div className='flex justify-between items-start'>
                            <p className='text-[10px] text-purple-500 font-bold uppercase tracking-wider'>Probono</p>
                            <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded flex items-center gap-1"><GitCommit size={8} /> Atualização</span>
                        </div>
                        <p className='text-3xl font-bold text-purple-700 mt-2'>{metrics.mes.probono}</p>
                    </div>
                </div>
            </div>

            {/* Gráfico Mês + Insights */}
            <div className="mt-4 flex flex-col md:flex-row gap-4">
                <div className="bg-white p-4 rounded-xl border border-blue-100 flex-1 h-64">
                    <p className="text-xs font-bold text-gray-600 uppercase mb-4 border-b border-gray-100 pb-2 flex justify-between items-center">
                        <span>Comparativo Financeiro - <span className="text-gray-500 font-normal normal-case">Períodos comparados: {metrics.executivo.periodoAnteriorLabel} e {metrics.executivo.periodoAtualLabel}</span></span>
                        <span className="text-gray-500 font-normal normal-case">Valores totais</span>
                    </p>
                    <div className="grid grid-cols-2 gap-8 h-48">
                        {/* Propostas */}
                        <div className="flex flex-col justify-end relative border-r border-gray-100 pr-4">
                            <p className="text-[10px] font-bold text-blue-600 uppercase mb-2 text-center">Propostas</p>
                            <div className="flex items-end justify-center gap-3 h-full">
                                <div className="flex flex-col items-center justify-end h-full w-24 group">
                                    <span className="text-[9px] text-gray-500 mb-1 font-extrabold">{formatMoney(valPropMesAnt)}</span>
                                    <div className="w-full bg-gray-300 rounded-t transition-all" style={{ height: `${valPropMesAnt > 0 ? (valPropMesAnt / maxMesChart) * 60 : 2}%` }}></div>
                                    <span className="text-[9px] text-gray-500 mt-1 text-center leading-tight font-semibold">
                                        Anterior
                                    </span>
                                </div>
                                <div className="flex flex-col items-center justify-end h-full w-24 group relative">
                                    <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded mb-1 ${deltaPropMes >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {deltaPropMes > 0 ? '+' : ''}{deltaPropMes.toFixed(0)}%
                                    </div>
                                    <span className={`text-[9px] mb-1 font-extrabold ${deltaPropMes >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                                        {formatMoney(valPropMes)}
                                    </span>
                                    <div className="w-full bg-blue-500 rounded-t transition-all" style={{ height: `${valPropMes > 0 ? (valPropMes / maxMesChart) * 60 : 2}%` }}></div>
                                    <span className="text-[9px] text-blue-600 font-bold mt-1 text-center leading-tight font-semibold">
                                        Atual
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Fechados */}
                        <div className="flex flex-col justify-end relative">
                            <p className="text-[10px] font-bold text-green-600 uppercase mb-2 text-center">Fechados</p>
                            <div className="flex items-end justify-center gap-3 h-full">
                                <div className="flex flex-col items-center justify-end h-full w-24 group">
                                    <span className="text-[9px] text-gray-500 mb-1 font-extrabold">{formatMoney(valFechMesAnt)}</span>
                                    <div className="w-full bg-gray-300 rounded-t transition-all" style={{ height: `${valFechMesAnt > 0 ? (valFechMesAnt / maxMesChart) * 60 : 2}%` }}></div>
                                    <span className="text-[9px] text-gray-500 mt-1 text-center leading-tight font-semibold">
                                        Anterior
                                    </span>
                                </div>
                                <div className="flex flex-col items-center justify-end h-full w-24 group relative">
                                    <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded mb-1 ${deltaFechMes >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {deltaFechMes > 0 ? '+' : ''}{deltaFechMes.toFixed(0)}%
                                    </div>
                                    <span className={`text-[9px] mb-1 font-extrabold ${deltaFechMes >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                        {formatMoney(valFechMes)}
                                    </span>
                                    <div className="w-full bg-green-500 rounded-t transition-all" style={{ height: `${valFechMes > 0 ? (valFechMes / maxMesChart) * 60 : 2}%` }}></div>
                                    <span className="text-[9px] text-green-600 font-bold mt-1 text-center leading-tight font-semibold">
                                        Atual
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Insight Box do Mês */}
                <div className="bg-blue-100/50 p-4 rounded-xl border border-blue-200 flex flex-col justify-center w-full md:w-64">
                    <div className="flex items-center gap-2 mb-2 text-blue-800 font-bold text-sm uppercase">
                        <Lightbulb size={16} /> Insight Mensal
                    </div>
                    <p className="text-xs text-blue-900 leading-relaxed">
                        {insightMes}
                    </p>
                </div>
            </div>
        </div>

        {/* 5. ENTRADA DE CASOS (12 MESES) - AGORA FULL WIDTH */}
        <div className='bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between'>
            <div>
                <h3 className='font-bold text-gray-800 mb-1 flex items-center gap-2'><BarChart3 className='text-[#0F2C4C]' size={20} /> Entrada de Casos (12 Meses)</h3>
                <p className="text-xs text-gray-500 font-normal mb-4 ml-7">A partir de Junho de 2025</p>
                <div className='h-64 flex items-end justify-around gap-2 pb-6 border-b border-gray-100 relative'>
                    {evolucaoMensal.length === 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                            <EmptyState 
                                icon={BarChart3} 
                                title="Sem dados de evolução" 
                                description="Ainda não há histórico suficiente para gerar o gráfico de entrada."
                                className="min-h-[200px]" 
                            />
                        </div>
                    ) : (evolucaoMensal.map((item, index) => (<div key={index} className='flex flex-col items-center gap-2 w-full h-full justify-end group'><span className='text-xs font-bold text-blue-900 mb-1 opacity-100'>{item.qtd}</span><div className='relative w-full max-w-[40px] bg-blue-100 rounded-t-md hover:bg-blue-200 transition-all cursor-pointer' style={{ height: `${item.altura}%` }}></div><span className='text-xs text-gray-600 font-medium uppercase'>{item.mes}</span></div>)))}
                </div>
            </div>
            
            {/* ANÁLISE DE DADOS DA ENTRADA */}
            <div className="grid grid-cols-3 gap-6 pt-4">
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Volume Total (12m)</span>
                    <div className="flex items-end gap-2">
                        <span className="text-2xl font-bold text-gray-800">{totalEntrada12}</span>
                        <span className="text-xs text-gray-500 mb-1">casos</span>
                    </div>
                </div>
                <div className="flex flex-col border-l border-gray-100 pl-6">
                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Média Mensal</span>
                    <div className="flex items-end gap-2">
                        <span className="text-2xl font-bold text-blue-600">{mediaEntrada}</span>
                        <span className="text-xs text-gray-500 mb-1">/mês</span>
                    </div>
                </div>
                <div className="flex flex-col border-l border-gray-100 pl-6">
                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Tendência Recente</span>
                    <div className={`flex items-center gap-2 font-bold ${diffEntrada > 0 ? 'text-green-600' : diffEntrada < 0 ? 'text-red-500' : 'text-gray-600'}`}>
                        {diffEntrada > 0 ? <TrendingUp size={20} /> : diffEntrada < 0 ? <TrendingDown size={20} /> : <Minus size={20} />}
                        <span className="text-lg">{diffEntrada > 0 ? `+${diffEntrada}` : diffEntrada}</span>
                        <span className="text-[10px] font-normal text-gray-500 uppercase">vs mês anterior</span>
                    </div>
                </div>
            </div>
        </div>

        {/* 6. EVOLUÇÃO FINANCEIRA (12 MESES) */}
        <div className='bg-white p-6 rounded-xl shadow-sm border border-gray-100'>
            <div className='flex items-center justify-between mb-6 border-b pb-4'>
                <h3 className='font-bold text-gray-800 flex items-center gap-2'><BarChart4 className='text-[#0F2C4C]' size={20} /> Evolução Financeira (12 Meses)</h3>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* LADO ESQUERDO - PROPOSTAS */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col justify-between">
                    <div>
                        <div className='flex justify-between items-center mb-4'>
                            <p className="text-xs font-bold text-blue-600 uppercase">Evolução de Propostas (Valores)</p>
                            <div className='flex flex-col items-end'>
                                <span className='text-[9px] text-gray-500 font-bold uppercase'>Média PL / Êxito</span>
                                <span className='text-[10px] font-bold text-blue-800'>{formatMoney(mediasPropostas.pl)} / {formatMoney(mediasPropostas.exito)}</span>
                            </div>
                        </div>
                        <div className='h-60 flex items-end justify-around gap-2 mb-4 relative pb-4 border-b border-gray-200/50'>
                            {propostas12Meses.length === 0 ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                                  <EmptyState 
                                    icon={BarChart3} 
                                    title="Sem dados de propostas" 
                                    description="Ainda não há histórico suficiente para gerar o gráfico."
                                    className="min-h-[150px]"
                                  />
                               </div>
                            ) : (propostas12Meses.map((item, index) => {
                                const totalMes = item.pl + item.fixo + item.exito;
                                return (
                                <div key={index} className='flex flex-col items-center gap-1 w-full h-full justify-end group relative hover:z-50'>
                                    {totalMes > 0 && (<span className='text-[9px] font-bold text-gray-600 mb-1 whitespace-nowrap'>{formatCompact(totalMes)}</span>)}
                                    <div className='flex items-end gap-1 h-full w-full justify-center px-1 relative'>
                                    <div className='w-2 bg-blue-400 rounded-t hover:bg-blue-500 transition-all relative group hover:z-50' style={{ height: `${Math.max(item.hPl, 1)}%` }}></div>
                                    <div className='w-2 bg-indigo-400 rounded-t hover:bg-indigo-500 transition-all relative group hover:z-50' style={{ height: `${Math.max(item.hFixo, 1)}%` }}></div>
                                    <div className='w-2 bg-green-400 rounded-t hover:bg-green-500 transition-all relative group hover:z-50' style={{ height: `${Math.max(item.hExito, 1)}%` }}></div>
                                    </div>
                                    <span className='text-[8px] text-gray-600 font-medium uppercase mt-2'>{item.mes}</span>
                                </div>
                                );
                            }))}
                        </div>
                    </div>
                    {/* Analise Propostas */}
                    <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-200">
                        <div className="flex flex-col">
                            <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-1">Total (12m)</span>
                            <span className="text-xs font-extrabold text-gray-800">{formatMoney(statsPropostas.total)}</span>
                        </div>
                        <div className="flex flex-col border-l border-gray-200 pl-2">
                            <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-1">Média/mês</span>
                            <span className="text-xs font-extrabold text-blue-600">{formatMoney(statsPropostas.media)}</span>
                        </div>
                        <div className="flex flex-col border-l border-gray-200 pl-2">
                            <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-1">Tendência</span>
                             <div className={`flex items-center gap-1 font-bold ${statsPropostas.diff > 0 ? 'text-green-600' : statsPropostas.diff < 0 ? 'text-red-500' : 'text-gray-600'}`}>
                                {statsPropostas.diff > 0 ? <TrendingUp size={14} /> : statsPropostas.diff < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
                                <span className="text-xs font-extrabold">{formatMoney(statsPropostas.diff)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* LADO DIREITO - FECHADOS */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col justify-between">
                    <div>
                        <div className='flex justify-between items-center mb-4'>
                            <p className="text-xs font-bold text-green-600 uppercase">Evolução de Fechamentos (Valores)</p>
                             <div className='flex flex-col items-end'>
                                <span className='text-[9px] text-gray-500 font-bold uppercase'>Média PL / Êxito</span>
                                <span className='text-[10px] font-bold text-green-800'>{formatMoney(mediasFinanceiras.pl)} / {formatMoney(mediasFinanceiras.exito)}</span>
                            </div>
                        </div>
                        <div className='h-60 flex items-end justify-around gap-2 mb-4 relative pb-4 border-b border-gray-200/50'>
                            {financeiro12Meses.length === 0 ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                                  <EmptyState 
                                    icon={BarChart3} 
                                    title="Sem dados financeiros" 
                                    description="Ainda não há histórico suficiente para gerar o gráfico."
                                    className="min-h-[150px]"
                                  />
                               </div>
                            ) : (financeiro12Meses.map((item, index) => {
                                const totalMes = item.pl + item.fixo + item.exito;
                                return (
                                <div key={index} className='flex flex-col items-center gap-1 w-full h-full justify-end group relative hover:z-50'>
                                    {totalMes > 0 && (<span className='text-[9px] font-bold text-gray-600 mb-1 whitespace-nowrap'>{formatCompact(totalMes)}</span>)}
                                    <div className='flex items-end gap-1 h-full w-full justify-center px-1 relative'>
                                    <div className='w-2 bg-blue-400 rounded-t hover:bg-blue-500 transition-all relative group hover:z-50' style={{ height: `${Math.max(item.hPl, 1)}%` }}></div>
                                    <div className='w-2 bg-indigo-400 rounded-t hover:bg-indigo-500 transition-all relative group hover:z-50' style={{ height: `${Math.max(item.hFixo, 1)}%` }}></div>
                                    <div className='w-2 bg-green-400 rounded-t hover:bg-green-500 transition-all relative group hover:z-50' style={{ height: `${Math.max(item.hExito, 1)}%` }}></div>
                                    </div>
                                    <span className='text-[8px] text-gray-600 font-medium uppercase mt-2'>{item.mes}</span>
                                </div>
                                );
                            }))}
                        </div>
                    </div>
                      {/* Analise Fechamentos */}
                    <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-200">
                        <div className="flex flex-col">
                            <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-1">Total (12m)</span>
                            <span className="text-xs font-extrabold text-gray-800">{formatMoney(statsFinanceiro.total)}</span>
                        </div>
                        <div className="flex flex-col border-l border-gray-200 pl-2">
                            <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-1">Média/mês</span>
                            <span className="text-xs font-extrabold text-blue-600">{formatMoney(statsFinanceiro.media)}</span>
                        </div>
                        <div className="flex flex-col border-l border-gray-200 pl-2">
                            <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-1">Tendência</span>
                             <div className={`flex items-center gap-1 font-bold ${statsFinanceiro.diff > 0 ? 'text-green-600' : statsFinanceiro.diff < 0 ? 'text-red-500' : 'text-gray-600'}`}>
                                {statsFinanceiro.diff > 0 ? <TrendingUp size={14} /> : statsFinanceiro.diff < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
                                <span className="text-xs font-extrabold">{formatMoney(statsFinanceiro.diff)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className='flex justify-center gap-4 mt-6 text-xs text-gray-600'><div className='flex items-center'><span className='w-3 h-3 bg-blue-400 rounded-full mr-1'></span> Pró-labore</div><div className='flex items-center'><span className='w-3 h-3 bg-indigo-400 rounded-full mr-1'></span> Fixo Mensal</div><div className='flex items-center'><span className='w-3 h-3 bg-green-400 rounded-full mr-1'></span> Êxito</div></div>
        </div>

        {/* 7. CONTRATOS POR SÓCIO (BARRAS DETALHADAS) */}
        <div className='bg-white p-6 rounded-xl shadow-sm border border-gray-100'>
             <div className='flex items-center gap-2 mb-6 border-b pb-4'>
                 <Briefcase className='text-blue-600' size={24} />
                 <div>
                     <h2 className='text-xl font-bold text-gray-800'>Contratos por Sócio</h2>
                     <p className='text-xs text-gray-600'>Distribuição detalhada por status.</p>
                 </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> 
                 {contractsByPartner.length === 0 ? <p className="text-sm text-gray-500 col-span-3 text-center py-8">Nenhum dado de sócio disponível.</p> : contractsByPartner.map((item, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="flex justify-between items-center mb-3">
                            <span className="font-bold text-gray-800 text-sm truncate" title={item.name}>{item.name}</span>
                            <span className="text-[10px] font-bold text-gray-600 bg-white border border-gray-200 px-2 py-0.5 rounded-full">{item.total} Casos</span>
                        </div>
                        <div className="space-y-1.5">
                            {item.analysis > 0 && (
                                <div className="flex items-center text-[10px]">
                                    <span className="w-16 text-yellow-600 font-medium">Análise</span>
                                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full mx-2 overflow-hidden">
                                        <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${(item.analysis / item.total) * 100}%` }}></div>
                                    </div>
                                    <span className="w-8 text-right text-gray-600">{item.analysis}</span>
                                </div>
                            )}
                            {item.proposal > 0 && (
                                <div className="flex items-center text-[10px]">
                                    <span className="w-16 text-blue-600 font-medium">Proposta</span>
                                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full mx-2 overflow-hidden">
                                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(item.proposal / item.total) * 100}%` }}></div>
                                    </div>
                                    <span className="w-8 text-right text-gray-600">{item.proposal}</span>
                                </div>
                            )}
                            {item.active > 0 && (
                                <div className="flex items-center text-[10px]">
                                    <span className="w-16 text-green-600 font-medium">Fechado</span>
                                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full mx-2 overflow-hidden">
                                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${(item.active / item.total) * 100}%` }}></div>
                                    </div>
                                    <span className="w-8 text-right text-gray-600">{item.active}</span>
                                </div>
                            )}
                            {item.rejected > 0 && (
                                <div className="flex items-center text-[10px]">
                                    <span className="w-16 text-red-600 font-medium">Rejeitado</span>
                                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full mx-2 overflow-hidden">
                                        <div className="h-full bg-red-400 rounded-full" style={{ width: `${(item.rejected / item.total) * 100}%` }}></div>
                                    </div>
                                    <span className="w-8 text-right text-gray-600">{item.rejected}</span>
                                </div>
                            )}
                            {item.probono > 0 && (
                                <div className="flex items-center text-[10px]">
                                    <span className="w-16 text-purple-600 font-medium">Probono</span>
                                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full mx-2 overflow-hidden">
                                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(item.probono / item.total) * 100}%` }}></div>
                                    </div>
                                    <span className="w-8 text-right text-gray-600">{item.probono}</span>
                                </div>
                            )}
                        </div>
                    </div>
                 ))}
             </div>
        </div>

        {/* 8. VISÃO SÓCIOS (QUANTITATIVA | FINANCEIRA) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           {/* QUANTITATIVE */}
           <div className='bg-white p-6 rounded-2xl shadow-sm border border-gray-200'>
               <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-salomao-gold" /> Visão Quantitativa por Sócio</h3>
               <div className="overflow-x-auto">
                   <table className="w-full text-xs text-left">
                       <thead className="text-gray-500 font-bold border-b border-gray-100">
                           <tr>
                               <th className="py-2">Nome do Sócio</th>
                               <th className="py-2 text-center">Sob Análise</th>
                               <th className="py-2 text-center">Propostas</th>
                               <th className="py-2 text-center">Fechados</th>
                               <th className="py-2 text-center">Probono</th>
                               <th className="py-2 text-center">Rejeitados</th>
                           </tr>
                       </thead>
                       <tbody>
                           {contractsByPartner.map((item, idx) => (
                               <tr key={idx} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                                   <td className="py-3 font-medium text-gray-700">{item.name}</td>
                                   <td className="py-3 text-center text-yellow-600 font-bold">{item.analysis}</td>
                                   <td className="py-3 text-center text-blue-600 font-bold">{item.proposal}</td>
                                   <td className="py-3 text-center text-green-600 font-bold">{item.active}</td>
                                   <td className="py-3 text-center text-purple-600 font-bold">{item.probono}</td>
                                   <td className="py-3 text-center text-red-500 font-bold">{item.rejected}</td>
                               </tr>
                           ))}
                       </tbody>
                   </table>
               </div>
           </div>

           {/* VALUES */}
           <div className='bg-white p-6 rounded-2xl shadow-sm border border-gray-200'>
               <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Banknote className="w-5 h-5 text-salomao-gold" /> Visão Financeira por Sócio</h3>
                <div className="overflow-x-auto">
                   <table className="w-full text-xs text-left">
                       <thead className="text-gray-500 font-bold border-b border-gray-100">
                           <tr>
                               <th className="py-2">Nome do Sócio</th>
                               <th className="py-2 text-right">Total Pró-labore</th>
                               <th className="py-2 text-right">Total Êxitos</th>
                               <th className="py-2 text-right">Total Fixo</th>
                           </tr>
                       </thead>
                       <tbody>
                           {contractsByPartner.map((item: any, idx) => (
                               <tr key={idx} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                                   <td className="py-3 font-medium text-gray-700">{item.name}</td>
                                   <td className="py-3 text-right text-gray-700">{formatMoney(item.pl || 0)}</td>
                                   <td className="py-3 text-right text-gray-700">{formatMoney(item.exito || 0)}</td>
                                   <td className="py-3 text-right text-gray-700">{formatMoney(item.fixo || 0)}</td>
                               </tr>
                           ))}
                       </tbody>
                   </table>
               </div>
           </div>
        </div>

        {/* 9. ANÁLISE DE REJEIÇÕES */}
        <div className='bg-white p-6 rounded-xl shadow-sm border border-gray-100'>
            <div className='flex items-center gap-2 mb-6 border-b pb-4'>
                <Ban className='text-red-600' size={24} />
                <div>
                    <h2 className='text-xl font-bold text-gray-800'>Análise de Rejeições</h2>
                    <p className='text-xs text-gray-600'>Motivos e origens dos casos declinados.</p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Por Motivo */}
                <div>
                    <h4 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide border-l-4 border-red-400 pl-2">Por Motivo</h4>
                    <div className="space-y-4">
                        {rejectionData.reasons.length === 0 ? <p className="text-sm text-gray-500">Nenhum dado.</p> : rejectionData.reasons.map((item, idx) => (
                            <div key={idx} className="group">
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="font-medium text-gray-700">{item.label}</span>
                                    <span className="text-gray-600">{item.value} ({item.percent.toFixed(1)}%)</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2.5">
                                    <div className="bg-red-400 h-2.5 rounded-full group-hover:bg-red-500 transition-colors" style={{ width: `${item.percent}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                {/* Quem Rejeitou */}
                <div>
                    <h4 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide border-l-4 border-gray-400 pl-2">Quem Rejeitou</h4>
                    <div className="space-y-4">
                        {rejectionData.sources.length === 0 ? <p className="text-sm text-gray-500">Nenhum dado.</p> : rejectionData.sources.map((item, idx) => (
                            <div key={idx} className="group">
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="font-medium text-gray-700">{item.label}</span>
                                    <span className="text-gray-600">{item.value} ({item.percent.toFixed(1)}%)</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2.5">
                                    <div className="bg-gray-400 h-2.5 rounded-full group-hover:bg-gray-500 transition-colors" style={{ width: `${item.percent}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* 10. STATUS DE ASSINATURA */}
        <div className='bg-white p-6 rounded-xl shadow-sm border border-gray-100'>
            <div className='flex items-center gap-2 mb-6 border-b pb-4'>
                <FileSignature className='text-[#0F2C4C]' size={24} />
                <div>
                    <h2 className='text-xl font-bold text-gray-800'>Status de Assinatura de Contratos</h2>
                    <p className='text-xs text-gray-600'>Acompanhamento de assinaturas físicas dos contratos fechados.</p>
                </div>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-xl border-2 border-emerald-200'>
                    <div className='flex items-center justify-between mb-4'>
                        <div>
                            <p className='text-xs text-emerald-700 font-bold uppercase tracking-wider mb-2'>Contratos Assinados</p>
                            <p className='text-4xl font-black text-emerald-900'>{metrics.geral.assinados}</p>
                        </div>
                        <div className='p-3 bg-emerald-200 rounded-full'><CheckCircle2 size={24} className='text-emerald-700' /></div>
                    </div>
                    <div className='text-xs text-emerald-700 font-medium'>Contratos com assinatura física confirmada</div>
                </div>
                
                <div className='bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border-2 border-orange-200'>
                    <div className='flex items-center justify-between mb-4'>
                        <div>
                            <p className='text-xs text-orange-700 font-bold uppercase tracking-wider mb-2'>Pendentes de Assinatura</p>
                            <p className='text-4xl font-black text-orange-900'>{metrics.geral.naoAssinados}</p>
                        </div>
                        <div className='p-3 bg-orange-200 rounded-full'><AlertCircle size={24} className='text-orange-700' /></div>
                    </div>
                    <div className='text-xs text-orange-700 font-medium'>Contratos fechados aguardando assinatura física</div>
                </div>

                <div className='bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border-2 border-gray-200'>
                    <div className='flex items-center justify-between mb-4'>
                        <div>
                            <p className='text-xs text-gray-700 font-bold uppercase tracking-wider mb-2'>% Pendente</p>
                            <p className='text-4xl font-black text-gray-900'>{percentualSemAssinatura.toFixed(1)}%</p>
                        </div>
                        <div className='p-3 bg-gray-200 rounded-full'><Percent size={24} className='text-gray-700' /></div>
                    </div>
                    <div className='text-xs text-gray-700 font-medium'>Percentual de contratos sem assinatura</div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}