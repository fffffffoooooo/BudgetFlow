const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/budget-app';

const TEST_USER = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'Test123!',
  role: 'user',
  emailPreferences: { monthlyReport: true }
};

const CATEGORIES = [
  { name: 'Salaire', type: 'income', color: '#10B981' },
  { name: 'Loyer perçu', type: 'income', color: '#22C55E' },
  { name: 'Freelance', type: 'income', color: '#16A34A' },
  { name: 'Loyer', type: 'expense', color: '#8B5CF6' },
  { name: 'Fibre Internet Orange', type: 'expense', color: '#3B82F6' },
  { name: 'Abonnement Orange Mobile', type: 'expense', color: '#F97316' },
  { name: 'Abonnement ChatGPT', type: 'expense', color: '#6366F1' },
  { name: 'Gasoil', type: 'expense', color: '#F59E0B' },
  { name: 'Courses', type: 'expense', color: '#EF4444' },
  { name: 'Café & Resto', type: 'expense', color: '#6B7280' },
  { name: 'Cadeaux', type: 'expense', color: '#EC4899' },
  { name: 'Vidange & Vignette', type: 'expense', color: '#4B5563' },
  { name: 'Loisirs', type: 'expense', color: '#14B8A6' },
  { name: 'Voyage (vol)', type: 'expense', color: '#0EA5E9' },
  { name: 'Voyage (hôtel)', type: 'expense', color: '#0F766E' },
  { name: 'Voyage (activités)', type: 'expense', color: '#7C3AED' }
];

function generateThreeYearsTransactions(userId, categoryMap) {
  const transactions = [];
  const today = new Date();
  const start = new Date(today.getFullYear() - 2, today.getMonth(), 1); // Jan 2023
  const end = new Date(today.getFullYear(), today.getMonth(), 1);       // current month

  let monthCursor = new Date(start);

  while (monthCursor <= end) {
    const y = monthCursor.getFullYear();
    const m = monthCursor.getMonth();
    const baseDate = new Date(y, m, 1);

    // Incomes
    transactions.push({
      user: userId,
      description: `Salaire mensuel`,
      amount: 12000,
      type: 'income',
      category: categoryMap['Salaire']._id,
      date: baseDate,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    transactions.push({
      user: userId,
      description: `Loyer perçu appartement`,
      amount: 2500,
      type: 'income',
      category: categoryMap['Loyer perçu']._id,
      date: baseDate,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const freelanceCount = Math.floor(Math.random() * 3); // 0 à 2 freelances
    for (let i = 0; i < freelanceCount; i++) {
      transactions.push({
        user: userId,
        description: `Mission freelance ${i + 1}`,
        amount: Math.floor(Math.random() * 1200 + 300),
        type: 'income',
        category: categoryMap['Freelance']._id,
        date: new Date(y, m, Math.floor(Math.random() * 27) + 1),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Fixed Expenses
    const fixed = [
      { name: 'Loyer', amount: 2500 },
      { name: 'Fibre Internet Orange', amount: 300 },
      { name: 'Abonnement Orange Mobile', amount: 150 },
      { name: 'Abonnement ChatGPT', amount: 20 },
      { name: 'Vidange & Vignette', amount: (m === 5 || m === 11) ? 900 : 0 }
    ];

    for (const exp of fixed) {
      if (exp.amount > 0) {
        transactions.push({
          user: userId,
          description: exp.name,
          amount: exp.amount,
          type: 'expense',
          category: categoryMap[exp.name]._id,
          date: baseDate,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    // Variable Expenses
    const variable = [
      { name: 'Gasoil', min: 600, max: 1100 },
      { name: 'Courses', min: 700, max: 1200 },
      { name: 'Café & Resto', min: 150, max: 400 },
      { name: 'Cadeaux', min: 0, max: 300 },
      { name: 'Loisirs', min: 100, max: 500 }
    ];

    for (const exp of variable) {
      const amount = Math.floor(Math.random() * (exp.max - exp.min + 1)) + exp.min;
      transactions.push({
        user: userId,
        description: exp.name,
        amount,
        type: 'expense',
        category: categoryMap[exp.name]._id,
        date: new Date(y, m, Math.floor(Math.random() * 27) + 1),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Random travel
    if (Math.random() < 0.15) { // ~2x/an
      const travelBaseDate = new Date(y, m, Math.floor(Math.random() * 25) + 1);
      transactions.push({
        user: userId,
        description: `Voyage (vol)`,
        amount: 350,
        type: 'expense',
        category: categoryMap['Voyage (vol)']._id,
        date: travelBaseDate
      });
      transactions.push({
        user: userId,
        description: `Voyage (hôtel)`,
        amount: 600,
        type: 'expense',
        category: categoryMap['Voyage (hôtel)']._id,
        date: travelBaseDate
      });
      transactions.push({
        user: userId,
        description: `Voyage (activités)`,
        amount: 400,
        type: 'expense',
        category: categoryMap['Voyage (activités)']._id,
        date: travelBaseDate
      });
    }

    monthCursor.setMonth(monthCursor.getMonth() + 1);
  }

  return transactions;
}

async function createTestData() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    await User.deleteOne({ email: TEST_USER.email });

    const user = new User(TEST_USER);
    await user.save();

    const categoryMap = {};
    for (const cat of CATEGORIES) {
      const category = new Category({ ...cat, user: user._id });
      await category.save();
      categoryMap[cat.name] = category;
    }

    const transactions = generateThreeYearsTransactions(user._id, categoryMap);
    await Transaction.insertMany(transactions);

    console.log(`✅ Données générées : ${transactions.length} transactions`);
    console.log('Email:', TEST_USER.email);
    console.log('Password:', TEST_USER.password);
  } catch (err) {
    console.error('❌ Erreur création données :', err);
  } finally {
    await mongoose.disconnect();
  }
}

createTestData();
