import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.product.createMany({
    data: [
      {
        sku: "ELEC-001",
        category: "ELECTRONICS",
        nameEn: "LED Bulb 9W",
        nameRw: "Amatara LED 9W",
        descriptionEn: "Energy-saving LED bulb, 9 watts.",
        priceRwf: 2500,
        stockQty: 40,
      },
      {
        sku: "CONS-001",
        category: "CONSTRUCTION",
        nameEn: "Cement Bag 50kg",
        nameRw: "Isima 50kg",
        descriptionEn: "Standard cement, 50kg bag.",
        priceRwf: 12000,
        stockQty: 15,
      },
    ],
  });
}

main()
  .then(() => console.log("Seeded."))
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());