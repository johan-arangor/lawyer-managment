import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ConfirmAccountPage from './pages/ConfirmAccountPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import PublicCaseLookup from './pages/PublicCaseLookup';

const HomePage = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50"
  >
    <div className="glass p-10 rounded-[2.5rem] max-w-lg w-full text-center space-y-8">
      <div className="flex justify-center">
        <img
          src="/logo.png"
          alt="Enlace Jurídico Logo"
          className="h-24 w-auto object-contain"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      </div>
      <div className="space-y-2">
        <h1 className="text-4xl font-extrabold text-navy-900 tracking-tight">Enlace Jurídico</h1>
        <p className="text-slate-500 font-medium">Gestión Documental & Procesos Legales</p>
      </div>
      <div className="flex flex-col gap-3">
        <Link to="/login" className="btn-primary flex items-center justify-center">Iniciar Sesión</Link>
        <Link to="/lookup" className="text-navy-900 font-semibold hover:underline text-center">Consultar Estado de Caso</Link>
      </div>
    </div>

    <footer className="mt-12 text-slate-400 text-sm">
      &copy; 2026 code cloud | &lt;/code&gt; Todos los derechos reservados.
    </footer>
  </motion.div >
);

function App() {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/confirm-account" element={<ConfirmAccountPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/lookup" element={<PublicCaseLookup />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default App;
