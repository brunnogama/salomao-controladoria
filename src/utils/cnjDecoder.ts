// Mapeamento de Segmentos de Justiça (J)
const JUSTICE_SEGMENTS: Record<string, string> = {
  '1': 'STF', '2': 'CNJ', '3': 'STJ', '4': 'TRF',
  '5': 'TRT', '6': 'TRE', '7': 'STM', '8': 'TJ', '9': 'JME'
};

// Mapeamento de Tribunais Estaduais (J=8 -> TR)
const STATES_TRIBUNALS: Record<string, string> = {
  '01': 'TJAC', '02': 'TJAL', '03': 'TJAP', '04': 'TJAM',
  '05': 'TJBA', '06': 'TJCE', '07': 'TJDFT', '08': 'TJES',
  '09': 'TJGO', '10': 'TJMA', '11': 'TJMT', '12': 'TJMS',
  '13': 'TJMG', '14': 'TJPA', '15': 'TJPB', '16': 'TJPR',
  '17': 'TJPE', '18': 'TJPI', '19': 'TJRJ', '20': 'TJRN',
  '21': 'TJRS', '22': 'TJRO', '23': 'TJRR', '24': 'TJSC',
  '25': 'TJSE', '26': 'TJSP', '27': 'TJTO'
};

// Mapeamento Reverso de Código para UF (Para preenchimento automático)
const CODE_TO_UF: Record<string, string> = {
  // Estaduais (J=8)
  '8.01': 'AC', '8.02': 'AL', '8.03': 'AP', '8.04': 'AM', '8.05': 'BA',
  '8.06': 'CE', '8.07': 'DF', '8.08': 'ES', '8.09': 'GO', '8.10': 'MA',
  '8.11': 'MT', '8.12': 'MS', '8.13': 'MG', '8.14': 'PA', '8.15': 'PB',
  '8.16': 'PR', '8.17': 'PE', '8.18': 'PI', '8.19': 'RJ', '8.20': 'RN',
  '8.21': 'RS', '8.22': 'RO', '8.23': 'RR', '8.24': 'SC', '8.25': 'SE',
  '8.26': 'SP', '8.27': 'TO',
  // TRTs (J=5) - Alguns mapeamentos diretos comuns
  '5.01': 'RJ', '5.02': 'SP', '5.03': 'MG', '5.04': 'RS', '5.05': 'BA',
  '5.06': 'PE', '5.07': 'CE', '5.08': 'PA', '5.09': 'PR', '5.10': 'DF',
  '5.11': 'AM', '5.12': 'SC', '5.13': 'PB', '5.14': 'RO', '5.15': 'SP',
  '5.16': 'MA', '5.17': 'ES', '5.18': 'GO', '5.19': 'AL', '5.20': 'SE',
  '5.21': 'RN', '5.22': 'PI', '5.23': 'MT', '5.24': 'MS'
};

const FEDERAL_TRIBUNALS: Record<string, string> = {
  '01': 'TRF1', '02': 'TRF2', '03': 'TRF3', '04': 'TRF4', '05': 'TRF5', '06': 'TRF6'
};

const LABOR_TRIBUNALS: Record<string, string> = {
  '01': 'TRT1', '02': 'TRT2', '03': 'TRT3', '04': 'TRT4', '05': 'TRT5',
  '06': 'TRT6', '07': 'TRT7', '08': 'TRT8', '09': 'TRT9', '10': 'TRT10',
  '11': 'TRT11', '12': 'TRT12', '13': 'TRT13', '14': 'TRT14', '15': 'TRT15',
  '16': 'TRT16', '17': 'TRT17', '18': 'TRT18', '19': 'TRT19', '20': 'TRT20',
  '21': 'TRT21', '22': 'TRT22', '23': 'TRT23', '24': 'TRT24'
};

export const decodeCNJ = (cnj: string) => {
  const cleanCNJ = cnj.replace(/\D/g, '');

  if (cleanCNJ.length !== 20) {
    return null;
  }

  // Estrutura: NNNNNNN-DD.AAAA.J.TR.OOOO
  const ano = cleanCNJ.substring(9, 13);
  const j = cleanCNJ.substring(13, 14);
  const tr = cleanCNJ.substring(14, 16);

  let tribunalInfo = '';
  let uf = '';

  // Tenta extrair a UF baseada na combinação J.TR
  const key = `${j}.${tr}`;
  if (CODE_TO_UF[key]) {
    uf = CODE_TO_UF[key];
  }

  if (j === '8') {
    tribunalInfo = STATES_TRIBUNALS[tr] || `TJ-${tr}`;
  } else if (j === '4') {
    tribunalInfo = FEDERAL_TRIBUNALS[tr] || `TRF-${tr}`;
  } else if (j === '5') {
    tribunalInfo = LABOR_TRIBUNALS[tr] || `TRT-${tr}`;
  } else {
    tribunalInfo = JUSTICE_SEGMENTS[j] || 'Outros';
  }

  return {
    tribunal: tribunalInfo,
    ano: ano,
    segmento: JUSTICE_SEGMENTS[j],
    uf: uf // Nova propriedade
  };
};