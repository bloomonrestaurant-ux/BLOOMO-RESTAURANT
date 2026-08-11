-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN     "familyPrice" DECIMAL(10,2),
ADD COLUMN     "halfPrice" DECIMAL(10,2),
ADD COLUMN     "isMultiSize" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "DailyItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'kg',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyItem_pkey" PRIMARY KEY ("id")
);
