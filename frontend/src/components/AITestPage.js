import React, { useState, useRef, useEffect } from 'react';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'https://dianafit.onrender.com';

export default function AITestPage() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '👋 Привет! Я Диана, твой персональный ИИ-тренер. Задай мне любой вопрос о похудении, питании или тренировках!'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/chat-diana`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          context: messages.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n')
        })
      });

      if (!response.ok) throw new Error('Network response was not ok');
      
      const data = await response.json();
      const assistantMessage = { role: 'assistant', content: data.response };
      setMessages(prev => [...prev, assistantMessage]);
      
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = { 
        role: 'assistant', 
        content: '❌ Извините, произошла ошибка. Проверьте подключение к серверу.' 
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const testQuestions = [
    "Как похудеть за 8 недель?",
    "Какие упражнения лучше для пресса?",
    "Что есть на завтрак для похудения?",
    "Как мотивировать себя заниматься спортом?",
    "Сколько воды нужно пить в день?"
  ];

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: '#f8f9fa'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#007bff',
        color: 'white',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h1>🤖 Тест ИИ Агента Дианы</h1>
        <p>Проверка интеграции frontend ↔ backend ↔ AI</p>
        <div style={{ fontSize: '12px', marginTop: '10px' }}>
          Backend: {API_URL} | Status: 
          <span style={{ 
            color: isLoading ? '#ffc107' : '#28a745',
            marginLeft: '5px'
          }}>
            {isLoading ? '⏳ Обработка...' : '✅ Готов'}
          </span>
        </div>
      </div>

      {/* Quick test buttons */}
      <div style={{
        padding: '15px',
        backgroundColor: 'white',
        borderBottom: '1px solid #dee2e6'
      }}>
        <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>
          🚀 Быстрые тесты:
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {testQuestions.map((question, idx) => (
            <button
              key={idx}
              onClick={() => setInput(question)}
              style={{
                padding: '5px 10px',
                fontSize: '12px',
                backgroundColor: '#e9ecef',
                border: '1px solid #ced4da',
                borderRadius: '15px',
                cursor: 'pointer'
              }}
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px'
      }}>
        {messages.map((message, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '70%'
            }}
          >
            <div style={{
              padding: '12px 16px',
              borderRadius: '18px',
              backgroundColor: message.role === 'user' ? '#007bff' : '#e9ecef',
              color: message.role === 'user' ? 'white' : 'black',
              position: 'relative'
            }}>
              <div style={{
                fontSize: '11px',
                opacity: 0.7,
                marginBottom: '4px'
              }}>
                {message.role === 'user' ? '👤 Вы' : '🤖 Диана'}
              </div>
              <div style={{ whiteSpace: 'pre-wrap' }}>
                {message.content}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div style={{ alignSelf: 'flex-start', maxWidth: '70%' }}>
            <div style={{
              padding: '12px 16px',
              borderRadius: '18px',
              backgroundColor: '#e9ecef',
              color: 'black'
            }}>
              <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '4px' }}>
                🤖 Диана
              </div>
              <div>⏳ Думаю...</div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '20px',
        backgroundColor: 'white',
        borderTop: '1px solid #dee2e6'
      }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Задайте вопрос Диане..."
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '12px',
              border: '1px solid #ced4da',
              borderRadius: '8px',
              resize: 'none',
              minHeight: '50px',
              fontSize: '14px'
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            style={{
              padding: '12px 24px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: (!input.trim() || isLoading) ? 0.6 : 1,
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            {isLoading ? '⏳' : '📤'}
          </button>
        </div>
      </div>
    </div>
  );
}
