import React from 'react';
import { BarChart3, BarChart4, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatMoney, formatCompact } from './dashboardHelpers';
import { EmptyState } from '../ui/EmptyState';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartDataLabels
);

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

  // Preparar dados para Chart.js - Entrada de Casos
  const entradaChartData = {
    labels: evolucaoMensal.map(item => item.mes),
    datasets: [
      {
        label: 'Quantidade',
        data: evolucaoMensal.map(item => item.qtd),
        borderColor: '#1e3a8a',
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(30, 58, 138, 0.3)');
          gradient.addColorStop(1, 'rgba(30, 58, 138, 0)');
          return gradient;
        },
        borderWidth: 3,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#1e3a8a',
        pointBorderWidth: 3,
        fill: true,
        tension: 0.4
      }
    ]
  };

  // Preparar dados para Chart.js - Propostas
  const propostasChartData = {
    labels: propostas12Meses.map(item => item.mes),
    datasets: [
      {
        label: 'Total',
        data: propostas12Meses.map(item => item.pl + item.fixo + item.exito),
        borderColor: '#1e3a8a',
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 240);
          gradient.addColorStop(0, 'rgba(30, 58, 138, 0.3)');
          gradient.addColorStop(1, 'rgba(30, 58, 138, 0)');
          return gradient;
        },
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#1e3a8a',
        pointBorderWidth: 2.5,
        fill: true,
        tension: 0.4
      }
    ]
  };

  // Preparar dados para Chart.js - Fechamentos
  const fechamentosChartData = {
    labels: financeiro12Meses.map(item => item.mes),
    datasets: [
      {
        label: 'Total',
        data: financeiro12Meses.map(item => item.pl + item.fixo + item.exito),
        borderColor: '#15803d',
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 240);
          gradient.addColorStop(0, 'rgba(21, 128, 61, 0.3)');
          gradient.addColorStop(1, 'rgba(21, 128, 61, 0)');
          return gradient;
        },
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#15803d',
        pointBorderWidth: 2.5,
        fill: true,
        tension: 0.4
      }
    ]
  };

  // Opções para Entrada de Casos (com valores sempre visíveis)
  const entradaOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'white',
        titleColor: '#111827',
        bodyColor: '#111827',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        titleFont: {
          size: 12,
          weight: 'bold'
        },
        bodyFont: {
          size: 11,
          weight: 'bold'
        }
      },
      datalabels: {
        display: true,
        align: 'top',
        anchor: 'end',
        offset: 4,
        backgroundColor: '#1e3a8a',
        borderRadius: 6,
        color: 'white',
        font: {
          weight: 'bold',
          size: 11
        },
        padding: {
          top: 4,
          bottom: 4,
          left: 8,
          right: 8
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#e5e7eb'
        },
        ticks: {
          font: {
            size: 11,
            weight: 'bold'
          },
          color: '#6b7280',
          padding: 8
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 10,
            weight: 'bold'
          },
          color: '#6b7280',
          padding: 8
        }
      }
    }
  };

  // Opções para gráficos financeiros (sem valores sempre visíveis)
  const financeiroOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'white',
        titleColor: '#111827',
        bodyColor: '#111827',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        titleFont: {
          size: 12,
          weight: 'bold'
        },
        bodyFont: {
          size: 11,
          weight: 'bold'
        },
        callbacks: {
          label: (context) => formatMoney(context.parsed.y ?? 0)
        }
      },
      datalabels: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#e5e7eb'
        },
        ticks: {
          font: {
            size: 11,
            weight: 'bold'
          },
          color: '#6b7280',
          padding: 8,
          callback: (value) => formatCompact(Number(value) || 0)
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 10,
            weight: 'bold'
          },
          color: '#6b7280',
          padding: 8
        }
      }
    }
  };

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
            <div className="h-72">
              <Line data={entradaChartData} options={entradaOptions} />
            </div>
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
                <div className="h-60">
                  <Line data={propostasChartData} options={financeiroOptions} />
                </div>
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
                <div className="h-60">
                  <Line data={fechamentosChartData} options={financeiroOptions} />
                </div>
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