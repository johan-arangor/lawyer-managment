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
    description: ''
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
          description: caseData.description || ''
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
