/*
  Warnings:

  - A unique constraint covering the columns `[huaweiOpenId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "huaweiOpenId" TEXT,
ADD COLUMN     "huaweiPhone" TEXT,
ADD COLUMN     "huaweiUnionId" TEXT;

-- CreateTable
CREATE TABLE "HuaweiAgentSession" (
    "id" TEXT NOT NULL,
    "agentLoginSessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "huaweiOpenId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "deviceInfo" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "HuaweiAgentSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HuaweiAgentSession_agentLoginSessionId_key" ON "HuaweiAgentSession"("agentLoginSessionId");

-- CreateIndex
CREATE INDEX "HuaweiAgentSession_userId_idx" ON "HuaweiAgentSession"("userId");

-- CreateIndex
CREATE INDEX "HuaweiAgentSession_huaweiOpenId_idx" ON "HuaweiAgentSession"("huaweiOpenId");

-- CreateIndex
CREATE INDEX "HuaweiAgentSession_expiresAt_idx" ON "HuaweiAgentSession"("expiresAt");

-- CreateIndex
CREATE INDEX "HuaweiAgentSession_isRevoked_idx" ON "HuaweiAgentSession"("isRevoked");

-- CreateIndex
CREATE UNIQUE INDEX "User_huaweiOpenId_key" ON "User"("huaweiOpenId");

-- AddForeignKey
ALTER TABLE "HuaweiAgentSession" ADD CONSTRAINT "HuaweiAgentSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
