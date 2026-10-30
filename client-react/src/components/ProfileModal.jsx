import { useEffect, useState } from 'react';
import { Camera, X, UserRound } from 'lucide-react';
import { apiRequest } from '../services/api';

export default function ProfileModal({ user, onClose, onSaved }) {
  const [name, setName] = useState(user.name || '');
  const [avatarDataUrl, setAvatarDataUrl] = useState(user.avatarDataUrl || '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  function chooseImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setError('Choose a PNG, JPEG, or WebP image.');
      return;
    }
    if (file.size > 750 * 1024) {
      setError('Choose an image smaller than 750 KB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarDataUrl(String(reader.result || ''));
      setError('');
    };
    reader.onerror = () => setError('Could not read that image.');
    reader.readAsDataURL(file);
  }

  async function save(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const data = await apiRequest('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({ name, avatarDataUrl }),
      });
      onSaved(data.user);
      onClose();
    } catch (err) {
      setError(err.message || 'Could not save profile.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-title">
        <div className="modal-heading">
          <div><div className="eyebrow">YOUR ACCOUNT</div><h2 id="profile-title">Profile settings</h2></div>
          <button className="icon-button" type="button" aria-label="Close profile settings" onClick={onClose}><X size={19}/></button>
        </div>
        <form onSubmit={save} className="profile-form">
          <div className="profile-image-edit">
            {avatarDataUrl
              ? <img src={avatarDataUrl} alt="Profile preview" />
              : <div className="profile-placeholder"><UserRound size={29}/></div>}
            <label className="button secondary image-picker"><Camera size={15}/> Change photo
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={chooseImage} />
            </label>
            {avatarDataUrl && <button type="button" className="text-button" onClick={() => setAvatarDataUrl('')}>Remove photo</button>}
          </div>
          <label>Name<input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} required /></label>
          <label>Email<input value={user.email || ''} readOnly /></label>
          <p className="tiny muted profile-help">PNG, JPEG, or WebP · up to 750 KB. Your profile is saved to your DevPilot account.</p>
          {error && <div className="alert error">{error}</div>}
          <div className="modal-actions">
            <button type="button" className="button secondary" onClick={onClose}>Cancel</button>
            <button className="button primary" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
