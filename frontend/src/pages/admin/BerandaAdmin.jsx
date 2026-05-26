import React from 'react';
import { Users, Clock, UserCheck, PlusCircle } from 'lucide-react';

export default function BerandaAdmin({ stats, pendingList, onApprove, onReject }) {
    const statCards = [
        { label: 'Total Pengguna', value: stats?.total_pengguna || 0, color: '#1976d2', bg: '#e3f2fd' },
        { label: 'Menunggu Verifikasi', value: stats?.pending_verif || 0, color: '#f59e0b', bg: '#fff8e1' },
        { label: 'Total Pasien', value: stats?.pasien || 0, color: '#2e7d32', bg: '#e8f5e9' },
        { label: 'Dokter Medis', value: stats?.dokter_medis || 0, color: '#7b1fa2', bg: '#f3e5f5' },
        { label: 'Dokter Herbal', value: stats?.dokter_herbal || 0, color: '#e64a19', bg: '#fbe9e7' },
    ];

    return (
        <div className="beranda-wrapper">
            <div className="beranda-header">
                <h1 className="beranda-title">Dashboard Admin</h1>
                <p className="beranda-subtitle">Ringkasan statistik dan aktivitas sistem</p>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                {statCards.map((card, i) => (
                    <div key={i} className="stat-card" style={{ borderTop: `3px solid ${card.color}` }}>
                        <div className="stat-icon" style={{ background: card.bg, color: card.color }}>
                            <Users size={20} />
                        </div>
                        <div className="stat-info">
                            <p className="stat-value" style={{ color: card.color }}>{card.value}</p>
                            <p className="stat-label">{card.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pending Verifications */}
            {pendingList && pendingList.length > 0 && (
                <div className="pending-section">
                    <h2 className="section-title">
                        <Clock size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                        Menunggu Verifikasi ({pendingList.length})
                    </h2>
                    <div className="pending-list">
                        {pendingList.slice(0, 5).map((user) => (
                            <div key={user.id} className="pending-card">
                                <div className="pending-avatar">
                                    {user.name?.substring(0, 2).toUpperCase() || '??'}
                                </div>
                                <div className="pending-info">
                                    <p className="pending-name">{user.name || 'Tanpa Nama'}</p>
                                    <p className="pending-role">{user.role} · {user.date_string || '-'}</p>
                                </div>
                                <div className="pending-actions">
                                    <button className="btn-approve" onClick={() => onApprove(user.id, user.name)}>
                                        <UserCheck size={14} /> Setujui
                                    </button>
                                    <button className="btn-reject" onClick={() => onReject(user.id, user.name, 'Tidak memenuhi syarat')}>
                                        Tolak
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {pendingList && pendingList.length === 0 && (
                <div className="empty-state">
                    <UserCheck size={48} color="#c8e6c9" />
                    <p>Tidak ada pendaftar baru yang menunggu verifikasi.</p>
                </div>
            )}

            <style jsx>{`
                .beranda-wrapper { animation: fadeIn 0.4s ease; }
                .beranda-header { margin-bottom: 28px; }
                .beranda-title { font-size: 26px; font-weight: 700; color: #1a1a1a; margin: 0; }
                .beranda-subtitle { font-size: 14px; color: #888; margin: 6px 0 0 0; }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
                    gap: 16px;
                    margin-bottom: 32px;
                }
                .stat-card {
                    background: white;
                    border-radius: 16px;
                    padding: 20px;
                    border: 1px solid #f0f0f0;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.03);
                    display: flex;
                    align-items: center;
                    gap: 14px;
                }
                .stat-icon {
                    width: 44px; height: 44px;
                    border-radius: 12px;
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0;
                }
                .stat-value { font-size: 28px; font-weight: 800; margin: 0; line-height: 1; }
                .stat-label { font-size: 12px; color: #888; margin: 4px 0 0 0; font-weight: 500; }

                .pending-section { background: white; border-radius: 20px; border: 1px solid #f0f0f0; padding: 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.02); }
                .section-title { font-size: 17px; font-weight: 700; color: #333; margin: 0 0 20px 0; display: flex; align-items: center; }

                .pending-list { display: flex; flex-direction: column; gap: 12px; }
                .pending-card {
                    display: flex; align-items: center; gap: 14px;
                    padding: 14px; background: #fafafa; border-radius: 12px; border: 1px solid #f0f0f0;
                }
                .pending-avatar {
                    width: 42px; height: 42px; border-radius: 50%;
                    background: linear-gradient(135deg, #e8f5e9, #c8e6c9);
                    display: flex; align-items: center; justify-content: center;
                    font-size: 13px; font-weight: 700; color: #2e7d32; flex-shrink: 0;
                }
                .pending-info { flex: 1; }
                .pending-name { font-size: 14.5px; font-weight: 700; color: #333; margin: 0; }
                .pending-role { font-size: 12px; color: #888; margin: 2px 0 0 0; }
                .pending-actions { display: flex; gap: 8px; }
                .btn-approve {
                    display: flex; align-items: center; gap: 5px;
                    padding: 7px 14px; background: #2e7d32; color: white;
                    border: none; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer;
                }
                .btn-approve:hover { background: #1b5e20; }
                .btn-reject {
                    padding: 7px 14px; background: white; color: #d32f2f;
                    border: 1px solid #ef9a9a; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer;
                }
                .btn-reject:hover { background: #ffebee; }

                .empty-state {
                    background: white; border-radius: 20px; border: 1px solid #f0f0f0;
                    padding: 60px; text-align: center; color: #888;
                    display: flex; flex-direction: column; align-items: center; gap: 16px;
                }

                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; } }
            `}</style>
        </div>
    );
}
