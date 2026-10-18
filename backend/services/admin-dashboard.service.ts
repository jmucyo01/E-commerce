import { prisma } from "@/backend/lib/prisma";
import type { OrderStatus } from "@prisma/client";

// A placeholder, not a business rule: change it to what "running low" means for you.
export const LOW_STOCK_THRESHOLD = 5;

const PAID_STATUSES: OrderStatus[] = ["PAID", "FULFILLED"];
const KIGALI_OFFSET_MS = 2 * 60 * 60 * 1000; // UTC+2, no daylight saving

// Start of today / this week (Monday) / this month, in Kigali time.
function kigaliStart(unit: "day" | "week" | "month"): Date {
  const local = new Date(Date.now() + KIGALI_OFFSET_MS); // UTC getters now read Kigali wall time
  const y = local.getUTCFullYear();
  const m = local.getUTCMonth();
  let d = local.getUTCDate();

  if (unit === "week") d -= (local.getUTCDay() + 6) % 7;
  if (unit === "month") d = 1;

  return new Date(Date.UTC(y, m, d) - KIGALI_OFFSET_MS);
}

async function salesSince(since: Date) {
  const r = await prisma.order.aggregate({
    where: { status: { in: PAID_STATUSES }, createdAt: { gte: since } },
    _sum: { totalRwf: true },
    _count: { _all: true },
  });
  return { revenue: Number(r._sum.totalRwf ?? 0), orders: r._count._all };
}

export async function getDashboardData() {
  const [today, week, month, awaitingCount, awaiting, lowStock, recentOrders, newClients] =
    await Promise.all([
      salesSince(kigaliStart("day")),
      salesSince(kigaliStart("week")),
      salesSince(kigaliStart("month")),
      prisma.order.count({ where: { status: "PAID" } }),
      prisma.order.findMany({
        where: { status: "PAID" },
        orderBy: { createdAt: "asc" }, // longest-waiting first
        take: 5,
        include: { user: { select: { name: true } } },
      }),
      prisma.product.findMany({
        where: { isActive: true, stockQty: { lte: LOW_STOCK_THRESHOLD } },
        orderBy: { stockQty: "asc" },
        take: 10,
        select: { id: true, nameEn: true, sku: true, stockQty: true },
      }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { user: { select: { name: true } } },
      }),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, name: true, email: true, createdAt: true },
      }),
    ]);

  return { today, week, month, awaitingCount, awaiting, lowStock, recentOrders, newClients };
}