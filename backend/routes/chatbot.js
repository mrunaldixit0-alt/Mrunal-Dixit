const express = require('express');
const router = express.Router();
const { dbAll, dbGet } = require('../db');

// English Stop Words to ignore during Keyword Scoring Search
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
  'from', 'up', 'about', 'into', 'over', 'after', 'is', 'are', 'am', 'was', 'were', 'be', 'been',
  'being', 'do', 'does', 'did', 'have', 'has', 'had', 'what', 'where', 'when', 'who', 'how',
  'why', 'can', 'could', 'would', 'should', 'which', 'will', 'your', 'my', 'i', 'you', 'he',
  'she', 'it', 'we', 'they', 'them', 'me', 'us', 'this', 'that', 'these', 'those', 'give',
  'show', 'tell', 'want', 'need', 'like', 'please', 'food', 'item', 'items', 'dish', 'dishes',
  'something', 'anything', 'some', 'any', 'good', 'best', 'recommend', 'recommendation',
  'suggest', 'suggestion', 'today', 'now', 'there', 'here', 'available', 'menu', 'get',
  'find', 'look', 'looking', 'serve', 'serving', 'order', 'ordering', 'buy', 'make', 'prepared'
]);

// Helper to pick diverse fallback customer favorites across distinct categories dynamically
function getDiverseFavorites(availableFoods, limit = 4) {
  const picked = [];
  const pickedCategoryIds = new Set();

  // First pass: pick one item per distinct category available in current menu
  for (const item of availableFoods) {
    const catId = item.category_id;
    if (catId && !pickedCategoryIds.has(catId)) {
      picked.push(item);
      pickedCategoryIds.add(catId);
    }
    if (picked.length >= limit) break;
  }

  // Second pass: if still fewer than limit, add remaining available foods
  if (picked.length < limit) {
    for (const item of availableFoods) {
      if (!picked.some(p => p.id === item.id)) {
        picked.push(item);
      }
      if (picked.length >= limit) break;
    }
  }

  return picked;
}

