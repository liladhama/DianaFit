const fs = require('fs');
const path = require('path');

console.log('🎬 Проверка видеофайлов DianaFit...\n');

const videoBaseDir = path.join(__dirname, 'frontend', 'public', 'videos', 'home');

const expectedVideos = {
  'day1_cardio_circuit': [
    'dynamic_plank.mp4',
    'lying_crunches.mp4', 
    'jumping_jacks.mp4',
    'wide_stance_squats.mp4',
    'butt_kicks_jumps.mp4'
  ],
  'day2_functional_circuit': [
    'curtsy_lunges.mp4',
    'romanian_deadlift_resistance_band.mp4',
    'resistance_band_row_both_hands.mp4',
    'single_arm_resistance_band_row.mp4'
  ],
  'day3_tabata': [
    'squat_with_side_leg_raise.mp4',
    'stationary_lunges.mp4', 
    'dynamic_plank_push_up.mp4',
    'single_arm_resistance_band_row.mp4'
  ],
  'day4_hiit': [
    'shoulder_blade_squeezes.mp4',
    'squats_with_calf_raise.mp4',
    'crunches.mp4',
    'dynamic_plank.mp4'
  ],
  'day5_cardio_advanced': [
    'butt_kicks.mp4',
    'classic_squats.mp4',
    'glute_bridge.mp4',
    'plie_squats.mp4'
  ]
};

let totalVideos = 0;
let foundVideos = 0;
let missingVideos = [];

Object.entries(expectedVideos).forEach(([folderName, videos]) => {
  console.log(`📁 Проверяем папку: ${folderName}`);
  const folderPath = path.join(videoBaseDir, folderName);
  
  if (!fs.existsSync(folderPath)) {
    console.log(`   ❌ Папка не найдена: ${folderPath}`);
    return;
  }
  
  videos.forEach(videoFile => {
    totalVideos++;
    const videoPath = path.join(folderPath, videoFile);
    
    if (fs.existsSync(videoPath)) {
      const stats = fs.statSync(videoPath);
      const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`   ✅ ${videoFile} (${fileSizeMB} MB)`);
      foundVideos++;
    } else {
      console.log(`   ❌ Отсутствует: ${videoFile}`);
      missingVideos.push(`${folderName}/${videoFile}`);
    }
  });
  console.log('');
});

console.log('📊 ИТОГИ:');
console.log(`✅ Найдено видео: ${foundVideos}/${totalVideos}`);
console.log(`❌ Отсутствует видео: ${totalVideos - foundVideos}`);
console.log(`📈 Процент готовности: ${Math.round((foundVideos/totalVideos)*100)}%`);

if (missingVideos.length > 0) {
  console.log('\n📝 Отсутствующие файлы:');
  missingVideos.forEach(video => console.log(`   - ${video}`));
}

console.log('\n🔗 Для проверки в браузере откройте:');
console.log('file:///c:/Users/user/Desktop/DianaFit/frontend/test-videos.html');
