import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User, Lock, ArrowRight, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';

export function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Estado para imagem dinâmica (Do código original)
  const [bgImage, setBgImage] = useState('');

  useEffect(() => {
    // Imagem Dinâmica com ID aleatório (Lógica original)
    const randomID = Math.floor(Math.random() * 1000);
    setBgImage(`https://images.unsplash.com/photo-1505664194779-8beaceb93744?q=80&w=2070&auto=format&fit=crop&sig=${randomID}`);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const email = `${username}@salomaoadv.com.br`;

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      // Salva nome para exibição (Simulando comportamento original)
      const nomeFormatado = username.split('.').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
      localStorage.setItem('user_name', nomeFormatado);
      
      navigate('/dashboard');
    } catch (err: any) {
      setError('Credenciais inválidas. Verifique seu usuário e senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans w-full bg-white overflow-hidden">
      
      {/* --- LADO ESQUERDO: UI MODERNA ATUAL --- */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-white sm:p-12 lg:p-16 relative z-10">
        
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
          
          {/* LOGO SALOMÃO */}
          <div className="flex justify-center mb-10">
             <img 
               src="/logo-salomao.png" 
               alt="Salomão Advogados" 
               className="h-24 object-contain transition-transform duration-300 hover:scale-105" 
               onError={(e) => {
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
            
            {/* USER INPUT */}
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
                  ACESSAR SISTEMA
                  <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-8 text-center">
              <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em] pt-4">
                © 2026 Salomão Advogados • v2.5.0
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* --- LADO DIREITO: LAYOUT ORIGINAL --- */}
      <div className='hidden lg:flex lg:w-1/2 bg-[#0F2C4C] relative items-center justify-center overflow-hidden'>
        <div className='absolute inset-0'>
          <img
            src={bgImage}
            alt='Jurídico'
            className='w-full h-full object-cover opacity-20 mix-blend-luminosity'
          />
          <div className='absolute inset-0 bg-gradient-to-tr from-[#0F2C4C] via-[#0F2C4C]/90 to-blue-900/40'></div>
        </div>

        <div className='relative z-10 p-16 max-w-xl'>
          <div className='inline-flex items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 mb-8 backdrop-blur-sm shadow-2xl'>
            <ArrowRight className='text-yellow-400 w-6 h-6' />
          </div>

          <h2 className='text-4xl font-bold text-white mb-6 leading-tight'>
            Controladoria Jurídica <br />
            <span className='text-blue-200'>Estratégica</span>
          </h2>
          <div className='h-1 w-24 bg-yellow-500 mb-8'></div>
          <p className='text-gray-300 text-lg leading-relaxed font-light mb-8'>
            Gestão inteligente de processos e contratos. A tecnologia garantindo
            a segurança e eficiência do{' '}
            <strong className='text-white font-medium'>
              Salomão Advogados
            </strong>
            .
          </p>
        </div>
      </div>

    </div>
  );
}