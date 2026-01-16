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
  website?: string;
  partner_id?: string;
  created_at?: string;
  active_contracts_count?: number;
  contracts_hon?: string[];
  partner_name?: string;
}

export interface Partner {
  id: string;
  name: string;
  email?: string;
  active?: boolean;
}

export interface Analyst {
  id: string;
  name: string;
  email?: string;
  role?: string;
}

export interface Magistrate {
  title: string; 
  name: string;
}

export interface ContractProcess {
  id?: string;
  contract_id?: string;
  process_number: string;
  cause_value?: string;
  
  court?: string;
  link?: string;
  uf?: string;
  position?: string;
  opponent?: string;
  
  magistrates?: Magistrate[];
  
  vara?: string;
  numeral?: string; // Novo campo adicionado
  comarca?: string;
  
  action_type?: string;
  distribution_date?: string;
  
  justice_type?: string;
  nature?: string;
  instance?: string;
  
  process_class?: string;
  subject?: string;
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
  client_name: string;
  cnpj?: string;
  has_no_cnpj?: boolean;
  client_position?: string;
  area?: string;
  uf?: string;
  company_name?: string;
  
  partner_id: string;
  partner_name?: string;
  analyst_id?: string;
  analyzed_by_name?: string;
  
  has_legal_process: boolean;
  process_count?: number;
  status: 'analysis' | 'proposal' | 'active' | 'rejected' | 'probono';
  
  // Datas
  created_at?: string;
  prospect_date?: string;
  proposal_date?: string;
  contract_date?: string;
  rejection_date?: string;
  probono_date?: string;
  
  // Financeiro
  pro_labore?: string;
  pro_labore_installments?: string;
  pro_labore_extras?: string[];

  final_success_fee?: string;
  final_success_fee_installments?: string;
  final_success_percent?: string;
  final_success_extras?: string[];

  intermediate_fees?: string[];

  fixed_monthly_fee?: string;
  fixed_monthly_fee_installments?: string;
  fixed_monthly_extras?: string[];

  other_fees?: string;
  other_fees_installments?: string;
  other_fees_extras?: string[];
  
  percent_extras?: string[];
  
  timesheet?: boolean;

  // Dados do Contrato
  hon_number?: string;
  billing_location?: string;
  physical_signature?: boolean;
  observations?: string;
  
  // Campos de Rejeição/Probono
  rejected_by?: string;
  rejection_source?: string;
  rejection_reason?: string;
  probono_source?: string;
  reference_text?: string; 
}

export interface KanbanTask {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'doing' | 'done' | 'signature';
  priority: 'Baixa' | 'Média' | 'Alta';
  due_date?: string;
  assignee?: string;
  contract_id?: string;
  position: number;
  contract?: Contract;
  observation?: string;
}