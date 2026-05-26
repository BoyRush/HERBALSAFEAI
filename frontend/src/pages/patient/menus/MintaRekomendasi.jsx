import React from 'react';
import { Send, CheckCircle, AlertTriangle, Info, Leaf, Sparkles } from 'lucide-react';

export default function MintaRekomendasi({
  keluhan,
  setKeluhan,
  useRag,
  setUseRag,
  handleGetAIRecommendation,
  isRecommending,
  rekomendasi
}) {
  const realRekomendasi = rekomendasi?.data || rekomendasi;
  const hasResults = realRekomendasi && realRekomendasi.rekomendasi && realRekomendasi.rekomendasi.length > 0;
  const successItems = realRekomendasi?.rekomendasi?.filter(r => r.status === 'success') || [];
  const warningItems = realRekomendasi?.rekomendasi?.filter(r => r.status !== 'success') || [];
  const errText = rekomendasi?.error || realRekomendasi?.error;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
        Dapatkan Rekomendasi Herbal
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.6' }}>
        Ceritakan keluhan medis Anda. Sistem AI kami akan mencarikan kandidat herbal terbaik, serta memeriksa silang dengan riwayat medis Anda (kontraindikasi) untuk memastikan keamanan.
      </p>

      {/* Form Input */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <textarea
          className="input-field"
          placeholder="Contoh: Saya sering merasa pusing, tengkuk kaku, dan mudah lelah. Tensi saya 150/90 mmHg..."
          rows={5}
          value={keluhan}
          onChange={(e) => setKeluhan(e.target.value)}
          style={{ resize: 'vertical', marginBottom: '1.5rem' }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <input
              type="checkbox"
              checked={useRag}
              onChange={(e) => setUseRag(e.target.checked)}
              style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--accent-primary)' }}
            />
            <span style={{ fontSize: '0.9rem' }}>{useRag ? 'Mode RAG (Database Herbal Lokal)' : 'Mode AI Umum'}</span>
          </label>

          <button
            className="btn btn-primary"
            onClick={handleGetAIRecommendation}
            disabled={isRecommending || !(keluhan || '').trim()}
          >
            {isRecommending ? (
              <><Sparkles size={18} style={{ marginRight: '0.5rem' }} /> Menganalisis...</>
            ) : (
              <><Send size={18} style={{ marginRight: '0.5rem' }} /> Kirim Keluhan</>
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      {rekomendasi && !isRecommending && (
        <div className="animate-fade-in">
          {errText && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #ef4444', padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
              <h4 style={{ color: '#ef4444', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={20} /> Error
              </h4>
              <p style={{ color: 'var(--text-primary)' }}>{errText}</p>
            </div>
          )}

          {hasResults && (
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>Hasil Rekomendasi AI</h2>

              {successItems.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)', marginBottom: '1rem' }}>
                    <CheckCircle size={20} />
                    <h3 style={{ margin: 0 }}>Rekomendasi Aman ({successItems.length})</h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {successItems.map((item, i) => (
                      <div key={i} style={{ background: 'var(--bg-primary)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                        <h4 style={{ fontSize: '1.2rem', color: 'var(--accent-primary)', margin: '0 0 0.5rem 0' }}>{item.nama}</h4>
                        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{item.alasan}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {warningItems.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', marginBottom: '1rem' }}>
                    <AlertTriangle size={20} />
                    <h3 style={{ margin: 0 }}>Perhatian Keselamatan ({warningItems.length})</h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {warningItems.map((item, i) => (
                      <div key={i} style={{ background: 'var(--bg-primary)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                        <h4 style={{ fontSize: '1.2rem', color: '#ef4444', margin: '0 0 0.5rem 0' }}>{item.nama}</h4>
                        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{item.alasan}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <Info size={20} style={{ color: '#3b82f6', flexShrink: 0 }} />
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Rekomendasi ini bersifat informatif dan tidak menggantikan konsultasi medis profesional. Selalu konsultasikan dengan dokter Anda sebelum mengonsumsi herbal.
                </p>
              </div>
            </div>
          )}

          {realRekomendasi?.rekomendasi && realRekomendasi.rekomendasi.length === 0 && (
            <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
              <Leaf size={40} color="var(--border-color)" style={{ marginBottom: '1rem' }} />
              <p style={{ color: 'var(--text-secondary)' }}>Tidak ada herbal yang sesuai ditemukan untuk keluhan ini.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
