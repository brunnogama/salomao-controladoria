import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User, Lock, ArrowRight, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
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
        
        <div className="w-full max-w-sm space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
          
          {/* LOGO */}
          <div className="flex justify-center mb-8">
             <img 
               src="/logo-azul.png" 
               alt="Salomão Advogados" 
               className="h-20 object-contain hover:scale-105 transition-transform duration-300" 
               onError={(e) => e.currentTarget.style.display = 'none'}
             />
             {/* Fallback caso a imagem não exista */}
             <div className="text-center" style={{ display: 'none' }}>
                <h1 className="text-3xl font-serif font-bold text-[#0F2C4C] tracking-wide">SALOMÃO</h1>
             </div>
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-bold text-[#0F2C4C] tracking-tight">Bem-vindo</h2>
            <p className="text-sm text-gray-500 mt-2">Acesse o portal de controladoria jurídica.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            
            {/* USER INPUT (MODERNO & SEM AZUL) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Usuário Corporativo</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400 group-focus-within:text-[#0F2C4C] transition-colors duration-300" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm 
                             outline-none transition-all duration-300
                             focus:bg-white focus:border-[#0F2C4C]/30 focus:ring-4 focus:ring-[#0F2C4C]/5
                             placeholder:text-gray-400"
                  placeholder="nome.sobrenome@salomaoadv.com.br"
                  required
                />
              </div>
            </div>

            {/* PASSWORD INPUT (MODERNO & SEM AZUL) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Senha de Acesso</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-[#0F2C4C] transition-colors duration-300" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm 
                             outline-none transition-all duration-300
                             focus:bg-white focus:border-[#0F2C4C]/30 focus:ring-4 focus:ring-[#0F2C4C]/5
                             placeholder:text-gray-400"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* ERROR MESSAGE */}
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-100 flex items-center gap-2 text-red-600 text-xs font-medium animate-in slide-in-from-top-1">
                <AlertCircle className="w-4 h-4" />
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
                         transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none mt-2"
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
            <div className="pt-6 text-center">
              <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Ambiente Seguro | Controladoria Jurídica
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* LADO DIREITO: IMAGEM/BRANDING */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-[#0F2C4C]">
        {/* Overlay Gradiente */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F2C4C]/80 to-[#0F2C4C]/40 z-10 mix-blend-multiply" />
        
        {/* Imagem de Fundo */}
        <img 
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80" 
          alt="Office Background" 
          className="absolute inset-0 w-full h-full object-cover animate-in fade-in duration-1000"
        />

        {/* Texto Institucional */}
        <div className="relative z-20 flex flex-col justify-center items-center h-full text-white px-12 text-center space-y-6">
          <div className="w-20 h-1 bg-salomao-gold/50 rounded-full mb-4"></div>
          <h2 className="text-4xl font-serif font-bold tracking-wide drop-shadow-lg">
            Excelência & Tradição
          </h2>
          <p className="text-lg text-gray-200 max-w-md leading-relaxed font-light drop-shadow-md">
            Soluções jurídicas estratégicas para impulsionar seus resultados com segurança e eficiência.
          </p>
        </div>
      </div>

    </div>
  );
}