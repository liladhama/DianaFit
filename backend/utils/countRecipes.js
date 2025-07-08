import { recipesDB } from './recipesDB.js';

let total = 0;
for (const key of Object.keys(recipesDB)) {
  if (Array.isArray(recipesDB[key])) {
    total += recipesDB[key].length;
  }
}
console.log('Всего рецептов:', total);
