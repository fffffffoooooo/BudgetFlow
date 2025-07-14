// Script CRON Node.js pour envoyer un bilan mensuel par e-mail à chaque utilisateur
const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const { sendMail } = require('../utils/emailSender');
const Alert = require('../models/Alert');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/babos';

function formatCurrency(amount) {
  return amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
}

function percentDiff(current, previous) {
  if (!previous || previous === 0) return 'N/A';
  const diff = ((current - previous) / previous) * 100;
  return `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`;
}

async function generateMonthlyReport(user) {
  const now = new Date();
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  // Transactions du mois précédent
  const txs = await Transaction.find({
    user: user._id,
    date: { $gte: startOfMonth, $lte: endOfMonth }
  }).populate('category', 'name');
  // Transactions du mois d'avant
  const prevStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  const prevEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59, 999);
  const prevTxs = await Transaction.find({
    user: user._id,
    date: { $gte: prevStart, $lte: prevEnd }
  }).populate('category', 'name');
  const totalIncome = txs.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const totalExpense = txs.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
  const prevIncome = prevTxs.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const prevExpense = prevTxs.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
  // Par catégorie
  const catMap = {};
  txs.forEach(t => {
    if (!catMap[t.category?.name]) catMap[t.category?.name] = { expense: 0, income: 0 };
    catMap[t.category?.name][t.type] += t.amount;
  });
  const prevCatMap = {};
  prevTxs.forEach(t => {
    if (!prevCatMap[t.category?.name]) prevCatMap[t.category?.name] = { expense: 0, income: 0 };
    prevCatMap[t.category?.name][t.type] += t.amount;
  });
  let tableRows = '';
  for (const cat of Object.keys(catMap)) {
    tableRows += `<tr><td>${cat}</td><td>${formatCurrency(catMap[cat].expense)}</td><td>${formatCurrency(catMap[cat].income)}</td><td>${percentDiff(catMap[cat].expense, prevCatMap[cat]?.expense || 0)}</td></tr>`;
  }
  const html = `
    <h2>Bilan du mois de ${startOfMonth.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}</h2>
    <p>Total dépenses : <b>${formatCurrency(totalExpense)}</b> (${percentDiff(totalExpense, prevExpense)} vs mois précédent)</p>
    <p>Total revenus : <b>${formatCurrency(totalIncome)}</b> (${percentDiff(totalIncome, prevIncome)} vs mois précédent)</p>
    <h3>Détail par catégorie</h3>
    <table border="1" cellpadding="4" style="border-collapse:collapse;">
      <thead><tr><th>Catégorie</th><th>Dépenses</th><th>Revenus</th><th>Évolution</th></tr></thead>
      <tbody>${tableRows}</tbody>
    </table>
  `;
  // Vérification du plafond de revenu net
  if (user.netIncomeCeiling && (totalIncome - totalExpense) > user.netIncomeCeiling) {
    // Vérifier si une alerte existe déjà pour ce mois
    const periodKey = `${startOfMonth.toISOString()}_${endOfMonth.toISOString()}`;
    const existingCeilingAlert = await Alert.findOne({
      user: user._id,
      type: 'budget_limit',
      'metadata.alertType': 'net_income_ceiling',
      'metadata.period': periodKey
    });
    if (!existingCeilingAlert) {
      const alert = new Alert({
        user: user._id,
        type: 'budget_limit',
        message: `Votre revenu net (${(totalIncome - totalExpense).toFixed(2)} €) a dépassé le plafond fixé (${user.netIncomeCeiling} €) pour le mois de ${startOfMonth.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}`,
        metadata: {
          alertType: 'net_income_ceiling',
          period: periodKey,
          netIncome: totalIncome - totalExpense,
          ceiling: user.netIncomeCeiling
        }
      });
      await alert.save();
      // Envoi email
      const html = `<h2>Plafond de revenu net dépassé</h2><p>Votre revenu net pour le mois de ${startOfMonth.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })} est de <b>${(totalIncome - totalExpense).toFixed(2)} €</b>, ce qui dépasse le plafond que vous avez fixé (<b>${user.netIncomeCeiling} €</b>).</p>`;
      await sendMail({
        to: user.alertEmail && user.alertEmail.trim() !== '' ? user.alertEmail : user.email,
        subject: 'Alerte : Plafond de revenu net dépassé',
        html
      });
    }
  }
  return html;
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  const users = await User.find({ 'settings.notifications.monthlyReports': true });
  for (const user of users) {
    const html = await generateMonthlyReport(user);
    const to = user.alertEmail && user.alertEmail.trim() !== '' ? user.alertEmail : user.email;
    await sendMail({
      to,
      subject: 'Votre bilan mensuel BABOS',
      text: 'Consultez le bilan mensuel dans un client compatible HTML.',
      html
    });
    console.log('Bilan mensuel envoyé à', to);
  }
  await mongoose.disconnect();
}

if (require.main === module) {
  main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}
