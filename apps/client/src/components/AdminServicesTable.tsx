import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Clock, Check } from 'lucide-react';
import api from '../api/axios';

const AdminServicesTable = () => {
  const [services, setServices] = useState<any[]>([]);
  const [lawyers, setLawyers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    durationMinutes: 60,
    requiredDocs: '',
    isActive: true,
    lawyerIds: [] as string[]
  });

  useEffect(() => {
    fetchServices();
    fetchLawyers();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await api.get('/services');
      setServices(res.data);
    } catch (err) {
      console.error('Error fetching services');
    } finally {
      setLoading(false);
    }
  };

  const fetchLawyers = async () => {
    try {
      const res = await api.get('/users/lawyers'); // Assumes this endpoint exists
      setLawyers(res.data);
    } catch (err) {
      console.error('Error fetching lawyers');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingService) {
        await api.put(`/services/${editingService.id}`, formData);
      } else {
        await api.post('/services', formData);
      }
      fetchServices();
      setIsModalOpen(false);
      setEditingService(null);
      setFormData({ name: '', durationMinutes: 60, requiredDocs: '', isActive: true, lawyerIds: [] });
    } catch (err) {
      alert('Error saving service');
    }
  };

  const handleEdit = (service: any) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      durationMinutes: service.durationMinutes,
      requiredDocs: service.requiredDocs || '',
      isActive: service.isActive,
      lawyerIds: service.lawyers?.map((l: any) => l.id) || []
    });
    setIsModalOpen(true);
  };

  const handleLawyerToggle = (lawyerId: string) => {
    setFormData(prev => {
      const isSelected = prev.lawyerIds.includes(lawyerId);
      if (isSelected) {
        return { ...prev, lawyerIds: prev.lawyerIds.filter(id => id !== lawyerId) };
      } else {
        return { ...prev, lawyerIds: [...prev.lawyerIds, lawyerId] };
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este servicio?')) return;
    try {
      await api.delete(`/services/${id}`);
      fetchServices();
    } catch (err) {
      alert('Error deleting service');
    }
  };

    if (loading) return <div className="p-20 text-center font-bold text-slate-400">Cargando servicios...</div>;

    return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-black text-navy-900">Servicios Legales</h3>
          <p className="text-slate-400 font-medium">Configura los servicios que los clientes pueden agendar.</p>
        </div>
        <button
          onClick={() => { 
            setEditingService(null); 
            setFormData({ name: '', durationMinutes: 60, requiredDocs: '', isActive: true, lawyerIds: [] }); 
            setIsModalOpen(true); 
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Nuevo Servicio
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-50 bg-slate-50/50">
              <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre del Servicio</th>
              <th className="py-6 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Duración</th>
              <th className="py-6 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Abogados Asignados</th>
              <th className="py-6 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
              <th className="py-6 px-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {services.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-6 px-8">
                  <p className="font-black text-navy-900">{s.name}</p>
                </td>
                <td className="py-6 px-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-slate-500 font-bold">
                    <Clock className="w-4 h-4" /> {s.durationMinutes} min
                  </div>
                </td>
                <td className="py-6 px-4">
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {s.lawyers?.length > 0 ? s.lawyers.map((l: any) => (
                      <span key={l.id} className="px-2 py-0.5 bg-gold-100 text-gold-700 text-[10px] font-bold rounded-md">
                        {l.name}
                      </span>
                    )) : <span className="text-[10px] text-slate-400 italic">Sin abogados</span>}
                  </div>
                </td>
                <td className="py-6 px-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${s.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                    {s.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="py-6 px-4 text-right pr-6">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleEdit(s)} className="p-2 hover:bg-gold-50 text-gold-600 rounded-lg transition-all"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(s.id)} className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-navy-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2.5rem] w-full max-w-lg p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-black text-navy-900 mb-6">{editingService ? 'Editar Servicio' : 'Nuevo Servicio'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Nombre del Servicio</label>
                <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="input-field w-full" placeholder="Ej: Consultoría Laboral" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Duración (minutos)</label>
                  <input type="number" required value={formData.durationMinutes} onChange={e => setFormData({ ...formData, durationMinutes: Number(e.target.value) })} className="input-field w-full" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Estado</label>
                  <select value={formData.isActive ? 'true' : 'false'} onChange={e => setFormData({ ...formData, isActive: e.target.value === 'true' })} className="input-field w-full">
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Abogados que prestan este servicio</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-100 max-h-40 overflow-y-auto">
                  {lawyers.map(l => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => handleLawyerToggle(l.id)}
                      className={`flex items-center gap-2 p-2 rounded-xl text-xs font-bold transition-all ${formData.lawyerIds.includes(l.id) ? 'bg-gold-500 text-white shadow-md shadow-gold-500/20' : 'bg-white text-slate-500 hover:bg-slate-100'}`}
                    >
                      <div className={`w-4 h-4 rounded-md flex items-center justify-center border ${formData.lawyerIds.includes(l.id) ? 'border-white bg-white/20' : 'border-slate-200'}`}>
                        {formData.lawyerIds.includes(l.id) && <Check className="w-3 h-3 text-white" />}
                      </div>
                      {l.name}
                    </button>
                  ))}
                  {lawyers.length === 0 && <p className="col-span-2 text-center text-slate-400 italic">No hay abogados registrados.</p>}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Documentos Necesarios</label>
                <textarea value={formData.requiredDocs} onChange={e => setFormData({ ...formData, requiredDocs: e.target.value })} className="input-field w-full h-24 resize-none" placeholder="Lista de documentos..." />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 font-bold text-slate-400 hover:text-navy-900 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 btn-primary">Guardar</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminServicesTable;
