const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const { sendMail } = require('./emailSender');
const { format } = require('date-fns');
const { fr } = require('date-fns/locale');
const fs = require('fs');
const path = require('path');

/**
 * Generate a monthly report for a specific user
 * @param {string} userId - The user ID
 * @param {number} year - The year for the report
 * @param {number} month - The month for the report (0-11)
 * @returns {Promise<Object>} The generated report
 */
async function generateMonthlyReport(userId, year, month) {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
  
  // Get all transactions for the month
  const transactions = await Transaction.find({
    user: userId,
    date: { $gte: startDate, $lte: endDate }
  }).populate('category');

  // Calculate totals
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Group by category
  const categories = {};
  transactions.forEach(t => {
    const catName = t.category ? t.category.name : 'Non catégorisé';
    if (!categories[catName]) {
      categories[catName] = { income: 0, expenses: 0 };
    }
    if (t.type === 'income') {
      categories[catName].income += t.amount;
    } else {
      categories[catName].expenses += t.amount;
    }
  });

  // Format dates for display
  const monthName = format(startDate, 'MMMM yyyy', { locale: fr });
  
  return {
    period: monthName,
    startDate,
    endDate,
    totalIncome,
    totalExpenses,
    netIncome: totalIncome - totalExpenses,
    categories,
    transactionCount: transactions.length,
    transactions: transactions.map(t => ({
      date: format(t.date, 'dd/MM/yyyy'),
      description: t.description,
      amount: t.amount,
      type: t.type,
      category: t.category ? t.category.name : 'Non catégorisé'
    }))
  };
}

/**
 * Format the report as text for terminal display
 * @param {Object} report - The report object
 * @returns {string} Formatted text report
 */
function formatReportText(report) {
  let text = `\n=== RAPPORT MENSUEL - ${report.period.toUpperCase()} ===\n\n`;
  text += `Revenus totaux: ${report.totalIncome.toFixed(2)} €\n`;
  text += `Dépenses totales: ${report.totalExpenses.toFixed(2)} €\n`;
  text += `Solde net: ${report.netIncome.toFixed(2)} €\n\n`;
  
  text += '=== RÉPARTITION PAR CATÉGORIE ===\n';
  for (const [category, amounts] of Object.entries(report.categories)) {
    text += `\n${category}:\n`;
    if (amounts.income > 0) text += `  Revenus: ${amounts.income.toFixed(2)} €\n`;
    if (amounts.expenses > 0) text += `  Dépenses: ${amounts.expenses.toFixed(2)} €\n`;
  }
  
  text += '\n=== DERNIÈRES TRANSACTIONS ===\n';
  report.transactions.slice(-10).forEach(t => {
    const type = t.type === 'income' ? '+' : '-';
    text += `\n[${t.date}] ${t.description}: ${type}${t.amount.toFixed(2)} € (${t.category})`;
  });
  
  return text;
}

/**
 * Format the report as HTML for email
 * @param {Object} report - The report object
 * @returns {string} HTML content
 */
function formatReportHtml(report) {
  let html = `
    <h2>Rapport Mensuel - ${report.period}</h2>
    <div style="margin-bottom: 20px;">
      <p>Période: du ${format(report.startDate, 'dd/MM/yyyy')} au ${format(report.endDate, 'dd/MM/yyyy')}</p>
      <div style="background: #f0f9ff; padding: 15px; border-radius: 5px; margin: 10px 0;">
        <p><strong>Revenus totaux:</strong> ${report.totalIncome.toFixed(2)} €</p>
        <p><strong>Dépenses totales:</strong> ${report.totalExpenses.toFixed(2)} €</p>
        <p style="font-size: 1.2em;"><strong>Solde net:</strong> 
          <span style="color: ${report.netIncome >= 0 ? 'green' : 'red'};">
            ${report.netIncome.toFixed(2)} €
          </span>
        </p>
      </div>
    </div>
  `;

  // Categories section
  html += `
    <h3>Répartition par catégorie</h3>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <tr style="background: #f5f5f5;">
        <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Catégorie</th>
        <th style="text-align: right; padding: 8px; border: 1px solid #ddd;">Revenus</th>
        <th style="text-align: right; padding: 8px; border: 1px solid #ddd;">Dépenses</th>
      </tr>
  `;

  for (const [category, amounts] of Object.entries(report.categories)) {
    html += `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${category}</td>
        <td style="text-align: right; padding: 8px; border: 1px solid #ddd; color: green;">
          ${amounts.income > 0 ? `+${amounts.income.toFixed(2)} €` : '-'}
        </td>
        <td style="text-align: right; padding: 8px; border: 1px solid #ddd; color: red;">
          ${amounts.expenses > 0 ? `-${amounts.expenses.toFixed(2)} €` : '-'}
        </td>
      </tr>
    `;
  }

  html += '</table>';

  // Recent transactions
  html += `
    <h3>Dernières transactions</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <tr style="background: #f5f5f5;">
        <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Date</th>
        <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Description</th>
        <th style="text-align: right; padding: 8px; border: 1px solid #ddd;">Montant</th>
        <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Catégorie</th>
      </tr>
  `;

  report.transactions.slice(-10).forEach(t => {
    const amountColor = t.type === 'income' ? 'green' : 'red';
    const amountSign = t.type === 'income' ? '+' : '-';
    
    html += `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${t.date}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${t.description}</td>
        <td style="text-align: right; padding: 8px; border: 1px solid #ddd; color: ${amountColor};">
          ${amountSign}${t.amount.toFixed(2)} €
        </td>
        <td style="padding: 8px; border: 1px solid #ddd;">${t.category}</td>
      </tr>
    `;
  });

  html += '</table>';
  return html;
}

