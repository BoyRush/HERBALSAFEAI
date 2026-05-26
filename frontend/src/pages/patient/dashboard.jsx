import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Beranda from './menus/BerandaPasien';
import MintaRekomendasi from './menus/MintaRekomendasi';
import RiwayatMedis from './menus/RiwayatMedis';
import RiwayatRekomendasi from './menus/RiwayatRekomendasi';
import NotifikasiPasien from './menus/NotifikasiPasien';
import ProfilSaya from '../../components/ProfilSaya';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import axios from 'axios';

export default function PatientDashboard() {
  const { id, username, role, status, loading, isAuthenticated, fullName } = useAuth();
  const router = useRouter();
  const [activeTabRaw, setActiveTabRaw] = useState('beranda');
  useEffect(() => {
    const savedTab = sessionStorage.getItem('patient_activeTab');
    if (savedTab) setActiveTabRaw(savedTab);
  }, []);
  const activeTab = activeTabRaw;
  const setActiveTab = (tab) => {
    sessionStorage.setItem('patient_activeTab', tab);
    setActiveTabRaw(tab);
  };
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [rekomendasiCount, setRekomendasiCount] = useState(0);
  const [keluhan, setKeluhan] = useState('');
  const [rekomendasi, setRekomendasi] = useState(null);
  const [isRecommending, setIsRecommending] = useState(false);
  const [useRag, setUseRag] = useState(true); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [notifs, setNotifs] = useState([]); 

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (role !== 'patient') {
      router.replace('/login');
      return;
    }
  }, [loading, isAuthenticated, role, status, router]);

  const loadRekomendasiCount = async () => {
    try {
        const token = localStorage.getItem('herbalchain_token');
        const res = await axios.get(`http://127.0.0.1:5000/patient/dashboard/stats`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setRekomendasiCount(res.data.recommendations || 0);
    } catch (err) {
        console.error("Gagal ambil history count:", err);
    }
  };

  const loadRequests = async () => {
    if (!id || role !== 'patient') return;
    
    try {
      const token = localStorage.getItem('herbalchain_token');
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Get Medical Records
      try {
        const recRes = await axios.get(`http://127.0.0.1:5000/records/medical/patient/${id}`, { headers });
        if (recRes.data.status === 'success') {
            setMedicalRecords(recRes.data.records.map(r => ({
                id: r.id,
                doctor: r.doctor_name,
                timestamp: new Date(r.created_at).getTime(),
                diagnosis: r.diagnosis,
                symptoms: r.symptoms,
                treatment: r.treatment,
                notes: r.notes,
                isActive: true
            })));
        }
      } catch (err) { console.error("Gagal ambil rekam medis", err); }

    } catch (error) {
      console.error("Gagal load data:", error);
    }
  };


    const handleOpenNotifications = async () => {
    setActiveTab('notifikasi');
    loadNotifications();
  };

  const handleGetAIRecommendation = async () => {
    if (!keluhan) return alert("Silakan isi keluhan Anda.");
    setRekomendasi(null);
    setIsRecommending(true);

    try {
        const token = localStorage.getItem('herbalchain_token');
        const response = await axios.post(
            `http://127.0.0.1:5000/herbal/recommendation-input`,
            { keluhan: keluhan, useRag: useRag },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setRekomendasi(response.data);
        loadRekomendasiCount();
        
    } catch (error) {
        console.error("Gagal ambil rekomendasi:", error);
        const errMsg = error.response?.data?.error || error.response?.data?.message || "Gagal terhubung ke Server.";
        alert(errMsg);
    } finally {
        setIsRecommending(false);
    }
};


    const handleTabChange = async (newTab) => {
      setActiveTab(newTab);
      sessionStorage.setItem('patient_activeTab', newTab);

      if (newTab === 'notifikasi') {
          loadNotifications(); 
      }
  };

  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem('herbalchain_token');
      const res = await axios.get(`http://127.0.0.1:5000/notifications`, {
          headers: { Authorization: `Bearer ${token}` }
      });
      setNotifs(res.data.notifications || []);
    } catch (err) {
      console.error("Gagal load notifikasi:", err);
    }
  };

  useEffect(() => { 
    if (!loading && username && role === 'patient') {
      loadRequests();
      loadRekomendasiCount();
      loadNotifications();
    }
  }, [username, loading, role]);

  if (loading) return <p style={{textAlign: 'center', padding: '50px'}}>Memuat Data...</p>;

  return (
    <div className="layout-container">
      <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} notifications={{ notifCount: notifs.filter(n => !n.is_read).length }}/>
      <main className="main-content">
        <section className="page-body">
          {activeTab === 'beranda' && (
            <Beranda 
              medicalRecords={medicalRecords}
              rekomendasiCount={rekomendasiCount}
              changeTab={setActiveTab}
            />
          )}
          {activeTab === 'rekomendasi' && (
            <MintaRekomendasi 
              keluhan={keluhan}
              setKeluhan={setKeluhan}
              useRag={useRag}
              setUseRag={setUseRag}
              handleGetAIRecommendation={handleGetAIRecommendation}
              isRecommending={isRecommending}
              rekomendasi={rekomendasi}
            />
          )}
          {activeTab === 'riwayat_medis' && (
            <RiwayatMedis 
              medicalRecords={medicalRecords} 
              loadRequests={loadRequests}
            />
          )}

          {activeTab === 'riwayat_rekomendasi' && (
          <RiwayatRekomendasi />
        )}
        {activeTab === 'notifikasi' && (
          <NotifikasiPasien />
        )}
        {activeTab === 'profil' && (
          <ProfilSaya />
        )}
        </section>
      </main>

      <style jsx>{`
        .layout-container { display: flex; background: var(--bg-primary); min-height: 100vh; }
        .main-content { margin-left: 260px; flex: 1; padding: 20px 40px; }
        .page-body { margin-top: 10px; }
      `}</style>
    </div>
  );
}
