import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Camera, Clock, Briefcase, CheckCircle2, XCircle, HeartHandshake, Layers 
} from 'lucide-react';
import { formatMoney } from './dashboardHelpers';

interface PortfolioFinancialOverviewProps {
  metrics: any;
}

export function PortfolioFinancialOverview({ metrics }: PortfolioFinancialOverviewProps) {
  const navigate = useNavigate();

  const handleDrillDown = (status: string) => {
    navigate('/contratos', { state: { status } });
  };

  // Cálculos protegidos
  const totalCarteira = (metrics?.geral?.totalFechadoPL || 0) + 
                        (metrics?.geral?.totalFechadoExito || 0) + 
                        (metrics?.geral?.receitaRecorrenteAtiva || 0) + 
                        ((metrics?.geral as any)?.totalFechadoOutros || 0);

  const totalNegociacao = (metrics?.geral?.valorEmNegociacaoPL || 0) + 
                          (metrics?.geral?.valorEmNegociacaoExito || 0) +
                          ((metrics?.geral as any)?.valorEmNegociacaoMensal || 0) +
                          ((metrics?.geral as any)?.valorEmNegociacaoOutros || 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Esquerda: Fotografia da Carteira Atual (Cards) */}
      <div className='lg:col-span-5 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all p-6 h-full flex flex-col'>
        
        {/* Header */}
        <div className='mb-6 pb-5 border-b border-gray-100'>
          <div className='flex items-center gap-3 mb-2'>
            <div className='p-2 rounded-xl bg-gradient-to-br from-[#112240] to-[#1e3a8a] text-white shadow-lg'>
              <Camera className='w-5 h-5' />
            </div>
            <h2 className='text-[20px] font-black text-[#0a192f] tracking-tight'>
              Fotografia da Carteira Atual
            </h2>
          </div>
          <p className='text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-[48px]'>
            Quantidade atual por status
          </p>
        </div>

        {/* Cards Clicáveis para Drill-Down */}
        <div className='grid grid-cols-2 gap-3 flex-1'>
          
          {/* Sob Análise */}
          <button 
            onClick={() => handleDrillDown('analysis')} 
            className='bg-gradient-to-br from-amber-600 to-amber-500 p-4 rounded-xl border border-white/10 shadow-lg text-center cursor-pointer hover:shadow-amber-900/20 transition-all hover:scale-[1.02] active:scale-95 group'
          >
            <Clock className='mx-auto text-white mb-2 group-hover:scale-110 transition-all' size={20} />
            <p className='text-[24px] font-black text-white tracking-tight'>
              {metrics.geral.emAnalise}
            </p>
            <p className='text-[9px] text-white font-black uppercase tracking-widest mt-1'>
              Sob Análise
            </p>
          </button>

          {/* Propostas */}
          <button 
            onClick={() => handleDrillDown('proposal')} 
            className='bg-gradient-to-br from-[#112240] to-[#1e3a8a] p-4 rounded-xl border border-white/10 shadow-lg text-center cursor-pointer hover:shadow-blue-900/20 transition-all hover:scale-[1.02] active:scale-95 group'
          >
            <Briefcase className='mx-auto text-white mb-2 group-hover:scale-110 transition-all' size={20} />
            <p className='text-[24px] font-black text-white tracking-tight'>
              {metrics.geral.propostasAtivas}
            </p>
            <p className='text-[9px] text-white font-black uppercase tracking-widest mt-1'>
              Propostas
            </p>
          </button>

          {/* Fechados */}
          <button 
            onClick={() => handleDrillDown('active')} 
            className='bg-gradient-to-br from-green-700 to-green-600 p-4 rounded-xl border border-white/10 shadow-lg text-center cursor-pointer hover:shadow-green-900/20 transition-all hover:scale-[1.02] active:scale-95 group'
          >
            <CheckCircle2 className='mx-auto text-white mb-2 group-hover:scale-110 transition-all' size={20} />
            <p className='text-[24px] font-black text-white tracking-tight'>
              {metrics.geral.fechados}
            </p>
            <p className='text-[9px] text-white font-black uppercase tracking-widest mt-1'>
              Fechados
            </p>
          </button>

          {/* Rejeitados */}
          <button 
            onClick={() => handleDrillDown('rejected')} 
            className='bg-gradient-to-br from-red-600 to-red-500 p-4 rounded-xl border border-white/10 shadow-lg text-center cursor-pointer hover:shadow-red-900/20 transition-all hover:scale-[1.02] active:scale-95 group'
          >
            <XCircle className='mx-auto text-white mb-2 group-hover:scale-110 transition-all' size={20} />
            <p className='text-[24px] font-black text-white tracking-tight'>
              {metrics.geral.rejeitados}
            </p>
            <p className='text-[9px] text-white font-black uppercase tracking-widest mt-1'>
              Rejeitados
            </p>
          </button>

          {/* Probono */}
          <button 
            onClick={() => handleDrillDown('probono')} 
            className='bg-gradient-to-br from-purple-700 to-purple-600 p-4 rounded-xl border border-white/10 shadow-lg text-center cursor-pointer hover:shadow-purple-900/20 transition-all hover:scale-[1.02] active:scale-95 group'
          >
            <HeartHandshake className='mx-auto text-white mb-2 group-hover:scale-110 transition-all' size={20} />
            <p className='text-[24px] font-black text-white tracking-tight'>
              {metrics.geral.probono}
            </p>
            <p className='text-[9px] text-white font-black uppercase tracking-widest mt-1'>
              Probono
            </p>
          </button>

          {/* Total Geral */}
          <button 
            onClick={() => handleDrillDown('all')} 
            className='bg-gradient-to-br from-[#1a2c4e] to-[#112240] p-4 rounded-xl border border-white/10 shadow-lg text-center cursor-pointer hover:shadow-blue-900/20 transition-all hover:scale-[1.02] active:scale-95 group'
          >
            <Layers className='mx-auto text-white mb-2 group-hover:scale-110 transition-all' size={20} />
            <p className='text-[24px] font-black text-white tracking-tight'>
              {metrics.geral.totalCasos}
            </p>
            <p className='text-[9px] text-white font-black uppercase tracking-widest mt-1'>
              Total Geral
            </p>
          </button>
        </div>
      </div>

      {/* Direita: Fotografia Financeira Total */}
      <div className='lg:col-span-7 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all p-6 h-full flex flex-col'>
        
        {/* Header */}
        <div className='mb-6 pb-5 border-b border-gray-100'>
          <div className='flex items-center gap-3 mb-2'>
            <div className='p-2 rounded-xl bg-gradient-to-br from-[#112240] to-[#1e3a8a] text-white shadow-lg'>
              <Camera className='w-5 h-5' />
            </div>
            <h2 className='text-[20px] font-black text-[#0a192f] tracking-tight'>
              Fotografia Financeira Total
            </h2>
          </div>
          <p className='text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-[48px]'>
            Visão consolidada de oportunidades e receita garantida
          </p>
        </div>
        
        <div className='grid grid-cols-1 md:grid-cols-2 gap-8 flex-1'>
          
          {/* Coluna Propostas Enviadas */}
          <div className="flex flex-col justify-between h-full">
            <div>
              <p className='text-[9px] font-black text-blue-600 uppercase tracking-widest mb-4'>
                Valores das Propostas Enviadas
              </p>
              <div className='space-y-3'>
                {/* Items */}
                <div className="flex justify-between items-baseline">
                  <span className='text-xs font-semibold text-gray-500'>Pró-labore</span>
                  <span className='text-[20px] font-black text-gray-700 tracking-tight'>
                    {formatMoney(metrics.geral.valorEmNegociacaoPL)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className='text-xs font-semibold text-gray-500'>Êxito Total</span>
                  <span className='text-[20px] font-black text-gray-700 tracking-tight'>
                    {formatMoney(metrics.geral.valorEmNegociacaoExito)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className='text-xs font-semibold text-gray-500'>Fixo Mensal</span>
                  <span className='text-[20px] font-black text-gray-700 tracking-tight'>
                    {formatMoney((metrics.geral as any).valorEmNegociacaoMensal || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className='text-xs font-semibold text-gray-500'>Outros Honorários</span>
                  <span className='text-[20px] font-black text-gray-700 tracking-tight'>
                    {formatMoney((metrics.geral as any).valorEmNegociacaoOutros || 0)}
                  </span>
                </div>
                
                {/* Total */}
                <div className='flex justify-between items-end border-t border-gray-200 pt-3 mt-4'>
                  <span className='text-[9px] font-black text-gray-500 uppercase tracking-widest'>
                    Total Geral
                  </span>
                  <span className='text-[24px] font-black text-[#1e3a8a] tracking-tight'>
                    {formatMoney(totalNegociacao)}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Médias */}
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
              <div className="flex justify-between items-center">
                <span className='text-[9px] font-black text-gray-400 uppercase tracking-wider'>
                  Média Pró-labore (12m)
                </span>
                <span className="text-sm font-bold text-blue-600">
                  {formatMoney(metrics.geral.mediaMensalNegociacaoPL)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className='text-[9px] font-black text-gray-400 uppercase tracking-wider'>
                  Média Êxito (12m)
                </span>
                <span className="text-sm font-bold text-blue-600">
                  {formatMoney(metrics.geral.mediaMensalNegociacaoExito)}
                </span>
              </div>
            </div>
          </div>

          {/* Coluna Contratos Fechados */}
          <div className='md:border-l md:pl-8 border-gray-100 flex flex-col justify-between h-full'>
            <div>
              <p className='text-[9px] font-black text-green-600 uppercase tracking-widest mb-4'>
                Valores dos Contratos Fechados
              </p>
              <div className='space-y-3'>
                {/* Items */}
                <div className="flex justify-between items-baseline">
                  <span className='text-xs font-semibold text-gray-500'>Pró-labore</span>
                  <span className='text-[20px] font-black text-green-700 tracking-tight'>
                    {formatMoney(metrics.geral.totalFechadoPL)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className='text-xs font-semibold text-gray-500'>Êxito Total</span>
                  <span className='text-[20px] font-black text-green-700 tracking-tight'>
                    {formatMoney(metrics.geral.totalFechadoExito)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className='text-xs font-semibold text-gray-500'>Fixo Mensal</span>
                  <span className='text-[20px] font-black text-green-700 tracking-tight'>
                    {formatMoney(metrics.geral.receitaRecorrenteAtiva)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className='text-xs font-semibold text-gray-500'>Outros Honorários</span>
                  <span className='text-[20px] font-black text-green-700 tracking-tight'>
                    {formatMoney((metrics.geral as any).totalFechadoOutros || 0)}
                  </span>
                </div>

                {/* Total */}
                <div className='flex justify-between items-end border-t border-gray-200 pt-3 mt-4'>
                  <span className='text-[9px] font-black text-gray-500 uppercase tracking-widest'>
                    Total Geral
                  </span>
                  <span className='text-[24px] font-black text-green-700 tracking-tight'>
                    {formatMoney(totalCarteira)}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Médias */}
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
              <div className="flex justify-between items-center">
                <span className='text-[9px] font-black text-gray-400 uppercase tracking-wider'>
                  Média Pró-labore (12m)
                </span>
                <span className="text-sm font-bold text-green-600">
                  {formatMoney(metrics.geral.mediaMensalCarteiraPL)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className='text-[9px] font-black text-gray-400 uppercase tracking-wider'>
                  Média Êxito (12m)
                </span>
                <span className="text-sm font-bold text-green-600">
                  {formatMoney(metrics.geral.mediaMensalCarteiraExito)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}