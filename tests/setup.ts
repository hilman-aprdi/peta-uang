import 'fake-indexeddb/auto';
import { afterEach } from 'vitest';
import { db } from '@/lib/db/schema';

afterEach(async () => {
  await db.transactions.clear();
  await db.accounts.clear();
  await db.categories.clear();
  await db.bills.clear();
});
