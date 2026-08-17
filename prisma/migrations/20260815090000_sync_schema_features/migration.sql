-- Keep the database in sync with the already-implemented locale, push, AI-localisation,
-- and session-control features.
ALTER TABLE "users" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'en';

ALTER TABLE "ai_analyses" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'en';
DROP INDEX "ai_analyses_signalId_key";
CREATE UNIQUE INDEX "ai_analyses_signalId_locale_key" ON "ai_analyses"("signalId", "locale");

CREATE TABLE "push_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "push_subscriptions_endpoint_key" ON "push_subscriptions"("endpoint");
CREATE INDEX "push_subscriptions_userId_idx" ON "push_subscriptions"("userId");
CREATE INDEX "signal_history_closedAt_idx" ON "signal_history"("closedAt");

ALTER TABLE "push_subscriptions"
  ADD CONSTRAINT "push_subscriptions_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TYPE "AdminActionType" ADD VALUE IF NOT EXISTS 'KICK_USER';
