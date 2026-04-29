import React, { useState, useEffect } from 'react';
import { User, Mail, Shield, Trash2, Edit, Folder, Loader2, Phone, FileText, MapPin, Search, Building2, UserPlus, CheckCircle2, RefreshCw, AlertTriangle, UserX, Send, Globe } from 'lucide-react';
import api from '../api/axios';
import Modal from './Modal';
import Swal from 'sweetalert2';

// Indicativos comunes (KISS)
const countryCodes = [
  { code: '+57', label: '🇨🇴' },
  { code: '+1', label: '🇺🇸' },
  { code: '+34', label: '🇪🇸' },
  { code: '+52', label: '🇲🇽' },
  { code: '+54', label: '🇦🇷' },
  { code: '+56', label: '🇨🇱' },
  { code: '+58', label: '🇻🇪' },
];

const AdminUsersTable = ({ roleFilter, hideFolder = false }: { roleFilter: 'LAWYER' | 'CLIENT', hideFolder?: boolean }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [relatedCases, setRelatedCases] = useState<any[]>([]);

  // Verification States
  const [verificationCode, setVerificationCode] = useState('');
  const [userCodeInput, setUserCodeInput] = useState('');

  // Form States
  const [formLoading, setFormLoading] = useState(false);
  const [phoneCode, setPhoneCode] = useState('+57');
  const [formData, setFormData] = useState({
    name: '', email: '', documentType: 'CC', documentNumber: '', businessName: '',
    phone: '', phoneSecondary: '', landline: '', address: '',
    contactName2: '', contactPhone2: '', contactEmail2: ''
  });

  const authUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data.filter((u: any) => u.role === roleFilter || (roleFilter === 'LAWYER' && u.role === 'ADMIN')));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{7,15}$/;

    if (!emailRegex.test(formData.email)) {
      Swal.fire('Error', 'El formato del correo electrónico no es válido.', 'warning');
      return false;
    }
    if (!phoneRegex.test(formData.phone)) {
      Swal.fire('Error', 'El teléfono debe contener entre 7 y 15 dígitos numéricos.', 'warning');
      return false;
    }
    return true;
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setFormLoading(true);
    try {
      const payload = { ...formData, phone: `${phoneCode}${formData.phone}` };

      if (isEditOpen) {
        const res = await api.put(`/users/${selectedUser.id}`, payload);
        Swal.fire({
          icon: 'success',
          title: 'Actualizado',
          text: res.data.message || 'Datos actualizados con éxito.',
          timer: 3000
        });
        setIsEditOpen(false);
      } else {
        await api.post('/users', { ...payload, role: roleFilter });
        setIsAddOpen(false);
        Swal.fire({ icon: 'success', title: 'Registrado', text: 'Se envió correo de activación.', timer: 3000 });
      }

      resetForm();
      fetchUsers();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || 'Operación fallida' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleResendToken = async (u: any) => {
    try {
      Swal.fire({ title: 'Enviando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      const res = await api.post(`/users/${u.id}/resend-confirmation`);
      Swal.fire('Éxito', res.data.message, 'success');
    } catch (err: any) {
      Swal.fire('Error', err.response?.data?.error || 'No se pudo reenviar', 'error');
    }
  };

  const generateCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setVerificationCode(code);
    setUserCodeInput('');
  };

  const handleConfirmDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userCodeInput.toUpperCase() !== verificationCode) return;

    setFormLoading(true);
    try {
      await api.delete(`/users/${selectedUser.id}`);
      setIsDeleteOpen(false);
      fetchUsers();
      Swal.fire({ icon: 'success', title: 'Desactivado', text: 'Usuario movido a la base de auditoría.' });
    } catch (err) {
      Swal.fire('Error', 'No se pudo completar la acción', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '', email: '', documentType: 'CC', documentNumber: '', businessName: '',
      phone: '', phoneSecondary: '', landline: '', address: '',
      contactName2: '', contactPhone2: '', contactEmail2: ''
    });
    setPhoneCode('+57');
  };

  const togglePrivateAccess = async (u: any) => {
    try {
      const newValue = !u.hasPrivateAreaAccess;
      await api.put(`/users/${u.id}`, { hasPrivateAreaAccess: newValue });
      
      setUsers(prev => prev.map(user => 
        user.id === u.id ? { ...user, hasPrivateAreaAccess: newValue } : user
      ));

      Swal.fire({
        icon: 'success',
        title: newValue ? 'Acceso Habilitado' : 'Acceso Restringido',
        text: newValue ? 'El cliente ahora puede ver sus expedientes en la web.' : 'El acceso al área privada ha sido revocado.',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire('Error', 'No se pudo actualizar el acceso web', 'error');
    }
  };

  const openEditModal = (u: any) => {
    setSelectedUser(u);
    // Extraer indicativo si existe (KISS simplificado)
    let phonePure = u.phone || '';
    if (u.phone) {
      countryCodes.forEach(c => {
        if (u.phone.startsWith(c.code)) {
          setPhoneCode(c.code);
          phonePure = u.phone.replace(c.code, '');
        }
      });
    }

    setFormData({
      ...u,
      phone: phonePure,
      businessName: u.businessName || '',
      documentNumber: u.documentNumber || '',
      address: u.address || ''
    });
    setIsEditOpen(true);
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    (u.documentNumber && u.documentNumber.includes(search)) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const openCasesModal = async (u: any) => {
    setSelectedUser(u);
    setIsViewOpen(true);
    try {
      const res = await api.get('/cases');
      const filtered = res.data.filter((c: any) =>
        u.role === 'LAWYER' ? c.lawyerId === u.id : c.clientId === u.id
      );
      setRelatedCases(filtered);
    } catch (err) {
      console.error('Error fetching user cases');
    }
  };

  if (loading) return <div className="p-20 text-center text-slate-400 font-bold animate-pulse">Consultando base de datos Jurídica...</div>;

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-8 border-b border-slate-100 bg-slate-50/30">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-2xl font-black text-navy-900 flex items-center gap-3 tracking-tight">
              {roleFilter === 'LAWYER' ? <Shield className="text-gold-600" /> : <User className="text-navy-900" />}
              {roleFilter === 'LAWYER' ? 'Personal Jurídico' : 'Base de Clientes'}
            </h2>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">
              {hideFolder ? 'Panel Administrativo General' : 'Gestión de Relaciones'} • {users.length} Miembros
            </p>
          </div>

          <div className="flex gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none text-sm font-bold shadow-inner"
                placeholder="Buscar identidad..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            {(authUser.role === 'ADMIN' || (authUser.role === 'LAWYER' && roleFilter === 'CLIENT')) && (
              <button
                onClick={() => { resetForm(); setIsAddOpen(true); }}
                className="bg-navy-900 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-navy-800 transition-all flex items-center gap-2 shadow-lg active:scale-95"
              >
                <UserPlus className="w-4 h-4" /> Registrar
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto min-h-[400px]">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 text-[10px] uppercase tracking-widest text-slate-400 font-black">
              <th className="px-8 py-5">Identidad Legal / Nombre</th>
              <th className="px-8 py-5">Localización y Contacto</th>
              <th className="px-8 py-5">Estado Cuenta</th>
              <th className="px-8 py-5 text-right">Jurisprudencia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filteredUsers.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50/80 transition-all font-bold group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg shadow-sm border font-black transition-all ${u.isConfirmed ? 'bg-navy-900 text-gold-400 border-navy-900' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-navy-900 text-sm font-black">{u.name}</p>
                        {u.documentType === 'NIT' && <Building2 className="w-3 h-3 text-gold-600" />}
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                        {u.documentType} {u.documentNumber} {u.businessName && `• ${u.businessName}`}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-slate-500 font-medium text-xs">
                      <Mail className="w-3 h-3 text-slate-300" /> {u.email}
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 font-medium text-xs">
                      <Phone className="w-3 h-3 text-slate-300" /> {u.phone}
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-col gap-2">
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit ${u.isConfirmed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {u.isConfirmed ? <CheckCircle2 className="w-3 h-3" /> : <RefreshCw className="w-3 h-3 animate-spin-slow" />}
                      {u.isConfirmed ? 'Confirmado' : 'Pendiente'}
                    </span>
                    {!u.isConfirmed && authUser.role === 'ADMIN' && (
                      <button
                        onClick={() => handleResendToken(u)}
                        className="text-[8px] font-black text-navy-400 uppercase flex items-center gap-1 hover:text-gold-600 transition-colors ml-1"
                      >
                        <Send className="w-2.5 h-2.5" /> Reenviar Activación
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-8 py-6 text-right space-x-1">
                  {!hideFolder && (
                    <button onClick={() => openCasesModal(u)} className="p-3 text-gold-600 hover:bg-gold-50 rounded-2xl transition-all" title="Ver Expedientes"><Folder className="w-5 h-5" /></button>
                  )}
                  {roleFilter === 'CLIENT' && (authUser.role === 'ADMIN' || authUser.role === 'LAWYER') && (
                    <button 
                      onClick={() => togglePrivateAccess(u)} 
                      className={`p-3 rounded-2xl transition-all ${u.hasPrivateAreaAccess ? 'text-emerald-600 bg-emerald-50 shadow-inner' : 'text-slate-300 hover:bg-slate-50'}`}
                      title={u.hasPrivateAreaAccess ? "Acceso Web Habilitado" : "Habilitar Acceso Web"}
                    >
                      <Globe className="w-5 h-5" />
                    </button>
                  )}
                  {authUser.role === 'ADMIN' && (
                    <>
                      <button onClick={() => openEditModal(u)} className="p-3 text-navy-600 hover:bg-navy-50 rounded-2xl transition-all" title="Editar Identidad"><Edit className="w-5 h-5" /></button>
                      <button onClick={() => { setSelectedUser(u); generateCode(); setIsDeleteOpen(true); }} className="p-3 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all" title="Borrado Judicial"><Trash2 className="w-5 h-5" /></button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL: REGISTRO / EDICIÓN */}
      <Modal
        isOpen={isAddOpen || isEditOpen}
        onClose={() => { setIsAddOpen(false); setIsEditOpen(false); resetForm(); }}
        title={`${isEditOpen ? 'Editar' : 'Registrar'} Identidad: ${roleFilter === 'LAWYER' ? 'Abogado' : 'Cliente'}`}
        size="lg"
      >
        <form onSubmit={handleCreateOrUpdate} className="space-y-8">
          <div className="p-4 bg-navy-50 rounded-2xl border border-navy-100 text-navy-800 text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
            <Shield className="w-5 h-5 text-gold-600" />
            {isEditOpen ? 'Si modificas el correo, se requerirá una nueva confirmación de identidad.' : 'Flujo de identidad centralizada. El usuario recibirá un enlace para activar su cuenta.'}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-1 gap-8">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2">
                <FileText className="w-3 h-3" /> Datos Legales
              </h4>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-navy-900 uppercase">Nombre Completo</label>
                <input required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold focus:bg-white focus:border-gold-400 transition-all shadow-inner" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>

              <div className="flex gap-4">
                <div className="w-1/3 space-y-1">
                  <label className="text-[10px] font-black text-navy-900 uppercase">Tipo</label>
                  <select className="w-full px-3 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-black text-xs" value={formData.documentType} onChange={e => setFormData({ ...formData, documentType: e.target.value })}>
                    <option value="CC">CC</option>
                    <option value="TI">TI</option>
                    <option value="CE">CE</option>
                    <option value="NIT">NIT</option>
                  </select>
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-black text-navy-900 uppercase">Número Identificación</label>
                  <input required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold focus:bg-white focus:border-gold-400 transition-all shadow-inner" value={formData.documentNumber || ''} onChange={e => setFormData({ ...formData, documentNumber: e.target.value })} />
                </div>
              </div>

              {formData.documentType === 'NIT' && (
                <div className="space-y-1 animate-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] font-black text-gold-600 uppercase">Razón Social (Jurídica)</label>
                  <input required className="w-full px-4 py-3 bg-gold-50/20 border border-gold-100 rounded-xl outline-none font-bold" placeholder="Nombre de la empresa..." value={formData.businessName} onChange={e => setFormData({ ...formData, businessName: e.target.value })} />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2">
                <Globe className="w-3 h-3" /> Contacto Global
              </h4>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-navy-900 uppercase">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input required type="email" className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold focus:bg-white focus:border-gold-400 transition-all shadow-inner" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-navy-900 uppercase">Celular Principal</label>
                <div className="flex gap-2">
                  <select
                    className="w-20 px-2 py-3 bg-slate-100 border border-slate-200 rounded-xl outline-none font-black text-[10px]"
                    value={phoneCode}
                    onChange={e => setPhoneCode(e.target.value)}
                  >
                    {countryCodes.map(c => <option key={c.code} value={c.code}>{c.label} {c.code}</option>)}
                  </select>
                  <input required className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold focus:bg-white focus:border-gold-400 transition-all shadow-inner" placeholder="3001234567" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-navy-900 uppercase">Dirección Física</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold focus:bg-white focus:border-gold-400 transition-all shadow-inner" value={formData.address || ''} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                </div>
              </div>
            </div>
          </div>

          <button disabled={formLoading} className="w-full py-5 bg-navy-900 text-white font-black rounded-3xl shadow-2xl flex items-center justify-center gap-3 hover:bg-navy-800 disabled:opacity-50 transition-all uppercase text-xs tracking-widest shadow-navy-100">
            {formLoading ? <Loader2 className="animate-spin w-5 h-5" /> : (isEditOpen ? <RefreshCw className="w-5 h-5 text-gold-400" /> : <UserPlus className="w-5 h-5 text-gold-400" />)}
            {isEditOpen ? 'Guardar Cambios Judiciales' : 'Iniciar Proceso de Activación'}
          </button>
        </form>
      </Modal>

      {/* MODAL: BORRADO (MISMA LÓGICA QUE ANTES) */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Protocolo de Desactivación">
        <form onSubmit={handleConfirmDelete} className="space-y-6">
          <div className="p-6 bg-red-50 rounded-3xl border border-red-100 space-y-3">
            <div className="flex items-center gap-3 text-red-600 font-black text-xs uppercase tracking-widest">
              <AlertTriangle className="w-5 h-5" /> Acción Crítica de Identidad
            </div>
            <p className="text-red-700 text-sm font-medium">Estás a punto de desactivar a <b>{selectedUser?.name}</b>. Sus datos serán ocultados pero se mantendrán en el archivo por integridad judicial.</p>
          </div>

          <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-200 flex flex-col items-center gap-6 shadow-inner">
            <div className="text-center space-y-2">
              <p className="text-[10px] font-black text-navy-900 uppercase tracking-widest">Código de Confirmación</p>
              <div className="text-3xl font-black text-navy-900 tracking-[0.6em] py-3 px-8 bg-white border-2 border-navy-900 rounded-2xl select-none shadow-md">{verificationCode}</div>
            </div>
            <input
              required
              placeholder="Digita el código..."
              className={`w-full max-w-xs p-5 bg-white border-2 rounded-2xl text-center font-black text-xl outline-none transition-all ${userCodeInput === verificationCode ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 focus:border-navy-900'}`}
              value={userCodeInput}
              onChange={e => setUserCodeInput(e.target.value.toUpperCase())}
              maxLength={6}
            />
          </div>

          <button
            disabled={formLoading || userCodeInput !== verificationCode}
            className={`w-full py-5 rounded-3xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${userCodeInput === verificationCode ? 'bg-red-600 text-white shadow-xl shadow-red-500/20' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
          >
            {formLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <UserX className="w-5 h-5" />}
            Confirmar Desactivación
          </button>
        </form>
      </Modal>

      {/* MODAL: EXPEDIENTES */}
      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title={`Historial Judicial: ${selectedUser?.name}`} size="lg">
        <div className="space-y-4">
          {relatedCases.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
              <Folder className="w-10 h-10 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-400 font-black text-xs uppercase italic">No se registran procesos vinculados</p>
            </div>
          ) : relatedCases.map(c => (
            <div key={c.id} className="p-6 bg-white rounded-[2rem] border border-slate-100 flex justify-between items-center group hover:border-gold-300 hover:shadow-xl transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-navy-50 rounded-2xl flex items-center justify-center text-navy-900 font-bold text-xs uppercase tracking-tighter shadow-inner">
                  {c.caseNumber.substring(0, 3)}
                </div>
                <div>
                  <h4 className="text-navy-900 font-black">{c.title}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{c.caseNumber}</p>
                </div>
              </div>
              <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${c.status === 'CLOSED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                {c.status}
              </span>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default AdminUsersTable;
