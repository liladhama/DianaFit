import React from 'react';

const VideoTest = () => {
  const homeWorkouts = {
    day1: {
      title: "Тренировка 1: Кардио + Пресс",
      folder: "day1_cardio_circuit",
      exercises: [
        "dynamic_plank",
        "lying_crunches", 
        "jumping_jacks",
        "wide_stance_squats",
        "butt_kicks_jumps"
      ]
    },
    day2: {
      title: "Тренировка 2: Силовая с резинкой",
      folder: "day2_functional_circuit",
      exercises: [
        "curtsy_lunges",
        "romanian_deadlift_resistance_band",
        "resistance_band_row_both_hands",
        "single_arm_resistance_band_row"
      ]
    },
    day3: {
      title: "Тренировка 3: Ноги + Пресс", 
      folder: "day3_tabata",
      exercises: [
        "squat_with_side_leg_raise",
        "stationary_lunges",
        "dynamic_plank_push_up",
        "single_arm_resistance_band_row"
      ]
    },
    day4: {
      title: "Тренировка 4: Силовая + Пресс",
      folder: "day4_hiit", 
      exercises: [
        "shoulder_blade_squeezes",
        "squats_with_calf_raise",
        "crunches",
        "dynamic_plank"
      ]
    },
    day5: {
      title: "Тренировка 5: Кардио + Ноги",
      folder: "day5_cardio_advanced",
      exercises: [
        "butt_kicks",
        "classic_squats", 
        "glute_bridge",
        "plie_squats"
      ]
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🎥 Тест видео домашних тренировок</h1>
      
      {Object.entries(homeWorkouts).map(([dayKey, workout]) => (
        <div key={dayKey} style={{ marginBottom: '40px', border: '1px solid #ddd', padding: '20px', borderRadius: '10px' }}>
          <h2>{workout.title}</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {workout.exercises.map((exercise, index) => {
              const videoPath = `/videos/home/${workout.folder}/${exercise}.mp4`;
              
              return (
                <div key={exercise} style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '5px' }}>
                  <h4>{index + 1}. {exercise}</h4>
                  <video 
                    width="100%" 
                    height="200" 
                    controls
                    style={{ backgroundColor: '#f0f0f0' }}
                    onError={(e) => console.error(`Ошибка загрузки видео: ${videoPath}`, e)}
                  >
                    <source src={videoPath} type="video/mp4" />
                    Ваш браузер не поддерживает видео.
                  </video>
                  <p style={{ fontSize: '12px', color: '#666' }}>
                    Путь: {videoPath}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      
      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '10px' }}>
        <h3>📋 Статус проверки</h3>
        <p>Откройте консоль браузера (F12) чтобы увидеть ошибки загрузки видео</p>
        <p>Если видео не воспроизводится - проверьте:</p>
        <ul>
          <li>Правильность названий файлов</li>
          <li>Расположение в нужных папках</li>
          <li>Формат файлов (.mp4)</li>
        </ul>
      </div>
    </div>
  );
};

export default VideoTest;
