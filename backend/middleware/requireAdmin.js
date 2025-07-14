// Middleware d'authentification et de contrôle admin pour les routes sensibles
// Utilise le même JWT que le middleware d'auth, mais vérifie aussi le rôle admin
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = 'your_jwt_secret_key'; // À mettre dans .env en prod

module.exports = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Accès refusé. Aucun token fourni.' });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;

    // Vérifier le rôle admin explicite
    const user = await User.findById(decoded.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès réservé aux administrateurs.' });
    }
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token invalide.' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expiré. Veuillez vous reconnecter.' });
    }
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
