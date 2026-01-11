// ... imports ...
import { ContractDetailsModal } from '../components/contracts/ContractDetailsModal';
import { AnalystManagerModal, Analyst } from '../components/analysts/AnalystManagerModal';

export function Contracts() {
  // ... estados existentes ...
  const [analysts, setAnalysts] = useState<Analyst[]>([]);
  
  // Novos Modals
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAnalystModalOpen, setIsAnalystModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  // ... useEffect e fetchContracts ...
  
  // Adicionar fetchAnalysts
  const fetchAnalysts = async () => {
    const { data } = await supabase.from('analysts').select('*').order('name');
    if (data) setAnalysts(data);
  };

  useEffect(() => {
    fetchContracts();
    fetchPartners();
    fetchAnalysts(); // Carregar analistas
  }, []);

  // --- NOVO FLUXO DE VISUALIZAÇÃO ---
  const handleCardClick = async (contract: Contract) => {
    setSelectedContract(contract);
    
    // Busca processos para exibir nos detalhes
    const { data: procData } = await supabase.from('contract_processes').select('*').eq('contract_id', contract.id);
    if (procData) setProcesses(procData);

    setIsDetailsOpen(true); // Abre o modal de leitura
  };

  const handleEditFromDetails = () => {
    if (!selectedContract) return;
    setIsDetailsOpen(false); // Fecha detalhes
    handleEdit(selectedContract); // Abre edição (função existente)
  };

  const handleDeleteFromDetails = () => {
    if (!selectedContract) return;
    setIsDetailsOpen(false);
    requestDelete(selectedContract, {} as any);
  };

  // ... (funções handleSave, handleEdit etc mantidas) ...

  return (
    <div className="p-8 space-y-8">
      {/* ... Header e Filtros ... */}

      {/* LISTAGEM (Alterar o onClick) */}
      <div className="grid ...">
        {filteredContracts.map((contract) => (
          <div 
            key={contract.id} 
            onClick={() => handleCardClick(contract)} // <--- CLIQUE ABRE DETALHES
            className="..."
          >
            {/* ... Conteúdo do Card ... */}
          </div>
        ))}
      </div>

      {/* --- MODALS --- */}
      
      {/* 1. Modal de Detalhes (Leitura) */}
      <ContractDetailsModal 
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        contract={selectedContract}
        onEdit={handleEditFromDetails}
        onDelete={handleDeleteFromDetails}
        processes={processes}
      />

      {/* 2. Modal de Edição (Formulário) */}
      <ContractFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        // ... props ...
        analysts={analysts} // Passar analistas
        onOpenAnalystManager={() => setIsAnalystModalOpen(true)}
      />

      {/* 3. Gerenciadores */}
      <PartnerManagerModal ... />
      <AnalystManagerModal isOpen={isAnalystModalOpen} onClose={() => setIsAnalystModalOpen(false)} onAnalystsUpdate={fetchAnalysts} />
      
      {/* ... ConfirmModal ... */}
    </div>
  );
}