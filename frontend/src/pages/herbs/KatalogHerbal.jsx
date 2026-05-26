import React, { useState } from 'react';
import { Leaf, Pencil, Trash2, Search, ChevronDown, ChevronUp } from 'lucide-react';

export default function KatalogHerbal({ herbalList, onEdit, onDelete }) {
    const [search, setSearch] = useState('');
    const [expanded, setExpanded] = useState(null);

    const filtered = (herbalList || []).filter(h =>
        (h.nama || h.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (h.indikasi || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="katalog-wrapper">
            <div className="katalog-header">
                <div>
                    <h1 className="katalog-title">Katalog Herbal</h1>
                    <p className="katalog-subtitle">{herbalList?.length || 0} herbal terdaftar dalam sistem</p>
                </div>
            </div>

            {/* Search */}
            <div className="search-bar">
                <Search size={18} color="#999" />
                <input
                    type="text"
                    placeholder="Cari nama herbal atau indikasi..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="search-input"
                />
            </div>

            {filtered.length === 0 ? (
                <div className="empty-state">
                    <Leaf size={48} color="#c8e6c9" />
                    <p>{search ? 'Herbal tidak ditemukan.' : 'Belum ada data herbal.'}</p>
                </div>
            ) : (
                <div className="katalog-list">
                    {filtered.map((h, i) => (
                        <div key={h.id || i} className="herb-card">
                            <div className="herb-top">
                                <div className="herb-info">
                                    <div className="h-icon"><Leaf size={18} /></div>
                                    <div>
                                        <p className="h-name">{h.nama || h.name || 'Herbal'}</p>
                                        <p className="h-preview">{(h.indikasi || '').substring(0, 80)}{(h.indikasi || '').length > 80 ? '...' : ''}</p>
                                    </div>
                                </div>
                                <div className="herb-actions">
                                    <button className="btn-icon btn-edit" onClick={() => onEdit(h)} title="Edit">
                                        <Pencil size={15} />
                                    </button>
                                    <button className="btn-icon btn-delete" onClick={() => onDelete(h.id)} title="Hapus">
                                        <Trash2 size={15} />
                                    </button>
                                    <button className="btn-icon btn-expand" onClick={() => setExpanded(expanded === h.id ? null : h.id)}>
                                        {expanded === h.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                                    </button>
                                </div>
                            </div>

                            {expanded === h.id && (
                                <div className="herb-detail">
                                    <div className="detail-row">
                                        <span className="detail-label">Indikasi</span>
                                        <span className="detail-value">{h.indikasi || '-'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Kontraindikasi</span>
                                        <span className="detail-value contraindication">{h.kontraindikasi || '-'}</span>
                                    </div>

                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <style jsx>{`
                .katalog-wrapper { animation: fadeIn 0.4s ease; }
                .katalog-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
                .katalog-title { font-size: 24px; font-weight: 700; color: #333; margin: 0; }
                .katalog-subtitle { font-size: 14px; color: #888; margin: 4px 0 0 0; }

                .search-bar {
                    background: white; border: 1px solid #f0f0f0; border-radius: 12px;
                    padding: 10px 16px; display: flex; align-items: center; gap: 12px;
                    margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.02);
                }
                .search-input { border: none; outline: none; width: 100%; font-size: 14px; color: #444; background: transparent; }

                .katalog-list { display: flex; flex-direction: column; gap: 10px; }
                .herb-card { background: white; border-radius: 16px; border: 1px solid #f0f0f0; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }

                .herb-top { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; }
                .herb-info { display: flex; align-items: center; gap: 14px; flex: 1; min-width: 0; }
                .h-icon { width: 38px; height: 38px; border-radius: 10px; background: #e8f5e9; color: #2e7d32; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
                .h-name { font-size: 15px; font-weight: 700; color: #2e7d32; margin: 0; }
                .h-preview { font-size: 12.5px; color: #888; margin: 3px 0 0 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 400px; }

                .herb-actions { display: flex; gap: 6px; flex-shrink: 0; }
                .btn-icon { background: none; border: none; cursor: pointer; padding: 6px; border-radius: 8px; transition: 0.2s; }
                .btn-edit { color: #1976d2; }
                .btn-edit:hover { background: #e3f2fd; }
                .btn-delete { color: #d32f2f; }
                .btn-delete:hover { background: #ffebee; }
                .btn-expand { color: #888; }
                .btn-expand:hover { background: #f5f5f5; }

                .herb-detail { padding: 16px 20px 20px; border-top: 1px solid #f5f5f5; background: #fafafa; display: flex; flex-direction: column; gap: 12px; }
                .detail-row { display: flex; gap: 16px; }
                .detail-label { font-size: 12px; font-weight: 600; color: #aaa; text-transform: uppercase; letter-spacing: 0.5px; min-width: 110px; flex-shrink: 0; padding-top: 1px; }
                .detail-value { font-size: 14px; color: #333; line-height: 1.5; }
                .contraindication { color: #c62828; }

                .empty-state { background: white; border-radius: 20px; border: 1px solid #f0f0f0; padding: 60px; display: flex; flex-direction: column; align-items: center; gap: 14px; color: #aaa; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; } }
            `}</style>
        </div>
    );
}
