// emailTemplates.js
// Fonctions pour générer des emails HTML élégants et responsives pour BudgetFlow

function baseTemplate({ title, content, critical = false }) {
  // Logo BudgetFlow SVG (remplaçable par une URL d'image si besoin)
  const logo = `<svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle;"><circle cx="18" cy="18" r="18" fill="#2b7cff"/><path d="M11 24V12a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H12a1 1 0 0 1-1-1zm2-1h10V13H13v10zm2-6h6v2h-6v-2z" fill="#fff"/></svg>`;
  return `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f6f8fa; padding: 0; margin: 0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 30px auto; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.10);">
      <tr style="background: #2b7cff; color: #fff;">
        <td style="padding: 18px 32px; font-size: 2rem; font-weight: bold; letter-spacing: 1px;">
          <span style="vertical-align: middle;">${logo} <span style="font-size:1.2rem; margin-left:12px; vertical-align:middle;">BudgetFlow</span></span>
        </td>
      </tr>
      <tr>
        <td style="padding: 24px 32px;">
          <h2 style="margin-top: 0; color: ${critical ? '#e53935' : '#2b7cff'};">${title}</h2>
          ${content}
        </td>
      </tr>
      <tr>
        <td style="background: #f6f8fa; color: #888; font-size: 0.95rem; padding: 16px 32px; text-align: center;">
          Accédez à votre tableau de bord : <a href="https://budgetflow.app" style="color:#2b7cff;">https://budgetflow.app</a><br/>
          <span style="font-size:0.8em;">Cet email est envoyé automatiquement par BudgetFlow – ne pas répondre.</span>
        </td>
      </tr>
    </table>
  </div>
  `;
}

function transactionTable({ amount, type, category, date, description, icon }) {
  return `
    <table cellpadding="0" cellspacing="0" width="100%" style="background:#f9fbfc; border-radius:6px; margin-bottom:16px;">
      <tr>
        <td style="padding:10px 0; font-size:1.3em; text-align:center;">${icon || ''}</td>
        <td style="padding:10px; font-weight:bold;">Montant</td>
        <td style="padding:10px;">${amount}</td>
      </tr>
      <tr>
        <td></td>
        <td style="padding:10px; font-weight:bold;">Type</td>
        <td style="padding:10px;">${type}</td>
      </tr>
      <tr>
        <td></td>
        <td style="padding:10px; font-weight:bold;">Catégorie</td>
        <td style="padding:10px;">${category}</td>
      </tr>
      <tr>
        <td></td>
        <td style="padding:10px; font-weight:bold;">Date</td>
        <td style="padding:10px;">${date}</td>
      </tr>
      <tr>
        <td></td>
        <td style="padding:10px; font-weight:bold;">Description</td>
        <td style="padding:10px;">${description || '<i>Aucune</i>'}</td>
      </tr>
    </table>
  `;
}

function alertBadge(text, color) {
  return `<span style="display:inline-block; padding:4px 12px; background:${color}; color:#fff; border-radius:12px; font-size:0.95em; margin-bottom:8px;">${text}</span>`;
}

function categoryCreatedEmail({ category, limit, description, date }) {
  // Email pro BudgetFlow pour nouvelle catégorie
  return baseTemplate({
    title: `Nouvelle catégorie ajoutée – ${category} | BudgetFlow`,
    content: `
      <ul style="padding-left:1em;">
        <li>Nom : <b>${category}</b></li>
        ${limit && limit > 0 ? `<li>Plafond budgétaire : <b>${limit}€</b></li>` : ''}
        ${description ? `<li>Description : <b>${description}</b></li>` : ''}
        ${date ? `<li>Ajoutée le : <b>${date}</b></li>` : ''}
      </ul>
      <p>✔️ Elle est désormais disponible pour toutes vos transactions.</p>
    `
  });
}

