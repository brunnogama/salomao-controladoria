import React from 'react';
import { LayoutDashboard, Shield, Users, MapPin, Loader2, Mail, ChevronDown } from 'lucide-react';

interface DashboardHeaderProps {
  userRole: 'admin' | 'editor' | 'viewer' | null;
  selectedPartner: string;
  setSelectedPartner: (val: string) => void;
  partnersList: { id: string, name: string }[];
  selectedLocation: string;
  setSelectedLocation: (val: string) => void;
  locationsList: string[];
  exporting: boolean;
  onExport: () => void;
}

export function DashboardHeader({
  userRole,
  selectedPartner,
  setSelectedPartner,
  partnersList,
  selectedLocation,
  setSelectedLocation,
  locationsList,
  exporting,
  onExport
}: DashboardHeaderProps) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all p-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        
        {/* Título e Subtítulo */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#112240] to-[#1e3a8a] text-white shadow-lg">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-[30px] font-black text-[#0a192f] tracking-tight">
                Controladoria Jurídica
              </h1>
              {/* Badge de Role */}
              {userRole && (
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                  userRole === 'admin' 
                    ? 'bg-purple-50 text-purple-700 border-purple-100' 
                    : userRole === 'editor' 
                      ? 'bg-blue-50 text-blue-700 border-blue-100'
                      : 'bg-gray-50 text-gray-600 border-gray-100'
                }`}>
                  <Shield className="w-3 h-3" />
                  {userRole === 'admin' ? 'Admin' : userRole === 'editor' ? 'Editor' : 'Viewer'}
                </div>
              )}
            </div>
          </div>
          <p className="text-sm font-semibold text-gray-500 ml-[52px]">
            Visão estratégica de contratos e resultados
          </p>
        </div>

        {/* Filtros e Botão de Exportar */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          
          {/* Filtro de Sócio */}
          <div className="relative min-w-[200px]" id="dashboard-filters">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
            <select
              value={selectedPartner}
              onChange={(e) => setSelectedPartner(e.target.value)}
              className="w-full pl-9 pr-10 py-2.5 bg-gray-100/50 border border-gray-200 rounded-xl text-sm font-semibold outline-none appearance-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer text-gray-700 shadow-sm"
            >
              <option value="">Todos os Sócios</option>
              {partnersList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
          </div>

          {/* Filtro de Localização */}
          <div className="relative min-w-[200px]" id="dashboard-filters">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full pl-9 pr-10 py-2.5 bg-gray-100/50 border border-gray-200 rounded-xl text-sm font-semibold outline-none appearance-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer text-gray-700 shadow-sm"
            >
              <option value="">Todos os Locais</option>
              {locationsList.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
          </div>

          {/* Botão de Exportar */}
          <div id="export-button-container">
            <button
              onClick={onExport}
              disabled={exporting}
              className="flex items-center gap-2 px-8 py-2.5 bg-[#1e3a8a] text-white text-[9px] font-black rounded-xl hover:bg-[#112240] shadow-lg transition-all active:scale-95 uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <Mail className="w-3.5 h-3.5" />
                  Enviar E-mail
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}