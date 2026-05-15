'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { formatMoney, formatDate, STATUS_LABELS, STATUS_CLASSES, getInitials, daysUntilDue } from '@/lib/utils';
import { TrendingUp, TrendingDown, BarChart3, Clock, Bell, AlertTriangle, ChevronRight, Plus, FileText } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      fetch(`/api/stats?userId=${user.id}`).then(r => r.json()),
      fetch(`/api/debts?userId=${user.id}`).then(r => r.json()),
    ]).then(([s, d]) => {
      setStats(s);
      setDebts(d.debts || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  if (loading) return <div className="loading-center"><div className="spinner"></div></div>;

  const recentDebts = debts.slice(0, 5);
  const totalBalance = (stats?.totalLent || 0) - (stats?.totalBorrowed || 0);
  const pendingForMe = debts.filter(d => d.status === 'pending' && d.counterpartyId === user.id);
  const overdueCount = debts.filter(d => d.status === 'overdue').length;

  return (
    <div className="animate-in">
      {/* Hero Card */}
      <div className="hero-card">
        <div className="hero-greeting">Salom, {user?.name?.split(' ')[0]}!</div>
        <div className="hero-amount">{totalBalance >= 0 ? '+' : ''}{formatMoney(totalBalance)} <span style={{fontSize:'0.45em',opacity:0.7}}>so'm</span></div>
        <div className="hero-label">Umumiy balans</div>
      </div>

      {/* Stat Chips */}
      <div className="stat-chips">
        <div className="stat-chip">
          <div className="stat-chip-icon green"><TrendingUp size={16} color="#10B981" /></div>
          <div className="stat-chip-info">
            <div className="stat-chip-value">{formatMoney(stats?.totalLent || 0)}</div>
            <div className="stat-chip-label">Bergan qarzlar</div>
          </div>
        </div>
        <div className="stat-chip">
          <div className="stat-chip-icon orange"><TrendingDown size={16} color="#F59E0B" /></div>
          <div className="stat-chip-info">
            <div className="stat-chip-value">{formatMoney(stats?.totalBorrowed || 0)}</div>
            <div className="stat-chip-label">Olgan qarzlar</div>
          </div>
        </div>
        <div className="stat-chip">
          <div className="stat-chip-icon blue"><BarChart3 size={16} color="#3B82F6" /></div>
          <div className="stat-chip-info">
            <div className="stat-chip-value">{stats?.activeCount || 0}</div>
            <div className="stat-chip-label">Faol qarzlar</div>
          </div>
        </div>
        <div className="stat-chip">
          <div className="stat-chip-icon purple"><Clock size={16} color="#6C3CE1" /></div>
          <div className="stat-chip-info">
            <div className="stat-chip-value">{stats?.pendingCount || 0}</div>
            <div className="stat-chip-label">Kutilmoqda</div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {pendingForMe.length > 0 && (
        <Link href="/debts?status=pending" className="alert-card warning" style={{textDecoration:'none'}}>
          <span className="alert-card-icon"><Bell size={20} color="#F59E0B" /></span>
          <div className="alert-card-text">
            <div className="alert-card-title">{pendingForMe.length} ta tasdiqlanmagan so'rov</div>
            <div className="alert-card-sub">Ko'rish va tasdiqlash uchun bosing</div>
          </div>
          <span className="alert-card-arrow"><ChevronRight size={18} /></span>
        </Link>
      )}

      {overdueCount > 0 && (
        <div className="alert-card danger">
          <span className="alert-card-icon"><AlertTriangle size={20} color="#EF4444" /></span>
          <div className="alert-card-text">
            <div className="alert-card-title">{overdueCount} ta qarz muddati o'tgan</div>
            <div className="alert-card-sub">Iltimos, to'lovni amalga oshiring</div>
          </div>
        </div>
      )}

      {/* Recent Debts */}
      <div className="section-header">
        <h2 className="section-title">Oxirgi qarzlar</h2>
        <Link href="/debts" className="section-link">Barchasi <ChevronRight size={14} style={{verticalAlign:'middle'}} /></Link>
      </div>

      {recentDebts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><FileText size={48} color="#9CA3AF" /></div>
          <div className="empty-title">Hali qarzlar yo'q</div>
          <div className="empty-text">Yangi qarz so'rovi yarating</div>
          <Link href="/debts/new" className="btn btn-primary" style={{textDecoration:'none'}}><Plus size={16} /> Yangi qarz</Link>
        </div>
      ) : (
        <div className="debt-list">
          {recentDebts.map(debt => {
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
