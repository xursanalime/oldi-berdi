'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Wallet, ArrowDownLeft, Send, Loader2 } from 'lucide-react';

export default function NewDebtPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    creatorRole: 'lender',
    counterpartyPhone: '',
    amount: '',
    dueDate: '',
    reason: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    // Telefon tozalash va tekshirish
    const VALID_PREFIXES = ['20','33','50','55','71','77','78','88','90','91','93','94','95','97','98','99'];
    let cleanedPhone = form.counterpartyPhone.replace(/\D/g, '');
    if (cleanedPhone.startsWith('998') && cleanedPhone.length > 9) cleanedPhone = cleanedPhone.slice(3);
    cleanedPhone = cleanedPhone.slice(0, 9);

    if (cleanedPhone.length < 9) {
      setError('Telefon raqamini to\'liq kiriting (9 raqam)'); return;
    }
    if (!VALID_PREFIXES.includes(cleanedPhone.slice(0, 2))) {
      setError('Telefon raqami noto\'g\'ri'); return;
    }
    const rawAmount = Number(form.amount.replace(/\D/g, ''));
    if (!form.amount || !rawAmount || rawAmount <= 0) {
      setError('Qarz miqdorini kiriting'); return;
    }
    if (!form.dueDate) { setError('Qaytarish muddatini kiriting'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/debts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: user.id,
          creatorRole: form.creatorRole,
          counterpartyPhone: cleanedPhone,
          amount: Number(form.amount.replace(/\D/g, '')),
          dueDate: form.dueDate,
          reason: form.reason,
        }),
      });
      const data = await res.json();
      if (data.success) { setSuccess(true); setTimeout(() => router.push('/debts'), 1500); }
      else setError(data.error || 'Xatolik yuz berdi');
    } catch { setError('Server bilan aloqa yo\'q'); }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="animate-in" style={{ textAlign: 'center', paddingTop: '60px' }}>
        <div style={{ width:64,height:64,borderRadius:'50%',background:'var(--success-bg)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2 style={{ marginBottom: '8px' }}>Qarz so'rovi yaratildi!</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Ikkinchi tomonga bildirishnoma yuborildi</p>
      </div>
    );
  }

  return (
    <div className="animate-in">
      <h1 className="page-title">Yangi qarz</h1>
      <p className="page-subtitle">Qarz so'rovini yarating</p>

      {error && (
        <div style={{ background:'var(--danger-bg)',color:'var(--danger)',padding:'10px 16px',borderRadius:'var(--radius-md)',fontSize:'0.85rem',marginBottom:'16px',fontWeight:500 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: '16px' }}>
          <label className="form-label">Siz kim sifatida harakat qilyapsiz?</label>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button type="button" className={`btn ${form.creatorRole === 'lender' ? 'btn-primary' : 'btn-outline'}`} style={{ flex:1 }} onClick={() => setForm({ ...form, creatorRole: 'lender' })}>
              <Wallet size={16} /> Qarz beruvchi
            </button>
            <button type="button" className={`btn ${form.creatorRole === 'borrower' ? 'btn-primary' : 'btn-outline'}`} style={{ flex:1 }} onClick={() => setForm({ ...form, creatorRole: 'borrower' })}>
              <ArrowDownLeft size={16} /> Qarz oluvchi
            </button>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '16px' }}>
          <div className="form-group">
            <label className="form-label">{form.creatorRole === 'lender' ? 'Qarz oluvchi telefoni' : 'Qarz beruvchi telefoni'}</label>
            <div className="phone-input-wrapper">
              <span className="phone-prefix">+998</span>
              <input className="phone-input" type="tel" placeholder="90 123 45 67" value={form.counterpartyPhone}
                onChange={e => setForm({ ...form, counterpartyPhone: e.target.value.replace(/[^\d\s]/g, '').slice(0, 12) })} id="counterparty-phone" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Qarz miqdori (so'm)</label>
            <input className="form-input" type="text" inputMode="numeric" placeholder="1 000 000" value={form.amount}
              onChange={e => { const raw = e.target.value.replace(/\D/g, ''); setForm({ ...form, amount: raw ? new Intl.NumberFormat('uz-UZ').format(Number(raw)) : '' }); }} id="debt-amount" />
            <p className="form-hint">Foizsiz qarz tizimi</p>
          </div>
          <div className="form-group">
            <label className="form-label">Qaytarish muddati</label>
            <input className="form-input" type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })}
              min={new Date().toISOString().split('T')[0]} id="due-date" />
          </div>
          <div className="form-group">
            <label className="form-label">Sabab / Izoh</label>
            <textarea className="form-input" placeholder="Masalan: Uy ta'miri uchun" value={form.reason}
              onChange={e => setForm({ ...form, reason: e.target.value })} rows={3} id="debt-reason" />
          </div>
        </div>

        <div className="card" style={{ marginBottom: '20px', background: 'var(--primary-ghost)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Xulosa</div>
          <div style={{ fontSize: '0.9rem' }}>
            Siz <strong>{form.creatorRole === 'lender' ? 'qarz berasiz' : 'qarz olasiz'}</strong>
            {form.amount && <> — <strong>{form.amount} so'm</strong></>}
            {form.dueDate && <>, muddat: <strong>{form.dueDate.split('-').reverse().join('.')}</strong></>}
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
          {loading ? <Loader2 size={20} className="spinner" style={{border:'none',animation:'spin 0.6s linear infinite'}} /> : <><Send size={16} /> So'rov yuborish</>}
        </button>
        <p style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Ikkinchi tomon tasdiqlaganidan keyin shartnoma kuchga kiradi
        </p>
      </form>
    </div>
  );
}
