import { db } from './schema';

/**
 * Executes database operations inside a Dexie RW transaction.
 * If any error occurs inside the callback, Dexie will automatically rollback all changes.
 */
export async function runAtomicTransaction<T>(
  tables: Array<'accounts' | 'categories' | 'transactions' | 'bills' | 'goals' | 'goal_allocations'>,
  callback: () => Promise<T>
): Promise<T> {
  return await db.transaction('rw', tables.map((t) => db[t]), async () => {
    return await callback();
  });
}
