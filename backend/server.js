const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

const { initDatabase } = require('./db');
const seedData = require('./seed');

// Import routes
const authRoutes = require('./routes/auth');
const categoriesRoutes = require('./routes/categories');
const foodsRoutes = require('./routes/foods');
const ordersRoutes = require('./routes/orders');
const restaurantRoutes = require('./routes/restaurant');
const usersRoutes = require('./routes/users');
const chatbotRoutes = require('./routes/chatbot');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS & JSON parsing
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads folder exists and serve statically
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/foods', foodsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/restaurant', restaurantRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/chatbot', chatbotRoutes);

// Base route test
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', app: 'SMART DINE RESTAURANT SYSTEM', timestamp: new Date() });
});

// Serve compiled React frontend
const frontendDist = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.use((req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendDist, 'index.html'));
    } else {
      res.status(404).json({ error: 'API route not found' });
    }
  });
}

// Initialize database and seed, then start server
initDatabase().then(async () => {
  await seedData();
  app.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(`SMART DINE RESTAURANT SYSTEM - Server Running!`);
    console.log(`Application URL: http://localhost:${PORT}`);
    console.log(`=================================================`);
  });
}).catch((err) => {
  console.error('Failed to start server:', err);
});
