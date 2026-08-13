import React, { useState } from 'react';
import { User, Mail, Shield, Key, Loader2, Phone, MapPin, RefreshCw, CheckCircle2, Lock } from 'lucide-react';
import api from '../api/axios';
import Modal from './Modal';
import Swal from 'sweetalert2';

const ProfileModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'security'>('info');

  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    phoneSecondary: user.phoneSecondary || '',
    address: user.address || ''
  });

  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put(`/users/${user.id}`, formData);
      Swal.fire({
        icon: 'success',
        title: 'Perfil Actualizado',
        text: res.data.message || 'Tus datos han sido guardados.',
        timer: 3000
      });
      // Update local storage
      localStorage.setItem('user', JSON.stringify({ ...user, ...res.data.user }));
      onClose();
    } catch (err: any) {
      Swal.fire('Error', err.response?.data?.error || 'No se pudo actualizar el perfil', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (securityData.newPassword !== securityData.confirmPassword) {
      return Swal.fire('Error', 'Las contraseñas no coinciden', 'error');
    }

    setLoading(true);
    try {
      await api.post(`/users/${user.id}/change-password`, {
        currentPassword: securityData.currentPassword,
        newPassword: securityData.newPassword
      });
      Swal.fire('Éxito', 'Contraseña actualizada correctamente.', 'success');
      setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      onClose();
    } catch (err: any) {
      Swal.fire('Error', err.response?.data?.error || 'No se pudo cambiar la contraseña', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gestionar Mi Perfil" size="lg">
      <div className="flex gap-4 p-1 bg-slate-100 rounded-2xl mb-8">
        <button 
          onClick={() => setActiveTab('info')}
          className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === 'info' ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-400 hover:text-navy-900'}`}
        >
          <User className="w-4 h-4" /> Información Personal
        </button>
        <button 
          onClick={() => setActiveTab('security')}
          className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === 'security' ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-400 hover:text-navy-900'}`}
        >
          <Lock className="w-4 h-4" /> Seguridad de Cuenta
        </button>
      </div>

      {activeTab === 'info' ? (
        <form onSubmit={handleUpdateProfile} className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                 <label className="text-[10px] font-black text-navy-900 uppercase ml-1">Nombre Completo</label>
                 <input 
                   required
                   className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold focus:bg-white focus:border-gold-400"
                   value={formData.name}
                   onChange={e => setFormData({ ...formData, name: e.target.value })}
                 />
              </div>
              <div className="space-y-1 opacity-70">
                 <label className="text-[10px] font-black text-navy-900 uppercase ml-1">Correo (Validado)</label>
                 <div className="relative">
                   <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                   <input 
                     readOnly
                     className="w-full pl-11 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-xl outline-none font-bold"
                     value={formData.email}
                   />
                 </div>
              </div>
              <div className="space-y-1">
                 <label className="text-[10px] font-black text-navy-900 uppercase ml-1">Celular Principal</label>
                 <div className="relative">
                   <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                   <input 
                     className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold"
                     value={formData.phone}
                     onChange={e => setFormData({ ...formData, phone: e.target.value })}
                   />
                 </div>
              </div>
              <div className="space-y-1">
                 <label className="text-[10px] font-black text-navy-900 uppercase ml-1">Celular Secundario</label>
                 <input 
                   className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold"
                   value={formData.phoneSecondary}
                   onChange={e => setFormData({ ...formData, phoneSecondary: e.target.value })}
                 />
              </div>
              <div className="md:col-span-2 space-y-1">
                 <label className="text-[10px] font-black text-navy-900 uppercase ml-1">Dirección de Notificación</label>
                 <div className="relative">
                   <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                   <input 
                     className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold"
                     value={formData.address}
                     onChange={e => setFormData({ ...formData, address: e.target.value })}
                   />
                 </div>
              </div>
           </div>
           <button disabled={loading} className="w-full py-5 bg-navy-900 text-white font-black rounded-3xl flex items-center justify-center gap-3 hover:bg-navy-800 transition-all shadow-xl shadow-navy-100 uppercase text-xs tracking-widest">
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <RefreshCw className="w-5 h-5 text-gold-400" />}
              Guardar Cambios de Perfil
           </button>
        </form>
      ) : (
        <form onSubmit={handleChangePassword} className="space-y-6">
           <div className="p-4 bg-navy-50 rounded-2xl border border-navy-100 text-navy-800 text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
              <Shield className="w-5 h-5 text-gold-600" />
              Tu seguridad es prioridad. Usa una clave de al menos 8 caracteres con números y símbolos.
           </div>

           <div className="space-y-4">
              <div className="space-y-1">
                 <label className="text-[10px] font-black text-navy-900 uppercase ml-1">Contraseña Actual</label>
                 <input 
                   required
                   type="password"
                   className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold focus:border-gold-400"
                   value={securityData.currentPassword}
                   onChange={e => setSecurityData({ ...securityData, currentPassword: e.target.value })}
                 />
              </div>
              <div className="space-y-1">
                 <label className="text-[10px] font-black text-navy-900 uppercase ml-1">Nueva Contraseña</label>
                 <div className="relative">
                   <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                   <input 
                     required
                     type="password"
                     className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold focus:border-gold-400"
                     value={securityData.newPassword}
                     onChange={e => setSecurityData({ ...securityData, newPassword: e.target.value })}
                   />
                 </div>
              </div>
              <div className="space-y-1">
                 <label className="text-[10px] font-black text-navy-900 uppercase ml-1">Confirmar Nueva Contraseña</label>
                 <input 
                   required
                   type="password"
                   className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold focus:border-gold-400"
                   value={securityData.confirmPassword}
                   onChange={e => setSecurityData({ ...securityData, confirmPassword: e.target.value })}
                 />
              </div>
           </div>

           <button disabled={loading} className="w-full py-5 bg-navy-900 text-white font-black rounded-3xl flex items-center justify-center gap-3 hover:bg-navy-800 transition-all shadow-xl shadow-navy-100 uppercase text-xs tracking-widest">
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <CheckCircle2 className="w-5 h-5 text-gold-400" />}
              Actualizar Clave Maestra
           </button>
        </form>
      )}
    </Modal>
  );
};

export default ProfileModal;
