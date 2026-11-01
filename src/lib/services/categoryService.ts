import { db, type Category } from '@/lib/db/schema';
import { runAtomicTransaction } from '@/lib/db/transactionHelper';

function validateCategoryData(data: { name: string; type: Category['type'] }) {
  const name = data.name.trim();
  if (!name) throw new Error('Nama kategori wajib diisi');
  if (data.type !== 'INCOME' && data.type !== 'EXPENSE') {
    throw new Error('Tipe kategori tidak valid');
  }
  return { name, type: data.type };
}

async function ensureUniqueCategory(name: string, type: Category['type'], exceptId?: string) {
  const normalizedName = name.toLocaleLowerCase('id-ID');
  const duplicate = await db.categories
    .filter((category) => category.is_active !== false && category.id !== exceptId)
    .filter((category) => category.type === type && category.name.trim().toLocaleLowerCase('id-ID') === normalizedName)
    .first();

  if (duplicate) throw new Error('Kategori dengan nama dan tipe tersebut sudah ada');
}

export async function getActiveCategories(): Promise<Category[]> {
  return db.categories.filter((category) => category.is_active !== false).toArray();
}

export async function createCategory(data: { name: string; type: Category['type'] }): Promise<string> {
  const category = validateCategoryData(data);
  const id = crypto.randomUUID();

  await runAtomicTransaction(['categories'], async () => {
    await ensureUniqueCategory(category.name, category.type);
    await db.categories.add({
      id,
      ...category,
      is_system_default: false,
      is_active: true,
      created_at: new Date().toISOString(),
    });
  });

  return id;
}

export async function updateCategory(id: string, data: { name: string; type: Category['type'] }): Promise<void> {
  const existing = await db.categories.get(id);
  if (!existing) throw new Error('Kategori tidak ditemukan');
  if (existing.is_system_default) throw new Error('Kategori default tidak dapat diubah');
  if (existing.is_active === false) throw new Error('Kategori tidak aktif tidak dapat diubah');

  const category = validateCategoryData(data);

  await runAtomicTransaction(['categories'], async () => {
    await ensureUniqueCategory(category.name, category.type, id);
    await db.categories.update(id, { ...category });
  });
}

export async function deactivateCategory(id: string): Promise<void> {
  const existing = await db.categories.get(id);
  if (!existing) throw new Error('Kategori tidak ditemukan');
  if (existing.is_system_default) throw new Error('Kategori default tidak dapat dinonaktifkan');

  await runAtomicTransaction(['categories'], async () => {
    await db.categories.update(id, { is_active: false });
  });
}
