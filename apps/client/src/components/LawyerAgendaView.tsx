import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, User, Check, X, AlertCircle } from 'lucide-react';
import api from '../api/axios';

const LawyerAgendaView = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'LIST' | 'CALENDAR'>('LIST');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await api.get('/appointments');
      setAppointments(res.data);
    } catch (err) {
      console.error('Error fetching appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string, notes?: string) => {
    try {
      await api.patch(`/appointments/${id}/status`, { status, notes });
      fetchAppointments();
    } catch (err) {
      alert('Error al actualizar estado');
    }
  };

  const filtered = appointments.filter(a => filterStatus === 'ALL' || a.status === filterStatus);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'CONFIRMED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200';
      case 'MODIFIED': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  if (loading) return <div className="p-20 text-center font-bold text-slate-400">Cargando agenda...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-black text-navy-900">Mi Agenda</h3>
          <p className="text-slate-400 font-medium">Gestiona tus citas programadas y solicitudes de clientes.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button onClick={() => setView('LIST')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === 'LIST' ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-400'}`}>Lista</button>
          <button onClick={() => setView('CALENDAR')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === 'CALENDAR' ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-400'}`}>Calendario</button>
        </div>
      </div>

      <div className="flex gap-2">
        {['ALL', 'PENDING', 'CONFIRMED', 'CANCELLED'].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border transition-all ${filterStatus === s ? 'bg-navy-900 text-white border-navy-900' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}
          >
            {s === 'ALL' ? 'Todos' : s === 'PENDING' ? 'Pendientes' : s === 'CONFIRMED' ? 'Confirmados' : 'Cancelados'}
          </button>
        ))}
      </div>

      {view === 'LIST' ? (
        <div className="grid grid-cols-1 gap-4">
          {filtered.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2.5rem] border border-slate-100">
              <CalendarIcon className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-bold">No hay citas en esta categoría</p>
            </div>
          ) : (
            filtered.map((a) => (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                key={a.id}
                className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl flex flex-col items-center justify-center min-w-[80px]">
                    <span className="text-[10px] font-black text-slate-400 uppercase">{new Date(a.scheduledAt).toLocaleDateString('es-CO', { month: 'short' })}</span>
                    <span className="text-2xl font-black text-navy-900">{new Date(a.scheduledAt).getDate()}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border ${getStatusColor(a.status)}`}>
                        {a.status}
                      </span>
                      <span className="text-xs text-slate-400 font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(a.scheduledAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <h4 className="font-black text-navy-900">{a.service.name}</h4>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-navy-50 flex items-center justify-center text-[10px] font-bold text-navy-400">
                          <User className="w-3 h-3" />
                        </div>
                        <span className="text-xs font-bold text-slate-500">{a.clientName} {a.clientLastName}</span>
                      </div>
                      <span className="text-[10px] text-slate-300">|</span>
                      <span className="text-xs font-medium text-slate-400 italic">Abogado: {a.lawyer?.name || 'Pendiente asignar'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto border-t md:border-none pt-4 md:pt-0">
                  {a.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(a.id, 'CONFIRMED')}
                        className="flex-1 md:flex-none px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all"
                      >
                        <Check className="w-4 h-4" /> Confirmar
                      </button>
                      <button
                        onClick={() => {
                          const note = prompt('Razón de cancelación:');
                          if (note) handleUpdateStatus(a.id, 'CANCELLED', note);
                        }}
                        className="flex-1 md:flex-none px-4 py-2 bg-white border border-red-100 text-red-500 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-red-50 transition-all"
                      >
                        <X className="w-4 h-4" /> Cancelar
                      </button>
                    </>
                  )}
                  {a.status === 'CONFIRMED' && (
                    <button
                      onClick={() => {
                        const note = prompt('Motivo del cambio:');
                        if (note) handleUpdateStatus(a.id, 'CANCELLED', note);
                      }}
                      className="px-4 py-2 text-slate-400 hover:text-red-500 font-bold text-xs flex items-center gap-2 transition-colors"
                    >
                      <AlertCircle className="w-4 h-4" /> Cancelar Cita
                    </button>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm text-center">
           <p className="text-slate-400 italic">Vista de calendario en desarrollo - Use la vista de Lista temporalmente.</p>
        </div>
      )}
    </div>
  );
};

export default LawyerAgendaView;
