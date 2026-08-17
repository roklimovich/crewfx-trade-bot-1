import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How CrewFX collects, uses, protects, and shares personal data.',
};

const updatedAt = '15 August 2026';

export default function PrivacyPage() {
  return (
    <section className="container max-w-4xl py-16 sm:py-24">
      <p className="text-sm font-medium text-primary">Legal</p>
      <h1 className="mt-3 font-display text-4xl font-medium tracking-tight sm:text-5xl">
        Privacy Policy
      </h1>
      <p className="mt-4 text-sm text-muted-foreground">Last updated: {updatedAt}</p>
      <p className="mt-8 max-w-3xl text-lg leading-relaxed text-muted-foreground">
        CrewFX provides market-analysis signals and related account tools. This policy explains how
        we handle personal data when you use our website, dashboard, notifications, and support
        channels. It is designed to reflect widely used privacy principles, including transparency,
        data minimisation, security, and individual rights.
      </p>

      <div className="mt-12 space-y-10">
        <PolicySection title="1. Data we collect">
          <ul>
            <li>Account details: name, email address, password hash, account status, and role.</li>
            <li>
              Security details: session records, two-factor-authentication settings, IP address, and
              device/browser information used to protect accounts.
            </li>
            <li>
              Optional connected-service details: Telegram identifier, notification subscriptions,
              and a Pocket Option account ID submitted for verification. We never request or store
              broker passwords.
            </li>
            <li>
              Usage and technical data: feature interactions, error logs, and performance
              information needed to operate and improve the service.
            </li>
          </ul>
        </PolicySection>

        <PolicySection title="2. How we use data">
          <ul>
            <li>
              Provide, secure, personalise, and maintain your account and signal-delivery
              preferences.
            </li>
            <li>
              Verify eligibility, prevent fraud or abuse, investigate security incidents, and
              enforce our terms.
            </li>
            <li>
              Communicate account, security, and service updates. Marketing communications, where
              used, should provide a clear opt-out.
            </li>
            <li>
              Improve reliability, analytics, and product design using aggregated or de-identified
              information where practical.
            </li>
          </ul>
        </PolicySection>

        <PolicySection title="3. Legal bases and international rights">
          <p>
            Where GDPR or UK GDPR applies, we process data to perform our contract with you, meet
            legal obligations, pursue legitimate interests such as platform security, or with your
            consent where required. Depending on where you live, you may have rights to access,
            correct, delete, restrict, object to, or port your personal data, and to withdraw
            consent. California residents may also have rights under the CCPA/CPRA, including the
            right to know, correct, delete, and limit certain sensitive-data uses.
          </p>
        </PolicySection>

        <PolicySection title="4. Sharing and processors">
          <p>
            We do not sell personal information. We may share the minimum necessary data with
            service providers that help us host the application, send email or push notifications,
            provide analytics, or deliver support. These providers may process data in other
            countries under appropriate contractual and security safeguards. We may also disclose
            information where required by law or to protect users, CrewFX, or the public.
          </p>
        </PolicySection>

        <PolicySection title="5. Retention and deletion">
          <p>
            We retain account data while your account is active and for as long as reasonably
            necessary for security, legal, tax, dispute-resolution, and record-keeping purposes.
            Security and audit logs may be retained longer when needed to investigate abuse. When
            data is no longer needed, we delete or de-identify it using reasonable measures.
          </p>
        </PolicySection>

        <PolicySection title="6. Security">
          <p>
            We use measures such as encrypted transport, access controls, password hashing, session
            management, audit logs, and least-privilege administration. No online service can
            guarantee absolute security, so please use a unique password and enable two-factor
            authentication when available.
          </p>
        </PolicySection>

        <PolicySection title="7. Children and financial decisions">
          <p>
            CrewFX is not intended for children. Do not use the service where you are below the
            minimum age required in your jurisdiction. Signals are informational only; CrewFX does
            not place trades, provide personalised investment advice, or guarantee outcomes.
          </p>
        </PolicySection>

        <PolicySection title="8. Your choices and contact">
          <p>
            You can update most account and notification settings in your dashboard. To make a
            privacy request, ask a question, or appeal a decision about a request, contact{' '}
            <a className="text-primary hover:underline" href="mailto:privacy@crewfx.app">
              privacy@crewfx.app
            </a>
            . We may need to verify your identity before acting on a request.
          </p>
        </PolicySection>

        <PolicySection title="9. Changes to this policy">
          <p>
            We may update this policy as the service or applicable law changes. Material changes
            will be posted here with a revised date. Continued use after an update is subject to the
            updated policy where permitted by law.
          </p>
        </PolicySection>
      </div>

      <div className="mt-14 border-t border-white/10 pt-6">
        <Link href="/" className="text-sm font-medium text-primary hover:underline">
          Back to CrewFX
        </Link>
      </div>
    </section>
  );
}

function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-xl font-medium">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-7 text-muted-foreground [&_ul]:space-y-2 [&_ul]:pl-5 [&_ul]:marker:text-primary">
        {children}
      </div>
    </section>
  );
}
