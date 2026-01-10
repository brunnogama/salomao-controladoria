import { NavLink, useNavigate } from 'react-router-dom';
import { menuItems } from '../config/menuConfig';
import { History, Settings, LogOut, UserCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col justify-between fixed left-0 top-0 z-50">
      {/* Logo Area */}
      <div className="p-6 flex justify-center border-b border-gray-100">
        <img 
          src="/logo-granca.png" 
          alt="Salomão Advogados" 
          className="h-12 w-auto object-contain"
        />
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-salomao-blue text-white'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-salomao-blue'
              }`
            }
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer / System Actions */}
      <div className="p-3 border-t border-gray-200 space-y-1">
        <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Sistema
        </div>
        
        <NavLink to="/historico" className="flex items-center px-4 py-2 text-sm text-gray-600 hover:text-salomao-blue rounded-md hover:bg-gray-50">
          <History className="w-4 h-4 mr-3" />
          Histórico
        </NavLink>
        
        <NavLink to="/configuracoes" className="flex items-center px-4 py-2 text-sm text-gray-600 hover:text-salomao-blue rounded-md hover:bg-gray-50">
          <Settings className="w-4 h-4 mr-3" />
          Configurações
        </NavLink>

        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between px-2">
          <div className="flex items-center">
            <UserCircle className="w-8 h-8 text-gray-400" />
            <div className="ml-2">
              <p className="text-sm font-medium text-gray-700">Dr. Usuário</p>
              <p className="text-xs text-gray-500">Sócio</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
            title="Sair do Sistema"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
