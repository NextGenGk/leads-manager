// app/(dashboard)/settings/page.tsx
import SeedPanel from "@/components/settings/SeedPanel";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Settings</h1>
        <p className="text-sm text-stone-500 mt-1">
          Configure your BhilaiLeads CRM
        </p>
      </div>
      <SeedPanel />
    </div>
  );
}
