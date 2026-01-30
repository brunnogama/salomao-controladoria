import React from 'react';
import { Filter, ArrowRight, XCircle, Clock, TrendingDown } from 'lucide-react';

interface EfficiencyFunnelProps {
  funil: any;
}

export function EfficiencyFunnel({ funil }: EfficiencyFunnelProps) {
  return (
    <div className='bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all p-6'>
      
      {/* Header */}
      <div className='mb-6 pb-5 border-b border-gray-100'>
        <div className='flex items-center gap-3 mb-2'>
          <div className='p-2 rounded-xl bg-gradient-to-br from-[#112240] to-[#1e3a8a] text-white shadow-lg'>
            <TrendingDown className='w-5 h-5' />
          </div>
          <h2 className='text-[20px] font-black text-[#0a192f] tracking-tight'>
            Funil de Eficiência
          </h2>
        </div>
        <p className='text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-[48px]'>
          Taxa de conversão e tempo médio
        </p>
      </div>

      {/* Funil */}
      <div className='grid grid-cols-1 md:grid-cols-5 gap-4 items-center'>
        
        {/* Etapa 1 - Prospects */}
        <div className='md:col-span-1 relative'>
          <div className='bg-gradient-to-br from-[#112240] to-[#1e3a8a] p-5 rounded-xl border border-white/10 shadow-lg text-center group hover:shadow-blue-900/20 transition-all'>
            <p className='text-[10px] font-black text-white/60 uppercase tracking-[0.2em] mb-2'>
              1. Prospects
            </p>
            <p className='text-[30px] font-black text-white tracking-tight'>
              {funil.totalEntrada}
            </p>
          </div>
          <div className='hidden md:block absolute -right-5 top-1/2 -translate-y-1/2 z-10'>
            <ArrowRight className='w-5 h-5 text-gray-300' />
          </div>
        </div>

        {/* Conversão 1 -> 2 */}
        <div className='md:col-span-1 flex flex-col items-center justify-center space-y-3'>
          {/* Taxa de Conversão */}
          <div className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border bg-blue-50 text-blue-700 border-blue-100 shadow-sm'>
            {funil.taxaConversaoProposta}% Avançam
          </div>
          
          {/* Perdas */}
          <div className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border bg-red-50 text-red-700 border-red-100'>
            <XCircle className='w-3 h-3' />
            {funil.perdaAnalise} Perdas
          </div>
          
          {/* Tempo Médio */}
          <div className='flex flex-col items-center gap-1 p-2.5 rounded-xl bg-gray-50/50 border border-gray-100/80 min-w-[120px]'>
            <span className='text-[9px] font-black text-gray-400 uppercase tracking-wider'>
              Tempo Médio
            </span>
            <div className='flex items-center gap-1.5'>
              <Clock className='w-3 h-3 text-gray-500' />
              <span className='text-xs font-bold text-[#112240]'>
                {funil.tempoMedioProspectProposta} dias
              </span>
            </div>
          </div>
        </div>

        {/* Etapa 2 - Propostas */}
        <div className='md:col-span-1 relative'>
          <div className='bg-gradient-to-br from-[#1a2c4e] to-[#112240] p-5 rounded-xl border border-white/10 shadow-lg text-center group hover:shadow-blue-900/20 transition-all'>
            <p className='text-[10px] font-black text-white/60 uppercase tracking-[0.2em] mb-2'>
              2. Propostas
            </p>
            <p className='text-[30px] font-black text-white tracking-tight'>
              {funil.qualificadosProposta}
            </p>
          </div>
          <div className='hidden md:block absolute -right-5 top-1/2 -translate-y-1/2 z-10'>
            <ArrowRight className='w-5 h-5 text-gray-300' />
          </div>
        </div>

        {/* Conversão 2 -> 3 */}
        <div className='md:col-span-1 flex flex-col items-center justify-center space-y-3'>
          {/* Taxa de Conversão */}
          <div className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border bg-green-50 text-green-700 border-green-100 shadow-sm'>
            {funil.taxaConversaoFechamento}% Fecham
          </div>
          
          {/* Perdas */}
          <div className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border bg-red-50 text-red-700 border-red-100'>
            <XCircle className='w-3 h-3' />
            {funil.perdaNegociacao} Perdas
          </div>
          
          {/* Tempo Médio */}
          <div className='flex flex-col items-center gap-1 p-2.5 rounded-xl bg-gray-50/50 border border-gray-100/80 min-w-[120px]'>
            <span className='text-[9px] font-black text-gray-400 uppercase tracking-wider'>
              Tempo Médio
            </span>
            <div className='flex items-center gap-1.5'>
              <Clock className='w-3 h-3 text-gray-500' />
              <span className='text-xs font-bold text-[#112240]'>
                {funil.tempoMedioPropostaFechamento} dias
              </span>
            </div>
          </div>
        </div>

        {/* Etapa 3 - Fechados */}
        <div className='md:col-span-1'>
          <div className='bg-gradient-to-br from-green-700 to-green-600 p-5 rounded-xl border border-white/10 shadow-lg text-center group hover:shadow-green-900/20 transition-all'>
            <p className='text-[10px] font-black text-white/60 uppercase tracking-[0.2em] mb-2'>
              3. Fechados
            </p>
            <p className='text-[30px] font-black text-white tracking-tight'>
              {funil.fechados}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}