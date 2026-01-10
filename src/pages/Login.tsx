import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User, Lock, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white p-8 sm:p-10 animate-in fade-in zoom-in duration-300">
        
        {/* LOGO AREA */}
        <div className="flex flex-col items-center mb-10">
          {/* Substitua pelo seu arquivo de logo real, se tiver. Usei texto estilizado como fallback */}
          <div className="mb-4">
             <img src="/logo-azul.png" alt="Salomão Advogados" className="h-16 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
             {/* Fallback visual caso a imagem não carregue */}
             <div className="text-center">
                <h1 className="text-3xl font-serif font-bold text-[#0F2C4C] tracking-wide">SALOMÃO</h1>
                <p className="text-xs text-gray-400 uppercase tracking-[0.3em] mt-1">Advogados</p>
             </div>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          
          {/* USER INPUT */}
          <div className="space-y-2">
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

          {/* PASSWORD INPUT */}
          <div className="space-y-2">
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
              <div className="w-1 h-1 rounded-full bg-red-500" />
              {error}
            </div>
          )}

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl text-sm font-semibold text-white 
                       bg-[#0F2C4C] hover:bg-[#1a3b61] 
                       shadow-[0_4px_14px_0_rgba(15,44,76,0.39)] hover:shadow-[0_6px_20px_rgba(15,44,76,0.23)] hover:-translate-y-0.5
                       transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
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
          <div className="pt-4 text-center">
            <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Ambiente Seguro | Controladoria Jurídica
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}