// Requirement-Based Intelligent Food Chatbot Engine
router.post('/suggest', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Please provide a valid text message.' });
    }

    const rawText = message.trim();
    const text = rawText.toLowerCase();

    // ==========================================
    // 0. DEDICATED STANDALONE GREETING DETECTION
    // ==========================================
    // Clean text by stripping leading/trailing non-alphanumeric punctuation (e.g., "hi!", "hello,", "hey???")
    const cleanText = text.replace(/^[^\w\s]+|[^\w\s]+$/g, '').trim();

    // Regex for greeting words including repeated letters (hi, hii, hiii, heyy, hello, helo, etc.)
    const GREETING_WORD_REGEX = /^(h+i+|h+e+y+|h+e+l+o+|h+e+l+l+o+|greetings|namaste|hola|wassup|good\s+(morning|afternoon|evening|day))(\s+(there|bot|assistant|smart\s+dine|friend|admin))?$/i;

    // Regex for food query keywords to distinguish mixed messages
    const FOOD_QUERY_REGEX = /\b(fast|fasting|upvas|upvaas|vrat|faral|farali|sabudana|rajgira|jain|onion|garlic|healthy|diet|calorie|protein|salad|light|weight|nutrition|keto|spicy|tikka|kolhapuri|schezwan|chilli|chilly|sweet|dessert|desserts|mithai|ice cream|kulfi|gulab jamun|halwa|rabdi|rasmalai|drink|drinks|beverage|beverages|juice|cooler|lassi|shake|milkshake|south indian|dosa|idli|sambar|chinese|noodle|noodles|manchurian|fried rice|starter|starters|appetizer|appetizers|main course|curry|gravy|thali|lunch|dinner|paneer|dal|breakfast|kids|children|veg|vegetarian|food|dish|dishes|menu|eat|order|item|items|recommend|recommendation|suggest|suggestion|special|resto|restaurant|birthday|party|occasion)\b/i;

    const isGreetingPattern = GREETING_WORD_REGEX.test(cleanText) ||
      /^(hi|hii|hiii|hiiii|hello|helo|helloo|hey|heyy|heyyy|hi there|hello there|hey there|good morning|good afternoon|good evening)$/i.test(cleanText);

    const hasFoodQuery = FOOD_QUERY_REGEX.test(text);

    // If it's a standalone greeting WITHOUT any food requirement:
    if (isGreetingPattern && !hasFoodQuery) {
      return res.json({
        intent: 'Greeting',
        botReply: "Hello! 👋 Welcome to Smart Dine!\nI can help you find dishes based on your requirements.\nTry asking: “I am fasting today”, “I want Jain food”, or “Suggest something for a birthday.”",
        suggestionsCount: 0,
        suggestions: [],
        suggestedPrompts: [
          "I am fasting today",
          "I want Jain food",
          "Show me healthy diet food",
          "Suggest something spicy",
          "Show sweet desserts"
        ]
      });
    }

    // Fetch all currently AVAILABLE food items from database
    const availableFoods = await dbAll(`
      SELECT f.*, c.name as category_name, c.slug as category_slug
      FROM foods f
      LEFT JOIN categories c ON f.category_id = c.id
      WHERE f.is_available = 1
    `);

    let suggestedFoods = [];
    let matchedIntent = '';
    let botReply = '';
    let suggestedPrompts = [
      "I am fasting today",
      "Show me healthy diet food",
      "I want Jain food",
      "Suggest something spicy",
      "Show sweet desserts"
    ];

    // ==========================================
    // 1. CONVERSATIONAL & FAQ INTENTS
    // ==========================================

    // Restaurant Info / Timings / Location / Delivery
    if (/\b(location|located|locate|address|timing|timings|time|hours|open|opening|close|closing|deliver|delivery|contact|phone|where|call)\b/i.test(text)) {
      matchedIntent = 'Restaurant Info';
      let info = await dbGet('SELECT * FROM restaurant_info LIMIT 1');
      const restName = info?.name || 'Smart Dine';
      const address = info?.address || '104 Gourmet Boulevard, Foodie Street, Midtown City';
      const hours = info?.opening_hours || 'Mon - Sun: 08:00 AM - 11:00 PM';
      const phone = info?.phone || '+91 98765 12345';

      botReply = `📍 ${restName} Information:\n\n• Address: ${address}\n• Hours: ${hours}\n• Call Us: ${phone}\n\nWe offer Dine-in, Takeaway & Home Delivery!`;
      suggestedFoods = [];
      return res.json({
        intent: matchedIntent,
        botReply,
        suggestionsCount: 0,
        suggestions: [],
        suggestedPrompts: ["Show menu categories", "I am fasting today", "Show me healthy diet food"]
      });
    }

    // How to Order / Payment Info
    if (/\b(how to order|order status|payment|pay|cod|cash|card|upi|checkout|cart|buy)\b/i.test(text)) {
      matchedIntent = 'Ordering Info';
      botReply = "🛒 Ordering is easy!\n1. Tap the shopping bag icon on any food item to add it to your cart.\n2. Click the Cart icon in the top header.\n3. Proceed to Checkout, enter your address, and select Cash on Delivery or UPI payment!";
      return res.json({
        intent: matchedIntent,
        botReply,
        suggestionsCount: 0,
        suggestions: [],
        suggestedPrompts: ["Show popular dishes", "I am fasting today", "Show me healthy diet food"]
      });
    }

    // Table Booking / Reservation Info
    if (/\b(book a table|table booking|reserve a table|table reservation|reservation|book table|dine in booking)\b/i.test(text)) {
      matchedIntent = 'Table Booking';
      botReply = "🍽️ Reserving a table is fast and easy!\nClick 'Book a Table' in the top navigation bar or the Customer Dashboard to select your date, time slot, and guest count. We will confirm your table reservation immediately!";
      return res.json({
        intent: matchedIntent,
        botReply,
        suggestionsCount: 0,
        suggestions: [],
        suggestedPrompts: ["Show popular dishes", "Show sweet desserts", "I am fasting today"]
      });
    }

    // Gratitude / Polite Bye
    if (/\b(thanks|thank you|thankyou|bye|goodbye|awesome|great|cool|nice)\b/i.test(text)) {
      matchedIntent = 'Gratitude';
      botReply = "You are very welcome! 😊 Enjoy your delicious meal with Smart Dine! Let me know whenever you want food recommendations.";
      return res.json({
        intent: matchedIntent,
        botReply,
        suggestionsCount: 0,
        suggestions: [],
        suggestedPrompts
      });
    }

    // ==========================================
    // 2. REQUIREMENT & DIETARY INTENT FILTERS
    // ==========================================

    // Intent: Birthday / Party / Occasion Special
    if (/\b(birthday|party|celebration|anniversary|event|gathering|feast)\b/i.test(text)) {
      matchedIntent = 'Occasion Special';
      suggestedPrompts = ["Show sweet desserts", "Show starters", "Show beverages & drinks"];
      botReply = "🎉 Celebrating a special occasion? Here are our top celebratory dishes, rich gravies, delicious starters & sweet desserts to make your event memorable:";
      suggestedFoods = availableFoods.filter(food => {
        const cat = (food.category_name || '').toLowerCase();
        const tags = (food.tags || '').toLowerCase();
        return cat.includes('desserts') || cat.includes('starters') || tags.includes('sweet') || tags.includes('spicy') || tags.includes('main course');
      }).slice(0, 6);
    }
    // Intent: Fasting / Upvas
    else if (/\b(fast|fasting|upvas|upvaas|vrat|faral|farali|sabudana|rajgira)\b/i.test(text)) {
      matchedIntent = 'Fasting';
      suggestedPrompts = ["Show me healthy diet food", "I want Jain food", "Show sweet desserts"];
      botReply = "I understand you are fasting today! Here are our fresh, pure Upvas & Vrat special dishes cooked with rock salt (Sendha Namak):";
      suggestedFoods = availableFoods.filter(food => {
        const tags = (food.tags || '').toLowerCase();
        const cat = (food.category_name || '').toLowerCase();
        const diet = (food.dietary_info || '').toLowerCase();
        return tags.includes('fasting') || tags.includes('upvas') || cat.includes('fasting') || diet.includes('vrat') || diet.includes('upvas') || diet.includes('fasting');
      });
    }
    // Intent: Jain (No Onion No Garlic)
    else if (/\b(jain|no onion|no garlic|without onion|without garlic)\b/i.test(text)) {
      matchedIntent = 'Jain';
      suggestedPrompts = ["I am fasting today", "Show me healthy diet food", "Suggest something spicy"];
      botReply = "Here are our authentic Jain dishes prepared strictly without onion, garlic, or root vegetables:";
      suggestedFoods = availableFoods.filter(food => {
        const tags = (food.tags || '').toLowerCase();
        const diet = (food.dietary_info || '').toLowerCase();
        return tags.includes('jain') || diet.includes('jain') || diet.includes('no onion') || diet.includes('no garlic');
      });
    }
    // Intent: Healthy / Diet / Low Calorie / Fitness
    else if (/\b(healthy|diet|low calorie|fitness|salad|light|weight loss|nutrition|keto|low carb|bowl)\b/i.test(text)) {
      matchedIntent = 'Healthy/Diet';
      suggestedPrompts = ["Show high protein dishes", "I want Jain food", "Show sweet desserts"];
      botReply = "Looking for wholesome & nutritious meals? Here are our health-conscious diet options packed with fresh ingredients:";
      suggestedFoods = availableFoods.filter(food => {
        const cat = (food.category_name || '').toLowerCase();
        const tags = (food.tags || '').toLowerCase();
        const diet = (food.dietary_info || '').toLowerCase();
        return cat.includes('healthy') || tags.includes('healthy') || tags.includes('diet') || tags.includes('low calorie') || diet.includes('low calorie') || diet.includes('keto') || diet.includes('vegan');
      }).sort((a, b) => {
        const aIsHealthyCat = (a.category_slug || '').includes('healthy') ? 1 : 0;
        const bIsHealthyCat = (b.category_slug || '').includes('healthy') ? 1 : 0;
        return bIsHealthyCat - aIsHealthyCat;
      });
    }
    // Intent: High Protein
    else if (/\b(protein|high protein)\b/i.test(text)) {
      matchedIntent = 'High Protein';
      suggestedPrompts = ["Show me healthy diet food", "I want Jain food", "Suggest something spicy"];
      botReply = "Power up your day! Here are our protein-rich dishes featuring paneer, tofu, legumes & sprouts:";
      suggestedFoods = availableFoods.filter(food => {
        const tags = (food.tags || '').toLowerCase();
        const diet = (food.dietary_info || '').toLowerCase();
        return tags.includes('high protein') || diet.includes('protein');
      });
    }
    // Intent: Spicy / Tandoori
    else if (/\b(spicy|tikka|fiery|kolhapuri|hot|spiced|schezwan|chilli|chilly|angara)\b/i.test(text)) {
      matchedIntent = 'Spicy';
      suggestedPrompts = ["Show sweet desserts to cool down", "Show refreshing drinks", "I want Jain food"];
      botReply = "Craving a bold kick? Here are our top spicy, flavorful items crafted to ignite your palate:";
      suggestedFoods = availableFoods.filter(food => {
        const tags = (food.tags || '').toLowerCase();
        const name = (food.name || '').toLowerCase();
        return tags.includes('spicy') || name.includes('spicy') || name.includes('tikka') || name.includes('kolhapuri') || name.includes('schezwan') || name.includes('angara');
      });
    }
    // Intent: Sweet / Desserts
    else if (/\b(sweet|dessert|desserts|mithai|ice cream|kulfi|gulab jamun|halwa|rabdi|rasmalai)\b/i.test(text)) {
      matchedIntent = 'Sweet';
      suggestedPrompts = ["Show beverages & drinks", "Show starters", "Show me healthy diet food"];
      botReply = "Treat yourself to something sweet! Here are our delicious desserts and sweet treats:";
      suggestedFoods = availableFoods.filter(food => {
        const cat = (food.category_name || '').toLowerCase();
        const tags = (food.tags || '').toLowerCase();
        const name = (food.name || '').toLowerCase();
        return cat.includes('desserts') || tags.includes('sweet') || tags.includes('dessert') || name.includes('sweet') || name.includes('jamun') || name.includes('kulfi') || name.includes('halwa') || name.includes('rabdi') || name.includes('rasmalai');
      });
    }
    // Intent: Beverages / Drinks
    else if (/\b(drink|drinks|beverage|beverages|juice|cooler|lassi|shake|milkshake|tea|coffee|cold drink)\b/i.test(text)) {
      matchedIntent = 'Beverages';
      suggestedPrompts = ["Show sweet desserts", "Suggest something spicy", "Show starters"];
      botReply = "Beat your thirst with our chilled & refreshing beverages:";
      suggestedFoods = availableFoods.filter(food => {
        const cat = (food.category_name || '').toLowerCase();
        const tags = (food.tags || '').toLowerCase();
        return cat.includes('beverages') || tags.includes('beverage');
      });
    }
    // Intent: South Indian
    else if (/\b(south indian|dosa|idli|sambar|uttapam|mysore)\b/i.test(text)) {
      matchedIntent = 'South Indian';
      suggestedPrompts = ["Show breakfast items", "I want Jain food", "Show beverages & drinks"];
      botReply = "Enjoy authentic South Indian flavors! Here are our crisp dosas & fluffy idlis:";
      suggestedFoods = availableFoods.filter(food => {
        const cat = (food.category_name || '').toLowerCase();
        const tags = (food.tags || '').toLowerCase();
        const name = (food.name || '').toLowerCase();
        return cat.includes('south indian') || tags.includes('south indian') || name.includes('dosa') || name.includes('idli');
      });
    }
    // Intent: Chinese / Indo-Chinese
    else if (/\b(chinese|manchurian|noodles|noodle|fried rice|hakka)\b/i.test(text)) {
      matchedIntent = 'Chinese';
      suggestedPrompts = ["Suggest something spicy", "Show starters", "Show beverages & drinks"];
      botReply = "Craving Indo-Chinese? Here are our popular noodles, fried rice & Manchurian dishes:";
      suggestedFoods = availableFoods.filter(food => {
        const cat = (food.category_name || '').toLowerCase();
        const tags = (food.tags || '').toLowerCase();
        const name = (food.name || '').toLowerCase();
        return cat.includes('chinese') || tags.includes('chinese') || name.includes('manchurian') || name.includes('fried rice') || name.includes('noodles');
      });
    }
    // Intent: Starters / Appetizers
    else if (/\b(starter|starters|appetizer|appetizers|tandoori|dry)\b/i.test(text)) {
      matchedIntent = 'Starters';
      suggestedPrompts = ["Suggest something spicy", "Show main course", "Show beverages & drinks"];
      botReply = "Here are our mouth-watering starters & appetizers to begin your feast:";
      suggestedFoods = availableFoods.filter(food => {
        const cat = (food.category_name || '').toLowerCase();
        const tags = (food.tags || '').toLowerCase();
        return cat.includes('starters') || tags.includes('starters');
      });
    }
    // Intent: Main Course
    else if (/\b(main course|curry|gravy|thali|lunch|dinner|paneer|dal)\b/i.test(text) && !/\b(jain|spicy)\b/i.test(text)) {
      matchedIntent = 'Main Course';
      suggestedPrompts = ["I want Jain food", "Suggest something spicy", "Show sweet desserts"];
      botReply = "Here are our signature main course curries, paneer delicacies & gravies:";
      suggestedFoods = availableFoods.filter(food => {
        const cat = (food.category_name || '').toLowerCase();
        const tags = (food.tags || '').toLowerCase();
        return cat.includes('main course') || tags.includes('main course');
      });
    }
    // Intent: Breakfast
    else if (/\b(breakfast|morning|tiffin)\b/i.test(text)) {
      matchedIntent = 'Breakfast';
      suggestedPrompts = ["I am fasting today", "Show South Indian", "Show beverages & drinks"];
      botReply = "Good morning! Here are refreshing breakfast items to kickstart your day:";
      suggestedFoods = availableFoods.filter(food => {
        const cat = (food.category_name || '').toLowerCase();
        const tags = (food.tags || '').toLowerCase();
        return cat.includes('breakfast') || tags.includes('breakfast');
      });
    }
    // Intent: Kids Friendly
    else if (/\b(kids|children|child|kid)\b/i.test(text)) {
      matchedIntent = 'Kids Friendly';
      suggestedPrompts = ["Show sweet desserts", "Show beverages & drinks", "Show South Indian"];
      botReply = "Here are mild, delicious, and fun dishes loved by children:";
      suggestedFoods = availableFoods.filter(food => {
        const tags = (food.tags || '').toLowerCase();
        return tags.includes('kids friendly');
      });
    }
    // Intent: Pure Veg
    else if (/\b(veg|vegetarian|pure veg)\b/i.test(text) && !/\b(jain|fasting)\b/i.test(text)) {
      matchedIntent = 'Pure Veg';
      suggestedPrompts = ["I am fasting today", "I want Jain food", "Show me healthy diet food"];
      botReply = "Here are our signature 100% pure vegetarian specialties:";
      suggestedFoods = availableFoods.filter(food => {
        const tags = (food.tags || '').toLowerCase();
        return tags.includes('veg');
      });
    }

    // ==========================================
    // 3. RELEVANCE SCORING KEYWORD SEARCH
    // ==========================================
    if (suggestedFoods.length === 0) {
      const cleanText = text.replace(/[^\w\s]/gi, ' ');
      const words = cleanText.split(/\s+/).filter(w => w.length > 1 && !STOP_WORDS.has(w));

      if (words.length > 0) {
        const scoredFoods = availableFoods.map(food => {
          let score = 0;
          const nameLower = (food.name || '').toLowerCase();
          const catLower = (food.category_name || '').toLowerCase();
          const tagsLower = (food.tags || '').toLowerCase();
          const dietLower = (food.dietary_info || '').toLowerCase();
          const descLower = (food.description || '').toLowerCase();
          const ingLower = (food.ingredients || '').toLowerCase();

          for (const word of words) {
            if (nameLower === word) score += 15;
            else if (nameLower.includes(word)) score += 8;

            if (catLower.includes(word)) score += 5;
            if (tagsLower.includes(word)) score += 4;
            if (dietLower.includes(word)) score += 3;
            if (descLower.includes(word)) score += 2;
            if (ingLower.includes(word)) score += 1;
          }
          return { food, score };
        });

        const matching = scoredFoods.filter(sf => sf.score > 0).sort((a, b) => b.score - a.score);
        suggestedFoods = matching.map(sf => sf.food);

        if (suggestedFoods.length > 0) {
          matchedIntent = 'Keyword Search';
          botReply = `Here are the top menu matches for "${rawText}":`;
        }
      }
    }

    // ==========================================
    // 4. FALLBACK FOR UNMATCHED DISH QUERIES
    // ==========================================
    if (suggestedFoods.length === 0) {
      matchedIntent = 'General Recommendation';
      suggestedFoods = getDiverseFavorites(availableFoods, 4);
      botReply = `I couldn't find an exact item matching "${rawText}". However, here are some of our popular customer favorites across our menu:`;
    }

    // Limit suggestions to top 6 items max for clean chat UI
    suggestedFoods = suggestedFoods.slice(0, 6);

    res.json({
      intent: matchedIntent || 'General Search',
      botReply,
      suggestionsCount: suggestedFoods.length,
      suggestions: suggestedFoods,
      suggestedPrompts
    });
  } catch (err) {
    console.error('Chatbot suggestion error:', err);
    res.status(500).json({ error: 'Failed to process food suggestion requirement.' });
  }
});

module.exports = router;
