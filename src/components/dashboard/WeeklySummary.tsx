import React from 'react';
import { 
  CalendarDays, Layers, ArrowUpRight, GitCommit, Lightbulb 
} from 'lucide-react';
import { formatMoney, calcDelta, getTrendText } from '../../utils/dashboardHelpers';
import { FinItem } from './FinItem';

interface WeeklySummaryProps {
  metrics: any; // Tipar conforme seu hook useDashboardData
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
    <div className='bg-blue-50/50 p-6 rounded-2xl border border-blue-100'>
      <div className='flex items-center gap-2 mb-4'>
        <CalendarDays className='text-blue-700' size={24} />
        <h2 className='text-xl font-bold text-blue-900'>Resumo da Semana</h2>
      </div>
      
      <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4'>
        {/* Card 1: Geral */}
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
        
        {/* Card 2: Novos */}
        <div className='bg-white p-5 rounded-xl shadow-sm border border-blue-100 flex flex-col justify-between'>
          <div>
            <div className='flex justify-between items-start'>
              <p className='text-[10px] text-gray-600 font-bold uppercase tracking-wider'>Sob Análise</p>
              <span className="text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded flex items-center gap-1"><ArrowUpRight size={8} /> Entrada</span>
            </div>
            <p className='text-3xl font-bold text-gray-800 mt-2'>{metrics.semana.novos}</p>
          </div>
        </div>

        {/* Card 3: Propostas */}
        <div className='bg-white p-5 rounded-xl shadow-sm border border-blue-100'>
          <div className='mb-3'>
            <div className='flex justify-between items-start'>
              <p className='text-[10px] text-blue-600 font-bold uppercase tracking-wider'>Propostas Enviadas</p>
              <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded flex items-center gap-1"><GitCommit size={8} /> Atualização</span>
            </div>
            <p className='text-3xl font-bold text-gray-800 mt-1'>{metrics.semana.propQtd}</p>
          </div>
          <div className='bg-blue-50/50 p-2 rounded-lg space-y-1'>
            <FinItem label='PL + Fixos' value={(metrics.semana.propPL || 0) + (metrics.semana.propMensal || 0)} colorClass='text-blue-700' />
            <FinItem label='Êxito' value={metrics.semana.propExito} colorClass='text-blue-700' />
          </div>
        </div>

        {/* Card 4: Fechados */}
        <div className='bg-white p-5 rounded-xl shadow-sm border border-blue-100'>
          <div className='mb-3'>
            <div className='flex justify-between items-start'>
              <p className='text-[10px] text-green-600 font-bold uppercase tracking-wider'>Contratos Fechados</p>
              <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded flex items-center gap-1"><GitCommit size={8} /> Atualização</span>
            </div>
            <p className='text-3xl font-bold text-gray-800 mt-1'>{metrics.semana.fechQtd}</p>
          </div>
          <div className='bg-green-50/50 p-2 rounded-lg space-y-1'>
            <FinItem label='PL + Fixos' value={(metrics.semana.fechPL || 0) + (metrics.semana.fechMensal || 0)} colorClass='text-green-700' />
            <FinItem label='Êxito' value={metrics.semana.fechExito} colorClass='text-green-700' />
          </div>
        </div>

        {/* Card 5: Rejeitados */}
        <div className='bg-white p-5 rounded-xl shadow-sm border border-red-100 flex flex-col justify-between'>
          <div>
            <div className='flex justify-between items-start'>
              <p className='text-[10px] text-red-500 font-bold uppercase tracking-wider'>Rejeitados</p>
              <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded flex items-center gap-1"><GitCommit size={8} /> Atualização</span>
            </div>
            <p className='text-3xl font-bold text-red-700 mt-2'>{metrics.semana.rejeitados}</p>
          </div>
        </div>

        {/* Card 6: Probono */}
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
              <div className="flex items-end justify-center gap-8 h-full">
                <div className="flex flex-col items-center justify-end h-full w-14 group">
                  <span className="text-xs text-gray-500 mb-1 font-extrabold whitespace-nowrap">{formatMoney(valPropSemanaAnt)}</span>
                  <div className="w-full bg-gray-300 rounded-t transition-all" style={{ height: `${valPropSemanaAnt > 0 ? (valPropSemanaAnt / maxSemanaChart) * 60 : 2}%` }}></div>
                  <span className="text-[10px] text-gray-500 mt-1 font-semibold">Anterior</span>
                </div>
                <div className="flex flex-col items-center justify-end h-full w-14 group relative">
                  <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded mb-1 ${deltaPropSemana >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {deltaPropSemana > 0 ? '+' : ''}{deltaPropSemana.toFixed(0)}%
                  </div>
                  <span className={`text-xs mb-1 font-extrabold whitespace-nowrap ${deltaPropSemana >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
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
              <div className="flex items-end justify-center gap-8 h-full">
                <div className="flex flex-col items-center justify-end h-full w-14 group">
                  <span className="text-xs text-gray-500 mb-1 font-extrabold whitespace-nowrap">{formatMoney(valFechSemanaAnt)}</span>
                  <div className="w-full bg-gray-300 rounded-t transition-all" style={{ height: `${valFechSemanaAnt > 0 ? (valFechSemanaAnt / maxSemanaChart) * 60 : 2}%` }}></div>
                  <span className="text-[10px] text-gray-500 mt-1 font-semibold">Anterior</span>
                </div>
                <div className="flex flex-col items-center justify-end h-full w-14 group relative">
                  <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded mb-1 ${deltaFechSemana >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {deltaFechSemana > 0 ? '+' : ''}{deltaFechSemana.toFixed(0)}%
                  </div>
                  <span className={`text-xs mb-1 font-extrabold whitespace-nowrap ${deltaFechSemana >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {formatMoney(valFechSemana)}
                  </span>
                  <div className="w-full bg-green-500 rounded-t transition-all" style={{ height: `${valFechSemana > 0 ? (valFechSemana / maxSemanaChart) * 60 : 2}%` }}></div>
                  <span className="text-[10px] text-green-600 font-semibold mt-1">Atual</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Insight Box */}
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
  );
}