import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '../../lib/supabase';
import { X, Save, Loader2 } from 'lucide-react';
import { Contract, Partner, ContractProcess, Analyst, ContractDocument, TimelineEvent } from '../../types';
import { contractSchema, ContractFormValues } from '../../schemas/contractSchema';
import { toast } from 'sonner';
import { toTitleCase, maskCNPJ, safeParseFloat } from '../../utils/masks';

// Import dos Módulos
import { ContractStatusSection } from './form/ContractStatusSection';
import { ContractClientSection } from './form/ContractClientSection';
import { ContractFinancialSection } from './form/ContractFinancialSection'; // (Você criará este similar aos outros)
import { ContractProcessSection } from './form/ContractProcessSection'; // (Você criará este similar aos outros)
import { OptionManager } from './form/OptionManager'; // Extrair OptionManager para arquivo próprio

// ... (Imports de helpers e tipos auxiliares mantidos) ...

interface Props {
  isOpen: boolean; onClose: () => void; formData: Contract; setFormData: any; onSave: () => void; loading: boolean; isEditing: boolean;
  partners: Partner[]; analysts: Analyst[];
  // ... (Outras props podem ser simplificadas se passadas via contexto ou reduzidas)
}

export function ContractFormModal(props: Props) {
  const { isOpen, onClose, formData, onSave, partners, analysts, isEditing } = props;

  // 1. Inicializa o React Hook Form
  const methods = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema),
    defaultValues: formData as any
  });

  const { reset, handleSubmit, setValue } = methods;

  // 2. Estados Locais para UI (que não são do formulário principal)
  const [localLoading, setLocalLoading] = useState(false);
  const [activeManager, setActiveManager] = useState<string | null>(null);
  
  // Listas de Opções (Estados)
  const [clientOptions, setClientOptions] = useState<string[]>([]);
  const [areaOptions, setAreaOptions] = useState<string[]>(['Cível', 'Trabalhista']); // Exemplo
  // ... Carregar outras opções via useEffect ...

  // 3. Efeitos de Carregamento
  useEffect(() => {
    if (isOpen) {
      reset(formData as any); // Reseta o form com os dados recebidos
      // ... carregar opções do banco ...
    }
  }, [isOpen, formData, reset]);

  // 4. Submit Handler Limpo
  const onFormSubmit = async (data: ContractFormValues) => {
    setLocalLoading(true);
    try {
        // Lógica de upsertClient ...
        // Lógica de preparar payload ...
        // Lógica de salvar no Supabase ...
        
        toast.success("Salvo com sucesso!");
        onSave();
        onClose();
    } catch (error: any) {
        toast.error("Erro ao salvar: " + error.message);
    } finally {
        setLocalLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[50] p-4 overflow-y-auto">
      {/* 5. Provider envolve todo o formulário para passar o contexto aos filhos */}
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onFormSubmit)} className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[95vh]">
          
          {/* Header */}
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold">{isEditing ? 'Editar Caso' : 'Novo Caso'}</h2>
            <button type="button" onClick={onClose}><X className="w-6 h-6 text-gray-400" /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            
            {/* Módulos do Formulário */}
            <ContractStatusSection 
                statusOptions={[]} // Passar opções
                analystSelectOptions={analysts.map(a => ({label: a.name, value: a.id}))}
                // ... outras props necessárias
            />

            <ContractClientSection 
                clientSelectOptions={clientOptions.map(c => ({label: c, value: c}))}
                partnerSelectOptions={partners.map(p => ({label: p.name, value: p.id}))}
                // ...
            />

            {/* Renderizar Financeiro e Processos apenas se necessário */}
            <ContractProcessSection />
            <ContractFinancialSection />

          </div>

          <div className="p-6 border-t flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600">Cancelar</button>
            <button type="submit" className="px-6 py-2 bg-salomao-blue text-white rounded-lg flex items-center">
              {localLoading ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
              Salvar
            </button>
          </div>

        </form>
      </FormProvider>
      
      {/* Modais de Gerenciamento */}
      {activeManager && <OptionManager onClose={() => setActiveManager(null)} />}
    </div>
  );
}