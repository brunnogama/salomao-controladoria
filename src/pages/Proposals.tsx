import React, { useState } from 'react';
import { FileText, Plus, Download, Printer, Loader2 } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ProposalDocument } from '../components/proposals/ProposalDocument';

export function Proposals() {
  const [formData, setFormData] = useState({
    clientName: '',
    object: '',
    value: '',
    date: new Date().toLocaleDateString('pt-BR')
  });

  const [isGenerating, setIsGenerating] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="p-8 animate-in fade-in duration-500 h-full flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-salomao-blue flex items-center gap-2">
            <FileText className="w-8 h-8" /> Propostas
          </h1>
          <p className="text-gray-500 mt-1">Gerador de propostas e minutas contratuais.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
        {/* Formulário */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
          <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Dados da Proposta</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cliente</label>
              <input 
                type="text" 
                name="clientName"
                value={formData.clientName}
                onChange={handleChange}
                placeholder="Nome do Cliente ou Empresa"
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-salomao-blue outline-none"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Objeto do Contrato</label>
              <textarea 
                name="object"
                value={formData.object}
                onChange={handleChange}
                rows={4}
                placeholder="Descreva o serviço jurídico..."
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-salomao-blue outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Valor (R$)</label>
                <input 
                  type="text" 
                  name="value"
                  value={formData.value}
                  onChange={handleChange}
                  placeholder="R$ 0,00"
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-salomao-blue outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data</label>
                <input 
                  type="text" 
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-gray-50 focus:ring-2 focus:ring-salomao-blue outline-none"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-gray-100 flex justify-end">
            {formData.clientName && formData.object ? (
              <PDFDownloadLink
                document={<ProposalDocument data={formData} />}
                fileName={`Proposta_${formData.clientName.replace(/\s+/g, '_')}.pdf`}
                className="bg-salomao-blue hover:bg-blue-900 text-white px-6 py-3 rounded-lg font-bold shadow-lg flex items-center transition-all active:scale-95"
              >
                {({ loading }: { loading: boolean }) => (
                  loading ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Gerando PDF...</>
                  ) : (
                    <><Download className="w-5 h-5 mr-2" /> Baixar Proposta PDF</>
                  )
                )}
              </PDFDownloadLink>
            ) : (
              <button disabled className="bg-gray-200 text-gray-400 px-6 py-3 rounded-lg font-bold flex items-center cursor-not-allowed">
                <Printer className="w-5 h-5 mr-2" /> Preencha para Gerar
              </button>
            )}
          </div>
        </div>

        {/* Preview Visual (Simulação) */}
        <div className="bg-gray-50 p-8 rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-center h-[500px]">
           <div className="w-full max-w-sm bg-white shadow-2xl p-8 text-left text-[10px] text-gray-400 opacity-80 scale-90 origin-top h-full overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-salomao-blue"></div>
              <p className="font-bold text-salomao-blue text-sm mb-4">SALOMÃO ADVOGADOS</p>
              <p className="text-center font-bold text-black text-xs my-4">PROPOSTA DE HONORÁRIOS</p>
              <p className="mb-2">Para: <span className="text-black font-bold">{formData.clientName || 'Nome do Cliente'}</span></p>
              <p className="mb-2">Objeto: <span className="text-black">{formData.object || 'Descrição do serviço...'}</span></p>
              <p>Valor: <span className="text-black font-bold">{formData.value || 'R$ 0,00'}</span></p>
           </div>
           <p className="mt-4 text-sm text-gray-500 font-medium">Pré-visualização simplificada</p>
        </div>
      </div>
    </div>
  );
}