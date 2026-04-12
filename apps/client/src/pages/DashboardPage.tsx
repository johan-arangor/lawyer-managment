import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, FileText, User, Plus, LogOut, Search, DollarSign, Shield, TrendingUp, BarChart3, Wallet, ArrowUpRight, CheckCircle2, Clock } from 'lucide-react';
import api from '../api/axios';
import CreateCaseModal from '../components/CreateCaseModal';
import CaseDetailsSidebar from '../components/CaseDetailsSidebar';
import AdminUsersTable from '../components/AdminUsersTable';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface Case {
  id: string;
  title: string;
  caseNumber: string;
  status: string;
  fees: string;
  paidBalance: string;
  feeType: string;
  client: { name: string };
  lawyer: { name: string };
  statusUpdatedAt?: string;
  createdAt: string;
}

const DashboardPage = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('cases'); // 'cases', 'clients', 'income', 'users'
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'ACTIVE' | 'CLOSED'>('ACTIVE');

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (caseIdToUpdate?: string) => {
    setLoading(true);
    try {
      const [casesRes, statsRes] = await Promise.all([
        api.get('/cases'),
        api.get('/cases/stats')
      ]);
      setCases(casesRes.data);
      setStats(statsRes.data);

      if (caseIdToUpdate) {
        handleSelectCase(caseIdToUpdate);
      }
    } catch (err) {
      console.error('Error fetching data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCase = async (id: string) => {
    try {
      const res = await api.get(`/cases/${id}`);
      setSelectedCase(res.data);
    } catch (err) {
      console.error('Error fetching case details');
    }
  };

  const filteredCases = cases.filter((c: any) => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.caseNumber.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = viewMode === 'ACTIVE' ? c.status !== 'CLOSED' : c.status === 'CLOSED';
    return matchesSearch && matchesStatus;
  });

  const calculateDays = (date?: string, fallback?: string) => {
    const finalDate = date || fallback;
    if (!finalDate) return 0;
    const diff = new Date().getTime() - new Date(finalDate).getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  const logout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  const formatCurrency = (val: any) => {
    const num = Number(val);
    return num === 0 ? '$0' : isNaN(num) ? '$0' : `$${num.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-navy-900 text-white flex flex-col p-6 hidden md:flex h-screen sticky top-0">
        <div className="mb-10 flex items-center gap-3">
          <div className="bg-gold-400 p-2 rounded-lg shadow-lg shadow-gold-500/20">
            <Briefcase className="text-navy-900 w-6 h-6" />
          </div>
          <span className="font-bold text-xl tracking-tight">Enlace Jurídico</span>
        </div>

        <nav className="flex-1 space-y-2">
          <button
            onClick={() => setActiveView('cases')}
            className={`flex items-center gap-3 w-full p-3 rounded-xl font-medium transition-all ${activeView === 'cases' ? 'bg-gold-400 text-navy-900 shadow-lg' : 'hover:bg-white/5 text-slate-300'}`}
          >
            <FileText className="w-5 h-5" /> Expedientes
          </button>

          {(user.role === 'ADMIN' || user.role === 'LAWYER') && (
            <button
              onClick={() => setActiveView('clients')}
              className={`flex items-center gap-3 w-full p-3 rounded-xl font-medium transition-all ${activeView === 'clients' ? 'bg-gold-400 text-navy-900 shadow-lg' : 'hover:bg-white/5 text-slate-300'}`}
            >
              <User className="w-5 h-5" /> Mis Clientes
            </button>
          )}

          {user.role === 'ADMIN' && (
            <>
              <button
                onClick={() => setActiveView('lawyers')}
                className={`flex items-center gap-3 w-full p-3 rounded-xl font-medium transition-all ${activeView === 'lawyers' ? 'bg-gold-400 text-navy-900 shadow-lg' : 'hover:bg-white/5 text-slate-300'}`}
              >
                <Shield className="w-5 h-5" /> Abogados
              </button>
              <button
                onClick={() => setActiveView('income')}
                className={`flex items-center gap-3 w-full p-3 rounded-xl font-medium transition-all ${activeView === 'income' ? 'bg-gold-400 text-navy-900 shadow-lg' : 'hover:bg-white/5 text-slate-300'}`}
              >
                <DollarSign className="w-5 h-5" /> Mis Ingresos
              </button>
              <div className="pt-4 mt-4 border-t border-white/10">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-3 mb-2">Administración</p>
                <button
                  onClick={() => setActiveView('users_all')}
                  className={`flex items-center gap-3 w-full p-3 rounded-xl font-medium transition-all ${activeView === 'users_all' ? 'bg-gold-400 text-navy-900 shadow-lg' : 'hover:bg-white/5 text-slate-300'}`}
                >
                  <User className="w-5 h-5" /> Todos los Usuarios
                </button>
              </div>
            </>
          )}
        </nav>

        <button
          onClick={logout}
          className="flex items-center gap-3 w-full p-3 rounded-xl font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all mt-auto"
        >
          <LogOut className="w-5 h-5" /> Cerrar Sesión
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-100 p-6 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-black text-navy-900 tracking-tight">
              {activeView === 'cases' ? 'Gestión de Procesos' :
                activeView === 'clients' ? 'Directorio de Clientes' :
                  activeView === 'lawyers' ? 'Cuerpo Jurídico' : 
                    activeView === 'users_all' ? 'Gestión General de Usuarios' : 'Panel Financiero'}
            </h1>
            {activeView === 'cases' && (
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button onClick={() => setViewMode('ACTIVE')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${viewMode === 'ACTIVE' ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-400'}`}>Activos</button>
                <button onClick={() => setViewMode('CLOSED')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${viewMode === 'CLOSED' ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-400'}`}>Cerrados</button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {activeView === 'cases' && (user.role === 'ADMIN' || user.role === 'LAWYER') && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-navy-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-navy-800 transition-all shadow-lg active:scale-95"
              >
                <Plus className="w-5 h-5" /> Nuevo Caso
              </button>
            )}
            <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
              <div className="bg-navy-900 w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                {user.name?.charAt(0)}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-xs font-black text-navy-900 leading-none">{user.name}</p>
                <p className="text-[10px] text-gold-600 font-bold uppercase">{user.role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/50">
          {activeView === 'cases' ? (
            <div className="max-w-12xl mx-auto space-y-8">
              {/* Dashboard Case Stats - Compact Header style */}
              <div className="flex items-center justify-end gap-4 mb-4">
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Activos</p>
                    <p className="text-xl font-black text-navy-900">{stats?.inProgress || 0}</p>
                  </div>
                  <div className="h-8 w-px bg-slate-200" />
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cerrados</p>
                    <p className="text-xl font-black text-navy-900">{stats?.closed || 0}</p>
                  </div>
                </div>
              </div>

              {/* SearchBar */}
              <div className="relative group max-w-2xl">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-gold-500 transition-colors w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar por título, radicado o cliente..."
                  className="w-full pl-16 pr-6 py-5 bg-white border border-slate-100 rounded-[2rem] outline-none shadow-sm focus:ring-4 focus:ring-gold-400/5 focus:border-gold-400 transition-all font-medium text-slate-600"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
                  <div className="w-12 h-12 border-4 border-navy-900/10 border-t-gold-400 rounded-full animate-spin" />
                  <p className="text-xs font-black text-navy-900 uppercase tracking-widest">Sincronizando Expedientes...</p>
                </div>
              ) : filteredCases.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
                  <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="text-slate-300 w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-black text-navy-900">No se encontraron expedientes</h3>
                  <p className="text-slate-400 font-medium">Ajusta tu búsqueda o cambia el filtro de estado.</p>
                </div>
              ) : (
                <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-50 bg-slate-50/50">
                        <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Radicado / Título</th>
                        <th className="py-6 px-10 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vínculo Humano</th>
                        <th className="py-6 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado del Proceso</th>
                        {user.role === 'ADMIN' && <th className="py-6 text-right pr-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Métricas Económicas</th>}
                        <th className="py-6 px-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredCases.map((c: any) => (
                        <motion.tr
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={c.id}
                          className="group hover:bg-slate-50/80 cursor-pointer transition-colors"
                          onClick={() => handleSelectCase(c.id)}
                        >
                          <td className="py-6 px-8">
                            <span className="bg-navy-50 text-navy-900 text-[9px] font-black px-2 py-1 rounded-lg uppercase mb-2 inline-block">ID: {c.caseNumber}</span>
                            <h4 className="font-black text-navy-900 group-hover:text-gold-600 transition-colors">{c.title}</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3" /> Radicado hace {calculateDays(c.createdAt)} días
                            </p>
                          </td>
                          <td className="py-6 px-10">
                            <div className="flex items-center gap-3">
                              <div className="bg-slate-100 p-2 rounded-xl group-hover:bg-gold-50 transition-colors">
                                <User className="text-slate-400 group-hover:text-gold-600" />
                              </div>
                              <div>
                                <p className="text-xs font-black text-navy-900">{c.client?.name}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Responsable: {c.lawyer?.name}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-6 px-4 text-center">
                            <span className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${c.status === 'PENDING' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                              c.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700 border-blue-200 shadow-lg shadow-blue-100' :
                                'bg-emerald-100 text-emerald-700 border-emerald-200'
                              }`}>
                              {c.status === 'CLOSED' ? 'FIRMADO / CERRADO' : c.status === 'IN_PROGRESS' ? 'EN PROCESO' : 'RADICADO'}
                            </span>
                          </td>
                          {user.role === 'ADMIN' && (
                            <td className="py-6 text-right pr-6">
                              <p className="text-sm font-black text-navy-900">
                                {c.feeType === 'PERCENTAGE' ? `${c.fees}%` : formatCurrency(c.fees)}
                              </p>
                              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-tighter">Cobrado: {formatCurrency(c.paidBalance)}</p>
                            </td>
                          )}
                          <td className="py-6 text-right pr-2">
                            <button
                              className="p-3 bg-white border border-slate-100 text-navy-900 rounded-xl hover:bg-navy-900 hover:text-white transition-all shadow-sm hover:shadow-lg active:scale-95"
                            >
                              <ArrowUpRight className="w-4 h-4" />
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : activeView === 'clients' ? (
            <AdminUsersTable roleFilter="CLIENT" />
          ) : activeView === 'lawyers' ? (
            <AdminUsersTable roleFilter="LAWYER" />
          ) : activeView === 'users_all' ? (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
               <AdminUsersTable roleFilter="LAWYER" hideFolder={true} />
               <AdminUsersTable roleFilter="CLIENT" hideFolder={true} />
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in duration-500">
              {/* Financial View with Summary Mini-Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                <div className="bg-white p-6 rounded-[2rem] border-l-4 border-l-emerald-500 border border-slate-100 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Valor Ganado (Recaudado)</p>
                    <h3 className="text-2xl font-black text-emerald-600">{formatCurrency(stats?.totalPaid)}</h3>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-emerald-100" />
                </div>
                <div className="bg-white p-6 rounded-[2rem] border-l-4 border-l-red-500 border border-slate-100 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Cartera (Por Cobrar)</p>
                    <h3 className="text-2xl font-black text-red-500">{formatCurrency(Number(stats?.totalFees) - Number(stats?.totalPaid))}</h3>
                  </div>
                  <Wallet className="w-8 h-8 text-red-100" />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-xl font-black text-navy-900 tracking-tight">Recaudo Mensual</h3>
                      <p className="text-xs text-slate-400 font-bold uppercase mt-1">Ingresos reales percibidos</p>
                    </div>
                    <BarChart3 className="text-gold-400 w-6 h-6" />
                  </div>
                  <div className="h-[300px] w-full">
                    {stats?.chartData ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                            dy={10}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                            tickFormatter={(val) => `$${val / 1000}k`}
                          />
                          <Tooltip
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                            itemStyle={{ fontWeight: 800, fontSize: '12px' }}
                          />
                          <Bar dataKey="ingresos" fill="#fbbf24" radius={[6, 6, 0, 0]} barSize={24} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-300 font-bold italic">Cargando métricas...</div>
                    )}
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-xl font-black text-navy-900 tracking-tight">Relación de Casos</h3>
                      <p className="text-xs text-slate-400 font-bold uppercase mt-1">Nuevos procesos por mes</p>
                    </div>
                    <TrendingUp className="text-navy-900 w-6 h-6" />
                  </div>
                  <div className="h-[300px] w-full">
                    {stats?.chartData ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorCasos" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0f172a" stopOpacity={0.1} />
                              <stop offset="95%" stopColor="#0f172a" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                            dy={10}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                          />
                          <Tooltip
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                            itemStyle={{ fontWeight: 800, fontSize: '12px' }}
                          />
                          <Area type="monotone" dataKey="casos" stroke="#0f172a" strokeWidth={3} fillOpacity={1} fill="url(#colorCasos)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-300 font-bold italic">Cargando métricas...</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <CreateCaseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => fetchData()}
      />

      <CaseDetailsSidebar
        isOpen={!!selectedCase}
        onClose={() => setSelectedCase(null)}
        selectedCase={selectedCase}
        onUpdate={(id: string) => {
          fetchData();
          handleSelectCase(id);
        }}
      />
    </div>
  );
};

export default DashboardPage;
