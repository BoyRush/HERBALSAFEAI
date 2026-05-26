import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  const { isAuthenticated, role, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [particles, setParticles] = useState([]);

  // Only run on client to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    setParticles(
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: (i * 4.8 + 2) % 98,
        top: (i * 7.3 + 5) % 95,
        size: (i % 4) + 2,
        duration: (i % 8) + 6,
        delay: (i % 5),
        opacity: ((i % 5) + 2) / 10,
      }))
    );
  }, []);

  // Determine where to go when user explicitly clicks "Go to Dashboard"
  const getDashboardPath = () => {
    if (role === 'admin') return '/admin/dashboard';
    if (role === 'patient') return '/patient/dashboard';
    if (role === 'herbal_doctor') return '/herbs/dashboard';
    return '/doctor/dashboard';
  };

  // Show a minimal shell while auth is loading (no redirect!)
  if (!mounted) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#020d08',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span style={{ color: '#34d399', fontFamily: 'sans-serif', fontSize: 18 }}>
          HERBALSAFE AI
        </span>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>HERBALSAFE AI — Rekomendasi Herbal Cerdas</title>
        <meta name="description" content="Platform AI untuk rekomendasi pengobatan herbal yang aman dan tervalidasi medis." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .hs-page {
          min-height: 100vh;
          background: radial-gradient(ellipse 80% 60% at 50% -10%, #052e1a 0%, #041a10 40%, #020d08 70%, #000 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-family: 'Inter', sans-serif;
          position: relative;
          overflow: hidden;
        }

        .hs-glow-top {
          position: absolute; top: -120px; left: 50%; transform: translateX(-50%);
          width: 700px; height: 400px;
          background: radial-gradient(ellipse, rgba(52,211,153,0.18) 0%, transparent 70%);
          pointer-events: none;
        }
        .hs-glow-left {
          position: absolute; bottom: 10%; left: -150px;
          width: 380px; height: 380px;
          background: radial-gradient(ellipse, rgba(16,185,129,0.10) 0%, transparent 70%);
          pointer-events: none;
        }
        .hs-glow-right {
          position: absolute; top: 30%; right: -120px;
          width: 320px; height: 320px;
          background: radial-gradient(ellipse, rgba(5,150,105,0.10) 0%, transparent 70%);
          pointer-events: none;
        }
        .hs-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(52,211,153,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(52,211,153,0.04) 1px, transparent 1px);
          background-size: 60px 60px;
          pointer-events: none;
        }

        .hs-particle {
          position: absolute; border-radius: 50%;
          background: radial-gradient(circle, rgba(52,211,153,0.9), rgba(16,185,129,0.2));
          animation: float-up linear infinite;
          pointer-events: none;
        }
        @keyframes float-up {
          0%   { transform: translateY(0) scale(1); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 0.5; }
          100% { transform: translateY(-120vh) scale(0.4); opacity: 0; }
        }

        .hs-content {
          position: relative; z-index: 2;
          display: flex; flex-direction: column;
          align-items: center; padding: 32px 24px;
          text-align: center;
        }

        /* Badge */
        .hs-badge {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 6px 18px; border-radius: 999px;
          background: rgba(52,211,153,0.08);
          border: 1px solid rgba(52,211,153,0.22);
          color: #6ee7b7; font-size: 12px; font-weight: 500;
          letter-spacing: 0.08em; text-transform: uppercase;
          margin-bottom: 28px; backdrop-filter: blur(8px);
          animation: hs-fadein 0.7s ease both;
        }
        .hs-badge-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #34d399; box-shadow: 0 0 8px #34d399;
          animation: pulse-dot 2s ease-in-out infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { box-shadow: 0 0 8px #34d399; }
          50%       { box-shadow: 0 0 20px #34d399, 0 0 35px rgba(52,211,153,0.4); }
        }

        /* Title */
        .hs-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(52px, 10vw, 110px);
          font-weight: 800; line-height: 1;
          background: linear-gradient(135deg, #d1fae5 0%, #6ee7b7 22%, #34d399 46%, #10b981 66%, #059669 82%, #6ee7b7 100%);
          background-size: 200% 200%;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradient-move 5s ease infinite, hs-fadein 0.9s ease both;
          letter-spacing: -2px;
          filter: drop-shadow(0 0 40px rgba(52,211,153,0.3));
        }
        @keyframes gradient-move {
          0%, 100% { background-position: 0% 50%; }
          50%       { background-position: 100% 50%; }
        }

        .hs-subtitle {
          margin-top: 20px; font-size: clamp(14px, 2.5vw, 18px);
          color: rgba(167,243,208,0.6); max-width: 480px;
          line-height: 1.7; font-weight: 400;
          animation: hs-fadein 1.1s ease both;
        }

        .hs-divider {
          width: 80px; height: 2px;
          background: linear-gradient(90deg, transparent, #34d399, transparent);
          margin: 28px auto;
          animation: hs-fadein 1.2s ease both;
        }

        /* Action buttons */
        .hs-actions {
          display: flex; gap: 14px; margin-top: 4px;
          flex-wrap: wrap; justify-content: center;
          animation: hs-fadein 1.3s ease both;
        }

        .hs-btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 14px 36px; border-radius: 12px;
          background: linear-gradient(135deg, #059669 0%, #10b981 55%, #34d399 100%);
          color: #fff; font-family: 'Inter', sans-serif;
          font-size: 15px; font-weight: 600;
          border: none; cursor: pointer;
          text-decoration: none; letter-spacing: 0.02em;
          box-shadow: 0 0 28px rgba(52,211,153,0.32), 0 4px 20px rgba(5,150,105,0.35);
          transition: all 0.25s ease; position: relative; overflow: hidden;
        }
        .hs-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 44px rgba(52,211,153,0.5), 0 8px 28px rgba(5,150,105,0.45);
        }

        .hs-btn-secondary {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 14px 36px; border-radius: 12px;
          background: rgba(52,211,153,0.07);
          color: #6ee7b7; font-family: 'Inter', sans-serif;
          font-size: 15px; font-weight: 500;
          border: 1px solid rgba(52,211,153,0.28);
          cursor: pointer; text-decoration: none;
          backdrop-filter: blur(10px);
          transition: all 0.25s ease;
        }
        .hs-btn-secondary:hover {
          background: rgba(52,211,153,0.13);
          border-color: rgba(52,211,153,0.55);
          color: #a7f3d0; transform: translateY(-2px);
        }

        .hs-btn-dashboard {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 14px 32px; border-radius: 12px;
          background: linear-gradient(135deg, #059669, #10b981);
          color: #fff; font-size: 15px; font-weight: 600;
          border: none; cursor: pointer; text-decoration: none;
          box-shadow: 0 4px 20px rgba(5,150,105,0.35);
          transition: all 0.25s ease;
        }
        .hs-btn-dashboard:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(5,150,105,0.5); }

        /* Logged-in label */
        .hs-logged-label {
          font-size: 13px; color: rgba(110,231,183,0.5);
          margin-bottom: 16px;
          animation: hs-fadein 1.3s ease both;
        }

        /* Feature chips */
        .hs-chips {
          display: flex; gap: 12px; margin-top: 48px;
          flex-wrap: wrap; justify-content: center;
          animation: hs-fadein 1.5s ease both;
        }
        .hs-chip {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 16px; border-radius: 999px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(52,211,153,0.11);
          color: rgba(167,243,208,0.5); font-size: 12px; font-weight: 500;
          backdrop-filter: blur(6px);
        }

        .hs-footer {
          position: absolute; bottom: 22px;
          color: rgba(52,211,153,0.18); font-size: 11px;
          letter-spacing: 0.1em; text-transform: uppercase;
        }

        @keyframes hs-fadein {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="hs-page">
        <div className="hs-glow-top" />
        <div className="hs-glow-left" />
        <div className="hs-glow-right" />
        <div className="hs-grid" />

        {/* Particles - deterministic so no hydration mismatch */}
        {particles.map(p => (
          <div
            key={p.id}
            className="hs-particle"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              opacity: p.opacity,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}

        <div className="hs-content">
          <div className="hs-badge">
            <span className="hs-badge-dot" />
            Platform Herbal Bertenaga AI
          </div>

          <h1 className="hs-title">HERBALSAFE AI</h1>

          <p className="hs-subtitle">
            Rekomendasi pengobatan herbal yang aman, cerdas, dan tervalidasi secara medis — untuk kesehatan Anda.
          </p>

          <div className="hs-divider" />

          {/* Show different CTAs based on auth state */}
          {!loading && isAuthenticated ? (
            <>
              <p className="hs-logged-label">Anda sudah masuk ke sistem</p>
              <div className="hs-actions">
                <a href={getDashboardPath()} className="hs-btn-dashboard">
                  🌿 Buka Dashboard →
                </a>
              </div>
            </>
          ) : (
            <div className="hs-actions">
              <Link href="/login" className="hs-btn-primary">
                <span>✦</span> Masuk Sekarang
              </Link>
              <Link href="/register" className="hs-btn-secondary">
                Daftar Gratis →
              </Link>
            </div>
          )}

          <div className="hs-chips">
            <div className="hs-chip">🌿 Herbal Tervalidasi</div>
            <div className="hs-chip">🤖 RAG AI Engine</div>
            <div className="hs-chip">🔒 Data Aman</div>
            <div className="hs-chip">👨‍⚕️ Diawasi Dokter</div>
          </div>
        </div>

        <p className="hs-footer">© 2026 HerbalSafe AI · All rights reserved</p>
      </div>
    </>
  );
}
