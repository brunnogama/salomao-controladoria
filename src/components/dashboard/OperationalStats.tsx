import React from 'react';
import { Ban, FileSignature, CheckCircle2, AlertCircle, Percent } from 'lucide-react';

interface OperationalStatsProps {
  rejectionData: {
    reasons: any[];
    sources: any[];
  };
  metrics: any;
}

export function OperationalStats({ rejectionData, metrics }: OperationalStatsProps) {
  // Cálculo de Assinatura
  const totalAssinaturasCalculo = (metrics?.geral?.assinados || 0) + (metrics?.geral?.naoAssinados || 0);
  const percentualSemAssinatura = totalAssinaturasCalculo > 0 
    ? ((metrics?.geral?.naoAssinados || 0) / totalAssinaturasCalculo) * 100 
    : 0;

  return (
    <>
      {/* --- ANALISE DE REJEIÇÕES --- */}
      <div className='bg-white p-6 rounded-xl shadow-sm border border-gray-100'>
        <div className='flex items-center gap-2 mb-6 border-b pb-4'>
          <Ban className='text-red-600' size={24} />
          <div>
            <h2 className='text-xl font-bold text-gray-800'>Análise de Rejeições</h2>
            <p className='text-xs text-gray-600'>Motivos e origens dos casos declinados.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Por Motivo */}
          <div>
            <h4 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide border-l-4 border-red-400 pl-2">Por Motivo</h4>
            <div className="space-y-4">
              {rejectionData.reasons.length === 0 ? <p className="text-sm text-gray-500">Nenhum dado.</p> : rejectionData.reasons.map((item, idx) => (
                <div key={idx} className="group">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-gray-700">{item.label}</span>
                    <span className="text-gray-600">{item.value} ({item.percent.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div className="bg-red-400 h-2.5 rounded-full group-hover:bg-red-500 transition-colors" style={{ width: `${item.percent}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Quem Rejeitou */}
          <div>
            <h4 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide border-l-4 border-gray-400 pl-2">Quem Rejeitou</h4>
            <div className="space-y-4">
              {rejectionData.sources.length === 0 ? <p className="text-sm text-gray-500">Nenhum dado.</p> : rejectionData.sources.map((item, idx) => (
                <div key={idx} className="group">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-gray-700">{item.label}</span>
                    <span className="text-gray-600">{item.value} ({item.percent.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div className="bg-gray-400 h-2.5 rounded-full group-hover:bg-gray-500 transition-colors" style={{ width: `${item.percent}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- ASSINATURAS --- */}
      <div className='bg-white p-6 rounded-xl shadow-sm border border-gray-100'>
        <div className='flex items-center gap-2 mb-6 border-b pb-4'>
          <FileSignature className='text-[#0F2C4C]' size={24} />
          <div>
            <h2 className='text-xl font-bold text-gray-800'>Status de Assinatura de Contratos</h2>
            <p className='text-xs text-gray-600'>Acompanhamento de assinaturas físicas dos contratos fechados.</p>
          </div>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div className='bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-xl border-2 border-emerald-200'>
            <div className='flex items-center justify-between mb-4'>
              <div>
                <p className='text-xs text-emerald-700 font-bold uppercase tracking-wider mb-2'>Contratos Assinados</p>
                <p className='text-4xl font-black text-emerald-900'>{metrics.geral.assinados}</p>
              </div>
              <div className='p-3 bg-emerald-200 rounded-full'><CheckCircle2 size={24} className='text-emerald-700' /></div>
            </div>
            <div className='text-xs text-emerald-700 font-medium'>Contratos com assinatura física confirmada</div>
          </div>
          
          <div className='bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border-2 border-orange-200'>
            <div className='flex items-center justify-between mb-4'>
              <div>
                <p className='text-xs text-orange-700 font-bold uppercase tracking-wider mb-2'>Pendentes de Assinatura</p>
                <p className='text-4xl font-black text-orange-900'>{metrics.geral.naoAssinados}</p>
              </div>
              <div className='p-3 bg-orange-200 rounded-full'><AlertCircle size={24} className='text-orange-700' /></div>
            </div>
            <div className='text-xs text-orange-700 font-medium'>Contratos fechados aguardando assinatura física</div>
          </div>

          <div className='bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border-2 border-gray-200'>
            <div className='flex items-center justify-between mb-4'>
              <div>
                <p className='text-xs text-gray-700 font-bold uppercase tracking-wider mb-2'>% Pendente</p>
                <p className='text-4xl font-black text-gray-900'>{percentualSemAssinatura.toFixed(1)}%</p>
              </div>
              <div className='p-3 bg-gray-200 rounded-full'><Percent size={24} className='text-gray-700' /></div>
            </div>
            <div className='text-xs text-gray-700 font-medium'>Percentual de contratos sem assinatura</div>
          </div>
        </div>
      </div>
    </>
  );
}