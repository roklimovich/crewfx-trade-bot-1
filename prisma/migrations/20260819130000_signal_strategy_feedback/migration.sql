-- Store the exact strategy evidence present at issuance. Later candles must not rewrite it.
ALTER TABLE "signals" ADD COLUMN "analysisSnapshot" JSONB;

CREATE TYPE "UserSignalVerdict" AS ENUM ('BAD_SIGNAL', 'LOST');

CREATE TABLE "signal_feedback" (
    "id" TEXT NOT NULL,
    "signalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "verdict" "UserSignalVerdict" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "signal_feedback_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "signal_feedback_signalId_userId_key" ON "signal_feedback"("signalId", "userId");
CREATE INDEX "signal_feedback_verdict_createdAt_idx" ON "signal_feedback"("verdict", "createdAt");

ALTER TABLE "signal_feedback" ADD CONSTRAINT "signal_feedback_signalId_fkey"
  FOREIGN KEY ("signalId") REFERENCES "signals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "signal_feedback" ADD CONSTRAINT "signal_feedback_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
