import React, { useState } from 'react';

export default function HealthPermissionDialog({ onPermissionGranted, onPermissionDenied, onClose }) {
  const [isLoading, setIsLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState('pending'); // 'pending', 'granted', 'denied', 'error'

  // Определяем платформу пользователя
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isMobile = isAndroid || isIOS;

  const handleGrantPermission = async () => {
    setIsLoading(true);
    
    try {
      let success = false;

      if (isAndroid) {
        // Авторизация через Google Fit API
        success = await requestGoogleFitPermission();
      } else if (isIOS) {
        // Авторизация через Web HealthKit (если доступен)
        success = await requestHealthKitPermission();
      } else {
        // Для десктопа пробуем Google Fit
        success = await requestGoogleFitPermission();
      }

      if (success) {
        setPermissionStatus('granted');
        localStorage.setItem('dianafit_health_permission', 'granted');
        localStorage.setItem('dianafit_health_permission_date', new Date().toISOString());
        setTimeout(() => {
          onPermissionGranted();
          onClose();
        }, 1500);
      } else {
        setPermissionStatus('denied');
        setTimeout(() => {
          onPermissionDenied();
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error('Ошибка при получении разрешения:', error);
      setPermissionStatus('error');
      setTimeout(() => {
        onPermissionDenied();
        onClose();
      }, 2000);
    } finally {
      setIsLoading(false);
    }
  };

  const requestGoogleFitPermission = async () => {
    return new Promise((resolve) => {
      // Проверяем, загружен ли Google API
      if (!window.gapi) {
        // Динамически загружаем Google API
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = () => {
          initGoogleAuth(resolve);
        };
        script.onerror = () => resolve(false);
        document.head.appendChild(script);
      } else {
        initGoogleAuth(resolve);
      }
    });
  };

  const initGoogleAuth = (resolve) => {
    window.gapi.load('auth2', {
      callback: () => {
        window.gapi.load('client', async () => {
          try {
            await window.gapi.client.init({
              apiKey: process.env.REACT_APP_GOOGLE_API_KEY || 'demo_key',
              clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID || 'demo_client',
              discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/fitness/v1/rest'],
              scope: 'https://www.googleapis.com/auth/fitness.activity.read'
            });

            const authInstance = window.gapi.auth2.getAuthInstance();
            const user = await authInstance.signIn();
            
            if (user.isSignedIn()) {
              console.log('✅ Google Fit авторизация успешна');
              resolve(true);
            } else {
              resolve(false);
            }
          } catch (error) {
            console.error('Ошибка Google Fit авторизации:', error);
            resolve(false);
          }
        });
      },
      onerror: () => resolve(false)
    });
  };

  const requestHealthKitPermission = async () => {
    try {
      // Пробуем запросить разрешения на датчики движения
      if ('DeviceMotionEvent' in window && typeof DeviceMotionEvent.requestPermission === 'function') {
        const permission = await DeviceMotionEvent.requestPermission();
        if (permission === 'granted') {
          console.log('✅ Разрешение на датчики движения получено');
          return true;
        }
      }

      // Если доступен Web HealthKit API (экспериментальный)
      if ('health' in navigator) {
        const result = await navigator.health.requestPermission({ name: 'step-counter' });
        return result === 'granted';
      }

      return false;
    } catch (error) {
      console.error('Ошибка при запросе разрешений HealthKit:', error);
      return false;
    }
  };

  const handleSkip = () => {
    localStorage.setItem('dianafit_health_permission', 'skipped');
    onPermissionDenied();
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0, 0, 0, 0.5)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        width: '100%',
        maxWidth: 400,
        background: '#fff',
        borderRadius: 20,
        padding: '32px 24px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        textAlign: 'center'
      }}>
        {permissionStatus === 'pending' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏃‍♀️</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#1a1a1a', marginBottom: 16 }}>
              Разрешение на доступ к шагам
            </div>
            <div style={{ fontSize: 16, color: '#666', lineHeight: 1.5, marginBottom: 24 }}>
              {isMobile ? (
                <>
                  Для автоматического подсчета шагов приложению нужно разрешение на доступ к данным о фитнесе.
                  <br/><br/>
                  {isAndroid && 'Будет использован Google Fit API'}
                  {isIOS && 'Будет использован Apple HealthKit'}
                </>
              ) : (
                'Для подсчета шагов нужно подключить Google Fit аккаунт. Это позволит синхронизировать данные с вашего телефона.'
              )}
            </div>
            
            <div style={{
              background: '#f0f9ff',
              border: '1px solid #0ea5e9',
              borderRadius: 12,
              padding: 16,
              marginBottom: 24,
              fontSize: 14,
              color: '#0c4a6e'
            }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>🔒 Ваши данные в безопасности</div>
              <div>• Доступ только для чтения шагов</div>
              <div>• Данные не передаются третьим лицам</div>
              <div>• Разрешение можно отозвать в любое время</div>
            </div>

            <div style={{ display: 'flex', gap: 12, flexDirection: 'column' }}>
              <button
                onClick={handleGrantPermission}
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  borderRadius: 12,
                  background: isLoading 
                    ? '#94a3b8' 
                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                {isLoading ? (
                  <>
                    <div style={{
                      width: 16,
                      height: 16,
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTop: '2px solid #fff',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Получение разрешения...
                  </>
                ) : (
                  <>
                    ✅ Разрешить доступ к шагам
                  </>
                )}
              </button>
              
              <button
                onClick={handleSkip}
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  borderRadius: 12,
                  background: 'transparent',
                  border: '1px solid #d1d5db',
                  color: '#6b7280',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Пропустить (ручной ввод шагов)
              </button>
            </div>
          </>
        )}

        {permissionStatus === 'granted' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981', marginBottom: 16 }}>
              Разрешение получено!
            </div>
            <div style={{ fontSize: 16, color: '#666' }}>
              Теперь ваши шаги будут автоматически синхронизироваться
            </div>
          </>
        )}

        {permissionStatus === 'denied' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#ef4444', marginBottom: 16 }}>
              Разрешение отклонено
            </div>
            <div style={{ fontSize: 16, color: '#666' }}>
              Вы сможете вводить шаги вручную или дать разрешение позже в настройках
            </div>
          </>
        )}

        {permissionStatus === 'error' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b', marginBottom: 16 }}>
              Ошибка получения разрешения
            </div>
            <div style={{ fontSize: 16, color: '#666' }}>
              Не удалось подключиться к сервису. Попробуйте позже или введите шаги вручную
            </div>
          </>
        )}
      </div>
    </div>
  );
}
