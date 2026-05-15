'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { formatMoney, formatDate, STATUS_LABELS, STATUS_CLASSES, getInitials, daysUntilDue } from '@/lib/utils';
import { Plus, FileText, Clock, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

const TABS = [
  { key: 'all', label: 'Barchasi' },
  { key: 'pending', label: 'Kutilmoqda', icon: Clock },
  { key: 'active', label: 'Faol', icon: CheckCircle },
  { key: 'overdue', label: "Muddati o'tgan", icon: AlertTriangle },
  { key: 'closed', label: 'Yopilgan', icon: XCircle },
];

export default function DebtsPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get('status') || 'all');

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetch(`/api/debts?userId=${user.id}&status=${activeTab}`)
      .then(r => r.json())
      .then(d => { setDebts(d.debts || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user, activeTab]);

  return (
    <div className="animate-in">
      <h1 className="page-title">Qarzlar</h1>
      <p className="page-subtitle">Barcha qarzlaringiz ro'yxati</p>

      <div className="tabs">
        {TABS.map(tab => (
          <button key={tab.key} className={`tab ${activeTab === tab.key ? 'active' : ''}`} onClick={() => setActiveTab(tab.key)}>
            {tab.icon && <tab.icon size={13} style={{verticalAlign:'middle',marginRight:3}} />}
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner"></div></div>
      ) : debts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><FileText size={48} color="#9CA3AF" /></div>
          <div className="empty-title">Qarz topilmadi</div>
          <div className="empty-text">{activeTab === 'all' ? 'Hali qarzlar yo\'q' : `Bu filtrdagi qarzlar yo'q`}</div>
          <Link href="/debts/new" className="btn btn-primary" style={{textDecoration:'none'}}><Plus size={16} /> Yangi qarz</Link>
        </div>
      ) : (
        <div className="debt-list">
          {debts.map(debt => {
            const isLender = (debt.creatorId === user.id && debt.creatorRole === 'lender') ||
                             (debt.counterpartyId === user.id && debt.creatorRole === 'borrower');
            const otherName = debt.creatorId === user.id ? debt.counterpartyName : debt.creatorName;
            const days = daysUntilDue(debt.dueDate);
            return (
              <Link href={`/debts/${debt.id}`} className={`debt-card ${isLender ? 'lender-card' : 'borrower-card'}`} key={debt.id}>
                <div className={`debt-avatar ${isLender ? 'lender' : 'borrower'}`}>{getInitials(otherName)}</div>
                <div className="debt-info">
                  <div className="debt-name">{otherName}</div>
                  <div className="debt-reason">
                    {debt.reason || 'Sabab ko\'rsatilmagan'}
                    <span className={`badge ${STATUS_CLASSES[debt.status]}`}>{STATUS_LABELS[debt.status]}</span>
                  </div>
                </div>
                <div className="debt-right">
                  <div className={`debt-amount ${isLender ? 'positive' : 'negative'}`}>{isLender ? '+' : '-'}{formatMoney(debt.amount)}</div>
                  <div className="debt-date">{debt.status === 'active' && days > 0 ? `${days} kun qoldi` : formatDate(debt.dueDate)}</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
      <Link href="/debts/new" className="fab"><Plus size={24} /></Link>
    </div>
  );
}
