import React, { useState } from 'react';
import { FileText, Calendar, Plus, Save, Edit2, Trash2 } from 'lucide-react';
import axios from 'axios';

export default function RiwayatMedis({ medicalRecords, loadRequests }) {
    const [viewMode, setViewMode] = useState('list'); // 'list', 'add', 'edit'
    const [formData, setFormData] = useState({ id: null, diagnosis: '', symptoms: '', treatment: '', notes: '' });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAdd = () => {
        setFormData({ id: null, diagnosis: '', symptoms: '', treatment: '', notes: '' });
        setViewMode('add');
    };

    const handleEdit = (record) => {
        setFormData({
            id: record.id,
            diagnosis: record.diagnosis || '',
            symptoms: record.symptoms || '',
            treatment: record.treatment || '',
            notes: record.notes || ''
        });
        setViewMode('edit');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('herbalchain_token');
            if (viewMode === 'add') {
                await axios.post('http://127.0.0.1:5000/records/medical', formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert('Rekam medis berhasil ditambahkan!');
            } else if (viewMode === 'edit') {
                await axios.put(`http://127.0.0.1:5000/records/medical/${formData.id}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert('Rekam medis berhasil diperbarui!');
            }
            await loadRequests();
            setViewMode('list');
        } catch (error) {
            console.error(error);
            alert('Gagal menyimpan rekam medis.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Yakin ingin menghapus rekam medis ini?')) return;
        setLoading(true);
        try {
            const token = localStorage.getItem('herbalchain_token');
            await axios.delete(`http://127.0.0.1:5000/records/medical/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Rekam medis dihapus!');
            await loadRequests();
        } catch (error) {
            console.error(error);
            alert('Gagal menghapus data.');
        } finally {
            setLoading(false);
        }
    };

    if (viewMode !== 'list') {
        return (
            <div className="riwayat-wrapper">
                <div className="riwayat-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 className="riwayat-title">{viewMode === 'add' ? 'Tambah Data Medis' : 'Edit Data Medis'}</h1>
                        <p className="riwayat-subtitle">Input data riwayat kesehatan Anda</p>
                    </div>
                    <button className="btn-back" onClick={() => setViewMode('list')}>Kembali</button>
                </div>

                <div className="form-card">
                    <form onSubmit={handleSubmit} className="form-medical">
                        <div className="form-group">
                            <label>Diagnosis Keluhan</label>
                            <input
                                type="text"
                                name="diagnosis"
                                value={formData.diagnosis}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="Contoh: Mag Kronis, Hipertensi..."
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Gejala yang Dirasakan</label>
                            <textarea
                                name="symptoms"
                                value={formData.symptoms}
                                onChange={handleChange}
                                className="form-textarea"
                                placeholder="Deskripsikan gejala yang Anda alami..."
                            />
                        </div>

                        <div className="form-group">
                            <label>Catatan Tambahan (Opsional)</label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                className="form-textarea"
                                placeholder="Informasi alergi, riwayat genetik, dll..."
                            />
                        </div>
                        <button type="submit" disabled={loading} className="btn-submit">
                            <Save size={18} style={{ marginRight: '8px' }} />
                            {loading ? 'Menyimpan...' : 'Simpan Data Medis'}
                        </button>
                    </form>
                </div>
                <style jsx>{`
                    .riwayat-wrapper { animation: fadeIn 0.4s ease; color: #333 !important; }
                    .riwayat-header { margin-bottom: 24px; }
                    .riwayat-title { font-size: 24px; font-weight: 700; color: #333; margin: 0; }
                    .riwayat-subtitle { font-size: 14px; color: #888; margin: 4px 0 0 0; }
                    .btn-back { padding: 8px 16px; border-radius: 8px; border: 1px solid #ddd; background: white; cursor: pointer; color: #333; font-weight: 600; }
                    
                    .form-card { background: white; padding: 25px; border-radius: 16px; border: 1px solid #f0f0f0; }
                    .form-group { margin-bottom: 20px; }
                    .form-group label { display: block; font-weight: 600; margin-bottom: 8px; color: #444; font-size: 14px; }
                    .form-input, .form-textarea { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-family: inherit; font-size: 14px; color: #333; background: #fff; }
                    .form-textarea { height: 100px; resize: vertical; }
                    .form-input:focus, .form-textarea:focus { outline: none; border-color: #2e7d32; }
                    
                    .btn-submit { display: flex; align-items: center; justify-content: center; width: 100%; padding: 14px; background: linear-gradient(135deg, #2e7d32, #4caf50); color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 15px; }
                    .btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }
                    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; } }
                `}</style>
            </div>
        );
    }

    return (
        <div className="riwayat-wrapper">
            <div className="riwayat-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="riwayat-title">Riwayat Data Medis</h1>
                    <p className="riwayat-subtitle">Kelola catatan kesehatan Anda</p>
                </div>
                <button className="btn-add" onClick={handleAdd}>
                    <Plus size={18} style={{ marginRight: '6px' }} /> Tambah Data Medis
                </button>
            </div>

            {!medicalRecords || medicalRecords.length === 0 ? (
                <div className="empty-state">
                    <FileText size={48} color="#c8e6c9" />
                    <p>Belum ada data medis yang tersedia.</p>
                    <p className="empty-hint">Silakan tambahkan riwayat keluhan atau diagnosis Anda.</p>
                </div>
            ) : (
                <div className="records-list">
                    {medicalRecords.map((rec, i) => (
                        <div key={rec.id || i} className="record-card">
                            <div className="card-header">
                                <div className="doctor-info">
                                    <div>
                                        <p className="doc-name">{rec.diagnosis || 'Diagnosis Tidak Diketahui'}</p>
                                        <p className="rec-date">
                                            <Calendar size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                                            {rec.timestamp ? new Date(rec.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                                        </p>
                                    </div>
                                </div>
                                <div className="action-buttons">
                                    <button className="btn-icon edit" onClick={() => handleEdit(rec)} title="Edit"><Edit2 size={16} /></button>
                                    <button className="btn-icon delete" onClick={() => handleDelete(rec.id)} title="Hapus"><Trash2 size={16} /></button>
                                </div>
                            </div>

                            <div className="card-body">
                                {rec.symptoms && (
                                    <div className="field-row">
                                        <span className="field-label">Gejala</span>
                                        <span className="field-value">{rec.symptoms}</span>
                                    </div>
                                )}
                                {rec.treatment && (
                                    <div className="field-row">
                                        <span className="field-label">Penanganan</span>
                                        <span className="field-value">{rec.treatment}</span>
                                    </div>
                                )}
                                {rec.notes && (
                                    <div className="field-row">
                                        <span className="field-label">Catatan</span>
                                        <span className="field-value notes">{rec.notes}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style jsx>{`
                .riwayat-wrapper { animation: fadeIn 0.4s ease; color: #333 !important; }
                .riwayat-header { margin-bottom: 24px; }
                .riwayat-title { font-size: 24px; font-weight: 700; color: #333; margin: 0; }
                .riwayat-subtitle { font-size: 14px; color: #888; margin: 4px 0 0 0; }

                .btn-add { display: flex; align-items: center; background: #2e7d32; color: white; padding: 10px 18px; border-radius: 8px; border: none; font-weight: 600; cursor: pointer; }
                .btn-add:hover { background: #1b5e20; }

                .records-list { display: flex; flex-direction: column; gap: 16px; }
                .record-card { background: white; border-radius: 16px; border: 1px solid #f0f0f0; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.03); }

                .card-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #f5f5f5; background: #fafafa; }
                .doc-name { font-size: 16px; font-weight: 700; color: #1976d2; margin: 0; }
                .rec-date { font-size: 12px; color: #888; margin: 4px 0 0 0; }

                .action-buttons { display: flex; gap: 8px; }
                .btn-icon { padding: 6px; border-radius: 6px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; }
                .btn-icon.edit { background: #e3f2fd; color: #1976d2; }
                .btn-icon.edit:hover { background: #bbdefb; }
                .btn-icon.delete { background: #ffebee; color: #d32f2f; }
                .btn-icon.delete:hover { background: #ffcdd2; }

                .card-body { padding: 20px; display: flex; flex-direction: column; gap: 12px; }
                .field-row { display: flex; flex-direction: column; gap: 4px; }
                .field-label { font-size: 12px; font-weight: 700; color: #777; text-transform: uppercase; letter-spacing: 0.5px; }
                .field-value { font-size: 14px; color: #333; line-height: 1.5; background: #f9f9f9; padding: 10px; border-radius: 8px; }
                .notes { font-style: italic; color: #555; }

                .empty-state { background: white; border-radius: 20px; border: 1px solid #f0f0f0; padding: 70px; text-align: center; color: #888; display: flex; flex-direction: column; align-items: center; gap: 10px; }
                .empty-hint { font-size: 13px; color: #aaa; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; } }
            `}</style>
        </div>
    );
}
