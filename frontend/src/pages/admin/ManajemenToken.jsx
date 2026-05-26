import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { KeyRound, Plus, Trash2, Copy, RefreshCw } from 'lucide-react';

export default function ManajemenToken() {
    const [tokens, setTokens] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [form, setForm] = useState({ tier: 'premium', duration_days: 30 });

    const fetchTokens = async () => {
        try {
            const token = localStorage.getItem('herbalchain_token');
            const res = await axios.get('http://127.0.0.1:5000/admin/tokens', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTokens(res.data.tokens || []);
        } catch (err) {
            console.error("Gagal load tokens:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTokens();
    }, []);

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const token = localStorage.getItem('herbalchain_token');
            await axios.post('http://127.0.0.1:5000/admin/tokens/generate', form, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchTokens();
        } catch (err) {
            alert('Gagal generate token: ' + (err.response?.data?.error || err.message));
        } finally {
            setGenerating(false);
        }
    };

    const handleDelete = async (tokenId) => {
        if (!confirm('Yakin ingin menghapus token ini?')) return;
        try {
            const token = localStorage.getItem('herbalchain_token');
            await axios.delete(`http://127.0.0.1:5000/admin/tokens/${tokenId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchTokens();
        } catch (err) {
            alert('Gagal hapus token');
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('Token berhasil disalin!');
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'active': return <span className="badge badge-success">Aktif</span>;
            case 'used': return <span className="badge badge-info">Terpakai</span>;
            case 'expired': return <span className="badge badge-danger">Kedaluwarsa</span>;
            default: return <span className="badge">{status}</span>;
        }
    };

    return (
        <div className="token-container">
            <div className="token-header">
                <div>
                    <h1 className="token-title">Manajemen Token</h1>
                    <p className="token-subtitle">Generate dan kelola token akses premium untuk pengguna</p>
                </div>
            </div>

            {/* Generate Form */}
            <div className="generate-card">
                <h3 className="card-title">
                    <Plus size={18} style={{ marginRight: '8px' }} />
                    Generate Token Baru
                </h3>
                <div className="form-row">
                    <div className="form-group">
                        <label>Tier</label>
                        <select
                            value={form.tier}
                            onChange={(e) => setForm({ ...form, tier: e.target.value })}
                            className="form-select"
                        >
                            <option value="premium">Premium</option>
                            <option value="basic">Basic</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Durasi (hari)</label>
                        <input
                            type="number"
                            value={form.duration_days}
                            onChange={(e) => setForm({ ...form, duration_days: parseInt(e.target.value) })}
                            className="form-input"
                            min={1}
                        />
                    </div>
                    <button className="btn-generate" onClick={handleGenerate} disabled={generating}>
                        <RefreshCw size={16} />
                        {generating ? 'Membuat...' : 'Generate Token'}
                    </button>
                </div>
            </div>

            {/* Token Table */}
            <div className="token-card">
                {loading ? (
                    <div className="loading">Memuat data token...</div>
                ) : tokens.length === 0 ? (
                    <div className="empty-state">
                        <KeyRound size={48} color="#ddd" />
                        <p>Belum ada token yang dibuat.</p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="token-table">
                            <thead>
                                <tr>
                                    <th>Token</th>
                                    <th>Tier</th>
                                    <th>Durasi</th>
                                    <th>Status</th>
                                    <th>Dibuat</th>
                                    <th style={{ textAlign: 'right' }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tokens.map(t => (
                                    <tr key={t.id}>
                                        <td>
                                            <div className="token-cell">
                                                <span className="token-code">{t.token_code || t.code || '-'}</span>
                                            </div>
                                        </td>
                                        <td><span className={`badge ${t.tier === 'premium' ? 'badge-premium' : 'badge-gray'}`}>{t.tier}</span></td>
                                        <td>{t.duration_days || '-'} hari</td>
                                        <td>{getStatusBadge(t.status)}</td>
                                        <td className="date-cell">{t.created_at ? new Date(t.created_at).toLocaleDateString('id-ID') : '-'}</td>
                                        <td>
                                            <div className="actions-cell">
                                                <button className="btn-icon btn-copy" title="Salin Token" onClick={() => copyToClipboard(t.token_code || t.code || '')}>
                                                    <Copy size={16} />
                                                </button>
                                                <button className="btn-icon btn-delete" title="Hapus Token" onClick={() => handleDelete(t.id)}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <style jsx>{`
                .token-container { animation: fadeIn 0.4s ease; }
                .token-header { margin-bottom: 24px; }
                .token-title { font-size: 24px; font-weight: 700; color: #333; margin: 0; }
                .token-subtitle { font-size: 14px; color: #888; margin: 4px 0 0 0; }

                .generate-card {
                    background: white;
                    border-radius: 16px;
                    padding: 24px;
                    border: 1px solid #f0f0f0;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.02);
                    margin-bottom: 20px;
                }
                .card-title { font-size: 16px; font-weight: 700; color: #333; margin: 0 0 18px 0; display: flex; align-items: center; }

                .form-row { display: flex; gap: 14px; align-items: flex-end; flex-wrap: wrap; }
                .form-group { display: flex; flex-direction: column; gap: 6px; }
                .form-group label { font-size: 12px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
                .form-select, .form-input {
                    padding: 10px 14px;
                    border: 1px solid #e8e8e8;
                    border-radius: 10px;
                    font-size: 14px;
                    color: #333;
                    background: #fafafa;
                    outline: none;
                    min-width: 140px;
                }
                .form-select:focus, .form-input:focus { border-color: #2e7d32; background: white; }

                .btn-generate {
                    display: flex; align-items: center; gap: 8px;
                    padding: 10px 20px;
                    background: #2e7d32; color: white;
                    border: none; border-radius: 10px;
                    font-size: 14px; font-weight: 600; cursor: pointer;
                    transition: background 0.2s;
                    height: fit-content;
                }
                .btn-generate:hover { background: #1b5e20; }
                .btn-generate:disabled { opacity: 0.6; cursor: not-allowed; }

                .token-card {
                    background: white;
                    border-radius: 20px;
                    border: 1px solid #f0f0f0;
                    padding: 10px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.03);
                }

                .table-wrapper { overflow-x: auto; }
                .token-table { width: 100%; border-collapse: collapse; min-width: 600px; }
                .token-table th {
                    text-align: left; padding: 14px 18px;
                    font-size: 12px; font-weight: 600; color: #999;
                    text-transform: uppercase; letter-spacing: 0.5px;
                    border-bottom: 1px solid #f5f5f5;
                }
                .token-table td {
                    padding: 14px 18px;
                    border-bottom: 1px solid #f8f8f8;
                    vertical-align: middle; font-size: 14px; color: #555;
                }
                .token-table tr:last-child td { border-bottom: none; }

                .token-code {
                    font-family: 'Courier New', monospace;
                    font-size: 12px; color: #333; background: #f5f5f5;
                    padding: 3px 8px; border-radius: 6px;
                }
                .date-cell { font-size: 13px; color: #999; }

                .badge { padding: 4px 10px; border-radius: 8px; font-size: 11.5px; font-weight: 600; }
                .badge-success { background: #e8f5e9; color: #2e7d32; }
                .badge-info { background: #e3f2fd; color: #1976d2; }
                .badge-danger { background: #ffebee; color: #d32f2f; }
                .badge-premium { background: #fff8e1; color: #f59e0b; }
                .badge-gray { background: #f5f5f5; color: #666; }

                .actions-cell { display: flex; gap: 8px; justify-content: flex-end; }
                .btn-icon { background: none; border: none; cursor: pointer; padding: 6px; border-radius: 8px; transition: 0.2s; }
                .btn-copy { color: #555; }
                .btn-copy:hover { background: #f0f4f8; }
                .btn-delete { color: #d32f2f; }
                .btn-delete:hover { background: #ffebee; }

                .loading { text-align: center; padding: 40px; color: #888; }
                .empty-state { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 60px; color: #aaa; }

                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; } }
            `}</style>
        </div>
    );
}
