export const formatMoney = (val: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val || 0);

export const formatCompact = (val: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val || 0);

export const calcDelta = (atual: number, anterior: number) => {
  if (anterior === 0) return atual > 0 ? 100 : 0;
  return ((atual - anterior) / anterior) * 100;
};

export const getTrendText = (delta: number, context: string) => {
  const displayDelta = Math.abs(delta) > 999 ? '>999' : Math.abs(delta).toFixed(0);
  if (delta > 0) return `Crescimento de ${displayDelta}% em ${context}.`;
  if (delta < 0) return `Redução de ${displayDelta}% em ${context}.`;
  return `Estabilidade em ${context}.`;
};