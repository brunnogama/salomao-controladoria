import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart3, PieChart, Users, Scale, FileText, TrendingUp, Layers } from 'lucide-react';
import { Contract, Partner } from '../types';
import { ContractFilters } from '../components/contracts/ContractFilters';
import * as XLSX from 'xlsx';

export function Volumetry() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados dos Filtros (Iguais aos de Contratos)
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [partnerFilter, setPartnerFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<'name' | 'date'>('date');
  const [viewMode, setViewMode] = useState<'list' | 'card'>('card'); // Mantido para compatibilidade com o componente de filtros

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Busca contratos com os relacionamentos necessários: parceiro e processos
      const { data: contractsData, error: contractsError } = await supabase
        .from('contracts')
        .select(`
          *,
          partner:partners(name),
          processes:contract_processes(*)
        `);

      if (contractsError) throw contractsError;

      // Busca sócios ativos
      const { data: partnersData, error: partnersError } = await supabase
        .from('partners')
        .select('*')
        .eq('active', true);

      if (partnersError) throw partnersError;

      if (contractsData) {
        // Formata os dados para incluir contagens e nomes
        const formattedContracts = contractsData.map((c: any) => ({
          ...c,
          partner_name: c.partner?.name || 'Sem Sócio',
          process_count: c.processes?.length || 0
        }));
        setContracts(formattedContracts);
      }

      if (partnersData) setPartners(partnersData);

    } catch (error) {
      console.error('Erro ao carregar volumetria:', error);
    } finally {
      setLoading(false);
    }
  };

  // Lógica de Filtragem (Idêntica à de Contratos)
  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = 
      contract.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contract.cnpj && contract.cnpj.includes(searchTerm));
    
    const matchesStatus = statusFilter ? contract.status === statusFilter : true;
    const matchesPartner = partnerFilter ? contract.partner_id === partnerFilter : true;

    return matchesSearch && matchesStatus && matchesPartner;
  });

  // Lógica de Agrupamento por Sócio
  const metricsByPartner = partners.map(partner => {
    // Filtra os contratos (já filtrados pelos inputs) que pertencem a este sócio
    const partnerContracts = filteredContracts.filter(c => c.partner_id === partner.id);
    
    const contractCount = partnerContracts.length;
    // Soma a quantidade de processos de todos os contratos desse sócio
    const processCount = partnerContracts.reduce((acc, curr) => acc + (curr.process_count || 0), 0);
    
    // Calcula valor total em pró-labore (opcional, mas útil para volumetria financeira)
    // const totalValue = partnerContracts.reduce((acc, curr) => acc + (curr.pro_labore ? parseFloat(curr.pro_labore.replace(/[^0-9.-]+/g,"")) : 0), 0);

    return {
      id: partner.id,
      name: partner.name,
      contractCount,
      processCount,
      // totalValue
    };
  }).sort((a, b) => b.contractCount - a.contractCount); // Ordena por quem tem mais contratos

  // Totais Gerais (Baseado nos filtros atuais)
  const totalContracts = filteredContracts.length;
  const totalProcesses = filteredContracts.reduce((acc, c) => acc + (c.process_count || 0), 0);

  const handleExport = () => {
    const exportData = metricsByPartner.map(m => ({
        'Sócio': m.name,
        'Qtd. Contratos': m.contractCount,
        'Qtd. Processos': m.processCount
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Volumetria");
    XLSX.writeFile(wb, "Volumetria_Socios.xlsx");
  };

  return (
    <div className="p-8 animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-salomao-blue flex items-center gap-2">
          <BarChart3 className="w-8 h-8" /> Volumetria
        </h1>
        <p className="text-gray-500 mt-1">Análise quantitativa de contratos e processos por sócio.</p>
      </div>

      {/* Filtros Reutilizados */}
      <div className="mb-8">
        <ContractFilters
          searchTerm={searchTerm} setSearchTerm={setSearchTerm}
          statusFilter={statusFilter} setStatusFilter={setStatusFilter}
          partnerFilter={partnerFilter} setPartnerFilter={setPartnerFilter}
          partners={partners}
          sortOrder={sortOrder} setSortOrder={setSortOrder}
          viewMode={viewMode} setViewMode={setViewMode} // Apenas visual no filtro, não afeta volumetria
          onExport={handleExport}
        />
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase">Contratos Filtrados</p>
            <p className="text-3xl font-bold text-salomao-blue mt-1">{totalContracts}</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-full text-salomao-blue">
            <FileText className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-purple-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase">Processos Judiciais</p>
            <p className="text-3xl font-bold text-purple-700 mt-1">{totalProcesses}</p>
          </div>
          <div className="bg-purple-50 p-3 rounded-full text-purple-600">
            <Scale className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase">Sócios Ativos</p>
            <p className="text-3xl font-bold text-green-700 mt-1">{partners.length}</p>
          </div>
          <div className="bg-green-50 p-3 rounded-full text-green-600">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Lista de Volumetria por Sócio */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Layers className="w-5 h-5 text-gray-500" /> Distribuição por Sócio
          </h2>
        </div>
        
        {loading ? (
           <div className="p-8 text-center text-gray-500">Carregando dados...</div>
        ) : metricsByPartner.length === 0 ? (
           <div className="p-8 text-center text-gray-500">Nenhum dado encontrado para os filtros selecionados.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 font-medium text-xs uppercase tracking-wider">
                <tr>
                  <th className="p-4">Sócio Responsável</th>
                  <th className="p-4 text-center">Contratos</th>
                  <th className="p-4 text-center">Processos Judiciais</th>
                  <th className="p-4">Representatividade (Contratos)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {metricsByPartner.map((partner) => {
                  const percentage = totalContracts > 0 ? ((partner.contractCount / totalContracts) * 100).toFixed(1) : "0";
                  
                  return (
                    <tr key={partner.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-medium text-gray-800 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-salomao-blue flex items-center justify-center font-bold text-xs">
                          {partner.name.charAt(0)}
                        </div>
                        {partner.name}
                      </td>
                      <td className="p-4 text-center">
                        <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-bold">
                          {partner.contractCount}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full font-bold">
                          {partner.processCount}
                        </span>
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden max-w-[150px]">
                            <div 
                              className="bg-salomao-gold h-full rounded-full" 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-bold text-gray-500 w-12">{percentage}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}