function transactionAlertEmail({ amount, type, category, date, description, icon, link }) {
  // Format professionnel BudgetFlow
  return baseTemplate({
    title: `Nouvelle transaction ajoutée – ${category} | BudgetFlow`,
    content: `
      <table cellpadding="0" cellspacing="0" width="100%" style="background:#f9fbfc; border-radius:6px; margin-bottom:16px;">
        <tr><td style="padding:10px 0; font-size:1.3em; text-align:center;">${icon || ''}</td><td style="padding:10px; font-weight:bold;">Montant</td><td style="padding:10px;">${amount}</td></tr>
        <tr><td></td><td style="padding:10px; font-weight:bold;">Type</td><td style="padding:10px;">${type}</td></tr>
        <tr><td></td><td style="padding:10px; font-weight:bold;">Catégorie</td><td style="padding:10px;">${category}</td></tr>
        <tr><td></td><td style="padding:10px; font-weight:bold;">Date</td><td style="padding:10px;">${date}</td></tr>
        <tr><td></td><td style="padding:10px; font-weight:bold;">Description</td><td style="padding:10px;">${description || '<i>Aucune</i>'}</td></tr>
      </table>
      <p style="margin-top:12px;">📌 <a href="${link || 'https://budgetflow.app/transactions'}" style="color:#2b7cff;">Voir toutes les transactions</a></p>
    `
  });
}

function budgetLimitEmail({ category, amount, limit, percent, link }) {
  return baseTemplate({
    title: `⚠️ Plafond dépassé – Catégorie ${category} | BudgetFlow`,
    critical: true,
    content: `
      <ul style="padding-left:1em;">
        <li>Plafond défini : <b>${limit}€</b></li>
        <li>Montant atteint : <b>${amount}€</b></li>
        <li>Pourcentage : <b>${percent}%</b></li>
        <li>Catégorie : <b>${category}</b></li>
      </ul>
      <p>📌 <a href="${link || 'https://budgetflow.app/budgets'}" style="color:#2b7cff;">Gérer les plafonds</a></p>
    `
  });
}

function budgetWarningEmail({ category, amount, limit, percent, link }) {
  return baseTemplate({
    title: `⚠️ Attention : Plafond approche – Catégorie ${category} | BudgetFlow`,
    critical: false,
    content: `
      <ul style="padding-left:1em;">
        <li>Plafond défini : <b>${limit}€</b></li>
        <li>Montant atteint : <b>${amount}€</b></li>
        <li>Pourcentage : <b>${percent}%</b></li>
        <li>Catégorie : <b>${category}</b></li>
      </ul>
      <p style="color:#ff9800; font-weight:bold;">⚠️ Vous approchez du plafond de votre budget !</p>
      <p>📌 <a href="${link || 'https://budgetflow.app/budgets'}" style="color:#2b7cff;">Gérer les plafonds</a></p>
    `
  });
}

function unusualExpenseEmail({ category, transactionCount, totalAmount, link }) {
  return baseTemplate({
    title: `📊 Activité inhabituelle détectée – ${category} | BudgetFlow`,
    critical: false,
    content: `
      <ul style="padding-left:1em;">
        <li>Catégorie : <b>${category}</b></li>
        <li>Nombre de transactions : <b>${transactionCount}</b></li>
        <li>Montant total : <b>${totalAmount.toFixed(2)}€</b></li>
        <li>Période : <b>Ce mois-ci</b></li>
      </ul>
      <p style="color:#2196f3; font-weight:bold;">📊 Activité inhabituelle détectée dans cette catégorie</p>
      <p>📌 <a href="${link || 'https://budgetflow.app/transactions'}" style="color:#2b7cff;">Voir les transactions</a></p>
    `
  });
}

function highSpendingEmail({ category, totalAmount, threshold, link }) {
  return baseTemplate({
    title: `💰 Dépenses importantes – ${category} | BudgetFlow`,
    critical: true,
    content: `
      <ul style="padding-left:1em;">
        <li>Catégorie : <b>${category}</b></li>
        <li>Montant total : <b>${totalAmount.toFixed(2)}€</b></li>
        <li>Seuil d'alerte : <b>${threshold}€</b></li>
        <li>Période : <b>Ce mois-ci</b></li>
      </ul>
      <p style="color:#e53935; font-weight:bold;">💰 Dépenses importantes détectées dans cette catégorie</p>
      <p>📌 <a href="${link || 'https://budgetflow.app/transactions'}" style="color:#2b7cff;">Voir les transactions</a></p>
    `
  });
}

