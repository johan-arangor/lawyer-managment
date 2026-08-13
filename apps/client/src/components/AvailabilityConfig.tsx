import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Plus, Trash2, Clock, Calendar } from 'lucide-react';
import api from '../api/axios';

const DAYS = [
  { id: 1, name: 'Lunes' },
  { id: 2, name: 'Martes' },
  { id: 3, name: 'Miércoles' },
  { id: 4, name: 'Jueves' },
  { id: 5, name: 'Viernes' },
  { id: 6, name: 'Sábado' },
  { id: 0, name: 'Domingo' }
];

const AvailabilityConfig = () => {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    try {
      const res = await api.get(`/availability/${user.id}`);
      setSchedules(res.data);
    } catch (err) {
      console.error('Error fetching availability');
    } finally {
      setLoading(false);
    }
  };

  const addSlot = () => {
    setSchedules([...schedules, { dayOfWeek: 1, startTime: '08:00', endTime: '12:00' }]);
  };

  const removeSlot = (index: number) => {
    const newSchedules = [...schedules];
    newSchedules.splice(index, 1);
    setSchedules(newSchedules);
  };

  const updateSlot = (index: number, field: string, value: any) => {
    const newSchedules = [...schedules];
    newSchedules[index][field] = value;
    setSchedules(newSchedules);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/availability/${user.id}`, { schedules });
      alert('Disponibilidad actualizada exitosamente');
    } catch (err) {
      alert('Error al guardar disponibilidad');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-20 text-center font-bold text-slate-400">Cargando disponibilidad...</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-black text-navy-900">Configuración de Horario</h3>
          <p className="text-slate-400 font-medium">Define los bloques de tiempo en los que estás disponible para citas.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2"
        >
          {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
          Guardar Horario
        </button>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
        {schedules.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-400 font-bold mb-4">Aún no has configurado tu horario</p>
            <button onClick={addSlot} className="text-gold-600 font-black uppercase text-xs flex items-center gap-2 mx-auto hover:bg-gold-50 p-2 rounded-lg transition-all">
              <Plus className="w-4 h-4" /> Agregar primer bloque
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-12 gap-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <div className="col-span-4">Día de la semana</div>
              <div className="col-span-3 text-center">Hora Inicio</div>
              <div className="col-span-3 text-center">Hora Fin</div>
              <div className="col-span-2"></div>
            </div>
            {schedules.map((slot, index) => (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                key={index}
                className="grid grid-cols-12 gap-4 items-center bg-slate-50 p-4 rounded-2xl group"
              >
                <div className="col-span-4">
                  <select
                    value={slot.dayOfWeek}
                    onChange={(e) => updateSlot(index, 'dayOfWeek', Number(e.target.value))}
                    className="w-full bg-transparent border-none outline-none font-bold text-navy-900 cursor-pointer"
                  >
                    {DAYS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="col-span-3 flex justify-center">
                  <input
                    type="time"
                    value={slot.startTime}
                    onChange={(e) => updateSlot(index, 'startTime', e.target.value)}
                    className="bg-transparent border-none outline-none font-bold text-navy-900 cursor-pointer"
                  />
                </div>
                <div className="col-span-3 flex justify-center">
                  <input
                    type="time"
                    value={slot.endTime}
                    onChange={(e) => updateSlot(index, 'endTime', e.target.value)}
                    className="bg-transparent border-none outline-none font-bold text-navy-900 cursor-pointer"
                  />
                </div>
                <div className="col-span-2 text-right">
                  <button onClick={() => removeSlot(index)} className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
            <button
              onClick={addSlot}
              className="w-full py-4 border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 font-bold hover:bg-slate-50 hover:border-slate-200 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" /> Agregar bloque de horario
            </button>
          </div>
        )}
      </div>

      <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 flex gap-4">
        <div className="bg-amber-100 p-2 rounded-xl h-fit">
          <Clock className="text-amber-600 w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-black text-amber-900 mb-1 uppercase tracking-tight">Consejo de Agendamiento</h4>
          <p className="text-xs text-amber-700 leading-relaxed font-medium">
            Tus bloques de horario permiten que el sistema segmente automáticamente las citas según la duración del servicio. Asegúrate de dejar espacios entre bloques para gestiones administrativas.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityConfig;
