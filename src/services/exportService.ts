import { DateRange } from 'react-day-picker';

interface Transaction {
  _id: string;
  description: string;
  amount: number;
  date: string;
  type: 'expense' | 'income';
  currency: string;
  category: {
    _id: string;
    name: string;
    color: string;
  } | null;
}

interface UserProfile {
  user: {
    name: string;
    email: string;
  };
}

interface Statistics {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  transactionCount: number;
  categoryStats: any[];
  monthlyStats: any[];
}

class ExportService {
  private formatCurrency(amount: number, currency: string = 'EUR'): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  private formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  private groupTransactionsByMonth(transactions: Transaction[]): Record<string, Transaction[]> {
    const grouped: Record<string, Transaction[]> = {};
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(transaction);
    });
    
    return grouped;
  }

  private generateCSVContent(transactions: Transaction[], userProfile: UserProfile, dateRange?: DateRange): string {
    const headers = [
      'Date',
      'Description',
      'Type',
      'Catégorie',
      'Montant',
      'Devise'
    ];

    const rows = transactions.map(transaction => [
      this.formatDate(transaction.date),
      transaction.description,
      transaction.type === 'income' ? 'Revenu' : 'Dépense',
      transaction.category?.name || 'Non catégorisé',
      Math.abs(transaction.amount).toString(),
      transaction.currency
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  private generatePDFContent(transactions: Transaction[], userProfile: UserProfile, dateRange?: DateRange): string {
    const groupedTransactions = this.groupTransactionsByMonth(transactions);
    const sortedMonths = Object.keys(groupedTransactions).sort().reverse();
    
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Rapport des Transactions - BABOS</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f8fafc;
            color: #1e293b;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
          }
          .header .subtitle {
            margin: 10px 0 0 0;
            opacity: 0.9;
            font-size: 16px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
          }
          .info-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            border-left: 4px solid #667eea;
          }
          .info-card h3 {
            margin: 0 0 10px 0;
            font-size: 14px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .info-card .value {
            font-size: 18px;
            font-weight: 600;
            color: #1e293b;
          }
          .month-section {
            background: white;
            margin-bottom: 25px;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          }
          .month-header {
            background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
            padding: 15px 20px;
            border-bottom: 1px solid #e2e8f0;
          }
          .month-header h2 {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
            color: #334155;
          }
          .transaction-table {
            width: 100%;
            border-collapse: collapse;
          }
          .transaction-table th {
            background: #f8fafc;
            padding: 12px 15px;
            text-align: left;
            font-weight: 600;
            font-size: 12px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 1px solid #e2e8f0;
          }
          .transaction-table td {
            padding: 12px 15px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 14px;
          }
          .transaction-table tr:hover {
            background: #f8fafc;
          }
          .type-badge {
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .type-income {
            background: #dcfce7;
            color: #166534;
          }
          .type-expense {
            background: #fef2f2;
            color: #dc2626;
          }
          .category-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 8px;
            background: #f1f5f9;
            border-radius: 6px;
            font-size: 12px;
            color: #475569;
          }
          .category-color {
            width: 8px;
            height: 8px;
            border-radius: 50%;
          }
          .amount {
            font-weight: 600;
            font-family: 'Courier New', monospace;
          }
          .amount.income {
            color: #166534;
          }
          .amount.expense {
            color: #dc2626;
          }
          .summary {
            background: white;
            padding: 25px;
            border-radius: 12px;
            margin-bottom: 30px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          }
          .summary h2 {
            margin: 0 0 20px 0;
            font-size: 20px;
            font-weight: 600;
            color: #1e293b;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 20px;
          }
          .summary-item {
            text-align: center;
            padding: 15px;
            background: #f8fafc;
            border-radius: 8px;
          }
          .summary-item .label {
            font-size: 12px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
          }
          .summary-item .value {
            font-size: 18px;
            font-weight: 700;
            color: #1e293b;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            color: #64748b;
            font-size: 12px;
            border-top: 1px solid #e2e8f0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📊 Rapport des Transactions</h1>
          <p class="subtitle">Généré pour ${userProfile.user.name} le ${new Date().toLocaleDateString('fr-FR')}</p>
        </div>
    `;

    // Informations générales
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const netIncome = totalIncome - totalExpenses;

    htmlContent += `
        <div class="info-grid">
          <div class="info-card">
            <h3>Période</h3>
            <div class="value">${dateRange ? 
              `Du ${dateRange.from?.toLocaleDateString('fr-FR')} au ${dateRange.to?.toLocaleDateString('fr-FR') || dateRange.from?.toLocaleDateString('fr-FR')}` : 
              'Toutes les transactions'
            }</div>
          </div>
          <div class="info-card">
            <h3>Total Transactions</h3>
            <div class="value">${transactions.length}</div>
          </div>
          <div class="info-card">
            <h3>Revenus Totaux</h3>
            <div class="value">${this.formatCurrency(totalIncome)}</div>
          </div>
          <div class="info-card">
            <h3>Dépenses Totales</h3>
            <div class="value">${this.formatCurrency(totalExpenses)}</div>
          </div>
          <div class="info-card">
            <h3>Solde Net</h3>
            <div class="value" style="color: ${netIncome >= 0 ? '#166534' : '#dc2626'}">${this.formatCurrency(netIncome)}</div>
          </div>
        </div>
    `;

    // Transactions par mois
    sortedMonths.forEach(monthKey => {
      const monthTransactions = groupedTransactions[monthKey];
      const monthDate = new Date(monthKey + '-01');
      const monthName = monthDate.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
      
      const monthIncome = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const monthExpenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      htmlContent += `
        <div class="month-section">
          <div class="month-header">
            <h2>${monthName} - ${this.formatCurrency(monthIncome - monthExpenses)}</h2>
          </div>
          <table class="transaction-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Type</th>
                <th>Catégorie</th>
                <th>Montant</th>
              </tr>
            </thead>
            <tbody>
      `;

      monthTransactions
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .forEach(transaction => {
          htmlContent += `
            <tr>
              <td>${this.formatDate(transaction.date)}</td>
              <td>${transaction.description}</td>
              <td>
                <span class="type-badge type-${transaction.type}">
                  ${transaction.type === 'income' ? 'Revenu' : 'Dépense'}
                </span>
              </td>
              <td>
                ${transaction.category ? 
                  `<span class="category-badge">
                    <span class="category-color" style="background-color: ${transaction.category.color}"></span>
                    ${transaction.category.name}
                  </span>` : 
                  '<span class="category-badge">Non catégorisé</span>'
                }
              </td>
              <td class="amount ${transaction.type}">${this.formatCurrency(Math.abs(transaction.amount), transaction.currency)}</td>
            </tr>
          `;
        });

      htmlContent += `
            </tbody>
          </table>
        </div>
      `;
    });

    htmlContent += `
        <div class="footer">
          <p>Rapport généré automatiquement par BABOS - ${new Date().toLocaleString('fr-FR')}</p>
        </div>
      </body>
      </html>
    `;

    return htmlContent;
  }

  async exportTransactions(
    transactions: Transaction[], 
    type: 'pdf' | 'csv', 
    userProfile: UserProfile,
    dateRange?: DateRange
  ): Promise<void> {
    try {
      if (type === 'csv') {
        const csvContent = this.generateCSVContent(transactions, userProfile, dateRange);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (type === 'pdf') {
        // Pour le PDF, nous utiliserons une bibliothèque comme jsPDF ou html2pdf
        // Pour l'instant, nous allons créer un PDF simple
        const htmlContent = this.generatePDFContent(transactions, userProfile, dateRange);
        
        // Utilisation de html2pdf.js si disponible, sinon fallback vers print
        if (typeof window !== 'undefined' && (window as any).html2pdf) {
          const opt = {
            margin: 1,
            filename: `transactions_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
          };
          
          const element = document.createElement('div');
          element.innerHTML = htmlContent;
          document.body.appendChild(element);
          
          await (window as any).html2pdf().set(opt).from(element).save();
          document.body.removeChild(element);
        } else {
          // Fallback: ouvrir dans une nouvelle fenêtre pour impression
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(htmlContent);
            printWindow.document.close();
            printWindow.print();
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      throw new Error('Erreur lors de la génération du fichier d\'export');
    }
  }

  async exportStatistics(
    statistics: Statistics,
    type: 'pdf' | 'csv',
    userProfile: UserProfile,
    dateRange?: DateRange
  ): Promise<void> {
    try {
      if (type === 'csv') {
        const headers = [
          'Métrique',
          'Valeur',
          'Période'
        ];

        const rows = [
          ['Total Revenus', this.formatCurrency(statistics.totalIncome), dateRange ? 
            `${dateRange.from?.toLocaleDateString('fr-FR')} - ${dateRange.to?.toLocaleDateString('fr-FR') || dateRange.from?.toLocaleDateString('fr-FR')}` : 
            'Toutes les périodes'
          ],
          ['Total Dépenses', this.formatCurrency(statistics.totalExpenses), ''],
          ['Revenu Net', this.formatCurrency(statistics.netIncome), ''],
          ['Nombre de Transactions', statistics.transactionCount.toString(), ''],
        ];

        // Ajouter les statistiques par catégorie
        statistics.categoryStats.forEach(stat => {
          rows.push([
            `Catégorie: ${stat.category}`,
            this.formatCurrency(stat.amount),
            `${stat.count} transactions`
          ]);
        });

        const csvContent = [
          headers.join(','),
          ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `statistiques_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (type === 'pdf') {
        // Génération du PDF pour les statistiques
        const htmlContent = this.generateStatisticsPDF(statistics, userProfile, dateRange);
        
        if (typeof window !== 'undefined' && (window as any).html2pdf) {
          const opt = {
            margin: 1,
            filename: `statistiques_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
          };
          
          const element = document.createElement('div');
          element.innerHTML = htmlContent;
          document.body.appendChild(element);
          
          await (window as any).html2pdf().set(opt).from(element).save();
          document.body.removeChild(element);
        } else {
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(htmlContent);
            printWindow.document.close();
            printWindow.print();
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'export des statistiques:', error);
      throw new Error('Erreur lors de la génération du fichier de statistiques');
    }
  }

  private generateStatisticsPDF(statistics: Statistics, userProfile: UserProfile, dateRange?: DateRange): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Statistiques Financières - BABOS</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f8fafc;
            color: #1e293b;
          }
          .header {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
          }
          .header .subtitle {
            margin: 10px 0 0 0;
            opacity: 0.9;
            font-size: 16px;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
          }
          .stat-card {
            background: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            text-align: center;
            border-top: 4px solid #10b981;
          }
          .stat-card .value {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 10px;
            color: #1e293b;
          }
          .stat-card .label {
            font-size: 14px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .category-section {
            background: white;
            padding: 25px;
            border-radius: 12px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          }
          .category-section h2 {
            margin: 0 0 20px 0;
            font-size: 20px;
            font-weight: 600;
            color: #1e293b;
          }
          .category-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
          }
          .category-item {
            padding: 15px;
            background: #f8fafc;
            border-radius: 8px;
            border-left: 4px solid #10b981;
          }
          .category-item .name {
            font-weight: 600;
            margin-bottom: 5px;
            color: #1e293b;
          }
          .category-item .amount {
            font-size: 18px;
            font-weight: 700;
            color: #10b981;
          }
          .category-item .count {
            font-size: 12px;
            color: #64748b;
            margin-top: 5px;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            color: #64748b;
            font-size: 12px;
            border-top: 1px solid #e2e8f0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📈 Statistiques Financières</h1>
          <p class="subtitle">Généré pour ${userProfile.user.name} le ${new Date().toLocaleDateString('fr-FR')}</p>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="value">${this.formatCurrency(statistics.totalIncome)}</div>
            <div class="label">Total Revenus</div>
          </div>
          <div class="stat-card">
            <div class="value">${this.formatCurrency(statistics.totalExpenses)}</div>
            <div class="label">Total Dépenses</div>
          </div>
          <div class="stat-card">
            <div class="value" style="color: ${statistics.netIncome >= 0 ? '#10b981' : '#ef4444'}">${this.formatCurrency(statistics.netIncome)}</div>
            <div class="label">Revenu Net</div>
          </div>
          <div class="stat-card">
            <div class="value">${statistics.transactionCount}</div>
            <div class="label">Transactions</div>
          </div>
        </div>

        <div class="category-section">
          <h2>📊 Répartition par Catégorie</h2>
          <div class="category-grid">
            ${statistics.categoryStats.map(stat => `
              <div class="category-item">
                <div class="name">${stat.category}</div>
                <div class="amount">${this.formatCurrency(stat.amount)}</div>
                <div class="count">${stat.count} transactions</div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="footer">
          <p>Statistiques générées automatiquement par BABOS - ${new Date().toLocaleString('fr-FR')}</p>
        </div>
      </body>
      </html>
    `;
  }
}

export const exportService = new ExportService(); 