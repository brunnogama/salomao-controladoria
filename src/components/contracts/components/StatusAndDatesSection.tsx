import React, { useEffect } from 'react';
import { Plus, X, Settings, AlertTriangle, AlertCircle } from 'lucide-react';
import { Contract } from '../../../types';
import { CustomSelect } from '../../ui/CustomSelect';
import { FinancialInputWithInstallments } from './FinancialInputWithInstallments';
import { maskMoney, parseCurrency } from '../../../utils/masks';
import { addMonths } from 'date-fns';

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
  dateWarningMessage?: string | null;
  duplicateHonCase?: any | null; 
}

export function StatusAndDatesSection(props: StatusAndDatesSectionProps) {
  const {
    formData, setFormData, statusOptions, handleCreateStatus, ensureDateValue,
    analystSelectOptions, onOpenAnalystManager, rejectionByOptions, rejectionReasonOptions,
    partnerSelectOptions, billingOptions, maskHon, setActiveManager, signatureOptions,
    formatForInput, handleAddToList, removeExtra,
    newIntermediateFee, setNewIntermediateFee, interimInstallments, setInterimInstallments,
    handleAddIntermediateFee, interimClause, setInterimClause, handleRemoveIntermediateFee, ensureArray,
    dateWarningMessage, duplicateHonCase
  } = props;

  const isTimesheet = (formData as any).timesheet === true;

  const safeString = (val: string | number | undefined) => {
      if (val === undefined || val === null) return '';
      return String(val);
  };

  const handleEditExtra = (
    listField: string,
    valueField: keyof Contract,
    installmentsListField: string,
    installmentsSourceField: keyof Contract,
    clauseListField: string,
    clauseSourceField: keyof Contract,
    index: number
  ) => {
    setFormData((prev: any) => {
        const valueToEdit = prev[listField][index];
        const installmentToEdit = prev[installmentsListField]?.[index] || '1x';
        const clauseToEdit = prev[clauseListField]?.[index] || '';

        const newList = [...(prev[listField] || [])];
        const newClausesList = [...ensureArray(prev[clauseListField])];
        const newInstList = [...ensureArray(prev[installmentsListField])];

        newList.splice(index, 1);
        newClausesList.splice(index, 1);
        newInstList.splice(index, 1);

        return {
            ...prev,
            [valueField]: valueToEdit,
            [installmentsSourceField]: installmentToEdit,
            [clauseSourceField]: clauseToEdit,
            [listField]: newList,
            [clauseListField]: newClausesList,
            [installmentsListField]: newInstList
        };
    });
  };

  useEffect(() => {
    const rawVal = newIntermediateFee;
    const countStr = interimInstallments;
    
    if (!rawVal || !countStr || countStr === '1x') {
        if ((formData as any).interim_breakdown) {
             setFormData(prev => {
                const newData = { ...prev };
                delete (newData as any).interim_breakdown;
                return newData;
             });
        }
        return;
    }

    const totalOriginal = parseCurrency(rawVal);
    if (totalOriginal <= 0) return;

    const count = parseInt(countStr.replace(/\D/g, '')) || 1;
    const currentBreakdown = (formData as any).interim_breakdown || [];

    if (currentBreakdown.length !== count) {
        const partValue = totalOriginal / count;
        const newBreakdown = Array.from({ length: count }, (_, i) => ({
            date: addMonths(new Date(), i).toISOString().split('T')[0], 
            value: maskMoney(partValue.toFixed(2))
        }));
        
        setFormData(prev => ({ ...prev, interim_breakdown: newBreakdown } as any));
    }
  }, [newIntermediateFee, interimInstallments]);

  const renderInstallmentBreakdown = (
      label: string, 
      valueField: keyof Contract, 
      breakdownField: string, 
      installmentField: keyof Contract
  ) => {
    const breakdown = (formData as any)[breakdownField] as { date: string, value: string }[] | undefined;
    const rawVal = formData[valueField];
    let totalOriginal = 0;
    if (typeof rawVal === 'number') totalOriginal = rawVal;
    else if (typeof rawVal === 'string') totalOriginal = rawVal ? parseCurrency(rawVal) : 0;

    const installmentsStr = formData[installmentField] as string;
    
    if (!totalOriginal || isNaN(totalOriginal) || totalOriginal <= 0 || !installmentsStr || installmentsStr === '1x') {
        return null;
    }
    
    const totalValueStr = totalOriginal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    if (!breakdown || breakdown.length <= 1) return null;

    const totalCalculated = breakdown.reduce((acc, curr) => acc + parseCurrency(curr.value), 0);
    const diff = Math.abs(totalOriginal - totalCalculated);
    const hasError = diff > 0.1;

    return (
        <div className="mt-3 bg-gray-50/80 border border-gray-200 rounded-lg p-3 animate-in fade-in slide-in-from-top-2 shadow-sm">
            <div className="flex items-center justify-between mb-3 border-b border-gray-200 pb-2">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Parcelamento - {label}</h4>
                <span className="text-[10px] font-medium text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">Total: {totalValueStr}</span>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                {breakdown.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-xs mb-1">
                        <span className="w-6 font-bold text-gray-500 text-right">{idx + 1}x</span>
                        <div className="flex-1">
                            <input 
                                type="date" 
                                className="w-full border border-gray-300 rounded px-2 py-1.5 focus:border-salomao-blue outline-none text-gray-600 bg-white"
                                value={item.date}
                                onChange={(e) => {
                                    const newBreakdown = [...breakdown];
                                    newBreakdown[idx].date = e.target.value;
                                    setFormData(prev => ({...prev, [breakdownField]: newBreakdown} as any));
                                }}
                            />
                        </div>
                        <div className="flex-1">
                            <input 
                                type="text" 
                                className={`w-full border rounded px-2 py-1.5 outline-none font-medium text-right ${hasError ? 'border-red-300 text-red-600 bg-red-50' : 'border-gray-300 text-gray-700 bg-white focus:border-salomao-blue'}`}
                                value={item.value}
                                onChange={(e) => {
                                    const newBreakdown = [...breakdown];
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
                <div className="mt-3 flex items-start gap-2 text-[11px] text-red-600 bg-red-50 p-2 rounded border border-red-100">
                    <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>Soma das parcelas difere do total. Diferença: R$ {diff.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                </div>
            )}
        </div>
    );
  };

  const renderInterimBreakdownEditable = () => {
    const breakdown = (formData as any).interim_breakdown as { date: string, value: string }[] | undefined;
    const rawVal = newIntermediateFee;
    let totalOriginal = 0;
    if (typeof rawVal === 'string') totalOriginal = rawVal ? parseCurrency(rawVal) : 0;
    const countStr = interimInstallments;
    
    if (!totalOriginal || totalOriginal <= 0 || !countStr || countStr === '1x' || !breakdown || breakdown.length === 0) return null;

    const totalValueStr = totalOriginal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const totalCalculated = breakdown.reduce((acc, curr) => acc + parseCurrency(curr.value), 0);
    const diff = Math.abs(totalOriginal - totalCalculated);
    const hasError = diff > 0.1;

    return (
        <div className="mt-3 bg-orange-50/50 border border-orange-200 rounded-lg p-3 animate-in fade-in slide-in-from-top-2 shadow-sm">
             <div className="flex items-center justify-between mb-3 border-b border-orange-200 pb-2">
                <h4 className="text-xs font-bold text-orange-800 uppercase tracking-wide">Parcelamento (Novo)</h4>
                <span className="text-[10px] font-medium text-orange-600 bg-white px-2 py-0.5 rounded border border-orange-200">Total: {totalValueStr}</span>
            </div>
             
             <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                {breakdown.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-xs mb-1">
                        <span className="w-6 font-bold text-gray-500 text-right">{idx + 1}x</span>
                        <div className="flex-1">
                             <input 
                                type="date" 
                                className="w-full border border-gray-300 rounded px-2 py-1.5 focus:border-orange-500 outline-none text-gray-600 bg-white" 
                                value={item.date} 
                                onChange={(e) => {
                                    const newBreakdown = [...breakdown];
                                    newBreakdown[idx].date = e.target.value;
                                    setFormData(prev => ({...prev, interim_breakdown: newBreakdown} as any));
                                }}
                             />
                        </div>
                        <div className="flex-1">
                             <input 
                                type="text" 
                                className={`w-full border rounded px-2 py-1.5 outline-none font-medium text-right ${hasError ? 'border-red-300 text-red-600 bg-red-50' : 'border-gray-300 text-gray-700 bg-white focus:border-orange-500'}`}
                                value={item.value} 
                                onChange={(e) => {
                                    const newBreakdown = [...breakdown];
                                    const rawValue = e.target.value.replace(/\D/g, ''); 
                                    newBreakdown[idx].value = maskMoney(rawValue);
                                    setFormData(prev => ({...prev, interim_breakdown: newBreakdown} as any));
                                }}
                             />
                        </div>
                    </div>
                ))}
             </div>
             {hasError && (
                <div className="mt-3 flex items-start gap-2 text-[11px] text-red-600 bg-red-50 p-2 rounded border border-red-100">
                    <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>Soma difere do total. Diferença: R$ {diff.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                </div>
            )}
        </div>
    );
  };

  return (
    <div className="bg-white/60 p-6 rounded-xl border border-white/40 shadow-sm backdrop-blur-sm relative z-40 mb-6">
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
                    className={`w-full border p-2.5 rounded-lg text-sm bg-white outline-none transition-colors ${dateWarningMessage ? 'border-red-300 bg-red-50 focus:border-red-500' : 'border-gray-300 focus:border-salomao-blue'}`}
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
                {dateWarningMessage && (
                    <div className="flex items-center gap-2 mt-1 text-xs text-red-600 animate-in slide-in-from-top-1 font-medium bg-red-100/50 p-1.5 rounded">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        <span>{dateWarningMessage}</span>
                    </div>
                )}
            </div>
          )}
      </div>

      {formData.status === 'analysis' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in slide-in-from-top-2">
            <div><CustomSelect label="Analisado Por" value={formData.analyst_id || ''} onChange={(val: string) => setFormData({...formData, analyst_id: val})} options={analystSelectOptions} onAction={onOpenAnalystManager} actionIcon={Settings} actionLabel="Gerenciar Analistas" /></div>
        </div>
      )}

      {formData.status === 'rejected' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-in fade-in slide-in-from-top-2">
            <div><CustomSelect label="Analisado por" value={formData.analyst_id || ''} onChange={(val: string) => setFormData({...formData, analyst_id: val})} options={analystSelectOptions} onAction={onOpenAnalystManager} actionIcon={Settings} actionLabel="Gerenciar Analistas" /></div>
            <div><CustomSelect label="Quem rejeitou" value={formData.rejection_by || ''} onChange={(val: string) => setFormData({...formData, rejection_by: val})} options={rejectionByOptions} /></div>
            <div><CustomSelect label="Motivo da Rejeição" value={formData.rejection_reason || ''} onChange={(val: string) => setFormData({...formData, rejection_reason: val})} options={rejectionReasonOptions} /></div>
        </div>
      )}

      {formData.status === 'probono' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in slide-in-from-top-2">
            <div><CustomSelect label="Enviado Por" value={formData.partner_id || ''} onChange={(val: string) => setFormData({...formData, partner_id: val})} options={partnerSelectOptions} /></div>
        </div>
      )}

      {(formData.status === 'proposal' || formData.status === 'active') && (
      <div className="space-y-6 animate-in slide-in-from-top-2 pt-4 border-t border-gray-100">
        {formData.status === 'active' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end mb-4 animate-in fade-in">
                <div className="md:col-span-4">
                    <label className="text-xs font-medium block mb-1 text-green-800">Número HON (Único) <span className="text-red-500">*</span></label>
                    <input type="text" className={`w-full border-2 p-2.5 rounded-lg font-mono font-bold bg-white outline-none ${duplicateHonCase ? 'border-yellow-400 text-yellow-800 bg-yellow-50' : 'border-green-200 text-green-900 focus:border-green-500'}`} placeholder="00.000.000/000" value={formData.hon_number} onChange={e => setFormData({...formData, hon_number: maskHon(e.target.value)})} />
                    {duplicateHonCase && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-yellow-700 font-medium"><AlertTriangle className="w-3 h-3" /><span>Em uso por: {duplicateHonCase.display_id}</span></div>
                    )}
                </div>
                <div className="md:col-span-4"><CustomSelect label="Local Faturamento *" value={formData.billing_location || ''} onChange={(val: string) => setFormData({...formData, billing_location: val})} options={billingOptions} onAction={() => setActiveManager('location')} actionLabel="Gerenciar Locais" actionIcon={Settings} /></div>
                <div className="md:col-span-4"><CustomSelect label="Possui Assinatura Física? *" value={formData.physical_signature === true ? 'true' : formData.physical_signature === false ? 'false' : ''} onChange={(val: string) => { setFormData({...formData, physical_signature: val === 'true' ? true : val === 'false' ? false : undefined}); }} options={signatureOptions} /></div>
            </div>
        )}

        <div className={`grid grid-cols-1 md:grid-cols-3 gap-5 items-start ${isTimesheet ? 'opacity-40 pointer-events-none filter grayscale' : ''}`}>
            <div className="space-y-2">
              <FinancialInputWithInstallments label="Pró-Labore (R$)" value={safeString(formatForInput(formData.pro_labore))} onChangeValue={(v: any) => setFormData({...formData, pro_labore: v})} installments={formData.pro_labore_installments} onChangeInstallments={(v: any) => setFormData({...formData, pro_labore_installments: v})} onAdd={() => handleAddToList('pro_labore_extras', 'pro_labore', 'pro_labore_extras_installments', 'pro_labore_installments')} clause={(formData as any).pro_labore_clause} onChangeClause={(v: any) => setFormData({...formData, pro_labore_clause: v} as any)} />
              <div className="flex flex-col gap-1 max-h-24 overflow-y-auto">
                {(formData as any).pro_labore_extras?.map((val: string, idx: number) => {
                   const clauses = ensureArray((formData as any).pro_labore_extras_clauses);
                   const installments = ensureArray((formData as any).pro_labore_extras_installments);
                   return (
                      <div key={idx} onClick={() => handleEditExtra('pro_labore_extras', 'pro_labore', 'pro_labore_extras_installments', 'pro_labore_installments', 'pro_labore_extras_clauses', 'pro_labore_clause', idx)} className="bg-white border border-blue-100 px-2 py-1.5 rounded-lg text-xs text-blue-800 flex items-center justify-between shadow-sm cursor-pointer hover:bg-blue-50" title="Clique para editar">
                          <div className="flex items-center gap-1">{clauses[idx] && <span className="text-gray-500 font-bold text-[10px] bg-gray-50 px-1 rounded border border-gray-100">Cl. {clauses[idx]}</span>}<span className="font-medium">{val}</span>{installments[idx] && <span className="text-gray-500 text-[10px]">({installments[idx]})</span>}</div>
                          <div className="text-blue-300 p-1"><X className="w-3 h-3" /></div>
                      </div>
                   );
                })}
              </div>
              {renderInstallmentBreakdown('Pró-Labore', 'pro_labore', 'pro_labore_breakdown', 'pro_labore_installments')}
            </div>

            <div className="space-y-2">
                <FinancialInputWithInstallments label="Outros Honorários (R$)" value={safeString(formatForInput(formData.other_fees))} onChangeValue={(v: any) => setFormData({...formData, other_fees: v})} installments={formData.other_fees_installments} onChangeInstallments={(v: any) => setFormData({...formData, other_fees_installments: v})} onAdd={() => handleAddToList('other_fees_extras', 'other_fees', 'other_fees_extras_installments', 'other_fees_installments')} clause={(formData as any).other_fees_clause} onChangeClause={(v: any) => setFormData({...formData, other_fees_clause: v} as any)} />
                <div className="flex flex-col gap-1 max-h-24 overflow-y-auto">
                    {(formData as any).other_fees_extras?.map((val: string, idx: number) => {
                       const clauses = ensureArray((formData as any).other_fees_extras_clauses);
                       const installments = ensureArray((formData as any).other_fees_extras_installments);
                       return (
                          <div key={idx} onClick={() => handleEditExtra('other_fees_extras', 'other_fees', 'other_fees_extras_installments', 'other_fees_installments', 'other_fees_extras_clauses', 'other_fees_clause', idx)} className="bg-white border border-blue-100 px-2 py-1.5 rounded-lg text-xs text-blue-800 flex items-center justify-between shadow-sm cursor-pointer hover:bg-blue-50" title="Clique para editar">
                              <div className="flex items-center gap-1">{clauses[idx] && <span className="text-gray-500 font-bold text-[10px] bg-gray-50 px-1 rounded border border-gray-100">Cl. {clauses[idx]}</span>}<span className="font-medium">{val}</span>{installments[idx] && <span className="text-gray-500 text-[10px]">({installments[idx]})</span>}</div>
                              <div className="text-blue-300 p-1"><X className="w-3 h-3" /></div>
                          </div>
                       );
                    })}
                  </div>
                  {renderInstallmentBreakdown('Outros', 'other_fees', 'other_fees_breakdown', 'other_fees_installments')}
            </div>

            <div className="space-y-2">
                <FinancialInputWithInstallments label="Fixo Mensal (R$)" value={safeString(formatForInput(formData.fixed_monthly_fee))} onChangeValue={(v: any) => setFormData({...formData, fixed_monthly_fee: v})} installments={formData.fixed_monthly_fee_installments} onChangeInstallments={(v: any) => setFormData({...formData, fixed_monthly_fee_installments: v})} onAdd={() => handleAddToList('fixed_monthly_extras', 'fixed_monthly_fee', 'fixed_monthly_extras_installments', 'fixed_monthly_fee_installments')} clause={(formData as any).fixed_monthly_fee_clause} onChangeClause={(v: any) => setFormData({...formData, fixed_monthly_fee_clause: v} as any)} />
                <div className="flex flex-col gap-1 max-h-24 overflow-y-auto">
                    {(formData as any).fixed_monthly_extras?.map((val: string, idx: number) => {
                       const clauses = ensureArray((formData as any).fixed_monthly_extras_clauses);
                       const installments = ensureArray((formData as any).fixed_monthly_extras_installments);
                       return (
                          <div key={idx} onClick={() => handleEditExtra('fixed_monthly_extras', 'fixed_monthly_fee', 'fixed_monthly_extras_installments', 'fixed_monthly_fee_installments', 'fixed_monthly_extras_clauses', 'fixed_monthly_fee_clause', idx)} className="bg-white border border-blue-100 px-2 py-1.5 rounded-lg text-xs text-blue-800 flex items-center justify-between shadow-sm cursor-pointer hover:bg-blue-50" title="Clique para editar">
                              <div className="flex items-center gap-1">{clauses[idx] && <span className="text-gray-500 font-bold text-[10px] bg-gray-50 px-1 rounded border border-gray-100">Cl. {clauses[idx]}</span>}<span className="font-medium">{val}</span>{installments[idx] && <span className="text-gray-500 text-[10px]">({installments[idx]})</span>}</div>
                              <div className="text-blue-300 p-1"><X className="w-3 h-3" /></div>
                          </div>
                       );
                    })}
                  </div>
                  {renderInstallmentBreakdown('Fixo Mensal', 'fixed_monthly_fee', 'fixed_monthly_fee_breakdown', 'fixed_monthly_fee_installments')}
            </div>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-3 gap-5 items-start ${isTimesheet ? 'opacity-40 pointer-events-none filter grayscale' : ''}`}>
            <div className="space-y-2">
              <FinancialInputWithInstallments label="Êxito Intermediário" value={newIntermediateFee} onChangeValue={setNewIntermediateFee} installments={interimInstallments} onChangeInstallments={setInterimInstallments} onAdd={handleAddIntermediateFee} clause={interimClause} onChangeClause={setInterimClause} />
              <div className="flex flex-col gap-1 max-h-24 overflow-y-auto">
                {formData.intermediate_fees?.map((fee: string, idx: number) => {
                  const clauses = ensureArray((formData as any).intermediate_fees_clauses);
                  const installments = ensureArray((formData as any).intermediate_fees_installments);
                  return (
                      <div key={idx} onClick={() => { setNewIntermediateFee(fee); setInterimInstallments(installments[idx] || '1x'); setInterimClause(clauses[idx] || ''); handleRemoveIntermediateFee(idx); }} className="bg-white border border-blue-100 px-2 py-1.5 rounded-lg text-xs text-blue-800 flex items-center justify-between shadow-sm cursor-pointer hover:bg-blue-50" title="Clique para editar">
                          <div className="flex items-center gap-1">{clauses[idx] && <span className="text-gray-500 font-bold text-[10px] bg-gray-50 px-1 rounded border border-gray-100">Cl. {clauses[idx]}</span>}<span className="font-medium">{fee}</span>{installments[idx] && <span className="text-gray-500 text-[10px]">({installments[idx]})</span>}</div>
                          <div className="text-blue-300 p-1"><X className="w-3 h-3" /></div>
                      </div>
                  );
                })}
              </div>
              {renderInterimBreakdownEditable()}
            </div>

            <div className="space-y-2">
              <FinancialInputWithInstallments label="Êxito Final (R$)" value={safeString(formatForInput(formData.final_success_fee))} onChangeValue={(v: any) => setFormData({...formData, final_success_fee: v})} installments={formData.final_success_fee_installments} onChangeInstallments={(v: any) => setFormData({...formData, final_success_fee_installments: v})} onAdd={() => handleAddToList('final_success_extras', 'final_success_fee', 'final_success_extras_installments', 'final_success_fee_installments')} clause={(formData as any).final_success_fee_clause} onChangeClause={(v: any) => setFormData({...formData, final_success_fee_clause: v} as any)} />
              <div className="flex flex-col gap-1 max-h-24 overflow-y-auto">
                {(formData as any).final_success_extras?.map((val: string, idx: number) => {
                   const clauses = ensureArray((formData as any).final_success_extras_clauses);
                   const installments = ensureArray((formData as any).final_success_extras_installments);
                   return (
                      <div key={idx} onClick={() => handleEditExtra('final_success_extras', 'final_success_fee', 'final_success_extras_installments', 'final_success_fee_installments', 'final_success_extras_clauses', 'final_success_fee_clause', idx)} className="bg-white border border-blue-100 px-2 py-1.5 rounded-lg text-xs text-blue-800 flex items-center justify-between shadow-sm cursor-pointer hover:bg-blue-50" title="Clique para editar">
                          <div className="flex items-center gap-1">{clauses[idx] && <span className="text-gray-500 font-bold text-[10px] bg-gray-50 px-1 rounded border border-gray-100">Cl. {clauses[idx]}</span>}<span className="font-medium">{val}</span>{installments[idx] && <span className="text-gray-500 text-[10px]">({installments[idx]})</span>}</div>
                          <div className="text-blue-300 p-1"><X className="w-3 h-3" /></div>
                      </div>
                   );
                })}
              </div>
              {renderInstallmentBreakdown('Êxito Final', 'final_success_fee', 'final_success_fee_breakdown', 'final_success_fee_installments')}
            </div>

            <div className="space-y-2">
                <label className="text-xs font-medium block mb-1">Êxito %</label>
                <div className="flex rounded-lg shadow-sm">
                  <input type="text" className="w-14 border border-gray-300 rounded-l-lg p-2.5 text-sm bg-gray-50 outline-none border-r-0 text-center" value={(formData as any).final_success_percent_clause || ''} onChange={(e) => setFormData({...formData, final_success_percent_clause: e.target.value} as any)} placeholder="Cl." />
                  <input type="text" className="flex-1 border border-gray-300 p-2.5 text-sm bg-white outline-none" placeholder="Ex: 20%" value={formData.final_success_percent} onChange={e => setFormData({...formData, final_success_percent: e.target.value})} />
                  <button className="bg-salomao-blue text-white px-3 rounded-r-lg hover:bg-blue-900" type="button" onClick={() => handleAddToList('percent_extras', 'final_success_percent')}><Plus className="w-4 h-4" /></button>
                </div>
                <div className="flex flex-col gap-1 max-h-24 overflow-y-auto">
                    {(formData as any).percent_extras?.map((val: string, idx: number) => {
                       const clauses = ensureArray((formData as any).percent_extras_clauses);
                       return (
                          <div key={idx} onClick={() => { const newList = [...(formData as any).percent_extras]; const newClausesList = [...ensureArray((formData as any).percent_extras_clauses)]; const valToEdit = newList[idx]; const clauseToEdit = newClausesList[idx]; newList.splice(idx, 1); newClausesList.splice(idx, 1); setFormData({...formData, final_success_percent: valToEdit, final_success_percent_clause: clauseToEdit, percent_extras: newList, percent_extras_clauses: newClausesList} as any); }} className="bg-white border border-blue-100 px-2 py-1.5 rounded-lg text-xs text-blue-800 flex items-center justify-between shadow-sm cursor-pointer hover:bg-blue-50" title="Clique para editar">
                              <div className="flex items-center gap-1">{clauses[idx] && <span className="text-gray-500 font-bold text-[10px] bg-gray-50 px-1 rounded border border-gray-100">Cl. {clauses[idx]}</span>}<span className="font-medium">{val}</span></div>
                              <div className="text-blue-300 p-1"><X className="w-3 h-3" /></div>
                          </div>
                       );
                    })}
                  </div>
            </div>
        </div>
          
        <div>
              <label className="text-xs font-medium block mb-1">Timesheet</label>
              <div className="flex items-center h-[42px] border border-gray-300 rounded-lg px-3 bg-white">
                <input type="checkbox" id="timesheet_check" checked={(formData as any).timesheet || false} onChange={(e) => setFormData({...formData, timesheet: e.target.checked} as any)} className="w-4 h-4 text-salomao-blue rounded cursor-pointer" />
                <label htmlFor="timesheet_check" className="ml-2 text-sm text-gray-700 cursor-pointer select-none">Utilizar Timesheet</label>
              </div>
              {isTimesheet && <p className="text-[10px] text-orange-600 mt-1 ml-1 animate-in fade-in">* Ao ativar o Timesheet, os honorários fixos serão zerados no salvamento.</p>}
        </div>
      </div>
      )}
    </div>
  );
}