import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, Loader2 } from 'lucide-react';
import api from '../api/axios';
import Swal from 'sweetalert2';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password, source: 'app' });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/dashboard');
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error de Acceso',
        text: err.response?.data?.error || 'Credenciales inválidas',
        confirmButtonColor: '#1a237e'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass p-8 rounded-[2.5rem] max-w-md w-full shadow-2xl"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-navy-900">Bienvenido</h2>
          <p className="text-slate-500">Inicia sesión en Enlace Jurídico</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-navy-900 ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-gold-400 outline-none transition-all"
                placeholder="correo@ejemplo.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-navy-900 ml-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-gold-400 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Entrar al Sistema'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link 
             to="/forgot-password"
             className="text-xs font-bold text-navy-900 hover:text-gold-600 transition-colors"
          >
            ¿Olvidaste tu contraseña o necesitas activar tu cuenta?
          </Link>
        </div>

        <p className="mt-8 text-center text-[10px] font-black uppercase tracking-widest text-slate-300">
          Enlace Jurídico • Seguridad Maestra
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
