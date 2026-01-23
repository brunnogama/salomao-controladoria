import React from 'react';
import { Plus, X, Settings, AlertTriangle } from 'lucide-react';
import { Contract } from '../../../types';
import { CustomSelect } from '../../ui/CustomSelect';
import { FinancialInputWithInstallments } from './FinancialInputWithInstallments';
import { maskMoney, parseCurrency } from '../../../utils/masks';

interface StatusAndDatesSectionProps {
  formData: Contract;
  setFormData: React.Dispatch<React.SetStateAction<Contract>>;
  statusOptions: { label: string; value: string }[];
  handleCreateStatus: () => void;
  ensureDateValue: (dateStr?: string | null) => string;
  analystSelectOptions: { label: string; value: string }[];
  onOpenAnalystManager: () => void;
  rejectionByOptions: { label: string; value: string }[];
  rejectionReasonOptions: { label: string; value: string }[];
  partnerSelectOptions: { label: string; value: string }[];
  billingOptions: { label: string; value: string }[];
  maskHon: (value: string) => string;
  setActiveManager: (manager: string) => void;
  signatureOptions: { label: string; value: string }[];
  formatForInput: (val: string | number | undefined) => string | number;
  handleAddToList: (listField: string, valueField: any, installmentsListField?: string, installmentsSourceField?: any) => void;
  removeExtra: (field: string, index: number, installmentsListField?: string) => void;
  newIntermediateFee: string;
  setNewIntermediateFee: (v: string) => void;
  interimInstallments: string;
  setInterimInstallments: (v: string) => void;
  handleAddIntermediateFee: () => void;
  interimClause: string;
  setInterimClause: (v: string) => void;
  handleRemoveIntermediateFee: (idx: number) => void;
  ensureArray: (val: any) => string[];
}

