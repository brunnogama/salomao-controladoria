import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Contract } from '../types';

// --- Funções Auxiliares (Movidas para fora do componente) ---

const safeParseMoney = (value: string | number | undefined | null): number => {
  if (value === undefined || value === null || value === '') return 0;
  if (typeof value === 'number') return value;
  const strVal = String(value).trim();
  if (!strVal.includes('R$') && !strVal.includes(',') && !isNaN(Number(strVal))) {
    return parseFloat(strVal);
  }
  const cleanStr = strVal.replace(/[^\d,-]/g, '').replace(',', '.');
  const floatVal = parseFloat(cleanStr);
  return isNaN(floatVal) ? 0 : floatVal;
};

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

const isDateInPreviousWeek = (dateString?: string) => {
  if (!dateString) return false;
  const date = new Date(dateString + 'T12:00:00');
  const today = new Date();
  const currentDay = today.getDay();
  const startOfCurrentWeek = new Date(today);
  startOfCurrentWeek.setDate(today.getDate() - currentDay);
  startOfCurrentWeek.setHours(0, 0, 0, 0);
  const startOfPrevWeek = new Date(startOfCurrentWeek);
  startOfPrevWeek.setDate(startOfCurrentWeek.getDate() - 7);
  const endOfPrevWeek = new Date(startOfPrevWeek);
  endOfPrevWeek.setDate(startOfPrevWeek.getDate() + 6);
  endOfPrevWeek.setHours(23, 59, 59, 999);
  return date >= startOfPrevWeek && date <= endOfPrevWeek;
};

const isDateInCurrentMonth = (dateString?: string) => {
  if (!dateString) return false;
  const date = new Date(dateString + 'T12:00:00');
  const today = new Date();
  return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
};

const isDateInLastMonth = (dateString?: string) => {
  if (!dateString) return false;
  const date = new Date(dateString + 'T12:00:00');
  const today = new Date();
  let lastMonth = today.getMonth() - 1;
  let lastYear = today.getFullYear();
  if (lastMonth < 0) {
    lastMonth = 11;
    lastYear = today.getFullYear() - 1;
  }
  return date.getMonth() === lastMonth && date.getFullYear() === lastYear;
};

// --- Hook Principal ---

