import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Users, FileText, CheckCircle2, TrendingUp, AlertCircle, Clock, ArrowRight, Plus, Briefcase, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeContracts: 0,
    totalRevenue: 0,
    pendingSignatures: 0,
    totalClients: 0
  });
  const [recentContracts, setRecentContracts] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Busca Contratos (Ativos e Recentes)
      const { data: contracts } = await supabase
        .from('contracts')
        .select('id, client_name, status, created_at, area, hon_number')
        .order('created_at', { ascending: false });

      // 2. Busca Clientes (Contagem)
      const { count: clientsCount } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true });

      // 3. Busca Financeiro (Total Pago)
      const { data: financial } = await supabase
        .from('financial_installments')
        .select('amount')
        .eq('status', 'paid');

      if (contracts) {
        const active = contracts.filter(c => c.status === 'active').length;
        const pendingSig = contracts.filter(c => c.status === 'active' && c.physical_signature === false).length; // Assumindo lógica de assinatura física
        const revenue = financial ? financial.reduce((acc, curr) => acc + Number(curr.amount), 0) : 0;

        setStats({
          activeContracts: active,
          totalRevenue: revenue,
          pendingSignatures: pendingSig,
          totalClients: clientsCount || 0
        });

        // Pega os 5 últimos para a lista
        setRecentContracts(contracts.slice(0, 5));
      }
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: any = {
      active: 'bg-green-100 text-green-700 border-green-200',
      analysis: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      proposal: 'bg-blue-100 text-blue-800 border-blue-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      probono: 'bg-purple-100 text-purple-800 border-purple-200'
    };
    const labels: any = {
      active: 'Ativo', analysis: 'Análise', proposal: 'Proposta', rejected: 'Rejeitado', probono: 'Probono'
    };
    return (
      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-salomao-blue">Dashboard</h1>
          <p className="text-gray-500 mt-1">Visão geral da Salomão Controladoria.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/clientes')} className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-medium flex items-center text-sm">
            <Users className="w-4 h-4 mr-2" /> Clientes
          </button>
          <button onClick={() => navigate('/contratos')} className="bg-salomao-gold hover:bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center font-bold text-sm active:scale-95">
            <Plus className="w-4 h-4 mr-2" /> Novo Caso
          </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Faturamento */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="relative">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-green-100 text-green-600 rounded-xl"><DollarSign className="w-6 h-6" /></div>
              <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full"><TrendingUp className="w-3 h-3 mr-1" /> Realizado</span>
            </div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Receita Total</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">
              {stats.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </h3>
          </div>
        </div>

        {/* Card 2: Contratos Ativos */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="relative">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-100 text-salomao-blue rounded-xl"><FileText className="w-6 h-6" /></div>
            </div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Contratos Ativos</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">{stats.activeContracts}</h3>
          </div>
        </div>

        {/* Card 3: Clientes */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="relative">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-purple-100 text-purple-600 rounded-xl"><Users className="w-6 h-6" /></div>
            </div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Clientes</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">{stats.totalClients}</h3>
          </div>
        </div>

        {/* Card 4: Assinaturas Pendentes */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="relative">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-orange-100 text-orange-600 rounded-xl"><AlertCircle className="w-6 h-6" /></div>
              {stats.pendingSignatures > 0 && <span className="flex items-center text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">Atenção</span>}
            </div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Assinaturas Pend.</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">{stats.pendingSignatures}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* TABELA DE CASOS RECENTES */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-800 flex items-center">
              <Briefcase className="w-5 h-5 mr-2 text-salomao-blue" />
              Últimos Casos
            </h3>
            <button onClick={() => navigate('/contratos')} className="text-xs text-blue-500 hover:underline font-medium">Ver todos</button>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-bold">
                <tr>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Área</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentContracts.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-8 text-gray-400">Nenhum caso recente.</td></tr>
                ) : (
                  recentContracts.map((contract) => (
                    <tr key={contract.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-800">{contract.client_name}</td>
                      <td className="px-6 py-4">{contract.area || '-'}</td>
                      <td className="px-6 py-4">{getStatusBadge(contract.status)}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => navigate('/contratos')} className="text-gray-400 hover:text-salomao-blue"><ArrowRight className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* BARRA LATERAL / GRÁFICO SIMPLIFICADO */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-6 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-salomao-blue" />
            Atividade da Semana
          </h3>
          
          <div className="space-y-6">
            {/* Mock Chart Bars */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-500"><span>Novos Contratos</span><span className="font-bold">12</span></div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[70%] rounded-full"></div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-500"><span>Faturamentos</span><span className="font-bold">8</span></div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 w-[45%] rounded-full"></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-500"><span>Novos Clientes</span><span className="font-bold">5</span></div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 w-[30%] rounded-full"></div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex items-center gap-4 bg-blue-50 p-4 rounded-xl border border-blue-100">
              <div className="bg-white p-2 rounded-full shadow-sm">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-blue-800 uppercase">Sistema Atualizado</p>
                <p className="text-xs text-blue-600 mt-0.5">Todos os módulos operacionais.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}