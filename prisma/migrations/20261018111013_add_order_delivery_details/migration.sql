-- CreateEnum
CREATE TYPE "FulfillmentMethod" AS ENUM ('DELIVERY', 'PICKUP');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "addressDetails" TEXT,
ADD COLUMN     "district" TEXT,
ADD COLUMN     "fulfillment" "FulfillmentMethod" NOT NULL DEFAULT 'DELIVERY',
ADD COLUMN     "note" TEXT,
ADD COLUMN     "recipientName" TEXT,
ADD COLUMN     "recipientPhone" TEXT,
ADD COLUMN     "sector" TEXT;
