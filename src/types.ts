// ... (mantenha as outras interfaces iguais)

export interface Contract {
  id?: string;
  status: 'analysis' | 'proposal' | 'active' | 'rejected' | 'probono';
  cnpj: string;
  has_no_cnpj: boolean;
  client_name: string;
  client_id?: string;
  client_position: string;
  company_name: string;
  has_legal_process: boolean;
  uf: string;
  area: string;
  partner_id: string;
  observations: string;
  
  prospect_date?: string;
  analyzed_by?: string;
  proposal_date?: string;
  contract_date?: string;
  hon_number?: string;
  rejection_date?: string;
  rejected_by?: string;
  rejection_reason?: string;
  probono_date?: string;
  
  physical_signature?: boolean; 
  billing_location?: string;
  
  pro_labore?: string;
  pro_labore_installments?: string; // NOVO
  
  final_success_fee?: string;
  final_success_fee_installments?: string; // NOVO
  
  final_success_percent?: string;
  intermediate_fees?: string[];
  timesheet?: boolean;
  
  other_fees?: string;
  other_fees_installments?: string; // NOVO

  partner_name?: string;
  process_count?: number;
  created_at?: string;
}