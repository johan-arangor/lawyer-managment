import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Loader2, ArrowLeft, CheckCircle, ShieldAlert, Send } from 'lucide-react';
import api from '../api/axios';
import { motion } from 'framer-motion';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      await api.post('/auth/request-password-reset', { email, source: 'app' });
      setStatus({ 
        type: 'success', 
        msg: 'Si el correo está registrado, recibirás un enlace de recuperación en unos instantes.' 
      });
    } catch (err: any) {
      setStatus({ 
        type: 'error', 
        msg: err.response?.data?.error || 'No se pudo procesar la solicitud.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 p-10 space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-navy-900/5 rounded-full translate-x-16 -translate-y-16" />
          
          <div className="text-center space-y-3">
             <div className="w-16 h-16 bg-gold-400 text-navy-900 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-gold-100 rotate-3">
                <Send className="w-8 h-8" />
             </div>
             <h1 className="text-3xl font-black text-navy-900 tracking-tight">Recuperar Clave</h1>
             <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">Seguridad Identidad • Enlace Jurídico</p>
          </div>

          {status?.type === 'success' ? (
            <div className="text-center space-y-6 py-4 animate-in fade-in zoom-in-95">
               <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8" />
               </div>
               <div className="space-y-2">
                  <p className="text-navy-900 font-black text-lg leading-tight">¡Correo Enviado!</p>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed">{status.msg}</p>
               </div>
               <Link 
                  to="/login" 
                  className="inline-flex items-center gap-2 text-navy-900 font-black text-xs uppercase tracking-widest hover:gap-3 transition-all"
               >
                  <ArrowLeft className="w-4 h-4 text-gold-600" /> Volver al Inicio
               </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <p className="text-slate-500 text-sm font-medium text-center leading-relaxed px-2">
                Ingresa tu correo electrónico institucional o personal registrado para recibir las instrucciones de acceso.
              </p>

              {status?.type === 'error' && (
                <div className="p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 text-[11px] font-black flex items-center gap-2">
                   <ShieldAlert className="w-4 h-4" /> {status.msg}
                </div>
              )}
              
              <div className="space-y-1">
                <label className="text-[10px] font-black text-navy-900 uppercase ml-1">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                  <input 
                    required
                    type="email"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:border-gold-400 outline-none font-bold"
                    placeholder="ejemplo@correo.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <button 
                  disabled={loading}
                  className="w-full py-5 bg-navy-900 text-white rounded-3xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-2xl hover:bg-navy-800 disabled:opacity-50 transition-all active:scale-95 shadow-navy-100"
                >
                  {loading ? <Loader2 className="animate-spin" /> : 'Enviar Enlace de Acceso'}
                </button>
                
                <Link 
                  to="/login" 
                  className="w-full py-4 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:text-navy-900 transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" /> Regresar al Login
                </Link>
              </div>
            </form>
          )}
        </div>
        
        <p className="mt-12 text-center text-slate-300 text-[10px] font-black uppercase tracking-widest">
           Protección de Identidad Judicial &copy; 2026
        </p>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
