import React, { useState, useEffect } from 'react';
import { Trash2, Loader2, AlertCircle, CheckCircle, FileText, Tag, Search, User, CreditCard } from 'lucide-react';
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
  const [clientSearch, setClientSearch] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (isOpen) {
      fetchData();
      setStatus(null);
      setClientSearch('');
      if (user.role === 'LAWYER') {
        setFormData(prev => ({ ...prev, lawyerId: user.id }));
      }
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      const [usersRes, clientsRes] = await Promise.all([
        api.get('/users'),
        api.get('/users/clients')
      ]);
      setLawyers(usersRes.data.filter((u: any) => u.role === 'LAWYER' || u.role === 'ADMIN'));
      setClients(clientsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) || 
    c.documentNumber?.includes(clientSearch)
  );

  const selectedClient = clients.find(c => c.id === formData.clientId);

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
    const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/;
    const invalidLink = formData.followUpLinks.find(l => l.url && !urlRegex.test(l.url));
    if (invalidLink) {
      setStatus({ type: 'error', msg: `El enlace "${invalidLink.title || invalidLink.url}" no tiene un formato de URL válido.` });
      return;
    }

    if (!formData.clientId) {
      setStatus({ type: 'error', msg: 'Debe seleccionar un cliente para el proceso.' });
      return;
    }
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
    <Modal isOpen={isOpen} onClose={onClose} title="Radicación de Nuevo Expediente" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {status && (
          <div className={`p-4 rounded-2xl flex items-center gap-3 font-bold text-sm animate-in fade-in slide-in-from-top-2 ${status.type === 'success' ? 'bg-green-50 text-green-700 shadow-sm border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
            {status.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {status.msg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-navy-900 ml-1 uppercase tracking-widest">Título del Caso</label>
            <div className="relative">
              <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                required
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-[1.25rem] focus:ring-2 focus:ring-gold-400 outline-none font-bold text-sm"
                placeholder="Ej: Divorcio Pérez"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-navy-900 ml-1 uppercase tracking-widest">Nº Radicado / Serial</label>
            <div className="relative">
              <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                required
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-[1.25rem] focus:ring-2 focus:ring-gold-400 outline-none font-bold text-sm"
                placeholder="EXP-100-2024"
                value={formData.caseNumber}
                onChange={e => setFormData({ ...formData, caseNumber: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-navy-900 ml-1 uppercase tracking-widest">Plan de Honorarios</label>
            <select
              className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-[1.25rem] outline-none font-bold text-sm"
              value={formData.feeType}
              onChange={e => setFormData({ ...formData, feeType: e.target.value })}
            >
              <option value="FIXED">Valor Fijo ($)</option>
              <option value="PERCENTAGE">Porcentaje (%)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-navy-900 ml-1 uppercase tracking-widest">
              {formData.feeType === 'FIXED' ? 'Monto Pactado' : 'Porcentaje Cuota Litis'}
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
                className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-[1.25rem] outline-none font-black text-sm"
                placeholder={formData.feeType === 'FIXED' ? '0.00' : '20'}
              />
            </div>
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] font-black text-navy-900 ml-1 uppercase tracking-widest">Abogado Responsable</label>
            <select
              required
              disabled={user.role === 'LAWYER'}
              className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-[1.25rem] focus:ring-2 focus:ring-gold-400 outline-none font-bold text-sm disabled:opacity-75 disabled:cursor-not-allowed"
              value={formData.lawyerId}
              onChange={e => setFormData({ ...formData, lawyerId: e.target.value })}
            >
              <option value="">Seleccionar Abogado</option>
              {lawyers.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>

          {/* BUSCADOR DE CLIENTES MEJORADO */}
          <div className="md:col-span-2 space-y-4 pt-2">
            <div className="flex justify-between items-center px-1">
               <label className="text-[10px] font-black text-navy-900 uppercase tracking-widest">Titular / Cliente</label>
               {selectedClient && (
                  <span className="text-[9px] font-black text-gold-600 bg-gold-50 px-2 py-0.5 rounded flex items-center gap-1 uppercase">
                    <CreditCard className="w-3 h-3" /> {selectedClient.documentNumber}
                  </span>
               )}
            </div>
            
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  type="text"
                  placeholder="Buscar por Nombre o Documento (Cédula/NIT)..."
                  className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-[1.5rem] focus:border-gold-400 outline-none font-bold text-sm transition-all"
                  value={clientSearch}
                  onChange={(e) => {
                    setClientSearch(e.target.value);
                    if (formData.clientId) setFormData({...formData, clientId: ''});
                  }}
                />
              </div>

              {clientSearch && !formData.clientId && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-[1.5rem] shadow-2xl z-20 max-h-60 overflow-y-auto p-2 scrollbar-none animate-in fade-in slide-in-from-top-2">
                  {filteredClients.length > 0 ? filteredClients.map(c => (
                    <div 
                      key={c.id} 
                      onClick={() => {
                        setFormData({...formData, clientId: c.id});
                        setClientSearch(c.name);
                      }}
                      className="p-4 hover:bg-slate-50 rounded-2xl cursor-pointer transition-colors flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-navy-50 rounded-xl group-hover:bg-gold-50 transition-colors">
                          <User className="w-4 h-4 text-navy-900" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-navy-900 leading-none">{c.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">ID: {c.documentNumber}</p>
                        </div>
                      </div>
                      <div className="text-[10px] font-black text-slate-300 uppercase opacity-0 group-hover:opacity-100 transition-opacity">Seleccionar</div>
                    </div>
                  )) : (
                    <div className="p-10 text-center text-slate-400 italic text-sm">No se encontraron clientes con esos datos</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2 mt-4">
          <label className="text-[10px] font-black text-navy-900 ml-1 uppercase tracking-widest">Relato de Hechos y Pretensiones</label>
          <textarea
            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] focus:ring-2 focus:ring-gold-400 outline-none h-32 font-medium text-sm text-slate-600 leading-relaxed"
            placeholder="Describe los antecedentes del caso..."
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div className="bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100 mt-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-black text-navy-900 text-[10px] uppercase tracking-widest">Enlaces Rama Judicial</h4>
            <button
              type="button"
              onClick={handleAddLink}
              className="text-gold-600 bg-white px-3 py-1.5 rounded-xl shadow-sm hover:translate-y-[-2px] transition-all text-[10px] font-black uppercase"
            >
              + Añadir Link
            </button>
          </div>

          <div className="space-y-3">
            {formData.followUpLinks.length === 0 && <p className="text-center text-[10px] text-slate-400 py-4 font-bold italic uppercase">Vincule consultas externas si están disponibles</p>}
            {formData.followUpLinks.map((link, idx) => (
              <div key={idx} className="flex gap-3 animate-in fade-in zoom-in-95">
                <input
                  placeholder="Título (Ej: Notificaciones)"
                  className="flex-1 px-4 py-3 bg-white rounded-xl border border-slate-100 shadow-sm text-[11px] font-black outline-none"
                  value={link.title}
                  onChange={e => updateLink(idx, 'title', e.target.value)}
                />
                <input
                  placeholder="URL del Link"
                  className="flex-[2] px-4 py-3 bg-white rounded-xl border border-slate-100 shadow-sm text-[11px] font-medium outline-none"
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
            className="px-8 py-4 text-slate-400 font-bold hover:bg-slate-100 rounded-[1.25rem] transition-all text-xs uppercase"
          >
            Descartar
          </button>
          <button
            disabled={loading || !formData.clientId}
            className="flex-1 py-4 bg-navy-900 text-white font-black rounded-[1.5rem] shadow-2xl flex items-center justify-center gap-3 hover:bg-navy-800 disabled:opacity-50 active:scale-95 transition-all uppercase text-xs tracking-widest"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
            Radicar Nuevo Expediente
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateCaseModal;
