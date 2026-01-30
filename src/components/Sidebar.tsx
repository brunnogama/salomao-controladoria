import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  FileSignature, 
  DollarSign, 
  BarChart3, 
  ShieldCheck, 
  Users, 
  KanbanSquare, 
  FolderOpen,
  History,
  Settings,
  LogOut,
  Share2,
  X 
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('Carregando...');
  const [userRole, setUserRole] = useState('');

  const menuItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Casos', path: '/contratos', icon: FileSignature },
    { label: 'Propostas', path: '/propostas', icon: FileText },
    { label: 'Financeiro', path: '/financeiro', icon: DollarSign },
    { label: 'Jurimetria', path: '/jurimetria', icon: Share2 },
    { label: 'Volumetria', path: '/volumetria', icon: BarChart3 },
    { label: 'Compliance', path: '/compliance', icon: ShieldCheck },
    { label: 'Clientes', path: '/clientes', icon: Users },
    { label: 'Kanban', path: '/kanban', icon: KanbanSquare },
    { label: 'GED', path: '/ged', icon: FolderOpen },
  ];

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, role')
            .eq('id', user.id)
            .single();

          if (profile) {
            if (profile.name) {
                setUserName(profile.name);
            } else if (user.email) {
                const emailName = user.email.split('@')[0];
                const formattedName = emailName
                  .split('.')
                  .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                  .join(' ');
                setUserName(formattedName);
            }

            const roleLabels: Record<string, string> = {
                admin: 'Administrador',
                editor: 'Editor',
                viewer: 'Visualizador'
            };
            setUserRole(roleLabels[profile.role] || 'Usuário');
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        setUserName('Usuário');
      }
    };

    fetchUserProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <>
      {/* Backdrop Escuro (Apenas Mobile) */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
          onClick={onClose}
        />
      )}

      {/* Sidebar - Cores do Design System */}
      <aside className={`
        fixed top-0 left-0 z-50 h-screen w-64 bg-[#112240] text-gray-100 flex flex-col font-sans border-r border-[#0a192f] shadow-2xl
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0
      `}>
        
        {/* Botão Fechar (Apenas Mobile) */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors md:hidden rounded-lg hover:bg-white/5"
        >
          <X className="w-6 h-6" />
        </button>

        {/* 1. HEADER LOGO */}
        <div className="flex flex-col flex-shrink-0 relative bg-gradient-to-b from-[#0a192f] to-[#112240] pt-6 pb-4 px-6 border-b border-white/5">
          <div className="flex flex-col items-center w-full gap-4">
            <img 
              src="/logo-branca.png" 
              alt="Salomão Advogados" 
              className="h-11 w-auto object-contain block"
            />
            <div className="bg-[#1e3a8a]/30 border border-[#1e3a8a]/50 rounded-xl px-4 py-2 w-full backdrop-blur-sm">
              <span className="text-[9px] text-white font-black tracking-[0.25em] uppercase leading-none whitespace-nowrap block text-center">
                Módulo Controladoria
              </span>
            </div>
          </div>
        </div>

        {/* 2. MENU PRINCIPAL */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `w-full flex items-center px-4 py-3 rounded-xl transition-all group ${
                  isActive
                    ? 'bg-[#1e3a8a] text-white font-bold shadow-lg border-l-4 border-[#d4af37]' 
                    : 'text-gray-300 hover:bg-white/5 hover:text-white border-l-4 border-transparent hover:border-[#1e3a8a]/50'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon 
                    className={`h-5 w-5 mr-3 transition-colors flex-shrink-0 ${
                      isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
                    }`} 
                  />
                  <span className="text-sm font-semibold tracking-tight">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* 3. MENU BASE */}
        <div className="pt-4 pb-6 px-3 bg-gradient-to-t from-[#0a192f] to-[#112240] flex-shrink-0 mt-auto border-t border-white/5">
          
          <NavLink 
            to="/historico" 
            onClick={onClose}
            className={({ isActive }) => 
              `w-full flex items-center px-4 py-3 rounded-xl transition-all group mb-2 ${
                isActive 
                  ? 'bg-[#1e3a8a] text-white font-bold' 
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <History className="h-5 w-5 mr-3 text-gray-400 group-hover:text-white flex-shrink-0 transition-colors" />
            <span className="text-sm font-semibold tracking-tight">Histórico</span>
          </NavLink>
          
          <NavLink 
            to="/configuracoes" 
            onClick={onClose}
            className={({ isActive }) => 
              `w-full flex items-center px-4 py-3 rounded-xl transition-all group ${
                isActive 
                  ? 'bg-[#1e3a8a] text-white font-bold' 
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Settings className="h-5 w-5 mr-3 text-gray-400 group-hover:text-white flex-shrink-0 transition-colors" />
            <span className="text-sm font-semibold tracking-tight">Configurações</span>
          </NavLink>

          {/* User Profile - Redesenhado */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all group cursor-pointer">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Avatar com gradiente gold */}
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#d4af37] to-amber-600 p-[2px]">
                    <div className="w-full h-full rounded-[10px] bg-[#112240] flex items-center justify-center">
                      <span className="text-sm font-black text-white">
                        {userName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-[#112240] rounded-full"></div>
                </div>
                
                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white group-hover:text-white transition-colors truncate" title={userName}>
                    {userName}
                  </p>
                  <p className="text-[9px] text-gray-400 uppercase tracking-[0.15em] font-black">
                    {userRole}
                  </p>
                </div>
              </div>
              
              {/* Logout Button */}
              <button 
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all flex-shrink-0"
                title="Sair do Sistema"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}