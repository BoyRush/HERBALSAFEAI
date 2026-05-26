import React from 'react';
import { UserCheck, UserX, ShieldOff, Clock } from 'lucide-react';

export default function AksesDokter({ pendingDocs, approvedDocs, onGrant, onReject, onRevoke, isProcessing }) {
    return (
        <div className="akses-wrapper">
            <div className="akses-header">
                <h1 className="akses-title">Akses Dokter</h1>
                <p className="akses-subtitle">Kelola dokter yang memiliki akses ke data medis Anda</p>
            </div>

            {/* Pending Requests */}
            <div className="akses-section">
                <div className="section-label pending-label">
                    <Clock size={16} />
                    Menunggu Persetujuan Anda ({pendingDocs?.length || 0})
                </div>
                {pendingDocs && pendingDocs.length > 0 ? (
                    <div className="doc-list">
                        {pendingDocs.map((doc, i) => (
                            <div key={i} className="doc-card">
                                <div className="doc-avatar" style={{ background: '#fff8e1', color: '#f59e0b' }}>
                                    {(doc.name || 'D').substring(0, 1).toUpperCase()}
                                </div>
                                <div className="doc-info">
                                    <p className="doc-name">{doc.name}</p>
                                    <p className="doc-sub">Meminta akses ke data medis Anda</p>
                                </div>
                                <div className="doc-actions">
                                    <button className="btn-grant" onClick={() => onGrant(doc.id)} disabled={isProcessing}>
                                        <UserCheck size={14} /> Izinkan
                                    </button>
                                    <button className="btn-deny" onClick={() => onReject(doc.id, doc.name)} disabled={isProcessing}>
                                        <UserX size={14} /> Tolak
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-mini">Tidak ada permintaan akses yang menunggu.</div>
                )}
            </div>

            {/* Approved Doctors */}
            <div className="akses-section">
                <div className="section-label approved-label">
                    <UserCheck size={16} />
                    Dokter Dengan Akses Aktif ({approvedDocs?.length || 0})
                </div>
                {approvedDocs && approvedDocs.length > 0 ? (
                    <div className="doc-list">
                        {approvedDocs.map((doc, i) => (
                            <div key={i} className="doc-card">
                                <div className="doc-avatar" style={{ background: '#e8f5e9', color: '#2e7d32' }}>
                                    {(doc.name || 'D').substring(0, 1).toUpperCase()}
                                </div>
                                <div className="doc-info">
                                    <p className="doc-name">{doc.name}</p>
                                    <p className="doc-sub">Memiliki akses ke rekam medis Anda</p>
                                </div>
                                <button className="btn-revoke" onClick={() => onRevoke(doc.id, doc.name)} disabled={isProcessing}>
                                    <ShieldOff size={14} /> Cabut Akses
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-mini">Belum ada dokter yang memiliki akses aktif.</div>
                )}
            </div>

            <style jsx>{`
                .akses-wrapper { animation: fadeIn 0.4s ease; }
                .akses-header { margin-bottom: 24px; }
                .akses-title { font-size: 24px; font-weight: 700; color: #333; margin: 0; }
                .akses-subtitle { font-size: 14px; color: #888; margin: 4px 0 0 0; }

                .akses-section { background: white; border-radius: 20px; border: 1px solid #f0f0f0; padding: 20px; margin-bottom: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }

                .section-label {
                    display: flex; align-items: center; gap: 8px;
                    font-size: 14px; font-weight: 700; padding: 8px 14px; border-radius: 10px;
                    margin-bottom: 16px;
                }
                .pending-label { background: #fff8e1; color: #f59e0b; }
                .approved-label { background: #e8f5e9; color: #2e7d32; }

                .doc-list { display: flex; flex-direction: column; gap: 10px; }
                .doc-card {
                    display: flex; align-items: center; gap: 14px;
                    padding: 14px; background: #fafafa; border-radius: 12px; border: 1px solid #f0f0f0;
                }
                .doc-avatar {
                    width: 44px; height: 44px; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 16px; font-weight: 700; flex-shrink: 0;
                }
                .doc-info { flex: 1; }
                .doc-name { font-size: 14.5px; font-weight: 700; color: #333; margin: 0; }
                .doc-sub { font-size: 12px; color: #888; margin: 2px 0 0 0; }
                .doc-actions { display: flex; gap: 8px; }

                .btn-grant {
                    display: flex; align-items: center; gap: 5px;
                    padding: 7px 14px; background: #2e7d32; color: white;
                    border: none; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer;
                }
                .btn-grant:hover { background: #1b5e20; }
                .btn-grant:disabled { opacity: 0.5; cursor: not-allowed; }
                .btn-deny {
                    display: flex; align-items: center; gap: 5px;
                    padding: 7px 14px; background: white; color: #d32f2f;
                    border: 1px solid #ef9a9a; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer;
                }
                .btn-deny:hover { background: #ffebee; }
                .btn-deny:disabled { opacity: 0.5; cursor: not-allowed; }
                .btn-revoke {
                    display: flex; align-items: center; gap: 5px;
                    padding: 7px 14px; background: white; color: #666;
                    border: 1px solid #e0e0e0; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer;
                    white-space: nowrap;
                }
                .btn-revoke:hover { background: #f5f5f5; color: #d32f2f; border-color: #ef9a9a; }
                .btn-revoke:disabled { opacity: 0.5; cursor: not-allowed; }

                .empty-mini { text-align: center; color: #aaa; padding: 20px 0; font-size: 14px; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; } }
            `}</style>
        </div>
    );
}
