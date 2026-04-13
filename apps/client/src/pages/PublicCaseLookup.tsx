import React, { useState } from 'react';
import { Search, Loader2, ArrowLeft, ShieldCheck, Clock, FileText, User, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';

const PublicCaseLookup = () => {
  const [caseNumber, setCaseNumber] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await api.post('/cases/public-status', { caseNumber, documentNumber });
      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'No se encontró el proceso con los datos suministrados.');
    } finally {
      setLoading(false);
    }
  };

  const statusColors: any = {
    PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
    IN_PROGRESS: 'bg-blue-100 text-blue-700 border-blue-200',
    CLOSED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  };

  const statusLabels: any = {
    PENDING: 'Pendiente de Inicio',
    IN_PROGRESS: 'En Curso / Trámite',
    CLOSED: 'Proceso Finalizado',
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full"
      >
        <div className="text-center mb-10 space-y-2">
           <img src="/logo.png" className="h-16 mx-auto mb-4" alt="Enlace Jurídico" />
           <h1 className="text-3xl font-black text-navy-900 tracking-tight">Consulta de Procesos</h1>
           <p className="text-slate-500 font-medium">Acceso rápido al estado de tu expediente sin iniciar sesión</p>
        </div>

        <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden">
          <div className="p-10 border-b border-slate-50">
            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-1">
                  <label className="text-[10px] font-black text-navy-900 uppercase ml-1">Número de Caso</label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                    <input 
                      required
                      placeholder="EJ-2026-001"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:border-gold-400 outline-none font-bold"
                      value={caseNumber}
                      onChange={e => setCaseNumber(e.target.value.toUpperCase())}
                    />
                  </div>
               </div>
               <div className="space-y-1">
                  <label className="text-[10px] font-black text-navy-900 uppercase ml-1">Documento del Titular</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                    <input 
                      required
                      placeholder="Cédula o NIT"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:border-gold-400 outline-none font-bold"
                      value={documentNumber}
                      onChange={e => setDocumentNumber(e.target.value)}
                    />
                  </div>
               </div>
               <div className="md:col-span-2 pt-2">
                  <button 
                    disabled={loading}
                    className="w-full py-5 bg-navy-900 text-white rounded-3xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl hover:bg-navy-800 disabled:opacity-50 transition-all active:scale-95"
                  >
                    {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Search className="w-5 h-5" />}
                    Localizar Expediente
                  </button>
               </div>
            </form>
          </div>

          <AnimatePresence mode='wait'>
            {result && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-10 bg-slate-50/50"
              >
                <div className="space-y-8">
                   <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Resultado de Búsqueda</p>
                         <h2 className="text-2xl font-black text-navy-900">{result.title}</h2>
                         <p className="text-navy-600 font-bold text-sm">Titular: {result.clientName}</p>
                      </div>
                      <div className={`px-6 py-3 rounded-2xl border font-black text-xs uppercase tracking-widest ${statusColors[result.status]}`}>
                         {statusLabels[result.status]}
                      </div>
                   </div>

                   <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                      <div className="flex items-center gap-3 text-navy-900 font-black text-xs uppercase tracking-widest border-b border-slate-50 pb-3">
                         <Clock className="w-4 h-4 text-gold-600" /> Último Avance Reportado
                      </div>
                      {result.lastUpdate ? (
                        <div className="space-y-2">
                           <p className="text-slate-600 font-medium leading-relaxed italic">"{result.lastUpdate.reason}"</p>
                           <p className="text-[10px] text-slate-400 font-black uppercase">
                              Actualizado el: {new Date(result.lastUpdate.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
                           </p>
                        </div>
                      ) : (
                        <p className="text-slate-400 text-xs italic font-medium">No se registran bitácoras públicas para este proceso.</p>
                      )}
                   </div>

                   <div className="flex items-center gap-2 p-4 bg-navy-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">
                      <ShieldCheck className="w-5 h-5 text-gold-400" />
                      Para ver documentos y bitácoras completas, por favor inicia sesión con tu cuenta.
                   </div>
                </div>
              </motion.div>
            )}

            {error && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-10"
              >
                <div className="p-6 bg-red-50 rounded-3xl border border-red-100 flex items-center gap-4 text-red-700">
                   <AlertTriangle className="w-8 h-8 shrink-0" />
                   <div>
                      <p className="font-black text-sm uppercase tracking-tight">Error de Localización</p>
                      <p className="text-xs font-medium">{error}</p>
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-8 flex justify-center">
           <Link to="/" className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-navy-900 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Regresar al Inicio
           </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default PublicCaseLookup;
