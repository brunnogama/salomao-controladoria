import React from 'react';
import { Briefcase, Banknote, TrendingUp, Users } from 'lucide-react';
import { formatMoney } from './dashboardHelpers';

interface PartnerStatsProps {
  contractsByPartner: any[];
}

export function PartnerStats({ contractsByPartner }: PartnerStatsProps) {
  return (
    <>
      {/* 7. CONTRATOS POR SÓCIO */}
      <div className='bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all p-6'>
        
        {/* Header */}
        <div className='mb-6 pb-5 border-b border-gray-100'>
          <div className='flex items-center gap-3 mb-2'>
            <div className='p-2 rounded-xl bg-gradient-to-br from-[#112240] to-[#1e3a8a] text-white shadow-lg'>
              <Briefcase className='w-5 h-5' />
            </div>
            <div>
              <h2 className='text-[20px] font-black text-[#0a192f] tracking-tight'>
                Contratos por Sócio
              </h2>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
                Distribuição por status
              </p>
            </div>
          </div>
        </div>

        {/* Grid de Sócios */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contractsByPartner.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-400">Nenhum dado disponível</p>
            </div>
          ) : (
            contractsByPartner.map((item, idx) => (
              <div 
                key={idx} 
                className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all"
              >
                {/* Header do Card */}
                <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-100">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-gray-800 text-sm truncate mb-1" title={item.name}>
                      {item.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
                        Total
                      </span>
                      <span className="text-sm font-black text-[#1e3a8a]">
                        {item.total}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Grid - Mais limpo */}
                <div className="grid grid-cols-2 gap-3">
                  {item.analysis > 0 && (
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
                        Análise
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black text-amber-600">
                          {item.analysis}
                        </span>
                        <span className="text-[9px] font-semibold text-gray-400">
                          ({Math.round((item.analysis / item.total) * 100)}%)
                        </span>
                      </div>
                    </div>
                  )}

                  {item.proposal > 0 && (
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
                        Proposta
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black text-blue-600">
                          {item.proposal}
                        </span>
                        <span className="text-[9px] font-semibold text-gray-400">
                          ({Math.round((item.proposal / item.total) * 100)}%)
                        </span>
                      </div>
                    </div>
                  )}

                  {item.active > 0 && (
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
                        Fechado
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black text-green-600">
                          {item.active}
                        </span>
                        <span className="text-[9px] font-semibold text-gray-400">
                          ({Math.round((item.active / item.total) * 100)}%)
                        </span>
                      </div>
                    </div>
                  )}

                  {item.rejected > 0 && (
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
                        Rejeitado
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black text-red-600">
                          {item.rejected}
                        </span>
                        <span className="text-[9px] font-semibold text-gray-400">
                          ({Math.round((item.rejected / item.total) * 100)}%)
                        </span>
                      </div>
                    </div>
                  )}

                  {item.probono > 0 && (
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
                        Probono
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black text-purple-600">
                          {item.probono}
                        </span>
                        <span className="text-[9px] font-semibold text-gray-400">
                          ({Math.round((item.probono / item.total) * 100)}%)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 8. VISÃO FINANCEIRA POR SÓCIO */}
      <div className='bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all p-6'>
        
        {/* Header */}
        <div className='mb-6 pb-5 border-b border-gray-100'>
          <div className='flex items-center gap-3 mb-2'>
            <div className='p-2 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg'>
              <Banknote className='w-5 h-5' />
            </div>
            <div>
              <h2 className='text-[20px] font-black text-[#0a192f] tracking-tight'>
                Visão Financeira por Sócio
              </h2>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
                Contratos fechados
              </p>
            </div>
          </div>
        </div>

        {/* Grid de Sócios */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contractsByPartner.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-400">Nenhum dado financeiro disponível</p>
            </div>
          ) : (
            contractsByPartner.map((item: any, idx) => {
              const totalSocio = (item.pl || 0) + (item.exito || 0) + (item.fixo || 0);
              
              return (
                <div 
                  key={idx} 
                  className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all"
                >
                  {/* Header do Card */}
                  <div className="mb-4 pb-4 border-b border-gray-100">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-black text-gray-800 text-sm truncate flex-1 min-w-0" title={item.name}>
                        {item.name}
                      </h3>
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider ml-2 whitespace-nowrap">
                        {item.active} Ativos
                      </span>
                    </div>
                    {/* Total Geral */}
                    <div className="flex items-baseline gap-2">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
                        Total
                      </span>
                      <span className="text-[20px] font-black text-[#1e3a8a] tracking-tight">
                        {formatMoney(totalSocio)}
                      </span>
                    </div>
                  </div>

                  {/* Breakdown Financeiro - Estilo minimalista */}
                  <div className="space-y-3">
                    {/* Pró-labore */}
                    {(item.pl || 0) > 0 && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-50">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">
                            Pró-labore
                          </span>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-sm font-black text-gray-800">
                            {formatMoney(item.pl || 0)}
                          </span>
                          <span className="text-[9px] font-semibold text-gray-400">
                            {Math.round(((item.pl || 0) / totalSocio) * 100)}%
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Êxito */}
                    {(item.exito || 0) > 0 && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-50">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">
                            Êxito
                          </span>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-sm font-black text-gray-800">
                            {formatMoney(item.exito || 0)}
                          </span>
                          <span className="text-[9px] font-semibold text-gray-400">
                            {Math.round(((item.exito || 0) / totalSocio) * 100)}%
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Fixo */}
                    {(item.fixo || 0) > 0 && (
                      <div className="flex justify-between items-center py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                          <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">
                            Fixo Mensal
                          </span>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-sm font-black text-gray-800">
                            {formatMoney(item.fixo || 0)}
                          </span>
                          <span className="text-[9px] font-semibold text-gray-400">
                            {Math.round(((item.fixo || 0) / totalSocio) * 100)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}