export function StatusAndDatesSection(props: StatusAndDatesSectionProps) {
  const {
    formData, setFormData, statusOptions, handleCreateStatus, ensureDateValue,
    analystSelectOptions, onOpenAnalystManager, rejectionByOptions, rejectionReasonOptions,
    partnerSelectOptions, billingOptions, maskHon, setActiveManager, signatureOptions,
    formatForInput, handleAddToList, removeExtra,
    newIntermediateFee, setNewIntermediateFee, interimInstallments, setInterimInstallments,
    handleAddIntermediateFee, interimClause, setInterimClause, handleRemoveIntermediateFee, ensureArray
  } = props;

  // Helper para garantir string no input financeiro
  const safeString = (val: string | number | undefined) => {
      if (val === undefined || val === null) return '';
      return String(val);
  };

  // Helper para renderizar a tabela de parcelas (Local neste componente para ficar logo abaixo)
  const renderInstallmentBreakdown = (
      label: string, 
      valueField: keyof Contract, 
      breakdownField: string, 
      installmentField: keyof Contract
  ) => {
    const breakdown = (formData as any)[breakdownField] as { date: string, value: string }[] | undefined;
    
    // 1. LEITURA ROBUSTA DO VALOR TOTAL
    const rawVal = formData[valueField];
    let totalOriginal = 0;
    
    // Converte para número, lidando com string formatada ou number
    if (typeof rawVal === 'number') {
        totalOriginal = rawVal;
    } else if (typeof rawVal === 'string') {
        totalOriginal = rawVal ? parseCurrency(rawVal) : 0;
    }

    // 2. TRAVA DE SEGURANÇA (CORREÇÃO CRÍTICA)
    // Se o valor for 0, NaN, indefinido, ou parcelas for '1x', O BLOCO DEVE SUMIR.
    const installmentsStr = formData[installmentField] as string;
    
    if (!totalOriginal || isNaN(totalOriginal) || totalOriginal <= 0 || !installmentsStr || installmentsStr === '1x') {
        return null;
    }
    
    // Formata o valor total para exibição
    const totalValueStr = totalOriginal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    
    // Só renderiza se houver breakdown
    if (!breakdown || breakdown.length <= 1) return null;

    const totalCalculated = breakdown.reduce((acc, curr) => acc + parseCurrency(curr.value), 0);
    
    // Tolerância para erros de arredondamento
    const diff = Math.abs(totalOriginal - totalCalculated);
    const hasError = diff > 0.1;

    return (
        <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4 animate-in fade-in slide-in-from-top-2">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center justify-between">
                <span>Detalhamento de Parcelas - {label}</span>
                <span className="text-xs font-normal text-gray-500">Total: {totalValueStr}</span>
            </h4>
            
            <div className="grid grid-cols-12 gap-3 mb-2 px-2">
                <div className="col-span-2 text-xs font-medium text-gray-500">Parcela</div>
                <div className="col-span-5 text-xs font-medium text-gray-500">Data de Vencimento</div>
                <div className="col-span-5 text-xs font-medium text-gray-500">Valor</div>
            </div>

            <div className="space-y-2">
                {breakdown.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-3 items-center">
                        <div className="col-span-2 text-xs font-bold text-gray-600 pl-2">{idx + 1}ª</div>
                        <div className="col-span-5">
                            <input 
                                type="date" 
                                className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 focus:border-salomao-blue outline-none"
                                value={item.date}
                                onChange={(e) => {
                                    const newBreakdown = [...breakdown];
                                    newBreakdown[idx].date = e.target.value;
                                    setFormData(prev => ({...prev, [breakdownField]: newBreakdown} as any));
                                }}
                            />
                        </div>
                        <div className="col-span-5 relative">
                            <input 
                                type="text" 
                                className={`w-full text-xs border rounded px-2 py-1.5 outline-none ${hasError ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-salomao-blue'}`}
                                value={item.value}
                                onChange={(e) => {
                                    const newBreakdown = [...breakdown];
                                    // Remove tudo que não for dígito antes de mascarar, evita R$ duplicado
                                    const rawValue = e.target.value.replace(/\D/g, ''); 
                                    newBreakdown[idx].value = maskMoney(rawValue);
                                    setFormData(prev => ({...prev, [breakdownField]: newBreakdown} as any));
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {hasError && (
                <div className="mt-3 flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100">
                    <AlertTriangle className="w-4 h-4" />
                    <span>
                        O valor total das parcelas (R$ {totalCalculated.toLocaleString('pt-BR', {minimumFractionDigits: 2})}) 
                        não bate com o valor contratado ({totalValueStr}). Diferença: R$ {diff.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                    </span>
                </div>
            )}
        </div>
    );
  };

  return (
    <div className="bg-white/60 p-6 rounded-xl border border-white/40 shadow-sm backdrop-blur-sm relative z-50 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          <CustomSelect label="Status Atual do Caso" value={formData.status} onChange={(val: any) => setFormData({...formData, status: val})} options={statusOptions} onAction={handleCreateStatus} actionIcon={Plus} actionLabel="Adicionar Novo Status" />
          {formData.status && (
            <div className="animate-in fade-in slide-in-from-left-2">
                <label className="text-xs font-medium block mb-1">
                      {formData.status === 'analysis' ? 'Data do Prospect' :
                      formData.status === 'proposal' ? 'Data da Proposta' :
                      formData.status === 'active' ? 'Data da Assinatura' :
                      formData.status === 'rejected' ? 'Data da Rejeição' :
                      formData.status === 'probono' ? 'Data Probono' : 'Data do Status'}
                </label>
                <input 
                    type="date" 
                    className="w-full border border-gray-300 p-2.5 rounded-lg text-sm bg-white focus:border-salomao-blue outline-none" 
                    value={ensureDateValue(
                        formData.status === 'analysis' ? formData.prospect_date :
                        formData.status === 'proposal' ? formData.proposal_date :
                        formData.status === 'active' ? formData.contract_date :
                        formData.status === 'rejected' ? formData.rejection_date :
                        formData.status === 'probono' ? formData.probono_date : ''
                    )} 
                    onChange={e => {
                        const val = e.target.value;
                        if(formData.status === 'analysis') setFormData({...formData, prospect_date: val});
                        else if(formData.status === 'proposal') setFormData({...formData, proposal_date: val});
                        else if(formData.status === 'active') setFormData({...formData, contract_date: val});
                        else if(formData.status === 'rejected') setFormData({...formData, rejection_date: val});
                        else if(formData.status === 'probono') setFormData({...formData, probono_date: val});
                    }} 
                />
            </div>
          )}
      </div>

      {formData.status === 'analysis' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in slide-in-from-top-2">
            <div>
                <CustomSelect label="Analisado Por" value={formData.analyst_id || ''} onChange={(val: string) => setFormData({...formData, analyst_id: val})} options={analystSelectOptions} onAction={onOpenAnalystManager} actionIcon={Settings} actionLabel="Gerenciar Analistas" />
            </div>
        </div>
      )}

      {formData.status === 'rejected' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-in fade-in slide-in-from-top-2">
            <div>
                <CustomSelect label="Analisado por" value={formData.analyst_id || ''} onChange={(val: string) => setFormData({...formData, analyst_id: val})} options={analystSelectOptions} onAction={onOpenAnalystManager} actionIcon={Settings} actionLabel="Gerenciar Analistas" />
            </div>
            <div>
                <CustomSelect label="Quem rejeitou" value={formData.rejection_by || ''} onChange={(val: string) => setFormData({...formData, rejection_by: val})} options={rejectionByOptions} />
            </div>
            <div>
                <CustomSelect label="Motivo da Rejeição" value={formData.rejection_reason || ''} onChange={(val: string) => setFormData({...formData, rejection_reason: val})} options={rejectionReasonOptions} />
            </div>
        </div>
      )}

      {formData.status === 'probono' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in slide-in-from-top-2">
            <div>
                <CustomSelect label="Enviado Por" value={formData.partner_id || ''} onChange={(val: string) => setFormData({...formData, partner_id: val})} options={partnerSelectOptions} />
            </div>
        </div>
      )}

      {(formData.status === 'proposal' || formData.status === 'active') && (
      <div className="space-y-6 animate-in slide-in-from-top-2 pt-4 border-t border-gray-100">
        
        {formData.status === 'active' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end mb-4 animate-in fade-in">
                <div className="md:col-span-4"><label className="text-xs font-medium block mb-1 text-green-800">Número HON (Único) <span className="text-red-500">*</span></label><input type="text" className="w-full border-2 border-green-200 p-2.5 rounded-lg text-green-900 font-mono font-bold bg-white focus:border-green-500 outline-none" placeholder="00.000.000/000" value={formData.hon_number} onChange={e => setFormData({...formData, hon_number: maskHon(e.target.value)})} /></div>
                <div className="md:col-span-4"><CustomSelect label="Local Faturamento *" value={formData.billing_location || ''} onChange={(val: string) => setFormData({...formData, billing_location: val})} options={billingOptions} onAction={() => setActiveManager('location')} actionLabel="Gerenciar Locais" actionIcon={Settings} /></div>
                <div className="md:col-span-4"><CustomSelect label="Possui Assinatura Física? *" value={formData.physical_signature === true ? 'true' : formData.physical_signature === false ? 'false' : ''} onChange={(val: string) => { setFormData({...formData, physical_signature: val === 'true' ? true : val === 'false' ? false : undefined}); }} options={signatureOptions} /></div>
            </div>
        )}

        {/* Linha 2: Pró-Labore | Outros Honorários | Fixo Mensal */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
            {/* Pró-Labore */}
            <div>
              <FinancialInputWithInstallments 
                label="Pró-Labore (R$)" 
                value={safeString(formatForInput(formData.pro_labore))} 
                onChangeValue={(v: any) => setFormData({...formData, pro_labore: v})}
                installments={formData.pro_labore_installments} onChangeInstallments={(v: any) => setFormData({...formData, pro_labore_installments: v})}
                onAdd={() => handleAddToList('pro_labore_extras', 'pro_labore', 'pro_labore_extras_installments', 'pro_labore_installments')}
                clause={(formData as any).pro_labore_clause}
                onChangeClause={(v: any) => setFormData({...formData, pro_labore_clause: v} as any)}
              />
              <div className="flex flex-col gap-1 mt-2 max-h-24 overflow-y-auto">
                {(formData as any).pro_labore_extras?.map((val: string, idx: number) => {
                   const clauses = ensureArray((formData as any).pro_labore_extras_clauses);
                   const installments = ensureArray((formData as any).pro_labore_extras_installments);
                   return (
                      <div key={idx} className="bg-white border border-blue-100 px-2 py-1.5 rounded-lg text-xs text-blue-800 flex items-center justify-between shadow-sm" title={clauses[idx] ? `Cláusula: ${clauses[idx]}` : ''}>
                          <div className="flex items-center gap-1">
                              {clauses[idx] && <span className="text-gray-500 font-bold text-[10px] bg-gray-50 px-1 rounded border border-gray-100">Cl. {clauses[idx]}</span>}
                              <span className="font-medium">{val}</span>
                              {installments[idx] && <span className="text-gray-500 text-[10px]">({installments[idx]})</span>}
                          </div>
                          <button onClick={() => removeExtra('pro_labore_extras', idx, 'pro_labore_extras_installments')} className="text-blue-300 hover:text-red-500 p-1"><X className="w-3 h-3" /></button>
                      </div>
                   );
                })}
              </div>
            </div>

            {/* Outros Honorários */}
            <div>
                <FinancialInputWithInstallments 
                  label="Outros Honorários (R$)" 
                  value={safeString(formatForInput(formData.other_fees))} onChangeValue={(v: any) => setFormData({...formData, other_fees: v})} 
                  installments={formData.other_fees_installments} onChangeInstallments={(v: any) => setFormData({...formData, other_fees_installments: v})}
                  onAdd={() => handleAddToList('other_fees_extras', 'other_fees', 'other_fees_extras_installments', 'other_fees_installments')}
                  clause={(formData as any).other_fees_clause}
                  onChangeClause={(v: any) => setFormData({...formData, other_fees_clause: v} as any)}
                />
                <div className="flex flex-col gap-1 mt-2 max-h-24 overflow-y-auto">
                    {(formData as any).other_fees_extras?.map((val: string, idx: number) => {
                       const clauses = ensureArray((formData as any).other_fees_extras_clauses);
                       const installments = ensureArray((formData as any).other_fees_extras_installments);
                       return (
                          <div key={idx} className="bg-white border border-blue-100 px-2 py-1.5 rounded-lg text-xs text-blue-800 flex items-center justify-between shadow-sm" title={clauses[idx] ? `Cláusula: ${clauses[idx]}` : ''}>
                              <div className="flex items-center gap-1">
                                  {clauses[idx] && <span className="text-gray-500 font-bold text-[10px] bg-gray-50 px-1 rounded border border-gray-100">Cl. {clauses[idx]}</span>}
                                  <span className="font-medium">{val}</span>
                                  {installments[idx] && <span className="text-gray-500 text-[10px]">({installments[idx]})</span>}
                              </div>
                              <button onClick={() => removeExtra('other_fees_extras', idx, 'other_fees_extras_installments')} className="text-blue-300 hover:text-red-500 p-1"><X className="w-3 h-3" /></button>
                          </div>
                       );
                    })}
                  </div>
            </div>

            {/* Fixo Mensal */}
            <div>
                <FinancialInputWithInstallments 
                  label="Fixo Mensal (R$)" 
                  value={safeString(formatForInput(formData.fixed_monthly_fee))} onChangeValue={(v: any) => setFormData({...formData, fixed_monthly_fee: v})}
                  installments={formData.fixed_monthly_fee_installments} onChangeInstallments={(v: any) => setFormData({...formData, fixed_monthly_fee_installments: v})}
                  onAdd={() => handleAddToList('fixed_monthly_extras', 'fixed_monthly_fee', 'fixed_monthly_extras_installments', 'fixed_monthly_fee_installments')}
                  clause={(formData as any).fixed_monthly_fee_clause}
                  onChangeClause={(v: any) => setFormData({...formData, fixed_monthly_fee_clause: v} as any)}
                />
                <div className="flex flex-col gap-1 mt-2 max-h-24 overflow-y-auto">
                    {(formData as any).fixed_monthly_extras?.map((val: string, idx: number) => {
                       const clauses = ensureArray((formData as any).fixed_monthly_extras_clauses);
                       const installments = ensureArray((formData as any).fixed_monthly_extras_installments);
                       return (
                          <div key={idx} className="bg-white border border-blue-100 px-2 py-1.5 rounded-lg text-xs text-blue-800 flex items-center justify-between shadow-sm" title={clauses[idx] ? `Cláusula: ${clauses[idx]}` : ''}>
                              <div className="flex items-center gap-1">
                                  {clauses[idx] && <span className="text-gray-500 font-bold text-[10px] bg-gray-50 px-1 rounded border border-gray-100">Cl. {clauses[idx]}</span>}
                                  <span className="font-medium">{val}</span>
                                  {installments[idx] && <span className="text-gray-500 text-[10px]">({installments[idx]})</span>}
                              </div>
                              <button onClick={() => removeExtra('fixed_monthly_extras', idx, 'fixed_monthly_extras_installments')} className="text-blue-300 hover:text-red-500 p-1"><X className="w-3 h-3" /></button>
                          </div>
                       );
                    })}
                  </div>
            </div>
        </div>
        
        {/* RENDERIZAÇÃO DO DETALHAMENTO DA LINHA 2 - SEM DUPLICIDADE */}
        <div className="space-y-2">
            {renderInstallmentBreakdown('Pró-Labore', 'pro_labore', 'pro_labore_breakdown', 'pro_labore_installments')}
            {renderInstallmentBreakdown('Outros Honorários', 'other_fees', 'other_fees_breakdown', 'other_fees_installments')}
            {renderInstallmentBreakdown('Fixo Mensal', 'fixed_monthly_fee', 'fixed_monthly_fee_breakdown', 'fixed_monthly_fee_installments')}
        </div>

        {/* Linha 3: Êxito Intermediário | Êxito Final | Êxito % */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
            {/* Êxito Intermediário */}
            <div>
              <FinancialInputWithInstallments 
                label="Êxito Intermediário" 
                value={newIntermediateFee} onChangeValue={setNewIntermediateFee}
                installments={interimInstallments} onChangeInstallments={setInterimInstallments}
                onAdd={handleAddIntermediateFee}
                clause={interimClause}
                onChangeClause={setInterimClause}
              />
              <div className="flex flex-col gap-1 mt-2 max-h-24 overflow-y-auto">
                {formData.intermediate_fees?.map((fee: string, idx: number) => {
                  const clauses = ensureArray((formData as any).intermediate_fees_clauses);
                  const installments = ensureArray((formData as any).intermediate_fees_installments);
                  return (
                      <div key={idx} className="bg-white border border-blue-100 px-2 py-1.5 rounded-lg text-xs text-blue-800 flex items-center justify-between shadow-sm" title={clauses[idx] ? `Cláusula: ${clauses[idx]}` : ''}>
                          <div className="flex items-center gap-1">
                              {clauses[idx] && <span className="text-gray-500 font-bold text-[10px] bg-gray-50 px-1 rounded border border-gray-100">Cl. {clauses[idx]}</span>}
                              <span className="font-medium">{fee}</span>
                              {installments[idx] && <span className="text-gray-500 text-[10px]">({installments[idx]})</span>}
                          </div>
                          <button onClick={() => handleRemoveIntermediateFee(idx)} className="text-blue-300 hover:text-red-500 p-1"><X className="w-3 h-3" /></button>
                      </div>
                  );
                })}
              </div>
            </div>

            {/* Êxito Final */}
            <div>
              <FinancialInputWithInstallments 
                label="Êxito Final (R$)" 
                value={safeString(formatForInput(formData.final_success_fee))} 
                onChangeValue={(v: any) => setFormData({...formData, final_success_fee: v})}
                installments={formData.final_success_fee_installments} onChangeInstallments={(v: any) => setFormData({...formData, final_success_fee_installments: v})}
                onAdd={() => handleAddToList('final_success_extras', 'final_success_fee', 'final_success_extras_installments', 'final_success_fee_installments')}
                clause={(formData as any).final_success_fee_clause}
                onChangeClause={(v: any) => setFormData({...formData, final_success_fee_clause: v} as any)}
              />
              <div className="flex flex-col gap-1 mt-2 max-h-24 overflow-y-auto">
                {(formData as any).final_success_extras?.map((val: string, idx: number) => {
                   const clauses = ensureArray((formData as any).final_success_extras_clauses);
                   const installments = ensureArray((formData as any).final_success_extras_installments);
                   return (
                      <div key={idx} className="bg-white border border-blue-100 px-2 py-1.5 rounded-lg text-xs text-blue-800 flex items-center justify-between shadow-sm" title={clauses[idx] ? `Cláusula: ${clauses[idx]}` : ''}>
                          <div className="flex items-center gap-1">
                              {clauses[idx] && <span className="text-gray-500 font-bold text-[10px] bg-gray-50 px-1 rounded border border-gray-100">Cl. {clauses[idx]}</span>}
                              <span className="font-medium">{val}</span>
                              {installments[idx] && <span className="text-gray-500 text-[10px]">({installments[idx]})</span>}
                          </div>
                          <button onClick={() => removeExtra('final_success_extras', idx, 'final_success_extras_installments')} className="text-blue-300 hover:text-red-500 p-1"><X className="w-3 h-3" /></button>
                      </div>
                   );
                })}
              </div>
            </div>

            {/* Êxito % */}
            <div>
                <label className="text-xs font-medium block mb-1">Êxito %</label>
                <div className="flex rounded-lg shadow-sm">
                  <input 
                    type="text" 
                    className="w-14 border border-gray-300 rounded-l-lg p-2.5 text-sm bg-gray-50 focus:border-salomao-blue outline-none border-r-0 placeholder-gray-400 text-center"
                    value={(formData as any).final_success_percent_clause || ''} 
                    onChange={(e) => setFormData({...formData, final_success_percent_clause: e.target.value} as any)}
                    placeholder="Cl."
                    title="Cláusula (ex: 2.1)"
                  />
                  <input type="text" className="flex-1 border border-gray-300 p-2.5 text-sm bg-white focus:border-salomao-blue outline-none min-w-0" placeholder="Ex: 20%" value={formData.final_success_percent} onChange={e => setFormData({...formData, final_success_percent: e.target.value})} />
                  <button className="bg-salomao-blue text-white px-3 rounded-r-lg hover:bg-blue-900 border-l border-blue-800" type="button" onClick={() => handleAddToList('percent_extras', 'final_success_percent')}><Plus className="w-4 h-4" /></button>
                </div>
                <div className="flex flex-col gap-1 mt-2 max-h-24 overflow-y-auto">
                    {(formData as any).percent_extras?.map((val: string, idx: number) => {
                       const clauses = ensureArray((formData as any).percent_extras_clauses);
                       return (
                          <div key={idx} className="bg-white border border-blue-100 px-2 py-1.5 rounded-lg text-xs text-blue-800 flex items-center justify-between shadow-sm" title={clauses[idx] ? `Cláusula: ${clauses[idx]}` : ''}>
                              <div className="flex items-center gap-1">
                                  {clauses[idx] && <span className="text-gray-500 font-bold text-[10px] bg-gray-50 px-1 rounded border border-gray-100">Cl. {clauses[idx]}</span>}
                                  <span className="font-medium">{val}</span>
                              </div>
                              <button onClick={() => removeExtra('percent_extras', idx)} className="text-blue-300 hover:text-red-500 p-1"><X className="w-3 h-3" /></button>
                          </div>
                       );
                    })}
                  </div>
            </div>
        </div>
        
        {/* RENDERIZAÇÃO DO DETALHAMENTO DA LINHA 3 */}
        <div className="space-y-2">
            {renderInstallmentBreakdown('Êxito Final', 'final_success_fee', 'final_success_fee_breakdown', 'final_success_fee_installments')}
        </div>
          
        {/* Linha 4: Timesheet */}
        <div>
              <label className="text-xs font-medium block mb-1">Timesheet</label>
              <div className="flex items-center h-[42px] border border-gray-300 rounded-lg px-3 bg-white">
                <input
                    type="checkbox"
                    id="timesheet_check"
                    checked={(formData as any).timesheet || false}
                    onChange={(e) => setFormData({...formData, timesheet: e.target.checked} as any)}
                    className="w-4 h-4 text-salomao-blue rounded focus:ring-salomao-blue"
                />
                <label htmlFor="timesheet_check" className="ml-2 text-sm text-gray-700">Utilizar Timesheet</label>
              </div>
        </div>
      </div>
      )}
    </div>
  );
}
