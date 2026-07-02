import React from 'react';
import { PageHeader } from '@/components/shell/PageHeader';

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Account Preferences"
        subtitle="Manage your profile, billing, and system preferences."
      />
      <div className="bg-card border border-line rounded-[16px] p-[26px_28px]">
        <p className="text-text-muted">Settings panel coming soon.</p>
      </div>
    </>
  );
}
