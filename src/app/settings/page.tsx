'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { BillManagement } from '@/components/ui/BillManagement';

export default function BillsPageLegacyRoute() {
  const [activeTab, setActiveTab] = useState('bills');

  return (
    <AppLayout activeTab={activeTab} setActiveTab={setActiveTab} onOpenAddModal={() => undefined} showAddTransactionButton={false}>
      <BillManagement />
    </AppLayout>
  );
}
