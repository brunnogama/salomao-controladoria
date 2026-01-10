export const maskCNPJ = (value: string) => {
  // Máscara de Empresa: 00.000.000/0000-00
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

export const maskCNJ = (value: string) => {
  // Máscara de Processo (CNJ): 0000000-00.2021.1.00.0000
  // 7 dígitos - 2 dígitos . 4 dígitos . 1 dígito . 2 dígitos . 4 dígitos
  
  value = value.replace(/\D/g, '');
  
  if (value.length > 20) {
    value = value.substring(0, 20);
  }

  return value
    .replace(/(\d{7})(\d)/, '$1-$2')       // 0000000-00...
    .replace(/(-\d{2})(\d)/, '$1.$2')      // ...-00.2021...
    .replace(/(\.\d{4})(\d)/, '$1.$2')     // ....2021.1...
    .replace(/(\.\d{1})(\d)/, '$1.$2')     // ....1.00...
    .replace(/(\.\d{2})(\d)/, '$1.$2');    // ....00.0000
};

export const maskMoney = (value: string) => {
  const onlyNumbers = value.replace(/\D/g, '');
  const number = Number(onlyNumbers) / 100;
  return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const maskHon = (value: string) => {
  // Máscara HON: 0000000/000
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{7})(\d)/, '$1/$2')
    .replace(/(\/\d{3})\d+?$/, '$1');
};

export const unmaskMoney = (value: string) => {
  if (!value) return 0;
  return Number(value.replace(/\D/g, '')) / 100;
};

// Title Case (Nome Próprio)
export const toTitleCase = (str: string) => {
  if (!str) return '';
  return str.toLowerCase().replace(/(?:^|\s)\w/g, (match) => match.toUpperCase());
};