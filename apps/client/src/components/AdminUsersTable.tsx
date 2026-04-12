import React, { useState, useEffect } from 'react';
import { User, Mail, Shield, Trash2, Plus, Edit, Folder, Loader2, AlertCircle, Key } from 'lucide-react';
import api from '../api/axios';
import Modal from './Modal';

const AdminUsersTable = ({ roleFilter }: { roleFilter: 'LAWYER' | 'CLIENT' }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [relatedCases, setRelatedCases] = useState<any[]>([]);

  // Form States
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await api.post('/users', { ...formData, role: roleFilter });
      setIsAddOpen(false);
      setFormData({ name: '', email: '', password: '' });
      fetchUsers();
    } catch (err) {
      alert('Error al crear usuario');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const { password, ...updateData } = formData;
      const payload: any = updateData;
      if (password) payload.password = password;

      await api.put(`/users/${selectedUser.id}`, payload);
      setIsEditOpen(false);
      fetchUsers();
    } catch (err) {
      alert('Error al actualizar');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este usuario?')) return;
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (err) {
      alert('Error al eliminar');
    }
  };

  const openCasesModal = async (u: any) => {
    setSelectedUser(u);
    setIsViewOpen(true);
    try {
      const res = await api.get('/cases');
      const filtered = res.data.filter((c: any) =>
        roleFilter === 'LAWYER' ? c.lawyerId === u.id : c.clientId === u.id
      );
      setRelatedCases(filtered);
    } catch (err) {
      console.error('Error fetching user cases');
    }
  };

  if (loading) return <div className="p-20 text-center text-slate-400 font-bold animate-pulse">Consultando base de datos Jurídica...</div>;

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
      <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
        <div>
          <h2 className="text-2xl font-black text-navy-900 flex items-center gap-3">
            {roleFilter === 'LAWYER' ? <Shield className="text-gold-600" /> : <User className="text-navy-900" />}
            Gestión de {roleFilter === 'LAWYER' ? 'Personal Jurídico' : 'Base de Clientes'}
          </h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
            {users.length} Registros encontrados
          </p>
        </div>
        <button onClick={() => { setFormData({ name: '', email: '', password: '' }); setIsAddOpen(true); }} className="btn-primary flex items-center gap-2 px-6 py-3">
          <Plus className="w-5 h-5" /> Registrar Nuevo
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 text-[10px] uppercase tracking-widest text-slate-400 font-black">
              <th className="px-8 py-5">Identificación / Nombre</th>
              <th className="px-8 py-5">Contacto</th>
              <th className="px-8 py-5">Fecha Alta</th>
              <th className="px-8 py-5 text-right">Acciones Administrativas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50/80 transition-all font-bold group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-navy-50 flex items-center justify-center text-navy-900 text-lg shadow-sm border border-navy-100 font-black">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-navy-900 text-sm font-black">{u.name}</p>
                      <p className={`text-[10px] uppercase px-2 py-0.5 rounded-md inline-block mt-1 ${u.role === 'ADMIN' ? 'bg-gold-100 text-gold-700' : 'bg-slate-100 text-slate-500'}`}>
                        {u.role === 'ADMIN' ? 'Director' : roleFilter === 'LAWYER' ? 'Abogado' : 'Titular'}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
                    <Mail className="w-4 h-4 text-slate-300" />
                    {u.email}
                  </div>
                </td>
                <td className="px-8 py-6 text-slate-400 text-xs font-bold uppercase">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="px-8 py-6 text-right space-x-1">
                  <button onClick={() => openCasesModal(u)} title="Ver Casos" className="p-3 text-gold-600 hover:bg-gold-50 rounded-2xl transition-all">
                    <Folder className="w-5 h-5" />
                  </button>
                  <button onClick={() => { setSelectedUser(u); setFormData({ name: u.name, email: u.email, password: '' }); setIsEditOpen(true); }} title="Editar" className="p-3 text-navy-600 hover:bg-navy-50 rounded-2xl transition-all">
                    <Edit className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleDelete(u.id)} title="Eliminar" className="p-3 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal: Agregar Usuario */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title={`Registrar ${roleFilter === 'LAWYER' ? 'Abogado' : 'Cliente'}`}>
        <form onSubmit={handleAdd} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-navy-900 ml-1">Nombre Completo</label>
            <input
              required
              className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-gold-400 outline-none"
              placeholder="Nombre y Apellidos"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-navy-900 ml-1">Correo Electrónico</label>
            <input
              required
              type="email"
              className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-gold-400 outline-none"
              placeholder="email@ejemplo.com"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-navy-900 ml-1">Contraseña Temporal</label>
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
              <input
                required
                type="password"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-gold-400 outline-none"
                placeholder="••••••••"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>
          <button disabled={formLoading} className="w-full py-4 bg-navy-900 text-white font-bold rounded-2xl shadow-xl flex items-center justify-center gap-2 hover:bg-navy-800 disabled:opacity-50 transition-all">
            {formLoading ? <Loader2 className="animate-spin" /> : 'Confirmar Registro'}
          </button>
        </form>
      </Modal>

      {/* Modal: Editar Usuario */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Actualizar Datos">
        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3 text-amber-700 text-sm font-medium">
            <AlertCircle className="shrink-0" />
            Atención: Los cambios en roles o accesos afectan inmediatamente.
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-navy-900 ml-1">Nombre</label>
            <input
              required
              className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-navy-900 ml-1">Email</label>
            <input
              required
              className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-navy-900 ml-1">Nueva Contraseña (Opcional)</label>
            <input
              type="password"
              className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none"
              placeholder="Dejar vacío para mantener actual"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
          <button disabled={formLoading} className="w-full py-4 bg-navy-900 text-white font-bold rounded-2xl shadow-xl flex items-center justify-center gap-2">
            {formLoading ? <Loader2 className="animate-spin" /> : 'Guardar Cambios'}
          </button>
        </form>
      </Modal>

      {/* Modal: Ver Casos */}
      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title={`Carga Jurídica: ${selectedUser?.name}`} size="lg">
        <div className="grid grid-cols-1 gap-4">
          {relatedCases.length === 0 ? (
            <p className="text-center py-10 text-slate-400 font-bold italic">No se registran procesos vinculados a este usuario.</p>
          ) : relatedCases.map(c => (
            <div key={c.id} className="p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100 flex justify-between items-center group hover:bg-white hover:shadow-lg transition-all">
              <div>
                <span className="text-[10px] font-black text-gold-600 bg-gold-50 px-2 py-0.5 rounded tracking-widest">{c.caseNumber}</span>
                <h4 className="text-navy-900 font-black mt-1">{c.title}</h4>
              </div>
              <div className="text-right">
                <p className="text-navy-900 font-black text-slate-400 uppercase">
                  {c.status === 'CLOSED' ? 'CERRADO' : c.status === 'IN_PROGRESS' ? 'EN PROCESO' : 'PENDIENTE'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default AdminUsersTable;
