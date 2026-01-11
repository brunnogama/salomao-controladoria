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
  Download
} from 'lucide-react';
import { Contract } from '../types';

// Função de parse robusta para garantir que o dashboard leia os números corretamente
const safeParseMoney = (value: string | number | undefined | null): number => {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  const cleanStr = value.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
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
      totalCasos: 0, emAnalise: 0, propostasAtivas: 0, fechados: 0, rejeitados: 0,
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
  const [financeiro12Meses, setFinanceiro12Meses] = useState<any[]>([]);
  const [mediasFinanceiras, setMediasFinanceiras] = useState({ pl: 0, exito: 0 });

  useEffect(() => {
    fetchDashboardData();
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
        // 1. Captura a tela
        const canvas = await html2canvas(dashboardRef.current, {
            scale: 2, // Melhor qualidade
            useCORS: true, // Permitir imagens externas se houver
            backgroundColor: '#F8FAFC', // Cor de fundo do app
            ignoreElements: (element) => element.id === 'export-button-container' // Ignora o botão no print
        });

        const imgData = canvas.toDataURL('image/png');
        const dateStr = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');

        // 2. Baixar PNG
        const linkPng = document.createElement('a');
        linkPng.href = imgData;
        linkPng.download = `Relatorio_Dashboard_${dateStr}.png`;
        linkPng.click();

        // 3. Gerar e Baixar PDF
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Relatorio_Dashboard_${dateStr}.pdf`);

        // 4. Abrir Cliente de E-mail
        const subject = encodeURIComponent(`Relatório de Controladoria - ${dateStr}`);
        const body = encodeURIComponent(`Olá sócios,\n\nSegue em anexo o relatório atualizado do Dashboard (versões PDF e Imagem) que acabaram de ser baixados para o seu dispositivo.\n\nAtenciosamente,\nSalomão Controladoria.`);
        
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
    
    let mSemana = {
      novos: 0, propQtd: 0, propPL: 0, propExito: 0, propMensal: 0,
      fechQtd: 0, fechPL: 0, fechExito: 0, fechMensal: 0,
      rejeitados: 0, probono: 0, totalUnico: 0
    };
    let mMes = {
      novos: 0, propQtd: 0, propPL: 0, propExito: 0, propMensal: 0,
      fechQtd: 0, fechPL: 0, fechExito: 0, fechMensal: 0, totalUnico: 0,
      analysis: 0, rejected: 0, probono: 0
    };
    let mGeral = {
      totalCasos: 0, emAnalise: 0, propostasAtivas: 0, fechados: 0, rejeitados: 0,
      valorEmNegociacaoPL: 0, valorEmNegociacaoExito: 0, receitaRecorrenteAtiva: 0,
      totalFechadoPL: 0, totalFechadoExito: 0, assinados: 0, naoAssinados: 0,
    };

    let fTotal = 0; let fQualificados = 0; let fFechados = 0;
    let fPerdaAnalise = 0; let fPerdaNegociacao = 0;

    const mapaMeses: Record<string, number> = {};
    const financeiroMap: Record<string, { pl: number, fixo: number, exito: number, data: Date }> = {};
    
    for (let i = 0; i < 12; i++) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const key = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      financeiroMap[key] = { pl: 0, fixo: 0, exito: 0, data: d };
    }
    const dataLimite12Meses = new Date(hoje.getFullYear(), hoje.getMonth() - 11, 1);

    contratos.forEach((c) => {
      const dataCriacao = new Date(c.created_at || new Date());
      const pl = safeParseMoney(c.pro_labore);
      const exito = safeParseMoney(c.final_success_fee);
      const mensal = safeParseMoney(c.fixed_monthly_fee);

      if (c.status === 'active' && c.contract_date) {
        const dContrato = new Date(c.contract_date + 'T12:00:00');
        dContrato.setDate(1); dContrato.setHours(0,0,0,0);
        
        if (dContrato >= dataLimite12Meses) {
          const key = dContrato.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
          if (financeiroMap[key]) {
            financeiroMap[key].pl += pl;
            financeiroMap[key].fixo += mensal;
            financeiroMap[key].exito += exito;
            
            if (c.intermediate_fees && Array.isArray(c.intermediate_fees)) {
              c.intermediate_fees.forEach(f => {
                financeiroMap[key].exito += safeParseMoney(f);
              });
            }
          }
        }
      }

      mGeral.totalCasos++;
      if (c.status === 'analysis') mGeral.emAnalise++;
      if (c.status === 'rejected') mGeral.rejeitados++;
      
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

    const finArray = Object.entries(financeiroMap).map(([mes, vals]) => ({ mes, ...vals })).sort((a, b) => a.data.getTime() - b.data.getTime());
    const totalPL12 = finArray.reduce((acc, curr) => acc + curr.pl + curr.fixo, 0); 
    const totalExito12 = finArray.reduce((acc, curr) => acc + curr.exito, 0);
    setMediasFinanceiras({ pl: totalPL12 / 12, exito: totalExito12 / 12 });

    const maxValFin = Math.max(...finArray.map(i => Math.max(i.pl, i.fixo, i.exito)), 1);
    setFinanceiro12Meses(finArray.map(i => ({ ...i, hPl: (i.pl / maxValFin) * 100, hFixo: (i.fixo / maxValFin) * 100, hExito: (i.exito / maxValFin) * 100 })));

    const txProp = fTotal > 0 ? ((fQualificados / fTotal) * 100).toFixed(1) : '0';
    const txFech = fQualificados > 0 ? ((fFechados / fQualificados) * 100).toFixed(1) : '0';
    setFunil({ totalEntrada: fTotal, qualificadosProposta: fQualificados, fechados: fFechados, perdaAnalise: fPerdaAnalise, perdaNegociacao: fPerdaNegociacao, taxaConversaoProposta: txProp, taxaConversaoFechamento: txFech });

    const mesesGrafico = Object.keys(mapaMeses).map((key) => ({ mes: key, qtd: mapaMeses[key], altura: 0 }));
    const maxQtd = Math.max(...mesesGrafico.map((m) => m.qtd), 1);
    mesesGrafico.forEach((m) => (m.altura = (m.qtd / maxQtd) * 100));
    setEvolucaoMensal(mesesGrafico.reverse().slice(0, 12).reverse());
    
    setMetrics({ semana: mSemana, mes: mMes, geral: mGeral });
  };

  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const FinItem = ({ label, value, colorClass = 'text-gray-700' }: any) => {
    if (!value || value === 0) return null;
    return <div className='flex justify-between items-end text-sm mt-1 border-b border-gray-100 pb-1 last:border-0 last:pb-0'><span className='text-gray-500 text-xs'>{label}</span><span className={`font-bold ${colorClass}`}>{formatMoney(value)}</span></div>;
  };

  const totalNegociacao = metrics.geral.valorEmNegociacaoPL + metrics.geral.valorEmNegociacaoExito;
  const totalCarteira = metrics.geral.totalFechadoPL + metrics.geral.totalFechadoExito + metrics.geral.receitaRecorrenteAtiva;

  if (loading) return <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 text-salomao-gold animate-spin" /></div>;

  return (
    <div className='w-full space-y-8 pb-10 animate-in fade-in duration-500 p-8'>
      
      {/* HEADER + BOTÃO EMAIL */}
      <div className="flex justify-between items-start">
        <div>
            <h1 className='text-3xl font-bold text-[#0F2C4C]'>Controladoria Jurídica</h1>
            <p className='text-gray-500'>Visão estratégica de contratos e resultados.</p>
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

      <div ref={dashboardRef} className="space-y-8 bg-[#F8FAFC] p-2"> {/* Wrapper para o Print */}
        
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
            <div className='bg-white p-5 rounded-xl shadow-sm border border-blue-100 flex flex-col justify-between'><div><p className='text-[10px] text-gray-500 font-bold uppercase tracking-wider'>Sob Análise</p><p className='text-3xl font-bold text-gray-800 mt-2'>{metrics.semana.novos}</p></div><div className='mt-2 text-[10px] text-gray-400'>Novas Oportunidades</div></div>
            <div className='bg-white p-5 rounded-xl shadow-sm border border-blue-100'><div className='mb-3'><p className='text-[10px] text-blue-600 font-bold uppercase tracking-wider'>Propostas Enviadas</p><p className='text-3xl font-bold text-gray-800 mt-1'>{metrics.semana.propQtd}</p></div><div className='bg-blue-50/50 p-2 rounded-lg space-y-1'><FinItem label='PL + Fixos' value={metrics.semana.propPL + metrics.semana.propMensal} colorClass='text-blue-700' /><FinItem label='Êxito' value={metrics.semana.propExito} colorClass='text-blue-700' /></div></div>
            <div className='bg-white p-5 rounded-xl shadow-sm border border-blue-100'><div className='mb-3'><p className='text-[10px] text-green-600 font-bold uppercase tracking-wider'>Contratos Fechados</p><p className='text-3xl font-bold text-gray-800 mt-1'>{metrics.semana.fechQtd}</p></div><div className='bg-green-50/50 p-2 rounded-lg space-y-1'><FinItem label='PL + Fixos' value={metrics.semana.fechPL + metrics.semana.fechMensal} colorClass='text-green-700' /><FinItem label='Êxito' value={metrics.semana.fechExito} colorClass='text-green-700' /></div></div>
            <div className='bg-white p-5 rounded-xl shadow-sm border border-red-100 flex flex-col justify-between'><div><p className='text-[10px] text-red-500 font-bold uppercase tracking-wider'>Rejeitados</p><p className='text-3xl font-bold text-red-700 mt-2'>{metrics.semana.rejeitados}</p></div><div className='mt-2 text-[10px] text-red-300 flex items-center'><XCircle className="w-3 h-3 mr-1" /> Casos declinados</div></div>
            <div className='bg-white p-5 rounded-xl shadow-sm border border-purple-100 flex flex-col justify-between'><div><p className='text-[10px] text-purple-500 font-bold uppercase tracking-wider'>Probono</p><p className='text-3xl font-bold text-purple-700 mt-2'>{metrics.semana.probono}</p></div><div className='mt-2 text-[10px] text-purple-300 flex items-center'><HeartHandshake className="w-3 h-3 mr-1" /> Atuação social</div></div>
            </div>
        </div>

        {/* MÊS */}
        <div className