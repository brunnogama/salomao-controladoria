import React from 'react';
import { 
  CalendarRange, Layers, ArrowUpRight, GitCommit, Lightbulb 
} from 'lucide-react';
import { formatMoney, calcDelta, getTrendText } from './dashboardHelpers';
import { FinItem } from './FinItem';

interface MonthlySummaryProps {
  metrics: any;
}

export function MonthlySummary({ metrics }: MonthlySummaryProps) {
  // Cálculos Locais
  const valPropMes = (metrics?.executivo?.mesAtual?.propPL || 0) + (metrics?.executivo?.mesAtual?.propExito || 0) + (metrics?.executivo?.mesAtual?.propMensal || 0);
  const valPropMesAnt = (metrics?.executivo?.mesAnterior?.propPL || 0) + (metrics?.executivo?.mesAnterior?.propExito || 0) + (metrics?.executivo?.mesAnterior?.propMensal || 0);
  const deltaPropMes = calcDelta(valPropMes, valPropMesAnt);

  const valFechMes = (metrics?.executivo?.mesAtual?.fechPL || 0) + (metrics?.executivo?.mesAtual?.fechExito || 0) + (metrics?.executivo?.mesAtual?.fechMensal || 0);
  const valFechMesAnt = (metrics?.executivo?.mesAnterior?.fechPL || 0) + (metrics?.executivo?.mesAnterior?.fechExito || 0) + (metrics?.executivo?.mesAnterior?.fechMensal || 0);
  const deltaFechMes = calcDelta(valFechMes, valFechMesAnt);

  const maxMesChart = Math.max(valPropMes, valPropMesAnt, valFechMes, valFechMesAnt, 100);

  const deltaNovos = calcDelta(metrics?.executivo?.mesAtual?.novos || 0, metrics?.executivo?.mesAnterior?.novos || 0);
  
  const insightMes = `${getTrendText(deltaNovos, 'novas demandas')} ${getTrendText(deltaFechMes, 'faturamento fechado')}`;

  return (
    <div className='bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all p-6'>
      
      {/* Header */}
      <div className='mb-6 pb-5 border-b border-gray-100'>
        <div className='flex items-center gap-3 mb-2'>
          <div className='p-2 rounded-xl bg-gradient-to-br from-[#112240] to-[#1e3a8a] text-white shadow-lg'>
            <CalendarRange className='w-5 h-5' />
          </div>
          <h2 className='text-[20px] font-black text-[#0a192f] tracking-tight'>
            Resumo do Mês
          </h2>
        </div>
        <p className='text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-[48px]'>
          Performance mensal consolidada
        </p>
      </div>
      
      {/* Cards Grid */}
      <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6'>
        
        {/* Card 1: Geral */}
        <div className='bg-gradient-to-br from-[#112240] to-[#1e3a8a] p-5 rounded-xl border border-white/10 shadow-lg flex flex-col justify-between transition-all hover:shadow-blue-900/20'>
          <div>
            <div className='flex justify-between items-start mb-3'>
              <p className='text-[9px] text-white font-black uppercase tracking-widest'>
                Casos com Atividade
              </p>
              <span className="text-[9px] bg-white/20 backdrop-blur-sm text-white px-2 py-0.5 rounded-lg flex items-center gap-1 font-black uppercase tracking-wider">
                <Layers className='w-2.5 h-2.5' /> Geral
              </span>
            </div>
            <p className='text-[30px] font-black text-white tracking-tight'>
              {metrics.mes.totalUnico}
            </p>
          </div>
          <div className='mt-3 pt-3 border-t border-white/20'>
            <p className='text-[9px] text-white/70 leading-tight font-semibold'>
              Casos movimentados (que tiveram atividade), e não apenas novos cadastros.
            </p>
          </div>
        </div>

        {/* Card 2: Novos */}
        <div className='bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all'>
          <div>
            <div className='flex justify-between items-start mb-3'>
              <p className='text-[9px] text-gray-500 font-black uppercase tracking-widest'>
                Sob Análise
              </p>
              <span className="text-[9px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-lg flex items-center gap-1 font-black uppercase tracking-wider border border-gray-200">
                <ArrowUpRight className='w-2.5 h-2.5' /> Entrada
              </span>
            </div>
            <p className='text-[30px] font-black text-gray-800 tracking-tight'>
              {metrics.mes.analysis}
            </p>
          </div>
        </div>

        {/* Card 3: Propostas */}
        <div className='bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all'>
          <div className='mb-3'>
            <div className='flex justify-between items-start mb-3'>
              <p className='text-[9px] text-blue-600 font-black uppercase tracking-widest'>
                Propostas Enviadas
              </p>
              <span className="text-[9px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-lg flex items-center gap-1 font-black uppercase tracking-wider border border-blue-200">
                <GitCommit className='w-2.5 h-2.5' /> Atualização
              </span>
            </div>
            <p className='text-[30px] font-black text-gray-800 tracking-tight mb-3'>
              {metrics.mes.propQtd}
            </p>
          </div>
          <div className='bg-blue-50/50 p-2.5 rounded-xl border border-blue-100/50 space-y-1.5'>
            <FinItem label='PL + Fixos' value={(metrics.mes.propPL || 0) + (metrics.mes.propMensal || 0)} colorClass='text-blue-700' />
            <FinItem label='Êxito' value={metrics.mes.propExito} colorClass='text-blue-700' />
          </div>
        </div>

        {/* Card 4: Fechados */}
        <div className='bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all'>
          <div className='mb-3'>
            <div className='flex justify-between items-start mb-3'>
              <p className='text-[9px] text-green-600 font-black uppercase tracking-widest'>
                Contratos Fechados
              </p>
              <span className="text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded-lg flex items-center gap-1 font-black uppercase tracking-wider border border-green-200">
                <GitCommit className='w-2.5 h-2.5' /> Atualização
              </span>
            </div>
            <p className='text-[30px] font-black text-gray-800 tracking-tight mb-3'>
              {metrics.mes.fechQtd}
            </p>
          </div>
          <div className='bg-green-50/50 p-2.5 rounded-xl border border-green-100/50 space-y-1.5'>
            <FinItem label='PL + Fixos' value={(metrics.mes.fechPL || 0) + (metrics.mes.fechMensal || 0)} colorClass='text-green-700' />
            <FinItem label='Êxito' value={metrics.mes.fechExito} colorClass='text-green-700' />
          </div>
        </div>

        {/* Card 5: Rejeitados */}
        <div className='bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all'>
          <div>
            <div className='flex justify-between items-start mb-3'>
              <p className='text-[9px] text-red-600 font-black uppercase tracking-widest'>
                Rejeitados
              </p>
              <span className="text-[9px] bg-red-100 text-red-700 px-2 py-0.5 rounded-lg flex items-center gap-1 font-black uppercase tracking-wider border border-red-200">
                <GitCommit className='w-2.5 h-2.5' /> Atualização
              </span>
            </div>
            <p className='text-[30px] font-black text-red-700 tracking-tight'>
              {metrics.mes.rejected}
            </p>
          </div>
        </div>

        {/* Card 6: Probono */}
        <div className='bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all'>
          <div>
            <div className='flex justify-between items-start mb-3'>
              <p className='text-[9px] text-purple-600 font-black uppercase tracking-widest'>
                Probono
              </p>
              <span className="text-[9px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-lg flex items-center gap-1 font-black uppercase tracking-wider border border-purple-200">
                <GitCommit className='w-2.5 h-2.5' /> Atualização
              </span>
            </div>
            <p className='text-[30px] font-black text-purple-700 tracking-tight'>
              {metrics.mes.probono}
            </p>
          </div>
        </div>
      </div>
      
      {/* Gráfico Mês + Insights */}
      <div className="flex flex-col lg:flex-row gap-4">
        
        {/* Gráfico Comparativo */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex-1">
          <div className="flex justify-between items-start mb-5 pb-4 border-b border-gray-100">
            <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-[0.15em]">
              Comparativo Financeiro
            </h3>
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
              {metrics.executivo.periodoAnteriorLabel} vs {metrics.executivo.periodoAtualLabel}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-8 h-56">
            
            {/* Propostas */}
            <div className="flex flex-col justify-end relative border-r border-gray-100 pr-4">
              <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-3 text-center">
                Propostas
              </p>
              <div className="flex items-end justify-center gap-6 h-full">
                {/* Anterior */}
                <div className="flex flex-col items-center justify-end h-full w-16">
                  <span className="text-[10px] text-gray-500 mb-2 font-bold whitespace-nowrap">
                    {formatMoney(valPropMesAnt)}
                  </span>
                  <div 
                    className="w-full bg-gray-300 rounded-t-xl transition-all" 
                    style={{ height: `${valPropMesAnt > 0 ? (valPropMesAnt / maxMesChart) * 100 : 2}%` }}
                  />
                  <span className="text-[9px] text-gray-500 mt-2 font-black uppercase tracking-wider text-center leading-tight">
                    Anterior
                  </span>
                </div>
                
                {/* Atual */}
                <div className="flex flex-col items-center justify-end h-full w-16 relative">
                  <div className={`text-[9px] font-black px-2 py-0.5 rounded-lg mb-2 ${deltaPropMes >= 0 ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                    {deltaPropMes > 0 ? '+' : ''}{deltaPropMes.toFixed(0)}%
                  </div>
                  <span className={`text-[10px] mb-2 font-bold whitespace-nowrap ${deltaPropMes >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {formatMoney(valPropMes)}
                  </span>
                  <div 
                    className="w-full bg-gradient-to-t from-[#1e3a8a] to-[#112240] rounded-t-xl transition-all shadow-lg" 
                    style={{ height: `${valPropMes > 0 ? (valPropMes / maxMesChart) * 100 : 2}%` }}
                  />
                  <span className="text-[9px] text-blue-600 font-black uppercase tracking-wider mt-2 text-center leading-tight">
                    Atual
                  </span>
                </div>
              </div>
            </div>

            {/* Fechados */}
            <div className="flex flex-col justify-end relative">
              <p className="text-[9px] font-black text-green-600 uppercase tracking-widest mb-3 text-center">
                Fechados
              </p>
              <div className="flex items-end justify-center gap-6 h-full">
                {/* Anterior */}
                <div className="flex flex-col items-center justify-end h-full w-16">
                  <span className="text-[10px] text-gray-500 mb-2 font-bold whitespace-nowrap">
                    {formatMoney(valFechMesAnt)}
                  </span>
                  <div 
                    className="w-full bg-gray-300 rounded-t-xl transition-all" 
                    style={{ height: `${valFechMesAnt > 0 ? (valFechMesAnt / maxMesChart) * 100 : 2}%` }}
                  />
                  <span className="text-[9px] text-gray-500 mt-2 font-black uppercase tracking-wider text-center leading-tight">
                    Anterior
                  </span>
                </div>
                
                {/* Atual */}
                <div className="flex flex-col items-center justify-end h-full w-16 relative">
                  <div className={`text-[9px] font-black px-2 py-0.5 rounded-lg mb-2 ${deltaFechMes >= 0 ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                    {deltaFechMes > 0 ? '+' : ''}{deltaFechMes.toFixed(0)}%
                  </div>
                  <span className={`text-[10px] mb-2 font-bold whitespace-nowrap ${deltaFechMes >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatMoney(valFechMes)}
                  </span>
                  <div 
                    className="w-full bg-gradient-to-t from-green-700 to-green-600 rounded-t-xl transition-all shadow-lg" 
                    style={{ height: `${valFechMes > 0 ? (valFechMes / maxMesChart) * 100 : 2}%` }}
                  />
                  <span className="text-[9px] text-green-600 font-black uppercase tracking-wider mt-2 text-center leading-tight">
                    Atual
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Insight Box */}
        <div className="bg-gradient-to-br from-[#112240] to-[#1e3a8a] p-5 rounded-xl border border-white/10 shadow-lg flex flex-col justify-center w-full lg:w-64 transition-all hover:shadow-blue-900/20">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm">
              <Lightbulb className='w-4 h-4 text-white' />
            </div>
            <span className="text-[9px] text-white font-black uppercase tracking-widest">
              Insight Mensal
            </span>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-white/90 leading-relaxed font-semibold">
              {getTrendText(deltaNovos, 'novas demandas')}.
            </p>
            <p className="text-xs text-white/90 leading-relaxed font-semibold">
              {getTrendText(deltaFechMes, 'faturamento fechado')}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}