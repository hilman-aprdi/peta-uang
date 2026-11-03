'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { GoalManagement } from '@/components/goals/GoalManagement';

export default function GoalsPage() {
  const [activeTab, setActiveTab] = useState('goals');

  return (
    <AppLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onOpenAddModal={() => undefined}
      showAddTransactionButton={false}
    >
      <GoalManagement />
    </AppLayout>
  );
}
