-- CreateEnum
CREATE TYPE "ChatStatus" AS ENUM ('BOT', 'WAITING', 'WITH_PHARMACIST', 'CLOSED');

-- CreateEnum
CREATE TYPE "ChatSeverity" AS ENUM ('MODERATE', 'SEVERE', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "ChatRole" AS ENUM ('CUSTOMER', 'ASSISTANT', 'PHARMACIST', 'SYSTEM');

-- CreateTable
CREATE TABLE "ChatConversation" (
    "id" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "profileId" UUID,
    "ipHash" TEXT,
    "status" "ChatStatus" NOT NULL DEFAULT 'BOT',
    "severity" "ChatSeverity",
    "handoverReason" TEXT,
    "handoverNote" TEXT,
    "pharmacistId" UUID,
    "handedOverAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "ChatRole" NOT NULL,
    "content" TEXT NOT NULL,
    "productIds" TEXT[],
    "authorId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChatConversation_accessToken_key" ON "ChatConversation"("accessToken");

-- CreateIndex
CREATE INDEX "ChatConversation_status_handedOverAt_idx" ON "ChatConversation"("status", "handedOverAt");

-- CreateIndex
CREATE INDEX "ChatConversation_profileId_createdAt_idx" ON "ChatConversation"("profileId", "createdAt");

-- CreateIndex
CREATE INDEX "ChatConversation_ipHash_createdAt_idx" ON "ChatConversation"("ipHash", "createdAt");

-- CreateIndex
CREATE INDEX "ChatMessage_conversationId_createdAt_idx" ON "ChatMessage"("conversationId", "createdAt");

-- AddForeignKey
ALTER TABLE "ChatConversation" ADD CONSTRAINT "ChatConversation_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatConversation" ADD CONSTRAINT "ChatConversation_pharmacistId_fkey" FOREIGN KEY ("pharmacistId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ChatConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Keep the chat tables out of Supabase's public REST API, like every other table.
ALTER TABLE "ChatConversation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChatMessage" ENABLE ROW LEVEL SECURITY;
