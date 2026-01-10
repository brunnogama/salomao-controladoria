import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { menuItems } from '../config/menuConfig';
import { History, Settings, LogOut, UserCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function Sidebar() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('Carregando...');
  const [userRole, setUserRole] = useState('Advogado');

  // Busca os dados do usuário logado ao carregar o componente
  useEffect(() => {
    const getUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user?.email) {
        // Lógica para extrair "Nome Sobrenome" do email "nome.sobrenome@dominio.com"
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
    <aside className="w-64 h-screen bg-salomao-blue text-white flex flex-col justify-between fixed left-0 top-0 z-50 shadow-xl">
      {/* Logo Area */}
      <div className="p-6 flex justify-center border-b border-white/10">
        <img 
          src="/logo-branca.png" 
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
              `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-white text-salomao-blue shadow-md' // Item ativo (Fundo branco, texto azul)
                  : 'text-gray-300 hover:bg-white/10 hover:text-white' // Item inativo
              }`
            }
          >
            <item.icon className={`w-5 h-5 mr-3`} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer / System Actions */}
      <div className="p-3 border-t border-white/10 space-y-1">
        <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Sistema
        </div>
        
        <NavLink to="/historico" className="flex items-center px-4 py-2 text-sm text-gray-300 hover:text-white rounded-md hover:bg-white/10 transition-colors">
          <History className="w-4 h-4 mr-3" />
          Histórico
        </NavLink>
        
        <NavLink to="/configuracoes" className="flex items-center px-4 py-2 text-sm text-gray-300 hover:text-white rounded-md hover:bg-white/10 transition-colors">
          <Settings className="w-4 h-4 mr-3" />
          Configurações
        </NavLink>

        {/* User Card */}
        <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between px-2">
          <div className="flex items-center">
            <div className="bg-white/10 p-2 rounded-full">
              <UserCircle className="w-6 h-6 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white truncate max-w-[110px]" title={userName}>
                {userName}
              </p>
              <p className="text-xs text-gray-400">{userRole}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-white/5 rounded-md transition-colors"
            title="Sair do Sistema"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
