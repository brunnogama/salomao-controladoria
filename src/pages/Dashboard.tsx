import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Users, Briefcase, FileText, TrendingUp, 
  ArrowUpRight, ArrowDownRight, Activity, 
  Calendar, DollarSign, XCircle, HeartHandshake,
  Loader2
} from 'lucide-react';
import { Contract } from '../types';
import { parseCurrency } from '../utils/masks';

export function Dashboard() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    activeCount: 0,
    analysisCount: 0,
    totalValue: 0,
    monthlyAverage: 0, // Novo campo
    weeklyStats: {
      analysis: 0,
      proposal: 0,
      active: 0,
      rejected: 0, // Novo
      probono: 0   // Novo
    }
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contracts')
        .select('*');

      if (error) throw error;

      if (data) {
        calculateMetrics(data);
        setContracts(data);
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função auxiliar para checar se a data cai na semana atual (Domingo a Sábado)
  const isDateInCurrentWeek = (dateString?: string) => {
    if (!dateString) return false;
    
    const date = new Date(dateString + 'T12:00:00'); // Normaliza fuso
    const today = new Date();
    
    const currentDay = today.getDay(); // 0 (Dom) a 6 (Sab)
    
    // Define inicio da semana (Domingo)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDay);
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Define fim da semana (Sábado)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return date >= startOfWeek && date <= endOfWeek;
  };

  const calculateMetrics = (data: Contract[]) => {
    // Totais Gerais
    const activeContracts = data.filter(c => c.status === 'active');
    const activeCount = activeContracts.length;
    const analysisCount = data.filter(c => c.status === 'analysis').length;

    // Fotografia Financeira (Considerando apenas ativos para o valor real)
    let totalValue = 0;
    let totalMonthlyFixed = 0;

    activeContracts.forEach(c => {
      // Soma Êxito Final
      totalValue += parseCurrency(c.final_success_fee);
      
      // Soma Pró-labore
      totalValue += parseCurrency(c.pro_labore);
      
      // Soma Outros
      totalValue += parseCurrency(c.other_fees);

      // Soma Fixos Mensais (Média Mensal)
      const fixedVal = parseCurrency(c.fixed_monthly_fee);
      totalValue += fixedVal; // Adiciona ao totalzão
      totalMonthlyFixed += fixedVal; // Soma para média mensal recorrente

      // Soma Intermediários
      if (c.intermediate_fees && Array.isArray(c.intermediate_fees)) {
        c.intermediate_fees.forEach(fee => totalValue += parseCurrency(fee));
      }
    });

    // Estatísticas da Semana (Baseado na Data do Status)
    const weeklyStats = {
      analysis: 0,
      proposal: 0,
      active: 0,
      rejected: 0,
      probono: 0
    };

    data.forEach(c => {
      // Análise -> Data Prospect
      if (c.status === 'analysis' && isDateInCurrentWeek(c.prospect_date)) {
        weeklyStats.analysis++;
      }
      // Proposta -> Data Proposta
      if (c.status === 'proposal' && isDateInCurrentWeek(c.proposal_date)) {
        weeklyStats.proposal++;
      }
      // Ativo -> Data Assinatura
      if (c.status === 'active' && isDateInCurrentWeek(c.contract_date)) {
        weeklyStats.active++;
      }
      // Rejeitado -> Data Rejeição
      if (c.status === 'rejected' && isDateInCurrentWeek(c.rejection_date)) {
        weeklyStats.rejected++;
      }
      // Probono -> Data Probono ou Contrato
      if (c.status === 'probono' && isDateInCurrentWeek(c.probono_date || c.contract_date)) {
        weeklyStats.probono++;
      }
    });

    setMetrics({
      activeCount,
      analysisCount,
      totalValue,
      monthlyAverage: totalMonthlyFixed,
      weeklyStats
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="w-8 h-8 text-salomao-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-salomao-blue">Visão Geral</h1>
          <p className="text-gray-500 mt-1">Acompanhe os indicadores chave do escritório.</p>
        </div>
        <div className="flex items-center text-sm text-gray-500 bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm">
          <Calendar className="w-4 h-4 mr-2" />
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* CARDS SUPERIORES - TOTAIS GERAIS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-salomao-blue to-blue-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-blue-100 text-sm font-medium mb-1">Contratos Ativos</p>
            <h3 className="text-4xl font-bold">{metrics.activeCount}</h3>
            <div className="mt-4 flex items-center text-blue-200 text-xs">
              <Briefcase className="w-4 h-4 mr-1" /> Carteira Total
            </div>
          </div>
          <Briefcase className="absolute right-[-20px] bottom-[-20px] w-32 h-32 text-white opacity-10" />
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group hover:border-salomao-gold/50 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Novas Oportunidades</p>
              <h3 className="text-4xl font-bold text-gray-800">{metrics.analysisCount}</h3>
            </div>
            <div className="bg-yellow-50 p-3 rounded-xl text-salomao-gold group-hover:scale-110 transition-transform">
              <Activity className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-gray-400 text-xs">
            <span className="text-green-500 flex items-center mr-2 font-bold bg-green-50 px-1.5 py-0.5 rounded">
              <ArrowUpRight className="w-3 h-3 mr-1" /> Em Análise
            </span>
            Pipeline comercial
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group hover:border-green-200 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Fotografia Financeira Total</p>
              <h3 className="text-3xl font-bold text-green-600 truncate" title={metrics.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}>
                {metrics.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
              </h3>
            </div>
            <div className="bg-green-50 p-3 rounded-xl text-green-600 group-hover:scale-110 transition-transform">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex flex-col justify-center text-xs border-t border-gray-50 pt-2">
            <div className="flex justify-between items-center w-full">
              <span className="text-gray-400">Média Mensal (Fixos):</span>
              <span className="text-gray-700 font-bold bg-gray-50 px-2 py-0.5 rounded">
                {metrics.monthlyAverage.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO RESUMO DA SEMANA */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-salomao-blue" />
          Resumo da Semana
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1 - Novas Oportunidades (Antigo Leads) */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Novas Oportunidades</p>
              <h4 className="text-2xl font-bold text-gray-800 mt-1">{metrics.weeklyStats.analysis}</h4>
            </div>
            <div className="h-10 w-10 rounded-full bg-yellow-50 flex items-center justify-center text-salomao-gold">
              <FileText className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2 - Propostas Enviadas */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Propostas Enviadas</p>
              <h4 className="text-2xl font-bold text-blue-600 mt-1">{metrics.weeklyStats.proposal}</h4>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>

          {/* Card 3 - Novos Contratos */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Novos Contratos</p>
              <h4 className="text-2xl font-bold text-green-600 mt-1">{metrics.weeklyStats.active}</h4>
            </div>
            <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center text-green-500">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          {/* Card 4 - Rejeitados (Novo) */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Rejeitados</p>
              <h4 className="text-2xl font-bold text-red-600 mt-1">{metrics.weeklyStats.rejected}</h4>
            </div>
            <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center text-red-500">
              <XCircle className="w-5 h-5" />
            </div>
          </div>

          {/* Card 5 - Probono (Novo) */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Probono</p>
              <h4 className="text-2xl font-bold text-purple-600 mt-1">{metrics.weeklyStats.probono}</h4>
            </div>
            <div className="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-500">
              <HeartHandshake className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-salomao-blue" />
            Últimos Casos Atualizados
          </h3>
          <div className="space-y-4">
            {contracts.slice(0, 5).map(contract => (
              <div key={contract.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-3 ${
                    contract.status === 'active' ? 'bg-green-500' : 
                    contract.status === 'proposal' ? 'bg-blue-500' : 
                    contract.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{contract.client_name}</p>
                    <p className="text-xs text-gray-400">{contract.area}</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {contract.status === 'active' ? 'ATIVO' : 
                   contract.status === 'analysis' ? 'ANÁLISE' :
                   contract.status === 'proposal' ? 'PROPOSTA' : contract.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-salomao-blue p-6 rounded-2xl shadow-lg text-white relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="font-bold text-xl mb-2">Salomão & Advogados</h3>
            <p className="text-blue-200 text-sm mb-6">Sistema de Controladoria Jurídica e Financeira.</p>
            
            <div className="space-y-4">
              <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                <p className="text-xs text-blue-200 uppercase font-bold mb-1">Meta Mensal</p>
                <div className="flex justify-between items-end">
                  <span className="text-2xl font-bold">85%</span>
                  <span className="text-xs text-blue-200">do objetivo atingido</span>
                </div>
                <div className="w-full bg-blue-900/50 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-salomao-gold h-full rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-salomao-gold rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        </div>
      </div>
    </div>
  );
}