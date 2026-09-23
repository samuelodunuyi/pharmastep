-- CreateEnum
CREATE TYPE "LabelStatus" AS ENUM ('DRAFT', 'APPROVED');

-- CreateTable
CREATE TABLE "ProductLabel" (
    "productId" TEXT NOT NULL,
    "directions" TEXT NOT NULL,
    "warnings" TEXT,
    "sourceUrl" TEXT,
    "notes" TEXT,
    "status" "LabelStatus" NOT NULL DEFAULT 'DRAFT',
    "reviewedById" UUID,
    "reviewedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductLabel_pkey" PRIMARY KEY ("productId")
);

-- CreateIndex
CREATE INDEX "ProductLabel_status_idx" ON "ProductLabel"("status");

-- AddForeignKey
ALTER TABLE "ProductLabel" ADD CONSTRAINT "ProductLabel_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductLabel" ADD CONSTRAINT "ProductLabel_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Keep it out of Supabase's public REST API, like every other table.
ALTER TABLE "ProductLabel" ENABLE ROW LEVEL SECURITY;
