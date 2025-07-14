// Script pour créer un utilisateur admin en base MongoDB
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/budget-app';

const ADMIN_NAME = 'Admin';
const ADMIN_EMAIL = 'admin@demo.local';
const ADMIN_PASSWORD = 'Admin123!';

// Migration : on utilise désormais le champ explicite 'role' ('admin'|'user')

async function createAdmin() {
  await mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Ajout du champ isAdmin si non présent dans le modèle
  let user = await User.findOne({ email: ADMIN_EMAIL });
  if (user) {
    user.role = 'admin';
    user.password = ADMIN_PASSWORD; // Forcer le reset du mot de passe
    await user.save();
    console.log('Utilisateur admin déjà existant, privilèges mis à jour.');
  } else {
    user = new User({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: 'admin',
    });
    await user.save();
    console.log('Utilisateur admin créé avec succès.');
  }
  console.log('Email :', ADMIN_EMAIL);
  console.log('Mot de passe :', ADMIN_PASSWORD);
  mongoose.disconnect();
}

createAdmin().catch(err => {
  console.error('Erreur création admin:', err);
  mongoose.disconnect();
});
