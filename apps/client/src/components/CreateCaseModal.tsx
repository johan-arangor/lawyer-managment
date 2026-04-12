import React, { useState, useEffect } from 'react';
import { Trash2, Loader2, AlertCircle, CheckCircle, FileText, Tag } from 'lucide-react';
import api from '../api/axios';
import Modal from './Modal';

const CreateCaseModal = ({ isOpen, onClose, onSuccess }: any) => {
  const initialState = {
    title: '',
    caseNumber: '',
    fees: '',
    feeType: 'FIXED',
    lawyerId: '',
    clientId: '',
    description: '',
    followUpLinks: [] as { title: string; url: string }[]
  };

  const [formData, setFormData] = useState(initialState);
  const [lawyers, setLawyers] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      setStatus(null);
      if (user.role === 'LAWYER') {
        setFormData(prev => ({ ...prev, lawyerId: user.id }));
      }
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setLawyers(res.data.filter((u: any) => u.role === 'LAWYER' || u.role === 'ADMIN'));
      setClients(res.data.filter((u: any) => u.role === 'CLIENT'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddLink = () => {
    setFormData({
      ...formData,
      followUpLinks: [...formData.followUpLinks, { title: '', url: '' }]
    });
  };

  const handleRemoveLink = (index: number) => {
    setFormData({
      ...formData,
      followUpLinks: formData.followUpLinks.filter((_, i) => i !== index)
    });
  };

  const updateLink = (index: number, field: string, value: string) => {
    const newLinks = [...formData.followUpLinks];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setFormData({ ...formData, followUpLinks: newLinks });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      await api.post('/cases', {
        ...formData,
        fees: Number(formData.fees)
      });
      setStatus({ type: 'success', msg: '¡Proceso creado exitosamente!' });
      setTimeout(() => {
        setFormData(initialState);
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.response?.data?.error || 'No se pudo crear el proceso' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo Proceso Jurídico" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {status && (
          <div className={`p-4 rounded-2xl flex items-center gap-3 font-bold text-sm animate-in fade-in slide-in-from-top-2 ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {status.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {status.msg}
          </div>
        )}

        <div className="md:col-span-2 space-y-2">
          <div className="space-y-2">
            <label className="text-sm font-black text-navy-900 ml-1 uppercase tracking-tighter">Título del Caso</label>
            <div className="relative">
              <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                required
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-[1.25rem] focus:ring-2 focus:ring-gold-400 outline-none font-medium"
                placeholder="Ej: Divorcio Pérez"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-black text-navy-900 ml-1 uppercase tracking-tighter">Nº Radicado</label>
            <div className="relative">
              <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                required
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-[1.25rem] focus:ring-2 focus:ring-gold-400 outline-none font-medium"
                placeholder="EXP-100-2024"
                value={formData.caseNumber}
                onChange={e => setFormData({ ...formData, caseNumber: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-navy-900 ml-1">Tipo de Honorario</label>
              <select
                className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold"
                value={formData.feeType}
                onChange={e => setFormData({ ...formData, feeType: e.target.value })}
              >
                <option value="FIXED">Valor Fijo ($)</option>
                <option value="PERCENTAGE">Porcentaje (%)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-navy-900 ml-1">
                {formData.feeType === 'FIXED' ? 'Monto Pactado' : 'Porcentaje (%)'}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-600 font-black">
                  {formData.feeType === 'FIXED' ? '$' : '%'}
                </span>
                <input
                  type="number"
                  required
                  value={formData.fees}
                  onChange={e => setFormData({ ...formData, fees: e.target.value })}
                  className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-black"
                  placeholder={formData.feeType === 'FIXED' ? '0.00' : '20'}
                />
              </div>
            </div>
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-black text-navy-900 ml-1 uppercase tracking-tighter">Abogado Asignado</label>
            <select
              required
              disabled={user.role === 'LAWYER'}
              className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-[1.25rem] focus:ring-2 focus:ring-gold-400 outline-none font-medium disabled:opacity-75 disabled:cursor-not-allowed"
              value={formData.lawyerId}
              onChange={e => setFormData({ ...formData, lawyerId: e.target.value })}
            >
              <option value="">Seleccionar Abogado</option>
              {lawyers.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            {user.role === 'LAWYER' && <p className="text-[10px] text-slate-400 ml-2 italic">Asignado automáticamente al creador (Abogado).</p>}
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-black text-navy-900 ml-1 uppercase tracking-tighter">Cliente</label>
            <select
              required
              className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-[1.25rem] focus:ring-2 focus:ring-gold-400 outline-none font-medium text-navy-900"
              value={formData.clientId}
              onChange={e => setFormData({ ...formData, clientId: e.target.value })}
            >
              <option value="">Buscar en base de datos de clientes...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-2 mt-4">
          <label className="text-sm font-black text-navy-900 ml-1 uppercase tracking-tighter">Resumen Jurídico</label>
          <textarea
            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] focus:ring-2 focus:ring-gold-400 outline-none h-32 font-medium"
            placeholder="Describe los hechos y pretensiones..."
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div className="bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100 mt-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-black text-navy-900 text-xs uppercase tracking-widest">Links Rama Judicial</h4>
            <button
              type="button"
              onClick={handleAddLink}
              className="text-gold-600 bg-white px-3 py-1.5 rounded-xl shadow-sm hover:translate-y-[-2px] transition-all text-xs font-bold"
            >
              + Añadir Link
            </button>
          </div>

          <div className="space-y-3">
            {formData.followUpLinks.length === 0 && <p className="text-center text-xs text-slate-400 py-4 italic">No se han añadido links de seguimiento aún.</p>}
            {formData.followUpLinks.map((link, idx) => (
              <div key={idx} className="flex gap-3 animate-in fade-in zoom-in-95">
                <input
                  placeholder="Título (Ej: Notificaciones)"
                  className="flex-1 px-4 py-3 bg-white rounded-xl border border-slate-100 shadow-sm text-sm font-medium outline-none focus:ring-1 focus:ring-gold-400"
                  value={link.title}
                  onChange={e => updateLink(idx, 'title', e.target.value)}
                />
                <input
                  placeholder="URL del Link"
                  className="flex-[2] px-4 py-3 bg-white rounded-xl border border-slate-100 shadow-sm text-sm font-medium outline-none focus:ring-1 focus:ring-gold-400"
                  value={link.url}
                  onChange={e => updateLink(idx, 'url', e.target.value)}
                />
                <button type="button" onClick={() => handleRemoveLink(idx)} className="text-red-300 hover:text-red-500 transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-8 flex gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-8 py-4 text-slate-400 font-bold hover:bg-slate-100 rounded-[1.25rem] transition-all"
          >
            Descartar
          </button>
          <button
            disabled={loading}
            className="flex-1 py-4 bg-navy-900 text-white font-bold rounded-[1.25rem] shadow-xl shadow-navy-100 flex items-center justify-center gap-3 hover:bg-navy-800 disabled:opacity-50 active:scale-95 transition-all"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Registrar Nuevo Expediente'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateCaseModal;
