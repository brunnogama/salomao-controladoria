export const maskCNPJ = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

export const maskCNJ = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{7})(\d)/, '$1-$2')
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{4})(\d)/, '$1.$2')
    .replace(/(\d{1})(\d)/, '$1.$2')
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(-\d{4})\d+?$/, '$1');
};

export const maskMoney = (value: string) => {
  const onlyNumbers = value.replace(/\D/g, '');
  const number = Number(onlyNumbers) / 100;
  return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const maskHon = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{7})(\d)/, '$1/$2')
    .replace(/(\/\d{3})\d+?$/, '$1');
};

export const unmaskMoney = (value: string) => {
  if (!value) return 0;
  return Number(value.replace(/\D/g, '')) / 100;
};

// Nova função para Title Case (Ex: "joao da silva" -> "Joao Da Silva")
export const toTitleCase = (str: string) => {
  if (!str) return '';
  return str.toLowerCase().replace(/(?:^|\s)\w/g, (match) => match.toUpperCase());
};