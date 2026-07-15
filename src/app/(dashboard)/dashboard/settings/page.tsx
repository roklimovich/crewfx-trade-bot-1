'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { ProfileSection } from '@/components/dashboard/settings/profile-section';
import { PocketOptionSection } from '@/components/dashboard/settings/pocket-option-section';
import { TelegramSection } from '@/components/dashboard/settings/telegram-section';
import { PushNotificationsSection } from '@/components/dashboard/settings/push-notifications-section';
import { TwoFactorSection } from '@/components/dashboard/settings/two-factor-section';

interface MeResponse {
  id: string;
  email: string;
  name: string | null;
  role: 'ADMIN' | 'MODERATOR' | 'USER';
  twoFactorEnabled: boolean;
  telegram: { username: string | null; linkedAt: string } | null;
  pocketOption: { accountId: string; verified: boolean } | null;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<MeResponse>('/api/auth/me')
      .then(setProfile)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return <p className="text-sm text-danger">Could not load your profile. Try refreshing.</p>;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-medium">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile, integrations, and security.
        </p>
      </div>

      <ProfileSection
        name={profile.name}
        email={profile.email}
        onSaved={(name) => setProfile((p) => (p ? { ...p, name } : p))}
      />

      <PocketOptionSection
        pocketOption={profile.pocketOption}
        onSubmitted={(accountId) =>
          setProfile((p) => (p ? { ...p, pocketOption: { accountId, verified: false } } : p))
        }
      />

      <TelegramSection
        telegram={profile.telegram}
        onLinked={(username) =>
          setProfile((p) =>
            p ? { ...p, telegram: { username, linkedAt: new Date().toISOString() } } : p,
          )
        }
      />

      <PushNotificationsSection />

      {profile.role === 'ADMIN' && (
        <TwoFactorSection
          enabled={profile.twoFactorEnabled}
          onEnabled={() => setProfile((p) => (p ? { ...p, twoFactorEnabled: true } : p))}
        />
      )}
    </div>
  );
}
