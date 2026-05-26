import React from 'react';
import { Leaf, PlusCircle, BookOpen } from 'lucide-react';

export default function BerandaHerbal({ herbalList, onAddClick }) {
    return (
        <div className="beranda-wrapper">
            <div className="beranda-header">
                <div>
                    <h1 className="beranda-title">Beranda Herbal</h1>
                    <p className="beranda-subtitle">Kelola katalog tanaman herbal dalam knowledge base AI</p>
                </div>
                <button className="btn-add" onClick={onAddClick}>
                    <PlusCircle size={18} />
                    Tambah Herbal Baru
                </button>
            </div>

            {/* Summary Stats */}
            <div className="stats-row">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#e8f5e9', color: '#2e7d32' }}><Leaf size={22} /></div>
                    <div>
                        <p className="stat-value">{herbalList?.length || 0}</p>
                        <p className="stat-label">Total Herbal Terdaftar</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#e3f2fd', color: '#1976d2' }}><BookOpen size={22} /></div>
                    <div>
                        <p className="stat-value">{herbalList?.length || 0}</p>
                        <p className="stat-label">Tersedia di Knowledge Base AI</p>
                    </div>
                </div>
            </div>

            {/* Recent Herbals */}
            <div className="recent-section">
                <h3 className="section-title">Herbal Terbaru</h3>
                {herbalList && herbalList.length === 0 ? (
                    <div className="empty-state">
                        <Leaf size={48} color="#c8e6c9" />
                        <p>Belum ada data herbal. Mulai tambahkan herbal baru!</p>
                        <button className="btn-add-mini" onClick={onAddClick}>Tambah Herbal</button>
                    </div>
                ) : (
                    <div className="herbal-grid">
                        {herbalList.slice(0, 6).map((h, i) => (
                            <div key={h.id || i} className="herbal-card">
                                <div className="h-icon"><Leaf size={20} /></div>
                                <div className="h-info">
                                    <p className="h-name">{h.nama || h.name || 'Herbal'}</p>
                                    <p className="h-indikasi">{(h.indikasi || '').substring(0, 60)}{h.indikasi?.length > 60 ? '...' : ''}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style jsx>{`
                .beranda-wrapper { animation: fadeIn 0.4s ease; }
                .beranda-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; flex-wrap: wrap; gap: 12px; }
                .beranda-title { font-size: 26px; font-weight: 700; color: #1a1a1a; margin: 0; }
                .beranda-subtitle { font-size: 14px; color: #888; margin: 6px 0 0 0; }
                .btn-add {
                    display: flex; align-items: center; gap: 8px;
                    padding: 11px 20px; background: #2e7d32; color: white;
                    border: none; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer;
                    transition: background 0.2s; white-space: nowrap;
                }
                .btn-add:hover { background: #1b5e20; }

                .stats-row { display: flex; gap: 16px; margin-bottom: 28px; flex-wrap: wrap; }
                .stat-card {
                    flex: 1; min-width: 200px; background: white; border-radius: 16px; border: 1px solid #f0f0f0;
                    padding: 20px; display: flex; align-items: center; gap: 14px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.02);
                }
                .stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
                .stat-value { font-size: 30px; font-weight: 800; color: #1a1a1a; margin: 0; line-height: 1; }
                .stat-label { font-size: 13px; color: #888; margin: 4px 0 0 0; }

                .recent-section { background: white; border-radius: 20px; border: 1px solid #f0f0f0; padding: 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.02); }
                .section-title { font-size: 16px; font-weight: 700; color: #333; margin: 0 0 18px 0; }

                .herbal-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; }
                .herbal-card {
                    display: flex; align-items: flex-start; gap: 12px;
                    padding: 16px; background: #f8faf9; border-radius: 12px; border: 1px solid #e8f5e9;
                }
                .h-icon { width: 36px; height: 36px; border-radius: 10px; background: #e8f5e9; color: #2e7d32; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
                .h-name { font-size: 14px; font-weight: 700; color: #2e7d32; margin: 0; }
                .h-indikasi { font-size: 12px; color: #888; margin: 4px 0 0 0; line-height: 1.4; }

                .empty-state { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 50px; color: #aaa; }
                .btn-add-mini {
                    padding: 9px 20px; background: #2e7d32; color: white;
                    border: none; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer;
                }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; } }
            `}</style>
        </div>
    );
}
