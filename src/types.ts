export interface Contract {
  id?: string;
  client_name: string;
  cnpj?: string;
  has_no_cnpj?: boolean;
  client_position?: string;
  area?: string;
  uf?: string;
  partner_id: string;
  partner_name?: string;
  analyst_id?: string;
  analyzed_by_name?: string;
  has_legal_process: boolean;
  status: 'analysis' | 'proposal' | 'active' | 'rejected' | 'probono';
  
  // Datas
  created_at?: string;
  prospect_date?: string;
  proposal_date?: string;
  contract_date?: string;
  rejection_date?: string;
  probono_date?: string; // Novo
  
  // Financeiro
  pro_labore?: string;
  pro_labore_installments?: string;
  final_success_fee?: string;
  final_success_fee_installments?: string;
  intermediate_fees?: string[];
  fixed_monthly_fee?: string;
  fixed_monthly_fee_installments?: string;
  other_fees?: string;
  other_fees_installments?: string;
  
  // Dados do Contrato
  hon_number?: string;
  billing_location?: string;
  physical_signature?: boolean;
  observations?: string;
  
  // Novos Campos de Rejeição/Probono/Referência
  rejection_source?: string;
  rejection_reason?: string;
  probono_source?: string;
  reference_text?: string; 
  
  // Relacionamentos e Arrays Auxiliares (Não salvos no