import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    role: 'patient'
  });
  const [documentFile, setDocumentFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { loginWithPassword } = useAuth();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setDocumentFile(e.target.files[0]);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Validation for doctors
    if ((formData.role === 'doctor' || formData.role === 'herbal_doctor') && !documentFile) {
        setError('Dokumen STR/SIP wajib diunggah untuk pendaftaran Dokter.');
        setLoading(false);
        return;
    }

    try {
      const form = new FormData();
      Object.keys(formData).forEach(key => form.append(key, formData[key]));
      
      if (documentFile) {
        form.append('document', documentFile);
      }
      
      const res = await fetch('http://127.0.0.1:5000/auth/register', {
        method: 'POST',
        body: form
      });
      const data = await res.json();
      
      if (res.ok) {
        // Automatically login the user with the credentials they just used
        const loginRes = await loginWithPassword(formData.username, formData.password);
        if (!loginRes.success) {
            setError(loginRes.error || "Pendaftaran berhasil, tetapi gagal masuk otomatis. Silakan login manual.");
            router.replace('/login');
        }
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Connection error');
    }
    setLoading(false);
  };

  const isDoctor = formData.role === 'herbal_doctor';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at center, var(--bg-secondary), var(--bg-primary))', padding: '2rem' }}>
      <div className="glass-panel animate-fade-in" style={{ padding: '3rem', width: '100%', maxWidth: '500px' }}>
        <h2 style={{ fontSize: '2rem', color: 'var(--accent-primary)', marginBottom: '0.5rem', textAlign: 'center' }}>Buat Akun</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', textAlign: 'center' }}>Bergabung dengan HERBALSAFE AI</p>
        
        {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>{error}</div>}
        
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input type="text" name="full_name" placeholder="Nama Lengkap" className="input-field" onChange={handleChange} required />
          <input type="text" name="username" placeholder="Username" className="input-field" onChange={handleChange} required />
          <input type="email" name="email" placeholder="Email" className="input-field" onChange={handleChange} required />
          <input type="password" name="password" placeholder="Password" className="input-field" onChange={handleChange} required />
          
          <select name="role" className="input-field" onChange={handleChange} value={formData.role} style={{ appearance: 'none', background: 'var(--bg-primary)' }}>
            <option value="patient">Pasien</option>
            <option value="herbal_doctor">Dokter Herbal</option>
          </select>

          {isDoctor && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Unggah Dokumen STR / SIP (Wajib)*
                </label>
                <input 
                    type="file" 
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange} 
                    className="input-field" 
                    style={{ padding: '0.5rem' }}
                    required 
                />
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Mendaftar...' : 'Daftar'}
          </button>
        </form>
        
        <p style={{ marginTop: '2rem', color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'center' }}>
          Sudah punya akun? <Link href="/login" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>Login di sini</Link>
        </p>
      </div>
    </div>
  );
}
