import Dexie, { type Table } from 'dexie';

// Interface Entities
export interface Account {
  id: string;
  name: string;
  type: 'CASH' | 'BANK' | 'EWALLET' | 'INVESTMENT';
  initial_balance: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  icon?: string;
  color?: string;
  is_system_default: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  title: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  amount: number;
  account_id: string;
  destination_account_id?: string;
  category_id?: string;
  transaction_date: string;
  note?: string;
  created_at: string;
  updated_at: string;
}

export interface Bill {
  id: string;
  title: string;
  amount: number;
  due_date: string;
  is_paid: boolean;
  created_at: string;
}

// Dexie Database Class
export class PetaUangDatabase extends Dexie {
  accounts!: Table<Account>;
  categories!: Table<Category>;
  transactions!: Table<Transaction>;
  bills!: Table<Bill>;

  constructor() {
    super('PetaUangDB');

    // Index Definition
    this.version(1).stores({
      accounts: 'id, name, type, is_active',
      categories: 'id, name, type, is_system_default',
      transactions: 'id, type, account_id, destination_account_id, category_id, transaction_date',
      bills: 'id, is_paid, due_date',
    });
  }
}

export const db = new PetaUangDatabase();
