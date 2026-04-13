import React, { useState, useEffect } from 'react';
import { Loader2, ShieldCheck, User } from 'lucide-react';
import api from '../api/axios';
import Modal from './Modal';

interface EditCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  caseData: any;
}

const EditCaseModal = ({ isOpen, onClose, onSuccess, caseData }: EditCaseModalProps) => {
  const [loading, setLoading] = useState(false);
  const [lawyers, setLawyers] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    caseNumber: '',
    fees: '',
    feeType: 'FIXED',
    lawyerId: '',
    clientId: '',
    description: '',
    followUpLinks: [] as { id?: string; title: string; url: string }[]
  });

  const authUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = authUser.role === 'ADMIN';

  useEffect(() => {
    if (isOpen) {
      if (isAdmin) fetchUsers();

      if (caseData) {
        setFormData({
          title: caseData.title || '',
          caseNumber: caseData.caseNumber || '',
          fees: caseData.fees?.toString() || '',
          feeType: caseData.feeType || 'FIXED',
          lawyerId: caseData.lawyerId || '',
          clientId: caseData.clientId || '',
          description: caseData.description || '',
          followUpLinks: caseData.followUpLinks || []
        });
      }
    }
  }, [isOpen, caseData]);

  const fetchUsers = async () => {
    try {
      const resp = await api.get('/users');
      const all = resp.data;
      setLawyers(all.filter((u: any) => u.role === 'LAWYER' || u.role === 'ADMIN'));
      setClients(all.filter((u: any) => u.role === 'CLIENT'));
    } catch (err) {
      console.error('Error fetching users');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/cases/${caseData.id}`, formData);
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al actualizar caso');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Expediente" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-black text-navy-900 ml-1 uppercase">Título del Caso</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white transition-all font-bold"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-navy-900 ml-1 uppercase text-[10px]">Nº Radicado</label>
          <input
            type="text"
            required
            value={formData.caseNumber}
            onChange={e => setFormData({ ...formData, caseNumber: e.target.value })}
            className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-black text-gold-600"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-navy-900 ml-1 uppercase text-[10px]">Tipo Honorario</label>
            <select
              value={formData.feeType}
              onChange={e => setFormData({ ...formData, feeType: e.target.value })}
              className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold"
            >
              <option value="FIXED">Valor Fijo ($)</option>
              <option value="PERCENTAGE">Porcentaje (%)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-navy-900 ml-1 uppercase text-[10px]">
              {formData.feeType === 'FIXED' ? 'Monto Honorarios' : 'Porcentaje (%)'}
            </label>
            <input
              type="number"
              required
              value={formData.fees}
              onChange={e => setFormData({ ...formData, fees: e.target.value })}
              className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-black"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center ml-1">
            <label className="text-sm font-bold text-navy-900 uppercase text-[10px]">Abogado Responsable</label>
            {!isAdmin && <span className="text-[8px] font-black bg-navy-100 text-navy-900 px-2 py-0.5 rounded uppercase tracking-widest">Protegido</span>}
          </div>
          <div className="relative">
            <select
              required
              disabled={!isAdmin}
              value={formData.lawyerId}
              onChange={e => setFormData({ ...formData, lawyerId: e.target.value })}
              className={`w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium ${!isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {!isAdmin && <option value={caseData.lawyerId}>{caseData.lawyer?.name}</option>}
              {isAdmin && lawyers.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            {!isAdmin && <ShieldCheck className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />}
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center ml-1">
            <label className="text-sm font-bold text-navy-900 uppercase text-[10px]">Cliente Titular</label>
            {!isAdmin && <span className="text-[8px] font-black bg-navy-100 text-navy-900 px-2 py-0.5 rounded uppercase tracking-widest">Solo Lectura</span>}
          </div>
          <div className="relative">
            <select
              required
              disabled={!isAdmin}
              value={formData.clientId}
              onChange={e => setFormData({ ...formData, clientId: e.target.value })}
              className={`w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium ${!isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {!isAdmin && <option value={caseData.clientId}>{caseData.client?.name}</option>}
              {isAdmin && clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {!isAdmin && <User className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-navy-900 ml-1 uppercase text-[10px]">Descripción / Objeto del Contrato</label>
          <textarea
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none h-24 font-medium"
          />
        </div>

        {/* External Links Section in Edit */}
        <div className="space-y-4 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
          <div className="flex justify-between items-center">
            <h4 className="text-[10px] font-black text-navy-900 uppercase tracking-widest">Vinculaciones Externas (Rama / Consultas)</h4>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, followUpLinks: [...formData.followUpLinks, { title: '', url: '' }] })}
              className="text-[10px] font-black uppercase text-gold-600 hover:underline"
            >
              + Añadir Enlace
            </button>
          </div>
          <div className="space-y-3">
            {formData.followUpLinks.map((link, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  placeholder="Título (Ej: Rama Judicial)"
                  className="flex-1 px-3 py-2 bg-white border border-slate-100 rounded-xl text-xs font-bold outline-none"
                  value={link.title}
                  onChange={e => {
                    const newLinks = [...formData.followUpLinks];
                    newLinks[idx].title = e.target.value;
                    setFormData({ ...formData, followUpLinks: newLinks });
                  }}
                />
                <input
                  placeholder="URL del proceso"
                  className="flex-[2] px-3 py-2 bg-white border border-slate-100 rounded-xl text-xs font-medium outline-none"
                  value={link.url}
                  onChange={e => {
                    const newLinks = [...formData.followUpLinks];
                    newLinks[idx].url = e.target.value;
                    setFormData({ ...formData, followUpLinks: newLinks });
                  }}
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, followUpLinks: formData.followUpLinks.filter((_, i) => i !== idx) })}
                  className="text-red-400 hover:text-red-600 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
            {formData.followUpLinks.length === 0 && (
              <p className="text-center py-4 text-[10px] text-slate-400 font-bold italic">No hay vinculaciones registradas</p>
            )}
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-4 bg-slate-100 text-navy-900 font-bold rounded-2xl hover:bg-slate-200 transition-all uppercase text-[10px] tracking-widest"
          >
            Volver
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-[2] py-4 bg-navy-900 text-white font-black rounded-2xl hover:bg-navy-800 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest"
          >
            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Actualizar Información'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditCaseModal;
