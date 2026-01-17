import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  CalendarDays,
  CalendarRange,
  ArrowRight,
  Filter,
  PieChart,
  BarChart3,
  Camera,
  FileSignature,
  AlertCircle,
  HeartHandshake,
  Loader2,
  BarChart4,
  Layers,
  FileText,
  XCircle,
  CheckCircle2,
  Briefcase,
  Clock,
  Mail,
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Minus,
  Ban
} from 'lucide-react';
import { Contract } from '../types';

// Função de parse robusta para garantir que o dashboard leia os números corretamente
const safeParseMoney = (value: string | number | undefined | null): number => {
  if (value === undefined || value === null || value === '') return 0;
  if (typeof value === 'number') return value;
  
  const strVal = String(value).trim();

  // Verifica se já está em formato numérico padrão (ex: "1500.00" vindo do DB)
  // Aceita números, ponto decimal, e sinal negativo, sem 'R$' ou vírgulas
  if (!strVal.includes('R$') && !strVal.includes(',') && !isNaN(Number(strVal))) {
    return parseFloat(strVal);
  }

  // Tratamento para formato BRL (ex: "R$ 1.500,00")
  const cleanStr = strVal.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
  const floatVal = parseFloat(cleanStr);
  return isNaN(floatVal) ? 0 : floatVal;
};

