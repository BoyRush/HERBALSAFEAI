import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Trash2, FileText, CheckCircle, XCircle, Search, X } from 'lucide-react';

export default function KelolaPengguna() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDoc, setSelectedDoc] = useState(null);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('herbalchain_token');
            const res = await axios.get('http://127.0.0.1:5000/admin/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(res.data.users || []);
        } catch (err) {
            console.error("Gagal load users:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDelete = async (userId, username) => {
        if (!window.confirm(`Yakin ingin menghapus pengguna @${username}? Tindakan ini tidak dapat dibatalkan.`)) return;
        try {
            const token = localStorage.getItem('herbalchain_token');
            await axios.delete(`http://127.0.0.1:5000/admin/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Pengguna berhasil dihapus');
            fetchUsers();
        } catch (err) {
            alert('Gagal menghapus pengguna');
        }
    };

    const handleApprove = async (userId) => {
        try {
            const token = localStorage.getItem('herbalchain_token');
            await axios.post('http://127.0.0.1:5000/admin/verify/approve', { user_id: userId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchUsers();
        } catch (err) { alert('Gagal menyetujui'); }
    };

    const handleReject = async (userId) => {
        const reason = window.prompt("Alasan Penolakan:", "Dokumen tidak valid");
        if (reason === null) return;
        try {
            const token = localStorage.getItem('herbalchain_token');
            await axios.post('http://127.0.0.1:5000/admin/verify/reject', { user_id: userId, reason }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchUsers();
        } catch (err) { alert('Gagal menolak'); }
    };

    const filteredUsers = users.filter(u => 
        (u.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
        (u.username?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (u.role?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const getRoleBadge = (role) => {
        switch(role) {
            case 'doctor': return <span className="badge badge-blue">Dokter Medis</span>;
            case 'herbal_doctor': return <span className="badge badge-green">Dokter Herbal</span>;
            case 'patient': return <span className="badge badge-gray">Pasien</span>;
            default: return <span className="badge">{role}</span>;
        }
    };

    if (loading) return <div className="loading">Memuat Data Pengguna...</div>;

    return (
        <div className="kelola-container">
            <header className="kelola-header">
                <div>
                    <h1 className="kelola-title">Kelola Pengguna</h1>
                    <p className="kelola-subtitle">Daftar semua pengguna yang terdaftar di sistem</p>
                </div>
            </header>

            {/* MODAL PRATINJAU DOKUMEN */}
            {selectedDoc && (
                <div className="modal-overlay">
                    <div className="modal-content large">
                        <div className="modal-header">
                            <h3>Pratinjau Dokumen: {selectedDoc.name}</h3>
                            <button onClick={() => setSelectedDoc(null)} className="close-btn"><X size={20} /></button>
                        </div>
                        <div className="modal-body doc-preview">
                            <iframe 
                                src={`http://127.0.0.1:5000/admin/view-document/${selectedDoc.id}?token=${localStorage.getItem('herbalchain_token')}`} 
                                width="100%" 
                                height="500px" 
                                style={{ border: 'none', borderRadius: '8px' }}
                                title="Document Preview"
                            ></iframe>
                        </div>
                    </div>
                </div>
            )}

            <div className="search-bar">
                <Search size={18} color="#999" />
                <input 
                    type="text" 
                    placeholder="Cari nama, username, atau role..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="users-card">
                <div className="table-wrapper">
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>Info Pengguna</th>
                                <th>Role</th>
                                <th style={{ textAlign: 'right' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(u => (
                                <tr key={u.id}>
                                    <td>
                                        <div className="user-info-cell">
                                            <div className="avatar-mini">
                                                {u.name?.substring(0, 2).toUpperCase() || '??'}
                                            </div>
                                            <div>
                                                <p className="u-name">{u.name}</p>
                                                <p className="u-user">@{u.username}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{getRoleBadge(u.role)}</td>
                                    <td>
                                        <div className="actions-cell">
                                            {(u.role === 'doctor' || u.role === 'herbal_doctor') && (
                                                <button 
                                                    className="btn-action btn-doc" 
                                                    title="Lihat Dokumen"
                                                    onClick={() => setSelectedDoc({ id: u.id, name: u.name })}
                                                >
                                                    <FileText size={16} />
                                                    <span>Dokumen</span>
                                                </button>
                                            )}
                                            
                                            {u.verification_status === 'pending' && (
                                                <>
                                                    <button className="btn-icon btn-check" onClick={() => handleApprove(u.id)} title="Setujui">
                                                        <CheckCircle size={18} />
                                                    </button>
                                                    <button className="btn-icon btn-x" onClick={() => handleReject(u.id)} title="Tolak">
                                                        <XCircle size={18} />
                                                    </button>
                                                </>
                                            )}

                                            <button className="btn-action btn-delete" onClick={() => handleDelete(u.id, u.username)} title="Hapus Pengguna">
                                                <Trash2 size={16} />
                                                <span>Hapus</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <style jsx>{`
                .kelola-container { animation: fadeIn 0.4s ease; }
                .kelola-header { margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
                .kelola-title { font-size: 24px; font-weight: 700; color: #333; margin: 0; }
                .kelola-subtitle { font-size: 14px; color: #888; margin: 4px 0 0 0; }

                .search-bar {
                    background: white;
                    border: 1px solid #f0f0f0;
                    border-radius: 12px;
                    padding: 10px 16px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 20px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.02);
                }
                .search-bar input {
                    border: none;
                    outline: none;
                    width: 100%;
                    font-size: 14px;
                    color: #444;
                }

                .users-card {
                    background: white;
                    border-radius: 20px;
                    border: 1px solid #f0f0f0;
                    padding: 10px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.03);
                }

                .table-wrapper { overflow-x: auto; }
                .users-table { width: 100%; border-collapse: collapse; min-width: 600px; }
                .users-table th {
                    text-align: left;
                    padding: 16px 20px;
                    font-size: 13px;
                    font-weight: 600;
                    color: #999;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    border-bottom: 1px solid #f8f8f8;
                }
                .users-table td {
                    padding: 16px 20px;
                    border-bottom: 1px solid #f8f8f8;
                    vertical-align: middle;
                }
                .users-table tr:last-child td { border-bottom: none; }

                .user-info-cell { display: flex; align-items: center; gap: 14px; }
                .avatar-mini {
                    width: 38px; height: 38px; border-radius: 10px;
                    background: #f0f4f8; display: flex; align-items: center; justify-content: center;
                    font-size: 12px; font-weight: 700; color: #666;
                }
                .u-name { font-size: 14.5px; font-weight: 600; color: #333; margin: 0; }
                .u-user { font-size: 12px; color: #aaa; margin: 0; }

                .badge {
                    padding: 4px 10px; border-radius: 8px; font-size: 11.5px; font-weight: 600;
                }
                .badge-blue { background: #e3f2fd; color: #1976d2; }
                .badge-green { background: #e8f5e9; color: #2e7d32; }
                .badge-gray { background: #f5f5f5; color: #666; }
                .badge-success { background: #e8f5e9; color: #2e7d32; }
                .badge-warning { background: #fff8e1; color: #f59e0b; }
                .badge-danger { background: #ffebee; color: #d32f2f; }

                .actions-cell { display: flex; gap: 8px; justify-content: flex-end; }
                .btn-action {
                    display: flex; align-items: center; gap: 6px; padding: 6px 12px;
                    border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1px solid #eee;
                    background: white; transition: 0.2s;
                }
                .btn-doc { color: #555; }
                .btn-doc:hover { background: #f0f4f8; border-color: #d1d5db; }
                .btn-delete { color: #d32f2f; }
                .btn-delete:hover { background: #ffebee; border-color: #ef5350; }
                
                .btn-icon {
                    background: none; border: none; cursor: pointer; padding: 4px;
                    border-radius: 6px; transition: 0.2s;
                }
                .btn-check { color: #2e7d32; }
                .btn-check:hover { background: #e8f5e9; }
                .btn-x { color: #d32f2f; }
                .btn-x:hover { background: #ffebee; }

                .loading { text-align: center; padding: 50px; color: #888; }

                /* Modal Styles */
                .modal-overlay {
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;
                    z-index: 1000;
                }
                .modal-content.large {
                    background: white; border-radius: 20px; padding: 24px; width: 90%; max-width: 800px;
                    animation: modalIn 0.3s ease;
                }
                .modal-header {
                    display: flex; justify-content: space-between; align-items: center;
                    margin-bottom: 20px; padding-bottom: 12px; border-bottom: 1px solid #f3f4f6;
                }
                .close-btn { background: none; border: none; cursor: pointer; color: #999; }

                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; } }
                @keyframes modalIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; } }
            `}</style>
        </div>
    );
}