/**
 * Send the monthly report via email
 * @param {string} email - Recipient email
 * @param {Object} report - The report object
 * @param {string} userName - User's name for personalization
 */
async function sendMonthlyReportEmail(email, report, userName = 'Utilisateur') {
  const subject = `[TradeHub] Rapport Mensuel - ${report.period}`;
  const text = `Bonjour ${userName},\n\nVoici votre rapport mensuel pour ${report.period}.\n\n` +
    `Revenus totaux: ${report.totalIncome.toFixed(2)} €\n` +
    `Dépenses totales: ${report.totalExpenses.toFixed(2)} €\n` +
    `Solde net: ${report.netIncome.toFixed(2)} €\n\n` +
    `Connectez-vous à votre compte pour plus de détails.`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #2c3e50; color: white; padding: 20px; text-align: center; margin-bottom: 20px;">
        <h1 style="margin: 0;">TradeHub - Rapport Mensuel</h1>
      </div>
      
      <p>Bonjour ${userName},</p>
      <p>Voici votre rapport mensuel pour <strong>${report.period}</strong>.</p>
      
      ${formatReportHtml(report)}
      
      <div style="margin-top: 30px; padding: 15px; background: #f9f9f9; border-radius: 5px;">
        <p>Connectez-vous à votre compte pour plus de détails et d'analyses.</p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" 
           style="display: inline-block; padding: 10px 20px; background: #2c3e50; color: white; text-decoration: none; border-radius: 4px; margin-top: 10px;">
          Accéder à mon compte
        </a>
      </div>
      
      <p style="margin-top: 30px; font-size: 0.9em; color: #666;">
        Vous recevez cet email car vous êtes inscrit à TradeHub. Si vous ne souhaitez plus recevoir ces rapports, vous pouvez les désactiver dans les paramètres de votre compte.
      </p>
    </div>
  `;

  try {
    await sendMail(email, subject, text, html);
    console.log(`Rapport mensuel envoyé à ${email}`);
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'envoi du rapport mensuel:', error);
    return false;
  }
}

/**
 * Generate and send monthly reports to all users
 * @param {Date} date - The date for which to generate the report (defaults to previous month)
 */
async function generateAndSendMonthlyReports(date = new Date()) {
  try {
    // Get the first day of the previous month
    const reportDate = new Date(date);
    reportDate.setMonth(reportDate.getMonth() - 1);
    reportDate.setDate(1);
    
    const year = reportDate.getFullYear();
    const month = reportDate.getMonth();
    
    console.log(`Génération des rapports mensuels pour ${month + 1}/${year}...`);
    
    // In a real app, you would get all users who want to receive reports
    // For now, we'll just log that we're in development mode
    console.log('Mode développement: Aucun rapport envoyé. Implémentez la logique pour récupérer les utilisateurs.');
    
    return {
      success: true,
      message: `Rapports mensuels générés pour ${month + 1}/${year}`,
      generatedAt: new Date()
    };
  } catch (error) {
    console.error('Erreur lors de la génération des rapports mensuels:', error);
    return {
      success: false,
      error: error.message,
      generatedAt: new Date()
    };
  }
}

module.exports = {
  generateMonthlyReport,
  formatReportText,
  formatReportHtml,
  sendMonthlyReportEmail,
  generateAndSendMonthlyReports
};
