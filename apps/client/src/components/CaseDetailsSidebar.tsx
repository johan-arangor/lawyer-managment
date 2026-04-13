import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Upload, MessageSquare, Clock, ExternalLink, Loader2, DollarSign, Wallet, Trash2, Edit, PlusCircle, User, Shield, Folder, CheckCircle2, ChevronRight, Link2, Eye, EyeOff, ShieldAlert, RefreshCw, Lock, AlertTriangle, UserX } from 'lucide-react';
import api from '../api/axios';
import Modal from './Modal';
import EditCaseModal from './EditCaseModal';
import Swal from 'sweetalert2';

const CaseDetailsSidebar = ({ isOpen, onClose, selectedCase, onUpdate }: any) => {
  const [activeTab, setActiveTab] = useState<'info' | 'financial' | 'history' | 'files'>('info');

  // Note Form State
  const [noteTitle, setNoteTitle] = useState('Avance Jurídico');
  const [noteContent, setNoteContent] = useState('');
  const [noteLinks, setNoteLinks] = useState<{ title: string; url: string }[]>([]);
  const [isVisibleByClient, setIsVisibleByClient] = useState(false);
  const [submittingNote, setSubmittingNote] = useState(false);

  // Modals visibility
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDeleteNoteOpen, setIsDeleteNoteOpen] = useState(false);
  const [isDeleteDocOpen, setIsDeleteDocOpen] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<any>(null);
  const [noteToDelete, setNoteToDelete] = useState<any>(null);
  const [docToDelete, setDocToDelete] = useState<any>(null);

  // External Link Modal Form
  const [linkData, setLinkData] = useState({ title: '', url: '' });
  const [submittingLink, setSubmittingLink] = useState(false);

  // Status Form State
  const [statusData, setStatusData] = useState({ status: selectedCase?.status || 'PENDING', reason: '' });
  const [submittingStatus, setSubmittingStatus] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [userCodeInput, setUserCodeInput] = useState('');

  // Deletion State
  const [deletionReason, setDeletionReason] = useState('');
  const [submittingDeletion, setSubmittingDeletion] = useState(false);

  // Payment Form State
  const [paymentData, setPaymentData] = useState({ amount: '', method: 'TRANSFERENCIA', date: new Date().toISOString().split('T')[0] });
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // New Upload System State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadFolder, setUploadFolder] = useState('CLIENTE');
  const [submittingUpload, setSubmittingUpload] = useState(false);

  const authUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isFixed = selectedCase?.feeType === 'FIXED';
  const isClosed = selectedCase?.status === 'CLOSED';

  // Helper to generate verification code
  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous chars
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setVerificationCode(code);
    setUserCodeInput('');
  };

  useEffect(() => {
    if (selectedCase) {
      setStatusData({ status: selectedCase.status, reason: '' });
      const remaining = isFixed ? (Number(selectedCase.fees) - Number(selectedCase.paidBalance)) : 0;

      setPaymentData({
        amount: (isFixed && remaining > 0) ? remaining.toString() : '',
        method: 'TRANSFERENCIA',
        date: new Date().toISOString().split('T')[0]
      });
      setPaymentFile(null);
    }
  }, [selectedCase, isFixed]);

  // Generate code when modals open
  useEffect(() => {
    if (isStatusOpen || isDeleteNoteOpen || isDeleteDocOpen) generateCode();
  }, [isStatusOpen, isDeleteNoteOpen, isDeleteDocOpen]);

  if (!selectedCase) return null;

  // Utility to convert text to clickable links
  const linkify = (text: string) => {
    if (!text) return '';
    const urlPattern = /((?:https?:\/\/|www\.)[^\s]+|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/gi;

    return text.replace(urlPattern, (url) => {
      let href = url;
      if (!href.startsWith('http')) {
        href = `https://${href}`;
      }
      return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-gold-600 underline font-black hover:text-navy-900 transition-colors">${url}</a>`;
    });
  };

  // Link Management for Notes
  const handleAddLinkToNote = () => setNoteLinks([...noteLinks, { title: '', url: '' }]);
  const handleRemoveLinkFromNote = (idx: number) => setNoteLinks(noteLinks.filter((_, i) => i !== idx));
  const updateNoteLink = (idx: number, field: string, val: string) => {
    const newLinks = [...noteLinks];
    (newLinks[idx] as any)[field] = val;
    setNoteLinks(newLinks);
  };

  const handleAddFullNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim() || isClosed) return;

    const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/;
    const invalidLink = noteLinks.find(l => l.url && !urlRegex.test(l.url));
    if (invalidLink) {
      Swal.fire('Error', `El formato de la URL "${invalidLink.title || invalidLink.url}" no es válido`, 'error');
      return;
    }

    setSubmittingNote(true);

    // Format content with links
    let finalContent = noteContent;
    if (noteLinks.length > 0) {
      finalContent += '\n\n🔗 LINKS ADJUNTOS:\n';
      noteLinks.forEach(l => {
        if (l.title && l.url) finalContent += `- ${l.title}: ${l.url}\n`;
      });
    }

    try {
      await api.post(`/cases/${selectedCase.id}/notes`, {
        title: noteTitle,
        content: finalContent,
        isVisibleByClient
      });
      setNoteContent('');
      setNoteTitle('Avance Jurídico');
      setNoteLinks([]);
      setIsVisibleByClient(false);
      onUpdate(selectedCase.id);
      Swal.fire({ icon: 'success', title: 'Avance registrado', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error al registrar avance' });
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleDeleteLink = async (id: string) => {
    if (isClosed) return;
    const result = await Swal.fire({
      title: '¿Eliminar link?',
      text: "Esta acción no se puede deshacer",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0f172a',
      cancelButtonColor: '#f1f5f9',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/cases/${selectedCase.id}/links/${id}`);
        onUpdate(selectedCase.id);
      } catch (err) {
        Swal.fire('Error', 'No se pudo eliminar el link', 'error');
      }
    }
  };

  const handleRequestNoteDeletion = (note: any) => {
    if (isClosed) return;
    setNoteToDelete(note);
    setDeletionReason('');
    setUserCodeInput('');
    setIsDeleteNoteOpen(true);
  };

  const handleConfirmDeletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userCodeInput.toUpperCase() !== verificationCode || !deletionReason.trim()) return;

    setSubmittingDeletion(true);
    try {
      await api.delete(`/cases/${selectedCase.id}/notes/${noteToDelete.id}`, {
        data: { reason: deletionReason }
      });
      setIsDeleteNoteOpen(false);
      setNoteToDelete(null);
      onUpdate(selectedCase.id);
      Swal.fire({ icon: 'success', title: 'Nota Anulada', text: 'El registro se ha marcado como borrado para auditoría.', toast: true, position: 'top-end', showConfirmButton: false, timer: 4000 });
    } catch (err) {
      Swal.fire('Error', 'No se pudo anular la nota', 'error');
    } finally {
      setSubmittingDeletion(false);
    }
  };

  const handleRequestDocDeletion = (doc: any) => {
    if (isClosed) return;
    setDocToDelete(doc);
    setDeletionReason('');
    setUserCodeInput('');
    setIsDeleteDocOpen(true);
  };

  const handleConfirmDocDeletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userCodeInput.toUpperCase() !== verificationCode || !deletionReason.trim()) return;

    setSubmittingDeletion(true);
    try {
      await api.delete(`/cases/${selectedCase.id}/documents/${docToDelete.id}`, {
        data: { reason: deletionReason }
      });
      setIsDeleteDocOpen(false);
      setDocToDelete(null);
      onUpdate(selectedCase.id);
      Swal.fire({ 
        icon: 'success', 
        title: 'Documento Anulado', 
        text: 'El archivo ha sido movido a la carpeta de eliminados y registrado en auditoría.', 
        toast: true, 
        position: 'top-end', 
        showConfirmButton: false, 
        timer: 5000 
      });
    } catch (err: any) {
      Swal.fire('Error', err.response?.data?.error || 'No se pudo anular el documento', 'error');
    } finally {
      setSubmittingDeletion(false);
    }
  };

  const handleStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userCodeInput.toUpperCase() !== verificationCode || isClosed) return;

    setSubmittingStatus(true);
    try {
      await api.patch(`/cases/${selectedCase.id}/status`, statusData);
      setIsStatusOpen(false);
      setUserCodeInput('');
      onUpdate(selectedCase.id);
      Swal.fire({ icon: 'success', title: 'Estado actualizado', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error al cambiar estado' });
    } finally {
      setSubmittingStatus(false);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isClosed) return;
    if (!paymentFile) {
      Swal.fire({ icon: 'warning', title: 'Comprobante requerido', text: 'Debe adjuntar el soporte de pago para tesorería.' });
      return;
    }

    const amountNum = Number(paymentData.amount);
    const remaining = Number(selectedCase.fees) - Number(selectedCase.paidBalance);

    if (isFixed && remaining > 0 && amountNum > remaining) {
      const confirm = await Swal.fire({
        icon: 'question',
        title: 'Monto superior al saldo',
        text: `El abono ($${amountNum.toLocaleString()}) supera el saldo pactado ($${remaining.toLocaleString()}). ¿Desea registrarlo como saldo a favor o ajuste?`,
        showCancelButton: true,
        confirmButtonText: 'Sí, registrar de todos modos',
        cancelButtonText: 'Cancelar'
      });
      if (!confirm.isConfirmed) return;
    }

    setSubmittingPayment(true);
    const formData = new FormData();
    formData.append('amount', paymentData.amount);
    formData.append('method', paymentData.method);
    formData.append('date', paymentData.date);
    formData.append('file', paymentFile);

    try {
      await api.post(`/cases/${selectedCase.id}/payments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setIsPaymentModalOpen(false);
      onUpdate(selectedCase.id);
      Swal.fire({ icon: 'success', title: 'Cobro Registrado', text: 'El recaudo ha sido validado y almacenado en Drive.', timer: 4000 });
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error en tesorería', text: err.response?.data?.error || 'No se pudo registrar el pago' });
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || submittingUpload) return;

    setSubmittingUpload(true);
    const formData = new FormData();
    formData.append('file', uploadFile);

    try {
      await api.post(`/cases/${selectedCase.id}/documents?folder=${uploadFolder}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setIsUploadOpen(false);
      setUploadFile(null);
      onUpdate(selectedCase.id);
      Swal.fire({
        icon: 'success',
        title: 'Documento Cargado',
        text: `El archivo se guardó en la carpeta ${uploadFolder} y se registró en la auditoría.`,
        timer: 3000
      });
    } catch (err: any) {
      Swal.fire('Error', err.response?.data?.error || 'No se pudo subir el archivo', 'error');
    } finally {
      setSubmittingUpload(false);
    }
  };

  const handleOpenFolder = async (subfolder?: string) => {
    try {
      const endpoint = subfolder ? `/cases/${selectedCase.id}/folder/${subfolder}` : null;
      if (!endpoint) {
        if (authUser.role !== 'ADMIN') {
          Swal.fire({ icon: 'error', title: 'Acceso Denegado', text: 'Solo la administración central puede acceder al contenedor raíz del expediente.' });
          return;
        }
        window.open(`https://drive.google.com/open?id=${selectedCase.driveFolderId}`, '_blank');
        return;
      }

      const res = await api.get(endpoint);
      window.open(res.data.url, '_blank');
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error al abrir carpeta', text: 'No se pudo obtener el acceso a la subcarpeta.' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'CLOSED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'info':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {authUser.role === 'ADMIN' && !isClosed && (
              <div className="flex gap-3">
                <button onClick={() => setIsEditOpen(true)} className="flex-1 py-4 bg-navy-50 text-navy-900 font-bold rounded-[1.5rem] border border-navy-100 hover:bg-white hover:shadow-lg transition-all flex items-center justify-center gap-2 group">
                  <Edit className="w-4 h-4 group-hover:rotate-12 transition-transform" /> Editar Expediente
                </button>
                <button onClick={() => setIsStatusOpen(true)} className="flex-1 py-4 bg-gold-50 text-gold-700 font-bold rounded-[1.5rem] border border-gold-100 hover:bg-white hover:shadow-lg transition-all flex items-center justify-center gap-2 group">
                  <Clock className="w-4 h-4 group-hover:rotate-12 transition-transform" /> Cambiar Estado
                </button>
              </div>
            )}

            {isClosed && (
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3 text-emerald-700 text-xs font-black uppercase tracking-widest">
                <Lock className="w-4 h-4" /> Expediente en Archivo (Solo Lectura)
              </div>
            )}

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <FileText className="w-20 h-20 text-navy-900" />
              </div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Resumen de Pretensiones</h4>
              <p className="text-slate-600 font-medium leading-relaxed italic">
                {selectedCase.description || 'Sin descripción detallada registrada.'}
              </p>
            </div>

            {(selectedCase.followUpLinks?.length > 0 || ((authUser.role === 'ADMIN' || authUser.role === 'LAWYER') && !isClosed)) && (
              <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vinculaciones Externas (Rama/Consultas)</h4>
                  {(authUser.role === 'ADMIN' || authUser.role === 'LAWYER') && !isClosed && (
                    <button onClick={() => setIsLinkModalOpen(true)} className="text-gold-600 text-xs font-black uppercase hover:underline">
                      + Añadir Directo
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {selectedCase.followUpLinks?.map((link: any) => (
                    <div key={link.id} className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-3xl group hover:shadow-xl hover:border-gold-200 transition-all">
                      <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-gold-50 transition-colors">
                        <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-gold-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-navy-900 truncate">{link.title}</p>
                        <a href={link.url} target="_blank" rel="noreferrer" className="text-[10px] text-gold-600 font-bold hover:underline truncate block">
                          {link.url}
                        </a>
                      </div>
                      {(authUser.role === 'ADMIN') && !isClosed && (
                        <button onClick={() => handleDeleteLink(link.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {(!selectedCase.followUpLinks || selectedCase.followUpLinks.length === 0) && (
                    <p className="text-center py-8 text-slate-300 font-bold italic text-sm border-2 border-dashed border-slate-100 rounded-[2.5rem]">No hay consultas vinculadas</p>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 'financial':
        const pending = isFixed ? (Number(selectedCase.fees) - Number(selectedCase.paidBalance)) : 0;

        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-navy-900 text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-white/10 transition-colors" />
              <div className="relative">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h4 className="text-[10px] font-black text-gold-400 uppercase tracking-widest mb-2">
                      {isFixed ? 'Cartera Judicial' : 'Honorarios por Reclamación'}
                    </h4>
                    <p className="text-3xl font-black">
                      {isFixed ? `$${Number(selectedCase.fees).toLocaleString()}` : `${Number(selectedCase.fees)}%`}
                    </p>
                  </div>
                  <div className="p-4 bg-white/10 rounded-3xl backdrop-blur-md">
                    <Wallet className="w-6 h-6 text-gold-400" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Recaudado</p>
                    <p className="text-lg font-black text-emerald-400">${Number(selectedCase.paidBalance).toLocaleString()}</p>
                  </div>
                  {isFixed && (
                    <div className={`p-4 rounded-2xl border ${pending > 0 ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Saldo</p>
                      <p className={`text-lg font-black ${pending > 0 ? 'text-red-400' : 'text-emerald-400'}`}>${pending.toLocaleString()}</p>
                    </div>
                  )}
                  {!isFixed && (
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Pactado</p>
                      <p className="text-lg font-black text-gold-400">{selectedCase.fees}%</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {authUser.role === 'ADMIN' && !isClosed && (
              <button
                onClick={() => setIsPaymentModalOpen(true)}
                className="w-full py-5 bg-gold-400 text-navy-900 font-black rounded-[2rem] shadow-xl shadow-gold-400/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
              >
                <DollarSign className="w-6 h-6" /> RECIBO DE CARTERA
              </button>
            )}

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Historial de Recaudos</h4>
              <div className="space-y-3">
                {selectedCase.payments?.map((p: any) => (
                  <div key={p.id} className="p-5 bg-white border border-slate-100 rounded-[2rem] flex items-center justify-between group hover:shadow-xl transition-all">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-emerald-50 rounded-2xl">
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-black text-navy-900">${Number(p.amount).toLocaleString()}</p>
                          <p className="text-[9px] font-black text-slate-300 uppercase">#{p.id.split('-')[0]}</p>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase truncate">{p.method} • {new Date(p.date).toLocaleDateString()}</p>
                        <p className="text-[9px] text-navy-600 font-black uppercase mt-1 flex items-center gap-1">
                          <Shield className="w-3 h-3 text-gold-600" /> Registrado por: {p.registeredBy?.name || 'Sistema'}
                        </p>
                      </div>
                    </div>
                    {p.comprobanteId && (
                      <a href={`https://drive.google.com/open?id=${p.comprobanteId}`} target="_blank" className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-gold-50 hover:text-gold-600 transition-all ml-4">
                        <FileText className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                ))}
                {(!selectedCase.payments || selectedCase.payments.length === 0) && (
                  <p className="text-center py-10 text-slate-300 font-bold italic text-sm">No se registran movimientos de caja</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'history':
        const historyItems = [
          ...(selectedCase.followUpNotes || []).map((n: any) => ({ ...n, type: 'NOTE' })),
          ...(selectedCase.statusHistory || []).map((s: any) => ({ ...s, type: 'STATUS', title: `${s.from} → ${s.to}` }))
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {(authUser.role === 'ADMIN' || authUser.role === 'LAWYER') && !isClosed && (
              <form onSubmit={handleAddFullNote} className="space-y-4 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-navy-900 ml-1 uppercase tracking-widest">Título del Avance</label>
                    <input
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-sm"
                      value={noteTitle}
                      onChange={e => setNoteTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-navy-900 ml-1 uppercase tracking-widest">Nota u Observación</label>
                    <textarea
                      rows={4}
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] outline-none font-medium text-slate-600 text-sm leading-relaxed"
                      placeholder="Escriba los detalles de la actuación jurídica..."
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                    />
                  </div>

                  {/* Dynamic Links Section (Mirroring CreateCaseModal) */}
                  <div className="bg-slate-50/50 p-5 rounded-[1.5rem] border border-slate-100">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-black text-navy-900 text-[10px] uppercase tracking-widest">Links Rama Judicial</h4>
                      <button
                        type="button"
                        onClick={handleAddLinkToNote}
                        className="text-gold-600 bg-white px-3 py-1.5 rounded-xl shadow-sm hover:translate-y-[-2px] transition-all text-[10px] font-black uppercase"
                      >
                        + Añadir Link
                      </button>
                    </div>
                    <div className="space-y-3">
                      {noteLinks.map((link, idx) => (
                        <div key={idx} className="flex gap-2 animate-in fade-in zoom-in-95">
                          <input
                            placeholder="Título"
                            className="flex-1 px-3 py-2 bg-white rounded-xl border border-slate-100 text-[11px] font-bold outline-none"
                            value={link.title}
                            onChange={e => updateNoteLink(idx, 'title', e.target.value)}
                          />
                          <input
                            placeholder="URL enlace"
                            className="flex-[2] px-3 py-2 bg-white rounded-xl border border-slate-100 text-[11px] font-medium outline-none"
                            value={link.url}
                            onChange={e => updateNoteLink(idx, 'url', e.target.value)}
                          />
                          <button type="button" onClick={() => handleRemoveLinkFromNote(idx)} className="text-red-300 hover:text-red-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2">
                      {isVisibleByClient ? <Eye className="w-4 h-4 text-emerald-500" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
                      <span className="text-[10px] font-black uppercase text-navy-900 tracking-tight">Carga pública para el cliente</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsVisibleByClient(!isVisibleByClient)}
                      className={`w-12 h-6 rounded-full transition-all relative ${isVisibleByClient ? 'bg-gold-500' : 'bg-slate-200'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isVisibleByClient ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>

                  <button
                    disabled={submittingNote || !noteContent.trim()}
                    className="w-full py-4 bg-navy-900 text-white font-black rounded-xl hover:bg-navy-800 transition-all shadow-xl disabled:opacity-50 uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
                  >
                    {submittingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />} Registrar Avance Jurídico
                  </button>
                </div>
              </form>
            )}

            {isClosed && (
              <div className="text-center py-6 px-4 bg-slate-50 border border-dashed border-slate-200 rounded-[2rem]">
                <p className="text-slate-400 text-xs font-bold italic">La bitácora ha sido cerrada. No se permiten nuevas actuaciones en este expediente.</p>
              </div>
            )}

            <div className="space-y-4 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
              {historyItems.map((item: any) => {
                const isDeleted = !!item.deletedAt;
                return (
                  <div key={item.id} className={`relative pl-14 group ${isDeleted ? 'opacity-60' : ''}`}>
                    <div className={`absolute left-4 top-4 w-4 h-4 rounded-full border-2 bg-white transition-colors z-10 ${isDeleted ? 'border-red-400 bg-red-50' : item.type === 'STATUS' ? 'border-gold-400' : 'border-slate-200 group-hover:border-navy-900'}`} />
                    <div
                      onClick={() => setSelectedHistoryItem(item)}
                      className={`p-5 rounded-[2rem] border transition-all cursor-pointer flex items-center justify-between ${isDeleted ? 'bg-slate-50 border-red-100 scale-95 origin-left italic' : 'bg-white border-slate-100 shadow-sm group-hover:shadow-xl hover:border-gold-100'}`}
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className={`p-3 rounded-xl ${isDeleted ? 'bg-red-50 text-red-400' : item.type === 'STATUS' ? 'bg-gold-50 text-gold-600' : 'bg-navy-50 text-navy-600'}`}>
                          {isDeleted ? <UserX className="w-4 h-4" /> : item.type === 'STATUS' ? <Clock className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className={`text-sm font-black truncate ${isDeleted ? 'text-red-400 line-through' : item.type === 'STATUS' ? 'text-gold-600' : 'text-navy-900'}`}>
                              {isDeleted ? `ANULADO: ${item.title}` : item.title}
                            </h4>
                            {!isDeleted && authUser.role !== 'CLIENT' && item.type === 'NOTE' && (
                              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${item.isVisibleByClient ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                {item.isVisibleByClient ? 'Público' : 'Privado'}
                              </span>
                            )}
                            {isDeleted && <span className="text-[8px] font-black px-1.5 py-0.5 bg-red-100 text-red-600 rounded uppercase">Auditado</span>}
                          </div>
                          <div className="flex items-center gap-2 text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                            <Clock className="w-3 h-3" /> {new Date(item.createdAt).toLocaleDateString()}
                            <span className="w-1 h-1 bg-slate-300 rounded-full" />
                            <User className="w-3 h-3" /> {item.author?.name || 'Sistema'}
                            {isDeleted && (
                              <>
                                <span className="w-1 h-1 bg-red-300 rounded-full" />
                                <span className="text-red-400">Anulado por: {item.deletedBy?.name || 'Admin'}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {(authUser.role === 'ADMIN' || authUser.role === 'LAWYER') && item.type === 'NOTE' && !isDeleted && !isClosed && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRequestNoteDeletion(item);
                            }}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-gold-500 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </div>
                );
              })}
              {historyItems.length === 0 && (
                <div className="text-center py-10 opacity-30 italic font-bold text-sm">Bitácora vacía</div>
              )}
            </div>
          </div>
        );

      case 'files':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {authUser.role !== 'CLIENT' && (
              <button
                onClick={() => setIsUploadOpen(true)}
                className="w-full py-4 bg-navy-900 text-gold-400 font-black rounded-[1.5rem] border border-navy-800 hover:shadow-2xl transition-all flex items-center justify-center gap-3 group"
              >
                <Upload className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
                Cargar Nuevo Documento al Expediente
              </button>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Folder shortcuts grid - All public except internal admin root */}
              <div className="p-4 border border-slate-100 rounded-[1.75rem] flex items-center gap-3 bg-white hover:shadow-xl transition-all group relative overflow-hidden">
                <div className="bg-emerald-500 p-2.5 rounded-xl group-hover:scale-110 transition-transform">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black text-navy-900 uppercase">Carpeta Pagos</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase truncate">Comprobantes</p>
                </div>
                <button onClick={() => handleOpenFolder('PAGOS')} className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-emerald-600 transition-all"><ExternalLink className="w-4 h-4" /></button>
              </div>

              <div className="p-4 border border-slate-100 rounded-[1.75rem] flex items-center gap-3 bg-white hover:shadow-xl transition-all group relative overflow-hidden">
                <div className="bg-blue-500 p-2.5 rounded-xl group-hover:scale-110 transition-transform">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black text-navy-900 uppercase">Carpeta Cliente</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase truncate">Gestion Compartida</p>
                </div>
                <button onClick={() => handleOpenFolder('CLIENTE')} className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-blue-600 transition-all"><ExternalLink className="w-4 h-4" /></button>
              </div>

              <div className="p-4 border border-slate-100 rounded-[1.75rem] flex items-center gap-3 bg-white hover:shadow-xl transition-all group relative overflow-hidden">
                <div className="bg-amber-500 p-2.5 rounded-xl group-hover:scale-110 transition-transform">
                  <ShieldAlert className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black text-navy-900 uppercase">Carpeta Evidencias</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase truncate">Pruebas / Soportes</p>
                </div>
                <button onClick={() => handleOpenFolder('EVIDENCIAS')} className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-amber-600 transition-all"><ExternalLink className="w-4 h-4" /></button>
              </div>

              <div className="p-4 border border-slate-100 rounded-[1.75rem] flex items-center gap-3 bg-white hover:shadow-xl transition-all group relative overflow-hidden">
                <div className="bg-navy-900 p-2.5 rounded-xl group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5 text-gold-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black text-navy-900 uppercase">Carpeta Documentos</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase truncate">Procesos / Folios</p>
                </div>
                <button onClick={() => handleOpenFolder('DOCUMENTOS')} className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-navy-900 transition-all"><ExternalLink className="w-4 h-4" /></button>
              </div>

              <div className="p-4 border border-slate-100 rounded-[1.75rem] flex items-center gap-3 bg-white hover:shadow-xl transition-all group relative overflow-hidden">
                <div className="bg-slate-500 p-2.5 rounded-xl group-hover:scale-110 transition-transform">
                  <Folder className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black text-navy-900 uppercase">Carpeta Otros</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase truncate">Documentación Afín</p>
                </div>
                <button onClick={() => handleOpenFolder('OTROS')} className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-slate-800 transition-all"><ExternalLink className="w-4 h-4" /></button>
              </div>

              {authUser.role === 'ADMIN' && (
                <div className="p-4 border-2 border-dashed border-red-100 rounded-[1.75rem] flex items-center gap-3 bg-red-50 hover:bg-white hover:shadow-xl transition-all group relative overflow-hidden">
                  <div className="bg-red-600 p-2.5 rounded-xl group-hover:scale-110 transition-transform">
                    <Lock className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-red-700 uppercase">Contenedor Raíz</p>
                    <p className="text-[9px] text-red-400 font-bold uppercase truncate">Admin Central Drive</p>
                  </div>
                  <button onClick={() => handleOpenFolder()} className="p-2 bg-white rounded-lg text-red-500 hover:text-red-700 shadow-sm transition-all"><ExternalLink className="w-4 h-4" /></button>
                </div>
              )}
            </div>

              {/* Document forensic log */}
              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-2 px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <ShieldAlert className="w-4 h-4" /> Rastro Forense de Documentación
                </div>
                <div className="space-y-2">
                  {selectedCase.documents?.map((doc: any) => (
                    <div key={doc.id} className={`p-4 border rounded-2xl flex items-center justify-between group transition-all ${doc.deletedAt ? 'bg-red-50/30 border-red-100 opacity-80 italic' : 'bg-white border-slate-50 hover:border-gold-100'}`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2 rounded-lg ${doc.deletedAt ? 'bg-red-100 text-red-500' : 'bg-slate-50 text-slate-400'}`}>
                          {doc.deletedAt ? <Trash2 className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-xs font-black truncate ${doc.deletedAt ? 'text-red-700' : 'text-navy-900'}`}>{doc.fileName}</p>
                            {doc.deletedAt && (
                              <span className="flex items-center gap-1 bg-red-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded shadow-sm uppercase tracking-widest animate-pulse">
                                <AlertTriangle className="w-2 h-2" /> ANULADO
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[9px] text-slate-400 font-bold uppercase">
                            <User className="w-3 h-3" /> {doc.uploadedBy?.name}
                            <span className="w-0.5 h-0.5 bg-slate-200 rounded-full" />
                            <Clock className="w-3 h-3" /> {new Date(doc.createdAt).toLocaleString()}
                          </div>
                          {doc.deletedAt && (
                            <p className="text-[8px] text-red-500 font-black uppercase mt-1 flex items-center gap-1">
                              <UserX className="w-3 h-3" /> Eliminado por: {doc.deletedBy?.name || 'Admin'}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!doc.deletedAt && (
                          <a href={`https://drive.google.com/open?id=${doc.fileId}`} target="_blank" className="p-2 opacity-0 group-hover:opacity-100 text-gold-600 hover:bg-gold-50 rounded-lg transition-all">
                            <Eye className="w-4 h-4" />
                          </a>
                        )}
                        {(authUser.role === 'ADMIN' || authUser.role === 'LAWYER') && !isClosed && !doc.deletedAt && (
                          <button
                            onClick={() => handleRequestDocDeletion(doc)}
                            className="p-2 opacity-0 group-hover:opacity-100 text-red-400 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {(!selectedCase.documents || selectedCase.documents.length === 0) && (
                    <p className="text-center py-6 text-slate-300 font-medium italic text-xs bg-slate-50/50 rounded-2xl border border-dashed border-slate-100">Sin archivos auditados digitalmente</p>
                  )}
                </div>
              </div>
            </div>
          );

      default: return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-navy-900/60 backdrop-blur-md z-[110]" />
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed right-0 top-0 h-screen w-full md:w-[600px] bg-white shadow-[-20px_0_50px_rgba(15,23,42,0.15)] z-[120] flex flex-col overflow-hidden">
            <div className="p-8 border-b border-slate-100 bg-white sticky top-0 z-10">
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-gold-400 text-navy-900 text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest shadow-lg shadow-gold-400/20">{selectedCase.caseNumber}</span>
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${getStatusColor(selectedCase.status)}`}>
                      {selectedCase.status === 'CLOSED' ? 'CERRADO' : selectedCase.status === 'IN_PROGRESS' ? 'EN PROCESO' : 'PENDIENTE'}
                    </span>
                  </div>
                  <h2 className="text-3xl font-black text-navy-900 tracking-tight leading-none mb-1">{selectedCase.title}</h2>
                  <div className="flex items-center gap-3 text-slate-400 text-[11px] font-bold uppercase">
                    <div className="flex items-center gap-1.5"><User className="w-3 h-3 text-gold-600" /> {selectedCase.client?.name}</div>
                    <span className="w-1 h-1 bg-slate-200 rounded-full" />
                    <div className="flex items-center gap-1.5"><Shield className="w-3 h-3 text-navy-900" /> {selectedCase.lawyer?.name}</div>
                  </div>
                </div>
                <button onClick={onClose} className="p-3 hover:bg-slate-50 text-slate-400 rounded-2xl transition-all hover:rotate-90 active:scale-90"><X className="w-6 h-6" /></button>
              </div>
              <div className="flex p-2 bg-slate-50 rounded-[2rem] gap-1 overflow-x-auto no-scrollbar">
                <button onClick={() => setActiveTab('info')} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-[1.5rem] text-[11px] font-black uppercase transition-all ${activeTab === 'info' ? 'bg-white text-navy-900 shadow-xl' : 'text-slate-400'}`}><FileText className="w-4 h-4" /> Datos</button>
                <button onClick={() => setActiveTab('financial')} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-[1.5rem] text-[11px] font-black uppercase transition-all ${activeTab === 'financial' ? 'bg-white text-navy-900 shadow-xl' : 'text-slate-400'}`}><Wallet className="w-4 h-4" /> Finanzas</button>
                <button onClick={() => setActiveTab('history')} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-[1.5rem] text-[11px] font-black uppercase transition-all ${activeTab === 'history' ? 'bg-white text-navy-900 shadow-xl' : 'text-slate-400'}`}><Clock className="w-4 h-4" /> Bitácora</button>
                <button onClick={() => setActiveTab('files')} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-[1.5rem] text-[11px] font-black uppercase transition-all ${activeTab === 'files' ? 'bg-white text-navy-900 shadow-xl' : 'text-slate-400'}`}><Folder className="w-4 h-4" /> Archivos</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/20">{renderContent()}</div>
          </motion.div>

          <EditCaseModal
            isOpen={isEditOpen}
            onClose={() => setIsEditOpen(false)}
            caseData={selectedCase}
            onSuccess={() => onUpdate(selectedCase.id)}
          />

          {/* New Document Upload Modal */}
          <Modal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} title="Cargar Documento" size="md">
            <form onSubmit={handleUploadDocument} className="space-y-6">
              <div className="p-4 bg-navy-50 border border-navy-100 rounded-2xl flex gap-3">
                <Shield className="w-5 h-5 text-gold-500 flex-shrink-0" />
                <p className="text-[11px] text-navy-800 font-medium leading-relaxed">
                  Todo documento cargado será auditado. Asegúrese de seleccionar la categoría correcta para facilitar la gestión del expediente.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-navy-900 uppercase tracking-widest ml-1">Carpeta de Destino</label>
                  <select
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-xs outline-none focus:ring-2 focus:ring-gold-500 transition-all"
                    value={uploadFolder}
                    onChange={e => setUploadFolder(e.target.value)}
                  >
                    <option value="DOCUMENTOS">DOCUMENTOS / FOLIOS</option>
                    <option value="EVIDENCIAS">EVIDENCIAS / PRUEBAS</option>
                    <option value="CLIENTE">EXPEDIENTE CLIENTE</option>
                    <option value="PAGOS">COMPROBANTES DE PAGO</option>
                    <option value="OTROS">OTROS DOCUMENTOS</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-navy-900 uppercase tracking-widest ml-1">Seleccionar Archivo</label>
                  <div className="relative group">
                    <input
                      type="file"
                      id="upload-file"
                      className="hidden"
                      onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                    />
                    <label
                      htmlFor="upload-file"
                      className={`w-full py-10 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${uploadFile ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200 hover:bg-white hover:border-gold-300 shadow-sm'}`}
                    >
                      {uploadFile ? (
                        <>
                          <div className="p-3 bg-emerald-100 rounded-2xl">
                            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                          </div>
                          <div className="text-center px-4">
                            <p className="text-[11px] font-black text-emerald-700 truncate max-w-[300px]">{uploadFile.name}</p>
                            <p className="text-[9px] text-emerald-500 font-bold uppercase mt-1">{(uploadFile.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="p-4 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform">
                            <Upload className="w-8 h-8 text-gold-500" />
                          </div>
                          <div className="text-center">
                            <span className="text-[11px] font-black text-navy-900 uppercase tracking-widest">Click para adjuntar</span>
                            <p className="text-[9px] text-slate-400 font-bold mt-1">SOPORTA PDF, IMÁGENES, DOCUMENTOS</p>
                          </div>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingUpload || !uploadFile}
                className="w-full py-4 bg-navy-900 text-white font-black rounded-2xl hover:bg-navy-800 transition-all shadow-xl disabled:opacity-50 uppercase text-[10px] tracking-widest flex items-center justify-center gap-3"
              >
                {submittingUpload ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5 text-gold-400" />}
                {submittingUpload ? 'Cargando y Auditando...' : 'Confirmar Carga al Expediente'}
              </button>
            </form>
          </Modal>

          {/* ANULACIÓN MODAL PROTOCOL (NOTES) */}
          <Modal
            isOpen={isDeleteNoteOpen}
            onClose={() => setIsDeleteNoteOpen(false)}
            title="Protocolo de Anulación de Registro (Nota)"
          >
            <form onSubmit={handleConfirmDeletion} className="space-y-6">
              <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3 text-red-700 text-[10px] font-black uppercase tracking-widest">
                <AlertTriangle className="shrink-0 w-5 h-5 text-red-500" />
                Esta acción es irreversible y quedará registrada en el rastro forense.
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-navy-900 ml-1 uppercase tracking-widest text-red-600">MOTIVO TÉCNICO DE ANULACIÓN</label>
                <textarea
                  required
                  rows={4}
                  className="w-full px-4 py-4 bg-white border border-red-100 rounded-2xl outline-none font-medium text-sm focus:border-red-500 transition-colors"
                  placeholder="Explique detalladamente por qué anula este avance jurídico..."
                  value={deletionReason}
                  onChange={e => setDeletionReason(e.target.value)}
                />
              </div>

              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-navy-900" />
                    <span className="text-[10px] font-black uppercase text-navy-900">Validación de Identidad</span>
                  </div>
                  <button type="button" onClick={generateCode} className="p-1.5 hover:bg-white rounded-lg transition-colors text-slate-400 hover:text-navy-900">
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex flex-col items-center gap-3">
                  <div className="px-8 bg-white border-2 border-navy-900 rounded-2xl shadow-inner text-2xl font-black tracking-[0.5em] text-navy-900 select-none font-mono">
                    {verificationCode}
                  </div>
                  <input
                    type="text"
                    className={`w-full bg-white border-2 rounded-2xl text-center font-black text-lg outline-none transition-all ${userCodeInput.toUpperCase() === verificationCode ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 focus:border-navy-900'}`}
                    placeholder="Digita el código de seguridad..."
                    value={userCodeInput}
                    onChange={e => setUserCodeInput(e.target.value.toUpperCase())}
                    maxLength={6}
                  />
                </div>
              </div>

              <button
                disabled={submittingDeletion || userCodeInput.toUpperCase() !== verificationCode || !deletionReason.trim()}
                className={`w-full py-5 text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all ${userCodeInput.toUpperCase() === verificationCode && deletionReason.trim() ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
              >
                {submittingDeletion ? <Loader2 className="animate-spin w-5 h-5" /> : (userCodeInput.toUpperCase() === verificationCode && deletionReason.trim() ? <UserX className="w-5 h-5" /> : 'DATOS REQUERIDOS')}
                {!submittingDeletion && 'ANULAR REGISTRO FORENSE'}
              </button>
            </form>
          </Modal>

          {/* ANULACIÓN MODAL PROTOCOL (DOCUMENTS) */}
          <Modal
            isOpen={isDeleteDocOpen}
            onClose={() => setIsDeleteDocOpen(false)}
            title="Protocolo de Anulación de Documento"
          >
            <form onSubmit={handleConfirmDocDeletion} className="space-y-6">
              <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3 text-red-700 text-[10px] font-black uppercase tracking-widest">
                <AlertTriangle className="shrink-0 w-5 h-5 text-red-500" />
                El archivo será movido a CUARENTENA (ELIMINADOS) y auditado permanentemente.
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-navy-900 ml-1 uppercase tracking-widest text-red-600">JUSTIFICACIÓN TÉCNICA DE ELIMINACIÓN</label>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-2">
                  <p className="text-[10px] text-navy-900 font-bold uppercase truncate">Documento: {docToDelete?.fileName}</p>
                </div>
                <textarea
                  required
                  rows={4}
                  className="w-full px-4 py-4 bg-white border border-red-100 rounded-2xl outline-none font-medium text-sm focus:border-red-500 transition-colors"
                  placeholder="Explique el motivo de la anulación del folio..."
                  value={deletionReason}
                  onChange={e => setDeletionReason(e.target.value)}
                />
              </div>

              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-navy-900" />
                    <span className="text-[10px] font-black uppercase text-navy-900">Firma de Auditor</span>
                  </div>
                  <button type="button" onClick={generateCode} className="p-1.5 hover:bg-white rounded-lg transition-colors text-slate-400 hover:text-navy-900">
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex flex-col items-center gap-3">
                  <div className="px-8 bg-white border-2 border-navy-900 rounded-2xl shadow-inner text-2xl font-black tracking-[0.5em] text-navy-900 select-none font-mono">
                    {verificationCode}
                  </div>
                  <input
                    type="text"
                    className={`w-full bg-white border-2 rounded-2xl text-center font-black text-lg outline-none transition-all ${userCodeInput.toUpperCase() === verificationCode ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 focus:border-navy-900'}`}
                    placeholder="Código de confirmación..."
                    value={userCodeInput}
                    onChange={e => setUserCodeInput(e.target.value.toUpperCase())}
                    maxLength={6}
                  />
                </div>
              </div>

              <button
                disabled={submittingDeletion || userCodeInput.toUpperCase() !== verificationCode || !deletionReason.trim()}
                className={`w-full py-5 text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all ${userCodeInput.toUpperCase() === verificationCode && deletionReason.trim() ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
              >
                {submittingDeletion ? <Loader2 className="animate-spin w-5 h-5" /> : (userCodeInput.toUpperCase() === verificationCode && deletionReason.trim() ? <UserX className="w-5 h-5" /> : 'DATOS REQUERIDOS')}
                {!submittingDeletion && 'EJECUTAR ANULACIÓN Y CUARENTENA'}
              </button>
            </form>
          </Modal>

          <Modal isOpen={isStatusOpen} onClose={() => setIsStatusOpen(false)} title="Actualizar Estado Jurídico">
            <form onSubmit={handleStatusChange} className="space-y-6">
              <div className="p-4 bg-navy-50 rounded-2xl border border-navy-100 flex items-center gap-3 text-navy-700 text-xs font-bold uppercase tracking-tighter"><Clock className="shrink-0 w-4 h-4" /> Define el nuevo hito del expediente.</div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-navy-900 ml-1 uppercase tracking-widest">Nuevo Estado</label>
                <select className="w-full px-4 py-4 bg-white border border-slate-100 rounded-2xl outline-none font-bold" value={statusData.status} onChange={e => setStatusData({ ...statusData, status: e.target.value })}>
                  <option value="PENDING">PENDIENTE</option>
                  <option value="IN_PROGRESS">EN PROCESO</option>
                  <option value="CLOSED">CERRADO (FINALIZADO)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-navy-900 ml-1 uppercase tracking-widest">Justificación técnica / Motivo</label>
                <textarea required rows={4} className="w-full px-4 py-4 bg-white border border-slate-100 rounded-2xl outline-none font-medium text-sm" placeholder="Explique brevemente el motivo de este cambio..." value={statusData.reason} onChange={e => setStatusData({ ...statusData, reason: e.target.value })} />
              </div>

              {/* Verification Section */}
              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-gold-600" />
                    <span className="text-[10px] font-black uppercase text-navy-900">Protocolo de Seguridad</span>
                  </div>
                  <button type="button" onClick={generateCode} className="p-1.5 hover:bg-white rounded-lg transition-colors text-slate-400 hover:text-navy-900">
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex flex-col items-center gap-3">
                  <div className="px-8 bg-white border-2 border-navy-900 rounded-2xl shadow-inner text-2xl font-black tracking-[0.5em] text-navy-900 select-none font-mono">
                    {verificationCode}
                  </div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase text-center">Digita el código superior para confirmar la actuación</p>
                  <input
                    type="text"
                    className={`w-full bg-white border-2 rounded-2xl text-center font-black text-lg outline-none transition-all ${userCodeInput.toUpperCase() === verificationCode ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 focus:border-navy-900'}`}
                    placeholder="Escribe el código aquí..."
                    value={userCodeInput}
                    onChange={e => setUserCodeInput(e.target.value.toUpperCase())}
                    maxLength={6}
                  />
                </div>
              </div>

              <button
                disabled={submittingStatus || userCodeInput.toUpperCase() !== verificationCode}
                className={`w-full py-5 text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all ${userCodeInput.toUpperCase() === verificationCode ? 'bg-navy-900 hover:bg-navy-800' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
              >
                {submittingStatus ? <Loader2 className="animate-spin w-5 h-5" /> : (userCodeInput.toUpperCase() === verificationCode ? <CheckCircle2 className="w-5 h-5" /> : 'CÓDIGO REQUERIDO')}
                {!submittingStatus && 'CONFIRMAR ACTUACIÓN'}
              </button>
            </form>
          </Modal>

          <Modal isOpen={isLinkModalOpen} onClose={() => setIsLinkModalOpen(false)} title="Vincular Consulta Externa">
            <form onSubmit={async (e) => {
              e.preventDefault();
              setSubmittingLink(true);
              try {
                await api.post(`/cases/${selectedCase.id}/links`, linkData);
                setIsLinkModalOpen(false);
                setLinkData({ title: '', url: '' });
                onUpdate(selectedCase.id);
                Swal.fire({ icon: 'success', title: 'Vínculo creado', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
              } catch (err) {
                Swal.fire({ icon: 'error', title: 'Error al crear vínculo' });
              } finally {
                setSubmittingLink(false);
              }
            }} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-navy-900 ml-1 uppercase tracking-widest">Nombre de la Consulta</label>
                <input required className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold" placeholder="Ejem: Rama Judicial - Consulta de Procesos" value={linkData.title} onChange={e => setLinkData({ ...linkData, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-navy-900 ml-1 uppercase tracking-widest">URL Enlace</label>
                <input required type="url" className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium" placeholder="https://..." value={linkData.url} onChange={e => setLinkData({ ...linkData, url: e.target.value })} />
              </div>
              <button disabled={submittingLink} className="w-full py-4 bg-navy-900 text-white font-black rounded-2xl shadow-xl">
                {submittingLink ? <Loader2 className="animate-spin" /> : 'VINCULAR ENLACE'}
              </button>
            </form>
          </Modal>

          <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Recibo de Cartera Judicial">
            <form onSubmit={handleAddPayment} className="space-y-6">
              <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 text-emerald-800 space-y-2">
                <div className="flex items-center gap-2 font-black text-xs uppercase tracking-widest"><Wallet className="w-4 h-4" /> Información de Saldo</div>
                <div className="flex justify-between items-center bg-white/50 p-3 rounded-xl border border-emerald-200">
                  <span className="text-[10px] font-bold uppercase tracking-tighter">Estado de Cuenta</span>
                  <span className={`text-lg font-black ${isFixed && (Number(selectedCase.fees) - Number(selectedCase.paidBalance)) < 0 ? 'text-red-600' : ''}`}>
                    {isFixed
                      ? (Number(selectedCase.fees) - Number(selectedCase.paidBalance) < 0
                        ? `Excedente: $${Math.abs(Number(selectedCase.fees) - Number(selectedCase.paidBalance)).toLocaleString()}`
                        : `Pendiente: $${(Number(selectedCase.fees) - Number(selectedCase.paidBalance)).toLocaleString()}`)
                      : 'Honorarios Variables (%)'}
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-navy-900 ml-1 uppercase tracking-widest">Monto del Abono</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                    <input required type="number" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-black text-lg" value={paymentData.amount} onChange={e => setPaymentData({ ...paymentData, amount: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-navy-900 ml-1 uppercase tracking-widest">Fecha de Pago</label>
                    <input required type="date" className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold" value={paymentData.date} onChange={e => setPaymentData({ ...paymentData, date: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-navy-900 ml-1 uppercase tracking-widest">Método</label>
                    <select className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold" value={paymentData.method} onChange={e => setPaymentData({ ...paymentData, method: e.target.value })}>
                      <option value="EFECTIVO">EFECTIVO</option>
                      <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                      <option value="CONSIGNACION">CONSIGNACIÓN</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-navy-900 ml-1 uppercase tracking-widest">Soporte Transaccional (PDF/IMG)</label>
                  <div className="relative border-2 border-dashed border-slate-200 rounded-[2rem] p-8 text-center bg-slate-50/50 hover:bg-white hover:border-emerald-400 transition-all cursor-pointer group">
                    <input required type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setPaymentFile(e.target.files?.[0] || null)} />
                    <div className="space-y-2">
                      <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto text-emerald-500 group-hover:scale-110 transition-transform"><Upload className="w-6 h-6" /></div>
                      <p className="text-xs font-bold text-slate-500">{paymentFile ? paymentFile.name : 'Vincular comprobante digital'}</p>
                    </div>
                  </div>
                </div>
              </div>
              <button disabled={submittingPayment} className="w-full py-5 bg-emerald-600 text-white font-black rounded-[2rem] shadow-xl">{submittingPayment ? <Loader2 className="animate-spin" /> : 'VALIDAR Y REGISTRAR ABONO'}</button>
            </form>
          </Modal>

          <Modal
            isOpen={!!selectedHistoryItem}
            onClose={() => setSelectedHistoryItem(null)}
            title={selectedHistoryItem?.title || 'Detalle del Avance'}
            size="lg"
          >
            {selectedHistoryItem && (
              <div className="space-y-6">
                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-navy-900" />
                    <span className="text-xs font-black text-navy-900 uppercase">Autor: {selectedHistoryItem.author?.name || 'Sistema'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-bold text-slate-500">{new Date(selectedHistoryItem.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                {selectedHistoryItem.deletedAt && (
                  <div className="p-6 bg-red-50 border border-red-200 rounded-3xl space-y-2">
                    <div className="flex items-center gap-2 text-red-600 font-black text-[10px] uppercase tracking-widest"><ShieldAlert className="w-4 h-4" /> Registro Anulado</div>
                    <p className="text-red-700 text-sm font-bold bg-white/50 p-4 rounded-2xl border border-red-100">
                      <span className="block opacity-50 mb-1">Motivo:</span>
                      {selectedHistoryItem.deletionReason}
                    </p>
                    <div className="flex justify-end text-[9px] font-black text-red-400 uppercase">Anulado por: {selectedHistoryItem.deletedBy?.name} el {new Date(selectedHistoryItem.deletedAt).toLocaleString()}</div>
                  </div>
                )}

                <div className={`bg-white p-8 border border-slate-100 rounded-[2.5rem] shadow-sm ${selectedHistoryItem.deletedAt ? 'opacity-40 grayscale' : ''}`}>
                  <p className="text-slate-600 font-medium leading-[1.8] text-lg whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: linkify(selectedHistoryItem.content || selectedHistoryItem.reason || '') }}
                  />
                </div>

                <button
                  onClick={() => setSelectedHistoryItem(null)}
                  className="w-full py-4 bg-navy-900 text-white font-black rounded-2xl shadow-xl uppercase text-xs tracking-widest mt-4"
                >
                  Cerrar Detalle
                </button>
              </div>
            )}
          </Modal>
        </>
      )}
    </AnimatePresence>
  );
};

export default CaseDetailsSidebar;
