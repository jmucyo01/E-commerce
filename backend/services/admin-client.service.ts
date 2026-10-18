import { prisma } from "@/backend/lib/prisma";
import { RW_PHONE_REGEX } from "@/backend/lib/rwanda";

type Result =
  | { ok: true }
  | { ok: false; error: "NOT_FOUND" | "SELF" | "INVALID_NAME" | "INVALID_PHONE" };

export async function getClientsForAdmin(search?: string) {
  const q = search?.trim();

  const users = await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phoneNumber: { contains: q } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    // Never select passwordHash.
    select: {
      id: true,
      name: true,
      email: true,
      phoneNumber: true,
      role: true,
      isBlocked: true,
      createdAt: true,
    },
  });

  const stats = await prisma.order.groupBy({
    by: ["userId"],
    where: { userId: { in: users.map((u) => u.id) }, status: { in: ["PAID", "FULFILLED"] } },
    _count: { _all: true },
    _sum: { totalRwf: true },
  });
  const byUser = new Map(stats.map((s) => [s.userId, s]));

  return users.map((u) => ({
    ...u,
    paidOrders: byUser.get(u.id)?._count._all ?? 0,
    spentRwf: Number(byUser.get(u.id)?._sum.totalRwf ?? 0),
  }));
}

export async function getClientForAdmin(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phoneNumber: true,
      role: true,
      isBlocked: true,
      createdAt: true,
      orders: {
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          status: true,
          totalRwf: true,
          createdAt: true,
          fulfillment: true,
          district: true,
        },
      },
    },
  });
  if (!user) return null;

  const paid = await prisma.order.aggregate({
    where: { userId: id, status: { in: ["PAID", "FULFILLED"] } },
    _count: { _all: true },
    _sum: { totalRwf: true },
  });

  return {
    ...user,
    paidOrders: paid._count._all,
    spentRwf: Number(paid._sum.totalRwf ?? 0),
  };
}

// Email is deliberately not editable: it's the account's identity.
export async function updateClientDetails(
  id: string,
  input: { name: string; phoneNumber: string }
): Promise<Result> {
  const name = input.name.trim();
  const phone = input.phoneNumber.trim();

  if (name.length < 2 || name.length > 80) return { ok: false, error: "INVALID_NAME" };
  if (phone && !RW_PHONE_REGEX.test(phone)) return { ok: false, error: "INVALID_PHONE" };

  const res = await prisma.user.updateMany({
    where: { id },
    data: { name, phoneNumber: phone || null },
  });
  return res.count === 1 ? { ok: true } : { ok: false, error: "NOT_FOUND" };
}

// Nobody can change their own role, so an admin can't demote themselves
// and leave the shop with no admin.
export async function setClientRole(
  actorId: string,
  targetId: string,
  role: "ADMIN" | "CUSTOMER"
): Promise<Result> {
  if (actorId === targetId) return { ok: false, error: "SELF" };
  const res = await prisma.user.updateMany({ where: { id: targetId }, data: { role } });
  return res.count === 1 ? { ok: true } : { ok: false, error: "NOT_FOUND" };
}

export async function setClientBlocked(
  actorId: string,
  targetId: string,
  blocked: boolean
): Promise<Result> {
  if (actorId === targetId) return { ok: false, error: "SELF" };
  const res = await prisma.user.updateMany({
    where: { id: targetId },
    data: { isBlocked: blocked },
  });
  return res.count === 1 ? { ok: true } : { ok: false, error: "NOT_FOUND" };
}