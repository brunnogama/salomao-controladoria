import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Plus, X, ChevronDown } from 'lucide-react';
import { CustomSelect } from '../../ui/CustomSelect';
import { maskMoney, maskHon } from '../../../utils/masks';
import { ContractFormValues } from '../../../schemas/contractSchema';

// Sub-componentes locais para manter este arquivo independente
const MinimalSelect = ({ value, onChange, options }: { value: string, onChange: (val: string) => void, options: string[] }) => (
    <div className="relative h-full w-full">
        <select className="w-full h-full appearance-none bg-transparent pl-3 pr-8 text-xs font-medium text-gray-700 outline-none cursor-pointer focus:bg-gray-50 transition-colors" value={value || '1x'} onChange={(e) => onChange(e.target.value)}>
            {options.map(opt => (<option key={opt} value={opt}>{opt}</option>))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
    </div>
);

const FinancialInputWithInstallments = ({ 
  label, value, onChangeValue, installments, onChangeInstallments, onAdd, clause, onChangeClause
}: any) => {
  const installmentOptions = Array.from({ length: 24 }, (_, i) => `${i + 1}x`);
  return (
    <div>
      <label className="text-xs font-medium block mb-1 text-gray-600">{label}</label>
      <div className="flex rounded-lg shadow-sm">
        {onChangeClause && (
             <input type="text" className="w-14 border border-gray-300 rounded-l-lg p-2.5 text-sm bg-gray-50 focus:border-salomao-blue outline-none border-r-0 placeholder-gray-400 text-center" value={clause || ''} onChange={(e) => onChangeClause(e.target.value)} placeholder="Cl." title="Cláusula (ex: 2.1)" />
        )}
        <input type="text" className={`flex-1 border border-gray-300 p-2.5 text-sm bg-white focus:border-salomao-blue outline-none min-w-0 ${!onChangeClause ? 'rounded-l-lg' : ''} ${!onAdd ? 'rounded-r-none border-r-0' : ''}`} value={value || ''} onChange={(e) => onChangeValue(maskMoney(e.target.value))} placeholder="R$ 0,00" />
        <div className={`w-16 border-y border-r border-gray-300 bg-gray-50 ${!onAdd ? 'rounded-r-lg' : ''}`}>
           <MinimalSelect value={installments || '1x'} onChange={onChangeInstallments} options={installmentOptions} />
        </div>
        {onAdd && (
          <button onClick={onAdd} className="bg-salomao-blue text-white px-2 rounded-r-lg hover:bg-blue-900 transition-colors flex items-center justify-center border-l border-blue-800" type="button" title="Adicionar valor"><Plus className="w-4 h-4" /></button>
        )}
      </div>
    </div>
  );
};

interface Props {
  formData: any; // Mantido any para flexibilidade com arrays complexos
  setFormData: any;
  billingOptions: any[];
  handleAddToList: (listField: string, valueField: string, instField?: string, sourceInstField?: string) => void;
  removeExtra: (field: string, index: number, instField?: string) => void;
  // Hooks para Êxito Intermediário
  newIntermediateFee: string;
  setNewIntermediateFee: (v: string) => void;
  interimInstallments: string;
  setInterimInstallments: (v: string) => void;
  interimClause: string;
  setInterimClause: (v: string) => void;
  handleAddIntermediateFee: () => void;
  handleRemoveIntermediateFee: (idx: number) => void;
}

export function ContractFinancialSection({
  formData, setFormData, billingOptions, handleAddToList, removeExtra,
  newIntermediateFee, setNewIntermediateFee, interimInstallments, setInterimInstallments,
  interimClause, setInterimClause, handleAddIntermediateFee, handleRemoveIntermediateFee
}: Props) {
  const { register, watch, setValue, formState: { errors }, control } = useFormContext<ContractFormValues>();
  const watchedStatus = watch('status');

  // Só renderiza se for Active ou Proposal
  if (watchedStatus !== 'active' && watchedStatus !== 'proposal') return null;

  return (
    <section className="space-y-5 pt-4 border-t">
       <h3 className="text-sm font-bold text-gray-500 uppercase border-b pb-2">Financeiro</h3>
       
       {watchedStatus === 'active' && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                   <label className="text-xs font-medium block mb-1">Número HON *</label>
                   <input type="text" {...register('hon_number')} className={`w-full border p-2.5 rounded-lg text-sm font-mono ${errors.hon_number ? 'border-red-500' : 'border-gray-300'}`} placeholder="00.000.000/000" onChange={(e) => setValue('hon_number', maskHon(e.target.value))} />
                   {errors.hon_number && <span className="text-xs text-red-500">{errors.hon_number.message}</span>}
               </div>
               <div>
                   {/* Usando CustomSelect diretamente ou via Controller */}
                   <label className="text-xs font-medium block mb-1">Local Faturamento *</label>
                   <CustomSelect 
                        value={watch('billing_location') || ''} 
                        onChange={(val: string) => setValue('billing_location', val)} 
                        options={billingOptions} 
                   />
                   {errors.billing_location && <span className="text-xs text-red-500">{errors.billing_location.message}</span>}
               </div>
           </div>
       )}

       <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
           {/* Pró-Labore */}
           <div>
              <FinancialInputWithInstallments 
                label="Pró-Labore (R$)" 
                value={watch('pro_labore')} 
                onChangeValue={(v: string) => setValue('pro_labore', v)}
                installments={watch('pro_labore_installments')}
                onChangeInstallments={(v: string) => setValue('pro_labore_installments', v)}
                onAdd={() => handleAddToList('pro_labore_extras', 'pro_labore', 'pro_labore_extras_installments', 'pro_labore_installments')}
                clause={watch('pro_labore_clause')}
                onChangeClause={(v: string) => setValue('pro_labore_clause', v)}
              />
              <div className="flex flex-col gap-1 mt-2 max-h-24 overflow-y-auto">
                {formData.pro_labore_extras?.map((val: string, idx: number) => (
                    <div key={idx} className="bg-white border border-blue-100 px-2 py-1.5 rounded-lg text-xs text-blue-800 flex items-center justify-between shadow-sm">
                        <span className="font-medium">{val}</span>
                        <button type="button" onClick={() => removeExtra('pro_labore_extras', idx, 'pro_labore_extras_installments')} className="text-blue-300 hover:text-red-500 p-1"><X className="w-3 h-3" /></button>
                    </div>
                ))}
              </div>
           </div>

           {/* Outros Honorários */}
           <div>
              <FinancialInputWithInstallments 
                label="Outros Honorários (R$)" 
                value={watch('other_fees')} 
                onChangeValue={(v: string) => setValue('other_fees', v)}
                installments={watch('other_fees_installments')}
                onChangeInstallments={(v: string) => setValue('other_fees_installments', v)}
                onAdd={() => handleAddToList('other_fees_extras', 'other_fees', 'other_fees_extras_installments', 'other_fees_installments')}
                clause={watch('other_fees_clause')}
                onChangeClause={(v: string) => setValue('other_fees_clause', v)}
              />
              <div className="flex flex-col gap-1 mt-2 max-h-24 overflow-y-auto">
                {formData.other_fees_extras?.map((val: string, idx: number) => (
                    <div key={idx} className="bg-white border border-blue-100 px-2 py-1.5 rounded-lg text-xs text-blue-800 flex items-center justify-between shadow-sm">
                        <span className="font-medium">{val}</span>
                        <button type="button" onClick={() => removeExtra('other_fees_extras', idx, 'other_fees_extras_installments')} className="text-blue-300 hover:text-red-500 p-1"><X className="w-3 h-3" /></button>
                    </div>
                ))}
              </div>
           </div>

           {/* Fixo Mensal */}
           <div>
              <FinancialInputWithInstallments 
                label="Fixo Mensal (R$)" 
                value={watch('fixed_monthly_fee')} 
                onChangeValue={(v: string) => setValue('fixed_monthly_fee', v)}
                installments={watch('fixed_monthly_fee_installments')}
                onChangeInstallments={(v: string) => setValue('fixed_monthly_fee_installments', v)}
                onAdd={() => handleAddToList('fixed_monthly_extras', 'fixed_monthly_fee', 'fixed_monthly_extras_installments', 'fixed_monthly_fee_installments')}
                clause={watch('fixed_monthly_fee_clause')}
                onChangeClause={(v: string) => setValue('fixed_monthly_fee_clause', v)}
              />
              <div className="flex flex-col gap-1 mt-2 max-h-24 overflow-y-auto">
                {formData.fixed_monthly_extras?.map((val: string, idx: number) => (
                    <div key={idx} className="bg-white border border-blue-100 px-2 py-1.5 rounded-lg text-xs text-blue-800 flex items-center justify-between shadow-sm">
                        <span className="font-medium">{val}</span>
                        <button type="button" onClick={() => removeExtra('fixed_monthly_extras', idx, 'fixed_monthly_extras_installments')} className="text-blue-300 hover:text-red-500 p-1"><X className="w-3 h-3" /></button>
                    </div>
                ))}
              </div>
           </div>
       </div>

       {/* Linha 2: Êxitos */}
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
                {formData.intermediate_fees?.map((fee: string, idx: number) => (
                    <div key={idx} className="bg-white border border-blue-100 px-2 py-1.5 rounded-lg text-xs text-blue-800 flex items-center justify-between shadow-sm">
                        <span className="font-medium">{fee}</span>
                        <button type="button" onClick={() => handleRemoveIntermediateFee(idx)} className="text-blue-300 hover:text-red-500 p-1"><X className="w-3 h-3" /></button>
                    </div>
                ))}
              </div>
           </div>

           {/* Êxito Final */}
           <div>
              <FinancialInputWithInstallments 
                label="Êxito Final (R$)" 
                value={watch('final_success_fee')} 
                onChangeValue={(v: string) => setValue('final_success_fee', v)}
                installments={watch('final_success_fee_installments')}
                onChangeInstallments={(v: string) => setValue('final_success_fee_installments', v)}
                onAdd={() => handleAddToList('final_success_extras', 'final_success_fee', 'final_success_extras_installments', 'final_success_fee_installments')}
                clause={watch('final_success_fee_clause')}
                onChangeClause={(v: string) => setValue('final_success_fee_clause', v)}
              />
              <div className="flex flex-col gap-1 mt-2 max-h-24 overflow-y-auto">
                {formData.final_success_extras?.map((val: string, idx: number) => (
                    <div key={idx} className="bg-white border border-blue-100 px-2 py-1.5 rounded-lg text-xs text-blue-800 flex items-center justify-between shadow-sm">
                        <span className="font-medium">{val}</span>
                        <button type="button" onClick={() => removeExtra('final_success_extras', idx, 'final_success_extras_installments')} className="text-blue-300 hover:text-red-500 p-1"><X className="w-3 h-3" /></button>
                    </div>
                ))}
              </div>
           </div>

           {/* Êxito Percentual */}
           <div>
                <label className="text-xs font-medium block mb-1">Êxito %</label>
                <div className="flex rounded-lg shadow-sm">
                  <input 
                    type="text" 
                    className="w-14 border border-gray-300 rounded-l-lg p-2.5 text-sm bg-gray-50 focus:border-salomao-blue outline-none border-r-0 placeholder-gray-400 text-center"
                    value={watch('final_success_percent_clause') || ''} 
                    onChange={(e) => setValue('final_success_percent_clause', e.target.value)}
                    placeholder="Cl."
                  />
                  <input type="text" className="flex-1 border border-gray-300 p-2.5 text-sm bg-white focus:border-salomao-blue outline-none min-w-0" placeholder="Ex: 20%" value={watch('final_success_percent') || ''} onChange={e => setValue('final_success_percent', e.target.value)} />
                  <button className="bg-salomao-blue text-white px-3 rounded-r-lg hover:bg-blue-900 border-l border-blue-800" type="button" onClick={() => handleAddToList('percent_extras', 'final_success_percent')}><Plus className="w-4 h-4" /></button>
                </div>
                <div className="flex flex-col gap-1 mt-2 max-h-24 overflow-y-auto">
                    {formData.percent_extras?.map((val: string, idx: number) => (
                        <div key={idx} className="bg-white border border-blue-100 px-2 py-1.5 rounded-lg text-xs text-blue-800 flex items-center justify-between shadow-sm">
                            <span className="font-medium">{val}</span>
                            <button onClick={() => removeExtra('percent_extras', idx)} className="text-blue-300 hover:text-red-500 p-1"><X className="w-3 h-3" /></button>
                        </div>
                    ))}
                </div>
           </div>
       </div>

       {/* Timesheet Toggle */}
       <div>
          <div className="flex items-center h-[42px] border border-gray-300 rounded-lg px-3 bg-white w-fit">
            <input
                type="checkbox"
                id="timesheet_check"
                {...register('timesheet')}
                className="w-4 h-4 text-salomao-blue rounded focus:ring-salomao-blue"
            />
            <label htmlFor="timesheet_check" className="ml-2 text-sm text-gray-700">Utilizar Timesheet</label>
          </div>
       </div>
    </section>
  );
}
