import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User, Lock, ArrowRight } from 'lucide-react';

export function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const email = `${username}@salomaoadv.com.br`;

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      navigate('/dashboard');
    } catch (err: any) {
      setError('Credenciais inválidas. Verifique e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden">
      {/* Lado Esquerdo - Formulário */}
      <div className="w-full lg:w-[40%] flex flex-col justify-center items-center p-8 sm:p-12 lg:p-16 relative">
        <div className="w-full max-w-md space-y-8">
          
          <div className="text-center mb-10">
            <img 
              src="/logo-salomao.png" 
              alt="Salomão Advogados" 
              className="h-16 mx-auto mb-4 object-contain" 
            />
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                Usuário Corporativo
              </label>
              <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-salomao-blue">
                <div className="pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block flex-1 border-0 bg-transparent py-3 pl-2 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                  placeholder="nome.sobrenome"
                  required
                />
                {/* Removido border-l e border-gray-200 daqui */}
                <span className="flex select-none items-center pr-3 text-gray-500 sm:text-sm bg-gray-50 px-3">
                  @salomaoadv.com.br
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                Senha
              </label>
              <div className="relative rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-salomao-blue">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-md border-0 bg-transparent py-3 pl-10 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center items-center rounded-md bg-salomao-blue px-3 py-3 text-sm font-semibold text-white hover:bg-[#0B2138] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salomao-blue transition-all duration-200 uppercase tracking-wider"
            >
              {loading ? 'Acessando...' : 'Acessar Sistema'}
              {!loading && <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <p className="absolute bottom-6 left-0 w-full text-center text-[10px] text-gray-400 tracking-widest uppercase">
            © 2026 Salomão Advogados • v2.5.0
          </p>
        </div>
      </div>

      {/* Lado Direito - Branding */}
      <div className="hidden lg:flex w-[60%] bg-salomao-dark relative overflow-hidden items-center">
        {/* Overlay de imagem de livros */}
        <div 
          className="absolute inset-0 z-0 opacity-10 mix-blend-overlay"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1505664194779-8beaceb93744?q=80&w=2070&auto=format&fit=crop")',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        
        <div className="relative z-10 px-20 max-w-2xl">
          <div className="inline-flex items-center justify-center p-3 border border-white/20 rounded-full mb-8 backdrop-blur-sm">
            <ArrowRight className="text-salomao-gold w-5 h-5" />
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
            Controladoria Jurídica <br/>
            <span className="text-white">Estratégica</span>
          </h1>
          
          {/* Linha Dourada */}
          <div className="w-16 h-1 bg-salomao-gold mb-8"></div>
          
          <p className="text-gray-300 text-lg font-light leading-relaxed">
            Gestão inteligente de processos e contratos. A tecnologia garantindo a segurança e eficiência do <strong className="text-white font-semibold">Salomão Advogados</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
