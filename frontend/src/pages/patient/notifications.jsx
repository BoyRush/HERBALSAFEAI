import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { Bell, CheckCheck } from 'lucide-react';

export default function PatientNotifications() {
  const { user } = useAuth();
  const [notifs, setNotifs] = useState([]);

  useEffect(() => {
    const fetchNotifs = async () => {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) { const d = await res.json(); setNotifs(d.notifications || []); }
    };
    fetchNotifs();
  }, []);

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Bell size={28} color="var(--accent-primary)" /> Notifikasi
        </h1>
        {notifs.length === 0 ? (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
            <CheckCheck size={48} color="var(--text-secondary)" style={{ marginBottom: '1rem' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Tidak ada notifikasi baru.</p>
          </div>
        ) : notifs.map((n, i) => (
          <div key={i} className="glass-panel" style={{ padding: '1.25rem 1.5rem', marginBottom: '0.75rem', borderLeft: n.is_read ? '4px solid var(--border-color)' : '4px solid var(--accent-primary)' }}>
            <p style={{ color: 'var(--text-primary)', margin: '0 0 0.25rem' }}>{n.pesan}</p>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(n.tanggal).toLocaleString('id-ID')}</span>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
