import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) throw new Error("Usage: npx tsx scripts/make-admin.ts <email>");

  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });
  if (!user) throw new Error(`No user with email ${email}. Register on the site first.`);

  await prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
  console.log(`${user.email} is now an admin.`);
}

main()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());