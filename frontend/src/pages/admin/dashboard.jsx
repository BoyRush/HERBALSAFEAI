import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../components/Sidebar';
import BerandaAdmin from './BerandaAdmin';
import VerifikasiAkun from './VerifikasiAkun';
import KelolaPengguna from './KelolaPengguna';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import axios from 'axios';
import ProfilSaya from '../../components/ProfilSaya';

export default function AdminDashboard() {
  const { role, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTabRaw] = useState('dashboard');
  useEffect(() => {
    const savedTab = sessionStorage.getItem('admin_activeTab');
    if (savedTab) setActiveTabRaw(savedTab);
  }, []);

  const setActiveTab = (tab) => {
    sessionStorage.setItem('admin_activeTab', tab);
    setActiveTabRaw(tab);
  };

  const [adminData, setAdminData] = useState({
    stats: { total_pengguna: 0, pending_verif: 0, pasien: 0, dokter_medis: 0, dokter_herbal: 0 },
    pending_registrations: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { router.replace('/login'); return; }
    if (role !== 'admin') { router.replace('/login'); }
  }, [authLoading, isAuthenticated, role, router]);

  const fetchAdminStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('herbalchain_token');
      const res = await axios.get('http://127.0.0.1:5000/admin/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === 'success') {
        setAdminData({
          stats: res.data.stats,
          pending_registrations: res.data.pending_registrations
        });
      }
    } catch (err) {
      console.error('Gagal tarik data admin:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && role === 'admin') fetchAdminStats();
  }, [authLoading, role, activeTab, fetchAdminStats]);

  const handleApprove = async (targetUserId, name) => {
    try {
      const token = localStorage.getItem('herbalchain_token');
      await axios.post('http://127.0.0.1:5000/admin/verify/approve',
        { user_id: targetUserId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`Berhasil! Pendaftaran ${name} telah disetujui.`);
      fetchAdminStats();
    } catch (error) {
      alert('Gagal Approve: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleReject = async (targetUserId, name, reason) => {
    try {
      const token = localStorage.getItem('herbalchain_token');
      await axios.post('http://127.0.0.1:5000/admin/verify/reject',
        { user_id: targetUserId, reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`Pendaftaran ${name} telah ditolak.`);
      fetchAdminStats();
    } catch (error) {
      alert('Gagal Reject: ' + (error.response?.data?.error || error.message));
    }
  };

  if (authLoading || isLoading) return <div className="loading">Memuat Dashboard...</div>;

  return (
    <div className="admin-layout">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        notifications={{ pendingVerifCount: adminData.stats.pending_verif }}
      />
      <main className="admin-main">
        {activeTab === 'dashboard' && (
          <BerandaAdmin
            stats={adminData.stats}
            pendingList={adminData.pending_registrations}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        )}
        {activeTab === 'verifikasi' && (
          <VerifikasiAkun
            pendingList={adminData.pending_registrations}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        )}
        {activeTab === 'pengguna' && <KelolaPengguna />}
        {activeTab === 'profil' && <ProfilSaya />}
      </main>

      <style jsx>{`
        .admin-layout { display: flex; background: #fcfcfc; min-height: 100vh; }
        .admin-main { margin-left: 260px; flex: 1; padding: 30px 40px; }
        .loading { display: flex; justify-content: center; align-items: center; height: 100vh; font-weight: 600; color: #2e7d32; }
      `}</style>
    </div>
  );
}
