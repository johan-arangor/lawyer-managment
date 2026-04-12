import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { RefreshCw, Loader2, CheckCircle, ShieldAlert, Key, ArrowRight } from 'lucide-react';
import api from '../api/axios';
import { motion } from 'framer-motion';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setStatus({ type: 'error', msg: 'Las contraseñas no coinciden.' });
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setStatus({ type: 'success', msg: 'Contraseña actualizada. Ya puedes iniciar sesión.' });
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.response?.data?.error || 'No se pudo restablecer la contraseña.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-200 p-10 space-y-8 relative overflow-hidden">
          <div className="text-center space-y-3">
             <div className="w-20 h-20 bg-gold-400 text-navy-900 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-gold-100 rotate-3 group-hover:rotate-0 transition-transform">
                <RefreshCw className="w-10 h-10" />
             </div>
             <h1 className="text-3xl font-black text-navy-900 tracking-tight">Recuperar Acceso</h1>
             <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">Seguridad Identidad • Enlace Jurídico</p>
          </div>

          {!token ? (
            <div className="p-8 bg-red-50 rounded-3xl border border-red-100 flex flex-col items-center gap-4 text-center">
               <ShieldAlert className="w-12 h-12 text-red-500" />
               <p className="text-red-700 font-black text-sm">Token de recuperación inexistente o dañado.</p>
               <Link to="/login" className="px-6 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-200">Volver</Link>
            </div>
          ) : status?.type === 'success' ? (
            <div className="text-center space-y-6 py-10">
               <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                  <CheckCircle className="w-8 h-8" />
               </div>
               <p className="text-navy-900 font-black text-lg leading-tight">{status.msg}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {status?.type === 'error' && (
                <div className="p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 text-[11px] font-black flex items-center gap-2">
                   <ShieldAlert className="w-4 h-4" /> {status.msg}
                </div>
              )}
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-navy-900 uppercase ml-1">Nueva Contraseña Maestra</label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                    <input 
                      required
                      type="password"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:border-gold-500 outline-none font-bold"
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-navy-900 uppercase ml-1">Revalidar Contraseña</label>
                  <input 
                    required
                    type="password"
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:border-gold-500 outline-none font-bold"
                    placeholder="Repite la contraseña"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <button 
                disabled={loading}
                className="w-full py-5 bg-navy-900 text-white rounded-3xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-2xl hover:bg-navy-800 transition-all flex items-center justify-center group"
              >
                {loading ? <Loader2 className="animate-spin" /> : <>Guardar Identidad <ArrowRight className="w-4 h-4 text-gold-400 group-hover:translate-x-1 transition-transform" /></>}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
