import Dexie, { type Table } from 'dexie';

// Interface Entities
export interface Account {
  id: string;
  name: string;
  type: 'CASH' | 'BANK' | 'EWALLET' | 'INVESTMENT';
  initial_balance: number;
  is_active: boolean;
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
  is_active: boolean;
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
  goal_id?: string;
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
  transaction_id?: string;
  created_at: string;
}

export interface Goal {
  id: string;
  name: string;
  target_amount: number;
  allocated_amount: number;
  target_date?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  note?: string;
  is_deleted?: boolean;
  created_at: string;
  updated_at: string;
}

export interface GoalAllocation {
  id: string;
  goal_id: string;
  type: 'ALLOCATE' | 'WITHDRAW' | 'SPEND' | 'SPEND_ADJUSTMENT' | 'SPEND_REVERSAL';
  amount: number;
  related_transaction_id?: string;
  note?: string;
  created_at: string;
}

// Dexie Database Class
export class PetaUangDatabase extends Dexie {
  accounts!: Table<Account>;
  categories!: Table<Category>;
  transactions!: Table<Transaction>;
  bills!: Table<Bill>;
  goals!: Table<Goal>;
  goal_allocations!: Table<GoalAllocation>;

  constructor() {
    super('PetaUangDB');

    // Index Definition
    this.version(1).stores({
      accounts: 'id, name, type, is_active',
      categories: 'id, name, type, is_system_default',
      transactions: 'id, type, account_id, destination_account_id, category_id, transaction_date',
      bills: 'id, is_paid, due_date',
    });

    this.version(2)
      .stores({
        accounts: 'id, name, type',
        categories: 'id, name, type, is_system_default',
        transactions: 'id, type, account_id, destination_account_id, category_id, transaction_date',
        bills: 'id, is_paid, due_date',
      })
      .upgrade((tx) =>
        tx.table('accounts').toCollection().modify((account) => {
          account.is_active = account.is_active === true || account.is_active === 1;
        })
      );

    this.version(3)
      .stores({
        accounts: 'id, name, type',
        categories: 'id, name, type, is_system_default',
        transactions: 'id, type, account_id, destination_account_id, category_id, transaction_date',
        bills: 'id, is_paid, due_date',
      })
      .upgrade(async (tx) => {
        const categories = tx.table('categories');
        const transactions = tx.table('transactions');
        const defaultCategories = await categories
          .filter((category) => category.is_system_default === true)
          .toArray();
        const canonicalByKey = new Map<string, { id: string; name: string; type: string }>();
        const duplicateCategories: Array<{ id: string; canonicalId: string }> = [];

        for (const category of defaultCategories) {
          const key = `${category.name}::${category.type}`;
          const canonical = canonicalByKey.get(key);

          if (canonical) {
            duplicateCategories.push({ id: category.id, canonicalId: canonical.id });
          } else {
            canonicalByKey.set(key, category);
          }
        }

        for (const duplicate of duplicateCategories) {
          await transactions
            .where('category_id')
            .equals(duplicate.id)
            .modify({ category_id: duplicate.canonicalId });
          await categories.delete(duplicate.id);
        }
      });

    this.version(4)
      .stores({
        accounts: 'id, name, type',
        categories: 'id, name, type, is_system_default',
        transactions: 'id, type, account_id, destination_account_id, category_id, transaction_date',
        bills: 'id, is_paid, due_date',
      })
      .upgrade((tx) =>
        tx.table('categories').toCollection().modify((category) => {
          category.is_active = category.is_active !== false;
        })
      );

    this.version(5)
      .stores({
        accounts: 'id, name, type',
        categories: 'id, name, type, is_system_default',
        transactions: 'id, type, account_id, destination_account_id, category_id, goal_id, transaction_date',
        bills: 'id, is_paid, due_date',
        goals: 'id, status, is_deleted, created_at',
        goal_allocations: 'id, goal_id, type, related_transaction_id, created_at',
      });
  }
}

export const db = new PetaUangDatabase();
