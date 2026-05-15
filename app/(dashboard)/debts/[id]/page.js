'use client';

import { useState, useEffect, use } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { formatMoney, formatDate, formatDateTime, formatPhone, STATUS_LABELS, STATUS_CLASSES, getInitials, timeAgo } from '@/lib/utils';
import { ArrowLeft, CheckCircle, XCircle, DollarSign, FileDown, Clock, Wallet, ArrowDownLeft, Loader2, History } from 'lucide-react';

export default function DebtDetailPage({ params }) {
  const resolvedParams = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [debt, setDebt] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchDebt = async () => {
    try {
      const res = await fetch(`/api/debts/${resolvedParams.id}`);
      const data = await res.json();
      if (data.debt) { setDebt(data.debt); setLogs(data.logs || []); }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchDebt(); }, [resolvedParams.id]);

  const handleAction = async (action) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/debts/${resolvedParams.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, userId: user.id }),
      });
      const data = await res.json();
      if (data.success) {
        setDebt(data.debt);
        const msgs = { confirm: 'Qarz tasdiqlandi!', reject: 'Qarz rad etildi', close: data.debt.status === 'closed' ? 'Qarz yopildi!' : 'To\'lov tasdiqlandi. Ikkinchi tomon ham tasdiqlashi kerak.' };
        showToast(msgs[action], 'success');
        fetchDebt();
      }
    } catch { showToast('Xatolik yuz berdi', 'error'); }
    setActionLoading(false);
  };

  const showToast = (msg, type) => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const handleGeneratePDF = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    const lenderName = debt.creatorRole === 'lender' ? debt.creatorName : debt.counterpartyName;
    const lenderPhone = debt.creatorRole === 'lender' ? debt.creatorPhone : debt.counterpartyPhone;
    const borrowerName = debt.creatorRole === 'borrower' ? debt.creatorName : debt.counterpartyName;
    const borrowerPhone = debt.creatorRole === 'borrower' ? debt.creatorPhone : debt.counterpartyPhone;

    doc.setFillColor(108, 60, 225);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('OLDI-BERDI', 105, 18, { align: 'center' });
    doc.setFontSize(11);
    doc.text('QARZ SHARTNOMASI', 105, 28, { align: 'center' });
    doc.setTextColor(26, 26, 46);
    let y = 55;
    doc.setFontSize(12);
    const addRow = (label, value) => { doc.setFont(undefined, 'bold'); doc.text(label, 20, y); doc.setFont(undefined, 'normal'); doc.text(String(value), 80, y); y += 10; };
    addRow('Shartnoma ID:', debt.id);
    addRow('Sana:', formatDateTime(debt.createdAt));
    y += 5;
    doc.setFontSize(14); doc.setFont(undefined, 'bold'); doc.text('Tomonlar', 20, y); y += 10; doc.setFontSize(12);
    addRow('Qarz beruvchi:', lenderName);
    addRow('Telefon:', formatPhone(lenderPhone));
    y += 3;
    addRow('Qarz oluvchi:', borrowerName);
    addRow('Telefon:', formatPhone(borrowerPhone));
    y += 5;
    doc.setFontSize(14); doc.setFont(undefined, 'bold'); doc.text('Shartlar', 20, y); y += 10; doc.setFontSize(12);
    addRow('Miqdor:', `${formatMoney(debt.amount)} so'm`);
    addRow('Foiz:', 'Foizsiz (0%)');
    addRow('Muddat:', formatDate(debt.dueDate));
    addRow('Sabab:', debt.reason || 'Ko\'rsatilmagan');
    addRow('Holat:', STATUS_LABELS[debt.status]);
    if (debt.confirmedAt) addRow('Tasdiqlangan:', formatDateTime(debt.confirmedAt));
    if (debt.closedAt) addRow('Yopilgan:', formatDateTime(debt.closedAt));
    y += 15;
    doc.setFontSize(9); doc.setTextColor(107, 114, 128);
    doc.text('Bu hujjat Oldi-Berdi platformasi tomonidan avtomatik yaratilgan.', 105, y, { align: 'center' });
    doc.save(`qarz-${debt.id}.pdf`);
    showToast('PDF yuklandi!', 'success');
  };

  if (loading) return <div className="loading-center"><div className="spinner"></div></div>;
  if (!debt) return <div className="empty-state"><div className="empty-title">Qarz topilmadi</div><button onClick={() => router.back()} className="btn btn-primary">Orqaga</button></div>;

  const isCreator = debt.creatorId === user.id;
  const isCounterparty = debt.counterpartyId === user.id;
  const isLender = (debt.creatorId === user.id && debt.creatorRole === 'lender') || (debt.counterpartyId === user.id && debt.creatorRole === 'borrower');
  const otherName = isCreator ? debt.counterpartyName : debt.creatorName;
  const otherPhone = isCreator ? debt.counterpartyPhone : debt.creatorPhone;
  const canConfirm = debt.status === 'pending' && isCounterparty && !debt.counterpartyConfirmed;
  const canClose = (debt.status === 'active' || debt.status === 'overdue');
  const alreadyRequestedClose = debt._closeConfirms?.includes(user.id);

  return (
    <div className="animate-in">
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
      <button onClick={() => router.back()} className="btn btn-sm btn-secondary" style={{ marginBottom: '16px' }}>
        <ArrowLeft size={15} /> Orqaga
      </button>

      <div className="detail-header">
        <div className="detail-label">{isLender ? 'Siz qarz berdingiz' : 'Siz qarz oldingiz'}</div>
        <div className="detail-amount">{formatMoney(debt.amount)} <span style={{ fontSize:'0.5em',opacity:0.8 }}>so'm</span></div>
        <span className={`badge ${STATUS_CLASSES[debt.status]}`} style={{ marginTop:'8px' }}>{STATUS_LABELS[debt.status]}</span>
      </div>

      <div className="detail-section">
        <div style={{ display:'flex',alignItems:'center',gap:'14px',marginBottom:'14px' }}>
          <div className={`debt-avatar ${isLender ? 'borrower' : 'lender'}`} style={{ width:48,height:48,fontSize:'1.1rem' }}>{getInitials(otherName)}</div>
          <div>
            <div style={{ fontWeight:600 }}>{otherName}</div>
            <div style={{ fontSize:'0.8rem',color:'var(--text-secondary)' }}>{formatPhone(otherPhone)}</div>
          </div>
        </div>
        <div className="divider"></div>
        <div className="detail-row">
          <span className="detail-row-label">Rol</span>
          <span className="detail-row-value" style={{display:'flex',alignItems:'center',gap:5}}>
            {isLender ? <><ArrowDownLeft size={14}/> Qarz oluvchi</> : <><Wallet size={14}/> Qarz beruvchi</>}
          </span>
        </div>
      </div>

      <div className="detail-section">
        <div className="detail-row"><span className="detail-row-label">Miqdor</span><span className="detail-row-value">{formatMoney(debt.amount)} so'm</span></div>
        <div className="detail-row"><span className="detail-row-label">Foiz</span><span className="detail-row-value" style={{color:'var(--success)'}}>Foizsiz (0%)</span></div>
        <div className="detail-row"><span className="detail-row-label">Qaytarish muddati</span><span className="detail-row-value">{formatDate(debt.dueDate)}</span></div>
        <div className="detail-row"><span className="detail-row-label">Sabab</span><span className="detail-row-value">{debt.reason || '—'}</span></div>
        <div className="detail-row"><span className="detail-row-label">Yaratilgan</span><span className="detail-row-value">{formatDateTime(debt.createdAt)}</span></div>
        {debt.confirmedAt && <div className="detail-row"><span className="detail-row-label">Tasdiqlangan</span><span className="detail-row-value">{formatDateTime(debt.confirmedAt)}</span></div>}
        {debt.closedAt && <div className="detail-row"><span className="detail-row-label">Yopilgan</span><span className="detail-row-value">{formatDateTime(debt.closedAt)}</span></div>}
      </div>

      {canConfirm && (
        <div className="action-buttons">
          <button className="btn btn-success btn-lg" onClick={() => handleAction('confirm')} disabled={actionLoading}><CheckCircle size={18}/> Tasdiqlash</button>
          <button className="btn btn-danger btn-lg" onClick={() => handleAction('reject')} disabled={actionLoading}><XCircle size={18}/> Rad etish</button>
        </div>
      )}

      {canClose && !alreadyRequestedClose && (
        <div style={{ marginTop:'16px' }}>
          <button className="btn btn-success btn-block btn-lg" onClick={() => handleAction('close')} disabled={actionLoading}>
            <DollarSign size={18}/> To'landi deb belgilash
          </button>
          <p style={{ textAlign:'center',marginTop:'8px',fontSize:'0.75rem',color:'var(--text-muted)' }}>Ikki tomon ham tasdiqlashi kerak</p>
        </div>
      )}

      {alreadyRequestedClose && debt.status !== 'closed' && (
        <div className="card" style={{ marginTop:'16px',background:'var(--success-bg)',textAlign:'center' }}>
          <p style={{ color:'var(--success)',fontWeight:600,fontSize:'0.9rem',display:'flex',alignItems:'center',justifyContent:'center',gap:6 }}>
            <CheckCircle size={16}/> Siz to'lovni tasdiqladingiz. Ikkinchi tomon tasdiqlashini kuting.
          </p>
        </div>
      )}

      {(debt.status === 'active' || debt.status === 'closed') && (
        <button className="btn btn-secondary btn-block" style={{ marginTop:'12px' }} onClick={handleGeneratePDF}>
          <FileDown size={16}/> PDF shartnoma yuklab olish
        </button>
      )}

      {logs.length > 0 && (
        <div className="detail-section" style={{ marginTop:'16px' }}>
          <h3 style={{ fontSize:'0.9rem',fontWeight:600,marginBottom:'12px',display:'flex',alignItems:'center',gap:6 }}><History size={16}/> Tarix</h3>
          {logs.map(log => (
            <div key={log.id} style={{ padding:'8px 0',borderBottom:'1px solid #F3F4F6',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
              <span style={{ fontSize:'0.8rem' }}>{log.action === 'created' ? 'Yaratildi' : log.action === 'confirmed' ? 'Tasdiqlandi' : log.action === 'rejected' ? 'Rad etildi' : log.action === 'close_requested' ? 'To\'lov tasdiqlandi' : 'Yopildi'}</span>
              <span style={{ fontSize:'0.7rem',color:'var(--text-muted)' }}>{timeAgo(log.timestamp)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
