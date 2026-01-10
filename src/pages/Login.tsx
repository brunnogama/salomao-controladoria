import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User, Lock, ArrowRight, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';

export function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState(''); // Alterado de email para username
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Reconstrói o e-mail completo para autenticação
      const email = `${username}@salomaoadv.com.br`;

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      navigate('/dashboard');
    } catch (err: any) {
      setError('Credenciais inválidas. Verifique seu usuário e senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans">
      
      {/* LADO ESQUERDO: FORMULÁRIO */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-white sm:p-12 lg:p-16 relative z-10">
        
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
          
          {/* LOGO SALOMÃO */}
          <div className="flex justify-center mb-10">
             <img 
               src="/logo-salomao.png" 
               alt="Salomão Advogados" 
               className="h-24 object-contain transition-transform duration-300 hover:scale-105" 
               onError={(e) => {
                 // Fallback discreto caso a imagem não carregue
                 e.currentTarget.style.display = 'none';
                 const fallback = document.getElementById('logo-fallback');
                 if(fallback) fallback.style.display = 'block';
               }}
             />
             <div id="logo-fallback" className="text-center hidden">
                <h1 className="text-4xl font-serif font-bold text-[#0F2C4C] tracking-wide">SALOMÃO</h1>
                <p className="text-xs text-gray-400 uppercase tracking-[0.4em] mt-1">Advogados</p>
             </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* USER INPUT (COM SUFIXO FIXO) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Usuário Corporativo</label>
              <div className="relative group flex items-center bg-gray-50 border border-gray-200 rounded-xl focus-within:bg-white focus-within:border-[#0F2C4C]/30 focus-within:ring-4 focus-within:ring-[#0F2C4C]/5 transition-all duration-300">
                <div className="pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400 group-focus-within:text-[#0F2C4C] transition-colors duration-300" />
                </div>
                
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="flex-1 pl-3 pr-2 py-3.5 bg-transparent text-gray-900 text-sm outline-none placeholder:text-gray-400"
                  placeholder="nome.sobrenome"
                  required
                />
                
                {/* Sufixo Fixo */}
                <div className="pr-4 pl-2 py-3.5 text-sm text-gray-400 font-medium select-none bg-transparent border-l border-gray-100/50">
                  @salomaoadv.com.br
                </div>
              </div>
            </div>

            {/* PASSWORD INPUT */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Senha de Acesso</label>
              <div className="relative group bg-gray-50 border border-gray-200 rounded-xl focus-within:bg-white focus-within:border-[#0F2C4C]/30 focus-within:ring-4 focus-within:ring-[#0F2C4C]/5 transition-all duration-300">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-[#0F2C4C] transition-colors duration-300" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3.5 bg-transparent text-gray-900 text-sm outline-none placeholder:text-gray-400 rounded-xl"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* ERROR MESSAGE */}
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-100 flex items-center gap-2 text-red-600 text-xs font-medium animate-in slide-in-from-top-1">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl text-sm font-bold text-white 
                         bg-[#0F2C4C] hover:bg-[#1a3b61] 
                         shadow-[0_4px_14px_0_rgba(15,44,76,0.39)] hover:shadow-[0_6px_20px_rgba(15,44,76,0.23)] hover:-translate-y-0.5
                         transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none mt-4"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Entrar no Sistema
                  <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </button>

            {/* FOOTER */}
            <div className="pt-8 text-center">
              <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Ambiente Seguro | Controladoria Jurídica
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* LADO DIREITO: IMAGEM/BRANDING ORIGINAL */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-[#0F2C4C]">
        {/* Imagem de Fundo de Alta Qualidade */}
        <img 
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80" 
          alt="Office Background" 
          className="absolute inset-0 w-full h-full object-cover animate-in fade-in duration-1000 opacity-40 mix-blend-overlay"
        />
        
        {/* Overlay Sólido para dar o tom da marca */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F2C4C] via-[#0F2C4C]/90 to-[#1a3b61]/80 mix-blend-multiply" />

        {/* Conteúdo Institucional */}
        <div className="relative z-20 flex flex-col justify-center items-center h-full text-white px-12 text-center space-y-8">
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-70 rounded-full"></div>
          
          <h2 className="text-5xl font-serif font-bold tracking-tight drop-shadow-2xl text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-300">
            Excelência &<br/>Tradição
          </h2>
          
          <p className="text-lg text-gray-300 max-w-md leading-relaxed font-light tracking-wide">
            Soluções jurídicas estratégicas para impulsionar seus resultados com segurança e eficiência.
          </p>
        </div>
      </div>

    </div>
  );
}