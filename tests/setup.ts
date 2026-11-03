import 'fake-indexeddb/auto';
import { afterEach } from 'vitest';
import { db } from '@/lib/db/schema';

afterEach(async () => {
  await db.transactions.clear();
  await db.accounts.clear();
  await db.categories.clear();
  await db.bills.clear();
  await db.goals.clear();
  await db.goal_allocations.clear();
});
