
const jwt = require('jsonwebtoken');

// Clé secrète pour les JWT (à changer en production et stocker dans .env)
const JWT_SECRET = 'your_jwt_secret_key';

module.exports = (req, res, next) => {
  try {
    // Récupérer le token du header Authorization
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Accès refusé. Aucun token fourni.' });
    }
    
    // Vérifier le token
    const decoded = jwt.verify(token, JWT_SECRET);
    // Ajouter l'ID utilisateur et le rôle à la requête
    req.user = { id: decoded.userId, role: decoded.role };
    req.userId = decoded.userId;
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
