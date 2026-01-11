import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Users, DollarSign, Kanban, Settings, LogOut } from 'lucide-react';

export function Sidebar() {
  const location = useLocation();

  // CORREÇÃO: As rotas aqui devem bater com o path definido no App.tsx
  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/contratos', icon: Briefcase, label: 'Contratos' },
    { path: '/clientes', icon: Users, label: 'Clientes' },
    { path: '/financeiro', icon: DollarSign, label: 'Financeiro' },
    { path: '/kanban', icon: Kanban, label: 'Tarefas' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#0F2C4C] text-white shadow-xl z-50 flex flex-col transition-all duration-300">
      {/* Header / Logo */}
      <div className="p-6 border-b border-white/10 flex items-center gap-3">
        <div className="w-10 h-10 bg-salomao-gold rounded-lg flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-all duration-300">
          <span className="text-[#0F2C4C] font-black text-xl">S</span>
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight tracking-wide">Salomão</h1>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">Controladoria</p>
        </div>
      </div>

      {/* Menu Principal */}
      <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
        <p className="px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Principal</p>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                isActive 
                  ? 'bg-white/10 text-white shadow-md font-medium' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-salomao-gold rounded-r-full" />
              )}
              <item.icon className={`w-5 h-5 mr-3 transition-colors ${isActive ? 'text-salomao-gold' : 'text-gray-500 group-hover:text-gray-300'}`} />
              <span className="relative z-10">{item.label}</span>
            </NavLink>
          );
        })}

        <div className="pt-4 mt-4 border-t border-white/10">
          <p className="px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Sistema</p>
          
          {/* LINK CORRIGIDO PARA /configuracoes */}
          <NavLink
            to="/configuracoes"
            className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${
              location.pathname === '/configuracoes' 
                ? 'bg-white/10 text-white shadow-md font-medium' 
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
             {location.pathname === '/configuracoes' && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-salomao-gold rounded-r-full" />
              )}
            <Settings className={`w-5 h-5 mr-3 transition-colors ${location.pathname === '/configuracoes' ? 'text-salomao-gold' : 'text-gray-500 group-hover:text-gray-300'}`} />
            <span className="relative z-10">Configurações</span>
          </NavLink>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <button className="flex items-center w-full px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">
          <LogOut className="w-5 h-5 mr-3" />
          Sair
        </button>
        <p className="text-[10px] text-center text-gray-600 mt-4">v1.2.0 • FlowMetrics</p>
      </div>
    </aside>
  );
}