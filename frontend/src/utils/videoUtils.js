// Утилита для работы с видео тренировок

/**
 * Получает маппинг упражнений и видео
 */
export const getVideoMapping = async () => {
  try {
    const response = await fetch('/videos/video-mapping.json');
    return await response.json();
  } catch (error) {
    console.error('Ошибка загрузки маппинга видео:', error);
    return null;
  }
};

/**
 * Получает английское название упражнения по русскому
 */
export const getEnglishExerciseName = (russianName, videoMapping) => {
  if (!videoMapping) return null;
  
  // Поиск по всем категориям (gym, home)
  for (const location of Object.keys(videoMapping)) {
    for (const day of Object.keys(videoMapping[location])) {
      const exercises = videoMapping[location][day].exercises;
      
      // Здесь нужна более сложная логика сопоставления
      // Пока возвращаем первое найденное упражнение как заглушку
      if (exercises && exercises.length > 0) {
        return exercises[0];
      }
    }
  }
  
  return null;
};

/**
 * Генерирует путь к видео для упражнения
 */
export const getVideoPath = (location, dayId, exerciseName) => {
  return `/videos/${location}/${dayId}/${exerciseName}.mp4`;
};

/**
 * Определяет тип тренировки (gym/home) по описанию
 */
export const getWorkoutLocation = (workoutDescription) => {
  if (!workoutDescription) return 'home';
  
  const gymKeywords = ['смит', 'гравитрон', 'тренажёр', 'кроссовер', 'блин'];
  const description = workoutDescription.toLowerCase();
  
  return gymKeywords.some(keyword => description.includes(keyword)) ? 'gym' : 'home';
};

/**
 * Определяет день тренировки по названию
 */
export const getDayId = (workoutTitle, location) => {
  if (!workoutTitle) return null;
  
  const title = workoutTitle.toLowerCase();
  
  if (location === 'gym') {
    if (title.includes('ягодиц') && title.includes('бицепс бедра')) return 'day1_glutes_hamstrings';
    if (title.includes('плеч') && title.includes('трицепс')) return 'day2_shoulders_triceps_abs';
    if (title.includes('спин') && title.includes('бицепс')) return 'day3_back_biceps';
    if (title.includes('ягодиц') && title.includes('квадрицепс')) return 'day4_glutes_quads_calves';
  }
  
  if (location === 'home') {
    if (title.includes('к (вт)') || title.includes('кардио') && title.includes('круг')) return 'day1_cardio_circuit';
    if (title.includes('ф (нп)') || title.includes('функциональн')) return 'day2_functional_circuit';
    if (title.includes('t ') || title.includes('табата')) return 'day3_tabata';
    if (title.includes('hiit') || title.includes('хиит')) return 'day4_hiit';
    if (title.includes('к (нп)') && title.includes('бег на месте')) return 'day5_cardio_advanced';
  }
  
  return null;
};

/**
 * Маппинг русских названий упражнений на английские
 */
export const exerciseNameMapping = {
  // Зал - День 1
  'ягодичный мост в смите': 'glute_bridge_smith_machine',
  'мах ногой назад в кроссовере': 'cable_kickback',
  'гуд морнинг': 'good_morning',
  'отведения ног на тренажёре сидя': 'seated_leg_abduction_dropset',
  'сведения ног сидя': 'seated_leg_adduction',
  
  // Зал - День 2
  'жим арнольда': 'arnold_press_dropset',
  'тяга в нижнем кроссовере к подбородку': 'cable_upright_row_lateral_raise_superset',
  'тяга горизонтальная к груди в кроссовере': 'horizontal_cable_chest_pull',
  'отведения рук с гантелями': 'dumbbell_lateral_raises_dropset',
  'разгибания рук лёжа с блином': 'lying_tricep_extension_plate',
  'молитва': 'prayer_exercise',
  
  // Зал - День 3
  'подтягивания в гравитроне': 'assisted_pullups_wide_grip',
  'горизонтальная тяга': 'horizontal_row',
  'тяга гантели в наклоне': 'single_arm_dumbbell_row',
  'вертикальная тяга': 'vertical_pulldown',
  'сгибание рук с гантелями': 'reverse_grip_dumbbell_curls',
  'подъёмы ног в висе': 'hanging_leg_raises',
  
  // Зал - День 4
  'разгибание ног сидя': 'seated_leg_extension_dropset',
  'выпады в смите': 'smith_machine_lunges',
  'фронтальный присед': 'front_squat',
  'мах ногой в сторону в кроссовере': 'cable_side_leg_raise',
  'ягодичная гиперэкстензия': 'seated_leg_abduction_glute_hyperextension_superset',
  'икры в тренажёре сидя': 'seated_calf_raises',
  
  // Дом - День 1
  'приседания с шагами': 'squats_with_steps_forward_backward',
  'обратная планка': 'reverse_plank_knee_raise',
  'берёзка': 'shoulder_stand',
  'ленивые берпи': 'lazy_burpees_with_squat',
  'скрестные выпады': 'cross_lunges',
  
  // Дом - День 2
  'приседания с захлёстом': 'squats_with_leg_curl_back',
  'планка с махом ноги назад': 'plank_leg_kickback',
  'прыжок в планку': 'squat_jump_to_plank',
  'лодочка с подъёмом ног': 'boat_pose_leg_raises',
  'бег с захлёстом': 'high_knees_running',
  'защёгивания на платформу': 'step_ups_with_leg_swing',
  
  // Дом - День 3
  'прыгающий джек': 'jumping_jacks',
  'присед + выпад назад': 'squat_reverse_lunge_combo',
  'книжка сидя': 'seated_book_crunches',
  'планка с подъёмом на руки': 'plank_up_down_shoulder_tap',
  'выпад в сторону + мах': 'side_lunge_leg_raise',
  'уголок с касанием носков': 'diagonal_toe_touch_corner',
  'подъёмы с колен + прыжок': 'knee_to_stand_jump',
  
  // Дом - День 4
  'выход в планку': 'stand_to_plank_walkout',
  'скручивания лёжа': 'lying_crunches',
  'присед + гудмонинг': 'squat_good_morning_combo',
  'прыжки стоя в планке': 'plank_jumping_jacks',
  'отжимание + мах ногой': 'pushup_leg_kickback',
  'подъёмы на носки в сумо': 'sumo_squat_calf_raises',
  
  // Дом - День 5
  'выпад + подъём колена': 'lunge_knee_raise_combo',
  'планка': 'plank_hold',
  'ягодичный мостик на 1 ноге': 'single_leg_glute_bridge',
  'скручивания в пол-амплитуды': 'half_amplitude_crunches',
  'лодочка со сведением лопаток': 'boat_pose_shoulder_blade_squeeze',
  'присед + прыжок на платформу': 'squat_box_jump'
};

/**
 * Получает английское название упражнения по русскому названию
 */
export const getExerciseEnglishName = (russianName) => {
  const cleanName = russianName.toLowerCase().trim();
  
  // Точное совпадение
  if (exerciseNameMapping[cleanName]) {
    return exerciseNameMapping[cleanName];
  }
  
  // Поиск по частичному совпадению
  for (const [russian, english] of Object.entries(exerciseNameMapping)) {
    if (cleanName.includes(russian) || russian.includes(cleanName)) {
      return english;
    }
  }
  
  // Если не найдено, возвращаем безопасное имя файла
  return cleanName
    .replace(/[^a-zа-я0-9\s]/gi, '')
    .replace(/\s+/g, '_')
    .replace(/[а-я]/g, char => {
      const map = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
        'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
        'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
        'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
        'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
      };
      return map[char] || char;
    });
};
