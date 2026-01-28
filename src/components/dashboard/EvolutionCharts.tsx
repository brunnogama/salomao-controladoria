import React from 'react';
import { BarChart3, BarChart4, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatMoney, formatCompact } from './dashboardHelpers';
import { EmptyState } from '../ui/EmptyState';

interface EvolutionChartsProps {
  evolucaoMensal: any[];
  propostas12Meses: any[];
  financeiro12Meses: any[];
  mediasPropostas: { pl: number, exito: number };
  mediasFinanceiras: { pl: number, exito: number };
  statsPropostas: { total: number, media: number, diff: number };
  statsFinanceiro: { total: number, media: number, diff: number };
}

export function EvolutionCharts({
  evolucaoMensal,
  propostas12Meses,
  financeiro12Meses,
  mediasPropostas,
  mediasFinanceiras,
  statsPropostas,
  statsFinanceiro
}: EvolutionChartsProps) {

  // Cálculos Entrada de Casos
  const totalEntrada12 = evolucaoMensal.reduce((acc, curr) => acc + curr.qtd, 0);
  const mediaEntrada = evolucaoMensal.length > 0 ? (totalEntrada12 / evolucaoMensal.length).toFixed(1) : '0';
  const ultimoQtd = evolucaoMensal.length > 0 ? evolucaoMensal[evolucaoMensal.length - 1].qtd : 0;
  const penultimoQtd = evolucaoMensal.length > 1 ? evolucaoMensal[evolucaoMensal.length - 2].qtd : 0;
  const diffEntrada = ultimoQtd - penultimoQtd;

  return (
    <>
      {/* 5. ENTRADA DE CASOS (12 MESES) */}
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
            ) : (evolucaoMensal.map((item, index) => (
              <div key={index} className='flex flex-col items-center gap-2 w-full h-full justify-end group'>
                <span className='text-xs font-bold text-blue-900 mb-1 opacity-100'>{item.qtd}</span>
                <div className='relative w-full max-w-[40px] bg-blue-100 rounded-t-md hover:bg-blue-200 transition-all cursor-pointer' style={{ height: `${item.altura}%` }}></div>
                <span className='text-xs text-gray-600 font-medium uppercase'>{item.mes}</span>
              </div>
            )))}
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
    </>
  );
}