-- Supports the notification dropdown's per-user unread/read feeds ordered by newest first.
CREATE INDEX "notifications_userId_createdAt_idx"
ON "notifications"("userId", "createdAt" DESC);

CREATE INDEX "notifications_userId_readAt_createdAt_idx"
ON "notifications"("userId", "readAt", "createdAt" DESC);