function generalAlertEmail({ title, message, category, metadata, link }) {
  return baseTemplate({
    title: `🔔 ${title} | BudgetFlow`,
    critical: false,
    content: `
      <div style="margin-bottom: 16px;">
        <p style="font-size: 16px; line-height: 1.5;">${message}</p>
      </div>
      ${category ? `<p><strong>Catégorie concernée :</strong> ${category}</p>` : ''}
      ${metadata && Object.keys(metadata).length > 0 ? `
        <div style="background: #f5f5f5; padding: 12px; border-radius: 6px; margin: 12px 0;">
          <h4 style="margin: 0 0 8px 0;">Détails :</h4>
          <ul style="margin: 0; padding-left: 20px;">
            ${Object.entries(metadata).map(([key, value]) => 
              `<li><strong>${key}:</strong> ${typeof value === 'number' ? value.toFixed(2) : value}</li>`
            ).join('')}
          </ul>
        </div>
      ` : ''}
      <p>📌 <a href="${link || 'https://budgetflow.app/alerts'}" style="color:#2b7cff;">Voir toutes les alertes</a></p>
    `
  });
}

function deletionAlertEmail({ amount, type, category, date, description, icon }) {
  // Email pro BudgetFlow pour suppression
  return baseTemplate({
    title: `Transaction supprimée – ${category} | BudgetFlow`,
    content: `
      <table cellpadding="0" cellspacing="0" width="100%" style="background:#f9fbfc; border-radius:6px; margin-bottom:16px;">
        <tr><td style="padding:10px 0; font-size:1.3em; text-align:center;">${icon || ''}</td><td style="padding:10px; font-weight:bold;">Montant</td><td style="padding:10px;">${amount}</td></tr>
        <tr><td></td><td style="padding:10px; font-weight:bold;">Type</td><td style="padding:10px;">${type}</td></tr>
        <tr><td></td><td style="padding:10px; font-weight:bold;">Catégorie</td><td style="padding:10px;">${category}</td></tr>
        <tr><td></td><td style="padding:10px; font-weight:bold;">Date d'origine</td><td style="padding:10px;">${date}</td></tr>
        <tr><td></td><td style="padding:10px; font-weight:bold;">Description</td><td style="padding:10px;">${description || '<i>Aucune</i>'}</td></tr>
      </table>
      <p style="color:#e53935; font-weight:bold;">❗Cette transaction a été supprimée définitivement.</p>
    `
  });
}

function subscriptionCreatedEmail({ name, amount, frequency, nextPaymentDate, isAutomatic, description, category, reminderDays }) {
  return baseTemplate({
    title: `Nouvel abonnement ajouté – ${name} | BudgetFlow`,
    content: `
      <ul style="padding-left:1em;">
        <li>Nom : <b>${name}</b></li>
        <li>Montant : <b>${amount.toFixed(2)} €</b></li>
        <li>Fréquence : <b>${frequency === 'monthly' ? 'Mensuelle' : frequency === 'weekly' ? 'Hebdomadaire' : frequency === 'yearly' ? 'Annuelle' : 'Quotidienne'}</b></li>
        <li>Date du prochain paiement : <b>${new Date(nextPaymentDate).toLocaleString('fr-FR', { dateStyle: 'short' })}</b></li>
        <li>Catégorie : <b>${category || ''}</b></li>
        <li>Automatisation : <b>${isAutomatic ? 'Oui' : 'Non'}</b></li>
        ${description ? `<li>Description : <b>${description}</b></li>` : ''}
        <li>Rappel : <b>${reminderDays || 3} jour(s) avant</b></li>
      </ul>
      <p>✔️ L'abonnement est désormais suivi et automatisé dans BudgetFlow.</p>
    `
  });
}

