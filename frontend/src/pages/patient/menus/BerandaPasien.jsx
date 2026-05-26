import React from 'react';
import { FileText, Leaf, ArrowRight, AlertTriangle } from 'lucide-react';

export default function BerandaPasien({ medicalRecords, rekomendasiCount, changeTab }) {
    const stats = [
        { label: 'Rekam Medis', value: medicalRecords?.length || 0, color: '#1976d2', bg: '#e3f2fd', icon: <FileText size={20} />, tab: 'riwayat_medis' },
        { label: 'Rekomendasi AI', value: rekomendasiCount || 0, color: '#2e7d32', bg: '#e8f5e9', icon: <Leaf size={20} />, tab: 'riwayat_rekomendasi' },
    ];

    return (
        <div className="beranda-wrapper">
            <div className="beranda-header">
                <h1 className="beranda-title">Beranda</h1>
                <p className="beranda-subtitle">Selamat datang! Pantau kondisi kesehatan dan rekomendasi herbal Anda.</p>
            </div>

            {/* Stats */}
            <div className="stats-grid">
                {stats.map((s, i) => (
                    <div key={i} className="stat-card" onClick={() => changeTab(s.tab)} style={{ borderTop: `3px solid ${s.color}`, cursor: 'pointer' }}>
                        <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                        <div className="stat-info">
                            <p className="stat-value" style={{ color: s.color }}>{s.value}</p>
                            <p className="stat-label">{s.label}</p>
                        </div>
                        <ArrowRight size={16} color="#ccc" style={{ marginLeft: 'auto' }} />
                    </div>
                ))}
            </div>

            {/* Recent Records */}
            <div className="two-col">
                <div className="section-card">
                    <div className="section-header">
                        <h3 className="section-title-sm">Rekam Medis Terbaru</h3>
                        <button className="link-btn" onClick={() => changeTab('riwayat_medis')}>Lihat Semua <ArrowRight size={13} /></button>
                    </div>
                    {medicalRecords && medicalRecords.length > 0 ? (
                        <div className="record-list">
                            {medicalRecords.slice(0, 3).map((rec, i) => (
                                <div key={i} className="record-item">
                                    <div className="rec-dot" />
                                    <div>
                                        <p className="rec-diagnosis">{rec.diagnosis}</p>
                                        <p className="rec-doctor">{rec.doctor ? `dr. ${rec.doctor}` : 'Data Mandiri'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : <div className="empty-mini">Belum ada rekam medis.</div>}
                </div>

                <div className="section-card">
                    <div className="section-header">
                        <h3 className="section-title-sm">Aksi Cepat</h3>
                    </div>
                    <div className="quick-actions">
                        <button className="quick-btn" onClick={() => changeTab('rekomendasi')}>
                            <div className="q-icon" style={{ background: '#e8f5e9', color: '#2e7d32' }}><Leaf size={18} /></div>
                            <span>Minta Rekomendasi Herbal</span>
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .beranda-wrapper { animation: fadeIn 0.4s ease; }
                .beranda-header { margin-bottom: 28px; }
                .beranda-title { font-size: 26px; font-weight: 700; color: #1a1a1a; margin: 0; }
                .beranda-subtitle { font-size: 14px; color: #888; margin: 6px 0 0 0; }

                .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px; margin-bottom: 24px; }
                .stat-card {
                    background: white; border-radius: 16px; padding: 18px;
                    border: 1px solid #f0f0f0; box-shadow: 0 2px 8px rgba(0,0,0,0.02);
                    display: flex; align-items: center; gap: 12px; transition: box-shadow 0.2s;
                }
                .stat-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
                .stat-icon { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
                .stat-value { font-size: 26px; font-weight: 800; margin: 0; line-height: 1; }
                .stat-label { font-size: 12px; color: #888; margin: 3px 0 0 0; }

                .pending-section { background: white; border-radius: 20px; border: 1px solid #fde68a; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
                .section-title { font-size: 16px; font-weight: 700; color: #333; margin: 0 0 16px 0; }
                .pending-list { display: flex; flex-direction: column; gap: 10px; }
                .pending-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: #fffbeb; border-radius: 10px; border: 1px solid #fde68a; }
                .doc-avatar { width: 38px; height: 38px; border-radius: 50%; background: #fff8e1; color: #f59e0b; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; flex-shrink: 0; }
                .doc-info { flex: 1; }
                .doc-name { font-size: 14px; font-weight: 700; color: #333; margin: 0; }
                .doc-sub { font-size: 12px; color: #888; margin: 2px 0 0 0; }
                .doc-actions { display: flex; gap: 8px; }
                .btn-grant { padding: 7px 14px; background: #2e7d32; color: white; border: none; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; }
                .btn-grant:hover { background: #1b5e20; }
                .btn-deny { padding: 7px 14px; background: white; color: #d32f2f; border: 1px solid #ef9a9a; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; }
                .btn-deny:hover { background: #ffebee; }

                .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
                .section-card { background: white; border-radius: 20px; border: 1px solid #f0f0f0; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
                .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
                .section-title-sm { font-size: 15px; font-weight: 700; color: #333; margin: 0; }
                .link-btn { display: flex; align-items: center; gap: 4px; background: none; border: none; color: #2e7d32; font-size: 12px; font-weight: 600; cursor: pointer; }

                .record-list { display: flex; flex-direction: column; gap: 10px; }
                .record-item { display: flex; align-items: flex-start; gap: 10px; padding: 10px; background: #fafafa; border-radius: 10px; }
                .rec-dot { width: 8px; height: 8px; border-radius: 50%; background: #2e7d32; flex-shrink: 0; margin-top: 5px; }
                .rec-diagnosis { font-size: 13.5px; font-weight: 600; color: #333; margin: 0; }
                .rec-doctor { font-size: 11.5px; color: #aaa; margin: 2px 0 0 0; }

                .empty-mini { text-align: center; color: #aaa; padding: 20px 0; font-size: 13px; }

                .quick-actions { display: flex; flex-direction: column; gap: 10px; }
                .quick-btn { display: flex; align-items: center; gap: 12px; padding: 12px; background: #fafafa; border-radius: 12px; border: 1px solid #f0f0f0; cursor: pointer; text-align: left; font-size: 13.5px; font-weight: 600; color: #333; transition: background 0.2s; }
                .quick-btn:hover { background: #f0f4f8; }
                .q-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; } }
            `}</style>
        </div>
    );
}
