import { SettingsForm } from "@/components/SettingsForm";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
       <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your account and notification preferences.</p>
      </div>
      <SettingsForm />
    </div>
  );
}
