import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  CalendarDays,
  ArrowRight,
  TrendingUp,
  Briefcase,
  CheckCircle2,
  Clock,
  XCircle,
  Filter,
  ArrowDown,
  PieChart,
  BarChart3,
  Camera,
  FileSignature,
  AlertCircle,
  Activity,
  HeartHandshake,
  Loader2,
  BarChart4
} from 'lucide-react';
import { Contract } from '../types';
import { parseCurrency } from '../utils/masks';

export function Dashboard() {
  const [loading, setLoading] = useState(true);

  // Estado Unificado das Métricas
  const [metrics, setMetrics] = useState({
    semana: {
      novos: 0,
      propQtd: 0,
      propPL: 0,
      propExito: 0,
      fechQtd: 0,
      fechPL: 0,
      fechExito: 0,
      fechMensal: 0,
      rejeitados: 0,
      probono: 0,
    },
    mes: {
      novos: 0,
      propQtd: 0,
      propPL: 0,
      propExito: 0,
      fechQtd: 0,
      fechPL: 0,
      fechExito: 0,
      fechMensal: 0,
    },
    geral: {
      totalCasos: 0,
      emAnalise: 0,
      propostasAtivas: 0,
      fechados: 0,
      rejeitados: 0,
      valorEmNegociacaoPL: 0,
      valorEmNegociacaoExito: 0,
      receitaRecorrenteAtiva: 0,
      totalFechadoPL: 0,
      totalFechadoExito: 0,
      assinados: 0,
      naoAssinados: 0,
    },
  });

  // Estado do Funil
  const [funil, setFunil] = useState({
    totalEntrada: 0,
    qualificadosProposta: 0,
    fechados: 0,
    perdaAnalise: 0,
    perdaNegociacao: 0,
    taxaConversaoProposta: '0',
    taxaConversaoFechamento: '0',
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

      if (contratos) {
        processarDados(contratos);
      }
    } catch (error) {
      console.error('Erro dashboard:', error);
    } finally {
      setLoading(false);
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

  const processarDados = (contratos: Contract[]) => {
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

    let mSemana = {
      novos: 0, propQtd: 0, propPL: 0, propExito: 0,
      fechQtd: 0, fechPL: 0, fechExito: 0, fechMensal: 0,
      rejeitados: 0, probono: 0
    };
    let mMes = {
      novos: 0, propQtd: 0, propPL: 0, propExito: 0,
      fechQtd: 0, fechPL: 0, fechExito: 0, fechMensal: 0,
    };
    let mGeral = {
      totalCasos: 0, emAnalise: 0, propostasAtivas: 0, fechados: 0, rejeitados: 0,
      valorEmNegociacaoPL: 0, valorEmNegociacaoExito: 0, receitaRecorrenteAtiva: 0,
      totalFechadoPL: 0, totalFechadoExito: 0, assinados: 0, naoAssinados: 0,
    };

    let fTotal = 0;
    let fQualificados = 0;
    let fFechados = 0;
    let fPerdaAnalise = 0;
    let fPerdaNegociacao = 0;

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
      const dataProp = c.proposal_date ? new Date(c.proposal_date + 'T12:00:00') : dataCriacao;
      const dataFechamento = c.contract_date ? new Date(c.contract_date + 'T12:00:00') : dataCriacao;
      
      const pl = parseCurrency(c.pro_labore);
      const exito = parseCurrency(c.final_success_fee);
      const mensal = parseCurrency(c.fixed_monthly_fee);

      if (c.status === 'active' && c.contract_date) {
        const dContrato = new Date(c.contract_date + 'T12:00:00');
        dContrato.setDate(1); 
        dContrato.setHours(0,0,0,0);

        if (dContrato >= dataLimite12Meses) {
          const key = dContrato.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
          if (financeiroMap[key]) {
            financeiroMap[key].pl += pl;
            financeiroMap[key].fixo += mensal;
            financeiroMap[key].exito += exito;
            
            if (c.intermediate_fees && Array.isArray(c.intermediate_fees)) {
              c.intermediate_fees.forEach(f => {
                financeiroMap[key].exito += parseCurrency(f);
              });
            }
          }
        }
      }

      fTotal++;
      const chegouEmProposta = c.status === 'proposal' || c.status === 'active' || (c.status === 'rejected' && c.proposal_date);
      if (chegouEmProposta) fQualificados++;
      if (c.status === 'active') {
        fFechados++;
      } else if (c.status === 'rejected') {
        c.proposal_date ? fPerdaNegociacao++ : fPerdaAnalise++;
      }

      mGeral.totalCasos++;
      if (c.status === 'analysis') mGeral.emAnalise++;
      if (c.status === 'rejected') mGeral.rejeitados++;
      if (c.status === 'proposal') {
        mGeral.propostasAtivas++;
        mGeral.valorEmNegociacaoPL += pl;
        mGeral.valorEmNegociacaoExito += exito;
      }
      if (c.status === 'active') {
        mGeral.fechados++;
        mGeral.receitaRecorrenteAtiva += mensal;
        mGeral.totalFechadoPL += pl;
        mGeral.totalFechadoExito += exito;
        if (c.physical_signature === true) mGeral.assinados++; else mGeral.naoAssinados++;
      }

      if (c.status === 'analysis' && isDateInCurrentWeek(c.prospect_date)) mSemana.novos++;
      if (c.status === 'proposal' && isDateInCurrentWeek(c.proposal_date)) {
        mSemana.propQtd++; mSemana.propPL += pl; mSemana.propExito += exito;
      }
      if (c.status === 'active' && isDateInCurrentWeek(c.contract_date)) {
        mSemana.fechQtd++; mSemana.fechPL += pl; mSemana.fechExito += exito; mSemana.fechMensal += mensal;
      }
      if (c.status === 'rejected' && isDateInCurrentWeek(c.rejection_date)) mSemana.rejeitados++;
      if (c.status === 'probono' && isDateInCurrentWeek(c.probono_date || c.contract_date)) mSemana.probono++;

      if (dataCriacao >= inicioMes) mMes.novos++;
      if (c.status === 'proposal' && dataProp >= inicioMes) {
        mMes.propQtd++; mMes.propPL += pl; mMes.propExito += exito;
      }
      if (c.status === 'active' && dataFechamento >= inicioMes) {
        mMes.fechQtd++; mMes.fechPL += pl; mMes.fechExito += exito; mMes.fechMensal += mensal;
      }

      const datasDisponiveis = [
        c.created_at ? new Date(c.created_at) : null,
        c.prospect_date ? new Date(c.prospect_date + 'T12:00:00') : null,
        c.proposal_date ? new Date(c.proposal_date + 'T12:00:00') : null,
        c.contract_date ? new Date(c.contract_date + 'T12:00:00') : null,
        c.rejection_date ? new Date(c.rejection_date + 'T12:00:00') : null,
        c.probono_date ? new Date(c.probono_date + 'T12:00:00') : null
      ].filter((d): d is Date => d !== null && !isNaN(d.getTime()));

      let dataMaisAntiga = dataCriacao;
      if (datasDisponiveis.length > 0) {
        dataMaisAntiga = new Date(Math.min(...datasDisponiveis.map(d => d.getTime())));
      }
      const mesAno = dataMaisAntiga.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      if (!mapaMeses[mesAno]) mapaMeses[mesAno] = 0;
      mapaMeses[mesAno]++;
    });

    const finArray = Object.entries(financeiroMap)
      .map(([mes, vals]) => ({ mes, ...vals }))
      .sort((a, b) => a.data.getTime() - b.data.getTime());

    const totalPL12 = finArray.reduce((acc, curr) => acc + curr.pl + curr.fixo, 0); 
    const totalExito12 = finArray.reduce((acc, curr) => acc + curr.exito, 0);

    setMediasFinanceiras({
      pl: totalPL12 / 12,
      exito: totalExito12 / 12
    });

    const maxValFin = Math.max(...finArray.map(i => Math.max(i.pl, i.fixo, i.exito)), 1);
    const graficoFin = finArray.map(i => ({
      ...i,
      hPl: (i.pl / maxValFin) * 100,
      hFixo: (i.fixo / maxValFin) * 100,
      hExito: (i.exito / maxValFin) * 100
    }));
    setFinanceiro12Meses(graficoFin);

    const txProp = fTotal > 0 ? ((fQualificados / fTotal) * 100).toFixed(1) : '0';
    const txFech = fQualificados > 0 ? ((fFechados / fQualificados) * 100).toFixed(1) : '0';

    setFunil({
      totalEntrada: fTotal,
      qualificadosProposta: fQualificados,
      fechados: fFechados,
      perdaAnalise: fPerdaAnalise,
      perdaNegociacao: fPerdaNegociacao,
      taxaConversaoProposta: txProp,
      taxaConversaoFechamento: txFech,
    });

    const mesesGrafico = Object.keys(mapaMeses).map((key) => ({
      mes: key,
      qtd: mapaMeses[key],
      altura: 0,
    }));
    const maxQtd = Math.max(...mesesGrafico.map((m) => m.qtd), 1);
    mesesGrafico.forEach((m) => (m.altura = (m.qtd / maxQtd) * 100));

    setMetrics({ semana: mSemana, mes: mMes, geral: mGeral });
    setEvolucaoMensal(mesesGrafico.reverse().slice(0, 12).reverse());
  };

  const formatMoney = (val: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);

  const FinItem = ({ label, value, colorClass = 'text-gray-700' }: any) => {
    if (!value || value === 0) return null;
    return (
      <div className='flex justify-between items-end text-sm mt-1 border-b border-gray-100 pb-1 last:border-0 last:pb-0'>
        <span className='text-gray-500 text-xs'>{label}</span>
        <span className={`font-bold ${colorClass}`}>{formatMoney(value)}</span>
      </div>
    );
  };

  const totalNegociacao = metrics.geral.valorEmNegociacaoPL + metrics.geral.valorEmNegociacaoExito;
  const totalCarteira = metrics.geral.totalFechadoPL + metrics.geral.totalFechadoExito + metrics.geral.receitaRecorrenteAtiva;

  if (loading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 text-salomao-gold animate-spin" /></div>;
  }

  return (
    <div className='w-full space-y-8 pb-10 animate-in fade-in duration-500 p-8'>
      
      <div>
        <h1 className='text-3xl font-bold text-[#0F2C4C]'>
          Controladoria Jurídica
        </h1>
        <p className='text-gray-500'>
          Visão estratégica de contratos e resultados.
        </p>
      </div>

      <div className='bg-white p-6 rounded-2xl shadow-sm border border-gray-200'>
        <div className='flex items-center gap-2 mb-6 border-b pb-4'>
          <Filter className='text-blue-600' size={24} />
          <div>
            <h2 className='text-xl font-bold text-gray-800'>Funil de Eficiência</h2>
            <p className='text-xs text-gray-500'>Taxa de conversão de Prospects até Contratos Fechados.</p>
          </div>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-5 gap-4 items-center'>
          <div className='md:col-span-1 bg-gray-50 p-4 rounded-xl border border-gray-200 text-center relative'>
            <p className='text-xs font-bold text-gray-500 uppercase'>1. Prospects (Entrada)</p>
            <p className='text-3xl font-bold text-gray-800 mt-2'>{funil.totalEntrada}</p>
            <span className='text-xs text-gray-400'>Total Analisado</span>
            <div className='hidden md:block absolute -right-6 top-1/2 -translate-y-1/2 z-10'><ArrowRight className='text-gray-300' /></div>
          </div>
          <div className='md:col-span-1 flex flex-col items-center justify-center space-y-2'>
            <div className='bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full'>{funil.taxaConversaoProposta}% Avançam</div>
            <ArrowDown className='text-gray-300 md:hidden' />
            <div className='text-xs text-red-400 flex items-center gap-1 bg-red-50 px-2 py-1 rounded border border-red-100 mt-2'><XCircle size={12} /> {funil.perdaAnalise} Rejeitados na Análise</div>
          </div>
          <div className='md:col-span-1 bg-blue-50 p-4 rounded-xl border border-blue-100 text-center relative'>
            <p className='text-xs font-bold text-blue-600 uppercase'>2. Propostas Apresentadas</p>
            <p className='text-3xl font-bold text-blue-900 mt-2'>{funil.qualificadosProposta}</p>
            <span className='text-xs text-blue-400'>Oportunidades Reais</span>
            <div className='hidden md:block absolute -right-6 top-1/2 -translate-y-1/2 z-10'><ArrowRight className='text-blue-200' /></div>
          </div>
          <div className='md:col-span-1 flex flex-col items-center justify-center space-y-2'>
            <div className='bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full'>{funil.taxaConversaoFechamento}% Fecham</div>
            <ArrowDown className='text-gray-300 md:hidden' />
            <div className='text-xs text-red-400 flex items-center gap-1 bg-red-50 px-2 py-1 rounded border border-red-100 mt-2'><XCircle size={12} /> {funil.perdaNegociacao} Rejeitados na Proposta</div>
          </div>
          <div className='md:col-span-1 bg-green-50 p-4 rounded-xl border border-green-100 text-center'>
            <p className='text-xs font-bold text-green-600 uppercase'>3. Contratos Fechados</p>
            <p className='text-3xl font-bold text-green-900 mt-2'>{funil.fechados}</p>
            <span className='text-xs text-green-500'>Sucesso</span>
          </div>
        </div>
      </div>

      <div className='bg-blue-50/50 p-6 rounded-2xl border border-blue-100'>
        <div className='flex items-center gap-2 mb-4'>
          <CalendarDays className='text-blue-700' size={24} />
          <h2 className='text-xl font-bold text-blue-900'>Resumo da Semana</h2>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
          <div className='bg-white p-5 rounded-xl shadow-sm border border-blue-100 flex flex-col justify-between'>
            <div><p className='text-[10px] text-gray-500 font-bold uppercase tracking-wider'>Entrada de Casos</p><p className='text-3xl font-bold text-gray-800 mt-2'>{metrics.semana.novos}</p></div>
            <div className='mt-2 text-[10px] text-gray-400'>Novas Oportunidades Jurídicas</div>
          </div>
          <div className='bg-white p-5 rounded-xl shadow-sm border border-blue-100'>
            <div className='mb-3'><p className='text-[10px] text-blue-600 font-bold uppercase tracking-wider'>Propostas Enviadas</p><div className='flex items-baseline gap-2'><p className='text-3xl font-bold text-gray-800 mt-1'>{metrics.semana.propQtd}</p></div></div>
            <div className='bg-blue-50/50 p-2 rounded-lg space-y-1'><FinItem label='Pró-labore' value={metrics.semana.propPL} colorClass='text-blue-700' /><FinItem label='Êxito' value={metrics.semana.propExito} colorClass='text-blue-700' /></div>
          </div>
          <div className='bg-white p-5 rounded-xl shadow-sm border border-blue-100'>
            <div className='mb-3'><p className='text-[10px] text-green-600 font-bold uppercase tracking-wider'>Contratos Fechados</p><div className='flex items-baseline gap-2'><p className='text-3xl font-bold text-gray-800 mt-1'>{metrics.semana.fechQtd}</p></div></div>
            <div className='bg-green-50/50 p-2 rounded-lg space-y-1'><FinItem label='Pró-labore' value={metrics.semana.fechPL} colorClass='text-green-700' /><FinItem label='Fixos' value={metrics.semana.fechMensal} colorClass='text-green-700' /></div>
          </div>
          <div className='bg-white p-5 rounded-xl shadow-sm border border-red-100 flex flex-col justify-between'>
            <div><p className='text-[10px] text-red-500 font-bold uppercase tracking-wider'>Rejeitados</p><p className='text-3xl font-bold text-red-700 mt-2'>{metrics.semana.rejeitados}</p></div>
            <div className='mt-2 text-[10px] text-red-300 flex items-center'><XCircle className="w-3 h-3 mr-1" /> Casos declinados</div>
          </div>
          <div className='bg-white p-5 rounded-xl shadow-sm border border-purple-100 flex flex-col justify-between'>
            <div><p className='text-[10px] text-purple-500 font-bold uppercase tracking-wider'>Probono</p><p className='text-3xl font-bold text-purple-700 mt-2'>{metrics.semana.probono}</p></div>
            <div className='mt-2 text-[10px] text-purple-300 flex items-center'><HeartHandshake className="w-3 h-3 mr-1" /> Atuação social</div>
          </div>
        </div>
      </div>

      <div>
        <h2 className='text-xl font-bold text-gray-800 mb-4 flex items-center gap-2'>
          <TrendingUp size={20} className='text-[#0F2C4C]' /> Performance Comercial
        </h2>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {/* Card ESQUERDA: Negociações do Mês (Sem alteração) */}
          <div className='bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between relative'>
            <div className='absolute top-0 right-0 bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg'>MÊS ATUAL</div>
            <div>
              <p className='text-sm text-gray-500 font-medium mb-1'>Negociações do Mês</p>
              <h3 className='text-3xl font-bold text-blue-800'>{metrics.mes.propQtd} <span className='text-base font-normal text-gray-400'>propostas</span></h3>
              <div className='mt-4 space-y-2'><FinItem label='Pró-labore Total' value={metrics.mes.propPL} /><FinItem label='Êxito Total' value={metrics.mes.propExito} /></div>
            </div>
          </div>

          {/* Card DIREITA: Realizado no Mês (Substituindo o antigo Total) */}
          <div className='bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between relative'>
            <div className='absolute top-0 right-0 bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg'>MÊS ATUAL (REALIZADO)</div>
            <div>
              <p className='text-sm text-gray-500 font-medium mb-1'>Fechamentos do Mês</p>
              <h3 className='text-3xl font-bold text-green-700'>{metrics.mes.fechQtd} <span className='text-base font-normal text-gray-400'>contratos</span></h3>
              <div className='mt-4 space-y-2'>
                <FinItem label='Pró-labore Total' value={metrics.mes.fechPL} colorClass='text-green-700' />
                <FinItem label='Fixos Mensais Total' value={metrics.mes.fechMensal} colorClass='text-green-700' />
                <FinItem label='Êxito Total' value={metrics.mes.fechExito} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center space-y-6'>
        <h3 className='font-bold text-gray-700 border-b pb-2 flex items-center gap-2'><Camera className='text-[#0F2C4C]' size={20} /> Fotografia Financeira Total</h3>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
          <div>
            <p className='text-xs text-gray-500 font-medium uppercase mb-2'>Valores em Negociação (Ativo)</p>
            <div className='space-y-2'><FinItem label='Pró-labore Total' value={metrics.geral.valorEmNegociacaoPL} /><FinItem label='Êxito Total' value={metrics.geral.valorEmNegociacaoExito} /><div className='flex justify-between items-end border-t border-gray-200 pt-2 mt-2'><span className='text-sm font-bold text-gray-700'>TOTAL GERAL</span><span className='text-xl font-bold text-[#0F2C4C]'>{formatMoney(totalNegociacao)}</span></div></div>
          </div>
          <div className='md:border-l md:pl-8 border-gray-100'>
            <p className='text-xs text-gray-500 font-medium uppercase mb-2'>Carteira Ativa (Receita)</p>
            <div className='space-y-2'>
              <FinItem label='Pró-labore Total (Fechado)' value={metrics.geral.totalFechadoPL} colorClass='text-green-700' />
              <FinItem label='Êxito Total (Fechado)' value={metrics.geral.totalFechadoExito} colorClass='text-green-700' />
              <FinItem label='Média Mensal do Total' value={metrics.geral.receitaRecorrenteAtiva} colorClass='text-green-700' />
              <div className='flex justify-between items-end border-t border-gray-200 pt-2 mt-2'><span className='text-sm font-bold text-gray-700'>TOTAL GERAL</span><span className='text-xl font-bold text-green-700'>{formatMoney(totalCarteira)}</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className='bg-white p-6 rounded-xl shadow-sm border border-gray-100'>
        <div className='flex items-center justify-between mb-6 border-b pb-4'>
          <h3 className='font-bold text-gray-800 flex items-center gap-2'><BarChart4 className='text-[#0F2C4C]' size={20} /> Evolução Financeira (12 Meses)</h3>
          <div className='flex gap-4'>
            <div className='bg-blue-50 px-4 py-2 rounded-lg border border-blue-100'><p className='text-[10px] text-blue-600 font-bold uppercase'>Média Pró-labore (+ Fixos)</p><p className='text-lg font-bold text-blue-900'>{formatMoney(mediasFinanceiras.pl)}</p></div>
            <div className='bg-green-50 px-4 py-2 rounded-lg border border-green-100'><p className='text-[10px] text-green-600 font-bold uppercase'>Média Êxitos</p><p className='text-lg font-bold text-green-900'>{formatMoney(mediasFinanceiras.exito)}</p></div>
          </div>
        </div>
        <div className='h-64 flex items-end justify-around gap-2'>
          {financeiro12Meses.length === 0 ? (<p className='w-full text-center text-gray-400 self-center'>Sem dados financeiros</p>) : (
            financeiro12Meses.map((item, index) => (
              <div key={index} className='flex flex-col items-center gap-1 w-full h-full justify-end'>
                <div className='flex items-end gap-1 h-full w-full justify-center px-1'>
                  <div className='w-2 bg-blue-400 rounded-t hover:bg-blue-500 transition-all relative group' style={{ height: `${Math.max(item.hPl, 1)}%` }}><span className='absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-black text-white text-[10px] p-1 rounded z-10 whitespace-nowrap'>{formatMoney(item.pl)}</span></div>
                  <div className='w-2 bg-indigo-400 rounded-t hover:bg-indigo-500 transition-all relative group' style={{ height: `${Math.max(item.hFixo, 1)}%` }}><span className='absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-black text-white text-[10px] p-1 rounded z-10 whitespace-nowrap'>{formatMoney(item.fixo)}</span></div>
                  <div className='w-2 bg-green-400 rounded-t hover:bg-green-500 transition-all relative group' style={{ height: `${Math.max(item.hExito, 1)}%` }}><span className='absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-black text-white text-[10px] p-1 rounded z-10 whitespace-nowrap'>{formatMoney(item.exito)}</span></div>
                </div>
                <span className='text-[10px] text-gray-500 font-medium uppercase mt-2'>{item.mes}</span>
              </div>
            ))
          )}
        </div>
        <div className='flex justify-center gap-4 mt-4 text-xs'>
          <div className='flex items-center'><span className='w-3 h-3 bg-blue-400 rounded-full mr-1'></span> Pró-labore</div>
          <div className='flex items-center'><span className='w-3 h-3 bg-indigo-400 rounded-full mr-1'></span> Fixo Mensal</div>
          <div className='flex items-center'><span className='w-3 h-3 bg-green-400 rounded-full mr-1'></span> Êxito</div>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        <div className='bg-white p-6 rounded-xl shadow-sm border border-gray-100'>
          <div className='flex items-center justify-between mb-6 border-b pb-4'>
            <div className='flex items-center gap-2'>
              <PieChart className='text-[#0F2C4C]' size={24} />
              <div><h2 className='text-xl font-bold text-gray-800'>Distribuição da Carteira</h2><p className='text-xs text-gray-500'>Visão consolidada por status.</p></div>
            </div>
            <div className='bg-[#0F2C4C] text-white px-6 py-3 rounded-lg text-center'><span className='text-3xl font-bold block'>{metrics.geral.totalCasos}</span><span className='text-xs opacity-80 uppercase tracking-wider mt-1 block'>Total Analisado</span></div>
          </div>
          <div className='grid grid-cols-2 gap-4'>
            <div className='bg-yellow-50 p-4 rounded-lg border border-yellow-100 text-center'><Clock className='mx-auto text-yellow-600 mb-2' size={20} /><p className='text-2xl font-bold text-yellow-800'>{metrics.geral.emAnalise}</p><p className='text-xs text-yellow-700 font-bold uppercase mt-1'>Sob Análise</p></div>
            <div className='bg-blue-50 p-4 rounded-lg border border-blue-100 text-center'><Briefcase className='mx-auto text-blue-600 mb-2' size={20} /><p className='text-2xl font-bold text-blue-800'>{metrics.geral.propostasAtivas}</p><p className='text-xs text-blue-700 font-bold uppercase mt-1'>Propostas</p></div>
            <div className='bg-green-50 p-4 rounded-lg border border-green-100 text-center'><CheckCircle2 className='mx-auto text-green-600 mb-2' size={20} /><p className='text-2xl font-bold text-green-800'>{metrics.geral.fechados}</p><p className='text-xs text-green-700 font-bold uppercase mt-1'>Fechados</p></div>
            <div className='bg-red-50 p-4 rounded-lg border border-red-100 text-center'><XCircle className='mx-auto text-red-600 mb-2' size={20} /><p className='text-2xl font-bold text-red-800'>{metrics.geral.rejeitados}</p><p className='text-xs text-red-700 font-bold uppercase mt-1'>Rejeitados</p></div>
          </div>
        </div>

        <div className='lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100'>
          <h3 className='font-bold text-gray-800 mb-6 flex items-center gap-2'><BarChart3 className='text-[#0F2C4C]' size={20} /> Entrada de Casos (12 Meses)</h3>
          <div className='h-64 flex items-end justify-around gap-2 pb-6 border-b border-gray-100'>
            {evolucaoMensal.length === 0 ? (<p className='w-full text-center text-gray-400 self-center'>Sem dados</p>) : (
              evolucaoMensal.map((item, index) => (
                <div key={index} className='flex flex-col items-center gap-2 w-full h-full justify-end group'>
                  <span className='text-xs font-bold text-blue-900 mb-1 opacity-100'>{item.qtd}</span>
                  <div className='relative w-full max-w-[40px] bg-blue-100 rounded-t-md hover:bg-blue-200 transition-all cursor-pointer' style={{ height: `${item.altura}%` }}></div>
                  <span className='text-xs text-gray-500 font-medium uppercase'>{item.mes}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className='bg-white p-6 rounded-xl shadow-sm border border-gray-100'>
        <div className='flex items-center gap-2 mb-6 border-b pb-4'>
          <FileSignature className='text-[#0F2C4C]' size={24} />
          <div><h2 className='text-xl font-bold text-gray-800'>Status de Assinatura de Contratos</h2><p className='text-xs text-gray-500'>Acompanhamento de assinaturas físicas dos contratos fechados.</p></div>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-xl border-2 border-emerald-200'>
            <div className='flex items-center justify-between mb-4'>
              <div><p className='text-xs text-emerald-700 font-bold uppercase tracking-wider mb-2'>Contratos Assinados</p><p className='text-5xl font-black text-emerald-900'>{metrics.geral.assinados}</p></div>
              <div className='p-4 bg-emerald-200 rounded-full'><CheckCircle2 size={32} className='text-emerald-700' /></div>
            </div>
            <div className='text-xs text-emerald-700 font-medium'>Contratos com assinatura física confirmada</div>
          </div>
          <div className='bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border-2 border-orange-200'>
            <div className='flex items-center justify-between mb-4'>
              <div><p className='text-xs text-orange-700 font-bold uppercase tracking-wider mb-2'>Pendentes de Assinatura</p><p className='text-5xl font-black text-orange-900'>{metrics.geral.naoAssinados}</p></div>
              <div className='p-4 bg-orange-200 rounded-full'><AlertCircle size={32} className='text-orange-700' /></div>
            </div>
            <div className='text-xs text-orange-700 font-medium'>Contratos fechados aguardando assinatura física</div>
          </div>
        </div>
      </div>
    </div>
  );
}