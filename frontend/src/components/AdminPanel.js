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
    <div style={{padding:'10px 0 24px 0', maxWidth:480, margin:'0 auto', fontFamily:'system-ui, -apple-system, sans-serif'}}>
      <h2 style={{fontSize:22, textAlign:'center', marginBottom:18, color:'#6366f1', letterSpacing:1}}>Админ-панель блогера</h2>
      {/* Основная статистика */}
      <div style={{overflowX:'auto', marginBottom:18}}>
        <div style={{background:'linear-gradient(90deg,#e0e7ff 0%,#fff 100%)', borderRadius:16, boxShadow:'0 4px 16px rgba(99,102,241,0.08)', padding:'10px 0 2px 0'}}>
          <table style={{minWidth:320, width:'100%', borderCollapse:'collapse', background:'transparent', fontSize:15}}>
            <thead>
              <tr style={{background:'#f3f4f6'}}>
                <th style={{padding:'14px 18px', textAlign:'left', color:'#6366f1', fontWeight:700, fontSize:16}}>Основная статистика</th>
                <th style={{padding:'14px 18px', textAlign:'right', color:'#222', fontWeight:700, fontSize:16}}>Значение</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{padding:'12px 18px', borderBottom:'1px solid #e5e7eb'}}>Всего пользователей</td>
                <td style={{padding:'12px 18px', borderBottom:'1px solid #e5e7eb', textAlign:'right', fontWeight:600}}>{stats.totalUsers}</td>
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
        </div>
      </div>
      {/* Возрастные группы */}
      <div style={{overflowX:'auto', marginBottom:18}}>
        <div style={{background:'linear-gradient(90deg,#fdf6e3 0%,#fff 100%)', borderRadius:16, boxShadow:'0 4px 16px rgba(253,246,227,0.08)', padding:'10px 0 2px 0'}}>
          <table style={{minWidth:320, width:'100%', borderCollapse:'collapse', background:'transparent', fontSize:15}}>
            <thead>
              <tr style={{background:'#f3f4f6'}}>
                <th style={{padding:'14px 18px', textAlign:'left', color:'#eab308', fontWeight:700, fontSize:16}}>Возрастные группы</th>
                <th style={{padding:'14px 18px', textAlign:'right', color:'#222', fontWeight:700, fontSize:16}}>%</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats.ageGroupsPercent || {}).map(([ageGroup, percent]) => (
                <tr key={ageGroup}>
                  <td style={{padding:'12px 18px', borderBottom:'1px solid #f3e8ff'}}>{ageGroup}</td>
                  <td style={{padding:'12px 18px', borderBottom:'1px solid #f3e8ff', textAlign:'right', fontWeight:600}}>{percent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Цели похудения */}
      <div style={{overflowX:'auto', marginBottom:18}}>
        <div style={{background:'linear-gradient(90deg,#d1fae5 0%,#fff 100%)', borderRadius:16, boxShadow:'0 4px 16px rgba(16,185,129,0.08)', padding:'10px 0 2px 0'}}>
          <table style={{minWidth:320, width:'100%', borderCollapse:'collapse', background:'transparent', fontSize:15}}>
            <thead>
              <tr style={{background:'#f3f4f6'}}>
                <th style={{padding:'14px 18px', textAlign:'left', color:'#10b981', fontWeight:700, fontSize:16}}>Цели похудения</th>
                <th style={{padding:'14px 18px', textAlign:'right', color:'#222', fontWeight:700, fontSize:16}}>Кол-во</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats.goalStats || {}).map(([goal, count]) => (
                <tr key={goal}>
                  <td style={{padding:'12px 18px', borderBottom:'1px solid #d1fae5'}}>{goal}</td>
                  <td style={{padding:'12px 18px', borderBottom:'1px solid #d1fae5', textAlign:'right', fontWeight:600}}>{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Тренировки в неделю */}
      <div style={{overflowX:'auto', marginBottom:18}}>
        <div style={{background:'linear-gradient(90deg,#f3f4f6 0%,#fff 100%)', borderRadius:16, boxShadow:'0 4px 16px rgba(99,102,241,0.08)', padding:'10px 0 2px 0'}}>
          <table style={{minWidth:320, width:'100%', borderCollapse:'collapse', background:'transparent', fontSize:15}}>
            <thead>
              <tr style={{background:'#f3f4f6'}}>
                <th style={{padding:'14px 18px', textAlign:'left', color:'#6366f1', fontWeight:700, fontSize:16}}>Тренировок в неделю</th>
                <th style={{padding:'14px 18px', textAlign:'right', color:'#222', fontWeight:700, fontSize:16}}>Кол-во</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats.workoutsPerWeekStats || {}).map(([workouts, count]) => (
                <tr key={workouts}>
                  <td style={{padding:'12px 18px', borderBottom:'1px solid #e5e7eb'}}>{workouts}</td>
                  <td style={{padding:'12px 18px', borderBottom:'1px solid #e5e7eb', textAlign:'right', fontWeight:600}}>{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Выполнение заданий */}
      <div style={{overflowX:'auto', marginBottom:18}}>
        <div style={{background:'linear-gradient(90deg,#fef3c7 0%,#fff 100%)', borderRadius:16, boxShadow:'0 4px 16px rgba(253,224,71,0.08)', padding:'10px 0 2px 0'}}>
          <table style={{minWidth:320, width:'100%', borderCollapse:'collapse', background:'transparent', fontSize:15}}>
            <thead>
              <tr style={{background:'#f3f4f6'}}>
                <th style={{padding:'14px 18px', textAlign:'left', color:'#f59e42', fontWeight:700, fontSize:16}}>Среднее выполнение</th>
                <th style={{padding:'14px 18px', textAlign:'right', color:'#222', fontWeight:700, fontSize:16}}>%</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{padding:'12px 18px', borderBottom:'1px solid #fde68a'}}>Выполнение упражнений</td>
                <td style={{padding:'12px 18px', borderBottom:'1px solid #fde68a', textAlign:'right', fontWeight:600}}>{stats.avgExerciseCompletion}%</td>
              </tr>
              <tr>
                <td style={{padding:'12px 18px', borderBottom:'1px solid #fde68a'}}>Следование рекомендациям по питанию</td>
                <td style={{padding:'12px 18px', borderBottom:'1px solid #fde68a', textAlign:'right', fontWeight:600}}>{stats.avgNutritionCompletion}%</td>
              </tr>
              <tr>
                <td style={{padding:'12px 18px', borderBottom:'1px solid #fde68a'}}>Достижение 10000 шагов</td>
                <td style={{padding:'12px 18px', borderBottom:'1px solid #fde68a', textAlign:'right', fontWeight:600}}>{stats.avgStepsCompletion}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      {/* Дополнительная статистика */}
      <div style={{display:'flex', flexDirection:'column', gap:14, marginTop:10}}>
        <div style={{overflowX:'auto', marginBottom:8}}>
          <div style={{background:'linear-gradient(90deg,#e0e7ff 0%,#fff 100%)', borderRadius:16, boxShadow:'0 4px 16px rgba(99,102,241,0.08)', padding:'10px 0 2px 0'}}>
            <table style={{minWidth:220, width:'100%', borderCollapse:'collapse', background:'transparent', fontSize:14}}>
              <thead>
                <tr style={{background:'#f3f4f6'}}>
                  <th style={{padding:'12px 14px', textAlign:'left', color:'#6366f1', fontWeight:700}}>Место тренировок</th>
                  <th style={{padding:'12px 14px', textAlign:'right', color:'#222', fontWeight:700}}>Кол-во</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(stats.gymOrHomeStats || {}).map(([place, count]) => (
                  <tr key={place}>
                    <td style={{padding:'10px 14px', borderBottom:'1px solid #e5e7eb', fontSize:15}}>{place}</td>
                    <td style={{padding:'10px 14px', borderBottom:'1px solid #e5e7eb', textAlign:'right', fontSize:15, fontWeight:600}}>{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div style={{overflowX:'auto', marginBottom:8}}>
          <div style={{background:'linear-gradient(90deg,#fdf6e3 0%,#fff 100%)', borderRadius:16, boxShadow:'0 4px 16px rgba(253,246,227,0.08)', padding:'10px 0 2px 0'}}>
            <table style={{minWidth:220, width:'100%', borderCollapse:'collapse', background:'transparent', fontSize:14}}>
              <thead>
                <tr style={{background:'#f3f4f6'}}>
                  <th style={{padding:'12px 14px', textAlign:'left', color:'#eab308', fontWeight:700}}>Уровень подготовки</th>
                  <th style={{padding:'12px 14px', textAlign:'right', color:'#222', fontWeight:700}}>Кол-во</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(stats.trainingLevelStats || {}).map(([level, count]) => (
                  <tr key={level}>
                    <td style={{padding:'10px 14px', borderBottom:'1px solid #f3e8ff', fontSize:15}}>{level}</td>
                    <td style={{padding:'10px 14px', borderBottom:'1px solid #f3e8ff', textAlign:'right', fontSize:15, fontWeight:600}}>{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Тип питания */}
      <div style={{overflowX:'auto', marginBottom:18}}>
        <div style={{background:'linear-gradient(90deg,#dbeafe 0%,#fff 100%)', borderRadius:16, boxShadow:'0 4px 16px rgba(59,130,246,0.08)', padding:'10px 0 2px 0'}}>
          <table style={{minWidth:220, width:'100%', borderCollapse:'collapse', background:'transparent', fontSize:14}}>
            <thead>
              <tr style={{background:'#f3f4f6'}}>
                <th style={{padding:'14px 18px', textAlign:'left', color:'#3b82f6', fontWeight:700}}>Тип питания</th>
                <th style={{padding:'14px 18px', textAlign:'right', color:'#222', fontWeight:700}}>Кол-во</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats.dietStats || {}).map(([diet, count]) => (
                <tr key={diet}>
                  <td style={{padding:'12px 18px', borderBottom:'1px solid #dbeafe'}}>{diet}</td>
                  <td style={{padding:'12px 18px', borderBottom:'1px solid #dbeafe', textAlign:'right', fontWeight:600}}>{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
