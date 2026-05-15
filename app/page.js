'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Handshake, ArrowLeft, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  // Telefon raqamini tozalash (bo'shliq, +998, 998 prefix olib tashlash)
  const cleanPhone = (p) => {
    let cleaned = p.replace(/\D/g, '');
    if (cleaned.startsWith('998') && cleaned.length > 9) cleaned = cleaned.slice(3);
    return cleaned.slice(0, 9);
  };

  // O'zbekiston operator kodlari
  const VALID_PREFIXES = ['20','33','50','55','71','77','78','88','90','91','93','94','95','97','98','99'];

  const isValidUzPhone = (phone) => {
    if (phone.length !== 9) return false;
    const prefix = phone.slice(0, 2);
    return VALID_PREFIXES.includes(prefix);
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    const clean = cleanPhone(phone);
    if (clean.length < 9) { setError('Telefon raqamini to\'liq kiriting (9 raqam)'); return; }
    if (!isValidUzPhone(clean)) { setError('Telefon raqami noto\'g\'ri'); return; }
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: clean }) });
      const data = await res.json();
      if (data.success) setStep('otp'); else setError(data.error || 'Xatolik yuz berdi');
    } catch { setError('Server bilan aloqa yo\'q'); }
    setLoading(false);
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp]; newOtp[index] = value; setOtp(newOtp);
    if (value && index < 3) document.getElementById(`otp-${index + 1}`)?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) document.getElementById(`otp-${index - 1}`)?.focus();
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 4) { setError('4 xonali kodni kiriting'); return; }
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: cleanPhone(phone), otp: code }) });
      const data = await res.json();
      if (data.success) {
        if (!data.user.name || data.user.name.startsWith('+998')) setStep('name');
        else { login(data.user); router.push('/dashboard'); }
      } else setError(data.error || 'Kod noto\'g\'ri');
    } catch { setError('Server bilan aloqa yo\'q'); }
    setLoading(false);
  };

  const handleSetName = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Ismingizni kiriting'); return; }
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: cleanPhone(phone), otp: otp.join(''), name: name.trim() }) });
      const data = await res.json();
      if (data.success) { login(data.user); router.push('/dashboard'); }
    } catch { setError('Server bilan aloqa yo\'q'); }
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card animate-in">
        <div className="login-logo"><Handshake size={30} color="#fff" /></div>
        <h1 className="login-title">Oldi-Berdi</h1>
        <p className="login-subtitle">
          {step === 'phone' && 'Telefon raqamingiz orqali kiring'}
          {step === 'otp' && `+998 ${cleanPhone(phone).replace(/(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4')} raqamiga kod yuborildi`}
          {step === 'name' && 'Ismingizni kiriting'}
        </p>

        {error && (
          <div style={{ background:'var(--danger-bg)',color:'var(--danger)',padding:'10px 16px',borderRadius:'var(--radius-md)',fontSize:'0.85rem',marginBottom:'16px',fontWeight:500 }}>
            {error}
          </div>
        )}

        {step === 'phone' && (
          <form onSubmit={handleSendOtp}>
            <div className="phone-input-wrapper" style={{ marginBottom:'20px' }}>
              <span className="phone-prefix">+998</span>
              <input className="phone-input" type="tel" placeholder="90 123 45 67" value={phone}
                onChange={e => {
                  let val = e.target.value.replace(/[^\d\s]/g, '');
                  // Agar 998 bilan boshlasa, olib tashlash
                  let digits = val.replace(/\s/g, '');
                  if (digits.startsWith('998') && digits.length > 9) digits = digits.slice(3);
                  setPhone(digits.slice(0, 9));
                }} autoFocus id="phone-input" />
            </div>
            <button className="btn btn-primary btn-block btn-lg" disabled={loading} type="submit">
              {loading ? <Loader2 size={20} style={{animation:'spin 0.6s linear infinite'}} /> : 'Davom etish'}
            </button>
            <p style={{ marginTop:'16px',fontSize:'0.75rem',color:'var(--text-muted)' }}>
              Demo rejim: istalgan raqamni kiriting, OTP kod — <strong>1234</strong>
            </p>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp}>
            <div className="otp-inputs">
              {otp.map((digit, i) => (
                <input key={i} id={`otp-${i}`} className="otp-input" type="text" inputMode="numeric" maxLength={1}
                  value={digit} onChange={e => handleOtpChange(i, e.target.value)} onKeyDown={e => handleOtpKeyDown(i, e)} autoFocus={i === 0} />
              ))}
            </div>
            <button className="btn btn-primary btn-block btn-lg" disabled={loading} type="submit">
              {loading ? <Loader2 size={20} style={{animation:'spin 0.6s linear infinite'}} /> : 'Tasdiqlash'}
            </button>
            <button type="button" className="btn btn-secondary btn-block" style={{ marginTop:'10px' }}
              onClick={() => { setStep('phone'); setOtp(['','','','']); setError(''); }}>
              <ArrowLeft size={15}/> Orqaga
            </button>
          </form>
        )}

        {step === 'name' && (
          <form onSubmit={handleSetName}>
            <div className="form-group">
              <input className="form-input" type="text" placeholder="Ism Familiya" value={name}
                onChange={e => setName(e.target.value)} autoFocus id="name-input" />
              <p className="form-hint">Shartnomada ko'rsatiladigan ism</p>
            </div>
            <button className="btn btn-primary btn-block btn-lg" disabled={loading} type="submit">
              {loading ? <Loader2 size={20} style={{animation:'spin 0.6s linear infinite'}} /> : 'Kirish'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
