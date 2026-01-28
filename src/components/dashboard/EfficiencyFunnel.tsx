import React from 'react';
import { Filter, ArrowRight, XCircle, Clock } from 'lucide-react';

interface EfficiencyFunnelProps {
  funil: any;
}

export function EfficiencyFunnel({ funil }: EfficiencyFunnelProps) {
  return (
    <div className='bg-white p-6 rounded-2xl shadow-sm border border-gray-200'>
      <div className='flex items-center gap-2 mb-6 border-b pb-4'>
        <Filter className='text-blue-600' size={24} />
        <div>
          <h2 className='text-xl font-bold text-gray-800'>Funil de Eficiência</h2>
          <p className='text-xs text-gray-600'>Taxa de conversão e tempo médio.</p>
        </div>
      </div>
      <div className='grid grid-cols-1 md:grid-cols-5 gap-4 items-center'>
        {/* Etapa 1 */}
        <div className='md:col-span-1 bg-gray-50 p-4 rounded-xl border border-gray-200 text-center relative'>
          <p className='text-xs font-bold text-gray-600 uppercase tracking-wider'>1. Prospects</p>
          <p className='text-3xl font-bold text-gray-800 mt-2'>{funil.totalEntrada}</p>
          <div className='hidden md:block absolute -right-6 top-1/2 -translate-y-1/2 z-10'>
            <ArrowRight className='text-gray-300' />
          </div>
        </div>

        {/* Conversão 1 -> 2 */}
        <div className='md:col-span-1 flex flex-col items-center justify-center space-y-3'>
          <div className='bg-blue-50 text-blue-700 border border-blue-100 text-xs font-bold px-3 py-1 rounded-full shadow-sm'>
            {funil.taxaConversaoProposta}% Avançam
          </div>
          <div className='text-[10px] text-red-500 flex items-center gap-1 opacity-80'>
            <XCircle size={10} /> {funil.perdaAnalise} Rejeitados
          </div>
          <div className='flex flex-col items-center mt-1'>
            <span className='text-[9px] text-gray-500 uppercase font-bold mb-1'>Tempo Médio</span>
            <span className='text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded-md border border-gray-200 flex items-center gap-1'>
              <Clock size={10} /> {funil.tempoMedioProspectProposta} dias
            </span>
          </div>
        </div>

        {/* Etapa 2 */}
        <div className='md:col-span-1 bg-blue-50 p-4 rounded-xl border border-blue-100 text-center relative'>
          <p className='text-xs font-bold text-blue-600 uppercase tracking-wider'>2. Propostas</p>
          <p className='text-3xl font-bold text-blue-900 mt-2'>{funil.qualificadosProposta}</p>
          <div className='hidden md:block absolute -right-6 top-1/2 -translate-y-1/2 z-10'>
            <ArrowRight className='text-blue-200' />
          </div>
        </div>

        {/* Conversão 2 -> 3 */}
        <div className='md:col-span-1 flex flex-col items-center justify-center space-y-3'>
          <div className='bg-green-50 text-green-700 border border-green-100 text-xs font-bold px-3 py-1 rounded-full shadow-sm'>
            {funil.taxaConversaoFechamento}% Fecham
          </div>
          <div className='text-[10px] text-red-500 flex items-center gap-1 opacity-80'>
            <XCircle size={10} /> {funil.perdaNegociacao} Rejeitados
          </div>
          <div className='flex flex-col items-center mt-1'>
            <span className='text-[9px] text-blue-400 uppercase font-bold mb-1'>Tempo Médio</span>
            <span className='text-xs font-bold text-blue-800 bg-blue-50/50 px-2 py-1 rounded-md border border-blue-100 flex items-center gap-1'>
              <Clock size={10} /> {funil.tempoMedioPropostaFechamento} dias
            </span>
          </div>
        </div>

        {/* Etapa 3 */}
        <div className='md:col-span-1 bg-green-50 p-4 rounded-xl border border-green-100 text-center'>
          <p className='text-xs font-bold text-green-600 uppercase tracking-wider'>3. Fechados</p>
          <p className='text-3xl font-bold text-green-900 mt-2'>{funil.fechados}</p>
        </div>
      </div>
    </div>
  );
}