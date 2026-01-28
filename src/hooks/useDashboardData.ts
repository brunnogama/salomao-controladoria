import { useState, useEffect, useMemo } from 'react';
import { contractService } from '../services/contractService';
import { partnerService } from '../services/partnerService';
import { Contract, Partner, ContractCase } from '../types';

// --- Funções Auxiliares de Parsing e Data ---

// Garante que o valor monetário (string 'R$ 1.000,00' ou number) seja convertido corretamente para float
const safeParseMoney = (value: string | number | undefined | null): number => {
  if (value === undefined || value === null || value === '') return 0;
  if (typeof value === 'number') return value;
  
  const strVal = String(value).trim();
  
  // Se já for um número em string simples (ex: "1000.50"), retorna direto
  if (!strVal.includes('R$') && !strVal.includes(',') && !isNaN(Number(strVal))) {
    return parseFloat(strVal);
  }

  // Remove tudo que não for dígito, vírgula ou sinal de menos
  // Ex: "R$ 1.500,00" -> "1500,00"
  const cleanStr = strVal.replace(/[^\d,-]/g, '').replace(',', '.');
  
  const floatVal = parseFloat(cleanStr);
  return isNaN(floatVal) ? 0 : floatVal;
};

// Helpers de Data
const isDateInCurrentWeek = (dateString?: string) => { if (!dateString) return false; const d = new Date(dateString + 'T12:00:00'); const t = new Date(); const cd = t.getDay(); const s = new Date(t); s.setDate(t.getDate() - cd); s.setHours(0,0,0,0); const e = new Date(s); e.setDate(s.getDate() + 6); e.setHours(23,59,59,999); return d >= s && d <= e; };
const isDateInPreviousWeek = (dateString?: string) => { if (!dateString) return false; const d = new Date(dateString + 'T12:00:00'); const t = new Date(); const cd = t.getDay(); const sc = new Date(t); sc.setDate(t.getDate() - cd); sc.setHours(0,0,0,0); const sp = new Date(sc); sp.setDate(sc.getDate() - 7); const ep = new Date(sp); ep.setDate(sp.getDate() + 6); ep.setHours(23,59,59,999); return d >= sp && d <= ep; };
const isDateInCurrentMonth = (dateString?: string) => { if (!dateString) return false; const d = new Date(dateString + 'T12:00:00'); const t = new Date(); return d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear(); };

// Nova lógica MTD (Month to Date)
const isDateInLastMonthMTD = (dateString?: string) => {
    if (!dateString) return false;
    const d = new Date(dateString + 'T12:00:00');
    const today = new Date();
    
    // Define o mês anterior
    let lastMonth = today.getMonth() - 1;
    let lastYear = today.getFullYear();
    if (lastMonth < 0) { lastMonth = 11; lastYear--; }

    // Verifica se é do mês/ano anterior
    const isSameMonth = d.getMonth() === lastMonth && d.getFullYear() === lastYear;
    
    // Verifica se o dia é menor ou igual ao dia de hoje (Lógica MTD)
    // Ex: Se hoje é dia 15, considera apenas datas até dia 15 do mês anterior
    const isWithinDayLimit = d.getDate() <= today.getDate();

    return isSameMonth && isWithinDayLimit;
};

// Formata data curta (ex: 01/jan)
const formatDateShort = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');

