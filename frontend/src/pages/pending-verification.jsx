import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import { Clock, LogOut } from 'lucide-react';

export default function PendingVerification() {
  const { logout, fullName } = useAuth();

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'radial-gradient(circle at center, var(--bg-secondary), var(--bg-primary))' 
    }}>
      <div className="glass-panel animate-fade-in" style={{ 
        padding: '3rem', 
        width: '100%', 
        maxWidth: '500px', 
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem'
      }}>
        <Clock size={64} color="#f59e0b" style={{ marginBottom: '1rem' }} />
        
        <h2 style={{ fontSize: '1.8rem', color: 'var(--text-primary)', margin: 0 }}>
          Verifikasi Dalam Proses
        </h2>
        
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: '1.6' }}>
          Halo {fullName || 'Dokter'}, pendaftaran Anda telah kami terima dan saat ini sedang dalam peninjauan oleh Administrator HERBALSAFE AI.
        </p>
        
        <div style={{ 
          background: 'rgba(245, 158, 11, 0.1)', 
          borderLeft: '4px solid #f59e0b', 
          padding: '1rem', 
          borderRadius: 'var(--radius-md)',
          textAlign: 'left',
          width: '100%'
        }}>
          <p style={{ color: '#f59e0b', margin: 0, fontSize: '0.95rem' }}>
            <strong>Informasi:</strong> Dokumen STR/SIP Anda sedang divalidasi. Anda akan bisa mengakses dasbor setelah akun Anda disetujui (Approved).
          </p>
        </div>

        <button 
          onClick={logout} 
          className="btn btn-secondary" 
          style={{ marginTop: '1rem', width: '100%', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}
        >
          <LogOut size={18} /> Keluar dan Kembali Nanti
        </button>
      </div>
    </div>
  );
}
