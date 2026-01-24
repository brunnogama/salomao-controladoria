import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { FolderOpen, FileText, Download, Search, HardDrive, Clock, FileCheck, Hash } from 'lucide-react';
import { maskHon } from '../utils/masks';
import { EmptyState } from '../components/ui/EmptyState';

interface GEDDocument {
  id: string;
  file_name: string;
  file_path: string;
  file_type: 'proposal' | 'contract';
  file_size?: number;
  uploaded_at: string;
  hon_number_ref?: string;
  contract: {
    id: string;
    seq_id?: number; // Campo do banco
    status: string;
    display_id?: string; // Formatado para UI
    clients: {
        name: string;
    } | null;
  };
  client_name: string;
}

export function GED() {
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<GEDDocument[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Ref para o container principal de arquivos
  const mainContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Efeito para rolar para o topo quando a pasta (ou busca) mudar
  useEffect(() => {
    if (mainContentRef.current) {
        // Força o scroll para o topo instantaneamente
        mainContentRef.current.scrollTop = 0;
    }
  }, [selectedFolder, searchTerm]);

  const fetchDocuments = async () => {
    setLoading(true);

    // 1. Buscamos os documentos do banco trazendo o seq_id do contrato
    const { data, error } = await supabase
      .from('contract_documents')
      .select(`
        *,
        contract:contracts (
          id,
          seq_id,
          status,
          clients (name)
        )
      `)
      .order('uploaded_at', { ascending: false });

    if (!error && data) {
      let formattedDocs: GEDDocument[] = data.map((doc: any) => ({
        ...doc,
        client_name: doc.contract?.clients?.name || 'Sem Cliente',
        contract: {
            ...doc.contract,
            // Gera o ID visual baseado no seq_id do banco
            display_id: doc.contract?.seq_id ? String(doc.contract.seq_id).padStart(6, '0') : '-'
        }
      }));

      // 2. Recuperar metadados (tamanho) do Storage se não existir no banco
      // Agrupamos por contract_id (pasta no storage) para evitar chamadas excessivas
      const uniqueContractIds = Array.from(new Set(formattedDocs.map(d => d.contract?.id).filter(Boolean)));
      
      const sizesMap = new Map<string, number>();

      // Buscamos a lista de arquivos de cada pasta de contrato para pegar o metadata.size
      await Promise.all(uniqueContractIds.map(async (contractId) => {
        // Assume bucket 'contract-documents' baseado na lógica de upload
        const { data: files } = await supabase.storage.from('contract-documents').list(contractId);
        
        if (files) {
            files.forEach(f => {
                // O path no banco é "contract_id/nome_do_arquivo"
                const fullPath = `${contractId}/${f.name}`;
                if (f.metadata && f.metadata.size) {
                    sizesMap.set(fullPath, f.metadata.size);
                }
            });
        }
      }));

      // 3. Mesclar tamanhos recuperados
      formattedDocs = formattedDocs.map(doc => ({
          ...doc,
          file_size: doc.file_size || sizesMap.get(doc.file_path) || 0
      }));

      setDocuments(formattedDocs);

      // Extrair lista única de clientes (pastas)
      const uniqueClients = Array.from(new Set(formattedDocs.map((d: any) => d.client_name))) as string[];
      setFolders(uniqueClients.sort());
    }
    setLoading(false);
  };

  const handleDownload = async (path: string) => {
    // Tenta baixar do bucket correto. Se 'ged' falhar, tenta 'contract-documents'
    let { data } = await supabase.storage.from('contract-documents').createSignedUrl(path, 60);
    
    if (!data?.signedUrl) {
         // Fallback para bucket 'ged' caso seja legado
         const res = await supabase.storage.from('ged').createSignedUrl(path, 60);
         data = res.data;
    }

    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank');
    } else {
        alert('Erro ao gerar link de download. Arquivo não encontrado no Storage.');
    }
  };

  // Função para formatar bytes
  const formatBytes = (bytes: number, decimals = 2) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Filtragem
  const filteredDocs = documents.filter(doc => {
    const matchesFolder = selectedFolder ? doc.client_name === selectedFolder : true;
    const matchesSearch = searchTerm 
      ? doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        doc.hon_number_ref?.includes(searchTerm) ||
        doc.contract?.display_id?.includes(searchTerm)
      : true;
    return matchesFolder && matchesSearch;
  });

  // Cálculo do tamanho total
  const totalSize = filteredDocs.reduce((acc, doc) => acc + (doc.file_size || 0), 0);

  return (
    <div className="p-8 h-full flex flex-col animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-salomao-blue flex items-center gap-2">
            <FolderOpen className="w-8 h-8" /> GED - Gestão Eletrônica
          </h1>
          <p className="text-gray-500 mt-1">Repositório centralizado de contratos e propostas.</p>
        </div>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        
        {/* SIDEBAR: DIRETÓRIOS (CLIENTES) */}
        <div className="w-64 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-xs font-bold text-gray-500 uppercase flex items-center">
              <HardDrive className="w-4 h-4 mr-2" /> Diretórios
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <button
              onClick={() => setSelectedFolder(null)}
              className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${!selectedFolder ? 'bg-salomao-blue text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              {/* Ícone fixo com shrink-0 para não deformar */}
              <FolderOpen className="w-4 h-4 mr-2 shrink-0" />
              Todos os Arquivos
            </button>
            {folders.map(folder => (
              <button
                key={folder}
                onClick={() => setSelectedFolder(folder)}
                className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${selectedFolder === folder ? 'bg-salomao-blue text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                {/* Ícone fixo com shrink-0 */}
                <FolderOpen className={`w-4 h-4 mr-2 shrink-0 ${selectedFolder === folder ? 'text-white' : 'text-salomao-gold'}`} />
                <span className="truncate text-left">{folder}</span>
              </button>
            ))}
          </div>
        </div>

        {/* MAIN: ARQUIVOS */}
        <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-700 flex items-center">
              {selectedFolder ? <><FolderOpen className="w-5 h-5 mr-2 text-salomao-gold shrink-0" /> {selectedFolder}</> : 'Todos os Documentos'}
              <span className="ml-2 bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">{filteredDocs.length}</span>
              {/* Exibição do tamanho total formatado */}
              <span className="ml-2 text-xs text-gray-400 font-normal">({formatBytes(totalSize)})</span>
            </h3>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Buscar arquivo, ID ou HON..." 
                className="w-full pl-9 pr-4 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-salomao-blue"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* File Grid */}
          <div ref={mainContentRef} className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="text-center py-10 text-gray-400">Carregando documentos...</div>
            ) : filteredDocs.length === 0 ? (
               // --- INICIO DO EMPTY STATE ---
               <EmptyState 
                  icon={FolderOpen}
                  title="Nenhum arquivo encontrado"
                  description={
                      searchTerm 
                      ? "Não encontramos arquivos com este nome. Tente outra busca." 
                      : selectedFolder 
                        ? "Esta pasta está vazia." 
                        : "O GED ainda não possui documentos. Adicione contratos para vê-los aqui."
                  }
                  className="h-full justify-center"
               />
               // --- FIM DO EMPTY STATE ---
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredDocs.map((doc) => (
                  <div key={doc.id} className="group relative bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-blue-200 transition-all">
                    
                    {/* Header: Icon & Type */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="bg-red-50 text-red-600 p-2.5 rounded-lg">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {doc.file_type === 'contract' ? (
                            <span className="bg-green-50 text-green-700 text-[10px] uppercase font-bold px-2 py-1 rounded border border-green-100 flex items-center">
                            <FileCheck className="w-3 h-3 mr-1" /> Contrato
                            </span>
                        ) : (
                            <span className="bg-blue-50 text-blue-700 text-[10px] uppercase font-bold px-2 py-1 rounded border border-blue-100">
                            Proposta
                            </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="mb-4">
                      <h4 className="text-sm font-bold text-gray-800 truncate mb-1" title={doc.file_name}>
                        {doc.file_name}
                      </h4>
                      <p className="text-xs text-gray-500 truncate">{doc.client_name}</p>
                    </div>

                    {/* Footer Info */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px] text-gray-400">
                        <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {new Date(doc.uploaded_at).toLocaleDateString('pt-BR')}</span>
                        {/* Exibe o tamanho individual do arquivo */}
                        <span>{formatBytes(doc.file_size || 0)}</span>
                      </div>
                      
                      <div className="flex gap-2">
                        {doc.contract?.display_id && (
                             <div className="bg-blue-50 border border-blue-100 rounded px-2 py-1 text-[10px] font-mono text-blue-600 truncate flex items-center">
                                <Hash className="w-3 h-3 mr-1" /> {doc.contract.display_id}
                             </div>
                        )}
                        {doc.hon_number_ref && (
                            <div className="bg-gray-50 border border-gray-100 rounded px-2 py-1 text-[10px] font-mono text-gray-600 truncate">
                            HON: {maskHon(doc.hon_number_ref)}
                            </div>
                        )}
                      </div>
                    </div>

                    {/* Action: Download (Overlay) */}
                    <div className="absolute inset-0 bg-salomao-blue/90 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                      <button 
                        onClick={() => handleDownload(doc.file_path)}
                        className="bg-white text-salomao-blue px-4 py-2 rounded-lg font-bold text-sm shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform flex items-center"
                      >
                        <Download className="w-4 h-4 mr-2" /> Baixar PDF
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}