export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const [metrics, setMetrics] = useState({
    semana: {
      novos: 0,
      propQtd: 0, propPL: 0, propExito: 0, propMensal: 0,
      fechQtd: 0, fechPL: 0, fechExito: 0, fechMensal: 0,
      rejeitados: 0, probono: 0, totalUnico: 0,
    },
    mes: {
      novos: 0,
      propQtd: 0, propPL: 0, propExito: 0, propMensal: 0,
      fechQtd: 0, fechPL: 0, fechExito: 0, fechMensal: 0,
      totalUnico: 0, analysis: 0, rejected: 0, probono: 0
    },
    geral: {
      totalCasos: 0, emAnalise: 0, propostasAtivas: 0, fechados: 0, rejeitados: 0, probono: 0,
      valorEmNegociacaoPL: 0, valorEmNegociacaoExito: 0, receitaRecorrenteAtiva: 0,
      totalFechadoPL: 0, totalFechadoExito: 0, assinados: 0, naoAssinados: 0,
    },
  });

  const [funil, setFunil] = useState({
    totalEntrada: 0, qualificadosProposta: 0, fechados: 0,
    perdaAnalise: 0, perdaNegociacao: 0,
    taxaConversaoProposta: '0', taxaConversaoFechamento: '0',
  });

  const [evolucaoMensal, setEvolucaoMensal] = useState<any[]>([]);
  
  // Estado para o gráfico de FECHADOS
  const [financeiro12Meses, setFinanceiro12Meses] = useState<any[]>([]);
  const [statsFinanceiro, setStatsFinanceiro] = useState({ total: 0, media: 0, diff: 0 });

  // Estado para o novo gráfico de PROPOSTAS
  const [propostas12Meses, setPropostas12Meses] = useState<any[]>([]);
  const [statsPropostas, setStatsPropostas] = useState({ total: 0, media: 0, diff: 0 });
  
  const [mediasFinanceiras, setMediasFinanceiras] = useState({ pl: 0, exito: 0 });
  const [mediasPropostas, setMediasPropostas] = useState({ pl: 0, exito: 0 });
  
  // Novos estados para gráficos de rejeição
  const [rejectionData, setRejectionData] = useState<{
    reasons: { label: string, value: number, percent: number }[],
    sources: { label: string, value: number, percent: number }[]
  }>({ reasons: [], sources: [] });

  useEffect(() => {
    fetchDashboardData();

    // Adiciona listener para atualizações em tempo real
    const subscription = supabase
      .channel('dashboard_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contracts' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const { data: contratos, error } = await supabase.from('contracts').select('*');
      if (error) throw error;
      if (contratos) processarDados(contratos);
    } catch (error) {
      console.error('Erro dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const isDateInCurrentWeek = (dateString?: string) => {
    if (!dateString) return false;
    const date = new Date(dateString + 'T12:00:00');
    const today = new Date();
    const currentDay = today.getDay(); 
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDay);
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    return date >= startOfWeek && date <= endOfWeek;
  };

  const isDateInCurrentMonth = (dateString?: string) => {
    if (!dateString) return false;
    const date = new Date(dateString + 'T12:00:00');
    const today = new Date();
    return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  };

  const processarDados = (contratos: Contract[]) => {
    const hoje = new Date();
    // Definindo data fixa de início: Junho de 2025
    const dataInicioFixo = new Date(2025, 5, 1); // Mês 5 = Junho (0-indexed)
    
    let mSemana = {
      novos: 0, propQtd: 0, propPL: 0, propExito: 0, propMensal: 0,
      fechQtd: 0, fechPL: 0, fechExito: 0, fechMensal: 0,
      rejeitados: 0, probono: 0, totalUnico: 0
    };
    let mMes = {
      novos: 0, propQtd: 0, propPL: 0, propExito: 0, propMensal: 0,
      fechQtd: 0, fechPL: 0, fechExito: 0, fechMensal: 0,
      totalUnico: 0, analysis: 0, rejected: 0, probono: 0
    };
    let mGeral = {
      totalCasos: 0, emAnalise: 0, propostasAtivas: 0, fechados: 0, rejeitados: 0, probono: 0,
      valorEmNegociacaoPL: 0, valorEmNegociacaoExito: 0, receitaRecorrenteAtiva: 0,
      totalFechadoPL: 0, totalFechadoExito: 0, assinados: 0, naoAssinados: 0,
    };

    let fTotal = 0; let fQualificados = 0; let fFechados = 0;
    let fPerdaAnalise = 0; let fPerdaNegociacao = 0;

    const mapaMeses: Record<string, number> = {};
    const financeiroMap: Record<string, { pl: number, fixo: number, exito: number, data: Date }> = {};
    const propostasMap: Record<string, { pl: number, fixo: number, exito: number, data: Date }> = {};
    
    // Contadores para Rejeição
    const reasonCounts: Record<string, number> = {};
    const sourceCounts: Record<string, number> = {};
    let totalRejected = 0;

    // Gera as chaves dinamicamente a partir de Junho de 2025 até o mês ATUAL (hoje)
    let iteradorMeses = new Date(dataInicioFixo);
    while (iteradorMeses <= hoje) {
      const key = iteradorMeses.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      // Inicializa mapa de fechados
      financeiroMap[key] = { pl: 0, fixo: 0, exito: 0, data: new Date(iteradorMeses) };
      // Inicializa mapa de propostas
      propostasMap[key] = { pl: 0, fixo: 0, exito: 0, data: new Date(iteradorMeses) };
      
      // Avança um mês
      iteradorMeses.setMonth(iteradorMeses.getMonth() + 1);
    }
    const dataLimite12Meses = dataInicioFixo;

    contratos.forEach((c) => {
      const dataCriacao = new Date(c.created_at || new Date());
      
      // --- CORREÇÃO: SOMA DE VALORES COMPLETOS (INTERMEDIÁRIOS E OUTROS) ---
      let pl = safeParseMoney(c.pro_labore);
      let exito = safeParseMoney(c.final_success_fee);
      let mensal = safeParseMoney(c.fixed_monthly_fee);
      
      // Soma Outros Honorários ao PL (Fixo/Entrada)
      const outrosHonorarios = safeParseMoney((c as any).other_fees);
      pl += outrosHonorarios;

      // Soma Êxito Intermediário ao Êxito Total
      if (c.intermediate_fees && Array.isArray(c.intermediate_fees)) {
        const totalIntermediario = c.intermediate_fees.reduce((acc: number, val: any) => acc + safeParseMoney(val), 0);
        exito += totalIntermediario;
      }
      // ---------------------------------------------------------------------

      // Coleta dados de rejeição 
      if (c.status === 'rejected') {
          totalRejected++;
          const reason = (c as any).rejection_reason || 'Não informado';
          const source = (c as any).rejection_source || (c as any).rejected_by || 'Não informado';
          
          reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
          sourceCounts[source] = (sourceCounts[source] || 0) + 1;
      }

      // --- POPULA GRÁFICO DE CONTRATOS FECHADOS (Direita) ---
      if (c.status === 'active' && c.contract_date) {
        const dContrato = new Date(c.contract_date + 'T12:00:00');
        dContrato.setDate(1); dContrato.setHours(0,0,0,0);
        
        if (dContrato >= dataLimite12Meses) {
          const key = dContrato.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
          if (financeiroMap[key]) {
            financeiroMap[key].pl += pl;
            financeiroMap[key].fixo += mensal;
            financeiroMap[key].exito += exito;
            // Intermediários já foram somados na variável 'exito' acima
          }
        }
      }

      // --- POPULA GRÁFICO DE PROPOSTAS (Esquerda) ---
      if (c.proposal_date) {
        const dProposta = new Date(c.proposal_date + 'T12:00:00');
        dProposta.setDate(1); dProposta.setHours(0,0,0,0);

        if (dProposta >= dataLimite12Meses) {
             const key = dProposta.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
             if (propostasMap[key]) {
                 propostasMap[key].pl += pl;
                 propostasMap[key].fixo += mensal;
                 propostasMap[key].exito += exito;
             }
        }
      }

      mGeral.totalCasos++;
      if (c.status === 'analysis') mGeral.emAnalise++;
      if (c.status === 'rejected') mGeral.rejeitados++;
      if (c.status === 'probono') mGeral.probono++;
      
      if (c.status === 'proposal') {
        mGeral.propostasAtivas++;
        mGeral.valorEmNegociacaoPL += (pl + mensal); 
        mGeral.valorEmNegociacaoExito += exito;
      }
      
      if (c.status === 'active') {
        mGeral.fechados++;
        mGeral.receitaRecorrenteAtiva += mensal;
        mGeral.totalFechadoPL += pl;
        mGeral.totalFechadoExito += exito;
        c.physical_signature === true ? mGeral.assinados++ : mGeral.naoAssinados++;
      }

      if (c.status === 'analysis' && isDateInCurrentWeek(c.prospect_date)) mSemana.novos++;
      if (c.status === 'proposal' && isDateInCurrentWeek(c.proposal_date)) {
        mSemana.propQtd++; 
        mSemana.propPL += pl; 
        mSemana.propExito += exito; 
        mSemana.propMensal += mensal;
      }
      if (c.status === 'active' && isDateInCurrentWeek(c.contract_date)) {
        mSemana.fechQtd++; 
        mSemana.fechPL += pl; 
        mSemana.fechExito += exito; 
        mSemana.fechMensal += mensal;
      }
      if (c.status === 'rejected' && isDateInCurrentWeek(c.rejection_date)) mSemana.rejeitados++;
      if (c.status === 'probono' && isDateInCurrentWeek(c.probono_date || c.contract_date)) mSemana.probono++;

      if (c.status === 'analysis' && isDateInCurrentMonth(c.prospect_date)) mMes.analysis++;
      if (c.status === 'proposal' && isDateInCurrentMonth(c.proposal_date)) {
        mMes.propQtd++; 
        mMes.propPL += pl; 
        mMes.propExito += exito; 
        mMes.propMensal += mensal;
      }
      if (c.status === 'active' && isDateInCurrentMonth(c.contract_date)) {
        mMes.fechQtd++; 
        mMes.fechPL += pl; 
        mMes.fechExito += exito; 
        mMes.fechMensal += mensal;
      }
      if (c.status === 'rejected' && isDateInCurrentMonth(c.rejection_date)) mMes.rejected++;
      if (c.status === 'probono' && isDateInCurrentMonth(c.probono_date || c.contract_date)) mMes.probono++;

      const contractDates = [c.prospect_date, c.proposal_date, c.contract_date, c.rejection_date, c.probono_date];
      if (contractDates.some(date => isDateInCurrentWeek(date))) mSemana.totalUnico++;
      if (contractDates.some(date => isDateInCurrentMonth(date))) mMes.totalUnico++;

      fTotal++;
      const chegouEmProposta = c.status === 'proposal' || c.status === 'active' || (c.status === 'rejected' && c.proposal_date);
      if (chegouEmProposta) fQualificados++;
      if (c.status === 'active') fFechados++;
      else if (c.status === 'rejected') c.proposal_date ? fPerdaNegociacao++ : fPerdaAnalise++;

      const datasDisponiveis = [
        c.created_at ? new Date(c.created_at) : null,
        c.prospect_date ? new Date(c.prospect_date + 'T12:00:00') : null,
        c.proposal_date ? new Date(c.proposal_date + 'T12:00:00') : null,
        c.contract_date ? new Date(c.contract_date + 'T12:00:00') : null,
        c.rejection_date ? new Date(c.rejection_date + 'T12:00:00') : null,
        c.probono_date ? new Date(c.probono_date + 'T12:00:00') : null
      ].filter((d): d is Date => d !== null && !isNaN(d.getTime()));

      let dataMaisAntiga = dataCriacao;
      if (datasDisponiveis.length > 0) dataMaisAntiga = new Date(Math.min(...datasDisponiveis.map(d => d.getTime())));
      const mesAno = dataMaisAntiga.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      if (!mapaMeses[mesAno]) mapaMeses[mesAno] = 0;
      mapaMeses[mesAno]++;
    });

    // --- PROCESSAMENTO FINAL GRÁFICO FECHADOS (DIREITA) ---
    const finArray = Object.entries(financeiroMap).map(([mes, vals]) => ({ mes, ...vals })).sort((a, b) => a.data.getTime() - b.data.getTime());
    const totalPL12 = finArray.reduce((acc, curr) => acc + curr.pl + curr.fixo, 0); 
    const totalExito12 = finArray.reduce((acc, curr) => acc + curr.exito, 0);
    const monthsCount = finArray.length || 1;
    setMediasFinanceiras({ pl: totalPL12 / monthsCount, exito: totalExito12 / monthsCount });

    // Estatisticas para Analise (Fechados)
    const totalFechado12Meses = finArray.reduce((acc, curr) => acc + curr.pl + curr.fixo + curr.exito, 0);
    const mediaFechadoMes = finArray.length > 0 ? totalFechado12Meses / finArray.length : 0;
    const ultimoFechado = finArray.length > 0 ? finArray[finArray.length - 1].pl + finArray[finArray.length - 1].fixo + finArray[finArray.length - 1].exito : 0;
    const penultimoFechado = finArray.length > 1 ? finArray[finArray.length - 2].pl + finArray[finArray.length - 2].fixo + finArray[finArray.length - 2].exito : 0;
    const diffFechado = ultimoFechado - penultimoFechado;
    setStatsFinanceiro({ total: totalFechado12Meses, media: mediaFechadoMes, diff: diffFechado });

    const maxValFin = Math.max(...finArray.map(i => Math.max(i.pl, i.fixo, i.exito)), 1);
    setFinanceiro12Meses(finArray.map(i => ({ ...i, hPl: (i.pl / maxValFin) * 100, hFixo: (i.fixo / maxValFin) * 100, hExito: (i.exito / maxValFin) * 100 })));

    // --- PROCESSAMENTO FINAL GRÁFICO PROPOSTAS (ESQUERDA) ---
    const propArray = Object.entries(propostasMap).map(([mes, vals]) => ({ mes, ...vals })).sort((a, b) => a.data.getTime() - b.data.getTime());
    const totalPropPL12 = propArray.reduce((acc, curr) => acc + curr.pl + curr.fixo, 0);
    const totalPropExito12 = propArray.reduce((acc, curr) => acc + curr.exito, 0);
    const monthsCountProp = propArray.length || 1;
    setMediasPropostas({ pl: totalPropPL12 / monthsCountProp, exito: totalPropExito12 / monthsCountProp });

    // Estatisticas para Analise (Propostas)
    const totalPropostas12Meses = propArray.reduce((acc, curr) => acc + curr.pl + curr.fixo + curr.exito, 0);
    const mediaPropostasMes = propArray.length > 0 ? totalPropostas12Meses / propArray.length : 0;
    const ultimoProp = propArray.length > 0 ? propArray[propArray.length - 1].pl + propArray[propArray.length - 1].fixo + propArray[propArray.length - 1].exito : 0;
    const penultimoProp = propArray.length > 1 ? propArray[propArray.length - 2].pl + propArray[propArray.length - 2].fixo + propArray[propArray.length - 2].exito : 0;
    const diffProp = ultimoProp - penultimoProp;
    setStatsPropostas({ total: totalPropostas12Meses, media: mediaPropostasMes, diff: diffProp });

    const maxValProp = Math.max(...propArray.map(i => Math.max(i.pl, i.fixo, i.exito)), 1);
    setPropostas12Meses(propArray.map(i => ({ ...i, hPl: (i.pl / maxValProp) * 100, hFixo: (i.fixo / maxValProp) * 100, hExito: (i.exito / maxValProp) * 100 })));

    const txProp = fTotal > 0 ? ((fQualificados / fTotal) * 100).toFixed(1) : '0';
    const txFech = fQualificados > 0 ? ((fFechados / fQualificados) * 100).toFixed(1) : '0';
    setFunil({ totalEntrada: fTotal, qualificadosProposta: fQualificados, fechados: fFechados, perdaAnalise: fPerdaAnalise, perdaNegociacao: fPerdaNegociacao, taxaConversaoProposta: txProp, taxaConversaoFechamento: txFech });

    // --- ORDENAÇÃO DINÂMICA: JUNHO 2025 ATÉ O MÊS ATUAL ---
    const mesesGrafico = [];
    let iteradorGrafico = new Date(dataInicioFixo);
    
    // Loop até a data atual (inclusive o mês corrente)
    while (iteradorGrafico <= hoje) {
        const key = iteradorGrafico.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        mesesGrafico.push({
            mes: key,
            qtd: mapaMeses[key] || 0,
            altura: 0
        });
        iteradorGrafico.setMonth(iteradorGrafico.getMonth() + 1);
    }

    const maxQtd = Math.max(...mesesGrafico.map((m) => m.qtd), 1);
    mesesGrafico.forEach((m) => (m.altura = (m.qtd / maxQtd) * 100));
    
    setEvolucaoMensal(mesesGrafico);
    setMetrics({ semana: mSemana, mes: mMes, geral: mGeral });

    // --- FORMATAÇÃO DOS DADOS DE REJEIÇÃO ---
    const formatRejection = (counts: Record<string, number>) => {
        return Object.entries(counts)
            .map(([label, value]) => ({ 
                label, 
                value, 
                percent: totalRejected > 0 ? (value / totalRejected) * 100 : 0 
            }))
            .sort((a, b) => b.value - a.value); // Ordena do maior para o menor
    };

    setRejectionData({
        reasons: formatRejection(reasonCounts),
        sources: formatRejection(sourceCounts)
    });
  };

  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const FinItem = ({ label, value, colorClass = 'text-gray-700' }: any) => {
    if (!value || value === 0) return null;
    return <div className='flex justify-between items-end text-sm mt-1 border-b border-gray-100 pb-1 last:border-0 last:pb-0'><span className='text-gray-500 text-xs'>{label}</span><span className={`font-bold ${colorClass}`}>{formatMoney(value)}</span></div>;
  };

  const totalNegociacao = metrics.geral.valorEmNegociacaoPL + metrics.geral.valorEmNegociacaoExito;
  const totalCarteira = metrics.geral.totalFechadoPL + metrics.geral.totalFechadoExito + metrics.geral.receitaRecorrenteAtiva;

  // Calculos para Gráficos
  const totalPropSemana = metrics.semana.propPL + metrics.semana.propExito + metrics.semana.propMensal;
  const totalFechSemana = metrics.semana.fechPL + metrics.semana.fechExito + metrics.semana.fechMensal;
  const maxSemana = Math.max(totalPropSemana, totalFechSemana, 1);

  const totalPropMes = metrics.mes.propPL + metrics.mes.propExito + metrics.mes.propMensal;
  const totalFechMes = metrics.mes.fechPL + metrics.mes.fechExito + metrics.mes.fechMensal;
  const maxMes = Math.max(totalPropMes, totalFechMes, 1);

  // Cálculos para Análise de Entrada (Estatísticas para o card)
  const totalEntrada12 = evolucaoMensal.reduce((acc, curr) => acc + curr.qtd, 0);
  const mediaEntrada = evolucaoMensal.length > 0 ? (totalEntrada12 / evolucaoMensal.length).toFixed(1) : '0';
  const ultimoQtd = evolucaoMensal.length > 0 ? evolucaoMensal[evolucaoMensal.length - 1].qtd : 0;
  const penultimoQtd = evolucaoMensal.length > 1 ? evolucaoMensal[evolucaoMensal.length - 2].qtd : 0;
  const diffEntrada = ultimoQtd - penultimoQtd;

  if (loading) return <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 text-salomao-gold animate-spin" /></div>;

  return (
    <div className='w-full space-y-8 pb-10 animate-in fade-in duration-500 p-8'>
      
      {/* HEADER + BOTÃO EMAIL */}
      <div className="flex justify-between items-start mb-8">
        <div>
            <h1 className='text-3xl font-bold text-salomao-blue flex items-center gap-2'>
              <LayoutDashboard className="w-8 h-8" /> Controladoria Jurídica
            </h1>
            <p className='text-gray-500 mt-1'>Visão estratégica de contratos e resultados.</p>
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
        {/* FUNIL */}
         <div className='bg-white p-6 rounded-2xl shadow-sm border border-gray-200'>
            <div className='flex items-center gap-2 mb-6 border-b pb-4'><Filter className='text-blue-600' size={24} /><div><h2 className='text-xl font-bold text-gray-800'>Funil de Eficiência</h2><p className='text-xs text-gray-500'>Taxa de conversão.</p></div></div>
            <div className='grid grid-cols-1 md:grid-cols-5 gap-4 items-center'>
            <div className='md:col-span-1 bg-gray-50 p-4 rounded-xl border border-gray-200 text-center relative'><p className='text-xs font-bold text-gray-500 uppercase'>1. Prospects</p><p className='text-3xl font-bold text-gray-800 mt-2'>{funil.totalEntrada}</p><div className='hidden md:block absolute -right-6 top-1/2 -translate-y-1/2 z-10'><ArrowRight className='text-gray-300' /></div></div>
            <div className='md:col-span-1 flex flex-col items-center justify-center space-y-2'><div className='bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full'>{funil.taxaConversaoProposta}% Avançam</div><div className='text-xs text-red-400 flex items-center gap-1 bg-red-50 px-2 py-1 rounded border border-red-100 mt-2'><XCircle size={12} /> {funil.perdaAnalise} Rejeitados</div></div>
            <div className='md:col-span-1 bg-blue-50 p-4 rounded-xl border border-blue-100 text-center relative'><p className='text-xs font-bold text-blue-600 uppercase'>2. Propostas</p><p className='text-3xl font-bold text-blue-900 mt-2'>{funil.qualificadosProposta}</p><div className='hidden md:block absolute -right-6 top-1/2 -translate-y-1/2 z-10'><ArrowRight className='text-blue-200' /></div></div>
            <div className='md:col-span-1 flex flex-col items-center justify-center space-y-2'><div className='bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full'>{funil.taxaConversaoFechamento}% Fecham</div><div className='text-xs text-red-400 flex items-center gap-1 bg-red-50 px-2 py-1 rounded border border-red-100 mt-2'><XCircle size={12} /> {funil.perdaNegociacao} Rejeitados</div></div>
            <div className='md:col-span-1 bg-green-50 p-4 rounded-xl border border-green-100 text-center'><p className='text-xs font-bold text-green-600 uppercase'>3. Fechados</p><p className='text-3xl font-bold text-green-900 mt-2'>{funil.fechados}</p></div>
            </div>
        </div>

        {/* SEMANA */}
        <div className='bg-blue-50/50 p-6 rounded-2xl border border-blue-100'>
            <div className='flex items-center gap-2 mb-4'><CalendarDays className='text-blue-700' size={24} /><h2 className='text-xl font-bold text-blue-900'>Resumo da Semana</h2></div>
            <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4'>
                <div className='bg-white p-5 rounded-xl shadow-sm border border-blue-200 flex flex-col justify-between'><div><p className='text-[10px] text-blue-800 font-bold uppercase tracking-wider'>Total Casos da Semana</p><p className='text-3xl font-bold text-blue-900 mt-2'>{metrics.semana.totalUnico}</p></div><div className='mt-2 text-[10px] text-blue-400 flex items-center'><Layers className="w-3 h-3 mr-1" /> Casos Movimentados</div></div>
                <div className='bg-white p-5 rounded-xl shadow-sm border border-blue-100 flex flex-col justify-between'><div><p className='text-[10px] text-gray-500 font-bold uppercase tracking-wider'>Sob Análise</p><p className='text-3xl font-bold text-gray-800 mt-2'>{metrics.semana.novos}</p></div><div className='mt-2 text-[10px] text-gray-400 flex items-center'><FileText className="w-3 h-3 mr-1" />Novas Oportunidades</div></div>
                <div className='bg-white p-5 rounded-xl shadow-sm border border-blue-100'><div className='mb-3'><p className='text-[10px] text-blue-600 font-bold uppercase tracking-wider'>Propostas Enviadas</p><p className='text-3xl font-bold text-gray-800 mt-1'>{metrics.semana.propQtd}</p></div><div className='bg-blue-50/50 p-2 rounded-lg space-y-1'><FinItem label='PL + Fixos' value={metrics.semana.propPL + metrics.semana.propMensal} colorClass='text-blue-700' /><FinItem label='Êxito' value={metrics.semana.propExito} colorClass='text-blue-700' /></div></div>
                <div className='bg-white p-5 rounded-xl shadow-sm border border-blue-100'><div className='mb-3'><p className='text-[10px] text-green-600 font-bold uppercase tracking-wider'>Contratos Fechados</p><p className='text-3xl font-bold text-gray-800 mt-1'>{metrics.semana.fechQtd}</p></div><div className='bg-green-50/50 p-2 rounded-lg space-y-1'><FinItem label='PL + Fixos' value={metrics.semana.fechPL + metrics.semana.fechMensal} colorClass='text-green-700' /><FinItem label='Êxito' value={metrics.semana.fechExito} colorClass='text-green-700' /></div></div>
                <div className='bg-white p-5 rounded-xl shadow-sm border border-red-100 flex flex-col justify-between'><div><p className='text-[10px] text-red-500 font-bold uppercase tracking-wider'>Rejeitados</p><p className='text-3xl font-bold text-red-700 mt-2'>{metrics.semana.rejeitados}</p></div><div className='mt-2 text-[10px] text-red-300 flex items-center'><XCircle className="w-3 h-3 mr-1" /> Casos declinados</div></div>
                <div className='bg-white p-5 rounded-xl shadow-sm border border-purple-100 flex flex-col justify-between'><div><p className='text-[10px] text-purple-500 font-bold uppercase tracking-wider'>Probono</p><p className='text-3xl font-bold text-purple-700 mt-2'>{metrics.semana.probono}</p></div><div className='mt-2 text-[10px] text-purple-300 flex items-center'><HeartHandshake className="w-3 h-3 mr-1" /> Atuação social</div></div>
            </div>
            
            {/* Gráfico Semana */}
            <div className="mt-4 bg-white p-4 rounded-xl border border-blue-100">
                <p className="text-xs font-bold text-gray-500 uppercase mb-3 border-b border-gray-100 pb-2">Comparativo Financeiro (Semana)</p>
                <div className="flex items-end gap-4 h-24">
                    <div className="flex-1 flex flex-col justify-end items-center group">
                        {totalPropSemana > 0 && <span className="text-[10px] font-bold text-blue-600 mb-1">{formatMoney(totalPropSemana)}</span>}
                        <div className="w-full max-w-[60px] bg-blue-400 rounded-t hover:bg-blue-500 transition-all" style={{ height: `${totalPropSemana > 0 ? (totalPropSemana / maxSemana) * 100 : 2}%` }}></div>
                        <span className="text-[10px] text-gray-500 font-bold uppercase mt-1">Propostas</span>
                    </div>
                    <div className="flex-1 flex flex-col justify-end items-center group">
                        {totalFechSemana > 0 && <span className="text-[10px] font-bold text-green-600 mb-1">{formatMoney(totalFechSemana)}</span>}
                        <div className="w-full max-w-[60px] bg-green-400 rounded-t hover:bg-green-500 transition-all" style={{ height: `${totalFechSemana > 0 ? (totalFechSemana / maxSemana) * 100 : 2}%` }}></div>
                        <span className="text-[10px] text-gray-500 font-bold uppercase mt-1">Fechados</span>
                    </div>
                </div>
            </div>
        </div>

        {/* MÊS */}
        <div className='bg-blue-50/50 p-6 rounded-2xl border border-blue-100'>
            <div className='flex items-center gap-2 mb-4'><CalendarRange className='text-blue-700' size={24} /><h2 className='text-xl font-bold text-blue-900'>Resumo do Mês</h2></div>
            <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4'>
                <div className='bg-white p-5 rounded-xl shadow-sm border border-blue-200 flex flex-col justify-between'><div><p className='text-[10px] text-blue-800 font-bold uppercase tracking-wider'>Total Casos do Mês</p><p className='text-3xl font-bold text-blue-900 mt-2'>{metrics.mes.totalUnico}</p></div><div className='mt-2 text-[10px] text-blue-400 flex items-center'><Layers className="w-3 h-3 mr-1" /> Casos Movimentados</div></div>
                <div className='bg-white p-5 rounded-xl shadow-sm border border-blue-100 flex flex-col justify-between'><div><p className='text-[10px] text-gray-500 font-bold uppercase tracking-wider'>Sob Análise</p><p className='text-3xl font-bold text-gray-800 mt-2'>{metrics.mes.analysis}</p></div><div className='mt-2 text-[10px] text-gray-400 flex items-center'><FileText className="w-3 h-3 mr-1" />Novas Oportunidades</div></div>
                <div className='bg-white p-5 rounded-xl shadow-sm border border-blue-100'><div className='mb-3'><p className='text-[10px] text-blue-600 font-bold uppercase tracking-wider'>Propostas Enviadas</p><p className='text-3xl font-bold text-gray-800 mt-1'>{metrics.mes.propQtd}</p></div><div className='bg-blue-50/50 p-2 rounded-lg space-y-1'><FinItem label='PL + Fixos' value={metrics.mes.propPL + metrics.mes.propMensal} colorClass='text-blue-700' /><FinItem label='Êxito' value={metrics.mes.propExito} colorClass='text-blue-700' /></div></div>
                <div className='bg-white p-5 rounded-xl shadow-sm border border-blue-100'><div className='mb-3'><p className='text-[10px] text-green-600 font-bold uppercase tracking-wider'>Contratos Fechados</p><p className='text-3xl font-bold text-gray-800 mt-1'>{metrics.mes.fechQtd}</p></div><div className='bg-green-50/50 p-2 rounded-lg space-y-1'><FinItem label='PL + Fixos' value={metrics.mes.fechPL + metrics.mes.fechMensal} colorClass='text-green-700' /><FinItem label='Êxito' value={metrics.mes.fechExito} colorClass='text-green-700' /></div></div>
                <div className='bg-white p-5 rounded-xl shadow-sm border border-red-100 flex flex-col justify-between'><div><p className='text-[10px] text-red-500 font-bold uppercase tracking-wider'>Rejeitados</p><p className='text-3xl font-bold text-red-700 mt-2'>{metrics.mes.rejected}</p></div><div className='mt-2 text-[10px] text-red-300 flex items-center'><XCircle className="w-3 h-3 mr-1" /> Casos declinados</div></div>
                <div className='bg-white p-5 rounded-xl shadow-sm border border-purple-100 flex flex-col justify-between'><div><p className='text-[10px] text-purple-500 font-bold uppercase tracking-wider'>Probono</p><p className='text-3xl font-bold text-purple-700 mt-2'>{metrics.mes.probono}</p></div><div className='mt-2 text-[10px] text-purple-300 flex items-center'><HeartHandshake className="w-3 h-3 mr-1" /> Atuação social</div></div>
            </div>

            {/* Gráfico Mês */}
            <div className="mt-4 bg-white p-4 rounded-xl border border-blue-100">
                <p className="text-xs font-bold text-gray-500 uppercase mb-3 border-b border-gray-100 pb-2">Comparativo Financeiro (Mês)</p>
                <div className="flex items-end gap-4 h-24">
                    <div className="flex-1 flex flex-col justify-end items-center group">
                        {totalPropMes > 0 && <span className="text-[10px] font-bold text-blue-600 mb-1">{formatMoney(totalPropMes)}</span>}
                        <div className="w-full max-w-[60px] bg-blue-400 rounded-t hover:bg-blue-500 transition-all" style={{ height: `${totalPropMes > 0 ? (totalPropMes / maxMes) * 100 : 2}%` }}></div>
                        <span className="text-[10px] text-gray-500 font-bold uppercase mt-1">Propostas</span>
                    </div>
                    <div className="flex-1 flex flex-col justify-end items-center group">
                        {totalFechMes > 0 && <span className="text-[10px] font-bold text-green-600 mb-1">{formatMoney(totalFechMes)}</span>}
                        <div className="w-full max-w-[60px] bg-green-400 rounded-t hover:bg-green-500 transition-all" style={{ height: `${totalFechMes > 0 ? (totalFechMes / maxMes) * 100 : 2}%` }}></div>
                        <span className="text-[10px] text-gray-500 font-bold uppercase mt-1">Fechados</span>
                    </div>
                </div>
            </div>
        </div>

        {/* FINANCIAL PHOTOGRAPHY */}
        <div className='bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center space-y-6'>
            <h3 className='font-bold text-gray-700 border-b pb-2 flex items-center gap-2'><Camera className='text-[#0F2C4C]' size={20} /> Fotografia Financeira Total</h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
            <div><p className='text-xs text-gray-500 font-medium uppercase mb-2'>Valores em Negociação (Ativo)</p><div className='space-y-2'><FinItem label='Pró-labore Total' value={metrics.geral.valorEmNegociacaoPL} /><FinItem label='Êxito Total' value={metrics.geral.valorEmNegociacaoExito} /><div className='flex justify-between items-end border-t border-gray-200 pt-2 mt-2'><span className='text-sm font-bold text-gray-700'>TOTAL GERAL</span><span className='text-xl font-bold text-[#0F2C4C]'>{formatMoney(totalNegociacao)}</span></div></div></div>
            <div className='md:border-l md:pl-8 border-gray-100'><p className='text-xs text-gray-500 font-medium uppercase mb-2'>Carteira Ativa (Receita)</p><div className='space-y-2'><FinItem label='Pró-labore Total (Fechado)' value={metrics.geral.totalFechadoPL} colorClass='text-green-700' /><FinItem label='Êxito Total (Fechado)' value={metrics.geral.totalFechadoExito} colorClass='text-green-700' /><FinItem label='Média Mensal do Total' value={metrics.geral.receitaRecorrenteAtiva} colorClass='text-green-700' /><div className='flex justify-between items-end border-t border-gray-200 pt-2 mt-2'><span className='text-sm font-bold text-gray-700'>TOTAL GERAL</span><span className='text-xl font-bold text-green-700'>{formatMoney(totalCarteira)}</span></div></div></div>
            </div>
        </div>

        {/* EVOLUÇÃO FINANCEIRA (AGORA DIVIDIDO EM DOIS) */}
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
                                <span className='text-[9px] text-gray-400 font-bold uppercase'>Média PL / Êxito</span>
                                <span className='text-[10px] font-bold text-blue-800'>{formatMoney(mediasPropostas.pl)} / {formatMoney(mediasPropostas.exito)}</span>
                            </div>
                        </div>
                        <div className='h-52 flex items-end justify-around gap-2 mb-4'>
                            {propostas12Meses.length === 0 ? (<p className='w-full text-center text-gray-400 self-center'>Sem dados de propostas</p>) : (propostas12Meses.map((item, index) => {
                                const totalMes = item.pl + item.fixo + item.exito;
                                return (
                                <div key={index} className='flex flex-col items-center gap-1 w-full h-full justify-end group'>
                                    {totalMes > 0 && (<span className='text-[8px] font-bold text-gray-600 mb-1 tracking-tighter whitespace-nowrap'>{formatMoney(totalMes)}</span>)}
                                    <div className='flex items-end gap-1 h-full w-full justify-center px-1 relative'>
                                    <div className='w-2 bg-blue-400 rounded-t hover:bg-blue-500 transition-all relative group' style={{ height: `${Math.max(item.hPl, 1)}%` }}><span className='absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-black text-white text-[10px] p-1 rounded z-50 whitespace-nowrap'>{formatMoney(item.pl)}</span></div>
                                    <div className='w-2 bg-indigo-400 rounded-t hover:bg-indigo-500 transition-all relative group' style={{ height: `${Math.max(item.hFixo, 1)}%` }}><span className='absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-black text-white text-[10px] p-1 rounded z-50 whitespace-nowrap'>{formatMoney(item.fixo)}</span></div>
                                    <div className='w-2 bg-green-400 rounded-t hover:bg-green-500 transition-all relative group' style={{ height: `${Math.max(item.hExito, 1)}%` }}><span className='absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-black text-white text-[10px] p-1 rounded z-50 whitespace-nowrap'>{formatMoney(item.exito)}</span></div>
                                    </div>
                                    <span className='text-[8px] text-gray-500 font-medium uppercase mt-2'>{item.mes}</span>
                                </div>
                                );
                            }))}
                        </div>
                    </div>
                    {/* Analise Propostas */}
                    <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-200">
                        <div className="flex flex-col">
                            <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-1">Total (12m)</span>
                            <span className="text-sm font-bold text-gray-800">{formatMoney(statsPropostas.total)}</span>
                        </div>
                        <div className="flex flex-col border-l border-gray-200 pl-2">
                            <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-1">Média/mês</span>
                            <span className="text-sm font-bold text-blue-600">{formatMoney(statsPropostas.media)}</span>
                        </div>
                        <div className="flex flex-col border-l border-gray-200 pl-2">
                            <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-1">Tendência</span>
                             <div className={`flex items-center gap-1 font-bold ${statsPropostas.diff > 0 ? 'text-green-600' : statsPropostas.diff < 0 ? 'text-red-500' : 'text-gray-600'}`}>
                                {statsPropostas.diff > 0 ? <TrendingUp size={14} /> : statsPropostas.diff < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
                                <span className="text-xs">{formatMoney(statsPropostas.diff)}</span>
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
                                <span className='text-[9px] text-gray-400 font-bold uppercase'>Média PL / Êxito</span>
                                <span className='text-[10px] font-bold text-green-800'>{formatMoney(mediasFinanceiras.pl)} / {formatMoney(mediasFinanceiras.exito)}</span>
                            </div>
                        </div>
                        <div className='h-52 flex items-end justify-around gap-2 mb-4'>
                            {financeiro12Meses.length === 0 ? (<p className='w-full text-center text-gray-400 self-center'>Sem dados financeiros</p>) : (financeiro12Meses.map((item, index) => {
                                const totalMes = item.pl + item.fixo + item.exito;
                                return (
                                <div key={index} className='flex flex-col items-center gap-1 w-full h-full justify-end group'>
                                    {totalMes > 0 && (<span className='text-[8px] font-bold text-gray-600 mb-1 tracking-tighter whitespace-nowrap'>{formatMoney(totalMes)}</span>)}
                                    <div className='flex items-end gap-1 h-full w-full justify-center px-1 relative'>
                                    <div className='w-2 bg-blue-400 rounded-t hover:bg-blue-500 transition-all relative group' style={{ height: `${Math.max(item.hPl, 1)}%` }}><span className='absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-black text-white text-[10px] p-1 rounded z-50 whitespace-nowrap'>{formatMoney(item.pl)}</span></div>
                                    <div className='w-2 bg-indigo-400 rounded-t hover:bg-indigo-500 transition-all relative group' style={{ height: `${Math.max(item.hFixo, 1)}%` }}><span className='absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-black text-white text-[10px] p-1 rounded z-50 whitespace-nowrap'>{formatMoney(item.fixo)}</span></div>
                                    <div className='w-2 bg-green-400 rounded-t hover:bg-green-500 transition-all relative group' style={{ height: `${Math.max(item.hExito, 1)}%` }}><span className='absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-black text-white text-[10px] p-1 rounded z-50 whitespace-nowrap'>{formatMoney(item.exito)}</span></div>
                                    </div>
                                    <span className='text-[8px] text-gray-500 font-medium uppercase mt-2'>{item.mes}</span>
                                </div>
                                );
                            }))}
                        </div>
                    </div>
                     {/* Analise Fechamentos */}
                    <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-200">
                        <div className="flex flex-col">
                            <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-1">Total (12m)</span>
                            <span className="text-sm font-bold text-gray-800">{formatMoney(statsFinanceiro.total)}</span>
                        </div>
                        <div className="flex flex-col border-l border-gray-200 pl-2">
                            <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-1">Média/mês</span>
                            <span className="text-sm font-bold text-blue-600">{formatMoney(statsFinanceiro.media)}</span>
                        </div>
                        <div className="flex flex-col border-l border-gray-200 pl-2">
                            <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-1">Tendência</span>
                             <div className={`flex items-center gap-1 font-bold ${statsFinanceiro.diff > 0 ? 'text-green-600' : statsFinanceiro.diff < 0 ? 'text-red-500' : 'text-gray-600'}`}>
                                {statsFinanceiro.diff > 0 ? <TrendingUp size={14} /> : statsFinanceiro.diff < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
                                <span className="text-xs">{formatMoney(statsFinanceiro.diff)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className='flex justify-center gap-4 mt-6 text-xs'><div className='flex items-center'><span className='w-3 h-3 bg-blue-400 rounded-full mr-1'></span> Pró-labore</div><div className='flex items-center'><span className='w-3 h-3 bg-indigo-400 rounded-full mr-1'></span> Fixo Mensal</div><div className='flex items-center'><span className='w-3 h-3 bg-green-400 rounded-full mr-1'></span> Êxito</div></div>
        </div>

        {/* DISTRIBUTION & ENTRY */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
            <div className='bg-white p-6 rounded-xl shadow-sm border border-gray-100'>
            <div className='flex items-center justify-between mb-6 border-b pb-4'><div className='flex items-center gap-2'><Camera className='text-[#0F2C4C]' size={24} /><div><h2 className='text-xl font-bold text-gray-800'>Fotografia da Carteira Atual</h2><p className='text-xs text-gray-500'>Quantidade atual por status.</p></div></div>
            </div>
            <div className='grid grid-cols-2 gap-4'>
                <div className='bg-yellow-50 p-4 rounded-lg border border-yellow-100 text-center'><Clock className='mx-auto text-yellow-600 mb-2' size={20} /><p className='text-2xl font-bold text-yellow-800'>{metrics.geral.emAnalise}</p><p className='text-xs text-yellow-700 font-bold uppercase mt-1'>Sob Análise</p></div>
                <div className='bg-blue-50 p-4 rounded-lg border border-blue-100 text-center'><Briefcase className='mx-auto text-blue-600 mb-2' size={20} /><p className='text-2xl font-bold text-blue-800'>{metrics.geral.propostasAtivas}</p><p className='text-xs text-blue-700 font-bold uppercase mt-1'>Propostas</p></div>
                <div className='bg-green-50 p-4 rounded-lg border border-green-100 text-center'><CheckCircle2 className='mx-auto text-green-600 mb-2' size={20} /><p className='text-2xl font-bold text-green-800'>{metrics.geral.fechados}</p><p className='text-xs text-green-700 font-bold uppercase mt-1'>Fechados</p></div>
                <div className='bg-red-50 p-4 rounded-lg border border-red-100 text-center'><XCircle className='mx-auto text-red-600 mb-2' size={20} /><p className='text-2xl font-bold text-red-800'>{metrics.geral.rejeitados}</p><p className='text-xs text-red-700 font-bold uppercase mt-1'>Rejeitados</p></div>
                <div className='bg-purple-50 p-4 rounded-lg border border-purple-100 text-center'><HeartHandshake className='mx-auto text-purple-600 mb-2' size={20} /><p className='text-2xl font-bold text-purple-800'>{metrics.geral.probono}</p><p className='text-xs text-purple-700 font-bold uppercase mt-1'>Probono</p></div>
                <div className='bg-gray-50 p-4 rounded-lg border border-gray-200 text-center'><Layers className='mx-auto text-gray-600 mb-2' size={20} /><p className='text-2xl font-bold text-gray-800'>{metrics.geral.totalCasos}</p><p className='text-xs text-gray-700 font-bold uppercase mt-1'>Total Geral</p></div>
            </div>
            </div>
            <div className='lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between'>
                <div>
                    <h3 className='font-bold text-gray-800 mb-1 flex items-center gap-2'><BarChart3 className='text-[#0F2C4C]' size={20} /> Entrada de Casos (12 Meses)</h3>
                    <p className="text-xs text-gray-400 font-normal mb-4 ml-7">A partir de Junho de 2025</p>
                    <div className='h-64 flex items-end justify-around gap-2 pb-6 border-b border-gray-100'>
                        {evolucaoMensal.length === 0 ? (<p className='w-full text-center text-gray-400 self-center'>Sem dados</p>) : (evolucaoMensal.map((item, index) => (<div key={index} className='flex flex-col items-center gap-2 w-full h-full justify-end group'><span className='text-xs font-bold text-blue-900 mb-1 opacity-100'>{item.qtd}</span><div className='relative w-full max-w-[40px] bg-blue-100 rounded-t-md hover:bg-blue-200 transition-all cursor-pointer' style={{ height: `${item.altura}%` }}></div><span className='text-xs text-gray-500 font-medium uppercase'>{item.mes}</span></div>)))}
                    </div>
                </div>
                
                {/* ANÁLISE DE DADOS DA ENTRADA */}
                <div className="grid grid-cols-3 gap-6 pt-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Volume Total (12m)</span>
                        <div className="flex items-end gap-2">
                            <span className="text-2xl font-bold text-gray-800">{totalEntrada12}</span>
                            <span className="text-xs text-gray-400 mb-1">casos</span>
                        </div>
                    </div>
                    <div className="flex flex-col border-l border-gray-100 pl-6">
                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Média Mensal</span>
                        <div className="flex items-end gap-2">
                            <span className="text-2xl font-bold text-blue-600">{mediaEntrada}</span>
                            <span className="text-xs text-gray-400 mb-1">/mês</span>
                        </div>
                    </div>
                    <div className="flex flex-col border-l border-gray-100 pl-6">
                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Tendência Recente</span>
                        <div className={`flex items-center gap-2 font-bold ${diffEntrada > 0 ? 'text-green-600' : diffEntrada < 0 ? 'text-red-500' : 'text-gray-600'}`}>
                            {diffEntrada > 0 ? <TrendingUp size={20} /> : diffEntrada < 0 ? <TrendingDown size={20} /> : <Minus size={20} />}
                            <span className="text-lg">{diffEntrada > 0 ? `+${diffEntrada}` : diffEntrada}</span>
                            <span className="text-[10px] font-normal text-gray-400 uppercase">vs mês anterior</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* ANALISE DE REJEIÇÕES - NOVO BLOCO */}
        <div className='bg-white p-6 rounded-xl shadow-sm border border-gray-100'>
            <div className='flex items-center gap-2 mb-6 border-b pb-4'>
                <Ban className='text-red-600' size={24} />
                <div>
                    <h2 className='text-xl font-bold text-gray-800'>Análise de Rejeições</h2>
                    <p className='text-xs text-gray-500'>Motivos e origens dos casos declinados.</p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Por Motivo */}
                <div>
                    <h4 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide border-l-4 border-red-400 pl-2">Por Motivo</h4>
                    <div className="space-y-4">
                        {rejectionData.reasons.length === 0 ? <p className="text-sm text-gray-400">Nenhum dado.</p> : rejectionData.reasons.map((item, idx) => (
                            <div key={idx} className="group">
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="font-medium text-gray-700">{item.label}</span>
                                    <span className="text-gray-500">{item.value} ({item.percent.toFixed(1)}%)</span>
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
                        {rejectionData.sources.length === 0 ? <p className="text-sm text-gray-400">Nenhum dado.</p> : rejectionData.sources.map((item, idx) => (
                            <div key={idx} className="group">
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="font-medium text-gray-700">{item.label}</span>
                                    <span className="text-gray-500">{item.value} ({item.percent.toFixed(1)}%)</span>
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

        {/* SIGNATURES */}
        <div className='bg-white p-6 rounded-xl shadow-sm border border-gray-100'><div className='flex items-center gap-2 mb-6 border-b pb-4'><FileSignature className='text-[#0F2C4C]' size={24} /><div><h2 className='text-xl font-bold text-gray-800'>Status de Assinatura de Contratos</h2><p className='text-xs text-gray-500'>Acompanhamento de assinaturas físicas dos contratos fechados.</p></div></div><div className='grid grid-cols-1 md:grid-cols-2 gap-6'><div className='bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-xl border-2 border-emerald-200'><div className='flex items-center justify-between mb-4'><div><p className='text-xs text-emerald-700 font-bold uppercase tracking-wider mb-2'>Contratos Assinados</p><p className='text-5xl font-black text-emerald-900'>{metrics.geral.assinados}</p></div><div className='p-4 bg-emerald-200 rounded-full'><CheckCircle2 size={32} className='text-emerald-700' /></div></div><div className='text-xs text-emerald-700 font-medium'>Contratos com assinatura física confirmada</div></div><div className='bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border-2 border-orange-200'><div className='flex items-center justify-between mb-4'><div><p className='text-xs text-orange-700 font-bold uppercase tracking-wider mb-2'>Pendentes de Assinatura</p><p className='text-5xl font-black text-orange-900'>{metrics.geral.naoAssinados}</p></div><div className='p-4 bg-orange-200 rounded-full'><AlertCircle size={32} className='text-orange-700' /></div></div><div className='text-xs text-orange-700 font-medium'>Contratos fechados aguardando assinatura física</div></div></div></div>
      </div>
    </div>
  );
}