// ATUALIZAÇÃO: Hook aceita filtros opcionais
export function useDashboardData(selectedPartner?: string, selectedLocation?: string) {
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [ contratosData, sociosData ] = await Promise.all([
          contractService.getAll(),
          partnerService.getAll()
      ]);

      setContracts(contratosData);
      setPartners(sociosData);
    } catch (error) {
      console.error("Erro ao buscar dados do dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const unsubscribe = contractService.subscribe(() => { fetchDashboardData(); });
    return () => { unsubscribe(); };
  }, []);

  const dashboardData = useMemo(() => {
    const hoje = new Date();
    // Data de início para gráficos de 12 meses
    const dataInicioFixo = new Date(2025, 5, 1); 
    
    // --- FILTRAGEM DOS DADOS ---
    const filteredContracts = contracts.filter(c => {
        const matchesPartner = selectedPartner ? c.partner_id === selectedPartner : true;
        const matchesLocation = selectedLocation ? c.billing_location === selectedLocation : true;
        return matchesPartner && matchesLocation;
    });
    // ---------------------------

    // --- GERAÇÃO DOS LABELS DE PERÍODO ---
    const primeiroDiaMesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const periodoAtualStr = `${formatDateShort(primeiroDiaMesAtual)} - ${formatDateShort(hoje)}`;

    let lastMonth = hoje.getMonth() - 1;
    let lastYear = hoje.getFullYear();
    if (lastMonth < 0) { lastMonth = 11; lastYear--; }
    
    const primeiroDiaMesAnterior = new Date(lastYear, lastMonth, 1);
    const diaLimiteMesAnterior = new Date(lastYear, lastMonth, hoje.getDate());
    
    // Ajuste para não estourar o mês (ex: hoje é 31, e mês passado só tem 28)
    const maxDaysInLastMonth = new Date(lastYear, lastMonth + 1, 0).getDate();
    if (diaLimiteMesAnterior.getDate() > maxDaysInLastMonth) {
        diaLimiteMesAnterior.setDate(maxDaysInLastMonth);
    }
    
    const periodoAnteriorStr = `${formatDateShort(primeiroDiaMesAnterior)} - ${formatDateShort(diaLimiteMesAnterior)}`;
    // -------------------------------------

    const partnerMap = partners.reduce((acc: any, s: any) => {
        acc[s.id] = s.name;
        return acc;
    }, {});

    // Inicialização das Métricas
    let mSemana = { novos: 0, propQtd: 0, propPL: 0, propExito: 0, propMensal: 0, fechQtd: 0, fechPL: 0, fechExito: 0, fechMensal: 0, rejeitados: 0, probono: 0, totalUnico: 0 };
    let mSemanaAnterior = { propPL: 0, propExito: 0, propMensal: 0, fechPL: 0, fechExito: 0, fechMensal: 0 };
    let mMes = { novos: 0, propQtd: 0, propPL: 0, propExito: 0, propMensal: 0, fechQtd: 0, fechPL: 0, fechExito: 0, fechMensal: 0, totalUnico: 0, analysis: 0, rejected: 0, probono: 0 };
    
    // Adicionados os labels de período no objeto executivo
    let mExecutivo = { 
        mesAtual: { novos: 0, propQtd: 0, propPL: 0, propExito: 0, propMensal: 0, fechQtd: 0, fechPL: 0, fechExito: 0, fechMensal: 0 }, 
        mesAnterior: { novos: 0, propQtd: 0, propPL: 0, propExito: 0, propMensal: 0, fechQtd: 0, fechPL: 0, fechExito: 0, fechMensal: 0 },
        periodoAtualLabel: periodoAtualStr,
        periodoAnteriorLabel: periodoAnteriorStr
    };

    // Estrutura atualizada com todos os campos necessários para a view detalhada
    let mGeral = { 
        totalCasos: 0, emAnalise: 0, propostasAtivas: 0, fechados: 0, rejeitados: 0, probono: 0, 
        
        // Propostas
        valorEmNegociacaoPL: 0, 
        valorEmNegociacaoExito: 0, 
        valorEmNegociacaoMensal: 0, // Novo
        valorEmNegociacaoOutros: 0, // Novo (Outros + Fixo Pontual)

        // Fechados
        receitaRecorrenteAtiva: 0, // Fixo Mensal
        totalFechadoPL: 0, 
        totalFechadoExito: 0, 
        totalFechadoOutros: 0, // Novo (Outros + Fixo Pontual)
        totalFechadoFixo: 0, // Legado

        assinados: 0, naoAssinados: 0, 
        mediaMensalNegociacaoPL: 0, mediaMensalNegociacaoExito: 0, 
        mediaMensalCarteiraPL: 0, mediaMensalCarteiraExito: 0 
    };

    let fTotal = 0; let fQualificados = 0; let fFechados = 0;
    let fPerdaAnalise = 0; let fPerdaNegociacao = 0;
    let somaDiasProspectProposta = 0; let qtdProspectProposta = 0;
    let somaDiasPropostaFechamento = 0; let qtdPropostaFechamento = 0;

    const mapaMeses: Record<string, number> = {};
    const financeiroMap: Record<string, { pl: number, fixo: number, exito: number, data: Date }> = {};
    const propostasMap: Record<string, { pl: number, fixo: number, exito: number, data: Date }> = {};
    
    const reasonCounts: Record<string, number> = {};
    const sourceCounts: Record<string, number> = {};
    let totalRejected = 0;
    const partnerCounts: Record<string, any> = {};

    // Prepara mapa de meses vazio para os últimos 12 meses
    let iteradorMeses = new Date(dataInicioFixo);
    while (iteradorMeses <= hoje) {
      const key = iteradorMeses.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      financeiroMap[key] = { pl: 0, fixo: 0, exito: 0, data: new Date(iteradorMeses) };
      propostasMap[key] = { pl: 0, fixo: 0, exito: 0, data: new Date(iteradorMeses) };
      iteradorMeses.setMonth(iteradorMeses.getMonth() + 1);
    }
    const dataLimite12Meses = dataInicioFixo;

    // --- LOOP PRINCIPAL DE CÁLCULO (USANDO FILTRADOS) ---
    filteredContracts.forEach((c) => {
      // 1. LEITURA DOS VALORES (Foco nos totais do placeholder)
      let pl = safeParseMoney(c.pro_labore);
      let exito = safeParseMoney(c.final_success_fee);
      let mensal = safeParseMoney(c.fixed_monthly_fee);
      let outros = safeParseMoney(c.other_fees);
      
      // Tenta ler honorário fixo pontual
      let fixoPontual = safeParseMoney((c as any).fixed_fee);
      if (fixoPontual === 0) fixoPontual = safeParseMoney((c as any).honorarios_fixos);

      // 2. ADIÇÃO DE EXTRAS
      if (c.pro_labore_extras && Array.isArray(c.pro_labore_extras)) pl += c.pro_labore_extras.reduce((acc, val) => acc + safeParseMoney(val), 0);
      if (c.final_success_extras && Array.isArray(c.final_success_extras)) exito += c.final_success_extras.reduce((acc, val) => acc + safeParseMoney(val), 0);
      if (c.fixed_monthly_extras && Array.isArray(c.fixed_monthly_extras)) mensal += c.fixed_monthly_extras.reduce((acc, val) => acc + safeParseMoney(val), 0);
      if (c.other_fees_extras && Array.isArray(c.other_fees_extras)) outros += c.other_fees_extras.reduce((acc, val) => acc + safeParseMoney(val), 0);
      if (c.fixed_monthly_extras && Array.isArray(c.fixed_monthly_extras)) mensal += c.fixed_monthly_extras.reduce((acc, val) => acc + safeParseMoney(val), 0);
      if (c.other_fees_extras && Array.isArray(c.other_fees_extras)) outros += c.other_fees_extras.reduce((acc, val) => acc + safeParseMoney(val), 0);
      
      // IMPORTANTE: NÃO somamos mais 'outros' ao 'pl'. Mantemos separados.
      
      // Extras Intermediários somam ao Êxito
      if (c.intermediate_fees && Array.isArray(c.intermediate_fees)) exito += c.intermediate_fees.reduce((acc, val) => acc + safeParseMoney(val), 0);
      
      // Soma de casos anexados (se houver)
      if (c.cases && Array.isArray(c.cases)) {
        c.cases.forEach((caseItem: ContractCase) => {
          pl += safeParseMoney(caseItem.pro_labore);
          exito += safeParseMoney(caseItem.final_success_fee || caseItem.success_fee);
        });
      }

      // 3. DATAS E FLUXO
      const statusDates = [c.prospect_date, c.proposal_date, c.contract_date, c.rejection_date, c.probono_date].filter(d => d && d !== '').map(d => new Date(d + 'T12:00:00'));
      let dataEntradaReal = null;
      if (statusDates.length > 0) dataEntradaReal = new Date(Math.min(...statusDates.map(d => d.getTime())));
      else dataEntradaReal = c.created_at ? new Date(c.created_at) : new Date();

      const mesAnoEntrada = dataEntradaReal.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      if (mapaMeses[mesAnoEntrada] !== undefined) mapaMeses[mesAnoEntrada]++;
      else { if (!mapaMeses[mesAnoEntrada]) mapaMeses[mesAnoEntrada] = 0; mapaMeses[mesAnoEntrada]++; }

      // Comparativo de Entrada (Novos) - LOGICA MTD
      const dataEntradaISO = dataEntradaReal.toISOString().split('T')[0];
      if (isDateInCurrentMonth(dataEntradaISO)) mExecutivo.mesAtual.novos++;
      if (isDateInLastMonthMTD(dataEntradaISO)) mExecutivo.mesAnterior.novos++;

      // 4. MÉTODOS DE CÁLCULO POR STATUS - LOGICA MTD
      if (c.proposal_date) {
         if (isDateInCurrentMonth(c.proposal_date)) { 
             mExecutivo.mesAtual.propQtd++; 
             mExecutivo.mesAtual.propPL += pl; 
             mExecutivo.mesAtual.propExito += exito; 
             mExecutivo.mesAtual.propMensal += mensal; 
         }
         if (isDateInLastMonthMTD(c.proposal_date)) { 
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
         if (isDateInLastMonthMTD(c.contract_date)) { 
             mExecutivo.mesAnterior.fechQtd++; 
             mExecutivo.mesAnterior.fechPL += pl; 
             mExecutivo.mesAnterior.fechExito += exito; 
             mExecutivo.mesAnterior.fechMensal += mensal; 
         }
      }

      // Contagem por Sócio e Financeiro
      const pName = (c.partner_id && partnerMap[c.partner_id]) || c.responsavel_socio || 'Não Informado';
      if (!partnerCounts[pName]) partnerCounts[pName] = { 
          total: 0, analysis: 0, proposal: 0, active: 0, rejected: 0, probono: 0,
          pl: 0, exito: 0, fixo: 0 
      };
      
      partnerCounts[pName].total++;
      if (c.status === 'analysis') partnerCounts[pName].analysis++;
      else if (c.status === 'proposal') partnerCounts[pName].proposal++;
      else if (c.status === 'active') {
          partnerCounts[pName].active++;
          partnerCounts[pName].pl += pl;
          partnerCounts[pName].exito += exito;
          partnerCounts[pName].fixo += mensal;
      }
      else if (c.status === 'rejected') partnerCounts[pName].rejected++;
      else if (c.status === 'probono') partnerCounts[pName].probono++;

      // Rejeições
      if (c.status === 'rejected') {
          totalRejected++;
          const reason = c.rejection_reason || 'Não informado';
          const source = c.rejection_source || c.rejection_by || 'Não informado';
          reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
          sourceCounts[source] = (sourceCounts[source] || 0) + 1;
      }

      // Mapas Financeiros (Gráficos)
      if (c.status === 'active' && c.contract_date) {
        const dContrato = new Date(c.contract_date + 'T12:00:00');
        dContrato.setDate(1); dContrato.setHours(0,0,0,0);
        if (dContrato >= dataLimite12Meses) {
          const key = dContrato.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
          if (financeiroMap[key]) { financeiroMap[key].pl += pl; financeiroMap[key].fixo += mensal; financeiroMap[key].exito += exito; }
        }
      }

      if (c.status === 'proposal' && c.proposal_date) {
        const dProposta = new Date(c.proposal_date + 'T12:00:00');
        dProposta.setDate(1); dProposta.setHours(0,0,0,0);
        if (dProposta >= dataLimite12Meses) {
              const key = dProposta.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
              if (propostasMap[key]) { propostasMap[key].pl += pl; propostasMap[key].fixo += mensal; propostasMap[key].exito += exito; }
        }
      }

      // Tempos Médios (Funil)
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

      // Totais Gerais
      mGeral.totalCasos++;
      if (c.status === 'analysis') mGeral.emAnalise++;
      if (c.status === 'rejected') mGeral.rejeitados++;
      if (c.status === 'probono') mGeral.probono++;
      
      if (c.status === 'proposal') { 
          mGeral.propostasAtivas++; 
          
          mGeral.valorEmNegociacaoPL += pl;
          mGeral.valorEmNegociacaoExito += exito;
          mGeral.valorEmNegociacaoMensal += mensal;
          mGeral.valorEmNegociacaoOutros += (outros + fixoPontual); 
      }
      
      if (c.status === 'active') { 
          mGeral.fechados++; 
          
          mGeral.receitaRecorrenteAtiva += mensal; 
          mGeral.totalFechadoPL += pl; 
          mGeral.totalFechadoExito += exito; 
          
          // Agrupamento de Outros + Fixo Pontual
          mGeral.totalFechadoOutros += (outros + fixoPontual); 
          mGeral.totalFechadoFixo += fixoPontual; // Mantido para legado se necessário
          
          c.physical_signature === true ? mGeral.assinados++ : mGeral.naoAssinados++; 
      }

      // Semana Atual
      if (c.status === 'analysis' && isDateInCurrentWeek(c.prospect_date)) mSemana.novos++;
      if (c.status === 'proposal' && isDateInCurrentWeek(c.proposal_date)) { mSemana.propQtd++; mSemana.propPL += pl; mSemana.propExito += exito; mSemana.propMensal += mensal; }
      if (c.status === 'active' && isDateInCurrentWeek(c.contract_date)) { mSemana.fechQtd++; mSemana.fechPL += pl; mSemana.fechExito += exito; mSemana.fechMensal += mensal; }
      if (c.status === 'rejected' && isDateInCurrentWeek(c.rejection_date)) mSemana.rejeitados++;
      if (c.status === 'probono' && isDateInCurrentWeek(c.probono_date || c.contract_date)) mSemana.probono++;

      // Semana Anterior
      if (c.status === 'proposal' && isDateInPreviousWeek(c.proposal_date)) { mSemanaAnterior.propPL += pl; mSemanaAnterior.propExito += exito; mSemanaAnterior.propMensal += mensal; }
      if (c.status === 'active' && isDateInPreviousWeek(c.contract_date)) { mSemanaAnterior.fechPL += pl; mSemanaAnterior.fechExito += exito; mSemanaAnterior.fechMensal += mensal; }

      // Mês Atual (Geral - sem MTD, para resumo do mês)
      if (c.status === 'analysis' && isDateInCurrentMonth(c.prospect_date)) mMes.analysis++;
      if (c.status === 'proposal' && isDateInCurrentMonth(c.proposal_date)) { mMes.propQtd++; mMes.propPL += pl; mMes.propExito += exito; mMes.propMensal += mensal; }
      if (c.status === 'active' && isDateInCurrentMonth(c.contract_date)) { mMes.fechQtd++; mMes.fechPL += pl; mMes.fechExito += exito; mMes.fechMensal += mensal; }
      if (c.status === 'rejected' && isDateInCurrentMonth(c.rejection_date)) mMes.rejected++;
      if (c.status === 'probono' && isDateInCurrentMonth(c.probono_date || c.contract_date)) mMes.probono++;

      // Funil
      fTotal++;
      const chegouEmProposta = c.status === 'proposal' || c.status === 'active' || (c.status === 'rejected' && c.proposal_date);
      if (chegouEmProposta) fQualificados++;
      if (c.status === 'active') fFechados++;
      else if (c.status === 'rejected') c.proposal_date ? fPerdaNegociacao++ : fPerdaAnalise++;
    });
// =====================================================
// PATCH DE DEBUG PARA useDashboardData.ts
// =====================================================
// Cole este código logo APÓS a linha 270 (final do loop forEach)

console.log('==========================================');
console.log('📊 DEBUG FINAL - MÉTRICAS GERAIS');
console.log('==========================================');
console.log('Total de contratos ativos:', mGeral.fechados);
console.log('');
console.log('💰 VALORES DOS CONTRATOS FECHADOS:');
console.log('   Pro-labore:', mGeral.totalFechadoPL);
console.log('   Êxito:', mGeral.totalFechadoExito);
console.log('   Fixo Mensal:', mGeral.receitaRecorrenteAtiva);
console.log('   Outros:', mGeral.totalFechadoOutros);
console.log('');
console.log('📈 VALORES DAS PROPOSTAS:');
console.log('   Pro-labore:', mGeral.valorEmNegociacaoPL);
console.log('   Êxito:', mGeral.valorEmNegociacaoExito);
console.log('   Fixo Mensal:', mGeral.valorEmNegociacaoMensal);
console.log('   Outros:', mGeral.valorEmNegociacaoOutros);
console.log('==========================================');

// =====================================================
// INSTRUÇÕES:
// 1. Cole este código no arquivo useDashboardData.ts
// 2. Salve o arquivo
// 3. Abra o Dashboard no navegador
// 4. Pressione F12 para abrir o console
// 5. Recarregue a página (Ctrl+R ou Cmd+R)
// 6. Me envie o que aparece no console
// =====================================================
    // Totais Calculados
    mSemana.totalUnico = mSemana.novos + mSemana.propQtd + mSemana.fechQtd + mSemana.rejeitados + mSemana.probono;
    mMes.totalUnico = mMes.analysis + mMes.propQtd + mMes.fechQtd + mMes.rejected + mMes.probono;

    // Processamento dos Gráficos
    const finArray = Object.entries(financeiroMap).map(([mes, vals]) => ({ mes, ...vals })).sort((a, b) => a.data.getTime() - b.data.getTime());
    const totalPL12 = finArray.reduce((acc, curr) => acc + curr.pl + curr.fixo, 0); const totalExito12 = finArray.reduce((acc, curr) => acc + curr.exito, 0);
    const monthsCount = finArray.length || 1;
    const mediasFinanceiras = { pl: totalPL12 / monthsCount, exito: totalExito12 / monthsCount };
    const totalFechado12Meses = finArray.reduce((acc, curr) => acc + curr.pl + curr.fixo + curr.exito, 0);
    const mediaFechadoMes = finArray.length > 0 ? totalFechado12Meses / finArray.length : 0;
    const ultimoFechado = finArray.length > 0 ? finArray[finArray.length - 1].pl + finArray[finArray.length - 1].fixo + finArray[finArray.length - 1].exito : 0;
    const penultimoFechado = finArray.length > 1 ? finArray[finArray.length - 2].pl + finArray[finArray.length - 2].fixo + finArray[finArray.length - 2].exito : 0;
    const statsFinanceiro = { total: totalFechado12Meses, media: mediaFechadoMes, diff: ultimoFechado - penultimoFechado };
    const maxValFin = Math.max(...finArray.map(i => Math.max(i.pl, i.fixo, i.exito)), 1);
    const financeiro12Meses = finArray.map(i => ({ ...i, hPl: (i.pl / maxValFin) * 100, hFixo: (i.fixo / maxValFin) * 100, hExito: (i.exito / maxValFin) * 100 }));

    const propArray = Object.entries(propostasMap).map(([mes, vals]) => ({ mes, ...vals })).sort((a, b) => a.data.getTime() - b.data.getTime());
    const totalPropPL12 = propArray.reduce((acc, curr) => acc + curr.pl + curr.fixo, 0); const totalPropExito12 = propArray.reduce((acc, curr) => acc + curr.exito, 0);
    const monthsCountProp = propArray.length || 1;
    const mediasPropostas = { pl: totalPropPL12 / monthsCountProp, exito: totalPropExito12 / monthsCountProp };
    const totalPropostas12Meses = propArray.reduce((acc, curr) => acc + curr.pl + curr.fixo + curr.exito, 0);
    const mediaPropostasMes = propArray.length > 0 ? totalPropostas12Meses / propArray.length : 0;
    const ultimoProp = propArray.length > 0 ? propArray[propArray.length - 1].pl + propArray[propArray.length - 1].fixo + propArray[propArray.length - 1].exito : 0;
    const penultimoProp = propArray.length > 1 ? propArray[propArray.length - 2].pl + propArray[propArray.length - 2].fixo + propArray[propArray.length - 2].exito : 0;
    const statsPropostas = { total: totalPropostas12Meses, media: mediaPropostasMes, diff: ultimoProp - penultimoProp };
    const maxValProp = Math.max(...propArray.map(i => Math.max(i.pl, i.fixo, i.exito)), 1);
    const propostas12Meses = propArray.map(i => ({ ...i, hPl: (i.pl / maxValProp) * 100, hFixo: (i.fixo / maxValProp) * 100, hExito: (i.exito / maxValProp) * 100 }));

    const funil = { totalEntrada: fTotal, qualificadosProposta: fQualificados, fechados: fFechados, perdaAnalise: fPerdaAnalise, perdaNegociacao: fPerdaNegociacao, taxaConversaoProposta: fTotal > 0 ? ((fQualificados / fTotal) * 100).toFixed(1) : '0', taxaConversaoFechamento: fQualificados > 0 ? ((fFechados / fQualificados) * 100).toFixed(1) : '0', tempoMedioProspectProposta: qtdProspectProposta > 0 ? Math.round(somaDiasProspectProposta / qtdProspectProposta) : 0, tempoMedioPropostaFechamento: qtdPropostaFechamento > 0 ? Math.round(somaDiasPropostaFechamento / qtdPropostaFechamento) : 0 };

    const mesesGrafico = []; let iteradorGrafico = new Date(dataInicioFixo); while (iteradorGrafico <= hoje) { const key = iteradorGrafico.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }); mesesGrafico.push({ mes: key, qtd: mapaMeses[key] || 0, altura: 0 }); iteradorGrafico.setMonth(iteradorGrafico.getMonth() + 1); } const maxQtd = Math.max(...mesesGrafico.map((m) => m.qtd), 1); mesesGrafico.forEach((m) => (m.altura = (m.qtd / maxQtd) * 100));
    const evolucaoMensal = mesesGrafico;

    mGeral.mediaMensalNegociacaoPL = mGeral.valorEmNegociacaoPL / monthsCountProp; mGeral.mediaMensalNegociacaoExito = mGeral.valorEmNegociacaoExito / monthsCountProp; mGeral.mediaMensalCarteiraPL = mGeral.totalFechadoPL / monthsCount; mGeral.mediaMensalCarteiraExito = mGeral.totalFechadoExito / monthsCount;

    const metrics = { semana: mSemana, semanaAnterior: mSemanaAnterior, mes: mMes, executivo: mExecutivo, geral: mGeral };

    const formatRejection = (counts: Record<string, number>) => Object.entries(counts).map(([label, value]) => ({ label, value, percent: totalRejected > 0 ? (value / totalRejected) * 100 : 0 })).sort((a, b) => b.value - a.value);
    const rejectionData = { reasons: formatRejection(reasonCounts), sources: formatRejection(sourceCounts) };
    const contractsByPartner = Object.entries(partnerCounts).map(([name, stats]: any) => ({ name, ...stats })).sort((a: any, b: any) => b.total - a.total);

    return { metrics, funil, evolucaoMensal, financeiro12Meses, statsFinanceiro, propostas12Meses, statsPropostas, mediasFinanceiras, mediasPropostas, rejectionData, contractsByPartner };
  }, [contracts, partners, selectedPartner, selectedLocation]);

  return { loading, refresh: fetchDashboardData, ...dashboardData };
}