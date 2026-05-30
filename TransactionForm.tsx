export type TransactionType = 'income' | 'expense' | 'goal';

export interface Transaction {
  id?: string;
  userId: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  date: string; // ISO string
  createdAt: any;
  updatedAt: any;
  goalId?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  category?: string;
  targetAmount: number;
  currentAmount: number;
  monthlyTarget?: number;
  deadline?: string;
  createdAt: string;
}

export interface CategoryBudget {
  category: string;
  limit: number;
}

export interface UserProfile {
  uid?: string;
  email: string;
  displayName: string;
  currency: string;
  photoURL?: string;
  monthlyBudget?: number;
  lastSeen?: string;
  timeFormat?: '12h' | '24h';
  reminderType?: 'none' | 'daily' | 'weekly';
  reminderLastNotified?: string;
  categories?: {
    expense: string[];
    income: string[];
  };
  savingsGoals?: SavingsGoal[];
  categoryBudgets?: CategoryBudget[];
}
