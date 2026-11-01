import { db, type Category } from './schema';

const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'created_at'>[] = [
  // Expense
  { name: 'Makanan & Minuman', type: 'EXPENSE', icon: 'utensils', is_system_default: true },
  { name: 'Transportasi', type: 'EXPENSE', icon: 'car', is_system_default: true },
  { name: 'Belanja', type: 'EXPENSE', icon: 'shopping-bag', is_system_default: true },
  { name: 'Tagihan & Utilitas', type: 'EXPENSE', icon: 'receipt', is_system_default: true },
  { name: 'Hiburan', type: 'EXPENSE', icon: 'film', is_system_default: true },
  // Income
  { name: 'Gaji', type: 'INCOME', icon: 'wallet', is_system_default: true },
  { name: 'Bonus & Freelance', type: 'INCOME', icon: 'badge-percent', is_system_default: true },
  { name: 'Investasi', type: 'INCOME', icon: 'trending-up', is_system_default: true },
];

export async function seedDefaultCategories() {
  const count = await db.categories.count();
  if (count === 0) {
    const now = new Date().toISOString();
    const categoriesToInsert: Category[] = DEFAULT_CATEGORIES.map((cat) => ({
      ...cat,
      id: crypto.randomUUID(),
      created_at: now,
    }));
    await db.categories.bulkAdd(categoriesToInsert);
    console.log('Seed categories initialized.');
  }
}
