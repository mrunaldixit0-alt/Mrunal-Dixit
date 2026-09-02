const bcrypt = require('bcryptjs');
const { initDatabase, dbRun, dbGet, dbAll } = require('./db');

const seedData = async () => {
  console.log('Seeding initial data for Smart Dine Restaurant System...');
  await initDatabase();

  // 1. Seed / Update Default Admin User with Pass@123
  const adminPasswordHash = await bcrypt.hash('Pass@123', 10);
  const existingAdmin = await dbGet('SELECT * FROM users WHERE email = ?', ['admin@smartdine.com']);
  if (!existingAdmin) {
    await dbRun(
      `INSERT INTO users (name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)`,
      ['Admin Manager', 'admin@smartdine.com', adminPasswordHash, '+91 98765 43210', 'admin']
    );
    console.log('Seeded Default Admin: admin@smartdine.com / Pass@123');
  } else {
    await dbRun(
      `UPDATE users SET password_hash = ?, role = 'admin' WHERE email = ?`,
      [adminPasswordHash, 'admin@smartdine.com']
    );
    console.log('Updated Default Admin password for admin@smartdine.com to Pass@123');
  }

  // 2. Seed Default Customer User
  const existingCustomer = await dbGet('SELECT * FROM users WHERE email = ?', ['customer@gmail.com']);
  let customerId;
  if (!existingCustomer) {
    const customerPasswordHash = await bcrypt.hash('customer123', 10);
    const result = await dbRun(
      `INSERT INTO users (name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)`,
      ['Rahul Sharma', 'customer@gmail.com', customerPasswordHash, '+91 91234 56789', 'customer']
    );
    customerId = result.id;
    console.log('Seeded Default Customer: customer@gmail.com / customer123');
  } else {
    customerId = existingCustomer.id;
  }

  // 3. Seed Restaurant Info
  const existingInfo = await dbGet('SELECT * FROM restaurant_info LIMIT 1');
  if (!existingInfo) {
    await dbRun(
      `INSERT INTO restaurant_info (name, description, address, phone, email, opening_hours) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        'SMART DINE RESTAURANT SYSTEM',
        'Experience fine dining with smart requirement-based food recommendations, authentic Indian & international delicacies, fresh ingredients, and lightning-fast service.',
        '104 Gourmet Boulevard, Foodie Street, Midtown City',
        '+91 98765 12345',
        'contact@smartdine.com',
        'Mon - Sun: 08:00 AM - 11:00 PM'
      ]
    );
    console.log('Seeded Restaurant Information');
  }

  // 4. Seed Categories
  const initialCategories = [
    { name: 'Breakfast', slug: 'breakfast', description: 'Fresh and energizing morning meals', sort_order: 1, image_url: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600&auto=format&fit=crop' },
    { name: 'Fasting Food', slug: 'fasting-food', description: 'Pure Upvas & Vrat special dishes cooked with rock salt', sort_order: 2, image_url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop' },
    { name: 'Starters', slug: 'starters', description: 'Crispy appetizers & tandoori delights', sort_order: 3, image_url: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=600&auto=format&fit=crop' },
    { name: 'Main Course', slug: 'main-course', description: 'Rich curries, paneer gravies & traditional specialties', sort_order: 4, image_url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&auto=format&fit=crop' },
    { name: 'Healthy Food', slug: 'healthy-food', description: 'Nutritious bowls, salads & low calorie diet meals', sort_order: 5, image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop' },
    { name: 'South Indian', slug: 'south-indian', description: 'Crispy dosas, fluffy idlis & authentic sambar', sort_order: 6, image_url: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=600&auto=format&fit=crop' },
    { name: 'Chinese', slug: 'chinese', description: 'Indo-Chinese noodles, rice & dumplings', sort_order: 7, image_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop' },
    { name: 'Desserts', slug: 'desserts', description: 'Sweet indulgences, sweets & ice creams', sort_order: 8, image_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop' },
    { name: 'Beverages', slug: 'beverages', description: 'Refreshing juices, lassis, teas & cold drinks', sort_order: 9, image_url: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&auto=format&fit=crop' }
  ];

  const categoryMap = {};
  for (const cat of initialCategories) {
    let existing = await dbGet('SELECT * FROM categories WHERE slug = ?', [cat.slug]);
    if (!existing) {
      const res = await dbRun(
        `INSERT INTO categories (name, slug, description, sort_order, image_url) VALUES (?, ?, ?, ?, ?)`,
        [cat.name, cat.slug, cat.description, cat.sort_order, cat.image_url]
      );
      categoryMap[cat.slug] = res.id;
    } else {
      categoryMap[cat.slug] = existing.id;
    }
  }

  // 5. Seed Food Items
  const existingFoods = await dbAll('SELECT COUNT(*) as count FROM foods');
  if (existingFoods[0].count === 0) {
    const foodList = [
      // Fasting Foods (Upvas)
      {
        category_slug: 'fasting-food',
        name: 'Sabudana Khichdi',
        description: 'Authentic Upvas delicacy made with soaked sago pearls, roasted peanuts, cumin, green chillies & rock salt.',
        ingredients: 'Tapioca Pearls (Sabudana), Peanuts, Potato, Cumin, Green Chilly, Sendha Namak, Ghee',
        price: 160,
        is_available: 1,
        image_url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop',
        dietary_info: 'Gluten-Free, Pure Fasting Special, Upvas Compliant',
        tags: 'Fasting,Upvas,Veg,Healthy,Kids Friendly'
      },
      {
        category_slug: 'fasting-food',
        name: 'Sabudana Vada (4 Pcs)',
        description: 'Crispy golden fried sago & potato patties served with chilled sweet curd and mint coconut chutney.',
        ingredients: 'Sabudana, Mashed Potato, Crushed Peanuts, Green Chilly, Rock Salt, Oil',
        price: 180,
        is_available: 1,
        image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop',
        dietary_info: 'Pure Vrat / Upvas special dish',
        tags: 'Fasting,Upvas,Veg,Kids Friendly'
      },
      {
        category_slug: 'fasting-food',
        name: 'Rajgira Puri & Aloo Bhaji',
        description: 'Puff amaranth flour puris served with mild cumin spiced potato curry prepared for fasts.',
        ingredients: 'Rajgira Flour, Potato, Ghee, Rock Salt, Black Pepper',
        price: 210,
        is_available: 1,
        image_url: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=600&auto=format&fit=crop',
        dietary_info: 'Gluten-Free Fasting Meal',
        tags: 'Fasting,Upvas,Veg,Healthy'
      },
      {
        category_slug: 'fasting-food',
        name: 'Farali Sweet Lassi',
        description: 'Creamy sweet yogurt drink infused with saffron, cardamom and crushed almonds.',
        ingredients: 'Fresh Curd, Sugar, Saffron, Cardamom, Almonds',
        price: 90,
        is_available: 1,
        image_url: 'https://images.unsplash.com/photo-1571006682860-0a2214643b46?w=600&auto=format&fit=crop',
        dietary_info: 'Probiotic & Energy Drink',
        tags: 'Fasting,Upvas,Veg,Sweet,Beverage'
      },

      // Jain Foods & Main Course
      {
        category_slug: 'main-course',
        name: 'Jain Paneer Butter Masala',
        description: 'Rich cottage cheese cubes cooked in a velvety tomato cashew gravy, prepared strictly without onion & garlic.',
        ingredients: 'Paneer, Fresh Tomato Puree, Cashew Paste, Butter, Cream, Spices',
        price: 320,
        is_available: 1,
        image_url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop',
        dietary_info: 'Strict No Onion No Garlic (Jain Compliant)',
        tags: 'Jain,Veg,Main Course,High Protein'
      },
      {
        category_slug: 'main-course',
        name: 'Jain Dal Makhani',
        description: 'Slow-cooked black lentils and kidney beans simmered overnight with fresh cream & butter, no onion/garlic.',
        ingredients: 'Black Urad Dal, Rajma, Tomatoes, Butter, Cream, Cinnamon',
        price: 280,
        is_available: 1,
        image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop',
        dietary_info: 'Jain Compliant Protein Rich',
        tags: 'Jain,Veg,Main Course,High Protein'
      },
      {
        category_slug: 'main-course',
        name: 'Kolhapuri Paneer Curry (Extra Spicy)',
        description: 'Fiery cottage cheese gravy infused with roasted Kolhapuri spices, dry coconut and whole red chillies.',
        ingredients: 'Paneer, Onion, Tomato, Kolhapuri Masala, Red Chilly Powder, Garlic',
        price: 340,
        is_available: 1,
        image_url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop',
        dietary_info: 'Spicy Delicacy',
        tags: 'Spicy,Veg,Main Course,High Protein'
      },
      {
        category_slug: 'main-course',
        name: 'Veg Diwani Handi',
        description: 'Assorted seasonal garden vegetables tossed in spinach & cashew green gravy.',
        ingredients: 'Carrot, Beans, Peas, Cauliflower, Spinach Puree, Cashew, Spices',
        price: 290,
        is_available: 1,
        image_url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&auto=format&fit=crop',
        dietary_info: 'Nutritious Veggie Pot',
        tags: 'Veg,Healthy,Main Course'
      },

      // Healthy & Low Calorie
      {
        category_slug: 'healthy-food',
        name: 'Avocado Protein Power Bowl',
        description: 'Fresh avocado slices, quinoa, steamed edamame, chickpea salad & toasted chia seeds with lemon tahini dressing.',
        ingredients: 'Ripe Avocado, Organic Quinoa, Chickpeas, Cucumber, Cherry Tomatoes, Tahini, Lemon',
        price: 350,
        is_available: 1,
        image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop',
        dietary_info: 'Vegan, Low Calorie (280 kcal), High Fiber & Protein',
        tags: 'Healthy,Diet,Low Calorie,High Protein,Veg'
      },
      {
        category_slug: 'healthy-food',
        name: 'Grilled Tofu & Sprouts Salad',
        description: 'Marinated herbs tofu pan-grilled with mung sprouts, bell peppers and light olive oil dressing.',
        ingredients: 'Organic Tofu, Moong Sprouts, Bell Pepper, Olive Oil, Herbs, Flaxseeds',
        price: 280,
        is_available: 1,
        image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop',
        dietary_info: 'Low Carb, Keto-Friendly, Weight Loss Special',
        tags: 'Healthy,Diet,Low Calorie,High Protein,Veg'
      },
      {
        category_slug: 'healthy-food',
        name: 'Steamed Broccoli Almond Soup',
        description: 'Soothing detox bowl of fresh green broccoli and roasted crushed almonds.',
        ingredients: 'Broccoli, Almond Milk, Crushed Almonds, Black Pepper, Garlic, Olive Oil',
        price: 190,
        is_available: 1,
        image_url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&auto=format&fit=crop',
        dietary_info: 'Low Calorie (150 kcal), Immunity Booster',
        tags: 'Healthy,Diet,Low Calorie,Veg'
      },

      // Starters & Chinese
      {
        category_slug: 'starters',
        name: 'Paneer Tikka Angara (Spicy)',
        description: 'Charcoal grilled cottage cheese marinated in hung curd, Kashmiri chilli and smoked mustard oil.',
        ingredients: 'Paneer, Hung Curd, Mustard Oil, Kashmiri Red Chilly, Garam Masala',
        price: 310,
        is_available: 1,
        image_url: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&auto=format&fit=crop',
        dietary_info: 'Tandoori Starter',
        tags: 'Spicy,Veg,High Protein,Starters'
      },
      {
        category_slug: 'chinese',
        name: 'Schezwan Veg Fried Rice (Spicy)',
        description: 'Wok-tossed basmati rice infused with fiery homemade Schezwan sauce, crunchy spring onions and capsicum.',
        ingredients: 'Basmati Rice, Schezwan Sauce, Spring Onion, Carrot, Beans, Soy Sauce',
        price: 240,
        is_available: 1,
        image_url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&auto=format&fit=crop',
        dietary_info: 'Indo-Chinese Specialty',
        tags: 'Spicy,Veg,Chinese'
      },
      {
        category_slug: 'chinese',
        name: 'Crispy Veg Manchurian Dry',
        description: 'Minced veggie dumplings tossed in garlic coriander soy sauce.',
        ingredients: 'Cabbage, Carrot, Spring Onion, Cornflour, Garlic, Soy Sauce',
        price: 230,
        is_available: 1,
        image_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop',
        dietary_info: 'Popular Appetizer',
        tags: 'Veg,Starters,Chinese,Kids Friendly'
      },

      // South Indian
      {
        category_slug: 'south-indian',
        name: 'Special Mysore Masala Dosa',
        description: 'Crispy fermented rice crepe smeared with fiery red spicy chutney & stuffed with spiced potato mash.',
        ingredients: 'Rice Batter, Potato Masala, Garlic Red Chilly Chutney, Butter, Sambar',
        price: 190,
        is_available: 1,
        image_url: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=600&auto=format&fit=crop',
        dietary_info: 'South Indian Classic',
        tags: 'Veg,Spicy,South Indian,Breakfast'
      },
      {
        category_slug: 'south-indian',
        name: 'Jain Plain Steamed Idli (2 Pcs)',
        description: 'Soft steamed rice cake served with coconut chutney & lentil sambar (No onion, no garlic).',
        ingredients: 'Rice, Urad Dal, Coconut, Sambar Spices',
        price: 120,
        is_available: 1,
        image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop',
        dietary_info: 'Easy to digest, Low Fat, Jain Suitable',
        tags: 'Jain,Veg,Healthy,Breakfast,South Indian'
      },

      // Desserts & Sweets
      {
        category_slug: 'desserts',
        name: 'Gulab Jamun with Rabdi',
        description: 'Warm fried milk solid dumplings soaked in rose sugar syrup served alongside thick saffron rabdi.',
        ingredients: 'Khoya, Milk, Sugar, Cardamom, Rose Water, Saffron Rabdi',
        price: 160,
        is_available: 1,
        image_url: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=600&auto=format&fit=crop',
        dietary_info: 'Royal Sweet Indulgence',
        tags: 'Sweet,Veg,Desserts,Kids Friendly'
      },
      {
        category_slug: 'desserts',
        name: 'Saffron Pistachio Kulfi',
        description: 'Traditional slow-reduced Indian ice cream loaded with chopped pistachios and cardamom.',
        ingredients: 'Whole Milk, Pistachio, Saffron, Sugar, Green Cardamom',
        price: 140,
        is_available: 1,
        image_url: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=600&auto=format&fit=crop',
        dietary_info: 'Cool Refreshing Sweet',
        tags: 'Sweet,Veg,Desserts,Kids Friendly'
      },

      // Beverages
      {
        category_slug: 'beverages',
        name: 'Fresh Mint Lime Cooler',
        description: 'Refreshing soda or water mocktail crafted with fresh crushed mint leaves, lime juice and black salt.',
        ingredients: 'Mint Leaves, Lemon Juice, Black Salt, Sugar Syrup, Soda',
        price: 110,
        is_available: 1,
        image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop',
        dietary_info: 'Thirst Quencher',
        tags: 'Veg,Beverage,Healthy,Low Calorie'
      },
      {
        category_slug: 'beverages',
        name: 'Mango Badam Milkshake',
        description: 'Rich thick mango shake topped with vanilla ice cream, roasted almonds & cashews.',
        ingredients: 'Alphonso Mango Pulp, Milk, Ice Cream, Almonds, Cashews',
        price: 180,
        is_available: 1,
        image_url: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&auto=format&fit=crop',
        dietary_info: 'Sweet Refreshing Shake',
        tags: 'Sweet,Veg,Beverage,Kids Friendly'
      }
    ];

    for (const food of foodList) {
      const categoryId = categoryMap[food.category_slug];
      await dbRun(
        `INSERT INTO foods (category_id, name, description, ingredients, price, is_available, image_url, dietary_info, tags)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          categoryId,
          food.name,
          food.description,
          food.ingredients,
          food.price,
          food.is_available,
          food.image_url,
          food.dietary_info,
          food.tags
        ]
      );
    }
    console.log(`Seeded ${foodList.length} initial food items across multiple categories.`);
  }

  // 6. Seed Sample Order
  const existingOrders = await dbAll('SELECT COUNT(*) as count FROM orders');
  if (existingOrders[0].count === 0 && customerId) {
    const orderRes = await dbRun(
      `INSERT INTO orders (order_number, user_id, customer_name, customer_email, total_amount, status, delivery_address, phone, payment_method, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'ORD-' + Math.floor(100000 + Math.random() * 900000),
        customerId,
        'Rahul Sharma',
        'customer@gmail.com',
        480,
        'Preparing',
        'Flat 402, Green Park Apartments, Foodie Street',
        '+91 91234 56789',
        'UPI / Online',
        'Please bring extra chutney'
      ]
    );

    const sampleFood = await dbGet("SELECT * FROM foods WHERE name = 'Sabudana Khichdi'");
    if (sampleFood) {
      await dbRun(
        `INSERT INTO order_items (order_id, food_id, food_name, quantity, price) VALUES (?, ?, ?, ?, ?)`,
        [orderRes.id, sampleFood.id, sampleFood.name, 2, sampleFood.price]
      );
    }
    console.log('Seeded sample order for demo customer.');
  }

  // 7. Sync all database tables to Firebase Cloud Firestore
  console.log('Syncing all database records to Firebase Cloud Firestore...');
  const { setDocument } = require('./firebase');
  try {
    const users = await dbAll('SELECT id, name, email, phone, role, created_at FROM users');
    const info = await dbGet('SELECT * FROM restaurant_info LIMIT 1');
    const categories = await dbAll('SELECT * FROM categories');
    const foods = await dbAll('SELECT * FROM foods');
    const orders = await dbAll('SELECT * FROM orders');

    const syncPromises = [
      ...users.map(u => setDocument('users', u.id, u)),
      info ? setDocument('restaurant_info', 'info', info) : Promise.resolve(),
      ...categories.map(cat => setDocument('categories', cat.id, cat)),
      ...foods.map(food => setDocument('foods', food.id, food)),
      ...orders.map(async ord => {
        const items = await dbAll('SELECT * FROM order_items WHERE order_id = ?', [ord.id]);
        return setDocument('orders', ord.id, { ...ord, items });
      })
    ];

    await Promise.all(syncPromises);
    console.log('Firebase Cloud Firestore synchronization complete!');
  } catch (fsErr) {
    console.warn('Firebase Firestore sync encountered a minor warning:', fsErr.message);
  }

  console.log('Database seeding complete!');
};

// Execute if run directly
if (require.main === module) {
  seedData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seeding error:', err);
      process.exit(1);
    });
}

module.exports = seedData;
