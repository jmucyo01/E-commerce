import { notFound } from "next/navigation";
import { requireAdmin } from "@/backend/lib/admin";
import Link from "next/link";
import type { OrderStatus } from "@prisma/client";
import {
  getOrdersForAdmin,
  getOrderStatusCounts,
} from "@/backend/services/admin-order.service";

const FILTERS: OrderStatus[] = ["PAID", "PENDING", "FULFILLED", "CANCELLED"];

const LABEL: Record<string, { en: string; rw: string }> = {
  ALL: { en: "All", rw: "Byose" },
  PAID: { en: "Paid", rw: "Byishyuwe" },
  PENDING: { en: "Awaiting payment", rw: "Bitegereje kwishyurwa" },
  FULFILLED: { en: "Completed", rw: "Byarangiye" },
  CANCELLED: { en: "Cancelled", rw: "Byasheshwe" },
  FAILED: { en: "Failed", rw: "Ntibyagenze neza" },
};

function formatDate(d: Date) {
  return d.toLocaleString("en-GB", {
    timeZone: "Africa/Kigali",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function AdminOrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
    if (!(await requireAdmin())) notFound();
  const { locale: rawLocale } = await params;
  const locale: "en" | "rw" = rawLocale === "rw" ? "rw" : "en";
  const rw = locale === "rw";

  const { status } = await searchParams;
  const active = FILTERS.find((s) => s === status);

  const [orders, counts] = await Promise.all([
    getOrdersForAdmin(active),
    getOrderStatusCounts(),
  ]);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  const tabs: { key: string; href: string; count: number }[] = [
    { key: "ALL", href: `/${locale}/admin/orders`, count: total },
    ...FILTERS.map((s) => ({
      key: s,
      href: `/${locale}/admin/orders?status=${s}`,
      count: counts[s] ?? 0,
    })),
  ];

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">{rw ? "Amategeko" : "Orders"}</h1>

      <div className="flex flex-wrap gap-2 mb-6 text-sm">
        {tabs.map((tab) => {
          const selected = (active ?? "ALL") === tab.key;
          return (
            <Link
              key={tab.key}
              href={tab.href}
              className="px-3 py-1.5 border"
              style={{
                borderColor: selected ? "var(--ink)" : "var(--border)",
                background: selected ? "var(--ink)" : "transparent",
                color: selected ? "var(--paper)" : "inherit",
              }}
            >
              {LABEL[tab.key][locale]} · {tab.count}
            </Link>
          );
        })}
      </div>

      {orders.length === 0 ? (
        <p style={{ color: "var(--steel)" }}>
          {rw ? "Nta mategeko ahari." : "No orders here yet."}
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b" style={{ borderColor: "var(--border)" }}>
              <th className="py-2">{rw ? "Itegeko" : "Order"}</th>
              <th className="py-2">{rw ? "Itariki" : "Date"}</th>
              <th className="py-2">{rw ? "Umukiriya" : "Customer"}</th>
              <th className="py-2">{rw ? "Uko bikirwa" : "Receiving"}</th>
              <th className="py-2">{rw ? "Igiteranyo" : "Total"}</th>
              <th className="py-2">{rw ? "Imiterere" : "Status"}</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b" style={{ borderColor: "var(--border)" }}>
                <td className="py-2 font-mono text-xs">
                  {order.id.slice(-8).toUpperCase()}
                </td>
                <td className="py-2">{formatDate(order.createdAt)}</td>
                <td className="py-2">
                  <div>{order.user.name}</div>
                  <div className="text-xs" style={{ color: "var(--steel)" }}>
                    {order.items.reduce((n, i) => n + i.quantity, 0)} {rw ? "ibicuruzwa" : "items"}
                  </div>
                </td>
                <td className="py-2">
                  {order.fulfillment === "PICKUP"
                    ? rw ? "Kwishakira" : "Pickup"
                    : `${rw ? "Kugezwaho" : "Delivery"} · ${order.district ?? "—"}`}
                </td>
                <td className="py-2 font-mono">
                  {Number(order.totalRwf).toLocaleString()} RWF
                </td>
                <td
                  className="py-2"
                  style={{
                    color:
                      order.status === "PAID"
                        ? "var(--accent)"
                        : order.status === "FULFILLED"
                          ? "var(--in-stock)"
                          : "var(--steel)",
                  }}
                >
                  {LABEL[order.status][locale]}
                </td>
                <td className="py-2 text-right">
                  <Link href={`/${locale}/admin/orders/${order.id}`} className="underline">
                    {rw ? "Reba" : "View"}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p className="text-xs mt-4" style={{ color: "var(--steel)" }}>
        {rw ? "Hagaragara amategeko 100 aheruka." : "Showing the 100 most recent orders."}
      </p>
    </div>
  );
}