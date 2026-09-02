const express = require('express');
const router = express.Router();
const { dbAll } = require('../db');

// Keyword Mapping & Tag Parser Engine
router.post('/suggest', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Please provide a valid text message.' });
    }

    const text = message.toLowerCase().trim();

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
    let detectedTags = [];

    // Intent 1: Fasting / Upvas
    if (/\b(fast|fasting|upvas|upvaas|vrat|sabudana)\b/i.test(text)) {
      matchedIntent = 'Fasting';
      detectedTags = ['Fasting', 'Upvas'];
      botReply = "I understand you are fasting today! Here are our fresh, pure Upvas & Vrat special dishes cooked with rock salt (Sendha Namak):";
    }
    // Intent 2: Jain
    else if (/\b(jain|no onion|no garlic|without onion|without garlic)\b/i.test(text)) {
      matchedIntent = 'Jain';
      detectedTags = ['Jain'];
      botReply = "Here are our authentic Jain dishes prepared strictly without onion, garlic, or root vegetables:";
    }
    // Intent 3: Healthy / Diet / Low Calorie / Protein
    else if (/\b(healthy|diet|low calorie|protein|high protein|fitness|salad|light|weight loss|nutrition)\b/i.test(text)) {
      matchedIntent = 'Healthy/Diet';
      detectedTags = ['Healthy', 'Diet', 'Low Calorie', 'High Protein'];
      botReply = "Looking for wholesome & nutritious meals? Here are our health-conscious diet options packed with fresh ingredients:";
    }
    // Intent 4: Spicy
    else if (/\b(spicy|tikka|fiery|kolhapuri|hot|spiced|schezwan|chilli|chilly)\b/i.test(text)) {
      matchedIntent = 'Spicy';
      detectedTags = ['Spicy'];
      botReply = "Craving a bold kick? Here are our top spicy, flavorful items crafted to ignite your palate:";
    }
    // Intent 5: Sweet / Dessert
    else if (/\b(sweet|dessert|mithai|ice cream|kulfi|gulab jamun|shake)\b/i.test(text)) {
      matchedIntent = 'Sweet';
      detectedTags = ['Sweet', 'Desserts'];
      botReply = "Treat yourself to something sweet! Here are our delicious desserts and sweet drinks:";
    }
    // Intent 6: Kids Friendly
    else if (/\b(kids|children|child|kid)\b/i.test(text)) {
      matchedIntent = 'Kids Friendly';
      detectedTags = ['Kids Friendly'];
      botReply = "Here are mild, delicious, and fun dishes loved by children:";
    }
    // Intent 7: Breakfast
    else if (/\b(breakfast|morning|tiffin|idli|dosa)\b/i.test(text)) {
      matchedIntent = 'Breakfast';
      detectedTags = ['Breakfast'];
      botReply = "Good morning! Here are crisp & refreshing breakfast items to kickstart your day:";
    }
    // Intent 8: Beverages / Drinks
    else if (/\b(drink|beverage|juice|cooler|lassi|shake)\b/i.test(text)) {
      matchedIntent = 'Beverages';
      detectedTags = ['Beverage'];
      botReply = "Beat your thirst with our chilled & refreshing beverages:";
    }
    // Intent 9: Veg / General
    else if (/\b(veg|vegetarian|pure veg)\b/i.test(text)) {
      matchedIntent = 'Veg';
      detectedTags = ['Veg'];
      botReply = "Here are our signature 100% pure vegetarian specialties:";
    }

    // Filter available foods based on detectedTags or general keyword match
    if (detectedTags.length > 0) {
      suggestedFoods = availableFoods.filter(food => {
        const foodTags = (food.tags || '').split(',').map(t => t.trim().toLowerCase());
        const foodCategory = (food.category_name || '').toLowerCase();
        const foodDiet = (food.dietary_info || '').toLowerCase();

        return detectedTags.some(tag => {
          const lowerTag = tag.toLowerCase();
          return foodTags.includes(lowerTag) || foodCategory.includes(lowerTag) || foodDiet.includes(lowerTag);
        });
      });
    }

    // Fallback: search food name, description, ingredients, tags for words in text
    if (suggestedFoods.length === 0) {
      const words = text.split(/\s+/).filter(w => w.length > 2);
      suggestedFoods = availableFoods.filter(food => {
        const fullContent = `${food.name} ${food.description} ${food.ingredients} ${food.tags} ${food.category_name} ${food.dietary_info}`.toLowerCase();
        return words.some(word => fullContent.includes(word));
      });

      if (suggestedFoods.length > 0) {
        botReply = `Here are suitable dishes from our menu matching "${message}":`;
      } else {
        // Fallback to top recommended / popular available items
        suggestedFoods = availableFoods.slice(0, 4);
        botReply = `I couldn't find an exact match for "${message}". However, here are some of our popular customer favorites you might love:`;
      }
    }

    // Limit suggestions to top 6 items max for clean chat UI
    suggestedFoods = suggestedFoods.slice(0, 6);

    res.json({
      intent: matchedIntent || 'General Search',
      botReply,
      suggestionsCount: suggestedFoods.length,
      suggestions: suggestedFoods,
      suggestedPrompts: [
        "I am fasting today",
        "Show me healthy diet food",
        "I want Jain food",
        "Suggest something spicy",
        "Show sweet desserts"
      ]
    });
  } catch (err) {
    console.error('Chatbot suggestion error:', err);
    res.status(500).json({ error: 'Failed to process food suggestion requirement.' });
  }
});

module.exports = router;
