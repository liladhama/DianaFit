import React, { useEffect, useState } from 'react';
import { API_URL } from '../config/api';

const ADMIN_IDS = [
  '123456789', // пример Telegram ID блогера Дианы
  '987654321', // пример Telegram ID блогера Зюли
];

export default function AdminPanel() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Загружаем реальные данные из API
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`${API_URL}/api/admin/stats`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
        setError(`Ошибка загрузки данных: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  // Получаем Telegram ID пользователя
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div style={{color:'red'}}>Ошибка: {error}</div>;
  if (!stats) return null;

  return (
    <div style={{padding:32}}>
      <h2>Админ-панель блогера</h2>
      
      {/* Основная статистика */}
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        background: 'rgba(255,255,255,0.95)',
        borderRadius: 16,
        boxShadow: '0 4px 16px rgba(0,0,0,0.07)',
        marginTop: 24,
        fontSize: 17,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        overflow: 'hidden'
      }}>
        <thead>
          <tr style={{background:'#f3f4f6'}}>
            <th style={{padding:'14px 18px', textAlign:'left', color:'#6366f1', fontWeight:700}}>Основная статистика</th>
            <th style={{padding:'14px 18px', textAlign:'right', color:'#222', fontWeight:700}}>Значение</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{padding:'12px 18px', borderBottom:'1px solid #e5e7eb'}}>Всего пользователей</td>
            <td style={{padding:'12px 18px', borderBottom:'1px solid #e5e7eb', textAlign:'right'}}>{stats.totalUsers}</td>
          </tr>
          <tr>
            <td style={{padding:'12px 18px', borderBottom:'1px solid #e5e7eb'}}>Премиум пользователей</td>
            <td style={{padding:'12px 18px', borderBottom:'1px solid #e5e7eb', textAlign:'right'}}>{stats.premiumUsers}</td>
          </tr>
          <tr>
            <td style={{padding:'12px 18px', borderBottom:'1px solid #e5e7eb'}}>Мужчин</td>
            <td style={{padding:'12px 18px', borderBottom:'1px solid #e5e7eb', textAlign:'right'}}>{stats.maleCount}</td>
          </tr>
          <tr>
            <td style={{padding:'12px 18px', borderBottom:'1px solid #e5e7eb'}}>Женщин</td>
            <td style={{padding:'12px 18px', borderBottom:'1px solid #e5e7eb', textAlign:'right'}}>{stats.femaleCount}</td>
          </tr>
          <tr>
            <td style={{padding:'12px 18px', borderBottom:'1px solid #e5e7eb'}}>Пол не указан</td>
            <td style={{padding:'12px 18px', borderBottom:'1px solid #e5e7eb', textAlign:'right'}}>{stats.unknownGenderCount}</td>
          </tr>
          <tr>
            <td style={{padding:'12px 18px', borderBottom:'1px solid #e5e7eb'}}>С большим весом (90+ кг)</td>
            <td style={{padding:'12px 18px', borderBottom:'1px solid #e5e7eb', textAlign:'right'}}>{stats.highWeightCount}</td>
          </tr>
          <tr>
            <td style={{padding:'12px 18px', borderBottom:'1px solid #e5e7eb'}}>Пользователи с прогрессом</td>
            <td style={{padding:'12px 18px', borderBottom:'1px solid #e5e7eb', textAlign:'right'}}>{stats.usersWithProgress}</td>
          </tr>
        </tbody>
      </table>

      {/* Возрастные группы */}
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        background: 'rgba(255,255,255,0.95)',
        borderRadius: 16,
        boxShadow: '0 4px 16px rgba(0,0,0,0.07)',
        marginTop: 24,
        fontSize: 17,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        overflow: 'hidden'
      }}>
        <thead>
          <tr style={{background:'#f3f4f6'}}>
            <th style={{padding:'14px 18px', textAlign:'left', color:'#6366f1', fontWeight:700}}>Возрастные группы</th>
            <th style={{padding:'14px 18px', textAlign:'right', color:'#222', fontWeight:700}}>%</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(stats.ageGroupsPercent || {}).map(([ageGroup, percent]) => (
            <tr key={ageGroup}>
              <td style={{padding:'12px 18px', borderBottom:'1px solid #e5e7eb'}}>{ageGroup}</td>
              <td style={{padding:'12px 18px', borderBottom:'1px solid #e5e7eb', textAlign:'right'}}>{percent}%</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Цели похудения */}
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        background: 'rgba(255,255,255,0.95)',
        borderRadius: 16,
        boxShadow: '0 4px 16px rgba(0,0,0,0.07)',
        marginTop: 24,
        fontSize: 17,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        overflow: 'hidden'
      }}>
        <thead>
          <tr style={{background:'#f3f4f6'}}>
            <th style={{padding:'14px 18px', textAlign:'left', color:'#6366f1', fontWeight:700}}>Цели похудения</th>
            <th style={{padding:'14px 18px', textAlign:'right', color:'#222', fontWeight:700}}>Кол-во</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(stats.goalStats || {}).map(([goal, count]) => (
            <tr key={goal}>
              <td style={{padding:'12px 18px', borderBottom:'1px solid #e5e7eb'}}>{goal}</td>
              <td style={{padding:'12px 18px', borderBottom:'1px solid #e5e7eb', textAlign:'right'}}>{count}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Тренировки в неделю */}
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        background: 'rgba(255,255,255,0.95)',
        borderRadius: 16,
        boxShadow: '0 4px 16px rgba(0,0,0,0.07)',
        marginTop: 24,
        fontSize: 17,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        overflow: 'hidden'
      }}>
        <thead>
          <tr style={{background:'#f3f4f6'}}>
            <th style={{padding:'14px 18px', textAlign:'left', color:'#6366f1', fontWeight:700}}>Тренировок в неделю</th>
            <th style={{padding:'14px 18px', textAlign:'right', color:'#222', fontWeight:700}}>Кол-во</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(stats.workoutsPerWeekStats || {}).map(([workouts, count]) => (
            <tr key={workouts}>
              <td style={{padding:'12px 18px', borderBottom:'1px solid #e5e7eb'}}>{workouts}</td>
              <td style={{padding:'12px 18px', borderBottom:'1px solid #e5e7eb', textAlign:'right'}}>{count}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Выполнение заданий */}
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        background: 'rgba(255,255,255,0.95)',
        borderRadius: 16,
        boxShadow: '0 4px 16px rgba(0,0,0,0.07)',
        marginTop: 24,
        fontSize: 17,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        overflow: 'hidden'
      }}>
        <thead>
          <tr style={{background:'#f3f4f6'}}>
            <th style={{padding:'14px 18px', textAlign:'left', color:'#6366f1', fontWeight:700}}>Среднее выполнение</th>
            <th style={{padding:'14px 18px', textAlign:'right', color:'#222', fontWeight:700}}>%</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{padding:'12px 18px', borderBottom:'1px solid #e5e7eb'}}>Выполнение упражнений</td>
            <td style={{padding:'12px 18px', borderBottom:'1px solid #e5e7eb', textAlign:'right'}}>{stats.avgExerciseCompletion}%</td>
          </tr>
          <tr>
            <td style={{padding:'12px 18px', borderBottom:'1px solid #e5e7eb'}}>Следование рекомендациям по питанию</td>
            <td style={{padding:'12px 18px', borderBottom:'1px solid #e5e7eb', textAlign:'right'}}>{stats.avgNutritionCompletion}%</td>
          </tr>
          <tr>
            <td style={{padding:'12px 18px', borderBottom:'1px solid #e5e7eb'}}>Достижение 10000 шагов</td>
            <td style={{padding:'12px 18px', borderBottom:'1px solid #e5e7eb', textAlign:'right'}}>{stats.avgStepsCompletion}%</td>
          </tr>
        </tbody>
      </table>

      {/* Дополнительная статистика */}
      <div style={{display: 'flex', gap: 24, marginTop: 24}}>
        {/* Место тренировок */}
        <table style={{
          flex: 1,
          borderCollapse: 'collapse',
          background: 'rgba(255,255,255,0.95)',
          borderRadius: 16,
          boxShadow: '0 4px 16px rgba(0,0,0,0.07)',
          fontSize: 16,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          overflow: 'hidden'
        }}>
          <thead>
            <tr style={{background:'#f3f4f6'}}>
              <th style={{padding:'12px 14px', textAlign:'left', color:'#6366f1', fontWeight:700}}>Место тренировок</th>
              <th style={{padding:'12px 14px', textAlign:'right', color:'#222', fontWeight:700}}>Кол-во</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(stats.gymOrHomeStats || {}).map(([place, count]) => (
              <tr key={place}>
                <td style={{padding:'10px 14px', borderBottom:'1px solid #e5e7eb', fontSize: 15}}>{place}</td>
                <td style={{padding:'10px 14px', borderBottom:'1px solid #e5e7eb', textAlign:'right', fontSize: 15}}>{count}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Уровень подготовки */}
        <table style={{
          flex: 1,
          borderCollapse: 'collapse',
          background: 'rgba(255,255,255,0.95)',
          borderRadius: 16,
          boxShadow: '0 4px 16px rgba(0,0,0,0.07)',
          fontSize: 16,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          overflow: 'hidden'
        }}>
          <thead>
            <tr style={{background:'#f3f4f6'}}>
              <th style={{padding:'12px 14px', textAlign:'left', color:'#6366f1', fontWeight:700}}>Уровень подготовки</th>
              <th style={{padding:'12px 14px', textAlign:'right', color:'#222', fontWeight:700}}>Кол-во</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(stats.trainingLevelStats || {}).map(([level, count]) => (
              <tr key={level}>
                <td style={{padding:'10px 14px', borderBottom:'1px solid #e5e7eb', fontSize: 15}}>{level}</td>
                <td style={{padding:'10px 14px', borderBottom:'1px solid #e5e7eb', textAlign:'right', fontSize: 15}}>{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Тип питания */}
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        background: 'rgba(255,255,255,0.95)',
        borderRadius: 16,
        boxShadow: '0 4px 16px rgba(0,0,0,0.07)',
        marginTop: 24,
        fontSize: 17,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        overflow: 'hidden'
      }}>
        <thead>
          <tr style={{background:'#f3f4f6'}}>
            <th style={{padding:'14px 18px', textAlign:'left', color:'#6366f1', fontWeight:700}}>Тип питания</th>
            <th style={{padding:'14px 18px', textAlign:'right', color:'#222', fontWeight:700}}>Кол-во</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(stats.dietStats || {}).map(([diet, count]) => (
            <tr key={diet}>
              <td style={{padding:'12px 18px', borderBottom:'1px solid #e5e7eb'}}>{diet}</td>
              <td style={{padding:'12px 18px', borderBottom:'1px solid #e5e7eb', textAlign:'right'}}>{count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
