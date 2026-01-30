/**
 * Dashboard Helper Functions
 * Funções auxiliares para formatação e cálculos do dashboard
 */

/**
 * Formata valor monetário em Real Brasileiro (R$)
 * @param val - Valor numérico a ser formatado
 * @returns String formatada como moeda (ex: R$ 1.234,56)
 */
export const formatMoney = (val: number): string => 
  new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL', 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }).format(val || 0);

/**
 * Formata valor monetário de forma compacta (sem centavos)
 * Útil para gráficos e valores grandes
 * @param val - Valor numérico a ser formatado
 * @returns String formatada como moeda sem centavos (ex: R$ 1.234)
 */
export const formatCompact = (val: number): string => {
  const absVal = Math.abs(val || 0);
  
  // Para valores muito grandes, usar notação K/M
  if (absVal >= 1000000) {
    return `R$ ${(val / 1000000).toFixed(1)}M`;
  } else if (absVal >= 10000) {
    return `R$ ${(val / 1000).toFixed(0)}K`;
  }
  
  // Para valores menores, formato normal sem centavos
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL', 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
  }).format(val || 0);
};

/**
 * Calcula a variação percentual entre dois valores
 * @param atual - Valor atual
 * @param anterior - Valor anterior para comparação
 * @returns Percentual de variação (positivo = crescimento, negativo = redução)
 */
export const calcDelta = (atual: number, anterior: number): number => {
  if (anterior === 0) return atual > 0 ? 100 : 0;
  return ((atual - anterior) / anterior) * 100;
};

/**
 * Gera texto descritivo de tendência baseado no delta percentual
 * @param delta - Percentual de variação
 * @param context - Contexto da métrica (ex: "vendas", "conversões")
 * @returns String descritiva da tendência
 */
export const getTrendText = (delta: number, context: string): string => {
  const displayDelta = Math.abs(delta) > 999 ? '>999' : Math.abs(delta).toFixed(0);
  
  if (delta > 0) {
    return `Crescimento de ${displayDelta}% em ${context}`;
  }
  
  if (delta < 0) {
    return `Redução de ${displayDelta}% em ${context}`;
  }
  
  return `Estabilidade em ${context}`;
};

/**
 * Formata número sem notação monetária (apenas número)
 * @param val - Valor numérico
 * @returns String formatada (ex: 1.234)
 */
export const formatNumber = (val: number): string => 
  new Intl.NumberFormat('pt-BR', { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
  }).format(val || 0);

/**
 * Calcula percentual entre dois valores
 * @param parte - Valor da parte
 * @param total - Valor total
 * @returns Percentual (0-100)
 */
export const calcPercent = (parte: number, total: number): number => {
  if (total === 0) return 0;
  return (parte / total) * 100;
};

/**
 * Formata percentual com casas decimais
 * @param val - Valor do percentual (0-100)
 * @param decimals - Número de casas decimais (padrão: 1)
 * @returns String formatada (ex: 45,5%)
 */
export const formatPercent = (val: number, decimals: number = 1): string => 
  `${val.toFixed(decimals)}%`;