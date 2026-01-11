import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Users, Briefcase, FileText, TrendingUp, 
  ArrowUpRight, Activity, Calendar, DollarSign, 
  XCircle, HeartHandshake, Loader2 
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
    monthlyAverage: 0, // Novo: Média mensal
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
      const { data, error } = await supabase.from('contracts').select('*');
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

  // 1. Lógica de Datas da Semana (Solicitado)
  const isDateInCurrentWeek = (dateString?: string) => {
    if (!dateString) return false;
    const date = new Date(dateString + 'T12:00:00');
    const today = new Date();
    const currentDay = today.getDay(); 
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDay);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return date >= startOfWeek && date <= endOfWeek;
  };

  const calculateMetrics = (data: Contract[]) => {
    const activeContracts = data.filter(c => c.status === 'active');
    const activeCount = activeContracts.length;
    const analysisCount = data.filter(c => c.status === 'analysis').length;

    let totalValue = 0;
    let totalMonthlyFixed = 0;

    activeContracts.forEach(c => {
      totalValue += parseCurrency(c.final_success_fee);
      totalValue += parseCurrency(c.pro_labore);
      totalValue += parseCurrency(c.other_fees);
      
      const fixedVal = parseCurrency(c.fixed_monthly_fee);
      totalValue += fixedVal;
      totalMonthlyFixed += fixedVal; // 4. Soma apenas fixos para média

      if (c.intermediate_fees && Array.isArray(c.intermediate_fees)) {
        c.intermediate_fees.forEach(fee => totalValue += parseCurrency(fee));
      }
    });

    // Estatísticas da Semana baseadas na DATA DO STATUS (Solicitado)
    const weeklyStats = { analysis: 0, proposal: 0, active: 0, rejected: 0, probono: 0 };

    data.forEach(c => {
      if (c.status === 'analysis' && isDateInCurrentWeek(c.prospect_date)) weeklyStats.analysis++;
      if (c.status === 'proposal' && isDateInCurrentWeek(c.proposal_date)) weeklyStats.proposal++;
      if (c.status === 'active' && isDateInCurrentWeek(c.contract_date)) weeklyStats.active++;
      if (c.status === 'rejected' && isDateInCurrentWeek(c.rejection_date)) weeklyStats.rejected++;
      if (c.status === 'probono' && isDateInCurrentWeek(c.probono_date || c.contract_date)) weeklyStats.probono++;
    });

    setMetrics({ activeCount, analysisCount, totalValue, monthlyAverage: totalMonthlyFixed, weeklyStats });
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 text-salomao-gold animate-spin" /></div>;
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-salomao-blue">Visão Geral</h1>
          <p className="text-gray-500 mt-1">Acompanhe os indicadores chave do escritório.</p>
        </div>
      </div>

      {/* CARDS SUPERIORES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card Ativos */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex justify-between items-start">
          <div>
            <p className="text-gray-500 text-sm font-medium mb-1">Contratos Ativos</p>
            <h3 className="text-4xl font-bold text-salomao-blue">{metrics.activeCount}</h3>
          </div>
          <div className="bg-blue-50 p-3 rounded-xl text-salomao-blue"><Briefcase className="w-6 h-6" /></div>
        </div>

        {/* Card Análise (Renomeado - Solicitado) */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex justify-between items-start">
          <div>
            <p className="text-gray-500 text-sm font-medium mb-1">Novas Oportunidades Jurídicas</p>
            <h3 className="text-4xl font-bold text-gray-800">{metrics.analysisCount}</h3>
          </div>
          <div className="bg-yellow-50 p-3 rounded-xl text-salomao-gold"><Activity className="w-6 h-6" /></div>
        </div>

        {/* Card Financeiro (Com Média Mensal - Solicitado) */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Fotografia Financeira Total</p>
              <h3 className="text-3xl font-bold text-green-600 truncate">
                {metrics.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
              </h3>
            </div>
            <div className="bg-green-50 p-3 rounded-xl text-green-600"><DollarSign className="w-6 h-6" /></div>
          </div>
          {/* Média Mensal inserida aqui */}
          <div className="text-xs text-gray-500 border-t border-gray-50 pt-2 mt-2 flex justify-between items-center">
            <span>Média Mensal (Fixos):</span>
            <span className="font-bold text-gray-700">{metrics.monthlyAverage.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
          </div>
        </div>
      </div>

      {/* RESUMO DA SEMANA */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-salomao-blue" />
          Resumo da Semana
        </h2>
        
        {/* Adicionado cards Rejeitados e Probono (Solicitado) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div><p className="text-xs font-bold text-gray-400 uppercase">Em Análise</p><h4 className="text-2xl font-bold text-gray-800 mt-1">{metrics.weeklyStats.analysis}</h4></div>
            <div className="h-10 w-10 rounded-full bg-yellow-50 flex items-center justify-center text-salomao-gold"><FileText className="w-5 h-5" /></div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div><p className="text-xs font-bold text-gray-400 uppercase">Propostas</p><h4 className="text-2xl font-bold text-blue-600 mt-1">{metrics.weeklyStats.proposal}</h4></div>
            <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500"><ArrowUpRight className="w-5 h-5" /></div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div><p className="text-xs font-bold text-gray-400 uppercase">Novos Contratos</p><h4 className="text-2xl font-bold text-green-600 mt-1">{metrics.weeklyStats.active}</h4></div>
            <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center text-green-500"><TrendingUp className="w-5 h-5" /></div>
          </div>

          {/* Novos Cards */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div><p className="text-xs font-bold text-gray-400 uppercase">Rejeitados</p><h4 className="text-2xl font-bold text-red-600 mt-1">{metrics.weeklyStats.rejected}</h4></div>
            <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center text-red-500"><XCircle className="w-5 h-5" /></div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div><p className="text-xs font-bold text-gray-400 uppercase">Probono</p><h4 className="text-2xl font-bold text-purple-600 mt-1">{metrics.weeklyStats.probono}</h4></div>
            <div className="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-500"><HeartHandshake className="w-5 h-5" /></div>
          </div>
        </div>
      </div>

      {/* ÚLTIMOS CASOS (Revertido para lista simples sem o card azul lateral) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
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
    </div>
  );
}