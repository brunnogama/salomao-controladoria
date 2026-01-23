import { supabase } from '../lib/supabase';
import { Contract } from '../types';
import { addMonths } from 'date-fns';
import { safeParseFloat, ensureArray } from '../utils/contractHelpers';
import { parseCurrency } from '../utils/masks'; // Import necessário para ler o valor formatado do breakdown

export const generateFinancialInstallments = async (contractId: string, sourceData: Contract) => {
    if (sourceData.status !== 'active') return;
    const { error: deleteError } = await supabase.from('financial_installments').delete().eq('contract_id', contractId).eq('status', 'pending');
    if (deleteError) console.error("Erro ao limpar parcelas pendentes:", deleteError);
    
    const installmentsToInsert: any[] = [];
    
    // Atualizado para aceitar o array de detalhamento (breakdown)
    const addInstallments = (
        totalValueStr: string | undefined, 
        installmentsStr: string | undefined, 
        type: string, 
        clause?: string,
        breakdown?: { date: string, value: string }[]
    ) => {
      const totalValue = safeParseFloat(totalValueStr);
      if (totalValue <= 0) return;
      
      // LÓGICA 1: Se existir detalhamento manual, usa ele (Datas e Valores exatos)
      if (breakdown && breakdown.length > 0) {
        breakdown.forEach((item, index) => {
            const itemValue = parseCurrency(item.value);
            // Ignora parcelas zeradas ou datas inválidas se houver
            if (itemValue > 0 && item.date) {
                installmentsToInsert.push({
                    contract_id: contractId,
                    type: type,
                    installment_number: index + 1,
                    total_installments: breakdown.length,
                    amount: itemValue,
                    status: 'pending',
                    due_date: item.date, // Usa a data exata do input
                    clause: clause || null
                });
            }
        });
        return; // Encerra aqui para não rodar a lógica automática
      }

      // LÓGICA 2: Cálculo Automático (Legado)
      // Força garantia de valor numérico válido ANTES de qualquer processamento
      const numInstallments = (() => {
        if (!installmentsStr) return 1;
        const cleanStr = String(installmentsStr).replace(/[^0-9]/g, '');
        const parsed = parseInt(cleanStr, 10);
        return (parsed > 0) ? parsed : 1;
      })();
      
      const rawAmount = totalValue / numInstallments;
      // Arredondar para 2 casas decimais para evitar erros de inserção no banco (ex: dízimas)
      const amountPerInstallment = parseFloat(rawAmount.toFixed(2));

      for (let i = 1; i <= numInstallments; i++) {
        installmentsToInsert.push({ 
            contract_id: contractId, 
            type: type, 
            installment_number: i, 
            total_installments: numInstallments, 
            amount: amountPerInstallment, 
            status: 'pending', 
            due_date: addMonths(new Date(), i).toISOString(),
            clause: clause || null
        });
      }
    };

    // Main values com cláusulas e PASSANDO O BREAKDOWN
    addInstallments(
        sourceData.pro_labore, 
        sourceData.pro_labore_installments, 
        'pro_labore', 
        (sourceData as any).pro_labore_clause,
        (sourceData as any).pro_labore_breakdown
    );

    addInstallments(
        sourceData.final_success_fee, 
        sourceData.final_success_fee_installments, 
        'final_success_fee', 
        (sourceData as any).final_success_fee_clause,
        (sourceData as any).final_success_fee_breakdown
    );

    addInstallments(
        sourceData.fixed_monthly_fee, 
        sourceData.fixed_monthly_fee_installments, 
        'fixed', 
        (sourceData as any).fixed_monthly_fee_clause,
        (sourceData as any).fixed_monthly_fee_breakdown
    );

    addInstallments(
        sourceData.other_fees, 
        sourceData.other_fees_installments, 
        'other', 
        (sourceData as any).other_fees_clause,
        (sourceData as any).other_fees_breakdown
    );

    // Helper para processar extras com parcelamento individual
    const addExtraInstallments = (
        values: string[], 
        clauses: string[], 
        installments: string[], 
        type: string
    ) => {
        values.forEach((fee, idx) => {
            const val = safeParseFloat(fee);
            if (val <= 0) return;

            const instStr = installments[idx] || '1x';
            const cleanStr = String(instStr).replace(/[^0-9]/g, '');
            const numInst = parseInt(cleanStr || '1', 10);
            const clause = clauses[idx];
            
            const amountPer = parseFloat((val / numInst).toFixed(2));

            for(let i=1; i<=numInst; i++) {
                installmentsToInsert.push({ 
                    contract_id: contractId, 
                    type: type, 
                    installment_number: i, 
                    total_installments: numInst, 
                    amount: amountPer, 
                    status: 'pending', 
                    due_date: addMonths(new Date(), i).toISOString(), 
                    clause: clause || null 
                });
            }
        });
    };

    // Intermediate Fees Logic (Updated with Clauses and Array Check)
    if (sourceData.intermediate_fees && sourceData.intermediate_fees.length > 0) {
      const clausesList = ensureArray((sourceData as any).intermediate_fees_clauses);
      const installmentsList = ensureArray((sourceData as any).intermediate_fees_installments);
      addExtraInstallments(sourceData.intermediate_fees, clausesList, installmentsList, 'intermediate_fee');
    }

    // Pro Labore Extras
    if ((sourceData as any).pro_labore_extras && (sourceData as any).pro_labore_extras.length > 0) {
        const clausesList = ensureArray((sourceData as any).pro_labore_extras_clauses);
        const installmentsList = ensureArray((sourceData as any).pro_labore_extras_installments);
        addExtraInstallments((sourceData as any).pro_labore_extras, clausesList, installmentsList, 'pro_labore');
    }

    // Final Success Extras
    if ((sourceData as any).final_success_extras && (sourceData as any).final_success_extras.length > 0) {
        const clausesList = ensureArray((sourceData as any).final_success_extras_clauses);
        const installmentsList = ensureArray((sourceData as any).final_success_extras_installments);
        addExtraInstallments((sourceData as any).final_success_extras, clausesList, installmentsList, 'final_success_fee');
    }

    // Other Fees Extras
    if ((sourceData as any).other_fees_extras && (sourceData as any).other_fees_extras.length > 0) {
        const clausesList = ensureArray((sourceData as any).other_fees_extras_clauses);
        const installmentsList = ensureArray((sourceData as any).other_fees_extras_installments);
        addExtraInstallments((sourceData as any).other_fees_extras, clausesList, installmentsList, 'other');
    }

    // Fixed Monthly Extras
    if ((sourceData as any).fixed_monthly_extras && (sourceData as any).fixed_monthly_extras.length > 0) {
        const clausesList = ensureArray((sourceData as any).fixed_monthly_extras_clauses);
        const installmentsList = ensureArray((sourceData as any).fixed_monthly_extras_installments);
        addExtraInstallments((sourceData as any).fixed_monthly_extras, clausesList, installmentsList, 'fixed');
    }

    if (installmentsToInsert.length > 0) {
        const { error: insertError } = await supabase.from('financial_installments').insert(installmentsToInsert);
        if (insertError) console.error("Erro ao gerar parcelas financeiras:", insertError);
    }
};

