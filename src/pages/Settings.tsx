import React, { useState, useEffect } from 'react';
import { 
  Users, Info, History, Save, Plus, Trash2, Edit, CheckCircle2, 
  XCircle, Shield, Code2, Database, Layout, Search, Lock, Mail, AlertTriangle, Settings as SettingsIcon,
  DollarSign, Briefcase, User
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// --- TIPOS ---
interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  active: boolean;
  last_login?: string;
}

interface ChangeLogItem {
  version: string;
  date: string;
  type: 'radical' | 'feature' | 'fix';
  title: string;
  changes: string[];
}

// --- DADOS MOCK ---
const INITIAL_CHANGELOG: ChangeLogItem[] = [
  {
    version: '0.1.06',
    date: '11/01/2026',
    type: 'feature',
    title: 'Gerenciamento de Dados',
    changes: [
      'Adicionado reset modular (exclusão por módulo).',
      'Refinamento da área de configurações do sistema.',
      'Melhoria na segurança de exclusão de dados.'
    ]
  },
  {
    version: '0.1.05',
    date: '11/01/2026',
    type: 'fix',
    title: 'Estabilização do Sistema',
    changes: [
      'Correção crítica no salvamento de Contratos (Erro PGRST204).',
      'Correção na persistência de valores financeiros (Pró-labore, Êxito).',
      'Correção no cadastro de Clientes sem CNPJ (erro de chave única).',
      'Ajuste nos cards de Clientes para permitir edição ao clicar.',
      'Correção da máscara de moeda no modal de Contratos.',
      'Implementação de upload de arquivos na fase "Sob Análise".'
    ]
  },
  {
    version: '0.10',
    date: '11/01/2026',
    type: 'feature',
    title: 'Módulo de Notificações e Financeiro',
    changes: [
      'Adicionado botão de notificações no módulo Contratos.',
      'Integração de alertas de cobrança de assinatura.',
      'Visualização de totais financeiros nos cards de contrato.',
      'Dashboard com funil de vendas e evolução financeira.'
    ]
  },
  {
    version: '0.01',
    date: '04/01/2026',
    type: 'feature',
    title: 'Lançamento Inicial (MVP)',
    changes: [
      'Estrutura base do sistema.',
      'Módulos de Contratos e Clientes.',
      'Configuração do Supabase.'
    ]
  }
];

