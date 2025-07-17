import React, { useState, useEffect } from 'react';
import { API_URL } from '../config/api';

// Популярные таймзоны
const timezones = [
  'Europe/Moscow',
  'Asia/Tbilisi',
  'Europe/Kiev',
  'Europe/Minsk',
  'Asia/Almaty',
  'Asia/Yekaterinburg',
  'Europe/Berlin',
  'Asia/Baku',
  'Asia/Tashkent',
  'Asia/Bishkek',
  'Asia/Ashgabat',
  'Asia/Yerevan',
  'Asia/Vladivostok',
  'Asia/Novosibirsk',
  'Asia/Sakhalin',
  'Asia/Krasnoyarsk',
  'Asia/Irkutsk',
  'Asia/Magadan',
  'Asia/Kamchatka',
];

const hours = Array.from({ length: 7 }, (_, i) => 6 + i); // 6-12

export default function NotificationSettings({ userId, initialTimezone, initialHour }) {
  const [timezone, setTimezone] = useState(initialTimezone || 'Europe/Moscow');
  const [notifyHour, setNotifyHour] = useState(initialHour || 9);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setTimezone(initialTimezone || 'Europe/Moscow');
    setNotifyHour(initialHour || 9);
  }, [initialTimezone, initialHour]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await fetch(`${API_URL}/api/user/notification-settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, timezone, notifyHour })
      });
      setSaved(true);
    } catch (err) {
      alert('Ошибка сохранения настроек!');
    }
    setSaving(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <h3>Настройки уведомлений</h3>
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontWeight: 500 }}>Часовой пояс:</label><br />
        <select value={timezone} onChange={e => setTimezone(e.target.value)} style={{ fontSize: 16, padding: 6, width: '100%', marginTop: 4 }}>
          {timezones.map(tz => (
            <option key={tz} value={tz}>{tz}</option>
          ))}
        </select>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontWeight: 500 }}>Время уведомления:</label><br />
        <select value={notifyHour} onChange={e => setNotifyHour(Number(e.target.value))} style={{ fontSize: 16, padding: 6, width: '100%', marginTop: 4 }}>
          {hours.map(h => (
            <option key={h} value={h}>{h}:00</option>
          ))}
        </select>
      </div>
      <button onClick={handleSave} disabled={saving} style={{ padding: '8px 24px', fontSize: 16, borderRadius: 8, background: '#4f8cff', color: '#fff', border: 'none', cursor: 'pointer' }}>
        {saving ? 'Сохраняем...' : 'Сохранить'}
      </button>
      {saved && <div style={{ color: 'green', marginTop: 10 }}>Настройки сохранены!</div>}
    </div>
  );
}
