import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Leaf, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

export default function RiwayatRekomendasi() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('herbalchain_token');
        const res = await axios.get('http://127.0.0.1:5000/herbal/history', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setHistory(res.data.history || []);
      } catch (err) {
        console.error('Gagal load history rekomendasi:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) return (
    <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', padding: '4rem 0' }}>
      <p style={{ color: 'var(--text-secondary)' }}>Memuat riwayat rekomendasi...</p>
    </div>
  );

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Riwayat Rekomendasi</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Catatan permintaan rekomendasi herbal yang pernah Anda ajukan</p>

      {history.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <Leaf size={48} color="var(--border-color)" />
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Belum ada riwayat rekomendasi.</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Ajukan keluhan di menu Minta Rekomendasi untuk memulai.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {history.map((h, i) => {
            const rekomenList = h.hasil_ai?.rekomendasi || [];
            const aman = rekomenList.some(r => r.status === 'success');
            return (
              <div key={i} className="glass-panel animate-fade-in" style={{ padding: '1.5rem', borderLeft: aman ? '4px solid var(--accent-primary)' : '4px solid #ef4444' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock size={14} />
                    {h.tanggal ? new Date(h.tanggal).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                  </span>
                  <span style={{ color: aman ? 'var(--accent-primary)' : '#ef4444', fontWeight: 'bold' }}>
                    {aman ? 'Ada Rekomendasi' : 'Perhatian Keselamatan'}
                  </span>
                </div>
                
                <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--text-primary)' }}>Keluhan: <span style={{ fontWeight: 'normal', color: 'var(--text-secondary)' }}>{h.keluhan}</span></h3>
                
                {rekomenList.length > 0 && (
                  <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                    {rekomenList.map((r, ri) => (
                      <div key={ri} style={{ 
                        marginTop: ri > 0 ? '0.75rem' : 0, 
                        paddingTop: ri > 0 ? '0.75rem' : 0, 
                        borderTop: ri > 0 ? '1px dashed var(--border-color)' : 'none',
                        color: 'var(--text-secondary)'
                      }}>
                        <span style={{ color: r.status === 'success' ? 'var(--accent-primary)' : '#ef4444', fontWeight: 'bold' }}>{r.nama}</span> — {r.alasan}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
