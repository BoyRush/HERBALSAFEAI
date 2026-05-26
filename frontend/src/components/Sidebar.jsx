import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Home, Leaf, FileText, UserCheck, Bell, Settings, 
  KeyRound, PencilLine, Users, LogOut, Flower2, Clock 
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, dokterCount, notifications = {} }) => {
  const { username, role, fullName, logout } = useAuth();

  const menuConfig = {
    patient: [
      { id: 'beranda', label: 'Beranda', icon: <Home size={20} /> },
      { id: 'rekomendasi', label: 'Minta Rekomendasi', icon: <Leaf size={20} /> },
      { id: 'riwayat_medis', label: 'Riwayat Data Medis', icon: <FileText size={20} /> },
      { id: 'riwayat_rekomendasi', label: 'Riwayat Rekomendasi', icon: <Clock size={20} /> },
      { id: 'notifikasi', label: 'Notifikasi', icon: <Bell size={20} />, badgeKey: 'notifCount' },
      { id: 'profil', label: 'Profil Saya', icon: <Settings size={20} /> },
    ],
    doctor: [
      { id: 'dashboard', label: 'Dashboard', icon: <Home size={20} /> },
      { id: 'request', label: 'Request Akses', icon: <KeyRound size={20} /> },
      { id: 'list', label: 'Pasien Saya', icon: <Users size={20} /> },
      { id: 'input', label: 'Tambah Data Medis', icon: <PencilLine size={20} /> },
      { id: 'riwayat', label: 'Riwayat Input Data', icon: <Clock size={20} /> },
      { id: 'notifikasi', label: 'Notifikasi', icon: <Bell size={20} />, badgeKey: 'notifCount' },
      { id: 'profil', label: 'Profil Saya', icon: <Settings size={20} /> },
    ],
    herbal_doctor: [
      { id: 'dashboard', label: 'Beranda', icon: <Home size={20} /> },
      { id: 'input', label: 'Tambah Herbal', icon: <PencilLine size={20} /> },
      { id: 'katalog', label: 'Katalog Herbal', icon: <Flower2 size={20} /> },
      { id: 'profil', label: 'Profil Saya', icon: <Settings size={20} /> },
    ],
    admin: [
      { id: 'dashboard', label: 'Beranda', icon: <Home size={20} /> },
      { id: 'verifikasi', label: 'Verifikasi Akun', icon: <UserCheck size={20} />, badgeKey: 'pendingVerifCount' },
      { id: 'pengguna', label: 'Kelola Pengguna', icon: <Users size={20} /> },
      { id: 'profil', label: 'Profil Saya', icon: <Settings size={20} /> },
    ],
  };

  const currentMenu = menuConfig[role] || [];

  return (
    <div style={{
      width: '260px',
      height: '100vh',
      background: 'var(--bg-glass)',
      backdropFilter: 'blur(12px)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0,
      top: 0,
      padding: '1.5rem 0',
      zIndex: 1000
    }}>
      <div style={{ padding: '0 1.5rem 2rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Leaf size={28} color="var(--accent-primary)" />
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>HERBALSAFE AI</h2>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '0 1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {currentMenu.map((item) => {
          const isActive = activeTab === item.id;
          const badgeValue = 
            item.badgeKey === 'dokterCount' ? dokterCount : 
            (notifications && notifications[item.badgeKey]) ? notifications[item.badgeKey] : 0;
            
          return (
            <div
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex', alignItems: 'center', padding: '0.875rem 1rem',
                borderRadius: 'var(--radius-md)', cursor: 'pointer',
                transition: 'all 0.2s',
                background: isActive ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                borderLeft: isActive ? '3px solid var(--accent-primary)' : '3px solid transparent'
              }}
            >
              <span style={{ marginRight: '0.875rem', display: 'flex' }}>{item.icon}</span>
              <span style={{ fontSize: '0.875rem', fontWeight: isActive ? '600' : '400', flex: 1 }}>{item.label}</span>
              {badgeValue > 0 && (
                <span style={{
                  background: item.id === 'notifikasi' ? 'var(--accent-primary)' : '#ef4444',
                  color: '#fff', fontSize: '0.65rem', fontWeight: '700',
                  padding: '0.15rem 0.5rem', borderRadius: '1rem'
                }}>
                  {badgeValue}
                </span>
              )}
            </div>
          );
        })}
      </nav>

      <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--text-primary)' }}>
          {fullName ? fullName.substring(0, 1).toUpperCase() : (username ? username.substring(0, 1).toUpperCase() : '?')}
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <p style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{fullName || username || 'User'}</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>{role}</p>
        </div>
        <button onClick={logout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}>
          <LogOut size={18} />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
