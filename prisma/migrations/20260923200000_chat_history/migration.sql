-- A guest's chats are now grouped by one key in their cookie, instead of one token per chat.
DROP INDEX "ChatConversation_accessToken_key";
ALTER TABLE "ChatConversation" RENAME COLUMN "accessToken" TO "guestKey";
ALTER TABLE "ChatConversation" ALTER COLUMN "guestKey" DROP NOT NULL;

DROP INDEX "ChatConversation_profileId_createdAt_idx";
CREATE INDEX "ChatConversation_profileId_updatedAt_idx" ON "ChatConversation"("profileId", "updatedAt");
CREATE INDEX "ChatConversation_guestKey_updatedAt_idx" ON "ChatConversation"("guestKey", "updatedAt");
