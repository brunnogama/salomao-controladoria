import { Search, FileSpreadsheet, List as ListIcon, LayoutGrid, ArrowDownAZ, Calendar } from 'lucide-react';
import { Partner } from '../../types';

interface Props {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  partnerFilter: string;
  setPartnerFilter: (v: string) => void;
  partners: Partner[];
  sortOrder: 'name' | 'date';
  setSortOrder: (v: 'name' | 'date') => void;
  viewMode: 'list' | 'card';
  setViewMode: (v: 'list' | 'card') => void;
  onExport: () => void;
}

export function ContractFilters({
  searchTerm, setSearchTerm, statusFilter, setStatusFilter,
  partnerFilter, setPartnerFilter, partners, sortOrder, setSortOrder,
  viewMode, setViewMode, onExport
}: Props) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
      <div className="flex flex-1 gap-3 w-full">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" placeholder="Buscar por cliente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-salomao-blue outline-none"
          />
        </div>
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-salomao-blue" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Todos Status</option>
          <option value="analysis">Sob Análise</option>
          <option value="proposal">Proposta Enviada</option>
          <option value="active">Contrato Fechado</option>
          <option value="rejected">Rejeitado</option>
        </select>
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-salomao-blue" value={partnerFilter} onChange={(e) => setPartnerFilter(e.target.value)}>
          <option value="">Todos Sócios</option>
          {partners.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
        </select>
      </div>
      <div className="flex items-center gap-3 border-l pl-4 border-gray-200">
         <div className="flex bg-gray-100 rounded-lg p-1 mr-2">
          <button onClick={() => setSortOrder('name')} className={`p-1.5 rounded flex items-center gap-1 text-xs font-medium transition-all ${sortOrder === 'name' ? 'bg-white shadow text-salomao-blue' : 'text-gray-400'}`}><ArrowDownAZ className="w-4 h-4" /> Nome</button>
          <button onClick={() => setSortOrder('date')} className={`p-1.5 rounded flex items-center gap-1 text-xs font-medium transition-all ${sortOrder === 'date' ? 'bg-white shadow text-salomao-blue' : 'text-gray-400'}`}><Calendar className="w-4 h-4" /> Data</button>
         </div>
        <button onClick={onExport} className="text-green-600 hover:bg-green-50 p-2 rounded-lg transition-colors"><FileSpreadsheet className="w-5 h-5" /></button>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow text-salomao-blue' : 'text-gray-400'}`}><ListIcon className="w-5 h-5" /></button>
          <button onClick={() => setViewMode('card')} className={`p-1.5 rounded ${viewMode === 'card' ? 'bg-white shadow text-salomao-blue' : 'text-gray-400'}`}><LayoutGrid className="w-5 h-5" /></button>
        </div>
      </div>
    </div>
  );
}