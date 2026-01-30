import React from 'react';
import { BarChart3, BarChart4, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatMoney, formatCompact } from './dashboardHelpers';
import { EmptyState } from '../ui/EmptyState';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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

  // Preparar dados para gráfico de linha (Entrada de Casos)
  const entradaChartData = evolucaoMensal.map(item => ({
    mes: item.mes,
    quantidade: item.qtd
  }));

  // Preparar dados para gráficos de área (Propostas e Fechamentos)
  const propostasChartData = propostas12Meses.map(item => ({
    mes: item.mes,
    proLabore: item.pl,
    fixoMensal: item.fixo,
    exito: item.exito,
    total: item.pl + item.fixo + item.exito
  }));

  const fechamentosChartData = financeiro12Meses.map(item => ({
    mes: item.mes,
    proLabore: item.pl,
    fixoMensal: item.fixo,
    exito: item.exito,
    total: item.pl + item.fixo + item.exito
  }));

  return (
    <>
      {/* 5. ENTRADA DE CASOS (12 MESES) */}
      <div className='bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all p-6'>
        
        {/* Header */}
        <div className='mb-6 pb-5 border-b border-gray-100'>
          <div className='flex items-center gap-3 mb-2'>
            <div className='p-2 rounded-xl bg-gradient-to-br from-[#112240] to-[#1e3a8a] text-white shadow-lg'>
              <BarChart3 className='w-5 h-5' />
            </div>
            <div>
              <h2 className='text-[20px] font-black text-[#0a192f] tracking-tight'>
                Entrada de Casos (12 Meses)
              </h2>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
                A partir de Junho de 2025
              </p>
            </div>
          </div>
        </div>

        {/* Gráfico */}
        <div className='mb-6'>
          {evolucaoMensal.length === 0 ? (
            <div className="h-64 flex items-center justify-center">
              <EmptyState 
                icon={BarChart3} 
                title="Sem dados de evolução" 
                description="Ainda não há histórico suficiente para gerar o gráfico de entrada."
                className="min-h-[200px]" 
              />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={entradaChartData}>
                <defs>
                  <linearGradient id="colorQuantidade" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="mes" 
                  tick={{ fontSize: 11, fontWeight: 700 }}
                  stroke="#6b7280"
                />
                <YAxis 
                  tick={{ fontSize: 11, fontWeight: 700 }}
                  stroke="#6b7280"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                  formatter={(value: any) => [`${value} casos`, 'Quantidade']}
                />
                <Area 
                  type="monotone" 
                  dataKey="quantidade" 
                  stroke="#1e3a8a" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorQuantidade)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
        
        {/* Análise de Dados */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5 border-t border-gray-100">
          <div className="flex flex-col gap-1 p-4 rounded-xl bg-gray-50/50 border border-gray-100/80 transition-all hover:bg-white hover:shadow-sm">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1">
              Volume Total (12m)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-[24px] font-black text-gray-800 tracking-tight">
                {totalEntrada12}
              </span>
              <span className="text-xs font-semibold text-gray-500">casos</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-1 p-4 rounded-xl bg-gray-50/50 border border-gray-100/80 transition-all hover:bg-white hover:shadow-sm">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1">
              Média Mensal
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-[24px] font-black text-blue-600 tracking-tight">
                {mediaEntrada}
              </span>
              <span className="text-xs font-semibold text-gray-500">/mês</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-1 p-4 rounded-xl bg-gray-50/50 border border-gray-100/80 transition-all hover:bg-white hover:shadow-sm">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1">
              Tendência Recente
            </span>
            <div className={`flex items-center gap-2 ${diffEntrada > 0 ? 'text-green-600' : diffEntrada < 0 ? 'text-red-600' : 'text-gray-600'}`}>
              {diffEntrada > 0 ? <TrendingUp className="w-5 h-5" /> : diffEntrada < 0 ? <TrendingDown className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
              <span className="text-[20px] font-black tracking-tight">
                {diffEntrada > 0 ? `+${diffEntrada}` : diffEntrada}
              </span>
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
                vs mês anterior
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 6. EVOLUÇÃO FINANCEIRA (12 MESES) */}
      <div className='bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all p-6'>
        
        {/* Header */}
        <div className='mb-6 pb-5 border-b border-gray-100'>
          <div className='flex items-center gap-3'>
            <div className='p-2 rounded-xl bg-gradient-to-br from-[#112240] to-[#1e3a8a] text-white shadow-lg'>
              <BarChart4 className='w-5 h-5' />
            </div>
            <h2 className='text-[20px] font-black text-[#0a192f] tracking-tight'>
              Evolução Financeira (12 Meses)
            </h2>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* LADO ESQUERDO - PROPOSTAS */}
          <div className="bg-white border border-gray-100 rounded-xl p-5 flex flex-col justify-between hover:shadow-sm transition-all">
            <div>
              <div className='flex justify-between items-start mb-5'>
                <div>
                  <p className="text-[11px] font-black text-blue-600 uppercase tracking-[0.15em]">
                    Evolução de Propostas
                  </p>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mt-1">
                    Valores em R$
                  </p>
                </div>
                <div className='flex flex-col items-end gap-0.5'>
                  <span className='text-[9px] text-gray-400 font-black uppercase tracking-wider'>
                    Média PL / Êxito
                  </span>
                  <span className='text-[10px] font-bold text-blue-600'>
                    {formatMoney(mediasPropostas.pl)} / {formatMoney(mediasPropostas.exito)}
                  </span>
                </div>
              </div>
              
              {propostas12Meses.length === 0 ? (
                <div className="h-64 flex items-center justify-center">
                  <EmptyState 
                    icon={BarChart3} 
                    title="Sem dados de propostas" 
                    description="Ainda não há histórico suficiente para gerar o gráfico."
                    className="min-h-[150px]"
                  />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={propostasChartData}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="mes" 
                      tick={{ fontSize: 10, fontWeight: 700 }}
                      stroke="#6b7280"
                    />
                    <YAxis 
                      tick={{ fontSize: 10, fontWeight: 700 }}
                      stroke="#6b7280"
                      tickFormatter={(value) => formatCompact(value)}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 700,
                      }}
                      formatter={(value: any) => formatMoney(value)}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="total" 
                      stroke="#1e3a8a" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorTotal)"
                      name="Total"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
            
            {/* Análise Propostas */}
            <div className="grid grid-cols-3 gap-3 pt-5 mt-5 border-t border-gray-100">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-gray-400 uppercase font-black tracking-wider">
                  Total (12m)
                </span>
                <span className="text-sm font-bold text-gray-800">
                  {formatMoney(statsPropostas.total)}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-gray-400 uppercase font-black tracking-wider">
                  Média/mês
                </span>
                <span className="text-sm font-bold text-blue-600">
                  {formatMoney(statsPropostas.media)}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-gray-400 uppercase font-black tracking-wider">
                  Tendência
                </span>
                <div className={`flex items-center gap-1 ${statsPropostas.diff > 0 ? 'text-green-600' : statsPropostas.diff < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                  {statsPropostas.diff > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : statsPropostas.diff < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                  <span className="text-xs font-bold">
                    {formatMoney(Math.abs(statsPropostas.diff))}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* LADO DIREITO - FECHADOS */}
          <div className="bg-white border border-gray-100 rounded-xl p-5 flex flex-col justify-between hover:shadow-sm transition-all">
            <div>
              <div className='flex justify-between items-start mb-5'>
                <div>
                  <p className="text-[11px] font-black text-green-600 uppercase tracking-[0.15em]">
                    Evolução de Fechamentos
                  </p>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mt-1">
                    Valores em R$
                  </p>
                </div>
                <div className='flex flex-col items-end gap-0.5'>
                  <span className='text-[9px] text-gray-400 font-black uppercase tracking-wider'>
                    Média PL / Êxito
                  </span>
                  <span className='text-[10px] font-bold text-green-600'>
                    {formatMoney(mediasFinanceiras.pl)} / {formatMoney(mediasFinanceiras.exito)}
                  </span>
                </div>
              </div>
              
              {financeiro12Meses.length === 0 ? (
                <div className="h-64 flex items-center justify-center">
                  <EmptyState 
                    icon={BarChart3} 
                    title="Sem dados financeiros" 
                    description="Ainda não há histórico suficiente para gerar o gráfico."
                    className="min-h-[150px]"
                  />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={fechamentosChartData}>
                    <defs>
                      <linearGradient id="colorTotalFech" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#15803d" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#15803d" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="mes" 
                      tick={{ fontSize: 10, fontWeight: 700 }}
                      stroke="#6b7280"
                    />
                    <YAxis 
                      tick={{ fontSize: 10, fontWeight: 700 }}
                      stroke="#6b7280"
                      tickFormatter={(value) => formatCompact(value)}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 700,
                      }}
                      formatter={(value: any) => formatMoney(value)}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="total" 
                      stroke="#15803d" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorTotalFech)"
                      name="Total"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
            
            {/* Análise Fechamentos */}
            <div className="grid grid-cols-3 gap-3 pt-5 mt-5 border-t border-gray-100">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-gray-400 uppercase font-black tracking-wider">
                  Total (12m)
                </span>
                <span className="text-sm font-bold text-gray-800">
                  {formatMoney(statsFinanceiro.total)}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-gray-400 uppercase font-black tracking-wider">
                  Média/mês
                </span>
                <span className="text-sm font-bold text-green-600">
                  {formatMoney(statsFinanceiro.media)}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-gray-400 uppercase font-black tracking-wider">
                  Tendência
                </span>
                <div className={`flex items-center gap-1 ${statsFinanceiro.diff > 0 ? 'text-green-600' : statsFinanceiro.diff < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                  {statsFinanceiro.diff > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : statsFinanceiro.diff < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                  <span className="text-xs font-bold">
                    {formatMoney(Math.abs(statsFinanceiro.diff))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Legenda */}
        <div className='flex justify-center gap-6 mt-6 pt-5 border-t border-gray-100'>
          <div className='flex items-center gap-2'>
            <div className='w-3 h-3 rounded-full bg-[#1e3a8a]'></div>
            <span className='text-[9px] font-black text-gray-500 uppercase tracking-wider'>
              Pró-labore
            </span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='w-3 h-3 rounded-full bg-indigo-500'></div>
            <span className='text-[9px] font-black text-gray-500 uppercase tracking-wider'>
              Fixo Mensal
            </span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='w-3 h-3 rounded-full bg-green-600'></div>
            <span className='text-[9px] font-black text-gray-500 uppercase tracking-wider'>
              Êxito
            </span>
          </div>
        </div>
      </div>
    </>
  );
}