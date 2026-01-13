import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Estilos do PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 12,
    lineHeight: 1.5,
    color: '#333'
  },
  header: {
    marginBottom: 20,
    borderBottom: '1px solid #ccc',
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F2C4C' // Salomão Blue
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    textTransform: 'uppercase'
  },
  section: {
    marginBottom: 10,
    textAlign: 'justify'
  },
  label: {
    fontWeight: 'bold',
    fontSize: 10,
    color: '#666',
    marginTop: 10
  },
  value: {
    fontSize: 12,
    marginBottom: 5
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 10,
    color: '#999',
    borderTop: '1px solid #eee',
    paddingTop: 10
  }
});

interface ProposalData {
  clientName: string;
  object: string;
  value: string;
  date: string;
}

export const ProposalDocument = ({ data }: { data: ProposalData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.logoText}>SALOMÃO ADVOGADOS</Text>
        <Text style={{ fontSize: 10 }}>{data.date}</Text>
      </View>

      {/* Título */}
      <Text style={styles.title}>Proposta de Honorários</Text>

      {/* Corpo */}
      <View style={styles.section}>
        <Text>
          Prezados Senhores,
        </Text>
        <Text style={{ marginTop: 10 }}>
          Apresentamos a presente proposta de prestação de serviços jurídicos para {data.clientName}, conforme detalhado abaixo:
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>OBJETO DA PRESTAÇÃO DE SERVIÇOS:</Text>
        <Text style={styles.value}>{data.object}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>INVESTIMENTO (HONORÁRIOS):</Text>
        <Text style={styles.value}>{data.value}</Text>
      </View>

      <View style={{ marginTop: 30 }}>
        <Text>
          Colocamo-nos à inteira disposição para quaisquer esclarecimentos que se façam necessários.
        </Text>
        <Text style={{ marginTop: 20 }}>Atenciosamente,</Text>
        <Text style={{ marginTop: 40, borderTop: '1px solid #000', width: 200, paddingTop: 5 }}>
          Salomão Sociedade de Advogados
        </Text>
      </View>

      {/* Rodapé */}
      <Text style={styles.footer}>
        Rua Exemplo, 123 - Centro, Rio de Janeiro - RJ | (21) 0000-0000 | contato@salomao.adv.br
      </Text>
    </Page>
  </Document>
);