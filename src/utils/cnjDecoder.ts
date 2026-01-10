// Mapeamento de Segmentos de Justiça (J)
const JUSTICE_SEGMENTS: Record<string, string> = {
  '1': 'STF',
  '2': 'CNJ',
  '3': 'STJ',
  '4': 'TRF',
  '5': 'TRT',
  '6': 'TRE',
  '7': 'STM',
  '8': 'TJ',
  '9': 'JME'
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

// Mapeamento de TRFs (J=4 -> TR)
const FEDERAL_TRIBUNALS: Record<string, string> = {
  '01': 'TRF1', '02': 'TRF2', '03': 'TRF3',
  '04': 'TRF4', '05': 'TRF5', '06': 'TRF6'
};

// Mapeamento de TRTs (J=5 -> TR)
const LABOR_TRIBUNALS: Record<string, string> = {
  '01': 'TRT1', '02': 'TRT2', '03': 'TRT3', '04': 'TRT4',
  '05': 'TRT5', '06': 'TRT6', '07': 'TRT7', '08': 'TRT8',
  '09': 'TRT9', '10': 'TRT10', '11': 'TRT11', '12': 'TRT12',
  '13': 'TRT13', '14': 'TRT14', '15': 'TRT15', '16': 'TRT16',
  '17': 'TRT17', '18': 'TRT18', '19': 'TRT19', '20': 'TRT20',
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
    segmento: JUSTICE_SEGMENTS[j]
  };
};