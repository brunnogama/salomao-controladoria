export interface Client {
  id?: string;
  name: string;
  cnpj: string;
  is_person: boolean;
  uf?: string;
  address?: string;
  number?: string;
  complement?: string;
  city?: string;
  email?: string;
}

export interface Partner {
  id: string;
  name: string;
  email?: string;
}

export interface Analyst {
  id: string;
  name: string;
  email?: string;
  role?: string;
}

export interface ContractProcess {
  id?: string;
  contract_id?: string;
  process_number: string;
  cause_value?: string;
  court?: string;
  judge?: string;
}

export interface ContractDocument {
  id: string;
  contract_id: string;
  file_name: string;
  file_path: string;
  file_type: 'proposal' | 'contract';
  uploaded_at: string;
  hon_number_ref?: string;
}

export interface TimelineEvent {
  id: string;
  contract_id: string;
  previous_status: string | null;
  new_status: string;
  changed_by: string;
  changed_at: string;
}

export interface FinancialInstallment {
  id: string;
  contract_id: string;
  // AQUI ESTÁ A CORREÇÃO: Adicionado 'fixed'
  type: 'pro_labore' | 'success_fee' | 'final_success_fee' | 'intermediate_fee' | 'other' | 'fixed';
  installment_number: number;
  total_installments: number;
  amount: number;
  due_date?: string;
  status: 'pending' | 'paid';
  paid_at?: string;
  contract?: Contract; 
}

export interface Contract {
  id?: string;
  client_id?: string;
  status: 'analysis' | 'proposal' | 'active' | 'rejected' | 'probono';
  created_at?: string;
  
  // Client Info
  cnpj: string;
  has_no_cnpj: boolean;
  client_name: string;
  client_position: string;
  area: string;
  uf: string;
  company_name?: string; // Parte contrária
  
  // Internal
  partner_id: string;
  analyst_id?: string; // Novo campo
  partner_name?: string; // Virtual
  analyzed_by_name?: string; // Virtual
  
  // Process
  has_legal_process: boolean;
  process_count?: number; // Virtual

  // Dates
  prospect_date?: string;
  proposal_date?: string;
  contract_date?: string;
  rejection_date?: string;
  probono_date?: string;

  // Rejection
  rejected_by?: string;
  rejection_reason?: string;

  // Active Contract Fields
  hon_number?: string;
  billing_location?: string;
  physical_signature?: boolean;

  // Financial
  pro_labore?: string;
  pro_labore_installments?: string;
  
  final_success_fee?: string;
  final_success_fee_installments?: string;
  final_success_percent?: string;
  
  intermediate_fees?: string[];
  
  other_fees?: string;
  other_fees_installments?: string;

  // Novos campos adicionados recentemente
  fixed_monthly_fee?: string;
  fixed_monthly_fee_installments?: string;
  timesheet?: boolean;

  observations?: string;
}

export interface KanbanTask {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'doing' | 'review' | 'done' | 'billing' | 'signature';
  priority: 'Baixa' | 'Média' | 'Alta';
  due_date?: string;
  assignee?: string;
  contract_id?: string;
  position: number;
  contract?: Contract;
}