import React, { useState, useRef, useEffect } from 'react';
import dianaIcon from '../assets/icons/diana.png';
import { API_URL } from '../config/api';

const DianaChat = ({ onClose, isPremium = false, activatePremium, setShowPayment }) => {
  // Блокировка прокрутки body при открытии чата
  useEffect(() => {
    // Сохраняем текущую позицию скролла
    const scrollY = window.scrollY;
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    // Сброс скролла и блокировка прокрутки
    window.scrollTo(0, 0);
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.top = `-${scrollY}px`;
    return () => {
      // Восстанавливаем прокрутку и позицию
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.width = '';
      document.body.style.top = '';
      window.scrollTo(0, scrollY);
    };
  }, []);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [limitInfo, setLimitInfo] = useState({ requestsUsed: 0, dailyLimit: 10, requestsLeft: 10, isPremium: false });
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);

  // Инициализация Telegram WebApp
  useEffect(() => {
    console.log('🔍 Initializing Telegram WebApp...');
    
    if (window.Telegram?.WebApp) {
      console.log('📱 Telegram WebApp found, initializing...');
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
      
      console.log('🔍 Telegram WebApp initData:', window.Telegram.WebApp.initData);
      console.log('🔍 Telegram WebApp initDataUnsafe:', window.Telegram.WebApp.initDataUnsafe);
      console.log('🔍 Telegram WebApp user:', window.Telegram.WebApp.initDataUnsafe?.user);
    } else {
      console.log('❌ Telegram WebApp not found');
    }
  }, []);

  // Получаем userId из Telegram WebApp
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  const userId = tgUser?.id || tgUser?.id?.toString() || 'demo_user_local_test';

  // Загружаем историю диалога и лимит при открытии чата
  useEffect(() => {
    const loadHistoryAndLimit = async () => {
      try {
        let userData = null;
        let currentLimitInfo = { requestsUsed: 0, dailyLimit: 10, requestsLeft: 10, isPremium: false };
        
        // Сначала загружаем лимит запросов
        const limitRes = await fetch(`${API_URL}/api/diana-limits/${userId}`);
        if (limitRes.ok) {
          const limitData = await limitRes.json();
          currentLimitInfo = {
            requestsUsed: limitData.requestsUsed,
            dailyLimit: limitData.dailyLimit,
            requestsLeft: limitData.requestsLeft,
            isPremium: limitData.isPremium
          };
          setLimitInfo(currentLimitInfo);
        }
        
        // Затем загружаем историю диалога
        const historyRes = await fetch(`${API_URL}/api/user/quiz-answers/${userId}`);
        if (historyRes.ok) {
          userData = await historyRes.json();
          if (userData.dialogHistory && Array.isArray(userData.dialogHistory)) {
            const loadedMessages = userData.dialogHistory.map((msg, idx) => ({
              id: idx + 1,
              from: msg.role === 'assistant' ? 'diana' : 'user',
              text: msg.text,
              timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
            }));
            setMessages(loadedMessages);
          }
        }
        
        // Если нет истории, показываем приветствие
        if (!userData?.dialogHistory?.length) {
          setMessages([{
            id: 1,
            from: 'diana',
            text: currentLimitInfo.isPremium 
              ? 'Привет! Я Диана, твой персональный фитнес-тренер! 💪\n\nУ тебя есть 10 вопросов в день. Я помогу тебе с вопросами о тренировках, питании, мотивации, режиме дня, рецептах и советах по похудению.\n\nМожешь спросить меня, например:\n• Как составить тренировку дома или в зале?\n• Как рассчитать калории?\n• Какие продукты лучше для похудения?\n• Как не потерять мотивацию?\n• Какой режим дня выбрать?\n\nЧто тебя интересует?'
              : 'Чат с ИИ-тренером доступен только для пользователей с премиум подпиской! Оформите подписку для получения 10 персональных консультаций в день.',
            timestamp: new Date()
          }]);
        }
        
        setIsHistoryLoaded(true);
      } catch (error) {
        console.error('Ошибка загрузки истории:', error);
        setIsHistoryLoaded(true);
      }
    };

    loadHistoryAndLimit();
  }, [userId]);

  const canSendMessage = limitInfo.isPremium && limitInfo.requestsLeft > 0;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    if (!limitInfo.isPremium) {
      setShowPremiumModal(true);
      return;
    }

    if (!canSendMessage) {
      alert(`Вы использовали все ${limitInfo.dailyLimit} вопросов на сегодня! Завтра лимит обновится. 🕐`);
      return;
    }

    const userMessage = {
      id: Date.now(),
      from: 'user',
      text: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/chat-diana`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputText,
          userId: userId,
          conversation: messages
        })
      });

      const data = await response.json();
      
      const dianaMessage = {
        id: Date.now() + 1,
        from: 'diana',
        text: data.response || 'Извини, у меня сейчас технические проблемы. Попробуй позже!',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, dianaMessage]);

      // Обновляем лимит после получения ответа
      if (data.limitInfo) {
        setLimitInfo({
          requestsUsed: data.limitInfo.requestsUsed,
          dailyLimit: data.limitInfo.dailyLimit,
          requestsLeft: data.limitInfo.requestsLeft,
          isPremium: data.limitInfo.isPremium
        });
      }
    } catch (error) {
      console.error('Ошибка чата:', error);
      const errorMessage = {
        id: Date.now() + 1,
        from: 'diana',
        text: 'Извини, у меня сейчас технические проблемы. Попробуй позже!',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Создаем стиль для overlay с максимальной точностью позиционирования
  const overlayStyle = {
    position: 'fixed',
    top: '0px',
    left: '0px',
    right: '0px',
    bottom: '0px',
    width: '100vw',
    height: '100vh',
    minHeight: '100vh',
    maxHeight: '100vh',
    background: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0px',
    padding: '0px',
    boxSizing: 'border-box',
    transform: 'translateZ(0)', // Принудительно создаем новый слой
    WebkitTransform: 'translateZ(0)',
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden'
  };

  // Функция для простого рендера жирного текста по **текст**
  function renderBold(text) {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  }

  return (
    <div style={overlayStyle}>
      <div style={{
        width: '90%',
        maxWidth: 480,
        height: '80vh',
        background: '#fff',
        borderRadius: 20,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Шапка чата */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #fff',
              overflow: 'hidden'
            }}>
              <img 
                src={dianaIcon} 
                alt="Диана"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '50%'
                }}
              />
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>
                <span style={{fontFamily: 'Montserrat Alternates, Montserrat, Arial, sans-serif'}}>Диана</span> {limitInfo.isPremium ? '💎' : '🔒'}
              </div>
              <div style={{ color: '#e0e6ff', fontSize: 12 }}>
                {limitInfo.isPremium 
                  ? `ИИ-тренер • ${limitInfo.requestsLeft}/${limitInfo.dailyLimit} вопросов`
                  : 'Только для премиум'
                }
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: 24,
              cursor: 'pointer',
              padding: 8
            }}
          >
            ×
          </button>
        </div>

        {/* Счетчик вопросов */}
        <div style={{
          background: limitInfo.isPremium ? '#e8f5e8' : '#fff3e0',
          padding: '8px 20px',
          borderBottom: '1px solid #e2e8f0',
          fontSize: 12,
          color: '#666',
          textAlign: 'center'
        }}>
          {limitInfo.isPremium 
            ? `Осталось вопросов: ${limitInfo.requestsLeft} из ${limitInfo.dailyLimit}`
            : `Бесплатно: ${limitInfo.requestsUsed} из ${limitInfo.dailyLimit} вопросов на сегодня`
          }
        </div>

        {/* Область сообщений */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}>
          {!isHistoryLoaded ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              color: '#666',
              fontSize: 14
            }}>
              Загружаю историю...
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  style={{
                    display: 'flex',
                    justifyContent: message.from === 'user' ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div style={{
                    maxWidth: '75%',
                    padding: '12px 16px',
                    borderRadius: 16,
                    background: message.from === 'user' 
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : '#f1f5f9',
                    color: message.from === 'user' ? '#fff' : '#1a1a1a',
                    fontSize: 14,
                    lineHeight: 1.4,
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'Montserrat Alternates, Montserrat, Arial, sans-serif',
                    fontWeight: 500,
                  }}>
                    {renderBold(message.text)}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: 16,
                    background: '#f1f5f9',
                    color: '#666',
                    fontSize: 14
                  }}>
                    Диана печатает...
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Поле ввода */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid #e2e8f0',
          background: '#fff'
        }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
             <textarea
               value={limitInfo.isPremium ? inputText : ''}
               onChange={limitInfo.isPremium ? (e) => setInputText(e.target.value) : undefined}
               onKeyPress={limitInfo.isPremium ? handleKeyPress : undefined}
               onFocus={() => {
                 if (!limitInfo.isPremium) {
                   setShowPremiumModal(true);
                 }
               }}
               placeholder={limitInfo.isPremium 
                 ? (canSendMessage 
                     ? `Напишите ваш вопрос... (осталось ${limitInfo.requestsLeft} из ${limitInfo.dailyLimit})`
                     : 'Лимит вопросов на сегодня исчерпан')
                 : 'Только для премиум пользователей'
               }
               disabled={isLoading}
               style={{
                 flex: 1,
                 minHeight: 44,
                 maxHeight: 100,
                 padding: '12px 16px',
                 border: '1px solid #e2e8f0',
                 borderRadius: 12,
                 fontSize: 14,
                 resize: 'none',
                 outline: 'none',
                 fontFamily: 'Montserrat Alternates, Montserrat, Arial, sans-serif',
                 fontWeight: 500,
                 backgroundColor: !canSendMessage ? '#f5f5f5' : '#fff',
                 cursor: limitInfo.isPremium ? 'text' : 'pointer'
               }}
               rows={1}
             />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
              style={{
                padding: '12px 16px',
                borderRadius: 12,
                background: (!inputText.trim() || !canSendMessage || isLoading) 
                  ? '#ccc' 
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
                border: 'none',
                cursor: (!inputText.trim() || !canSendMessage || isLoading) 
                  ? 'not-allowed' 
                  : 'pointer',
                fontSize: 14,
                fontWeight: 600
              }}
            >
              Отправить
            </button>
          </div>
        </div>
      </div>
      {showPremiumModal && (
        <PremiumModal
          onClose={() => setShowPremiumModal(false)}
          onBuy={() => {
            setShowPremiumModal(false);
            if (setShowPayment) setShowPayment(true);
          }}
        />
      )}
    </div>
  );
};

// Модальное окно для премиум-уведомления
// onBuy теперь должен быть handleUnlock из TestWeek
const PremiumModal = ({ onClose, onBuy }) => (
  <div style={{
    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
    background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit'
  }}>
    <div style={{ background: '#fff', borderRadius: 20, padding: 32, maxWidth: 370, boxShadow: '0 8px 32px rgba(102,126,234,0.18)', border: '2px solid #667eea', textAlign: 'center', position: 'relative' }}>
      <div style={{fontSize: 34, marginBottom: 6}}>💎</div>
      <h2 style={{marginBottom: 12, color: '#764ba2', fontWeight: 800, fontSize: 20}}>Премиум доступ к Диане</h2>
      <div style={{fontSize: 15, marginBottom: 16, color: '#333'}}>
        Оформи премиум и получи:<br/>
        <span style={{display:'block',margin:'8px 0'}}>
          💬 Персональные советы<br/>
          ❓ 10 вопросов в день<br/>
          🍏 Индивидуальные рекомендации
        </span>
      </div>
      <div style={{fontSize:14, marginBottom:18, color:'#764ba2', fontWeight:500}}>
        Разблокируй чат и начни свой путь к результату!
      </div>
      <div style={{display: 'flex', gap: 12, justifyContent: 'center'}}>
        <button onClick={onClose} style={{padding: '9px 18px', borderRadius: 8, background: '#eee', border: 'none', fontWeight: 500, fontSize:14, color:'#333'}}>Закрыть</button>
        <button onClick={onBuy} style={{padding: '9px 18px', borderRadius: 8, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', border: 'none', fontWeight: 700, fontSize:15}}>Купить премиум</button>
      </div>
      <div style={{position:'absolute',top:10,right:16,fontSize:20,color:'#667eea',fontWeight:700,opacity:0.7}}>✨</div>
    </div>
  </div>
);
export default DianaChat;