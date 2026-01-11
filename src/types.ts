export interface Partner {
  id: string;
  name: string;
  active: boolean;
}

export interface Analyst {
  id: string;
  name: string;
  active: boolean;
}

export interface ContractProcess {
  id?: string;
  process_number: string;
  cause_value: string;
  court: string;
  judge: string;
}

export interface TimelineEvent {
  id: string;
  previous_status: string;
  new_status: string;
  changed_by: string;
  changed_at: string;
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

export interface KanbanTask {
  id: string;
  title: string;
  description?: string;
  priority: 'Alta' | 'Média' | 'Baixa';
  status: 'todo' | 'doing' | 'done' | 'signature';
  position: number;
  due_date?: string;
  contract_id?: string;
  observation?: string;
  created_at?: string;
}

export interface Client {
  id?: string;
  name: string;
  cnpj: string;
  is_person: boolean;
  address?: string;
  number?: string;
  complement?: string;
  city?: string;
  uf?: string;
  email?: string;
  website?: string;
  partner_id?: string;
  created_at?: string;
  
  // Campos virtuais
  active_contracts_count?: number;
  contracts_hon?: string[];
  partner_name?: string;
}

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
  analyst_id?: string; // NOVO CAMPO
  observations: string;
  
  prospect_date?: string;
  analyzed_by?: string; // Mantido para legado, mas analyst_id é o principal agora
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
  pro_labore_installments?: string;
  
  final_success_fee?: string;
  final_success_fee_installments?: string;
  
  final_success_percent?: string;
  intermediate_fees?: string[];
  timesheet?: boolean;
  
  other_fees?: string;
  other_fees_installments?: string;

  partner_name?: string;
  analyzed_by_name?: string; // NOVO CAMPO VIRTUAL
  process_count?: number;
  created_at?: string;
}

export interface FinancialInstallment {
  id: string;
  contract_id: string;
  type: 'pro_labore' | 'success_fee' | 'final_success_fee' | 'intermediate_fee' | 'other';
  installment_number: number;
  total_installments: number;
  amount: number;
  due_date?: string;
  status: 'pending' | 'paid';
  paid_at?: string;
  contract?: Contract; 
}

export interface Contract {
  // ... (outros campos existentes)
  
  // Adicione estes dois:
  fixed_monthly_fee?: string;
  fixed_monthly_fee_installments?: string;

  // ... (restante do arquivo)
}