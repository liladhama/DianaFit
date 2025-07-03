/**
 * База данных рецептов с калорийностью и категориями
 * @type {Object.<string, Array>}
 */

const recipesDB = {
    breakfast: [
  // ЗАВТРАКИ
  {
    name: "Овсянка с ягодами",
    type: "Завтрак",
    calories: 320,
    protein: 10,
    fat: 5,
    carbs: 55,
    ingredients: [
      { name: "Овсяные хлопья", amount: 50, unit: "г" },
      { name: "Молоко 1%", amount: 150, unit: "мл" },
      { name: "Ягоды свежие/замороженные", amount: 100, unit: "г" },
      { name: "Мед", amount: 5, unit: "г" }
    ],
    instructions: "Смешать молоко и воду, довести до кипения, добавить хлопья, варить 5-7 минут. Подавать с ягодами.",
    tags: ["вегетарианское", "сытное", "быстро"]
  },
  {
    name: "Омлет с овощами",
    type: "Завтрак",
    calories: 300,
    protein: 18,
    fat: 20,
    carbs: 8,
    ingredients: [
      { name: "Яйца", amount: 3, unit: "шт" },
      { name: "Молоко 1%", amount: 50, unit: "мл" },
      { name: "Помидоры", amount: 1, unit: "шт" },
      { name: "Болгарский перец", amount: 0.5, unit: "шт" },
      { name: "Зелень", amount: 10, unit: "г" }
    ],
    instructions: "Взбить яйца с молоком, добавить нарезанные овощи, обжарить на сковороде с антипригарным покрытием.",
    tags: ["белковое", "сытное", "быстро"]
  },
  {
    name: "Сырники с йогуртом",
    type: "Завтрак",
    calories: 350,
    protein: 25,
    fat: 10,
    carbs: 35,
    ingredients: [
      { name: "Творог 2%", amount: 180, unit: "г" },
      { name: "Яйцо", amount: 1, unit: "шт" },
      { name: "Мука цельнозерновая", amount: 20, unit: "г" },
      { name: "Йогурт натуральный", amount: 100, unit: "г" },
      { name: "Ягоды", amount: 50, unit: "г" }
    ],
    instructions: "Смешать творог, яйцо и муку, сформировать сырники, обжарить на сковороде. Подавать с йогуртом и ягодами.",
    tags: ["белковое", "сытное", "богато кальцием"]
  },
  {
    name: "Авокадо-тост с яйцом",
    type: "Завтрак",
    calories: 330,
    protein: 15,
    fat: 20,
    carbs: 25,
    ingredients: [
      { name: "Хлеб цельнозерновой", amount: 2, unit: "кусочка" },
      { name: "Авокадо", amount: 0.5, unit: "шт" },
      { name: "Яйцо пашот", amount: 2, unit: "шт" },
      { name: "Помидоры черри", amount: 5, unit: "шт" },
      { name: "Зелень", amount: 5, unit: "г" }
    ],
    instructions: "Подсушить хлеб, размять авокадо, выложить на хлеб, сверху положить яйцо пашот, украсить помидорами и зеленью.",
    tags: ["белковое", "полезные жиры", "сытное"]
  },
  {
    name: "Протеиновый смузи",
    type: "Завтрак",
    calories: 280,
    protein: 20,
    fat: 5,
    carbs: 40,
    ingredients: [
      { name: "Банан", amount: 1, unit: "шт" },
      { name: "Ягоды", amount: 100, unit: "г" },
      { name: "Молоко 1%", amount: 200, unit: "мл" },
      { name: "Протеин", amount: 25, unit: "г" }
    ],
    instructions: "Все ингредиенты поместить в блендер и взбить до однородности.",
    tags: ["белковое", "быстро", "без готовки"]  }],
    lunch: [
    name: "Куриная грудка с гречкой",
    type: "Обед",
    calories: 450,
    protein: 35,
    fat: 12,
    carbs: 45,
    ingredients: [
      { name: "Куриная грудка", amount: 150, unit: "г" },
      { name: "Гречка", amount: 70, unit: "г" },
      { name: "Овощи для гарнира", amount: 150, unit: "г" },
      { name: "Масло оливковое", amount: 5, unit: "г" }
    ],
    instructions: "Запечь куриную грудку в духовке, отварить гречку, подавать с овощами.",
    tags: ["белковое", "сытное", "классика"]
  },
  {
    name: "Паста с индейкой и овощами",
    type: "Обед",
    calories: 480,
    protein: 30,
    fat: 10,
    carbs: 60,
    ingredients: [
      { name: "Паста цельнозерновая", amount: 70, unit: "г" },
      { name: "Филе индейки", amount: 120, unit: "г" },
      { name: "Цукини", amount: 100, unit: "г" },
      { name: "Томаты", amount: 100, unit: "г" },
      { name: "Лук", amount: 50, unit: "г" }
    ],
    instructions: "Отварить пасту, обжарить индейку с овощами, смешать, добавить специи.",
    tags: ["сытное", "диетическое", "богато клетчаткой"]
  },
  {
    name: "Суп-пюре из тыквы",
    type: "Обед",
    calories: 320,
    protein: 15,
    fat: 10,
    carbs: 45,
    ingredients: [
      { name: "Тыква", amount: 250, unit: "г" },
      { name: "Морковь", amount: 1, unit: "шт" },
      { name: "Лук", amount: 0.5, unit: "шт" },
      { name: "Куриный бульон", amount: 300, unit: "мл" },
      { name: "Сливки 10%", amount: 50, unit: "мл" },
      { name: "Тыквенные семечки", amount: 10, unit: "г" }
    ],
    instructions: "Обжарить лук и морковь, добавить тыкву и бульон, варить до готовности, взбить в блендере, добавить сливки.",
    tags: ["легкое", "теплое", "осеннее"]
  },
  {
    name: "Салат с киноа и тунцом",
    type: "Обед",
    calories: 390,
    protein: 28,
    fat: 15,
    carbs: 35,
    ingredients: [
      { name: "Киноа", amount: 50, unit: "г" },
      { name: "Тунец в собственном соку", amount: 120, unit: "г" },
      { name: "Огурец", amount: 1, unit: "шт" },
      { name: "Помидор", amount: 1, unit: "шт" },
      { name: "Болгарский перец", amount: 0.5, unit: "шт" },
      { name: "Оливковое масло", amount: 10, unit: "г" },
      { name: "Лимонный сок", amount: 5, unit: "мл" }
    ],
    instructions: "Отварить киноа, смешать с овощами и тунцом, заправить маслом и лимонным соком.",
    tags: ["белковое", "богато омега-3", "холодное"]
  },
  {
    name: "Стир-фрай из говядины с овощами",
    type: "Обед",
    calories: 420,
    protein: 35,
    fat: 20,
    carbs: 30,
    ingredients: [
      { name: "Говядина нежирная", amount: 150, unit: "г" },
      { name: "Брокколи", amount: 100, unit: "г" },
      { name: "Морковь", amount: 1, unit: "шт" },
      { name: "Болгарский перец", amount: 1, unit: "шт" },
      { name: "Соевый соус", amount: 10, unit: "мл" },
      { name: "Коричневый рис", amount: 50, unit: "г" }
    ],
    instructions: "Обжарить говядину, добавить овощи, приправить соусом, подавать с рисом.",
    tags: ["белковое", "сытное", "азиатская кухня"]
  },
  
  // ПЕРЕКУСЫ
  {
    name: "Греческий йогурт с орехами",
    type: "Перекус",
    calories: 180,
    protein: 15,
    fat: 10,
    carbs: 10,
    ingredients: [
      { name: "Греческий йогурт", amount: 150, unit: "г" },
      { name: "Орехи (миндаль, грецкие)", amount: 15, unit: "г" },
      { name: "Мед", amount: 5, unit: "г" }
    ],
    instructions: "Смешать йогурт с орехами, добавить мед по вкусу.",
    tags: ["белковое", "быстро", "без готовки"]
  },
  {
    name: "Яблоко с арахисовой пастой",
    type: "Перекус",
    calories: 200,
    protein: 5,
    fat: 10,
    carbs: 25,
    ingredients: [
      { name: "Яблоко", amount: 1, unit: "шт" },
      { name: "Арахисовая паста натуральная", amount: 15, unit: "г" }
    ],
    instructions: "Нарезать яблоко, подавать с арахисовой пастой.",
    tags: ["быстро", "без готовки", "фруктовое"]
  },
  {
    name: "Творожная запеканка с ягодами",
    type: "Перекус",
    calories: 220,
    protein: 20,
    fat: 5,
    carbs: 20,
    ingredients: [
      { name: "Творог 0-2%", amount: 150, unit: "г" },
      { name: "Яйцо", amount: 1, unit: "шт" },
      { name: "Ягоды", amount: 50, unit: "г" },
      { name: "Сахарозаменитель", amount: 5, unit: "г" }
    ],
    instructions: "Смешать творог с яйцом, добавить ягоды, запечь в духовке при 180°C 25-30 минут.",
    tags: ["белковое", "сладкое", "диетическое"]
  },
  {
    name: "Хумус с овощами",
    type: "Перекус",
    calories: 190,
    protein: 8,
    fat: 12,
    carbs: 15,
    ingredients: [
      { name: "Хумус", amount: 50, unit: "г" },
      { name: "Морковь", amount: 1, unit: "шт" },
      { name: "Огурец", amount: 1, unit: "шт" },
      { name: "Болгарский перец", amount: 0.5, unit: "шт" }
    ],
    instructions: "Нарезать овощи, подавать с хумусом.",
    tags: ["растительный белок", "без готовки", "веганское"]
  },
  {
    name: "Протеиновые шарики",
    type: "Перекус",
    calories: 150,
    protein: 10,
    fat: 8,
    carbs: 12,
    ingredients: [
      { name: "Овсяные хлопья", amount: 30, unit: "г" },
      { name: "Протеиновый порошок", amount: 15, unit: "г" },
      { name: "Арахисовая паста", amount: 10, unit: "г" },
      { name: "Мед", amount: 5, unit: "г" },
      { name: "Какао-порошок", amount: 5, unit: "г" }
    ],
    instructions: "Смешать все ингредиенты, сформировать шарики, охладить в холодильнике 30 минут.",
    tags: ["белковое", "энергетическое", "для спортсменов"]
  },
  
  // ПОЛДНИКИ
  {
    name: "Морковные палочки с йогуртовым соусом",
    type: "Полдник",
    calories: 120,
    protein: 6,
    fat: 5,
    carbs: 15,
    ingredients: [
      { name: "Морковь", amount: 2, unit: "шт" },
      { name: "Йогурт натуральный", amount: 100, unit: "г" },
      { name: "Зелень (укроп, петрушка)", amount: 5, unit: "г" },
      { name: "Чеснок", amount: 1, unit: "зубчик" }
    ],
    instructions: "Нарезать морковь палочками, смешать йогурт с измельченной зеленью и чесноком.",
    tags: ["легкое", "без готовки", "низкокалорийное"]
  },
  {
    name: "Смузи с зеленью",
    type: "Полдник",
    calories: 180,
    protein: 5,
    fat: 3,
    carbs: 30,
    ingredients: [
      { name: "Шпинат", amount: 50, unit: "г" },
      { name: "Банан", amount: 0.5, unit: "шт" },
      { name: "Киви", amount: 1, unit: "шт" },
      { name: "Молоко растительное", amount: 200, unit: "мл" }
    ],
    instructions: "Все ингредиенты поместить в блендер и взбить до однородности.",
    tags: ["витаминное", "быстро", "веганское"]
  },
  {
    name: "Цельнозерновые крекеры с творожным сыром",
    type: "Полдник",
    calories: 200,
    protein: 10,
    fat: 8,
    carbs: 22,
    ingredients: [
      { name: "Цельнозерновые крекеры", amount: 30, unit: "г" },
      { name: "Творожный сыр", amount: 50, unit: "г" },
      { name: "Огурец", amount: 0.5, unit: "шт" }
    ],
    instructions: "Намазать крекеры творожным сыром, украсить тонкими ломтиками огурца.",
    tags: ["быстро", "без готовки", "легкое"]
  },
  {
    name: "Фруктовый салат с орехами",
    type: "Полдник",
    calories: 170,
    protein: 5,
    fat: 7,
    carbs: 25,
    ingredients: [
      { name: "Яблоко", amount: 0.5, unit: "шт" },
      { name: "Груша", amount: 0.5, unit: "шт" },
      { name: "Апельсин", amount: 0.5, unit: "шт" },
      { name: "Грецкие орехи", amount: 10, unit: "г" },
      { name: "Корица", amount: 1, unit: "щепотка" }
    ],
    instructions: "Нарезать фрукты кубиками, посыпать измельченными орехами и корицей.",
    tags: ["витаминное", "без готовки", "фруктовое"]
  },
  {
    name: "Запеченное яблоко с корицей",
    type: "Полдник",
    calories: 120,
    protein: 1,
    fat: 0,
    carbs: 30,
    ingredients: [
      { name: "Яблоко", amount: 1, unit: "шт" },
      { name: "Корица", amount: 1, unit: "чайная ложка" },
      { name: "Мед", amount: 5, unit: "г" }
    ],
    instructions: "Удалить сердцевину яблока, заполнить медом и корицей, запечь в духовке при 180°C 20 минут.",
    tags: ["фруктовое", "теплое", "десерт"]
  },
  
  // УЖИНЫ
  {
    name: "Запеченная рыба с салатом",
    type: "Ужин",
    calories: 380,
    protein: 30,
    fat: 20,
    carbs: 15,
    ingredients: [
      { name: "Филе белой рыбы (треска, минтай)", amount: 150, unit: "г" },
      { name: "Салат листовой", amount: 50, unit: "г" },
      { name: "Помидоры черри", amount: 100, unit: "г" },
      { name: "Огурец", amount: 1, unit: "шт" },
      { name: "Оливковое масло", amount: 10, unit: "г" },
      { name: "Лимон", amount: 0.5, unit: "шт" }
    ],
    instructions: "Запечь рыбу с лимоном, подавать с салатом, заправленным оливковым маслом.",
    tags: ["белковое", "легкое", "рыбное"]
  },
  {
    name: "Куриный суп с овощами",
    type: "Ужин",
    calories: 300,
    protein: 25,
    fat: 10,
    carbs: 25,
    ingredients: [
      { name: "Куриное филе", amount: 100, unit: "г" },
      { name: "Морковь", amount: 1, unit: "шт" },
      { name: "Лук", amount: 0.5, unit: "шт" },
      { name: "Цельнозерновая вермишель", amount: 30, unit: "г" },
      { name: "Зелень", amount: 10, unit: "г" }
    ],
    instructions: "Сварить бульон из курицы, добавить овощи, вермишель, перед подачей посыпать зеленью.",
    tags: ["теплое", "легкое", "успокаивающее"]
  },
  {
    name: "Фриттата с овощами",
    type: "Ужин",
    calories: 350,
    protein: 25,
    fat: 22,
    carbs: 10,
    ingredients: [
      { name: "Яйца", amount: 4, unit: "шт" },
      { name: "Цукини", amount: 1, unit: "шт" },
      { name: "Болгарский перец", amount: 0.5, unit: "шт" },
      { name: "Сыр фета", amount: 30, unit: "г" },
      { name: "Зелень", amount: 5, unit: "г" }
    ],
    instructions: "Обжарить овощи, залить взбитыми яйцами, посыпать сыром, запечь в духовке до готовности.",
    tags: ["белковое", "вегетарианское", "универсальное"]
  },
  {
    name: "Тушеная индейка с кабачками",
    type: "Ужин",
    calories: 330,
    protein: 35,
    fat: 12,
    carbs: 18,
    ingredients: [
      { name: "Филе индейки", amount: 150, unit: "г" },
      { name: "Кабачок", amount: 1, unit: "шт" },
      { name: "Лук", amount: 0.5, unit: "шт" },
      { name: "Томаты", amount: 2, unit: "шт" },
      { name: "Травы прованские", amount: 1, unit: "чайная ложка" }
    ],
    instructions: "Обжарить индейку, добавить овощи, тушить 20-25 минут, добавить специи.",
    tags: ["белковое", "диетическое", "сытное"]
  },
  {
    name: "Запеченные овощи с сыром тофу",
    type: "Ужин",
    calories: 280,
    protein: 20,
    fat: 15,
    carbs: 20,
    ingredients: [
      { name: "Тофу", amount: 100, unit: "г" },
      { name: "Баклажан", amount: 0.5, unit: "шт" },
      { name: "Цукини", amount: 0.5, unit: "шт" },
      { name: "Болгарский перец", amount: 1, unit: "шт" },
      { name: "Оливковое масло", amount: 5, unit: "г" }
    ],
    instructions: "Нарезать овощи, выложить на противень с тофу, сбрызнуть маслом, запечь при 200°C 20-25 минут.",
    tags: ["веганское", "низкокалорийное", "богато клетчаткой"]
  }
];

// Экспорт базы данных
module.exports = recipesDB;
