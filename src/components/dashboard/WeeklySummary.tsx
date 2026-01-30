import React from 'react';
import { 
  CalendarDays, Layers, ArrowUpRight, GitCommit, Lightbulb 
} from 'lucide-react';
import { formatMoney, calcDelta, getTrendText } from './dashboardHelpers';
import { FinItem } from './FinItem';

interface WeeklySummaryProps {
  metrics: any;
}

export function WeeklySummary({ metrics }: WeeklySummaryProps) {
  // Cálculos Locais
  const valPropSemana = (metrics?.semana?.propPL || 0) + (metrics?.semana?.propExito || 0) + (metrics?.semana?.propMensal || 0);
  const valPropSemanaAnt = (metrics?.semanaAnterior?.propPL || 0) + (metrics?.semanaAnterior?.propExito || 0) + (metrics?.semanaAnterior?.propMensal || 0);
  const deltaPropSemana = calcDelta(valPropSemana, valPropSemanaAnt);

  const valFechSemana = (metrics?.semana?.fechPL || 0) + (metrics?.semana?.fechExito || 0) + (metrics?.semana?.fechMensal || 0);
  const valFechSemanaAnt = (metrics?.semanaAnterior?.fechPL || 0) + (metrics?.semanaAnterior?.fechExito || 0) + (metrics?.semanaAnterior?.fechMensal || 0);
  const deltaFechSemana = calcDelta(valFechSemana, valFechSemanaAnt);

  const maxSemanaChart = Math.max(valPropSemana, valPropSemanaAnt, valFechSemana, valFechSemanaAnt, 100);

  const insightSemana = `${getTrendText(deltaFechSemana, 'fechamento de contratos')} ${getTrendText(deltaPropSemana, 'envio de propostas')}`;

  return (
    <div className='bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all p-6'>
      
      {/* Header */}
      <div className='mb-6 pb-5 border-b border-gray-100'>
        <div className='flex items-center gap-3 mb-2'>
          <div className='p-2 rounded-xl bg-gradient-to-br from-[#112240] to-[#1e3a8a] text-white shadow-lg'>
            <CalendarDays className='w-5 h-5' />
          </div>
          <h2 className='text-[20px] font-black text-[#0a192f] tracking-tight'>
            Resumo da Semana
          </h2>
        </div>
        <p className='text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-[48px]'>
          Movimentações e atividades recentes
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
              {metrics.semana.totalUnico}
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
              {metrics.semana.novos}
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
              {metrics.semana.propQtd}
            </p>
          </div>
          <div className='bg-blue-50/50 p-2.5 rounded-xl border border-blue-100/50 space-y-1.5'>
            <FinItem label='PL + Fixos' value={(metrics.semana.propPL || 0) + (metrics.semana.propMensal || 0)} colorClass='text-blue-700' />
            <FinItem label='Êxito' value={metrics.semana.propExito} colorClass='text-blue-700' />
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
              {metrics.semana.fechQtd}
            </p>
          </div>
          <div className='bg-green-50/50 p-2.5 rounded-xl border border-green-100/50 space-y-1.5'>
            <FinItem label='PL + Fixos' value={(metrics.semana.fechPL || 0) + (metrics.semana.fechMensal || 0)} colorClass='text-green-700' />
            <FinItem label='Êxito' value={metrics.semana.fechExito} colorClass='text-green-700' />
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
              {metrics.semana.rejeitados}
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
              {metrics.semana.probono}
            </p>
          </div>
        </div>
      </div>
      
      {/* Gráfico Semana + Insights */}
      <div className="flex flex-col lg:flex-row gap-4">
        
        {/* Gráfico Comparativo */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex-1">
          <div className="flex justify-between items-start mb-5 pb-4 border-b border-gray-100">
            <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-[0.15em]">
              Comparativo Financeiro
            </h3>
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
              Semana Atual vs Anterior
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
                    {formatMoney(valPropSemanaAnt)}
                  </span>
                  <div 
                    className="w-full bg-gray-300 rounded-t-xl transition-all" 
                    style={{ height: `${valPropSemanaAnt > 0 ? (valPropSemanaAnt / maxSemanaChart) * 100 : 2}%` }}
                  />
                  <span className="text-[9px] text-gray-500 mt-2 font-black uppercase tracking-wider">
                    Anterior
                  </span>
                </div>
                
                {/* Atual */}
                <div className="flex flex-col items-center justify-end h-full w-16 relative">
                  <div className={`text-[9px] font-black px-2 py-0.5 rounded-lg mb-2 ${deltaPropSemana >= 0 ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                    {deltaPropSemana > 0 ? '+' : ''}{deltaPropSemana.toFixed(0)}%
                  </div>
                  <span className={`text-[10px] mb-2 font-bold whitespace-nowrap ${deltaPropSemana >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {formatMoney(valPropSemana)}
                  </span>
                  <div 
                    className="w-full bg-gradient-to-t from-[#1e3a8a] to-[#112240] rounded-t-xl transition-all shadow-lg" 
                    style={{ height: `${valPropSemana > 0 ? (valPropSemana / maxSemanaChart) * 100 : 2}%` }}
                  />
                  <span className="text-[9px] text-blue-600 font-black uppercase tracking-wider mt-2">
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
                    {formatMoney(valFechSemanaAnt)}
                  </span>
                  <div 
                    className="w-full bg-gray-300 rounded-t-xl transition-all" 
                    style={{ height: `${valFechSemanaAnt > 0 ? (valFechSemanaAnt / maxSemanaChart) * 100 : 2}%` }}
                  />
                  <span className="text-[9px] text-gray-500 mt-2 font-black uppercase tracking-wider">
                    Anterior
                  </span>
                </div>
                
                {/* Atual */}
                <div className="flex flex-col items-center justify-end h-full w-16 relative">
                  <div className={`text-[9px] font-black px-2 py-0.5 rounded-lg mb-2 ${deltaFechSemana >= 0 ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                    {deltaFechSemana > 0 ? '+' : ''}{deltaFechSemana.toFixed(0)}%
                  </div>
                  <span className={`text-[10px] mb-2 font-bold whitespace-nowrap ${deltaFechSemana >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatMoney(valFechSemana)}
                  </span>
                  <div 
                    className="w-full bg-gradient-to-t from-green-700 to-green-600 rounded-t-xl transition-all shadow-lg" 
                    style={{ height: `${valFechSemana > 0 ? (valFechSemana / maxSemanaChart) * 100 : 2}%` }}
                  />
                  <span className="text-[9px] text-green-600 font-black uppercase tracking-wider mt-2">
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
              Insight Semanal
            </span>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-white/90 leading-relaxed font-semibold">
              {getTrendText(deltaFechSemana, 'fechamento de contratos')}.
            </p>
            <p className="text-xs text-white/90 leading-relaxed font-semibold">
              {getTrendText(deltaPropSemana, 'envio de propostas')}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}