export interface Contract {
  id?: string;
  seq_id?: number; // Campo do Banco (ID Fixo)
  display_id?: string; // Campo Visual (000001)
  created_at?: string;
  client_name: string;
  client_id?: string;
  client_position: string;
  has_no_cnpj: boolean;
  cnpj?: string;
  area: string;
  sector?: string;
  uf: string;
  partner_id: string;
  partner_name?: string;
  analyst_id?: string;
  analyzed_by_name?: string;
  
  // Campo que estava faltando e gerou erro
  billing_location?: string;

  has_legal_process: boolean;
  status: 'analysis' | 'proposal' | 'active' | 'rejected' | 'probono';
  
  // Datas
  prospect_date?: string;
  proposal_date?: string;
  contract_date?: string;
  rejection_date?: string;
  probono_date?: string;
  
  // Financeiro
  pro_labore?: string;
  pro_labore_installments?: string;
  pro_labore_clause?: string;
  
  final_success_fee?: string;
  final_success_fee_installments?: string;
  final_success_fee_clause?: string;
  final_success_percent?: string;
  final_success_percent_clause?: string;
  
  fixed_monthly_fee?: string;
  fixed_monthly_fee_installments?: string;
  fixed_monthly_fee_clause?: string;
  
  other_fees?: string;
  other_fees_installments?: string;
  other_fees_clause?: string;

  // Arrays de Valores Extras
  pro_labore_extras?: string[];
  final_success_extras?: string[];
  fixed_monthly_extras?: string[];
  other_fees_extras?: string[];
  intermediate_fees?: string[];
  percent_extras?: string[];

  // Arrays de Cláusulas Extras
  pro_labore_extras_clauses?: string[];
  final_success_extras_clauses?: string[];
  fixed_monthly_extras_clauses?: string[];
  other_fees_extras_clauses?: string[];
  intermediate_fees_clauses?: string[];
  percent_extras_clauses?: string[];

  // Outros
  company_name?: string; // Parte contrária ou empresa
  reference?: string;
  observations?: string;
  
  // Rejeição
  rejection_reason?: string;
  rejection_by?: string;

  // Assinatura
  physical_signature?: boolean;
  
  // Timesheet
  timesheet?: boolean;

  // Específico para visualização
  process_count?: number;
  hon_number?: string;
}

// Interface que estava faltando e quebrou o ClientFormModal
export interface Client {
  id?: string;
  name: string;
  cnpj?: string;
  is_person?: boolean;
  email?: string;
  phone?: string;
  address?: string;
  number?: string;
  complement?: string;
  city?: string;
  uf?: string;
  active?: boolean;
  partner_id?: string;
  created_at?: string;
}

export interface Partner {
  id: string;
  name: string;
  email?: string;
  active: boolean;
}

export interface Analyst {
  id: string;
  name: string;
  email?: string;
  active: boolean;
}

export interface ContractProcess {
  id?: string;
  contract_id?: string;
  process_number: string;
  court?: string; 
  uf?: string;
  vara?: string;
  comarca?: string;
  numeral?: string; 
  instance?: string;
  position?: string; 
  opponent?: string; 
  process_class?: string; 
  subject?: string; 
  action_type?: string; 
  distribution_date?: string;
  cause_value?: string;
  justice_type?: string; 
  magistrates?: Magistrate[]; 
}

export interface Magistrate {
  title: string; 
  name: string;
}

export interface TimelineEvent {
  id: string;
  contract_id: string;
  old_status: string;
  new_status: string;
  changed_by: string;
  changed_at: string;
}

export interface ContractDocument {
  id: string;
  contract_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  uploaded_at: string;
  file_size?: number; 
  hon_number_ref?: string; 
}

export interface FinancialInstallment {
  id: string;
  contract_id: string;
  type: 'pro_labore' | 'success_fee' | 'final_success_fee' | 'intermediate_fee' | 'fixed' | 'other';
  installment_number: number;
  total_installments: number;
  amount: number;
  due_date?: string;
  status: 'pending' | 'paid' | 'cancelled';
  paid_at?: string;
  clause?: string;
  
  contract?: {
    id: string;
    seq_id?: number;
    client_name: string;
    hon_number?: string;
    partner_id?: string;
    partner_name?: string;
    billing_location?: string;
    display_id?: string; 
  };
}

export interface KanbanTask {
  id: string;
  title: string;
  description?: string;
  status: string; 
  priority: 'Baixa' | 'Média' | 'Alta';
  due_date?: string;
  contract_id?: string;
  position: number;
  tags?: string[];
  
  // Campo que estava faltando
  observation?: string;
  
  contract?: {
    client_name: string;
    hon_number?: string;
    seq_id?: number;
  };
}