export function useDashboardData() {
  const [loading, setLoading] = useState(true);
  
  // Estados de Métricas
  const [metrics, setMetrics] = useState({
    semana: {
      novos: 0, propQtd: 0, propPL: 0, propExito: 0, propMensal: 0,
      fechQtd: 0, fechPL: 0, fechExito: 0, fechMensal: 0,
      rejeitados: 0, probono: 0, totalUnico: 0,
    },
    semanaAnterior: {
        propPL: 0, propExito: 0, propMensal: 0,
        fechPL: 0, fechExito: 0, fechMensal: 0
    },
    mes: {
      novos: 0, propQtd: 0, propPL: 0, propExito: 0, propMensal: 0,
      fechQtd: 0, fechPL: 0, fechExito: 0, fechMensal: 0,
      totalUnico: 0, analysis: 0, rejected: 0, probono: 0
    },
    executivo: {
        mesAtual: { novos: 0, propQtd: 0, propPL: 0, propExito: 0, propMensal: 0, fechQtd: 0, fechPL: 0, fechExito: 0, fechMensal: 0 },
        mesAnterior: { novos: 0, propQtd: 0, propPL: 0, propExito: 0, propMensal: 0, fechQtd: 0, fechPL: 0, fechExito: 0, fechMensal: 0 }
    },
    geral: {
      totalCasos: 0, emAnalise: 0, propostasAtivas: 0, fechados: 0, rejeitados: 0, probono: 0,
      valorEmNegociacaoPL: 0, valorEmNegociacaoExito: 0, receitaRecorrenteAtiva: 0,
      totalFechadoPL: 0, totalFechadoExito: 0, assinados: 0, naoAssinados: 0,
      mediaMensalNegociacaoPL: 0, mediaMensalNegociacaoExito: 0,
      mediaMensalCarteiraPL: 0, mediaMensalCarteiraExito: 0,
    },
  });

  const [funil, setFunil] = useState({
    totalEntrada: 0, qualificadosProposta: 0, fechados: 0,
    perdaAnalise: 0, perdaNegociacao: 0,
    taxaConversaoProposta: '0', taxaConversaoFechamento: '0',
    tempoMedioProspectProposta: 0, tempoMedioPropostaFechamento: 0
  });

  const [evolucaoMensal, setEvolucaoMensal] = useState<any[]>([]);
  
  // Gráfico FECHADOS
  const [financeiro12Meses, setFinanceiro12Meses] = useState<any[]>([]);
  const [statsFinanceiro, setStatsFinanceiro] = useState({ total: 0, media: 0, diff: 0 });
  const [mediasFinanceiras, setMediasFinanceiras] = useState({ pl: 0, exito: 0 });

  // Gráfico PROPOSTAS
  const [propostas12Meses, setPropostas12Meses] = useState<any[]>([]);
  const [statsPropostas, setStatsPropostas] = useState({ total: 0, media: 0, diff: 0 });
  const [mediasPropostas, setMediasPropostas] = useState({ pl: 0, exito: 0 });
    
  // Rejeição e Sócios
  const [rejectionData, setRejectionData] = useState<{
    reasons: { label: string, value: number, percent: number }[],
    sources: { label: string, value: number, percent: number }[]
  }>({ reasons: [], sources: [] });

  const [contractsByPartner, setContractsByPartner] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();

    const subscription = supabase
      .channel('dashboard_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contracts' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [ { data: contratos, error }, { data: socios } ] = await Promise.all([
          supabase.from('contracts').select('*'),
          supabase.from('partners').select('id, name')
      ]);

      if (error) throw error;
      if (contratos) processarDados(contratos, socios || []);
    } catch (error) {
      console.error('Erro dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const processarDados = (contratos: Contract[], socios: any[] = []) => {
    const hoje = new Date();
    const dataInicioFixo = new Date(2025, 5, 1); // Junho 2025
    
    const partnerMap = socios.reduce((acc: any, s: any) => {
        acc[s.id] = s.name;
        return acc;
    }, {});

    let mSemana = {
      novos: 0, propQtd: 0, propPL: 0, propExito: 0, propMensal: 0,
      fechQtd: 0, fechPL: 0, fechExito: 0, fechMensal: 0,
      rejeitados: 0, probono: 0, totalUnico: 0
    };
    
    let mSemanaAnterior = {
        propPL: 0, propExito: 0, propMensal: 0,
        fechPL: 0, fechExito: 0, fechMensal: 0
    };

    let mMes = {
      novos: 0, propQtd: 0, propPL: 0, propExito: 0, propMensal: 0,
      fechQtd: 0, fechPL: 0, fechExito: 0, fechMensal: 0,
      totalUnico: 0, analysis: 0, rejected: 0, probono: 0
    };
    
    let mExecutivo = {
        mesAtual: { novos: 0, propQtd: 0, propPL: 0, propExito: 0, propMensal: 0, fechQtd: 0, fechPL: 0, fechExito: 0, fechMensal: 0 },
        mesAnterior: { novos: 0, propQtd: 0, propPL: 0, propExito: 0, propMensal: 0, fechQtd: 0, fechPL: 0, fechExito: 0, fechMensal: 0 }
    };

    let mGeral = {
      totalCasos: 0, emAnalise: 0, propostasAtivas: 0, fechados: 0, rejeitados: 0, probono: 0,
      valorEmNegociacaoPL: 0, valorEmNegociacaoExito: 0, receitaRecorrenteAtiva: 0,
      totalFechadoPL: 0, totalFechadoExito: 0, assinados: 0, naoAssinados: 0,
      mediaMensalNegociacaoPL: 0, mediaMensalNegociacaoExito: 0,
      mediaMensalCarteiraPL: 0, mediaMensalCarteiraExito: 0,
    };

    let fTotal = 0; let fQualificados = 0; let fFechados = 0;
    let fPerdaAnalise = 0; let fPerdaNegociacao = 0;

    let somaDiasProspectProposta = 0;
    let qtdProspectProposta = 0;
    let somaDiasPropostaFechamento = 0;
    let qtdPropostaFechamento = 0;

    const mapaMeses: Record<string, number> = {};
    const financeiroMap: Record<string, { pl: number, fixo: number, exito: number, data: Date }> = {};
    const propostasMap: Record<string, { pl: number, fixo: number, exito: number, data: Date }> = {};
    
    const reasonCounts: Record<string, number> = {};
    const sourceCounts: Record<string, number> = {};
    let totalRejected = 0;
    const partnerCounts: Record<string, any> = {};

    let iteradorMeses = new Date(dataInicioFixo);
    while (iteradorMeses <= hoje) {
      const key = iteradorMeses.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      financeiroMap[key] = { pl: 0, fixo: 0, exito: 0, data: new Date(iteradorMeses) };
      propostasMap[key] = { pl: 0, fixo: 0, exito: 0, data: new Date(iteradorMeses) };
      iteradorMeses.setMonth(iteradorMeses.getMonth() + 1);
    }
    const dataLimite12Meses = dataInicioFixo;

    contratos.forEach((c) => {
      let pl = safeParseMoney(c.pro_labore);
      let exito = safeParseMoney(c.final_success_fee);
      let mensal = safeParseMoney(c.fixed_monthly_fee);
      let outros = safeParseMoney((c as any).other_fees);

      if ((c as any).pro_labore_extras && Array.isArray((c as any).pro_labore_extras)) {
        pl += (c as any).pro_labore_extras.reduce((acc: number, val: any) => acc + safeParseMoney(val), 0);
      }
      if ((c as any).final_success_extras && Array.isArray((c as any).final_success_extras)) {
        exito += (c as any).final_success_extras.reduce((acc: number, val: any) => acc + safeParseMoney(val), 0);
      }
      if ((c as any).fixed_monthly_extras && Array.isArray((c as any).fixed_monthly_extras)) {
        mensal += (c as any).fixed_monthly_extras.reduce((acc: number, val: any) => acc + safeParseMoney(val), 0);
      }
      if ((c as any).other_fees_extras && Array.isArray((c as any).other_fees_extras)) {
        outros += (c as any).other_fees_extras.reduce((acc: number, val: any) => acc + safeParseMoney(val), 0);
      }
      pl += outros;

      if (c.intermediate_fees && Array.isArray(c.intermediate_fees)) {
        const totalIntermediario = c.intermediate_fees.reduce((acc: number, val: any) => acc + safeParseMoney(val), 0);
        exito += totalIntermediario;
      }

      if ((c as any).cases && Array.isArray((c as any).cases)) {
        (c as any).cases.forEach((caseItem: any) => {
          pl += safeParseMoney(caseItem.pro_labore);
          exito += safeParseMoney(caseItem.final_success_fee || caseItem.success_fee);
        });
      }

      const statusDates = [
         c.prospect_date,
         c.proposal_date,
         c.contract_date,
         c.rejection_date,
         c.probono_date
      ].filter(d => d && d !== '').map(d => new Date(d + 'T12:00:00'));
      
      let dataEntradaReal = null;
      if (statusDates.length > 0) {
          dataEntradaReal = new Date(Math.min(...statusDates.map(d => d.getTime())));
      } else {
          dataEntradaReal = c.created_at ? new Date(c.created_at) : new Date();
      }

      const mesAnoEntrada = dataEntradaReal.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      if (mapaMeses[mesAnoEntrada] !== undefined) {
         mapaMeses[mesAnoEntrada]++;
      } else {
         if (!mapaMeses[mesAnoEntrada]) mapaMeses[mesAnoEntrada] = 0;
         mapaMeses[mesAnoEntrada]++;
      }

      // Executivo
      if (c.prospect_date) {
         if (isDateInCurrentMonth(c.prospect_date)) mExecutivo.mesAtual.novos++;
         if (isDateInLastMonth(c.prospect_date)) mExecutivo.mesAnterior.novos++;
      }
      if (c.proposal_date) {
         if (isDateInCurrentMonth(c.proposal_date)) {
             mExecutivo.mesAtual.propQtd++;
             mExecutivo.mesAtual.propPL += pl;
             mExecutivo.mesAtual.propExito += exito;
             mExecutivo.mesAtual.propMensal += mensal;
         }
         if (isDateInLastMonth(c.proposal_date)) {
             mExecutivo.mesAnterior.propQtd++;
             mExecutivo.mesAnterior.propPL += pl;
             mExecutivo.mesAnterior.propExito += exito;
             mExecutivo.mesAnterior.propMensal += mensal;
         }
      }
      if (c.status === 'active' && c.contract_date) {
         if (isDateInCurrentMonth(c.contract_date)) {
             mExecutivo.mesAtual.fechQtd++;
             mExecutivo.mesAtual.fechPL += pl;
             mExecutivo.mesAtual.fechExito += exito;
             mExecutivo.mesAtual.fechMensal += mensal;
         }
         if (isDateInLastMonth(c.contract_date)) {
             mExecutivo.mesAnterior.fechQtd++;
             mExecutivo.mesAnterior.fechPL += pl;
             mExecutivo.mesAnterior.fechExito += exito;
             mExecutivo.mesAnterior.fechMensal += mensal;
         }
      }

      const pName = ((c as any).partner_id && partnerMap[(c as any).partner_id]) || 
                    (c as any).responsavel_socio || 'Não Informado';
      
      if (!partnerCounts[pName]) {
          partnerCounts[pName] = { total: 0, analysis: 0, proposal: 0, active: 0, rejected: 0, probono: 0 };
      }
      partnerCounts[pName].total++;
      if (c.status === 'analysis') partnerCounts[pName].analysis++;
      else if (c.status === 'proposal') partnerCounts[pName].proposal++;
      else if (c.status === 'active') partnerCounts[pName].active++;
      else if (c.status === 'rejected') partnerCounts[pName].rejected++;
      else if (c.status === 'probono') partnerCounts[pName].probono++;

      if (c.status === 'rejected') {
          totalRejected++;
          const reason = (c as any).rejection_reason || 'Não informado';
          const source = (c as any).rejection_source || (c as any).rejected_by || 'Não informado';
          reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
          sourceCounts[source] = (sourceCounts[source] || 0) + 1;
      }

      if (c.status === 'active' && c.contract_date) {
        const dContrato = new Date(c.contract_date + 'T12:00:00');
        dContrato.setDate(1); dContrato.setHours(0,0,0,0);
        if (dContrato >= dataLimite12Meses) {
          const key = dContrato.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
          if (financeiroMap[key]) {
            financeiroMap[key].pl += pl;
            financeiroMap[key].fixo += mensal;
            financeiroMap[key].exito += exito;
          }
        }
      }

      if (c.status === 'proposal' && c.proposal_date) {
        const dProposta = new Date(c.proposal_date + 'T12:00:00');
        dProposta.setDate(1); dProposta.setHours(0,0,0,0);
        if (dProposta >= dataLimite12Meses) {
              const key = dProposta.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
              if (propostasMap[key]) {
                  propostasMap[key].pl += pl;
                  propostasMap[key].fixo += mensal;
                  propostasMap[key].exito += exito;
              }
        }
      }

      const dProspect = c.prospect_date ? new Date(c.prospect_date + 'T12:00:00') : null;
      const dProposal = c.proposal_date ? new Date(c.proposal_date + 'T12:00:00') : null;
      const dContract = c.contract_date ? new Date(c.contract_date + 'T12:00:00') : null;

      if (dProspect && dProposal && dProposal >= dProspect) {
          const diffTime = Math.abs(dProposal.getTime() - dProspect.getTime());
          somaDiasProspectProposta += Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          qtdProspectProposta++;
      }
      if (dProposal && dContract && dContract >= dProposal) {
          const diffTime = Math.abs(dContract.getTime() - dProposal.getTime());
          somaDiasPropostaFechamento += Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          qtdPropostaFechamento++;
      }

      mGeral.totalCasos++;
      if (c.status === 'analysis') mGeral.emAnalise++;
      if (c.status === 'rejected') mGeral.rejeitados++;
      if (c.status === 'probono') mGeral.probono++;
      
      if (c.status === 'proposal') {
        mGeral.propostasAtivas++;
        mGeral.valorEmNegociacaoPL += (pl + mensal); 
        mGeral.valorEmNegociacaoExito += exito;
      }
      
      if (c.status === 'active') {
        mGeral.fechados++;
        mGeral.receitaRecorrenteAtiva += mensal;
        mGeral.totalFechadoPL += pl;
        mGeral.totalFechadoExito += exito;
        c.physical_signature === true ? mGeral.assinados++ : mGeral.naoAssinados++;
      }

      if (c.status === 'analysis' && isDateInCurrentWeek(c.prospect_date)) mSemana.novos++;
      if (c.status === 'proposal' && isDateInCurrentWeek(c.proposal_date)) {
        mSemana.propQtd++; mSemana.propPL += pl; mSemana.propExito += exito; mSemana.propMensal += mensal;
      }
      if (c.status === 'active' && isDateInCurrentWeek(c.contract_date)) {
        mSemana.fechQtd++; mSemana.fechPL += pl; mSemana.fechExito += exito; mSemana.fechMensal += mensal;
      }
      if (c.status === 'rejected' && isDateInCurrentWeek(c.rejection_date)) mSemana.rejeitados++;
      if (c.status === 'probono' && isDateInCurrentWeek(c.probono_date || c.contract_date)) mSemana.probono++;

      if (c.status === 'proposal' && isDateInPreviousWeek(c.proposal_date)) {
          mSemanaAnterior.propPL += pl; mSemanaAnterior.propExito += exito; mSemanaAnterior.propMensal += mensal;
      }
      if (c.status === 'active' && isDateInPreviousWeek(c.contract_date)) {
          mSemanaAnterior.fechPL += pl; mSemanaAnterior.fechExito += exito; mSemanaAnterior.fechMensal += mensal;
      }

      if (c.status === 'analysis' && isDateInCurrentMonth(c.prospect_date)) mMes.analysis++;
      if (c.status === 'proposal' && isDateInCurrentMonth(c.proposal_date)) {
        mMes.propQtd++; mMes.propPL += pl; mMes.propExito += exito; mMes.propMensal += mensal;
      }
      if (c.status === 'active' && isDateInCurrentMonth(c.contract_date)) {
        mMes.fechQtd++; mMes.fechPL += pl; mMes.fechExito += exito; mMes.fechMensal += mensal;
      }
      if (c.status === 'rejected' && isDateInCurrentMonth(c.rejection_date)) mMes.rejected++;
      if (c.status === 'probono' && isDateInCurrentMonth(c.probono_date || c.contract_date)) mMes.probono++;

      const contractDates = [c.prospect_date, c.proposal_date, c.contract_date, c.rejection_date, c.probono_date];
      if (contractDates.some(date => isDateInCurrentWeek(date))) mSemana.totalUnico++;
      if (contractDates.some(date => isDateInCurrentMonth(date))) mMes.totalUnico++;

      fTotal++;
      const chegouEmProposta = c.status === 'proposal' || c.status === 'active' || (c.status === 'rejected' && c.proposal_date);
      if (chegouEmProposta) fQualificados++;
      if (c.status === 'active') fFechados++;
      else if (c.status === 'rejected') c.proposal_date ? fPerdaNegociacao++ : fPerdaAnalise++;
    });

    // Processamento Gráficos
    const finArray = Object.entries(financeiroMap).map(([mes, vals]) => ({ mes, ...vals })).sort((a, b) => a.data.getTime() - b.data.getTime());
    const totalPL12 = finArray.reduce((acc, curr) => acc + curr.pl + curr.fixo, 0); 
    const totalExito12 = finArray.reduce((acc, curr) => acc + curr.exito, 0);
    const monthsCount = finArray.length || 1;
    setMediasFinanceiras({ pl: totalPL12 / monthsCount, exito: totalExito12 / monthsCount });

    const totalFechado12Meses = finArray.reduce((acc, curr) => acc + curr.pl + curr.fixo + curr.exito, 0);
    const mediaFechadoMes = finArray.length > 0 ? totalFechado12Meses / finArray.length : 0;
    const ultimoFechado = finArray.length > 0 ? finArray[finArray.length - 1].pl + finArray[finArray.length - 1].fixo + finArray[finArray.length - 1].exito : 0;
    const penultimoFechado = finArray.length > 1 ? finArray[finArray.length - 2].pl + finArray[finArray.length - 2].fixo + finArray[finArray.length - 2].exito : 0;
    setStatsFinanceiro({ total: totalFechado12Meses, media: mediaFechadoMes, diff: ultimoFechado - penultimoFechado });

    const maxValFin = Math.max(...finArray.map(i => Math.max(i.pl, i.fixo, i.exito)), 1);
    setFinanceiro12Meses(finArray.map(i => ({ ...i, hPl: (i.pl / maxValFin) * 100, hFixo: (i.fixo / maxValFin) * 100, hExito: (i.exito / maxValFin) * 100 })));

    const propArray = Object.entries(propostasMap).map(([mes, vals]) => ({ mes, ...vals })).sort((a, b) => a.data.getTime() - b.data.getTime());
    const totalPropPL12 = propArray.reduce((acc, curr) => acc + curr.pl + curr.fixo, 0);
    const totalPropExito12 = propArray.reduce((acc, curr) => acc + curr.exito, 0);
    const monthsCountProp = propArray.length || 1;
    setMediasPropostas({ pl: totalPropPL12 / monthsCountProp, exito: totalPropExito12 / monthsCountProp });

    const totalPropostas12Meses = propArray.reduce((acc, curr) => acc + curr.pl + curr.fixo + curr.exito, 0);
    const mediaPropostasMes = propArray.length > 0 ? totalPropostas12Meses / propArray.length : 0;
    const ultimoProp = propArray.length > 0 ? propArray[propArray.length - 1].pl + propArray[propArray.length - 1].fixo + propArray[propArray.length - 1].exito : 0;
    const penultimoProp = propArray.length > 1 ? propArray[propArray.length - 2].pl + propArray[propArray.length - 2].fixo + propArray[propArray.length - 2].exito : 0;
    setStatsPropostas({ total: totalPropostas12Meses, media: mediaPropostasMes, diff: ultimoProp - penultimoProp });

    const maxValProp = Math.max(...propArray.map(i => Math.max(i.pl, i.fixo, i.exito)), 1);
    setPropostas12Meses(propArray.map(i => ({ ...i, hPl: (i.pl / maxValProp) * 100, hFixo: (i.fixo / maxValProp) * 100, hExito: (i.exito / maxValProp) * 100 })));

    setFunil({ 
        totalEntrada: fTotal, 
        qualificadosProposta: fQualificados, 
        fechados: fFechados, 
        perdaAnalise: fPerdaAnalise, 
        perdaNegociacao: fPerdaNegociacao, 
        taxaConversaoProposta: fTotal > 0 ? ((fQualificados / fTotal) * 100).toFixed(1) : '0', 
        taxaConversaoFechamento: fQualificados > 0 ? ((fFechados / fQualificados) * 100).toFixed(1) : '0',
        tempoMedioProspectProposta: qtdProspectProposta > 0 ? Math.round(somaDiasProspectProposta / qtdProspectProposta) : 0,
        tempoMedioPropostaFechamento: qtdPropostaFechamento > 0 ? Math.round(somaDiasPropostaFechamento / qtdPropostaFechamento) : 0
    });

    const mesesGrafico = [];
    let iteradorGrafico = new Date(dataInicioFixo);
    while (iteradorGrafico <= hoje) {
        const key = iteradorGrafico.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        mesesGrafico.push({ mes: key, qtd: mapaMeses[key] || 0, altura: 0 });
        iteradorGrafico.setMonth(iteradorGrafico.getMonth() + 1);
    }
    const maxQtd = Math.max(...mesesGrafico.map((m) => m.qtd), 1);
    mesesGrafico.forEach((m) => (m.altura = (m.qtd / maxQtd) * 100));
    setEvolucaoMensal(mesesGrafico);

    mGeral.mediaMensalNegociacaoPL = mGeral.valorEmNegociacaoPL / monthsCountProp;
    mGeral.mediaMensalNegociacaoExito = mGeral.valorEmNegociacaoExito / monthsCountProp;
    mGeral.mediaMensalCarteiraPL = mGeral.totalFechadoPL / monthsCount;
    mGeral.mediaMensalCarteiraExito = mGeral.totalFechadoExito / monthsCount;

    setMetrics({ semana: mSemana, semanaAnterior: mSemanaAnterior, mes: mMes, executivo: mExecutivo, geral: mGeral });

    const formatRejection = (counts: Record<string, number>) => {
        return Object.entries(counts)
            .map(([label, value]) => ({ 
                label, 
                value, 
                percent: totalRejected > 0 ? (value / totalRejected) * 100 : 0 
            }))
            .sort((a, b) => b.value - a.value); 
    };

    setRejectionData({
        reasons: formatRejection(reasonCounts),
        sources: formatRejection(sourceCounts)
    });

    setContractsByPartner(Object.entries(partnerCounts)
        .map(([name, stats]: any) => ({ name, ...stats }))
        .sort((a: any, b: any) => b.total - a.total));
  };

  return {
    loading,
    metrics,
    funil,
    evolucaoMensal,
    financeiro12Meses,
    statsFinanceiro,
    propostas12Meses,
    statsPropostas,
    mediasFinanceiras,
    mediasPropostas,
    rejectionData,
    contractsByPartner,
    refresh: fetchDashboardData
  };
}