export const currencyMask = (value: string) => {
  let v = value.replace(/\D/g, '');
  v = (Number(v) / 100).toFixed(2) + '';
  v = v.replace('.', ',');
  v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
  return 'R$ ' + v;
};

export const parseCurrency = (value: string | undefined): number => {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  const clean = value.replace(/[R$\s.]/g, '').replace(',', '.');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
};

export const phoneMask = (value: string) => {
  const v = value.replace(/\D/g, "");
  if (v.length > 10) {
    return v
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 15);
  }
  return v
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .slice(0, 14);
};

export const cnpjMask = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

export const cpfMask = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

export const maskCNPJ = cnpjMask; // Alias para compatibilidade
export const maskMoney = currencyMask; // Alias para compatibilidade
export const maskHon = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{7})(\d)/, '$1/$2')
    .replace(/(\/\d{3})\d+?$/, '$1');
};
export const maskCNJ = (value: string) => {
  let v = value.replace(/\D/g, "");
  v = v.replace(/^(\d{7})(\d)/, "$1-$2");
  v = v.replace(/-(\d{2})(\d)/, "-$1.$2");
  v = v.replace(/\.(\d{4})(\d)/, ".$1.$2");
  v = v.replace(/\.(\d)(\d)/, ".$1.$2");
  v = v.replace(/\.(\d{2})(\d)/, ".$1.$2");
  return v.slice(0, 25);
};
export const toTitleCase = (str: string) => {
  if (!str) return '';
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};
export const maskCEP = (value: string) => {
  return value.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9);
};