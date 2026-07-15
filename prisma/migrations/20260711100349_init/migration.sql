-- CreateEnum
CREATE TYPE "RoleName" AS ENUM ('ADMIN', 'MODERATOR', 'USER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "SignalDirection" AS ENUM ('BUY', 'SELL');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "SignalStatus" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED', 'WON', 'LOST', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SignalOutcome" AS ENUM ('PENDING', 'WIN', 'LOSS', 'BREAK_EVEN');

-- CreateEnum
CREATE TYPE "IndicatorType" AS ENUM ('RSI', 'EMA', 'SMA', 'MACD', 'ATR', 'ADX', 'CCI', 'VWAP', 'BOLLINGER_BANDS', 'STOCHASTIC', 'PIVOT_POINTS');

-- CreateEnum
CREATE TYPE "Timeframe" AS ENUM ('M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'TELEGRAM', 'PUSH', 'BROWSER');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'READ');

-- CreateEnum
CREATE TYPE "LogLevel" AS ENUM ('INFO', 'WARN', 'ERROR', 'SECURITY');

-- CreateEnum
CREATE TYPE "AdminActionType" AS ENUM ('APPROVE_USER', 'REJECT_USER', 'BLOCK_USER', 'UNBLOCK_USER', 'CHANGE_ROLE', 'UPDATE_SETTING', 'DELETE_SIGNAL', 'IMPERSONATE', 'VERIFY_POCKET_OPTION');

-- CreateEnum
CREATE TYPE "VerificationTokenType" AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET');

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" "RoleName" NOT NULL,
    "permissions" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "roleId" TEXT NOT NULL,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "referredById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "refreshTokenHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pocket_option_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "pocket_option_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telegram_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "telegramId" TEXT NOT NULL,
    "username" TEXT,
    "chatId" TEXT NOT NULL,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "telegram_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_data" (
    "id" TEXT NOT NULL,
    "pair" TEXT NOT NULL,
    "timeframe" "Timeframe" NOT NULL,
    "open" DOUBLE PRECISION NOT NULL,
    "high" DOUBLE PRECISION NOT NULL,
    "low" DOUBLE PRECISION NOT NULL,
    "close" DOUBLE PRECISION NOT NULL,
    "volume" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indicators" (
    "id" TEXT NOT NULL,
    "pair" TEXT NOT NULL,
    "timeframe" "Timeframe" NOT NULL,
    "type" "IndicatorType" NOT NULL,
    "value" JSONB NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "indicators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signals" (
    "id" TEXT NOT NULL,
    "pair" TEXT NOT NULL,
    "direction" "SignalDirection" NOT NULL,
    "entryPrice" DOUBLE PRECISION NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "expirationTime" TIMESTAMP(3) NOT NULL,
    "technicalSummary" TEXT NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL,
    "timeframe" "Timeframe" NOT NULL,
    "status" "SignalStatus" NOT NULL DEFAULT 'PENDING',
    "engineVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "signals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signal_history" (
    "id" TEXT NOT NULL,
    "signalId" TEXT NOT NULL,
    "outcome" "SignalOutcome" NOT NULL DEFAULT 'PENDING',
    "closePrice" DOUBLE PRECISION,
    "pnlPips" DOUBLE PRECISION,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "signal_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_analyses" (
    "id" TEXT NOT NULL,
    "signalId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "reasoning" TEXT NOT NULL,
    "riskHighlights" TEXT NOT NULL,
    "confidenceEstimate" DOUBLE PRECISION NOT NULL,
    "model" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "signalId" TEXT,
    "channel" "NotificationChannel" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs" (
    "id" TEXT NOT NULL,
    "level" "LogLevel" NOT NULL,
    "message" TEXT NOT NULL,
    "context" JSONB,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_actions" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "actionType" "AdminActionType" NOT NULL,
    "targetUserId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "type" "VerificationTokenType" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_SignalIndicators" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "users_roleId_idx" ON "users"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_refreshTokenHash_key" ON "sessions"("refreshTokenHash");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "pocket_option_accounts_verified_idx" ON "pocket_option_accounts"("verified");

-- CreateIndex
CREATE UNIQUE INDEX "pocket_option_accounts_userId_accountId_key" ON "pocket_option_accounts"("userId", "accountId");

-- CreateIndex
CREATE UNIQUE INDEX "telegram_accounts_userId_key" ON "telegram_accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "telegram_accounts_telegramId_key" ON "telegram_accounts"("telegramId");

-- CreateIndex
CREATE UNIQUE INDEX "telegram_accounts_chatId_key" ON "telegram_accounts"("chatId");

-- CreateIndex
CREATE INDEX "market_data_pair_timeframe_timestamp_idx" ON "market_data"("pair", "timeframe", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "market_data_pair_timeframe_timestamp_key" ON "market_data"("pair", "timeframe", "timestamp");

-- CreateIndex
CREATE INDEX "indicators_pair_timeframe_type_idx" ON "indicators"("pair", "timeframe", "type");

-- CreateIndex
CREATE UNIQUE INDEX "indicators_pair_timeframe_type_timestamp_key" ON "indicators"("pair", "timeframe", "type", "timestamp");

-- CreateIndex
CREATE INDEX "signals_pair_createdAt_idx" ON "signals"("pair", "createdAt");

-- CreateIndex
CREATE INDEX "signals_status_idx" ON "signals"("status");

-- CreateIndex
CREATE UNIQUE INDEX "signal_history_signalId_key" ON "signal_history"("signalId");

-- CreateIndex
CREATE INDEX "signal_history_outcome_idx" ON "signal_history"("outcome");

-- CreateIndex
CREATE UNIQUE INDEX "ai_analyses_signalId_key" ON "ai_analyses"("signalId");

-- CreateIndex
CREATE INDEX "notifications_userId_status_idx" ON "notifications"("userId", "status");

-- CreateIndex
CREATE INDEX "notifications_signalId_idx" ON "notifications"("signalId");

-- CreateIndex
CREATE INDEX "logs_level_createdAt_idx" ON "logs"("level", "createdAt");

-- CreateIndex
CREATE INDEX "logs_userId_idx" ON "logs"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_key" ON "settings"("key");

-- CreateIndex
CREATE INDEX "admin_actions_adminId_createdAt_idx" ON "admin_actions"("adminId", "createdAt");

-- CreateIndex
CREATE INDEX "admin_actions_targetUserId_idx" ON "admin_actions"("targetUserId");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_tokenHash_key" ON "verification_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "verification_tokens_userId_type_idx" ON "verification_tokens"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "_SignalIndicators_AB_unique" ON "_SignalIndicators"("A", "B");

-- CreateIndex
CREATE INDEX "_SignalIndicators_B_index" ON "_SignalIndicators"("B");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pocket_option_accounts" ADD CONSTRAINT "pocket_option_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telegram_accounts" ADD CONSTRAINT "telegram_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signal_history" ADD CONSTRAINT "signal_history_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "signals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_analyses" ADD CONSTRAINT "ai_analyses_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "signals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "signals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs" ADD CONSTRAINT "logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_actions" ADD CONSTRAINT "admin_actions_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_actions" ADD CONSTRAINT "admin_actions_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_tokens" ADD CONSTRAINT "verification_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SignalIndicators" ADD CONSTRAINT "_SignalIndicators_A_fkey" FOREIGN KEY ("A") REFERENCES "indicators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SignalIndicators" ADD CONSTRAINT "_SignalIndicators_B_fkey" FOREIGN KEY ("B") REFERENCES "signals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
