import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { CheckCircle, XCircle, Clock, UserCheck, Bell } from 'lucide-react';

export default function AksesDokter() {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchPermissions = async () => {
    setLoading(true);
    const res = await fetch('http://localhost:5000/access/status', { headers });
    if (res.ok) {
      const d = await res.json();
      setPermissions(d.permissions || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchPermissions(); }, []);

  const respond = async (doctorUserId, action) => {
    const res = await fetch('http://localhost:5000/access/respond', {
      method: 'POST', headers,
      body: JSON.stringify({ doctor_user_id: doctorUserId, action })
    });
    if (res.ok) {
      setMsg(action === 'approved' ? 'Akses dokter telah disetujui.' : 'Permintaan akses ditolak.');
      fetchPermissions();
    }
  };

  const statusInfo = {
    pending: { label: 'Menunggu', color: '#f59e0b', icon: <Clock size={16} /> },
    approved: { label: 'Diizinkan', color: 'var(--accent-primary)', icon: <CheckCircle size={16} /> },
    rejected: { label: 'Ditolak', color: '#ef4444', icon: <XCircle size={16} /> },
  };

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <UserCheck size={28} color="var(--accent-primary)" /> Manajemen Akses Dokter
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Kelola dokter yang meminta akses ke rekam medis Anda. Data medis hanya dapat dilihat oleh dokter yang Anda izinkan.
        </p>

        {msg && (
          <div style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--accent-primary)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={18} />{msg}</span>
            <button onClick={() => setMsg('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)', fontSize: '1.2rem' }}>✕</button>
          </div>
        )}

        {loading ? (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}><p>Memuat...</p></div>
        ) : permissions.length === 0 ? (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
            <Bell size={48} color="var(--text-secondary)" style={{ marginBottom: '1rem' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Belum ada dokter yang meminta akses ke data medis Anda.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {permissions.map((p, i) => {
              const info = statusInfo[p.status] || statusInfo.pending;
              return (
                <div key={i} className="glass-panel" style={{ padding: '1.5rem', borderLeft: `4px solid ${info.color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.1rem' }}>dr. {p.doctor_name}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: info.color, fontSize: '0.875rem', fontWeight: 500 }}>
                        {info.icon}{info.label}
                        {p.requested_at && (
                          <span style={{ color: 'var(--text-secondary)', fontWeight: 400, marginLeft: '0.5rem' }}>
                            · {new Date(p.requested_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                    {p.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => respond(p.doctor_user_id, 'approved')}
                          style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.4)', color: 'var(--accent-primary)', padding: '0.4rem 1rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'var(--font-family)', fontWeight: 500, transition: 'all 0.2s' }}
                          onMouseOver={e => e.currentTarget.style.background = 'rgba(16,185,129,0.2)'}
                          onMouseOut={e => e.currentTarget.style.background = 'rgba(16,185,129,0.1)'}
                        >
                          <CheckCircle size={16} />Izinkan
                        </button>
                        <button
                          onClick={() => respond(p.doctor_user_id, 'rejected')}
                          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', padding: '0.4rem 1rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'var(--font-family)', fontWeight: 500, transition: 'all 0.2s' }}
                          onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
                          onMouseOut={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                        >
                          <XCircle size={16} />Tolak
                        </button>
                      </div>
                    )}
                    {p.status === 'approved' && (
                      <button
                        onClick={() => respond(p.doctor_user_id, 'rejected')}
                        style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '0.4rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'var(--font-family)' }}
                      >
                        Cabut Izin
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
