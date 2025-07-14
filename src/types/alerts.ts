
export interface Alert {
  _id: string;
  type: 'budget_limit' | 'unusual_expense' | 'monthly_report';
  message: string;
  createdAt: string;
  read: boolean;
  resolved: boolean;
  category?: {
    _id: string;
    name: string;
    color: string;
  };
}

export interface Category {
  _id: string;
  name: string;
  color: string;
}

export interface NotificationSettings {
  email: boolean;
  app: boolean;
  budgetAlerts: boolean;
  unusualExpenses: boolean;
  monthlyReports: boolean;
}

export interface NewAlert {
  type: 'budget_limit' | 'unusual_expense' | 'monthly_report';
  categoryId: string;
  threshold: string;
  message: string;
}

export interface FiltersPanelProps {
  onApplyFilters: (filters: { search?: string; categoryId?: string; startDate?: string; endDate?: string; }) => void;
  onResetFilters: () => void;
}
