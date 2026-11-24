import { useEffect, useState } from 'react';
import apiClient from '../../services/client';

export default function AdminDevices({ english }) {
  const [sessions, setSessions] = useState(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState('');
  const [reload, setReload] = useState(0);
  const t = (ar, en) => english ? en : ar;

  useEffect(() => {
    let active = true;
    setError(false);
    apiClient.auth.listSessions().then(rows => {
      if (!Array.isArray(rows)) throw new Error('Missing sessions');
      if (active) setSessions(rows);
    }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [reload]);

  async function revoke(id) {
    setBusy(id);
    setError(false);
    try {
      await apiClient.auth.revokeSession(id);
      setSessions(rows => rows.filter(row => row.id !== id));
    } catch { setError(true); }
    finally { setBusy(''); }
  }

  return <section className="rounded-xl border border-[var(--color-border)] p-4">
    <h3 className="font-bold">{t('الأجهزة المسجّلة', 'Signed-in devices')}</h3>
    {error && <p role="alert">{t('تعذّر تحديث الجلسات.', 'Could not update sessions.')} <button onClick={() => setReload(n => n + 1)}>{t('حاول تاني', 'Retry')}</button></p>}
    {!sessions && !error && <p>{t('جارٍ التحميل…', 'Loading…')}</p>}
    {sessions?.map(row => <div className="flex items-center justify-between gap-3 border-b py-3" key={row.id}>
      <div><strong>{row.device || t('جهاز غير معروف', 'Unknown device')}</strong>
        <div className="text-xs">{t('آخر نشاط', 'Last active')} · {new Date(row.lastActive).toLocaleString(english ? 'en' : 'ar')}</div>
      </div>
      {row.current ? <span>{t('هذا الجهاز', 'This device')}</span>
        : <button type="button" disabled={Boolean(busy)} onClick={() => revoke(row.id)} className="text-rose-600">
          {busy === row.id ? '…' : t('تسجيل الخروج', 'Sign out')}
        </button>}
    </div>)}
  </section>;
}
