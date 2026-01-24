export interface ContractCase {
  id?: string;
  contract_id?: string;
  pro_labore?: string;
  success_fee?: string;
  final_success_fee?: string;
}

export interface Contract {
  id?: string;
  seq_id?: number; 
  display_id?: string; 
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
  billing_location?: string;
  has_legal_process: boolean;
  status: 'analysis' | 'proposal' | 'active' | 'rejected' | 'probono';
  
  prospect_date?: string;
  proposal_date?: string;
  contract_date?: string;
  rejection_date?: string;
  probono_date?: string;
  
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

  // Campos de Detalhamento de Parcelas (Breakdown)
  pro_labore_breakdown?: { date: string; value: string }[];
  final_success_fee_breakdown?: { date: string; value: string }[];
  fixed_monthly_fee_breakdown?: { date: string; value: string }[];
  other_fees_breakdown?: { date: string; value: string }[];

  pro_labore_extras?: string[];
  final_success_extras?: string[];
  fixed_monthly_extras?: string[];
  other_fees_extras?: string[];
  intermediate_fees?: string[];
  percent_extras?: string[];

  pro_labore_extras_clauses?: string[];
  final_success_extras_clauses?: string[];
  fixed_monthly_extras_clauses?: string[];
  other_fees_extras_clauses?: string[];
  intermediate_fees_clauses?: string[];
  percent_extras_clauses?: string[];

  // Campos de Parcelas dos Extras
  pro_labore_extras_installments?: string[];
  final_success_extras_installments?: string[];
  fixed_monthly_extras_installments?: string[];
  other_fees_extras_installments?: string[];
  intermediate_fees_installments?: string[];

  company_name?: string; 
  reference?: string;
  observations?: string;
  rejection_reason?: string;
  rejection_source?: string;
  rejection_by?: string;
  physical_signature?: boolean;
  timesheet?: boolean;
  process_count?: number;
  hon_number?: string;
  
  cases?: ContractCase[];
  responsavel_socio?: string;
  
  processes?: ContractProcess[]; 
  
  // Snapshot para histórico
  proposal_snapshot?: any;
}

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
  
  partner_name?: string;
  active_contracts_count?: number;
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
  created_at?: string;
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
  value_of_cause?: number; // Valor numérico para cálculos
  justice_type?: string; 
  magistrates?: Magistrate[]; 
  
  // Campos para busca automática de CNPJ
  author?: string;
  author_cnpj?: string;
  opponent_cnpj?: string;
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
  type: 'pro_labore' | 'success_fee' | 'final_success_fee' | 'intermediate_fee' | 'fixed' | 'other' | 'fixed_monthly_fee' | 'other_fees'; // Adicionado tipos extras para compatibilidade
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
  observation?: string;
  
  contract?: {
    client_name: string;
    hon_number?: string;
    seq_id?: number;
  };
}

// --- TIPOS DO DASHBOARD (Adicionados para corrigir erros de build) ---

export interface DashboardPeriodMetrics {
  totalUnico: number;
  novos: number;
  propQtd: number;
  propPL: number;
  propExito: number;
  propMensal: number;
  fechQtd: number;
  fechPL: number;
  fechExito: number;
  fechMensal: number;
  rejeitados: number;
  probono: number;
  // Campos opcionais para visualização mensal
  analysis?: number;
  rejected?: number;
}

export interface DashboardMetrics {
  geral: {
    totalCasos: number;
    emAnalise: number;
    propostasAtivas: number;
    fechados: number;
    rejeitados: number;
    probono: number;
    valorEmNegociacaoPL: number;
    valorEmNegociacaoExito: number;
    receitaRecorrenteAtiva: number;
    totalFechadoPL: number;
    totalFechadoExito: number;
    totalFechadoFixo: number; // Campo novo para correção financeira
    mediaMensalNegociacaoPL: number;
    mediaMensalNegociacaoExito: number;
    mediaMensalCarteiraPL: number;
    mediaMensalCarteiraExito: number;
    assinados: number;
    naoAssinados: number;
  };
  semana: DashboardPeriodMetrics;
  semanaAnterior: DashboardPeriodMetrics;
  mes: DashboardPeriodMetrics;
  executivo: {
    mesAtual: DashboardPeriodMetrics;
    mesAnterior: DashboardPeriodMetrics;
    periodoAnteriorLabel: string;
    periodoAtualLabel: string;
  };
}

export interface FunilData {
  totalEntrada: number;
  taxaConversaoProposta: number;
  perdaAnalise: number;
  tempoMedioProspectProposta: number;
  qualificadosProposta: number;
  taxaConversaoFechamento: number;
  perdaNegociacao: number;
  tempoMedioPropostaFechamento: number;
  fechados: number;
}

export interface ChartDataPoint {
  qtd: number;
  mes: string;
  altura: number;
}

export interface FinanceiroDataPoint {
  mes: string;
  pl: number;
  fixo: number;
  exito: number;
  hPl: number;
  hFixo: number;
  hExito: number;
}

export interface FinanceiroStats {
  total: number;
  media: number;
  diff: number;
}

export interface RejectionItem {
  label: string;
  value: number;
  percent: number;
}

export interface RejectionData {
  reasons: RejectionItem[];
  sources: RejectionItem[];
}

export interface PartnerContractStats {
  name: string;
  total: number;
  analysis: number;
  proposal: number;
  active: number;
  rejected: number;
  probono: number;
  pl: number;
  exito: number;
  fixo: number;
}