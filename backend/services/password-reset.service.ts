import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/backend/lib/prisma";

const TTL_MS = 60 * 60 * 1000; // links last 1 hour
const THROTTLE_MS = 60 * 1000; // at most one new link per minute per account
const PREFIX = "reset:";

// Only the hash is stored, so a leaked database doesn't contain usable links.
function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createResetToken(
  email: string
): Promise<{ token: string; email: string } | null> {
  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });
  if (!user) return null;

  const identifier = `${PREFIX}${user.email}`;

  const existing = await prisma.verificationToken.findFirst({
    where: { identifier },
    orderBy: { expires: "desc" },
  });
  if (existing && existing.expires.getTime() - Date.now() > TTL_MS - THROTTLE_MS) {
    return null; // a link was issued under a minute ago
  }

  await prisma.verificationToken.deleteMany({ where: { identifier } });

  const token = randomBytes(32).toString("base64url");
  await prisma.verificationToken.create({
    data: {
      identifier,
      token: hashToken(token),
      expires: new Date(Date.now() + TTL_MS),
    },
  });

  return { token, email: user.email };
}

export async function isResetTokenValid(token: string) {
  const record = await prisma.verificationToken.findUnique({
    where: { token: hashToken(token) },
  });
  return Boolean(
    record && record.identifier.startsWith(PREFIX) && record.expires > new Date()
  );
}

export async function resetPassword(
  token: string,
  newPassword: string
): Promise<"ok" | "invalid"> {
  const hashed = hashToken(token);
  const record = await prisma.verificationToken.findUnique({ where: { token: hashed } });

  if (!record || !record.identifier.startsWith(PREFIX) || record.expires <= new Date()) {
    return "invalid";
  }

  const email = record.identifier.slice(PREFIX.length);
  const passwordHash = await bcrypt.hash(newPassword, 10);

  return prisma.$transaction(async (tx) => {
    // Deleting the token is what claims it: if two requests race, only one wins.
    const claimed = await tx.verificationToken.deleteMany({
      where: { token: hashed, expires: { gt: new Date() } },
    });
    if (claimed.count !== 1) return "invalid" as const;

    await tx.user.update({ where: { email }, data: { passwordHash } });
    await tx.verificationToken.deleteMany({ where: { identifier: record.identifier } });
    return "ok" as const;
  });
}