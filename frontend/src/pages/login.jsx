import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginWithPassword, isAuthenticated, loading: authLoading, role, logout } = useAuth();
  const router = useRouter();

  const getDashboardPath = () => {
    if (role === 'patient') return '/patient/dashboard';
    if (role === 'herbal_doctor') return '/herbs/dashboard';
    if (role === 'admin') return '/admin/dashboard';
    return '/patient/dashboard';
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await loginWithPassword(username, password);

    if (!result?.success) {
      setError(result?.error || 'Login gagal. Periksa username dan password Anda.');
    }

    setLoading(false);
  };

  // Loading state saat cek autentikasi
  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at center, var(--bg-secondary), var(--bg-primary))'
      }}>
        <p style={{ color: 'var(--accent-primary)' }}>Memuat...</p>
      </div>
    );
  }

  // Jika sudah login (misal balik dari Dashboard via tombol Back),
  // tampilkan pilihan — bukan redirect otomatis agar tidak loop
  if (isAuthenticated && role) {
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
          maxWidth: '420px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--accent-primary)', marginBottom: '0.75rem' }}>
            Anda sudah masuk
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>
            Sesi Anda masih aktif. Silakan lanjutkan ke dashboard atau keluar terlebih dahulu.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              onClick={() => router.push(getDashboardPath())}
              className="btn btn-primary"
            >
              🌿 Lanjut ke Dashboard
            </button>

            <button
              onClick={() => logout()}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(239,68,68,0.4)',
                background: 'rgba(239,68,68,0.08)',
                color: '#ef4444',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.875rem',
              }}
            >
              Keluar dari Akun
            </button>

            <Link href="/" style={{
              color: 'var(--text-secondary)',
              fontSize: '0.8rem',
              textDecoration: 'none',
              opacity: 0.7,
              marginTop: '0.5rem'
            }}>
              ← Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Form Login — ditampilkan saat belum terautentikasi
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
        maxWidth: '400px',
        textAlign: 'center'
      }}>
        <h2 style={{ fontSize: '2rem', color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>HERBALSAFE AI</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Selamat datang kembali. Login untuk melanjutkan.
        </p>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444',
            padding: '0.75rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input
            type="text"
            placeholder="Username"
            className="input-field"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Password"
            className="input-field"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            disabled={loading}
          />
          <button
            type="submit"
            className="btn btn-primary"
            style={{ marginTop: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Sedang masuk...' : 'Login'}
          </button>
        </form>

        <p style={{ marginTop: '2rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Belum punya akun?{' '}
          <Link href="/register" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 }}>
            Daftar Gratis
          </Link>
        </p>
        <p style={{ marginTop: '0.75rem' }}>
          <Link href="/" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textDecoration: 'none', opacity: 0.7 }}>
            ← Kembali ke Beranda
          </Link>
        </p>
      </div>
    </div>
  );
}
