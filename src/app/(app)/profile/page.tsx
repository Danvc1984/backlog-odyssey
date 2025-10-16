
'use client';
import PlatformSettings from '@/components/platform-settings';

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-primary">My Profile</h2>
        <p className="text-muted-foreground">Update your account and platform preferences.</p>
      </div>
      <PlatformSettings />
    </div>
  );
}
