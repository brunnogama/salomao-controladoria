import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Camera, Clock, Briefcase, CheckCircle2, XCircle, HeartHandshake, Layers 
} from 'lucide-react';
import { formatMoney } from '../../utils/dashboardHelpers';

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
      <div className='lg:col-span-5 bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full flex flex-col'>
        <div className='flex items-center justify-between mb-4 border-b pb-4'>
          <div className='flex items-center gap-2'>
            <Camera className='text-[#0F2C4C]' size={24} />
            <div>
              <h2 className='text-xl font-bold text-gray-800'>Fotografia da Carteira Atual</h2>
              <p className='text-xs text-gray-600'>Quantidade atual por status.</p>
            </div>
          </div>
        </div>
        {/* --- CARDS CLICÁVEIS PARA DRILL-DOWN --- */}
        <div className='grid grid-cols-2 gap-3 flex-1 h-full'>
          <div onClick={() => handleDrillDown('analysis')} className='bg-yellow-50 p-2 h-full rounded-lg border border-yellow-100 text-center cursor-pointer hover:shadow-md transition-all'><Clock className='mx-auto text-yellow-600 mb-1' size={18} /><p className='text-xl font-bold text-yellow-800'>{metrics.geral.emAnalise}</p><p className='text-[10px] text-yellow-700 font-bold uppercase'>Sob Análise</p></div>
          <div onClick={() => handleDrillDown('proposal')} className='bg-blue-50 p-2 h-full rounded-lg border border-blue-100 text-center cursor-pointer hover:shadow-md transition-all'><Briefcase className='mx-auto text-blue-600 mb-1' size={18} /><p className='text-xl font-bold text-blue-800'>{metrics.geral.propostasAtivas}</p><p className='text-[10px] text-blue-700 font-bold uppercase'>Propostas</p></div>
          <div onClick={() => handleDrillDown('active')} className='bg-green-50 p-2 h-full rounded-lg border border-green-100 text-center cursor-pointer hover:shadow-md transition-all'><CheckCircle2 className='mx-auto text-green-600 mb-1' size={18} /><p className='text-xl font-bold text-green-800'>{metrics.geral.fechados}</p><p className='text-[10px] text-green-700 font-bold uppercase'>Fechados</p></div>
          <div onClick={() => handleDrillDown('rejected')} className='bg-red-50 p-2 h-full rounded-lg border border-red-100 text-center cursor-pointer hover:shadow-md transition-all'><XCircle className='mx-auto text-red-600 mb-1' size={18} /><p className='text-xl font-bold text-red-800'>{metrics.geral.rejeitados}</p><p className='text-[10px] text-red-700 font-bold uppercase'>Rejeitados</p></div>
          <div onClick={() => handleDrillDown('probono')} className='bg-purple-50 p-2 h-full rounded-lg border border-purple-100 text-center cursor-pointer hover:shadow-md transition-all'><HeartHandshake className='mx-auto text-purple-600 mb-1' size={18} /><p className='text-xl font-bold text-purple-800'>{metrics.geral.probono}</p><p className='text-[10px] text-purple-700 font-bold uppercase'>Probono</p></div>
          <div onClick={() => handleDrillDown('all')} className='bg-gray-50 p-2 h-full rounded-lg border border-gray-200 text-center cursor-pointer hover:shadow-md transition-all'><Layers className='mx-auto text-gray-600 mb-1' size={18} /><p className='text-xl font-bold text-gray-800'>{metrics.geral.totalCasos}</p><p className='text-[10px] text-gray-700 font-bold uppercase'>Total Geral</p></div>
        </div>
      </div>

      {/* Direita: Fotografia Financeira Total */}
      <div className='lg:col-span-7 bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full flex flex-col'>
        <div className='border-b pb-4 mb-6'>
          <h3 className='font-bold text-xl text-gray-800 flex items-center gap-2'><Camera className='text-[#0F2C4C]' size={24} /> Fotografia Financeira Total</h3>
          <p className='text-xs text-gray-600 mt-1'>Visão consolidada de oportunidades e receita garantida.</p>
        </div>
        
        <div className='grid grid-cols-1 md:grid-cols-2 gap-8 flex-1'>
          {/* Coluna Propostas */}
          <div className="flex flex-col justify-between h-full">
            <div>
              <p className='text-xs text-blue-600 font-bold uppercase mb-4'>Valores das Propostas Enviadas</p>
              <div className='space-y-3'>
                {/* Items */}
                <div className="flex justify-between items-baseline"><span className='text-xs text-gray-500 font-medium'>Pró-labore</span><span className='text-xl font-bold text-gray-700'>{formatMoney(metrics.geral.valorEmNegociacaoPL)}</span></div>
                <div className="flex justify-between items-baseline"><span className='text-xs text-gray-500 font-medium'>Êxito Total</span><span className='text-xl font-bold text-gray-700'>{formatMoney(metrics.geral.valorEmNegociacaoExito)}</span></div>
                <div className="flex justify-between items-baseline"><span className='text-xs text-gray-500 font-medium'>Fixo Mensal</span><span className='text-xl font-bold text-gray-700'>{formatMoney((metrics.geral as any).valorEmNegociacaoMensal || 0)}</span></div>
                <div className="flex justify-between items-baseline"><span className='text-xs text-gray-500 font-medium'>Outros Honorários</span><span className='text-xl font-bold text-gray-700'>{formatMoney((metrics.geral as any).valorEmNegociacaoOutros || 0)}</span></div>
                
                <div className='flex justify-between items-end border-t border-gray-200 pt-3 mt-2'>
                  <span className='text-sm font-bold text-gray-600 uppercase tracking-wider'>TOTAL GERAL</span>
                  <span className='text-xl font-bold text-[#0F2C4C]'>{formatMoney(totalNegociacao)}</span>
                </div>
              </div>
            </div>
            {/* Médias */}
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="flex justify-between items-center text-[10px] text-gray-500"><span>Média Pró-labore (12m)</span><span className="font-bold text-blue-600">{formatMoney(metrics.geral.mediaMensalNegociacaoPL)}</span></div>
              <div className="flex justify-between items-center text-[10px] text-gray-500 mt-1"><span>Média Êxito (12m)</span><span className="font-bold text-blue-600">{formatMoney(metrics.geral.mediaMensalNegociacaoExito)}</span></div>
            </div>
          </div>

          {/* Coluna Contratos Fechados */}
          <div className='md:border-l md:pl-8 border-gray-100 flex flex-col justify-between h-full'>
            <div>
              <p className='text-xs text-green-600 font-bold uppercase mb-4'>Valores dos Contratos Fechados</p>
              <div className='space-y-3'>
                 {/* Items */}
                <div className="flex justify-between items-baseline"><span className='text-xs text-gray-500 font-medium'>Pró-labore</span><span className='text-xl font-bold text-green-700'>{formatMoney(metrics.geral.totalFechadoPL)}</span></div>
                <div className="flex justify-between items-baseline"><span className='text-xs text-gray-500 font-medium'>Êxito Total</span><span className='text-xl font-bold text-green-700'>{formatMoney(metrics.geral.totalFechadoExito)}</span></div>
                <div className="flex justify-between items-baseline"><span className='text-xs text-gray-500 font-medium'>Fixo Mensal</span><span className='text-xl font-bold text-green-700'>{formatMoney(metrics.geral.receitaRecorrenteAtiva)}</span></div>
                <div className="flex justify-between items-baseline"><span className='text-xs text-gray-500 font-medium'>Outros Honorários</span><span className='text-xl font-bold text-green-700'>{formatMoney((metrics.geral as any).totalFechadoOutros || 0)}</span></div>

                <div className='flex justify-between items-end border-t border-gray-200 pt-3 mt-2'>
                  <span className='text-sm font-bold text-gray-600 uppercase tracking-wider'>TOTAL GERAL</span>
                  <span className='text-xl font-bold text-green-700'>{formatMoney(totalCarteira)}</span>
                </div>
              </div>
            </div>
            {/* Médias */}
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="flex justify-between items-center text-[10px] text-gray-500"><span>Média Pró-labore (12m)</span><span className="font-bold text-green-600">{formatMoney(metrics.geral.mediaMensalCarteiraPL)}</span></div>
              <div className="flex justify-between items-center text-[10px] text-gray-500 mt-1"><span>Média Êxito (12m)</span><span className="font-bold text-green-600">{formatMoney(metrics.geral.mediaMensalCarteiraExito)}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}