export function Settings() {
  const [activeTab, setActiveTab] = useState<'users' | 'about' | 'changelog' | 'system'>('users');
  const [loading, setLoading] = useState(false);

  // --- ESTADOS DE USUÁRIOS ---
  const [users, setUsers] = useState<UserProfile[]>([
    { id: '1', name: 'Marcio Gama', email: 'marcio@flowmetrics.com', role: 'admin', active: true, last_login: '11/01/2026' },
    { id: '2', name: 'Analista Jurídico', email: 'analista@salomao.adv.br', role: 'editor', active: true, last_login: '10/01/2026' },
  ]);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [userForm, setUserForm] = useState({ name: '', email: '', role: 'editor', active: true });

  // --- LÓGICA DE USUÁRIOS ---
  const handleSaveUser = async () => {
    setLoading(true);
    setTimeout(() => {
        if (editingUser) {
            setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...userForm } as UserProfile : u));
        } else {
            const newUser: UserProfile = { 
                id: Math.random().toString(), 
                ...userForm, 
                role: userForm.role as any,
                last_login: '-' 
            };
            setUsers([...users, newUser]);
        }
        setLoading(false);
        setIsUserModalOpen(false);
        setEditingUser(null);
    }, 500);
  };

  const openUserModal = (user?: UserProfile) => {
      if (user) {
          setEditingUser(user);
          setUserForm({ name: user.name, email: user.email, role: user.role, active: user.active });
      } else {
          setEditingUser(null);
          setUserForm({ name: '', email: '', role: 'editor', active: true });
      }
      setIsUserModalOpen(true);
  };

  const handleDeleteUser = (id: string) => {
      if(confirm("Tem certeza que deseja remover este usuário?")) {
          setUsers(users.filter(u => u.id !== id));
      }
  };

  // --- LÓGICA DE RESET POR MÓDULO ---
  const handleModuleReset = async (module: 'contracts' | 'clients' | 'financial' | 'kanban') => {
    const labels = {
        contracts: 'CONTRATOS',
        clients: 'CLIENTES',
        financial: 'FINANCEIRO',
        kanban: 'TAREFAS'
    };
    
    const confirmation = window.prompt(`🚨 EXCLUSÃO DO MÓDULO: ${labels[module]} 🚨\n\nDigite "CONFIRMAR" para apagar todos os dados deste módulo.`);
    
    if (confirmation !== "CONFIRMAR") return alert("Ação cancelada.");

    setLoading(true);
    try {
        if (module === 'financial') {
            await supabase.from('financial_installments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        } 
        else if (module === 'kanban') {
            await supabase.from('kanban_tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        }
        else if (module === 'contracts') {
            // Apaga dependências primeiro
            await supabase.from('financial_installments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('contract_timeline').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('contract_documents').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('contract_processes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('kanban_tasks').delete().not('contract_id', 'is', null);
            // Apaga contratos
            await supabase.from('contracts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        }
        else if (module === 'clients') {
            const { error } = await supabase.from('clients').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            if (error) {
                // Erro comum de Foreign Key se houver contratos
                throw new Error("Não é possível excluir clientes que possuem contratos vinculados. Exclua os contratos primeiro.");
            }
        }

        alert(`✅ Módulo ${labels[module]} limpo com sucesso!`);
        window.location.reload();
    } catch (error: any) {
        console.error(`Erro ao limpar ${module}:`, error);
        alert(`Erro: ${error.message}`);
    } finally {
        setLoading(false);
    }
  };

  // --- LÓGICA DE RESET GLOBAL ---
  const handleFactoryReset = async () => {
    const confirmation = window.prompt("🚨 ATENÇÃO: ZONA DE PERIGO 🚨\n\nEssa ação apagará TODOS os dados do sistema.\n\nPara confirmar, digite:\nDELETAR TUDO");

    if (confirmation !== "DELETAR TUDO") return alert("Ação cancelada.");

    setLoading(true);
    try {
        await supabase.from('financial_installments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('contract_timeline').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('contract_documents').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('contract_processes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('kanban_tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('contracts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('clients').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('partners').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('analysts').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        alert("✅ Sistema resetado com sucesso!");
        window.location.reload();
    } catch (error: any) {
        alert("Erro ao resetar: " + error.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="p-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-salomao-blue">Configurações</h1>
        <p className="text-gray-500">Gerenciamento do sistema e informações.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* SIDEBAR DE NAVEGAÇÃO */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <nav className="space-y-1">
            <button 
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'users' ? 'bg-salomao-blue text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Users className="mr-3 h-5 w-5" /> Gerenciar Usuários
            </button>
            <button 
              onClick={() => setActiveTab('changelog')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'changelog' ? 'bg-salomao-blue text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <History className="mr-3 h-5 w-5" /> Histórico de Versões
            </button>
            <button 
              onClick={() => setActiveTab('about')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'about' ? 'bg-salomao-blue text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Info className="mr-3 h-5 w-5" /> Sobre o Sistema
            </button>
            <div className="pt-4 mt-4 border-t border-gray-200">
                <button 
                onClick={() => setActiveTab('system')}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'system' ? 'bg-red-50 text-red-600 shadow-sm border border-red-100' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                <SettingsIcon className="mr-3 h-5 w-5" /> Sistema
                </button>
            </div>
          </nav>
        </div>

        {/* CONTEÚDO PRINCIPAL */}
        <div className="flex-1">
          
          {/* --- ABA USUÁRIOS --- */}
          {activeTab === 'users' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-bold text-gray-800">Usuários do Sistema</h2>
                    <p className="text-sm text-gray-500">Controle de acesso e sincronização.</p>
                </div>
                <button onClick={() => openUserModal()} className="bg-salomao-blue hover:bg-blue-900 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors">
                    <Plus className="w-4 h-4 mr-2" /> Novo Usuário
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500 font-medium">
                    <tr>
                      <th className="p-4">Nome</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Perfil</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="p-4 font-medium text-gray-800 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                {user.name.charAt(0)}
                            </div>
                            {user.name}
                        </td>
                        <td className="p-4 text-gray-600">{user.email}</td>
                        <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                                user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                                {user.role}
                            </span>
                        </td>
                        <td className="p-4">
                            {user.active ? (
                                <span className="flex items-center text-green-600 text-xs font-bold"><CheckCircle2 className="w-3 h-3 mr-1" /> Ativo</span>
                            ) : (
                                <span className="flex items-center text-gray-400 text-xs font-bold"><XCircle className="w-3 h-3 mr-1" /> Inativo</span>
                            )}
                        </td>
                        <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                                <button onClick={() => openUserModal(user)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4" /></button>
                                <button onClick={() => handleDeleteUser(user.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* --- ABA SOBRE --- */}
          {activeTab === 'about' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 col-span-2 text-center">
                    <div className="w-20 h-20 bg-salomao-blue rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg transform rotate-3">
                        <span className="text-white text-3xl font-black">FM</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">FlowMetrics System</h2>
                    <p className="text-gray-500 mt-2">Versão 1.2.0 (Build 2026.01)</p>
                    <div className="mt-8 flex justify-center gap-8">
                        <div className="text-center">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Desenvolvido por</p>
                            <p className="text-lg font-bold text-salomao-blue">Marcio Gama</p>
                        </div>
                        <div className="w-px bg-gray-200"></div>
                        <div className="text-center">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Empresa</p>
                            <p className="text-lg font-bold text-salomao-gold">FlowMetrics</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Code2 className="w-5 h-5 text-blue-500" /> Tecnologias Frontend</h3>
                    <ul className="space-y-3">
                        <li className="flex items-center text-sm text-gray-600 bg-gray-50 p-2 rounded"><span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>React.js (v18)</li>
                        <li className="flex items-center text-sm text-gray-600 bg-gray-50 p-2 rounded"><span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>TypeScript</li>
                        <li className="flex items-center text-sm text-gray-600 bg-gray-50 p-2 rounded"><span className="w-2 h-2 bg-teal-400 rounded-full mr-3"></span>Tailwind CSS</li>
                        <li className="flex items-center text-sm text-gray-600 bg-gray-50 p-2 rounded"><span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>Vite Build Tool</li>
                    </ul>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Database className="w-5 h-5 text-green-500" /> Backend & Infra</h3>
                    <ul className="space-y-3">
                        <li className="flex items-center text-sm text-gray-600 bg-gray-50 p-2 rounded"><span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>Supabase (PostgreSQL)</li>
                        <li className="flex items-center text-sm text-gray-600 bg-gray-50 p-2 rounded"><span className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></span>Row Level Security (RLS)</li>
                        <li className="flex items-center text-sm text-gray-600 bg-gray-50 p-2 rounded"><span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>Supabase Auth</li>
                        <li className="flex items-center text-sm text-gray-600 bg-gray-50 p-2 rounded"><span className="w-2 h-2 bg-gray-500 rounded-full mr-3"></span>Storage Buckets</li>
                    </ul>
                </div>
            </div>
          )}

          {/* --- ABA CHANGELOG --- */}
          {activeTab === 'changelog' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="border-l-2 border-gray-100 ml-3 space-y-10">
                    {INITIAL_CHANGELOG.map((log, idx) => (
                        <div key={idx} className="relative pl-8">
                            <div className={`absolute -left-[11px] top-0 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center
                                ${log.type === 'radical' ? 'bg-red-500' : log.type === 'feature' ? 'bg-blue-500' : 'bg-green-500'}
                            `}></div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                                <h3 className="text-xl font-bold text-gray-800">{log.version}</h3>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border
                                    ${log.type === 'radical' ? 'bg-red-50 text-red-700 border-red-200' : 
                                      log.type === 'feature' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                                      'bg-green-50 text-green-700 border-green-200'}
                                `}>
                                    {log.type === 'radical' ? 'Mudança Radical' : log.type === 'feature' ? 'Nova Funcionalidade' : 'Correção de Bugs'}
                                </span>
                                <span className="text-sm text-gray-400">{log.date}</span>
                            </div>
                            <h4 className="text-md font-semibold text-gray-700 mb-3">{log.title}</h4>
                            <ul className="space-y-2">
                                {log.changes.map((change, cIdx) => (
                                    <li key={cIdx} className="text-sm text-gray-600 flex items-start">
                                        <span className="mr-2 text-gray-400">•</span>
                                        {change}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
          )}

          {/* --- ABA SISTEMA (RESET) --- */}
          {activeTab === 'system' && (
            <div className="space-y-6">
                
                {/* RESET MODULAR */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-lg font-bold text-gray-800">Reset Modular</h2>
                        <p className="text-sm text-gray-500">Limpeza seletiva de dados por módulo.</p>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <button onClick={() => handleModuleReset('financial')} className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-red-200 hover:bg-red-50 transition-colors group">
                            <div className="p-3 bg-gray-100 rounded-full text-gray-500 group-hover:text-red-500 group-hover:bg-white mb-3">
                                <DollarSign className="w-6 h-6" />
                            </div>
                            <span className="text-sm font-bold text-gray-700 group-hover:text-red-700">Limpar Financeiro</span>
                            <span className="text-xs text-gray-400 mt-1">Apenas parcelas</span>
                        </button>

                        <button onClick={() => handleModuleReset('kanban')} className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-red-200 hover:bg-red-50 transition-colors group">
                            <div className="p-3 bg-gray-100 rounded-full text-gray-500 group-hover:text-red-500 group-hover:bg-white mb-3">
                                <Layout className="w-6 h-6" />
                            </div>
                            <span className="text-sm font-bold text-gray-700 group-hover:text-red-700">Limpar Tarefas</span>
                            <span className="text-xs text-gray-400 mt-1">Todas do Kanban</span>
                        </button>

                        <button onClick={() => handleModuleReset('contracts')} className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-red-200 hover:bg-red-50 transition-colors group">
                            <div className="p-3 bg-gray-100 rounded-full text-gray-500 group-hover:text-red-500 group-hover:bg-white mb-3">
                                <Briefcase className="w-6 h-6" />
                            </div>
                            <span className="text-sm font-bold text-gray-700 group-hover:text-red-700">Limpar Contratos</span>
                            <span className="text-xs text-center text-gray-400 mt-1">+ Docs, Timeline e Parcelas</span>
                        </button>

                        <button onClick={() => handleModuleReset('clients')} className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-red-200 hover:bg-red-50 transition-colors group">
                            <div className="p-3 bg-gray-100 rounded-full text-gray-500 group-hover:text-red-500 group-hover:bg-white mb-3">
                                <Users className="w-6 h-6" />
                            </div>
                            <span className="text-sm font-bold text-gray-700 group-hover:text-red-700">Limpar Clientes</span>
                            <span className="text-xs text-center text-gray-400 mt-1">Apenas sem vínculo</span>
                        </button>
                    </div>
                </div>

                {/* ZONA DE PERIGO */}
                <div className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden">
                    <div className="p-6 bg-red-50 border-b border-red-100 flex items-start gap-4">
                        <div className="p-3 bg-red-100 rounded-full text-red-600">
                            <AlertTriangle className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-red-800">Zona de Perigo</h2>
                            <p className="text-sm text-red-600 mt-1">
                                Ações nesta área são destrutivas e irreversíveis. Prossiga com extrema cautela.
                            </p>
                        </div>
                    </div>
                    <div className="p-8">
                        <div className="border border-red-100 rounded-lg p-6 flex flex-col sm:flex-row justify-between items-center gap-6 bg-white hover:bg-red-50/30 transition-colors">
                            <div>
                                <h3 className="font-bold text-gray-800">Reset de Fábrica (Wipe Data)</h3>
                                <p className="text-sm text-gray-500 mt-1 max-w-xl">
                                    Esta ação irá <strong>excluir permanentemente</strong> todos os contratos, clientes, sócios, analistas, arquivos e dados financeiros do banco de dados. 
                                    O sistema retornará ao estado de instalação inicial (vazio).
                                </p>
                            </div>
                            <button 
                                onClick={handleFactoryReset}
                                disabled={loading}
                                className="bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-lg font-bold shadow-lg flex items-center whitespace-nowrap transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? <SettingsIcon className="w-5 h-5 animate-spin mr-2" /> : <Trash2 className="w-5 h-5 mr-2" />}
                                RESETAR TUDO
                            </button>
                        </div>
                    </div>
                </div>
            </div>
          )}

        </div>
      </div>

      {/* MODAL DE USUÁRIO */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h3>
                    <button onClick={() => setIsUserModalOpen(false)}><XCircle className="w-6 h-6 text-gray-400" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome Completo</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input type="text" className="w-full pl-9 border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-salomao-blue outline-none" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email de Acesso</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input type="email" className="w-full pl-9 border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-salomao-blue outline-none" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nível de Acesso</label>
                            <div className="relative">
                                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <select className="w-full pl-9 border border-gray-300 rounded-lg p-2.5 text-sm bg-white outline-none" value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})}>
                                    <option value="admin">Administrador</option>
                                    <option value="editor">Editor</option>
                                    <option value="viewer">Visualizador</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                            <div className="flex items-center h-[42px]">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={userForm.active} onChange={e => setUserForm({...userForm, active: e.target.checked})} />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-salomao-blue"></div>
                                    <span className="ml-3 text-sm font-medium text-gray-700">{userForm.active ? 'Ativo' : 'Inativo'}</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    {!editingUser && (
                        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 flex gap-2">
                            <Lock className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-yellow-700">O usuário receberá um email para definir a senha no primeiro acesso.</p>
                        </div>
                    )}
                </div>
                <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                    <button onClick={() => setIsUserModalOpen(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium">Cancelar</button>
                    <button onClick={handleSaveUser} disabled={loading} className="px-4 py-2 bg-salomao-blue text-white rounded-lg hover:bg-blue-900 text-sm font-medium flex items-center shadow-md">
                        {loading ? 'Salvando...' : <><Save className="w-4 h-4 mr-2" /> Salvar Usuário</>}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}