// Mapeamento de Segmentos de Justiça (J)
const JUSTICE_SEGMENTS: Record<string, string> = {
  '1': 'STF - Supremo Tribunal Federal',
  '2': 'CNJ - Conselho Nacional de Justiça',
  '3': 'STJ - Superior Tribunal de Justiça',
  '4': 'Justiça Federal (TRF)',
  '5': 'Justiça do Trabalho (TRT)',
  '6': 'Justiça Eleitoral',
  '7': 'Justiça Militar da União',
  '8': 'Justiça Estadual (TJ)',
  '9': 'Justiça Militar Estadual'
};

// Mapeamento de Tribunais Estaduais (J=8 -> TR)
const STATES_TRIBUNALS: Record<string, string> = {
  '01': 'TJAC - Acre', '02': 'TJAL - Alagoas', '03': 'TJAP - Amapá', '04': 'TJAM - Amazonas',
  '05': 'TJBA - Bahia', '06': 'TJCE - Ceará', '07': 'TJDFT - Distrito Federal', '08': 'TJES - Espírito Santo',
  '09': 'TJGO - Goiás', '10': 'TJMA - Maranhão', '11': 'TJMT - Mato Grosso', '12': 'TJMS - Mato Grosso do Sul',
  '13': 'TJMG - Minas Gerais', '14': 'TJPA - Pará', '15': 'TJPB - Paraíba', '16': 'TJPR - Paraná',
  '17': 'TJPE - Pernambuco', '18': 'TJPI - Piauí', '19': 'TJRJ - Rio de Janeiro', '20': 'TJRN - Rio Grande do Norte',
  '21': 'TJRS - Rio Grande do Sul', '22': 'TJRO - Rondônia', '23': 'TJRR - Roraima', '24': 'TJSC - Santa Catarina',
  '25': 'TJSE - Sergipe', '26': 'TJSP - São Paulo', '27': 'TJTO - Tocantins'
};

// Mapeamento de TRFs (J=4 -> TR)
const FEDERAL_TRIBUNALS: Record<string, string> = {
  '01': 'TRF1 (AC, AM, AP, BA, DF, GO, MA, MT, MG, PA, PI, RO, RR, TO)',
  '02': 'TRF2 (RJ, ES)',
  '03': 'TRF3 (SP, MS)',
  '04': 'TRF4 (RS, SC, PR)',
  '05': 'TRF5 (AL, CE, PB, PE, RN, SE)',
  '06': 'TRF6 (MG)'
};

// Mapeamento de TRTs (J=5 -> TR)
const LABOR_TRIBUNALS: Record<string, string> = {
  '01': 'TRT1 (RJ)', '02': 'TRT2 (SP - Capital)', '03': 'TRT3 (MG)', '04': 'TRT4 (RS)',
  '05': 'TRT5 (BA)', '06': 'TRT6 (PE)', '07': 'TRT7 (CE)', '08': 'TRT8 (PA, AP)',
  '09': 'TRT9 (PR)', '10': 'TRT10 (DF, TO)', '11': 'TRT11 (AM, RR)', '12': 'TRT12 (SC)',
  '13': 'TRT13 (PB)', '14': 'TRT14 (RO, AC)', '15': 'TRT15 (SP - Campinas)', '16': 'TRT16 (MA)',
  '17': 'TRT17 (ES)', '18': 'TRT18 (GO)', '19': 'TRT19 (AL)', '20': 'TRT20 (SE)',
  '21': 'TRT21 (RN)', '22': 'TRT22 (PI)', '23': 'TRT23 (MT)', '24': 'TRT24 (MS)'
};

export const decodeCNJ = (cnj: string) => {
  // Remove caracteres não numéricos
  const cleanCNJ = cnj.replace(/\D/g, '');

  // Validação básica de tamanho (20 dígitos)
  if (cleanCNJ.length !== 20) {
    return null;
  }

  // Estrutura: NNNNNNN-DD.AAAA.J.TR.OOOO
  // Posições (0 index): 
  // Ano (AAAA): 9 a 12
  // Justiça (J): 13
  // Tribunal (TR): 14 a 15
  
  const ano = cleanCNJ.substring(9, 13);
  const j = cleanCNJ.substring(13, 14);
  const tr = cleanCNJ.substring(14, 16);

  let tribunalInfo = 'Tribunal não identificado';

  if (j === '8') {
    tribunalInfo = STATES_TRIBUNALS[tr] || `TJ Desconhecido (Cód ${tr})`;
  } else if (j === '4') {
    tribunalInfo = FEDERAL_TRIBUNALS[tr] || `TRF Desconhecido (Cód ${tr})`;
  } else if (j === '5') {
    tribunalInfo = LABOR_TRIBUNALS[tr] || `TRT Desconhecido (Cód ${tr})`;
  } else {
    tribunalInfo = JUSTICE_SEGMENTS[j] || 'Órgão Judiciário Diverso';
  }

  return {
    tribunal: tribunalInfo,
    ano: ano,
    segmento: JUSTICE_SEGMENTS[j]
  };
};