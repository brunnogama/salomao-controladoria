import { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Users, DollarSign, Kanban, Settings, LogOut, History, UserCircle, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation(); // Adicionado para verificar rota ativa se necessário
  const [userName, setUserName] = useState('Carregando...');
  const [userRole, setUserRole] = useState('Sócio');

  // Ajustado para bater com as rotas em PORTUGUÊS do App.tsx
  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/contratos', icon: Briefcase, label: 'Contratos' },
    { path: '/clientes', icon: Users, label: 'Clientes' },
    { path: '/financeiro', icon: DollarSign, label: 'Financeiro' },
    { path: '/kanban', icon: Kanban, label: 'Tarefas' },
  ];

  useEffect(() => {
    const getUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user?.email) {
        const emailName = user.email.split('@')[0];
        const formattedName = emailName
          .split('.')
          .map(part => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ');
        
        setUserName(formattedName);
      }
    };

    getUserData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <aside className="w-64 h-screen bg-salomao-blue text-white flex flex-col justify-between fixed left-0 top-0 z-50 shadow-2xl font-sans">
      {/* Logo Area */}
      <div className="h-24 flex items-center justify-center border-b border-white/5 bg-salomao-blue">
        <img 
          src="/logo-branca.png" 
          alt="Salomão Advogados" 
          className="h-10 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity"
        />
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `group relative flex items-center px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-300 ease-out ${
                isActive
                  ? 'bg-white text-salomao-blue shadow-lg translate-x-1' 
                  : 'text-blue-100/60 hover:bg-white/5 hover:text-white hover:translate-x-1'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {/* Icon */}
                <item.icon 
                  className={`w-5 h-5 mr-3 transition-colors duration-300 ${
                    isActive ? 'text-salomao-gold' : 'text-current group-hover:text-salomao-gold'
                  }`} 
                />
                
                {/* Label */}
                <span className="tracking-wide">{item.label}</span>

                {/* Elegant Active Indicator (Gold Dot) */}
                {isActive && (
                  <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-salomao-gold shadow-[0_0_8px_rgba(212,175,55,0.6)] animate-pulse" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer / System Actions */}
      <div className="p-4 border-t border-white/5 bg-salomao-blue/50 backdrop-blur-sm space-y-1">
        
        <NavLink 
          to="/historico" 
          className={({ isActive }) => 
            `flex items-center px-4 py-2.5 text-xs uppercase tracking-wider font-semibold rounded-lg transition-colors ${
              isActive ? 'text-white bg-white/10' : 'text-blue-200/50 hover:text-white hover:bg-white/5'
            }`
          }
        >
          <History className="w-4 h-4 mr-3" />
          Histórico
        </NavLink>
        
        <NavLink 
          to="/configuracoes" 
          className={({ isActive }) => 
            `flex items-center px-4 py-2.5 text-xs uppercase tracking-wider font-semibold rounded-lg transition-colors ${
              isActive ? 'text-white bg-white/10' : 'text-blue-200/50 hover:text-white hover:bg-white/5'
            }`
          }
        >
          <Settings className="w-4 h-4 mr-3" />
          Configurações
        </NavLink>

        {/* User Card Moderno */}
        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between group cursor-pointer">
          <div className="flex items-center">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-salomao-gold to-yellow-200 p-[1px]">
                <div className="w-full h-full rounded-full bg-salomao-blue flex items-center justify-center">
                  <span className="text-sm font-bold text-white">
                    {userName.charAt(0)}
                  </span>
                </div>
              </div>
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-salomao-blue rounded-full"></div>
            </div>
            
            <div className="ml-3">
              <p className="text-sm font-medium text-white group-hover:text-salomao-gold transition-colors truncate max-w-[100px]" title={userName}>
                {userName}
              </p>
              <p className="text-[10px] text-blue-200/60 uppercase tracking-widest">{userRole}</p>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="p-2 text-blue-200/40 hover:text-red-400 hover:bg-white/5 rounded-lg transition-all"
            title="Sair do Sistema"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}