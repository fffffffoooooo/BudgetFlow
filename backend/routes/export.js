
const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

// Route d'exportation au format CSV
router.post('/csv', auth, async (req, res) => {
  try {
    const { startDate, endDate, categoryId } = req.body;
    
    // Construire la requête pour récupérer les transactions
    let query = { user: req.userId };
    
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    
    if (categoryId) {
      query.category = categoryId;
    }
    
    // Récupérer les transactions avec les catégories
    const transactions = await Transaction.find(query)
      .populate('category', 'name color')
      .sort({ date: -1 });
    
    // Créer l'en-tête du CSV
    let csv = 'Date,Description,Catégorie,Type,Montant\n';
    
    // Ajouter chaque transaction
    transactions.forEach(transaction => {
      const date = new Date(transaction.date).toLocaleDateString();
      const description = transaction.description.replace(/,/g, ' '); // Éviter les virgules qui perturberaient le CSV
      const category = transaction.category ? transaction.category.name.replace(/,/g, ' ') : 'Non catégorisé';
      const type = transaction.type === 'expense' ? 'Dépense' : 'Revenu';
      const amount = transaction.amount.toFixed(2);
      
      csv += `${date},"${description}","${category}",${type},${amount}\n`;
    });
    
    // Définir les en-têtes de la réponse
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=transactions-${new Date().toISOString().slice(0, 10)}.csv`);
    
    // Envoyer le CSV
    res.send(csv);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route d'exportation au format PDF
router.post('/pdf', auth, async (req, res) => {
  try {
    const { startDate, endDate, categoryId } = req.body;
    const PDFDocument = require('pdfkit');
    const fs = require('fs');
    
    // Créer un nouveau document PDF
    const doc = new PDFDocument();
    
    // Définir les en-têtes de la réponse
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=rapport-financier-${new Date().toISOString().slice(0, 10)}.pdf`);
    
    // Envoyer le PDF au fur et à mesure de sa génération
    doc.pipe(res);
    
    // Ajouter un titre
    doc.fontSize(20).text('Rapport Financier', { align: 'center' });
    doc.moveDown();
    
    // Ajouter la période
    doc.fontSize(12).text(
      `Période: ${startDate ? new Date(startDate).toLocaleDateString() : 'Début'} - ${endDate ? new Date(endDate).toLocaleDateString() : 'Aujourd\'hui'}`,
      { align: 'center' }
    );
    doc.moveDown(2);
    
    // Récupérer les données nécessaires
    let query = { user: req.userId };
    
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    
    if (categoryId) {
      query.category = categoryId;
    }
    
    // Récupérer les transactions
    const transactions = await Transaction.find(query)
      .populate('category', 'name color')
      .sort({ date: -1 });
    
    // Calculer les totaux
    const totals = transactions.reduce((acc, transaction) => {
      if (transaction.type === 'income') {
        acc.income += transaction.amount;
      } else {
        acc.expenses += transaction.amount;
      }
      return acc;
    }, { income: 0, expenses: 0 });
    
    const balance = totals.income - totals.expenses;
    
    // Ajouter la section de résumé
    doc.fontSize(16).text('Résumé Financier', { underline: true });
    doc.moveDown(0.5);
    
    doc.fontSize(12).text(`Revenus totaux: ${totals.income.toFixed(2)} €`);
    doc.text(`Dépenses totales: ${totals.expenses.toFixed(2)} €`);
    doc.text(`Solde: ${balance.toFixed(2)} €`, { bold: true });
    doc.moveDown();
    
    // Ajouter la section des transactions
    doc.addPage();
    doc.fontSize(16).text('Détail des Transactions', { underline: true });
    doc.moveDown(0.5);
    
    // En-têtes du tableau
    doc.font('Helvetica-Bold');
    doc.text('Date', 50, doc.y);
    doc.text('Description', 150, doc.y);
    doc.text('Catégorie', 300, doc.y);
    doc.text('Montant', 400, doc.y, { width: 100, align: 'right' });
    doc.moveDown(1.5);
    
    // Ligne de séparation
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);
    
    // Détails des transactions
    doc.font('Helvetica');
    let yPosition = doc.y;
    
    transactions.forEach((transaction, index) => {
      if (yPosition > 750) { // Vérifier si on doit ajouter une nouvelle page
        doc.addPage();
        yPosition = 50;
      }
      
      const date = new Date(transaction.date).toLocaleDateString();
      const description = transaction.description || '';
      const category = transaction.category ? transaction.category.name : 'Non catégorisé';
      const amount = transaction.amount.toFixed(2) + ' €';
      const isExpense = transaction.type === 'expense';
      
      doc.fontSize(10);
      doc.text(date, 50, yPosition);
      doc.text(description.substring(0, 30) + (description.length > 30 ? '...' : ''), 150, yPosition);
      doc.text(category, 300, yPosition);
      
      // Afficher les dépenses en rouge et les revenus en vert
      if (isExpense) {
        doc.fillColor('red');
      } else {
        doc.fillColor('green');
      }
      
      doc.text(amount, 400, yPosition, { width: 100, align: 'right' });
      doc.fillColor('black'); // Réinitialiser la couleur
      
      yPosition += 20;
      
      // Ajouter une ligne de séparation toutes les 5 transactions
      if (index < transactions.length - 1 && index % 5 === 4) {
        doc.moveTo(50, yPosition - 5).lineTo(550, yPosition - 5).stroke();
        yPosition += 10;
      }
    });
    
    // Finaliser le PDF
    doc.end();
    
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Erreur lors de la génération du PDF' });
    }
  }
});

module.exports = router;
