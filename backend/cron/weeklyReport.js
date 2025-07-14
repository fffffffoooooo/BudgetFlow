const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const Alert = require('../models/Alert');
const { sendMail } = require('../utils/emailSender');

function formatCurrency(amount) {
  return amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
}

function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Lundi
  return new Date(d.setDate(diff));
}

function getEndOfWeek(date) {
  const d = getStartOfWeek(date);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

async function generateWeeklyReport(user) {
  const now = new Date();
  const startOfWeek = getStartOfWeek(now);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = getEndOfWeek(now);
  // Transactions de la semaine
  const txs = await Transaction.find({
    user: user._id,
    date: { $gte: startOfWeek, $lte: endOfWeek }
  }).populate('category', 'name');
  // Transactions de la semaine précédente
  const prevStart = new Date(startOfWeek);
  prevStart.setDate(prevStart.getDate() - 7);
  const prevEnd = new Date(endOfWeek);
  prevEnd.setDate(prevEnd.getDate() - 7);
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
    tableRows += `<tr><td>${cat}</td><td>${formatCurrency(catMap[cat].expense)}</td><td>${formatCurrency(catMap[cat].income)}</td></tr>`;
  }
  const html = `
    <h2>Bilan de la semaine du ${startOfWeek.toLocaleDateString('fr-FR')} au ${endOfWeek.toLocaleDateString('fr-FR')}</h2>
    <p>Total dépenses : <b>${formatCurrency(totalExpense)}</b></p>
    <p>Total revenus : <b>${formatCurrency(totalIncome)}</b></p>
    <h3>Détail par catégorie</h3>
    <table border="1" cellpadding="4" style="border-collapse:collapse;">
      <thead><tr><th>Catégorie</th><th>Dépenses</th><th>Revenus</th></tr></thead>
      <tbody>${tableRows}</tbody>
    </table>
  `;
  return { html, totalIncome, totalExpense, startOfWeek, endOfWeek };
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const users = await User.find({ 'settings.notifications.monthlyReports': true }); // On peut ajouter un flag weeklyReports si besoin
  for (const user of users) {
    const { html, totalIncome, totalExpense, startOfWeek, endOfWeek } = await generateWeeklyReport(user);
    const to = user.alertEmail && user.alertEmail.trim() !== '' ? user.alertEmail : user.email;
    await sendMail({
      to,
      subject: 'Votre bilan hebdomadaire BABOS',
      text: 'Consultez le bilan hebdomadaire dans un client compatible HTML.',
      html
    });
    // Créer une alerte dans la base
    const existingAlert = await Alert.findOne({
      user: user._id,
      type: 'weekly_report',
      'metadata.startOfWeek': startOfWeek,
      'metadata.endOfWeek': endOfWeek
    });
    if (!existingAlert) {
      const alert = new Alert({
        user: user._id,
        type: 'weekly_report',
        message: `Votre bilan hebdomadaire est disponible pour la période du ${startOfWeek.toLocaleDateString('fr-FR')} au ${endOfWeek.toLocaleDateString('fr-FR')}`,
        metadata: {
          startOfWeek,
          endOfWeek,
          totalIncome,
          totalExpense
        }
      });
      await alert.save();
    }
    // Vérification du plafond de revenu net
    if (user.netIncomeCeiling && (totalIncome - totalExpense) > user.netIncomeCeiling) {
      // Vérifier si une alerte existe déjà pour cette période
      const existingCeilingAlert = await Alert.findOne({
        user: user._id,
        type: 'budget_limit',
        'metadata.alertType': 'net_income_ceiling',
        'metadata.period': `${startOfWeek.toISOString()}_${endOfWeek.toISOString()}`
      });
      if (!existingCeilingAlert) {
        const alert = new Alert({
          user: user._id,
          type: 'budget_limit',
          message: `Votre revenu net (${(totalIncome - totalExpense).toFixed(2)} €) a dépassé le plafond fixé (${user.netIncomeCeiling} €) pour la semaine du ${startOfWeek.toLocaleDateString('fr-FR')} au ${endOfWeek.toLocaleDateString('fr-FR')}`,
          metadata: {
            alertType: 'net_income_ceiling',
            period: `${startOfWeek.toISOString()}_${endOfWeek.toISOString()}`,
            netIncome: totalIncome - totalExpense,
            ceiling: user.netIncomeCeiling
          }
        });
        await alert.save();
        // Envoi email
        const html = `<h2>Plafond de revenu net dépassé</h2><p>Votre revenu net pour la semaine du ${startOfWeek.toLocaleDateString('fr-FR')} au ${endOfWeek.toLocaleDateString('fr-FR')} est de <b>${(totalIncome - totalExpense).toFixed(2)} €</b>, ce qui dépasse le plafond que vous avez fixé (<b>${user.netIncomeCeiling} €</b>).</p>`;
        await sendMail({
          to,
          subject: 'Alerte : Plafond de revenu net dépassé',
          html
        });
      }
    }
    console.log('Bilan hebdomadaire envoyé à', to);
  }
  await mongoose.disconnect();
}

if (require.main === module) {
  main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
} 