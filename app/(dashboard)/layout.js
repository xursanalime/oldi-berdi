'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { getInitials } from '@/lib/utils';
import { Home, List, PlusCircle, User, Handshake } from 'lucide-react';

export default function DashboardLayout({ children }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [user, loading, router]);

  if (loading) return <div className="loading-center" style={{ minHeight: '100vh' }}><div className="spinner"></div></div>;
  if (!user) return null;

  const navItems = [
    { href: '/dashboard', icon: Home, label: 'Asosiy' },
    { href: '/debts', icon: List, label: 'Qarzlar' },
    { href: '/debts/new', icon: PlusCircle, label: 'Yangi' },
    { href: '/profile', icon: User, label: 'Profil' },
  ];

  return (
    <div className="app-layout">
      <header className="app-header">
        <Link href="/dashboard" className="app-logo">
          <div className="app-logo-icon"><Handshake size={18} /></div>
          <span>Oldi-Berdi</span>
        </Link>
        <div className="header-right">
          <nav className="desktop-nav" style={{ display: 'flex', gap: '4px' }}>
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${pathname === item.href ? 'active' : ''}`}
                style={{ textDecoration: 'none' }}
              >
                <item.icon size={15} /> {item.label}
              </Link>
            ))}
          </nav>
          <button className="header-user" onClick={() => router.push('/profile')}>
            <div className="header-avatar">{getInitials(user.name)}</div>
            <span className="header-name">{user.name}</span>
          </button>
        </div>
      </header>

      <main className="main-content">{children}</main>

      <nav className="bottom-nav">
        <div className="bottom-nav-inner">
          {navItems.map(item => (
            <Link key={item.href} href={item.href} className={`nav-item ${pathname === item.href ? 'active' : ''}`}>
              <span className="nav-icon"><item.icon size={20} /></span>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