function subscriptionDeletedEmail({ name, amount, frequency, category }) {
  return baseTemplate({
    title: `Abonnement supprimé – ${name} | BudgetFlow`,
    content: `
      <ul style="padding-left:1em;">
        <li>Nom : <b>${name}</b></li>
        <li>Montant : <b>${amount.toFixed(2)} €</b></li>
        <li>Fréquence : <b>${frequency === 'monthly' ? 'Mensuelle' : frequency === 'weekly' ? 'Hebdomadaire' : frequency === 'yearly' ? 'Annuelle' : 'Quotidienne'}</b></li>
        <li>Catégorie : <b>${category || ''}</b></li>
      </ul>
      <p style="color:#e53935; font-weight:bold;">❌ Cet abonnement a été supprimé et ne sera plus suivi.</p>
    `
  });
}

function monthlyReportEmail({ monthLabel, totalExpenses, totalIncome, finalBalance, topCategory, topCategoryAmount, statsLink }) {
  return baseTemplate({
    title: `Votre résumé financier – ${monthLabel} | BudgetFlow`,
    content: `
      <ul style="padding-left:1em;">
        <li>Total Dépenses : <b>${totalExpenses}</b></li>
        <li>Total Revenus : <b>${totalIncome}</b></li>
        <li>Solde final : <b>${finalBalance}</b></li>
        <li>Catégorie la plus dépensière : <b>${topCategory} (${topCategoryAmount})</b></li>
      </ul>
      <p>📈 <a href="${statsLink || 'https://budgetflow.app/statistics'}" style="color:#2b7cff;">Voir mes statistiques détaillées</a></p>
    `
  });
}

function netIncomeCeilingEmail({ ceiling, reachedAmount, percentage, period, income, expenses, link }) {
  return baseTemplate({
    title: `💰 Alerte : Plafond de Revenu Net Dépassé (${period}) | BudgetFlow`,
    critical: true,
    content: `
      <p style="font-size: 16px; line-height: 1.5;">
        Vous avez dépassé votre plafond de revenu net fixé pour la période ${period}.
      </p>
      <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <h4 style="margin: 0 0 12px 0; color: #333;">Résumé de l'alerte :</h4>
        <ul style="margin: 0; padding-left: 20px; list-style-type: none;">
          <li style="margin-bottom: 8px;">
            <strong>Plafond fixé :</strong> 
            <span style="font-weight: bold; color: #2b7cff;">${ceiling.toFixed(2)} €</span>
          </li>
          <li style="margin-bottom: 8px;">
            <strong>Revenu net atteint :</strong> 
            <span style="font-weight: bold; color: #e53935;">${reachedAmount.toFixed(2)} €</span>
          </li>
          <li style="margin-bottom: 8px;">
            <strong>Pourcentage d'atteinte :</strong> 
            <span style="font-weight: bold; color: #e53935;">${percentage.toFixed(1)}%</span>
          </li>
          <li style="margin-bottom: 8px;">
            <strong>Période :</strong> 
            <span style="font-weight: bold; color: #333;">${period}</span>
          </li>
        </ul>
      </div>
      
      <div style="background: #e8f5e8; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <h4 style="margin: 0 0 12px 0; color: #2e7d32;">Détail des finances :</h4>
        <ul style="margin: 0; padding-left: 20px; list-style-type: none;">
          <li style="margin-bottom: 8px;">
            <strong>Total des revenus :</strong> 
            <span style="font-weight: bold; color: #2e7d32;">${(income || 0).toFixed(2)} €</span>
          </li>
          <li style="margin-bottom: 8px;">
            <strong>Total des dépenses :</strong> 
            <span style="font-weight: bold; color: #d32f2f;">${(expenses || 0).toFixed(2)} €</span>
          </li>
          <li style="margin-bottom: 8px;">
            <strong>Revenu net :</strong> 
            <span style="font-weight: bold; color: #1976d2;">${reachedAmount.toFixed(2)} €</span>
          </li>
        </ul>
      </div>
      
      <p style="color: #e53935; font-weight: bold; font-size: 14px;">
        ⚠️ Votre revenu net dépasse le plafond défini. Il est peut-être temps de revoir vos dépenses ou d'ajuster votre budget.
      </p>
      <p>📌 <a href="${link || 'https://budgetflow.app/alerts'}" style="color:#2b7cff; font-weight: bold;">Voir toutes mes alertes</a></p>
    `
  });
}

