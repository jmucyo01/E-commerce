import { prisma } from "@/backend/lib/prisma";
import type { OrderStatus } from "@prisma/client";

export async function getOrdersForAdmin(status?: OrderStatus) {
  return prisma.order.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { name: true, email: true } },
      items: { select: { quantity: true } },
    },
  });
}

export async function getOrderStatusCounts() {
  const rows = await prisma.order.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const counts: Record<string, number> = {};
  for (const row of rows) counts[row.status] = row._count._all;
  return counts;
}

export async function getOrderForAdmin(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      user: { select: { name: true, email: true, phoneNumber: true } },
    },
  });
}

// The status is part of the WHERE clause, so a concurrent change (like a
// payment confirming) makes this a no-op instead of overwriting it.
export async function markOrderFulfilled(id: string) {
  const res = await prisma.order.updateMany({
    where: { id, status: "PAID" },
    data: { status: "FULFILLED" },
  });
  return res.count === 1;
}

// Only orders that never had a payment request sent can be cancelled.
export async function cancelUnpaidOrder(id: string) {
  const res = await prisma.order.updateMany({
    where: { id, status: "PENDING", providerTxRef: null },
    data: { status: "CANCELLED" },
  });
  return res.count === 1;
}