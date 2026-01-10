export interface Partner {
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

export interface Contract {
  id?: string;
  status: 'analysis' | 'proposal' | 'active' | 'rejected' | 'probono';
  cnpj: string;
  has_no_cnpj: boolean;
  client_name: string;
  client_position: string;
  company_name: string;
  has_legal_process: boolean;
  uf: string;
  area: string;
  partner_id: string;
  observations: string;
  
  // Specifics
  prospect_date?: string;
  analyzed_by?: string;
  proposal_date?: string;
  contract_date?: string;
  hon_number?: string;
  rejection_date?: string;
  rejected_by?: string;
  rejection_reason?: string;
  probono_date?: string;
  
  // New Field
  physical_signature?: boolean;
  
  // Financial
  pro_labore?: string;
  final_success_fee?: string;
  final_success_percent?: string;
  intermediate_fees?: string[];
  timesheet?: boolean;
  other_fees?: string;

  // Display fields (joins)
  partner_name?: string;
  process_count?: number;
  created_at?: string;
}s