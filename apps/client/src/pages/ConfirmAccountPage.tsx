import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Loader2, CheckCircle, ShieldAlert, Key, ArrowRight } from 'lucide-react';
import api from '../api/axios';
import { motion } from 'framer-motion';

const ConfirmAccountPage = () => {
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
    if (password.length < 6) {
      setStatus({ type: 'error', msg: 'La contraseña debe tener al menos 6 caracteres.' });
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/confirm-account', { token, password, source: 'app' });
      setStatus({ type: 'success', msg: '¡Cuenta activada! Ya puedes ingresar al sistema.' });
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.response?.data?.error || 'No se pudo activar la cuenta.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 p-10 space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gold-400/10 rounded-full translate-x-16 -translate-y-16" />
          
          <div className="text-center space-y-3">
             <div className="w-20 h-20 bg-navy-900 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-navy-100">
                <ShieldCheck className="w-10 h-10 text-gold-400" />
             </div>
             <h1 className="text-3xl font-black text-navy-900 tracking-tight">Activar Cuenta</h1>
             <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">Enlace Jurídico • Firma de Abogados</p>
          </div>

          {!token ? (
            <div className="p-6 bg-red-50 rounded-3xl border border-red-100 flex flex-col items-center gap-4 text-center">
               <ShieldAlert className="w-10 h-10 text-red-500" />
               <p className="text-red-700 font-bold text-sm">El enlace de activación es inválido o ha expirado.</p>
               <Link to="/login" className="text-red-700 underline text-xs font-black">Volver al inicio</Link>
            </div>
          ) : status?.type === 'success' ? (
            <div className="text-center space-y-6 py-10 animate-in zoom-in-95">
               <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8" />
               </div>
               <p className="text-navy-900 font-black text-lg leading-tight">{status.msg}</p>
               <p className="text-slate-400 text-sm font-medium">Redirigiendo a la pantalla de acceso...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {status?.type === 'error' && (
                <div className="p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 text-xs font-bold flex items-center gap-2">
                   <ShieldAlert className="w-4 h-4" /> {status.msg}
                </div>
              )}
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-navy-900 uppercase ml-1">Nueva Contraseña</label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                    <input 
                      required
                      type="password"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:border-gold-400 outline-none font-bold"
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-navy-900 uppercase ml-1">Confirmar Contraseña</label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                    <input 
                      required
                      type="password"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:border-gold-400 outline-none font-bold"
                      placeholder="Repite tu contraseña"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <button 
                disabled={loading}
                className="w-full py-5 bg-navy-900 text-white rounded-3xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-2xl hover:bg-navy-800 disabled:opacity-50 transition-all active:scale-95"
              >
                {loading ? <Loader2 className="animate-spin" /> : <>Activar Mi Acceso <ArrowRight className="w-4 h-4 text-gold-400" /></>}
              </button>
            </form>
          )}
        </div>
        
        <p className="mt-8 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest">
           &copy; 2026 Enlace Jurídico Digital • Protección Documental
        </p>
      </motion.div>
    </div>
  );
};

export default ConfirmAccountPage;
