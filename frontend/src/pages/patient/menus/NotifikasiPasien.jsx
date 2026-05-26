import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, CheckCheck } from 'lucide-react';

export default function NotifikasiPasien() {
    const [notifs, setNotifs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const token = localStorage.getItem('herbalchain_token');
                const res = await axios.get('http://127.0.0.1:5000/notifications', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setNotifs(res.data.notifications || []);
            } catch (err) {
                console.error('Gagal load notifikasi:', err);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    const unreadCount = notifs.filter(n => !n.is_read).length;

    return (
        <div className="notif-wrapper">
            <div className="notif-header">
                <div>
                    <h1 className="notif-title">Notifikasi</h1>
                    <p className="notif-subtitle">Pemberitahuan tentang aktivitas akun Anda</p>
                </div>
                {unreadCount > 0 && (
                    <span className="unread-badge">{unreadCount} belum dibaca</span>
                )}
            </div>

            <div className="notif-card">
                {loading ? (
                    <div className="loading">Memuat notifikasi...</div>
                ) : notifs.length === 0 ? (
                    <div className="empty-state">
                        <CheckCheck size={48} color="#c8e6c9" />
                        <p>Tidak ada notifikasi.</p>
                    </div>
                ) : (
                    <div className="notif-list">
                        {notifs.map((n, i) => (
                            <div key={i} className={`notif-item ${!n.is_read ? 'unread' : ''}`}>
                                <div className="notif-icon-wrap" style={{ background: n.is_read ? '#f5f5f5' : '#e8f5e9' }}>
                                    <Bell size={16} color={n.is_read ? '#aaa' : '#2e7d32'} />
                                </div>
                                <div className="notif-content">
                                    <p className="notif-msg">{n.pesan || 'Ada aktivitas baru'}</p>
                                    <p className="notif-time">
                                        {n.tanggal ? new Date(n.tanggal).toLocaleString('id-ID', {
                                            day: 'numeric', month: 'short', year: 'numeric',
                                            hour: '2-digit', minute: '2-digit'
                                        }) : '-'}
                                    </p>
                                </div>
                                {!n.is_read && <div className="unread-dot" />}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style jsx>{`
                .notif-wrapper { animation: fadeIn 0.4s ease; }
                .notif-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
                .notif-title { font-size: 24px; font-weight: 700; color: #333; margin: 0; }
                .notif-subtitle { font-size: 14px; color: #888; margin: 4px 0 0 0; }
                .unread-badge { background: #2e7d32; color: white; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; white-space: nowrap; }

                .notif-card { background: white; border-radius: 20px; border: 1px solid #f0f0f0; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.02); }
                .notif-list { display: flex; flex-direction: column; }
                .notif-item {
                    display: flex; align-items: flex-start; gap: 14px; padding: 18px 22px;
                    border-bottom: 1px solid #f8f8f8; transition: background 0.2s;
                }
                .notif-item:last-child { border-bottom: none; }
                .notif-item.unread { background: #f0fdf4; }
                .notif-icon-wrap { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
                .notif-content { flex: 1; }
                .notif-msg { font-size: 14px; color: #333; margin: 0; line-height: 1.5; }
                .notif-time { font-size: 12px; color: #aaa; margin: 5px 0 0 0; }
                .unread-dot { width: 9px; height: 9px; border-radius: 50%; background: #2e7d32; flex-shrink: 0; margin-top: 6px; }

                .empty-state { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 70px; color: #aaa; }
                .loading { text-align: center; padding: 40px; color: #888; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; } }
            `}</style>
        </div>
    );
}
