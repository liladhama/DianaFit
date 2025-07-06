// Утилита для получения иконки диеты
function getDietIcon(dietType) {
  // Приведение к ожидаемым ключам
  if (dietType === 'vegetarian_eggs') dietType = 'vegetarian_egg';
  if (dietType === 'vegetarian_no_eggs') dietType = 'vegetarian';

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

// Названия диет на русском (как они отображаются в профиле)
function getDietName(dietType) {
  // Приведение к ожидаемым ключам
  if (dietType === 'vegetarian_eggs') dietType = 'vegetarian_egg';
  if (dietType === 'vegetarian_no_eggs') dietType = 'vegetarian';

  const dietNames = {
    'vegetarian_egg': 'вегетарианскую с яйцом',
    'vegetarian': 'вегетарианскую',
    'meat': 'мясную',
    'fish': 'рыбную', 
    'vegan': 'веганскую'
  };
  
  return dietNames[dietType] || 'мясную';
}

function getDietDisplayName(dietType) {
  if (dietType === 'vegetarian_eggs' || dietType === 'vegetarian_egg') return 'Вегетарианство с яйцом';
  if (dietType === 'vegetarian_no_eggs' || dietType === 'vegetarian') return 'Вегетарианство (без яиц)';
  if (dietType === 'meat') return 'Обычное питание (с мясом)';
  if (dietType === 'fish') return 'Пескетарианство (рыба)';
  if (dietType === 'vegan') return 'Веганство';
  return 'Обычное питание';
}

export default {
  getDietIcon,
  getDietName,
  getDietDisplayName
};
