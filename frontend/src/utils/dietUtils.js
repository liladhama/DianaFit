// Утилита для получения иконки диеты
function getDietIcon(dietType) {
  // Используем реальные пути к иконкам в assets/profile
  const dietIcons = {
    'vegetarian_egg': require('../assets/profile/diet-vegetarian.png'), // Используем существующую иконку, можно создать специальную для vegetarian_egg
    'vegetarian': require('../assets/profile/diet-vegetarian.png'),
    'meat': require('../assets/profile/diet-meat.png'),
    'fish': require('../assets/profile/diet-fish.png'),
    'vegan': require('../assets/profile/diet-vegan.png')
  };
  
  return dietIcons[dietType] || dietIcons['meat']; // по умолчанию мясная
}

// Временно используем эмодзи, пока не загружены PNG файлы (УБРАНО)
/*
export function getDietIcon(dietType) {
  const dietIcons = {
    'vegetarian': '🥗', // вегетарианство
    'meat': '🥩',       // мясная
    'fish': '🐟',       // рыбная
    'vegan': '🌱'       // веганство
  };
  
  return dietIcons[dietType] || dietIcons['meat']; // по умолчанию мясная
}
*/

// Названия диет на русском (как они отображаются в профиле)
function getDietName(dietType) {
  const dietNames = {
    'vegetarian_egg': 'вегетарианскую с яйцом',
    'vegetarian': 'вегетарианскую',
    'meat': 'мясную',
    'fish': 'рыбную', 
    'vegan': 'веганскую'
  };
  
  return dietNames[dietType] || 'мясную';
}

export default {
  getDietIcon,
  getDietName
};
