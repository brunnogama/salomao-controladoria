import * as z from 'zod';

export const contractSchema = z.object({
  id: z.string().optional(),
  status: z.enum(['analysis', 'proposal', 'active', 'rejected', 'probono']),
  client_name: z.string().min(1, "Nome do Cliente é obrigatório"),
  partner_id: z.string().min(1, "Sócio Responsável é obrigatório"),
  
  // Datas
  prospect_date: z.string().optional().nullable(),
  proposal_date: z.string().optional().nullable(),
  contract_date: z.string().optional().nullable(),
  rejection_date: z.string().optional().nullable(),
  probono_date: z.string().optional().nullable(),

  // Campos Active
  hon_number: z.string().optional(),
  billing_location: z.string().optional(),
  physical_signature: z.any().optional(),

  // Gerais
  cnpj: z.string().optional(),
  has_no_cnpj: z.boolean().optional(),
  area: z.string().optional(),
  uf: z.string().optional(),
  client_id: z.string().optional(),
  client_position: z.string().optional(),
  analyst_id: z.string().optional(),
  rejection_by: z.string().optional(),
  rejection_reason: z.string().optional(),
  
  // Financeiro (strings mascaradas)
  pro_labore: z.string().optional(),
  final_success_fee: z.string().optional(),
  fixed_monthly_fee: z.string().optional(),
  other_fees: z.string().optional(),
  
  // Campos de controle (arrays e complexos mantidos como any/opcionais para flexibilidade na transição)
  pro_labore_installments: z.string().optional(),
  final_success_fee_installments: z.string().optional(),
  fixed_monthly_fee_installments: z.string().optional(),
  other_fees_installments: z.string().optional(),
  
  pro_labore_clause: z.string().optional(),
  final_success_fee_clause: z.string().optional(),
  fixed_monthly_fee_clause: z.string().optional(),
  other_fees_clause: z.string().optional(),
  
  has_legal_process: z.boolean().optional(),
  observations: z.string().optional(),
  reference: z.string().optional(),
  timesheet: z.boolean().optional(),
  
  final_success_percent: z.string().optional(),
  final_success_percent_clause: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.status === 'analysis' && !data.prospect_date) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Data do Prospect é obrigatória", path: ['prospect_date'] });
  }
  if (data.status === 'proposal' && !data.proposal_date) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Data da Proposta é obrigatória", path: ['proposal_date'] });
  }
  if (data.status === 'active') {
    if (!data.contract_date) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Data da Assinatura é obrigatória", path: ['contract_date'] });
    if (!data.hon_number) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Número HON é obrigatório", path: ['hon_number'] });
    if (!data.billing_location) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Local de Faturamento é obrigatório", path: ['billing_location'] });
    if (data.physical_signature === undefined || data.physical_signature === null || data.physical_signature === '') {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Informe sobre a Assinatura Física", path: ['physical_signature'] });
    }
  }
});

export type ContractFormValues = z.infer<typeof contractSchema>;