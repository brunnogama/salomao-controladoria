export const maskCNPJ = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .slice(0, 18);
};

export const maskMoney = (value: string) => {
  const numericValue = value.replace(/\D/g, '');
  const options = { minimumFractionDigits: 2 };
  const result = new Intl.NumberFormat('pt-BR', options).format(
    parseFloat(numericValue) / 100
  );
  return 'R$ ' + result;
};

export const maskHon = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{7})(\d)/, '$1/$2')
    .slice(0, 11);
};

// CORREÇÃO DA MÁSCARA CNJ
// Formato: 0000000-00.0000.0.00.0000
export const maskCNJ = (value: string) => {
  return value
    .replace(/\D/g, '') // Remove tudo o que não é dígito
    .replace(/^(\d{7})(\d)/, '$1-$2') // Adiciona hífen após os primeiros 7 dígitos
    .replace(/^(\d{7}-\d{2})(\d)/, '$1.$2') // Adiciona ponto após o dígito verificador
    .replace(/^(\d{7}-\d{2}\.\d{4})(\d)/, '$1.$2') // Adiciona ponto após o ano
    .replace(/^(\d{7}-\d{2}\.\d{4}\.\d)(\d)/, '$1.$2') // Adiciona ponto após o dígito de justiça
    .replace(/^(\d{7}-\d{2}\.\d{4}\.\d\.\d{2})(\d)/, '$1.$2') // Adiciona ponto após o tribunal
    .slice(0, 25); // Limita ao tamanho máximo da string formatada
};

export const toTitleCase = (str: string) => {
  if (!str) return '';
  return str.toLowerCase().replace(/(?:^|\s)\w/g, function(match) {
    return match.toUpperCase();
  });
};

export const parseCurrency = (value: string | undefined): number => {
  if (!value) return 0;
  // Remove "R$", pontos de milhar e substitui vírgula decimal por ponto
  const clean = value.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
  return parseFloat(clean) || 0;
};

// Alias para manter compatibilidade
export const unmaskMoney = parseCurrency;