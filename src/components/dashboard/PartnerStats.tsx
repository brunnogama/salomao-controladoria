import React from 'react';
import { Briefcase, Banknote } from 'lucide-react';
import { formatMoney } from './dashboardHelpers';

interface PartnerStatsProps {
  contractsByPartner: any[];
}

export function PartnerStats({ contractsByPartner }: PartnerStatsProps) {
  return (
    <>
      {/* 7. CONTRATOS POR SÓCIO */}
      <div className='bg-white p-6 rounded-xl shadow-sm border border-gray-100'>
        <div className='flex items-center gap-2 mb-6 border-b pb-4'>
          <Briefcase className='text-blue-600' size={24} />
          <div>
            <h2 className='text-xl font-bold text-gray-800'>Contratos por Sócio</h2>
            <p className='text-xs text-gray-600'>Distribuição detalhada por status.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> 
          {contractsByPartner.length === 0 ? <p className="text-sm text-gray-500 col-span-3 text-center py-8">Nenhum dado de sócio disponível.</p> : contractsByPartner.map((item, idx) => (
            <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-gray-800 text-sm truncate" title={item.name}>{item.name}</span>
                <span className="text-[10px] font-bold text-gray-600 bg-white border border-gray-200 px-2 py-0.5 rounded-full">{item.total} Casos</span>
              </div>
              <div className="space-y-1.5">
                {item.analysis > 0 && (
                  <div className="flex items-center text-[10px]">
                    <span className="w-16 text-yellow-600 font-medium">Análise</span>
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full mx-2 overflow-hidden">
                      <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${(item.analysis / item.total) * 100}%` }}></div>
                    </div>
                    <span className="w-8 text-right text-gray-600">{item.analysis}</span>
                  </div>
                )}
                {item.proposal > 0 && (
                  <div className="flex items-center text-[10px]">
                    <span className="w-16 text-blue-600 font-medium">Proposta</span>
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full mx-2 overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(item.proposal / item.total) * 100}%` }}></div>
                    </div>
                    <span className="w-8 text-right text-gray-600">{item.proposal}</span>
                  </div>
                )}
                {item.active > 0 && (
                  <div className="flex items-center text-[10px]">
                    <span className="w-16 text-green-600 font-medium">Fechado</span>
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full mx-2 overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${(item.active / item.total) * 100}%` }}></div>
                    </div>
                    <span className="w-8 text-right text-gray-600">{item.active}</span>
                  </div>
                )}
                {item.rejected > 0 && (
                  <div className="flex items-center text-[10px]">
                    <span className="w-16 text-red-600 font-medium">Rejeitado</span>
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full mx-2 overflow-hidden">
                      <div className="h-full bg-red-400 rounded-full" style={{ width: `${(item.rejected / item.total) * 100}%` }}></div>
                    </div>
                    <span className="w-8 text-right text-gray-600">{item.rejected}</span>
                  </div>
                )}
                {item.probono > 0 && (
                  <div className="flex items-center text-[10px]">
                    <span className="w-16 text-purple-600 font-medium">Probono</span>
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full mx-2 overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(item.probono / item.total) * 100}%` }}></div>
                    </div>
                    <span className="w-8 text-right text-gray-600">{item.probono}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 8. VISÃO SÓCIOS (FINANCEIRA) */}
      <div className='bg-white p-6 rounded-xl shadow-sm border border-gray-200'>
        <div className='flex items-center gap-2 mb-6 border-b pb-4'>
          <Banknote className='text-salomao-gold' size={24} />
          <div>
            <h2 className='text-xl font-bold text-gray-800'>Visão Financeira por Sócio</h2>
            <p className='text-xs text-gray-600'>Distribuição de valores por sócio (Contratos Fechados).</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> 
          {contractsByPartner.length === 0 ? <p className="text-sm text-gray-500 col-span-3 text-center py-8">Nenhum dado financeiro disponível.</p> : contractsByPartner.map((item: any, idx) => {
            const totalSocio = (item.pl || 0) + (item.exito || 0) + (item.fixo || 0);
            return (
              <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold text-gray-800 text-sm truncate" title={item.name}>{item.name}</span>
                  <span className="text-[10px] font-bold text-gray-600 bg-white border border-gray-200 px-2 py-0.5 rounded-full">{item.active} Ativos</span>
                </div>
                <div className="space-y-2">
                  {/* Pró-labore */}
                  <div className="flex flex-col">
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-gray-600 font-medium">Pró-labore</span>
                      <span className="font-bold text-gray-800">{formatMoney(item.pl || 0)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${totalSocio > 0 ? ((item.pl || 0) / totalSocio) * 100 : 0}%` }}></div>
                    </div>
                  </div>
                  
                  {/* Êxito */}
                  <div className="flex flex-col">
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-gray-600 font-medium">Êxito</span>
                      <span className="font-bold text-gray-800">{formatMoney(item.exito || 0)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${totalSocio > 0 ? ((item.exito || 0) / totalSocio) * 100 : 0}%` }}></div>
                    </div>
                  </div>

                  {/* Fixo */}
                  <div className="flex flex-col">
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-gray-600 font-medium">Fixo</span>
                      <span className="font-bold text-gray-800">{formatMoney(item.fixo || 0)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${totalSocio > 0 ? ((item.fixo || 0) / totalSocio) * 100 : 0}%` }}></div>
                    </div>
                  </div>
                  
                  <div className="pt-2 mt-1 border-t border-gray-200 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Total</span>
                    <span className="text-xs font-bold text-salomao-blue">{formatMoney(totalSocio)}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  );
}