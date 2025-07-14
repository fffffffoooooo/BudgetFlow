const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { generateMonthlyReport, sendMonthlyReportEmail } = require('../utils/monthlyReport');
const User = require('../models/User');

/**
 * @route   GET /api/reports/monthly
 * @desc    Get monthly report for the authenticated user
 * @access  Private
 */
router.get('/monthly', auth, async (req, res) => {
  try {
    const { year, month } = req.query;
    const now = new Date();
    
    // Use provided year/month or default to previous month
    const reportYear = year ? parseInt(year) : now.getFullYear();
    const reportMonth = month !== undefined ? parseInt(month) - 1 : now.getMonth() - 1;
    
    // Generate the report
    const report = await generateMonthlyReport(req.userId, reportYear, reportMonth);
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error generating monthly report:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du rapport mensuel',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/reports/send-monthly
 * @desc    Send monthly report email to the authenticated user
 * @access  Private
 */
router.post('/send-monthly', auth, async (req, res) => {
  try {
    const { year, month } = req.body;
    const now = new Date();
    
    // Use provided year/month or default to previous month
    const reportYear = year ? parseInt(year) : now.getFullYear();
    const reportMonth = month !== undefined ? parseInt(month) - 1 : now.getMonth() - 1;
    
    // Get user data
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    // Generate the report
    const report = await generateMonthlyReport(req.userId, reportYear, reportMonth);
    
    // Send the email
    const emailSent = await sendMonthlyReportEmail(
      user.email,
      report,
      user.name || 'Utilisateur'
    );
    
    if (!emailSent) {
      throw new Error('Erreur lors de l\'envoi de l\'email');
    }
    
    res.json({
      success: true,
      message: 'Rapport mensuel envoyé avec succès',
      data: {
        email: user.email,
        period: report.period
      }
    });
  } catch (error) {
    console.error('Error sending monthly report:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi du rapport mensuel',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/reports/send-all-monthly
 * @desc    Send monthly reports to all users (admin only)
 * @access  Private/Admin
 */
router.post('/send-all-monthly', auth, async (req, res) => {
  try {
    // Check if user is admin
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé. Seuls les administrateurs peuvent effectuer cette action.'
      });
    }
    
    const { year, month, testEmail } = req.body;
    const now = new Date();
    
    // Use provided year/month or default to previous month
    const reportYear = year ? parseInt(year) : now.getFullYear();
    const reportMonth = month !== undefined ? parseInt(month) - 1 : now.getMonth() - 1;
    
    // In test mode, send to a single email
    if (testEmail) {
      console.log(`Mode test: Envoi du rapport à ${testEmail}`);
      
      const testUser = await User.findOne({ email: testEmail });
      if (!testUser) {
        return res.status(404).json({
          success: false,
          message: `Aucun utilisateur trouvé avec l'email: ${testEmail}`
        });
      }
      
      const report = await generateMonthlyReport(testUser._id, reportYear, reportMonth);
      await sendMonthlyReportEmail(
        testEmail,
        report,
        testUser.name || 'Utilisateur de test'
      );
      
      return res.json({
        success: true,
        message: `Rapport de test envoyé à ${testEmail}`,
        isTest: true,
        period: report.period
      });
    }
    
    // In production, get all users who want to receive reports
    const users = await User.find({ emailPreferences: { monthlyReport: true } });
    
    if (users.length === 0) {
      return res.json({
        success: true,
        message: 'Aucun utilisateur ne souhaite recevoir de rapports mensuels',
        usersProcessed: 0
      });
    }
    
    // Process each user
    const results = [];
    for (const user of users) {
      try {
        const report = await generateMonthlyReport(user._id, reportYear, reportMonth);
        await sendMonthlyReportEmail(
          user.email,
          report,
          user.name || 'Utilisateur'
        );
        results.push({ userId: user._id, email: user.email, status: 'success' });
      } catch (error) {
        console.error(`Erreur avec l'utilisateur ${user.email}:`, error);
        results.push({
          userId: user._id,
          email: user.email,
          status: 'error',
          error: error.message
        });
      }
    }
    
    // Count successes and failures
    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    
    res.json({
      success: true,
      message: `Rapports mensuels envoyés avec succès à ${successCount} utilisateur(s). ${errorCount} échec(s).`,
      period: `${reportMonth + 1}/${reportYear}`,
      totalUsers: users.length,
      successCount,
      errorCount,
      results
    });
    
  } catch (error) {
    console.error('Error sending monthly reports to all users:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi des rapports mensuels',
      error: error.message
    });
  }
});

module.exports = router;
