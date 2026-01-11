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
    .slice(0, 11); // Limita tamanho: 0000000/000
};

export const maskCNJ = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{7})(\d)/, '$1-$2')
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{4})(\d)/, '$1.$2')
    .replace(/(\d{1})(\d)/, '$1.$2')
    .replace(/(\d{2})(\d)/, '$1-$2') // Ajuste fino pode ser necessário dependendo do formato exato CNJ
    .slice(0, 25);
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