function insufficientBalanceEmail({ period, currentBalance, ceiling, deficit, percentage, income, expenses, link }) {
  return baseTemplate({
    title: `⚠️ Alerte : Solde Insuffisant (${period}) | BudgetFlow`,
    critical: true,
    content: `
      <p style="font-size: 16px; line-height: 1.5;">
        Votre solde ${period} est inférieur au plafond défini. Une attention immédiate est recommandée.
      </p>
      <div style="background: #fff3cd; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
        <h4 style="margin: 0 0 12px 0; color: #856404;">Résumé de l'alerte :</h4>
        <ul style="margin: 0; padding-left: 20px; list-style-type: none;">
          <li style="margin-bottom: 8px;">
            <strong>Solde actuel :</strong> 
            <span style="font-weight: bold; color: #e53935;">${currentBalance.toFixed(2)} €</span>
          </li>
          <li style="margin-bottom: 8px;">
            <strong>Plafond défini :</strong> 
            <span style="font-weight: bold; color: #2b7cff;">${ceiling.toFixed(2)} €</span>
          </li>
          <li style="margin-bottom: 8px;">
            <strong>Déficit :</strong> 
            <span style="font-weight: bold; color: #e53935;">${deficit.toFixed(2)} €</span>
          </li>
          <li style="margin-bottom: 8px;">
            <strong>Pourcentage d'atteinte :</strong> 
            <span style="font-weight: bold; color: #e53935;">${percentage.toFixed(1)}%</span>
          </li>
          <li>
            <strong>Période :</strong> 
            <span style="font-weight: bold; color: #333;">${period}</span>
          </li>
        </ul>
      </div>
      
      <div style="background: #e8f5e8; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <h4 style="margin: 0 0 12px 0; color: #2e7d32;">Détail des finances :</h4>
        <ul style="margin: 0; padding-left: 20px; list-style-type: none;">
          <li style="margin-bottom: 8px;">
            <strong>Total des revenus :</strong> 
            <span style="font-weight: bold; color: #2e7d32;">${income.toFixed(2)} €</span>
          </li>
          <li style="margin-bottom: 8px;">
            <strong>Total des dépenses :</strong> 
            <span style="font-weight: bold; color: #d32f2f;">${expenses.toFixed(2)} €</span>
          </li>
          <li style="margin-bottom: 8px;">
            <strong>Solde net :</strong> 
            <span style="font-weight: bold; color: #1976d2;">${currentBalance.toFixed(2)} €</span>
          </li>
        </ul>
      </div>
      
      <div style="background: #f8d7da; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
        <h4 style="margin: 0 0 12px 0; color: #721c24;">Actions recommandées :</h4>
        <ul style="margin: 0; padding-left: 20px; color: #721c24;">
          <li style="margin-bottom: 8px;">Réduire vos dépenses dans les catégories les plus coûteuses</li>
          <li style="margin-bottom: 8px;">Augmenter vos revenus si possible</li>
          <li style="margin-bottom: 8px;">Réviser votre budget et vos objectifs financiers</li>
          <li style="margin-bottom: 8px;">Considérer des économies temporaires</li>
        </ul>
      </div>
      
      <p style="color: #e53935; font-weight: bold; font-size: 14px;">
        ⚠️ Votre solde est en dessous du seuil de sécurité. Il est temps d'agir pour améliorer votre situation financière.
      </p>
      <p>📌 <a href="${link || 'https://budgetflow.app/alerts'}" style="color:#2b7cff; font-weight: bold;">Voir toutes mes alertes</a></p>
    `
  });
}

module.exports = {
  baseTemplate,
  transactionTable,
  alertBadge,
  categoryCreatedEmail,
  transactionAlertEmail,
  budgetLimitEmail,
  budgetWarningEmail,
  unusualExpenseEmail,
  highSpendingEmail,
  generalAlertEmail,
  deletionAlertEmail,
  subscriptionCreatedEmail,
  subscriptionDeletedEmail,
  monthlyReportEmail,
  netIncomeCeilingEmail,
  insufficientBalanceEmail
};
