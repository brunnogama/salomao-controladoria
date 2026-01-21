export const maskCNPJ = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

export const maskCPF = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

export const maskMoney = (value: string) => {
  if (!value) return '';
  const numericValue = value.replace(/\D/g, '');
  const floatValue = parseFloat(numericValue) / 100;
  return floatValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

export const parseCurrency = (value: string | undefined): number => {
  if (!value) return 0;
  const numericString = value.replace(/[^\d,]/g, '').replace(',', '.');
  return parseFloat(numericString) || 0;
};

export const maskPhone = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1');
};

export const maskZipCode = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{3})\d+?$/, '$1');
};

export const toTitleCase = (str: string) => {
  if (!str) return '';
  return str.toLowerCase().replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
};

export const maskHon = (value: string) => {
  // Ex: 00.000.000/000
  let v = value.replace(/\D/g, '');
  if (v.length > 11) v = v.substring(0, 11);
  return v
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2');
};

export const maskCNJ = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    return cleanValue
        .replace(/^(\d{7})(\d)/, '$1-$2')
        .replace(/^(\d{7}-\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{7}-\d{2}\.\d{4})(\d)/, '$1.$2')
        .replace(/^(\d{7}-\d{2}\.\d{4}\.\d)(\d)/, '$1.$2')
        .replace(/^(\d{7}-\d{2}\.\d{4}\.\d\.\d{2})(\d)/, '$1.$2')
        .substring(0, 25);
};

export const safeParseFloat = (value: string | number | undefined | null): number => {
    if (value === undefined || value === null || value === '') return 0;
    if (typeof value === 'number') return value;
    const cleanStr = value.toString().replace(/[^\d,-]/g, '').replace(',', '.');
    const floatVal = parseFloat(cleanStr);
    return isNaN(floatVal) ? 0 : floatVal;
};
// ... mantenha as funções existentes (maskCNPJ, maskMoney, etc) e adicione:

export const formatForInput = (val: string | number | undefined) => {
  if (val === undefined || val === null) return '';
  if (typeof val === 'number') return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  if (typeof val === 'string' && !val.includes('R$') && !isNaN(parseFloat(val)) && val.trim() !== '') {
      return parseFloat(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
  return val;
};

export const safeParseFloat = (value: string | number | undefined | null): number => {
    if (value === undefined || value === null || value === '') return 0;
    if (typeof value === 'number') return value;
    const cleanStr = value.toString().replace(/[^\d,-]/g, '').replace(',', '.');
    const floatVal = parseFloat(cleanStr);
    return isNaN(floatVal) ? 0 : floatVal;
};

export const ensureArray = (val: any): string[] => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
        const trimmed = val.trim();
        if (trimmed.startsWith('[')) {
            try { return JSON.parse(trimmed); } catch { return []; }
        }
    }
    return [];
};

export const localMaskCNJ = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    return cleanValue
        .replace(/^(\d{7})(\d)/, '$1-$2')
        .replace(/^(\d{7}-\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{7}-\d{2}\.\d{4})(\d)/, '$1.$2')
        .replace(/^(\d{7}-\d{2}\.\d{4}\.\d)(\d)/, '$1.$2')
        .replace(/^(\d{7}-\d{2}\.\d{4}\.\d\.\d{2})(\d)/, '$1.$2')
        .substring(0, 25);
};
// Adicionei alias para manter compatibilidade com importações antigas
export const localMaskCNJ = maskCNJ;