export const forceUpdateFinancials = async (contractId: string, sourceData: Contract) => {
    const cleanPL = safeParseFloat(sourceData.pro_labore || "");
    const cleanSuccess = safeParseFloat(sourceData.final_success_fee || "");
    const cleanFixed = safeParseFloat(sourceData.fixed_monthly_fee || "");
    const cleanOther = safeParseFloat(sourceData.other_fees || "");

    await supabase.from('contracts').update({
      pro_labore: cleanPL,
      final_success_fee: cleanSuccess,
      fixed_monthly_fee: cleanFixed,
      other_fees: cleanOther,
      
      // GARANTINDO QUE AS PARCELAS SEJAM SALVAS EXPLICITAMENTE
      pro_labore_installments: (sourceData as any).pro_labore_installments,
      final_success_fee_installments: (sourceData as any).final_success_fee_installments,
      fixed_monthly_fee_installments: (sourceData as any).fixed_monthly_fee_installments,
      other_fees_installments: (sourceData as any).other_fees_installments,

      // --- NOVOS CAMPOS DE DETALHAMENTO (BREAKDOWN) ---
      pro_labore_breakdown: (sourceData as any).pro_labore_breakdown,
      final_success_fee_breakdown: (sourceData as any).final_success_fee_breakdown,
      fixed_monthly_fee_breakdown: (sourceData as any).fixed_monthly_fee_breakdown,
      other_fees_breakdown: (sourceData as any).other_fees_breakdown,
      // ------------------------------------------------

      // Garantindo que os extras também sejam salvos
      pro_labore_extras: (sourceData as any).pro_labore_extras,
      final_success_extras: (sourceData as any).final_success_extras,
      fixed_monthly_extras: (sourceData as any).fixed_monthly_extras,
      other_fees_extras: (sourceData as any).other_fees_extras,
      // Salvar timesheet se existir
      timesheet: (sourceData as any).timesheet,
      
      // Salvar as cláusulas principais
      pro_labore_clause: (sourceData as any).pro_labore_clause,
      final_success_fee_clause: (sourceData as any).final_success_fee_clause,
      fixed_monthly_fee_clause: (sourceData as any).fixed_monthly_fee_clause,
      other_fees_clause: (sourceData as any).other_fees_clause,

      // Salvar arrays de cláusulas extras (com ensureArray para limpar strings)
      pro_labore_extras_clauses: ensureArray((sourceData as any).pro_labore_extras_clauses),
      final_success_extras_clauses: ensureArray((sourceData as any).final_success_extras_clauses),
      fixed_monthly_extras_clauses: ensureArray((sourceData as any).fixed_monthly_extras_clauses),
      other_fees_extras_clauses: ensureArray((sourceData as any).other_fees_extras_clauses),
      intermediate_fees_clauses: ensureArray((sourceData as any).intermediate_fees_clauses),
      
      // Salvar arrays de parcelas dos extras
      pro_labore_extras_installments: ensureArray((sourceData as any).pro_labore_extras_installments),
      final_success_extras_installments: ensureArray((sourceData as any).final_success_extras_installments),
      fixed_monthly_extras_installments: ensureArray((sourceData as any).fixed_monthly_extras_installments),
      other_fees_extras_installments: ensureArray((sourceData as any).other_fees_extras_installments),
      intermediate_fees_installments: ensureArray((sourceData as any).intermediate_fees_installments),

    }).eq('id', contractId);
};