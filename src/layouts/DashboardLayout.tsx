import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Menu } from 'lucide-react';

export function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      
      {/* Header Mobile - Visível apenas em telas pequenas */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 h-16 flex items-center shadow-sm">
          <button 
            onClick={() => setIsSidebarOpen(true)} 
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100 text-salomao-blue transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="ml-3 font-bold text-gray-800 text-lg">Salomão Advogados</span>
      </div>

      {/* Sidebar com controle de estado */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Conteúdo Principal com padding ajustado para o header mobile */}
      <main className="flex-1 p-8 pt-24 md:pt-8 md:ml-64 transition-all duration-300">
        <Outlet />
      </main>
    </div>
  );
}