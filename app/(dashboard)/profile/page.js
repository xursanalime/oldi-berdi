'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { formatPhone } from '@/lib/utils';
import { Edit3, LogOut, Phone, Globe, Info, Save, X } from 'lucide-react';

export default function ProfilePage() {
  const { user, logout, updateName } = useAuth();
  const router = useRouter();
  const [name, setName] = useState(user?.name || '');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/user', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, name: name.trim() }) });
      const data = await res.json();
      if (data.success) { updateName(name.trim()); setEditing(false); showToast('Saqlandi!', 'success'); }
    } catch { showToast('Xatolik', 'error'); }
    setSaving(false);
  };

  const showToast = (msg, type) => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  return (
    <div className="animate-in">
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
      <h1 className="page-title">Profil</h1>
      <p className="page-subtitle">Shaxsiy ma'lumotlaringiz</p>

      <div className="card" style={{ textAlign:'center',padding:'32px 24px',marginBottom:'16px' }}>
        <div style={{ width:72,height:72,borderRadius:'50%',background:'var(--gradient-hero)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',color:'#fff',fontSize:'1.5rem',fontWeight:700,boxShadow:'var(--shadow-primary)' }}>
          {user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
        </div>
        {editing ? (
          <div style={{ marginBottom:'12px' }}>
            <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="Ism Familiya" autoFocus style={{ textAlign:'center',marginBottom:'10px' }} />
            <div style={{ display:'flex',gap:'8px',justifyContent:'center' }}>
              <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}><Save size={14}/> Saqlash</button>
              <button className="btn btn-outline btn-sm" onClick={() => { setEditing(false); setName(user.name); }}><X size={14}/> Bekor</button>
            </div>
          </div>
        ) : (
          <>
            <h2 style={{ fontSize:'1.2rem',marginBottom:'4px' }}>{user?.name}</h2>
            <p style={{ color:'var(--text-secondary)',fontSize:'0.9rem',marginBottom:'12px' }}>{formatPhone(user?.phone)}</p>
            <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}><Edit3 size={14}/> Ismni o'zgartirish</button>
          </>
        )}
      </div>

      <div className="detail-section">
        <div className="detail-row">
          <span className="detail-row-label" style={{display:'flex',alignItems:'center',gap:6}}><Phone size={14}/> Telefon</span>
          <span className="detail-row-value">{formatPhone(user?.phone)}</span>
        </div>
        <div className="detail-row">
          <span className="detail-row-label" style={{display:'flex',alignItems:'center',gap:6}}><Info size={14}/> Ilova versiyasi</span>
          <span className="detail-row-value">1.0.0</span>
        </div>
        <div className="detail-row">
          <span className="detail-row-label" style={{display:'flex',alignItems:'center',gap:6}}><Globe size={14}/> Platforma</span>
          <span className="detail-row-value">Web</span>
        </div>
      </div>

      <div className="card" style={{ marginTop:'16px',padding:'20px' }}>
        <h3 style={{ fontSize:'0.9rem',fontWeight:600,marginBottom:'8px',display:'flex',alignItems:'center',gap:6 }}><Info size={15}/> Oldi-Berdi haqida</h3>
        <p style={{ fontSize:'0.8rem',color:'var(--text-secondary)',lineHeight:1.7 }}>
          Oldi-Berdi — odamlar orasidagi qarz berish va olishni raqamlashtiruvchi platforma.
          Ikki tomonlama tasdiq bilan shartnoma kuchga kiradi. Barcha qarzlar foizsiz.
          Shartnomalar PDF shaklida yuklab olinadi.
        </p>
      </div>

      <button className="btn btn-danger btn-block" style={{ marginTop:'20px' }} onClick={() => { logout(); router.push('/'); }}>
        <LogOut size={16}/> Chiqish
      </button>
    </div>
  );
}
