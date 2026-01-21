import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { CustomSelect } from '../../ui/CustomSelect';
import { Search, Settings, AlertCircle, Link as LinkIcon } from 'lucide-react';
import { ContractFormValues } from '../../../schemas/contractSchema';
import { maskCNPJ } from '../../../utils/masks';

interface Props {
  clientSelectOptions: any[];
  areaOptions: any[];
  partnerSelectOptions: any[];
  duplicateClientCases: any[];
  handleClientChange: (name: string) => void;
  handleCNPJSearch: () => void;
  onOpenPartnerManager: () => void;
  setActiveManager: (type: string) => void;
}

export function ContractClientSection({
  clientSelectOptions, areaOptions, partnerSelectOptions, duplicateClientCases,
  handleClientChange, handleCNPJSearch, onOpenPartnerManager, setActiveManager
}: Props) {
  const { control, register, watch, formState: { errors }, setValue } = useFormContext<ContractFormValues>();

  return (
    <section className="space-y-5">
      <h3 className="text-sm font-bold text-gray-500 uppercase border-b border-black/5 pb-2">Dados do Cliente</h3>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        <div className="md:col-span-9">
          <Controller name="client_name" control={control} render={({ field }) => (
            <CustomSelect label="Nome do Cliente *" value={field.value} onChange={(val) => { field.onChange(val); handleClientChange(val); }} options={clientSelectOptions} onAction={() => setActiveManager('client')} actionLabel="Gerenciar Clientes" actionIcon={Settings} placeholder="Selecione ou digite" />
          )} />
          {errors.client_name && <span className="text-xs text-red-500">{errors.client_name.message}</span>}
          
          {/* Alerta de Duplicidade */}
          {duplicateClientCases.length > 0 && (
             <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-2.5 flex flex-col gap-1">
                 <span className="text-xs text-blue-700 font-bold flex items-center"><AlertCircle className="w-3 h-3 mr-1" /> Já há casos para este cliente:</span>
                 <div className="flex flex-wrap gap-2">
                     {duplicateClientCases.map(c => (
                         <span key={c.id} className="text-xs text-blue-600 bg-white px-2 py-0.5 rounded border border-blue-100 flex items-center">
                             <LinkIcon className="w-2.5 h-2.5 mr-1"/> {c.hon_number || 'Sem HON'}
                         </span>
                     ))}
                 </div>
             </div>
          )}
        </div>
        <div className="md:col-span-3">
          <label className="block text-xs font-medium text-gray-600 mb-1">CNPJ/CPF</label>
          <div className="flex gap-2 items-center">
            <input type="text" disabled={watch('has_no_cnpj')} className="flex-1 border border-gray-300 rounded-lg p-2.5 text-sm" placeholder="00.000..." {...register('cnpj')} onChange={(e) => setValue('cnpj', maskCNPJ(e.target.value))} />
            <button type="button" onClick={handleCNPJSearch} className="bg-white p-2.5 rounded-lg border border-gray-300"><Search className="w-4 h-4" /></button>
          </div>
          <div className="flex items-center mt-2"><input type="checkbox" id="no_cnpj" {...register('has_no_cnpj')} /><label htmlFor="no_cnpj" className="ml-2 text-xs text-gray-500">Sem CNPJ</label></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <Controller name="area" control={control} render={({ field }) => (
            <CustomSelect label="Área do Direito" value={field.value || ''} onChange={field.onChange} options={areaOptions} onAction={() => setActiveManager('area')} actionLabel="Gerenciar Áreas" actionIcon={Settings} />
          )} />
        </div>
        <div>
          <Controller name="partner_id" control={control} render={({ field }) => (
            <CustomSelect label="Responsável (Sócio) *" value={field.value} onChange={field.onChange} options={partnerSelectOptions} onAction={onOpenPartnerManager} actionLabel="Gerenciar Sócios" actionIcon={Settings} />
          )} />
          {errors.partner_id && <span className="text-xs text-red-500">{errors.partner_id.message}</span>}
        </div>
      </div>
    </section>
  );
}
