const testUserData = {
  weight: 70,
  height: 170,
  age: 30,
  sex: 'male',
  activity: 1.375,
  goal: 4
};

console.log('=== ТЕСТ ЕДИНООБРАЗИЯ ФОРМУЛ КБЖУ ===');
console.log('Тестовые данные:', testUserData);
console.log('');

// Формула Harris-Benedict (должна быть везде)
function calculateHarrisBenedict(data) {
  const { weight, height, age, sex, activity, goal } = data;
  
  let bmr;
  if (sex === 'male') {
    bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
  } else {
    bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
  }
  
  let calories;
  let deficit = 0;
  if ([3,4,5].includes(goal)) {
    deficit = goal * 7700 / 30;
    calories = Math.round(bmr * activity - deficit);
  } else {
    calories = Math.round(bmr * activity);
  }
  
  // Минимум 1400
  calories = Math.max(1400, calories);
  
  // БЖУ
  const protein = Math.round(weight * 1.5);
  const fat = Math.round(weight * 0.9);
  const carbs = Math.round((calories - (protein * 4 + fat * 9)) / 4);
  
  return {
    bmr: Math.round(bmr),
    calories,
    protein,
    fat,
    carbs
  };
}

// Формула Mifflin-St Jeor (НЕ должна использоваться)
function calculateMifflinStJeor(data) {
  const { weight, height, age, sex, activity, goal } = data;
  
  let bmr;
  if (sex === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }
  
  let calories;
  let deficit = 0;
  if ([3,4,5].includes(goal)) {
    deficit = goal * 7700 / 30;
    calories = Math.round(bmr * activity - deficit);
  } else {
    calories = Math.round(bmr * activity);
  }
  
  calories = Math.max(1400, calories);
  
  const protein = Math.round(weight * 1.5);
  const fat = Math.round(weight * 0.9);
  const carbs = Math.round((calories - (protein * 4 + fat * 9)) / 4);
  
  return {
    bmr: Math.round(bmr),
    calories,
    protein,
    fat,
    carbs
  };
}

const harrisResult = calculateHarrisBenedict(testUserData);
const mifflinResult = calculateMifflinStJeor(testUserData);

console.log('Harris-Benedict (ПРАВИЛЬНАЯ):');
console.log('BMR:', harrisResult.bmr);
console.log('Калории:', harrisResult.calories);
console.log('Белки:', harrisResult.protein);
console.log('Жиры:', harrisResult.fat);
console.log('Углеводы:', harrisResult.carbs);
console.log('');

console.log('Mifflin-St Jeor (НЕПРАВИЛЬНАЯ):');
console.log('BMR:', mifflinResult.bmr);
console.log('Калории:', mifflinResult.calories);
console.log('Белки:', mifflinResult.protein);
console.log('Жиры:', mifflinResult.fat);
console.log('Углеводы:', mifflinResult.carbs);
console.log('');

console.log('Разница в калориях:', Math.abs(harrisResult.calories - mifflinResult.calories));
console.log('Разница в BMR:', Math.abs(harrisResult.bmr - mifflinResult.bmr));
