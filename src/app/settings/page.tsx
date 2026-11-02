'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { BillManagement } from '@/components/ui/BillManagement';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('settings');

  return (
    <AppLayout activeTab={activeTab} setActiveTab={setActiveTab} onOpenAddModal={() => undefined} showAddTransactionButton={false}>
      <BillManagement />
    </AppLayout>
  );
}
