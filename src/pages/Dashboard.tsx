import React, { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useDashboardData } from '../hooks/useDashboardData';

// --- COMPONENTES MODULARES ---
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { EfficiencyFunnel } from '../components/dashboard/EfficiencyFunnel';
import { PortfolioFinancialOverview } from '../components/dashboard/PortfolioFinancialOverview';
import { WeeklySummary } from '../components/dashboard/WeeklySummary';
import { MonthlySummary } from '../components/dashboard/MonthlySummary';
import { EvolutionCharts } from '../components/dashboard/EvolutionCharts';
import { PartnerStats } from '../components/dashboard/PartnerStats';
import { OperationalStats } from '../components/dashboard/OperationalStats';

export function Dashboard() {
  // --- ESTADOS DE FILTROS ---
  const [selectedPartner, setSelectedPartner] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  
  const [partnersList, setPartnersList] = useState<{id: string, name: string}[]>([]);
  const [locationsList, setLocationsList] = useState<string[]>([]);

  // Hook de Dados
  const {
    loading, metrics, funil, evolucaoMensal, financeiro12Meses, statsFinanceiro,
    propostas12Meses, statsPropostas, mediasFinanceiras, mediasPropostas,
    rejectionData, contractsByPartner
  } = useDashboardData(selectedPartner, selectedLocation);

  const [exporting, setExporting] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'editor' | 'viewer' | null>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);

  // --- EFEITOS DE CARREGAMENTO (SÓCIOS, LOCAIS, ROLE) ---
  useEffect(() => {
    const fetchFilterOptions = async () => {
        const { data: partners } = await supabase.from('partners').select('id, name').eq('active', true).order('name');
        if (partners) setPartnersList(partners);

        const { data: contracts } = await supabase.from('contracts').select('billing_location');
        if (contracts) {
            const uniqueLocations = Array.from(new Set(contracts.map(c => c.billing_location).filter(Boolean)));
            setLocationsList(uniqueLocations.sort());
        }
    };
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    const checkUserRole = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
            if (profile) setUserRole(profile.role as 'admin' | 'editor' | 'viewer');
        }
    };
    checkUserRole();
  }, []);

  // --- FUNÇÃO EXPORTAR ---
  const handleExportAndEmail = async () => {
    if (!dashboardRef.current) return;
    setExporting(true);
    try {
        const canvas = await html2canvas(dashboardRef.current, {
            scale: 2, 
            useCORS: true, 
            backgroundColor: '#F8FAFC',
            ignoreElements: (element) => element.id === 'export-button-container' || element.id === 'dashboard-filters'
        });

        const imgData = canvas.toDataURL('image/png');
        const dateStr = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');

        const linkPng = document.createElement('a');
        linkPng.href = imgData;
        linkPng.download = `Relatorio_Dashboard_${dateStr}.png`;
        linkPng.click();

        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Relatorio_Dashboard_${dateStr}.pdf`);

        const subject = encodeURIComponent(`Panorama dos Contratos atualizado - ${dateStr}`);
        const body = encodeURIComponent(`Caros,\n\nSegue em anexo o panorama atualizado dos contratos.\n\nAtenciosamente,\nMarcio Gama - Controladoria.`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;

    } catch (error) {
        console.error("Erro ao exportar:", error);
        alert("Houve um erro ao gerar o relatório.");
    } finally {
        setExporting(false);
    }
  };

  // Loading State
  if (loading || !metrics || metrics.geral.totalCasos === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-full gap-4">
        <Loader2 className="w-10 h-10 text-[#1e3a8a] animate-spin" />
        <p className="text-sm font-semibold text-gray-500">Carregando dashboard...</p>
      </div>
    );
  }

  return (
    <div className='w-full min-h-screen overflow-x-hidden'>
      <div className='max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-16'>
        
        {/* Header com Filtros */}
        <DashboardHeader 
          userRole={userRole}
          selectedPartner={selectedPartner}
          setSelectedPartner={setSelectedPartner}
          partnersList={partnersList}
          selectedLocation={selectedLocation}
          setSelectedLocation={setSelectedLocation}
          locationsList={locationsList}
          exporting={exporting}
          onExport={handleExportAndEmail}
        />

        {/* Container do Dashboard - SEM SCROLL HORIZONTAL */}
        <div ref={dashboardRef} className="w-full space-y-6 bg-[#F8FAFC] rounded-2xl p-4 sm:p-6">
          
          {/* 1. Funil de Eficiência */}
          <div className="w-full overflow-hidden">
            <EfficiencyFunnel funil={funil} />
          </div>

          {/* 2. Snapshots (Carteira + Financeiro) */}
          <div className="w-full overflow-hidden">
            <PortfolioFinancialOverview metrics={metrics} />
          </div>

          {/* 3. Resumo Semanal */}
          <div className="w-full overflow-hidden">
            <WeeklySummary metrics={metrics} />
          </div>

          {/* 4. Resumo Mensal */}
          <div className="w-full overflow-hidden">
            <MonthlySummary metrics={metrics} />
          </div>

          {/* 5. Gráficos de Evolução (Entrada + Financeiro 12m) */}
          <div className="w-full space-y-6 overflow-hidden">
            <EvolutionCharts 
              evolucaoMensal={evolucaoMensal}
              propostas12Meses={propostas12Meses}
              financeiro12Meses={financeiro12Meses}
              mediasPropostas={mediasPropostas}
              mediasFinanceiras={mediasFinanceiras}
              statsPropostas={statsPropostas}
              statsFinanceiro={statsFinanceiro}
            />
          </div>

          {/* 6. Sócios (Contratos + Financeiro) */}
          <div className="w-full space-y-6 overflow-hidden">
            <PartnerStats contractsByPartner={contractsByPartner} />
          </div>

          {/* 7. Operacional (Rejeições e Assinaturas) */}
          <div className="w-full space-y-6 overflow-hidden">
            <OperationalStats 
              rejectionData={rejectionData} 
              metrics={metrics} 
            />
          </div>
          
        </div>
      </div>
    </div>
  );
}