import { db, type Category } from './schema';
import { runAtomicTransaction } from './transactionHelper';

const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'created_at'>[] = [
  // Expense
  { name: 'Makanan & Minuman', type: 'EXPENSE', icon: 'utensils', is_system_default: true, is_active: true },
  { name: 'Transportasi', type: 'EXPENSE', icon: 'car', is_system_default: true, is_active: true },
  { name: 'Belanja', type: 'EXPENSE', icon: 'shopping-bag', is_system_default: true, is_active: true },
  { name: 'Tagihan & Utilitas', type: 'EXPENSE', icon: 'receipt', is_system_default: true, is_active: true },
  { name: 'Hiburan', type: 'EXPENSE', icon: 'film', is_system_default: true, is_active: true },
  // Income
  { name: 'Gaji', type: 'INCOME', icon: 'wallet', is_system_default: true, is_active: true },
  { name: 'Bonus & Freelance', type: 'INCOME', icon: 'badge-percent', is_system_default: true, is_active: true },
  { name: 'Investasi', type: 'INCOME', icon: 'trending-up', is_system_default: true, is_active: true },
];

export async function seedDefaultCategories() {
  await runAtomicTransaction(['categories'], async () => {
    const existingCategories = await db.categories.toArray();
    const existingKeys = new Set(
      existingCategories.map((category) => `${category.name}::${category.type}`)
    );
    const missingCategories = DEFAULT_CATEGORIES.filter(
      (category) => !existingKeys.has(`${category.name}::${category.type}`)
    );

    if (missingCategories.length > 0) {
    const now = new Date().toISOString();
      const categoriesToInsert: Category[] = missingCategories.map((cat) => ({
      ...cat,
      id: crypto.randomUUID(),
      created_at: now,
      }));
      await db.categories.bulkAdd(categoriesToInsert);
      console.log('Seed categories initialized.');
    }
  });
}
