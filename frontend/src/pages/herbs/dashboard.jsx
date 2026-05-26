import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import axios from 'axios';
import ProfilSaya from '../../components/ProfilSaya';
import BerandaHerbal from './BerandaHerbal';
import TambahHerbal from './TambahHerbal';
import KatalogHerbal from './KatalogHerbal';

const EMPTY_FORM = { id: null, nama: '', indikasi: '', kontraindikasi: '', deskripsi: '' };

const HerbalDashboard = () => {
  const { username, role, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTabRaw] = useState('dashboard');
  useEffect(() => {
    const savedTab = sessionStorage.getItem('herbs_activeTab');
    if (savedTab) setActiveTabRaw(savedTab);
  }, []);

  // Wrapper agar setiap perubahan tab juga tersimpan ke sessionStorage
  const setActiveTab = (tab) => {
    sessionStorage.setItem('herbs_activeTab', tab);
    setActiveTabRaw(tab);
  };
  const [herbalList, setHerbalList] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Guard: hanya herbal_doctor yang boleh akses
  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated || role !== 'herbal_doctor') {
      router.replace('/login');
    }
  }, [loading, isAuthenticated, role, router]);

  // Helper: tampilkan notifikasi toast
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ─── FETCH: Ambil daftar herbal dari backend ───
  const fetchHerbals = useCallback(async () => {
    const token = localStorage.getItem('herbalchain_token');
    try {
      const res = await axios.get('http://127.0.0.1:5000/herbal/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === 'success') {
        const rawHerbals = Array.isArray(res.data.herbals) ? res.data.herbals : [];
        // Normalisasi: pastikan field 'nama' & 'name' konsisten
        const normalized = rawHerbals.map(h => ({ ...h, name: h.nama || h.name || '' }));
        setHerbalList(normalized);
      }
    } catch (err) {
      console.error('Gagal ambil data herbal:', err);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && role === 'herbal_doctor') {
      fetchHerbals();
    }
  }, [isAuthenticated, role, fetchHerbals]);

  // ─── SAVE: Tambah atau Edit herbal ───
  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const token = localStorage.getItem('herbalchain_token');

    const payload = {
      nama: form.nama || form.name || '',
      indikasi: form.indikasi || '',
      kontraindikasi: form.kontraindikasi || '',
      deskripsi: form.deskripsi || ''
    };

    if (!payload.nama || !payload.indikasi || !payload.kontraindikasi) {
      showToast('❌ Nama, Indikasi, dan Kontraindikasi wajib diisi!', 'error');
      setIsSaving(false);
      return;
    }

    try {
      if (form.id) {
        // Mode Edit → PUT
        await axios.put(`http://127.0.0.1:5000/herbal/update/${form.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showToast(`✅ Data herbal berhasil diperbarui.`);
      } else {
        // Mode Tambah → POST
        await axios.post('http://127.0.0.1:5000/herbal/store', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showToast(`✅ Herbal berhasil ditambahkan ke knowledge base AI!`);
      }

      setForm(EMPTY_FORM);
      await fetchHerbals();
      setActiveTab('katalog');
    } catch (err) {
      const msg = err.response?.data?.error || 'Terjadi kesalahan saat menyimpan.';
      showToast(`❌ ${msg}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // ─── EDIT: Isi form dengan data existing ───
  const handleEdit = (herb) => {
    setForm({
      id: herb.id,
      nama: herb.nama || herb.name || '',
      indikasi: herb.indikasi || '',
      kontraindikasi: herb.kontraindikasi || '',
      deskripsi: herb.deskripsi || ''
    });
    setActiveTab('input');
  };

  // ─── DELETE: Soft-delete herbal ───
  const handleDelete = async (herbalId) => {
    if (!confirm('Yakin ingin menonaktifkan herbal ini? Data akan dihapus dari referensi AI.')) return;
    const token = localStorage.getItem('herbalchain_token');
    try {
      await axios.delete(`http://127.0.0.1:5000/herbal/delete/${herbalId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast('✅ Herbal berhasil dinonaktifkan.');
      await fetchHerbals();
    } catch (err) {
      const msg = err.response?.data?.error || 'Gagal menghapus data.';
      showToast(`❌ ${msg}`, 'error');
    }
  };

  // ─── CANCEL EDIT ───
  const handleCancel = () => {
    setForm(EMPTY_FORM);
    setActiveTab('katalog');
  };

  // ─── ADD: Beralih ke tab input dengan form kosong ───
  const handleAddClick = () => {
    setForm(EMPTY_FORM);
    setActiveTab('input');
  };

  return (
    <div className="herbal-layout">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="main-content">
        {/* TOAST NOTIFICATION */}
        {toast && (
          <div className={`toast ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
            {toast.msg}
          </div>
        )}

        {activeTab === 'dashboard' && (
          <BerandaHerbal
            herbalList={herbalList}
            onAddClick={handleAddClick}
          />
        )}

        {activeTab === 'input' && (
          <TambahHerbal
            form={form}
            setForm={setForm}
            onSave={handleSave}
            isSaving={isSaving}
            onCancel={handleCancel}
          />
        )}

        {activeTab === 'katalog' && (
          <KatalogHerbal
            herbalList={herbalList}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}

        {activeTab === 'profil' && <ProfilSaya />}
      </main>

      <style jsx>{`
        .herbal-layout {
          display: flex;
          min-height: 100vh;
          background: #f8faf9;
          font-family: 'Inter', sans-serif;
        }
        .main-content {
          flex: 1;
          margin-left: 260px;
          padding: 35px 40px;
          position: relative;
        }
        .toast {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 14px 22px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          z-index: 9999;
          animation: slideIn 0.3s ease;
          box-shadow: 0 8px 30px rgba(0,0,0,0.15);
        }
        .toast-success {
          background: #1b5e20;
          color: white;
        }
        .toast-error {
          background: #c62828;
          color: white;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default HerbalDashboard;
