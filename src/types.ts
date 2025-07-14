export interface Alert {
  _id: string;
  type: 'budget_limit' | 'unusual_expense' | 'monthly_report';
  category: {
    _id: string;
    name: string;
    color: string;
  } | null;
  message: string;
  read: boolean;
  resolved: boolean;
  createdAt: string;
  percentage?: number;
}
