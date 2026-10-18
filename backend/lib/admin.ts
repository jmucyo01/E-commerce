import { auth } from "@/backend/lib/auth";
import { prisma } from "@/backend/lib/prisma";

// Returns the admin user, or null. Call this at the top of every admin page and action.
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) return null;

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  return user && user.role === "ADMIN" && !user.isBlocked ? user : null;
}