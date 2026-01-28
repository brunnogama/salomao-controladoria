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
    <div className='bg-blue-50/50 p-6 rounded-2xl border border-blue-100'>
      <div className='flex items-center gap-2 mb-4'>
        <CalendarRange className='text-blue-700' size={24} />
        <h2 className='text-xl font-bold text-blue-900'>Resumo do Mês</h2>
      </div>
      
      <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4'>
        {/* Card 1: Geral */}
        <div className='bg-white p-5 rounded-xl shadow-sm border border-blue-200 flex flex-col justify-between'>
          <div>
            <div className='flex justify-between items-start'>
              <p className='text-[10px] text-blue-800 font-bold uppercase tracking-wider'>Casos com Atividade</p>
              <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded flex items-center gap-1"><Layers size={8} /> Geral</span>
            </div>
            <p className='text-3xl font-bold text-blue-900 mt-2'>{metrics.mes.totalUnico}</p>
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
            <p className='text-3xl font-bold text-gray-800 mt-2'>{metrics.mes.analysis}</p>
          </div>
        </div>

        {/* Card 3: Propostas */}
        <div className='bg-white p-5 rounded-xl shadow-sm border border-blue-100'>
          <div className='mb-3'>
            <div className='flex justify-between items-start'>
              <p className='text-[10px] text-blue-600 font-bold uppercase tracking-wider'>Propostas Enviadas</p>
              <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded flex items-center gap-1"><GitCommit size={8} /> Atualização</span>
            </div>
            <p className='text-3xl font-bold text-gray-800 mt-1'>{metrics.mes.propQtd}</p>
          </div>
          <div className='bg-blue-50/50 p-2 rounded-lg space-y-1'>
            <FinItem label='PL + Fixos' value={(metrics.mes.propPL || 0) + (metrics.mes.propMensal || 0)} colorClass='text-blue-700' />
            <FinItem label='Êxito' value={metrics.mes.propExito} colorClass='text-blue-700' />
          </div>
        </div>

        {/* Card 4: Fechados */}
        <div className='bg-white p-5 rounded-xl shadow-sm border border-blue-100'>
          <div className='mb-3'>
            <div className='flex justify-between items-start'>
              <p className='text-[10px] text-green-600 font-bold uppercase tracking-wider'>Contratos Fechados</p>
              <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded flex items-center gap-1"><GitCommit size={8} /> Atualização</span>
            </div>
            <p className='text-3xl font-bold text-gray-800 mt-1'>{metrics.mes.fechQtd}</p>
          </div>
          <div className='bg-green-50/50 p-2 rounded-lg space-y-1'>
            <FinItem label='PL + Fixos' value={(metrics.mes.fechPL || 0) + (metrics.mes.fechMensal || 0)} colorClass='text-green-700' />
            <FinItem label='Êxito' value={metrics.mes.fechExito} colorClass='text-green-700' />
          </div>
        </div>

        {/* Card 5: Rejeitados */}
        <div className='bg-white p-5 rounded-xl shadow-sm border border-red-100 flex flex-col justify-between'>
          <div>
            <div className='flex justify-between items-start'>
              <p className='text-[10px] text-red-500 font-bold uppercase tracking-wider'>Rejeitados</p>
              <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded flex items-center gap-1"><GitCommit size={8} /> Atualização</span>
            </div>
            <p className='text-3xl font-bold text-red-700 mt-2'>{metrics.mes.rejected}</p>
          </div>
        </div>

        {/* Card 6: Probono */}
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
          <p className="text-sm font-bold text-gray-600 uppercase mb-4 border-b border-gray-100 pb-2 flex justify-between items-center">
            <span>Comparativo Financeiro</span>
            <span className="text-gray-500 font-normal normal-case text-xs">
               {metrics.executivo.periodoAnteriorLabel} vs {metrics.executivo.periodoAtualLabel}
            </span>
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

        {/* Insight Box */}
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
  );
}