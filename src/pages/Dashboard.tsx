import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Users, FileText, CheckCircle2, TrendingUp, AlertCircle, Clock } from 'lucide-react';
import { unmaskMoney } from '../utils/masks'; // Agora funciona

export function Dashboard() {
  const [stats, setStats] = useState({
    activeContracts: 0,
    totalRevenue: 0,
    pendingSignatures: 0,
    totalClients: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    // Busca contratos ativos
    const { data: contracts } = await supabase.from('contracts').select('*');
    
    // Busca clientes
    const { count: clientsCount } = await supabase.from('clients').select('*', { count: 'exact', head: true });

    // Busca financeiro realizado
    const { data: financial } = await supabase.from('financial_installments').select('amount').eq('status', 'paid');

    if (contracts && financial) {
      const active = contracts.filter(c => c.status === 'active').length;
      const pendingSig = contracts.filter(c => c.status === 'active' && c.physical_signature === false).length;
      const revenue = financial.reduce((acc, curr) => acc + Number(curr.amount), 0);

      setStats({
        activeContracts: active,
        totalRevenue: revenue,
        pendingSignatures: pendingSig,
        totalClients: clientsCount || 0
      });
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold text-salomao-blue">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div><p className="text-sm font-bold text-gray-400 uppercase">Faturamento Realizado</p><h3 className="text-2xl font-bold text-green-600 mt-1">{stats.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3></div>
            <div className="bg-green-50 p-3 rounded-full text-green-500"><TrendingUp className="w-6 h-6" /></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div><p className="text-sm font-bold text-gray-400 uppercase">Contratos Ativos</p><h3 className="text-2xl font-bold text-salomao-blue mt-1">{stats.activeContracts}</h3></div>
            <div className="bg-blue-50 p-3 rounded-full text-salomao-blue"><FileText className="w-6 h-6" /></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div><p className="text-sm font-bold text-gray-400 uppercase">Total Clientes</p><h3 className="text-2xl font-bold text-purple-600 mt-1">{stats.totalClients}</h3></div>
            <div className="bg-purple-50 p-3 rounded-full text-purple-500"><Users className="w-6 h-6" /></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div><p className="text-sm font-bold text-gray-400 uppercase">Assinaturas Pendentes</p><h3 className="text-2xl font-bold text-orange-500 mt-1">{stats.pendingSignatures}</h3></div>
            <div className="bg-orange-50 p-3 rounded-full text-orange-500"><AlertCircle className="w-6 h-6" /></div>
          </div>
        </div>
      </div>
    </div>
  );
}