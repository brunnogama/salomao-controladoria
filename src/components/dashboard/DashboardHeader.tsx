import React from 'react';
import { LayoutDashboard, Shield, Users, MapPin, Loader2, Mail } from 'lucide-react';

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
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
      <div>
        <h1 className='text-3xl font-bold text-salomao-blue flex items-center gap-2'>
          <LayoutDashboard className="w-8 h-8" /> Controladoria Jurídica
        </h1>
        <div className="flex items-center gap-2 mt-1">
          <p className='text-gray-600'>Visão estratégica de contratos e resultados.</p>
          {userRole && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border flex items-center gap-1 ${
              userRole === 'admin' 
                ? 'bg-purple-100 text-purple-700 border-purple-200' 
                : userRole === 'editor' 
                  ? 'bg-blue-100 text-blue-700 border-blue-200'
                  : 'bg-gray-100 text-gray-600 border-gray-200'
            }`}>
              <Shield className="w-3 h-3" />
              {userRole === 'admin' ? 'Administrador' : userRole === 'editor' ? 'Editor' : 'Visualizador'}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center w-full md:w-auto" id="dashboard-filters">
        {/* Filtro de Sócio */}
        <div className="relative w-full sm:w-48">
          <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <select 
            value={selectedPartner} 
            onChange={(e) => setSelectedPartner(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-salomao-blue outline-none appearance-none cursor-pointer"
          >
            <option value="">Todos os Sócios</option>
            {partnersList.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Filtro de Local */}
        <div className="relative w-full sm:w-48">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <select 
            value={selectedLocation} 
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-salomao-blue outline-none appearance-none cursor-pointer"
          >
            <option value="">Todos Locais</option>
            {locationsList.map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>

        {/* Botão Exportar */}
        <div id="export-button-container">
          <button 
            onClick={onExport} 
            disabled={exporting}
            className="flex items-center justify-center bg-salomao-blue text-white px-4 py-2 rounded-lg hover:bg-blue-900 transition-colors shadow-md disabled:opacity-70 disabled:cursor-not-allowed w-full sm:w-auto"
          >
            {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
            <span className="whitespace-nowrap">Enviar E-mail</span>
          </button>
        </div>
      </div>
    </div>
  );
}