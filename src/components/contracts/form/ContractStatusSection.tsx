import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { CustomSelect } from '../../ui/CustomSelect';
import { Settings, Plus } from 'lucide-react';
import { ContractFormValues } from '../../../schemas/contractSchema';

interface Props {
  statusOptions: any[];
  analystSelectOptions: any[];
  rejectionByOptions: any[];
  rejectionReasonOptions: any[];
  partnerSelectOptions: any[];
  onOpenAnalystManager: () => void;
  handleCreateStatus: () => void;
}

export function ContractStatusSection({
  statusOptions,
  analystSelectOptions,
  rejectionByOptions,
  rejectionReasonOptions,
  partnerSelectOptions,
  onOpenAnalystManager,
  handleCreateStatus
}: Props) {
  const { control, watch, formState: { errors }, register, setValue } = useFormContext<ContractFormValues>();
  const watchedStatus = watch('status');

  return (
    <div className="bg-white/60 p-6 rounded-xl border border-white/40 shadow-sm backdrop-blur-sm relative z-50 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <div>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <CustomSelect
                label="Status Atual *"
                value={field.value}
                onChange={field.onChange}
                options={statusOptions}
                onAction={handleCreateStatus} actionIcon={Plus} actionLabel="Adicionar Novo Status"
              />
            )}
          />
          {errors.status && <span className="text-xs text-red-500 mt-1">{errors.status.message}</span>}
        </div>

        {watchedStatus && (
          <div className="animate-in fade-in">
            <label className="text-xs font-medium block mb-1 text-gray-600">
              {watchedStatus === 'analysis' ? 'Data do Prospect' :
               watchedStatus === 'proposal' ? 'Data da Proposta' :
               watchedStatus === 'active' ? 'Data da Assinatura' :
               watchedStatus === 'rejected' ? 'Data da Rejeição' : 'Data'}
            </label>
            <input
              type="date"
              className={`w-full border p-2.5 rounded-lg text-sm outline-none ${
                errors[watchedStatus === 'active' ? 'contract_date' : watchedStatus === 'analysis' ? 'prospect_date' : 'created_at' as any] 
                ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white focus:border-salomao-blue'}`}
              {...register(
                watchedStatus === 'analysis' ? 'prospect_date' :
                watchedStatus === 'proposal' ? 'proposal_date' :
                watchedStatus === 'active' ? 'contract_date' :
                watchedStatus === 'rejected' ? 'rejection_date' :
                watchedStatus === 'probono' ? 'probono_date' : 'created_at'
              )}
            />
            {watchedStatus === 'active' && errors.contract_date && <span className="text-xs text-red-500">{errors.contract_date.message}</span>}
          </div>
        )}
      </div>

      {watchedStatus === 'analysis' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in slide-in-from-top-2">
          <div>
            <Controller name="analyst_id" control={control} render={({ field }) => (
              <CustomSelect label="Analisado Por" value={field.value || ''} onChange={field.onChange} options={analystSelectOptions} onAction={onOpenAnalystManager} actionIcon={Settings} actionLabel="Gerenciar Analistas" />
            )} />
          </div>
        </div>
      )}
      
      {watchedStatus === 'rejected' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-in fade-in slide-in-from-top-2">
            <div>
                <Controller name="analyst_id" control={control} render={({ field }) => (
                    <CustomSelect label="Analisado por" value={field.value || ''} onChange={field.onChange} options={analystSelectOptions} onAction={onOpenAnalystManager} actionIcon={Settings} actionLabel="Gerenciar Analistas" />
                )} />
            </div>
            <div>
                <Controller name="rejection_by" control={control} render={({ field }) => (
                    <CustomSelect label="Quem rejeitou" value={field.value || ''} onChange={field.onChange} options={rejectionByOptions} />
                )} />
            </div>
            <div>
                <Controller name="rejection_reason" control={control} render={({ field }) => (
                    <CustomSelect label="Motivo da Rejeição" value={field.value || ''} onChange={field.onChange} options={rejectionReasonOptions} />
                )} />
            </div>
        </div>
      )}

      {watchedStatus === 'probono' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in slide-in-from-top-2">
            <div>
                <Controller name="partner_id" control={control} render={({ field }) => (
                    <CustomSelect label="Enviado Por" value={field.value || ''} onChange={field.onChange} options={partnerSelectOptions} />
                )} />
            </div>
        </div>
      )}
    </div>
  );
}
