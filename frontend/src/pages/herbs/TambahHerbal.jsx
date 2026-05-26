import React from 'react';
import { Leaf, Save, X } from 'lucide-react';

export default function TambahHerbal({ form, setForm, onSave, isSaving, onCancel }) {
    return (
        <div className="tambah-wrapper">
            <div className="tambah-header">
                <h1 className="tambah-title">{form.id ? 'Edit Data Herbal' : 'Tambah Herbal Baru'}</h1>
                <p className="tambah-subtitle">Data herbal akan disimpan ke database dan diindeks ke knowledge base AI</p>
            </div>

            <div className="tambah-card">
                <form onSubmit={onSave}>
                    <div className="form-group">
                        <label className="form-label">Nama Herbal <span className="required">*</span></label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Contoh: Jahe, Kunyit, Temulawak..."
                            value={form.nama || ''}
                            onChange={(e) => setForm({ ...form, nama: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Indikasi / Kegunaan <span className="required">*</span></label>
                        <textarea
                            className="form-textarea"
                            placeholder="Contoh: Diabetes, tekanan darah tinggi, anti-inflamasi, peningkat imunitas..."
                            value={form.indikasi || ''}
                            onChange={(e) => setForm({ ...form, indikasi: e.target.value })}
                            rows={3}
                            required
                        />
                        <p className="form-hint">Pisahkan dengan koma jika ada lebih dari satu indikasi.</p>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Kontraindikasi <span className="required">*</span></label>
                        <textarea
                            className="form-textarea"
                            placeholder="Contoh: Ibu hamil, anak-anak, penderita gangguan ginjal..."
                            value={form.kontraindikasi || ''}
                            onChange={(e) => setForm({ ...form, kontraindikasi: e.target.value })}
                            rows={2}
                            required
                        />
                    </div>


                    <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={onCancel}>
                            <X size={16} /> Batal
                        </button>
                        <button type="submit" className="btn-save" disabled={isSaving}>
                            <Save size={16} />
                            {isSaving ? 'Menyimpan...' : (form.id ? 'Simpan Perubahan' : 'Tambah ke Database')}
                        </button>
                    </div>
                </form>
            </div>

            <style jsx>{`
                .tambah-wrapper { animation: fadeIn 0.4s ease; }
                .tambah-header { margin-bottom: 24px; }
                .tambah-title { font-size: 24px; font-weight: 700; color: #333; margin: 0; }
                .tambah-subtitle { font-size: 14px; color: #888; margin: 4px 0 0 0; }

                .tambah-card { background: white; border-radius: 20px; border: 1px solid #f0f0f0; padding: 30px; box-shadow: 0 2px 12px rgba(0,0,0,0.02); }

                .form-group { margin-bottom: 22px; }
                .form-label { display: block; font-size: 13px; font-weight: 600; color: #555; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
                .required { color: #d32f2f; }
                .form-input, .form-textarea {
                    width: 100%; padding: 12px 16px;
                    border: 1px solid #e8e8e8; border-radius: 12px;
                    font-size: 14px; color: #333; background: #fafafa;
                    outline: none; transition: border-color 0.2s; font-family: inherit; box-sizing: border-box;
                }
                .form-input:focus, .form-textarea:focus { border-color: #2e7d32; background: white; }
                .form-textarea { resize: vertical; }
                .form-hint { font-size: 12px; color: #999; margin: 6px 0 0 0; }

                .form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px; }
                .btn-cancel {
                    display: flex; align-items: center; gap: 6px;
                    padding: 11px 20px; background: white; color: #666;
                    border: 1px solid #ddd; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer;
                }
                .btn-cancel:hover { background: #f5f5f5; }
                .btn-save {
                    display: flex; align-items: center; gap: 8px;
                    padding: 11px 24px; background: #2e7d32; color: white;
                    border: none; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer;
                    transition: background 0.2s;
                }
                .btn-save:hover { background: #1b5e20; }
                .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; } }
            `}</style>
        </div>
    );
}
