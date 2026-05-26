import React from 'react';
import { User, Mail, Shield, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ProfilSaya = () => {
  const { id, username, fullName, role, email } = useAuth();

  const getRoleLabel = (r) => {
    switch (r) {
      case 'admin': return 'Administrator Sistem';
      case 'doctor': return 'Dokter Umum / Medis';
      case 'herbal_doctor': return 'Dokter Spesialis Herbal';
      case 'patient': return 'Pasien';
      default: return r || '-';
    }
  };

  return (
    <div className="profil-wrapper">
      <div className="profil-header">
        <h2 className="profil-title">Profil Saya</h2>
        <p className="profil-subtitle">Informasi akun dan identitas Anda dalam sistem</p>
      </div>

      <div className="profil-card">
        {/* Avatar */}
        <div className="avatar-section">
          <div className="avatar-circle">
            {fullName ? fullName.substring(0, 1).toUpperCase() : (username ? username.substring(0, 1).toUpperCase() : '?')}
          </div>
          <div className="avatar-info">
            <h3 className="avatar-name">{fullName || username || 'Nama Belum Diatur'}</h3>
            <span className="role-badge">{getRoleLabel(role)}</span>
          </div>
        </div>

        <div className="divider" />

        {/* Detail Info */}
        <div className="info-list">
          <div className="info-item">
            <div className="info-icon"><User size={18} /></div>
            <div className="info-content">
              <span className="info-label">Nama Lengkap</span>
              <span className="info-value">{fullName || '-'}</span>
            </div>
          </div>

          <div className="info-item">
            <div className="info-icon"><Shield size={18} /></div>
            <div className="info-content">
              <span className="info-label">Username</span>
              <span className="info-value">{username || '-'}</span>
            </div>
          </div>

          <div className="info-item">
            <div className="info-icon"><Mail size={18} /></div>
            <div className="info-content">
              <span className="info-label">Email</span>
              <span className="info-value">{email || '-'}</span>
            </div>
          </div>

          <div className="info-item">
            <div className="info-icon"><Shield size={18} /></div>
            <div className="info-content">
              <span className="info-label">Role / Peran</span>
              <span className="info-value">{getRoleLabel(role)}</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .profil-wrapper { animation: fadeIn 0.4s ease; }
        .profil-header { margin-bottom: 25px; }
        .profil-title { font-size: 24px; font-weight: 700; color: #333; margin: 0; }
        .profil-subtitle { font-size: 14px; color: #888; margin: 5px 0 0 0; }

        .profil-card {
          background: white;
          border-radius: 20px;
          border: 1px solid #f0f0f0;
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
          padding: 35px;
        }

        .avatar-section {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .avatar-circle {
          width: 64px; height: 64px;
          border-radius: 50%;
          background: linear-gradient(135deg, #e8f5e9, #c8e6c9);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 700;
          color: #2e7d32;
          border: 3px solid #fff;
          box-shadow: 0 2px 8px rgba(46, 125, 50, 0.15);
        }

        .avatar-name { margin: 0; font-size: 20px; font-weight: 700; color: #333; }
        .role-badge {
          display: inline-block;
          margin-top: 4px;
          padding: 4px 12px;
          background: #e8f5e9;
          color: #2e7d32;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .divider { height: 1px; background: #f0f0f0; margin: 25px 0; }

        .info-list { display: flex; flex-direction: column; gap: 20px; }

        .info-item {
          display: flex;
          align-items: flex-start;
          gap: 15px;
          padding: 16px;
          background: #fafafa;
          border-radius: 14px;
          border: 1px solid #f5f5f5;
        }

        .info-icon {
          background: #e8f5e9;
          padding: 10px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #2e7d32;
        }

        .info-content { display: flex; flex-direction: column; gap: 4px; flex: 1; }
        .info-label { font-size: 12px; color: #999; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
        .info-value { font-size: 15px; color: #333; font-weight: 500; word-break: break-all; }
        .info-value.mono { font-family: 'Courier New', monospace; font-size: 13px; color: #555; }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default ProfilSaya;
