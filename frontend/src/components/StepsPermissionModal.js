import React, { useState, useEffect } from 'react';

// Компонент для запроса разрешений на доступ к данным о шагах
export default function StepsPermissionModal({ isVisible, onClose, onPermissionGranted }) {
  const [isLoading, setIsLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Определяем платформу пользователя
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isMobile = isAndroid || isIOS;

  // Проверяем статус авторизации при открытии модала
  useEffect(() => {
    if (isVisible) {
      checkExistingAuth();
    }
  }, [isVisible]);

  // Проверка существующей авторизации
  const checkExistingAuth = async () => {
    try {
      // Проверяем Google Fit авторизацию
      if (window.gapi && window.gapi.auth2) {
        const authInstance = window.gapi.auth2.getAuthInstance();
        if (authInstance && authInstance.isSignedIn.get()) {
          setAuthStatus('google_authorized');
          return;
        }
      }

      // Проверяем сохраненные токены
      const savedAuth = localStorage.getItem('dianafit_health_auth');
      if (savedAuth) {
        const authData = JSON.parse(savedAuth);
        if (authData.expires > Date.now()) {
          setAuthStatus('authorized');
          return;
        } else {
          // Токен истек
          localStorage.removeItem('dianafit_health_auth');
        }
      }

      setAuthStatus('not_authorized');
    } catch (error) {
      console.error('Ошибка проверки авторизации:', error);
      setAuthStatus('not_authorized');
    }
  };

  // Запрос разрешения на доступ к данным о здоровье
  const requestHealthPermission = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      if (isAndroid) {
        await requestGoogleFitPermission();
      } else if (isIOS) {
        await requestAppleHealthPermission();
      } else {
        // Для веб-браузеров запрашиваем разрешения на датчики
        await requestWebPermissions();
      }
    } catch (error) {
      console.error('Ошибка запроса разрешений:', error);
      setErrorMessage('Не удалось получить разрешение. Попробуйте еще раз.');
    } finally {
      setIsLoading(false);
    }
  };

  // Запрос разрешения Google Fit (Android)
  const requestGoogleFitPermission = async () => {
    return new Promise((resolve, reject) => {
      // Загружаем Google API если еще не загружен
      if (!window.gapi) {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = () => initGoogleAPI(resolve, reject);
        script.onerror = () => reject('Не удалось загрузить Google API');
        document.head.appendChild(script);
      } else {
        initGoogleAPI(resolve, reject);
      }
    });
  };

  // Инициализация Google API
  const initGoogleAPI = (resolve, reject) => {
    window.gapi.load('auth2', {
      callback: () => {
        window.gapi.load('client', async () => {
          try {
            await window.gapi.client.init({
              apiKey: process.env.REACT_APP_GOOGLE_API_KEY || 'demo_key',
              clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID || 'demo_client_id',
              discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/fitness/v1/rest'],
              scope: 'https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.body.read'
            });

            const authInstance = window.gapi.auth2.getAuthInstance();
            
            // Запрашиваем авторизацию пользователя
            const user = await authInstance.signIn({
              prompt: 'consent'
            });

            if (user.isSignedIn()) {
              // Сохраняем данные авторизации
              const authData = {
                type: 'google_fit',
                accessToken: user.getAuthResponse().access_token,
                expires: Date.now() + (user.getAuthResponse().expires_in * 1000),
                scope: 'fitness.activity.read'
              };
              
              localStorage.setItem('dianafit_health_auth', JSON.stringify(authData));
              setAuthStatus('google_authorized');
              
              // Тестируем получение данных
              await testGoogleFitAccess();
              
              onPermissionGranted('google_fit');
              resolve();
            } else {
              reject('Пользователь отклонил авторизацию');
            }
          } catch (error) {
            reject(error);
          }
        });
      },
      onerror: () => reject('Ошибка загрузки Google Auth API')
    });
  };

  // Тест доступа к Google Fit
  const testGoogleFitAccess = async () => {
    try {
      const today = new Date();
      const startTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
      const endTime = Date.now();

      const response = await window.gapi.client.fitness.users.dataSources.dataPointChanges.list({
        userId: 'me',
        dataSourceId: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps',
        startTime: startTime * 1000000, // наносекунды
        endTime: endTime * 1000000
      });

      console.log('✅ Google Fit тест прошел успешно:', response.result);
      return true;
    } catch (error) {
      console.error('❌ Ошибка тестирования Google Fit:', error);
      return false;
    }
  };

  // Запрос разрешения Apple Health (iOS)
  const requestAppleHealthPermission = async () => {
    try {
      // Проверяем доступность DeviceMotionEvent (iOS Safari)
      if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        const permission = await DeviceMotionEvent.requestPermission();
        
        if (permission === 'granted') {
          // Сохраняем разрешение
          const authData = {
            type: 'ios_motion',
            granted: true,
            timestamp: Date.now()
          };
          
          localStorage.setItem('dianafit_health_auth', JSON.stringify(authData));
          setAuthStatus('ios_authorized');
          onPermissionGranted('ios_motion');
          return;
        } else {
          throw new Error('Пользователь отклонил доступ к датчикам движения');
        }
      }

      // Альтернативно пробуем через Web API
      if (navigator.permissions) {
        const result = await navigator.permissions.query({ name: 'accelerometer' });
        if (result.state === 'granted') {
          const authData = {
            type: 'web_sensors',
            granted: true,
            timestamp: Date.now()
          };
          
          localStorage.setItem('dianafit_health_auth', JSON.stringify(authData));
          setAuthStatus('web_authorized');
          onPermissionGranted('web_sensors');
          return;
        }
      }

      throw new Error('Датчики движения недоступны на этом устройстве');
    } catch (error) {
      throw new Error(`Не удалось получить доступ к данным о здоровье: ${error.message}`);
    }
  };

  // Запрос веб-разрешений
  const requestWebPermissions = async () => {
    try {
      if (navigator.permissions) {
        // Запрашиваем разрешения на датчики
        const accelerometer = await navigator.permissions.query({ name: 'accelerometer' });
        const gyroscope = await navigator.permissions.query({ name: 'gyroscope' });
        
        if (accelerometer.state === 'granted' && gyroscope.state === 'granted') {
          const authData = {
            type: 'web_sensors',
            granted: true,
            timestamp: Date.now()
          };
          
          localStorage.setItem('dianafit_health_auth', JSON.stringify(authData));
          setAuthStatus('web_authorized');
          onPermissionGranted('web_sensors');
          return;
        }
      }

      throw new Error('Веб-браузер не поддерживает доступ к датчикам движения');
    } catch (error) {
      throw new Error(`Веб-разрешения недоступны: ${error.message}`);
    }
  };

  // Отзыв разрешений
  const revokePermissions = async () => {
    try {
      // Удаляем сохраненные данные
      localStorage.removeItem('dianafit_health_auth');
      
      // Выходим из Google аккаунта если авторизованы
      if (window.gapi && window.gapi.auth2) {
        const authInstance = window.gapi.auth2.getAuthInstance();
        if (authInstance && authInstance.isSignedIn.get()) {
          await authInstance.signOut();
        }
      }
      
      setAuthStatus('not_authorized');
      console.log('✅ Разрешения отозваны');
    } catch (error) {
      console.error('Ошибка отзыва разрешений:', error);
    }
  };

  if (!isVisible) return null;

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
        background: '#fff',
        borderRadius: 20,
        padding: '24px',
        maxWidth: '400px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Заголовок */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20
        }}>
          <h2 style={{
            fontSize: 20,
            fontWeight: 700,
            color: '#1a1a1a',
            margin: 0
          }}>
            🏃‍♀️ Доступ к данным о шагах
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 24,
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
          </button>
        </div>

        {/* Контент в зависимости от статуса */}
        {authStatus === 'not_authorized' && (
          <>
            <div style={{
              background: '#f8fafc',
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a', marginBottom: 8 }}>
                Автоматический подсчет шагов
              </div>
              <div style={{ fontSize: 14, color: '#666', lineHeight: 1.5 }}>
                Разрешите доступ к данным о физической активности для автоматического отслеживания ваших шагов
              </div>
            </div>

            {/* Информация о платформе */}
            <div style={{
              background: isAndroid ? '#e8f5e8' : isIOS ? '#e3f0ff' : '#fff7ed',
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
              border: `1px solid ${isAndroid ? '#c6f6c6' : isIOS ? '#b3d9ff' : '#fed7aa'}`
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                {isAndroid ? '📱 Android устройство' : isIOS ? '🍎 iOS устройство' : '💻 Веб-браузер'}
              </div>
              <div style={{ fontSize: 13, color: '#666' }}>
                {isAndroid && 'Будет использован Google Fit API для получения данных о шагах'}
                {isIOS && 'Будет использован доступ к датчикам движения iOS'}
                {!isMobile && 'Будет запрошен доступ к датчикам движения браузера'}
              </div>
            </div>

            {errorMessage && (
              <div style={{
                background: '#fee',
                border: '1px solid #fcc',
                borderRadius: 12,
                padding: 16,
                marginBottom: 20,
                color: '#c53030',
                fontSize: 14
              }}>
                ⚠️ {errorMessage}
              </div>
            )}

            <button
              onClick={requestHealthPermission}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px 24px',
                borderRadius: 12,
                border: 'none',
                background: isLoading 
                  ? '#e2e8f0' 
                  : 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
                color: isLoading ? '#64748b' : '#fff',
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
                    border: '2px solid #64748b',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Запрос разрешения...
                </>
              ) : (
                <>
                  🔐 Разрешить доступ к шагам
                </>
              )}
            </button>
          </>
        )}

        {(authStatus === 'google_authorized' || authStatus === 'ios_authorized' || authStatus === 'web_authorized') && (
          <>
            <div style={{
              background: '#e8f5e8',
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
              border: '1px solid #c6f6c6'
            }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#2d5a2d', marginBottom: 8 }}>
                ✅ Доступ предоставлен
              </div>
              <div style={{ fontSize: 14, color: '#2d5a2d' }}>
                {authStatus === 'google_authorized' && 'Google Fit подключен. Шаги будут синхронизироваться автоматически.'}
                {authStatus === 'ios_authorized' && 'Датчики iOS подключены. Шаги будут отслеживаться автоматически.'}
                {authStatus === 'web_authorized' && 'Веб-датчики подключены. Активность будет отслеживаться.'}
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: 12
            }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  borderRadius: 12,
                  border: 'none',
                  background: 'linear-gradient(135deg, #10b981 0%, #22c55e 100%)',
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Готово
              </button>
              
              <button
                onClick={revokePermissions}
                style={{
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: '1px solid #e2e8f0',
                  background: '#fff',
                  color: '#666',
                  fontSize: 14,
                  cursor: 'pointer'
                }}
              >
                Отозвать
              </button>
            </div>
          </>
        )}

        {/* Информация о конфиденциальности */}
        <div style={{
          marginTop: 20,
          padding: 16,
          background: '#f8fafc',
          borderRadius: 12,
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ fontSize: 12, color: '#666', lineHeight: 1.4 }}>
            🔒 <strong>Конфиденциальность:</strong> Данные о ваших шагах обрабатываются локально на устройстве. 
            Мы не передаем персональную информацию третьим лицам без вашего согласия.
          </div>
        </div>
      </div>
    </div>
  );
}
