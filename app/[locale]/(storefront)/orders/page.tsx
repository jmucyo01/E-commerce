import { auth } from "@/backend/lib/auth";
import { prisma } from "@/backend/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

const STATUS_LABEL = {
  PENDING: { en: "Awaiting payment", rw: "Itegereje kwishyurwa" },
  PAID: { en: "Paid", rw: "Byishyuwe" },
  FAILED: { en: "Failed", rw: "Ntibyagenze neza" },
  FULFILLED: { en: "Completed", rw: "Byarangiye" },
  CANCELLED: { en: "Cancelled", rw: "Byasheshwe" },
} as const;

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ locale: "en" | "rw" }>;
}) {
  const { locale } = await params;
  const rw = locale === "rw";

  const session = await auth();
  if (!session?.user?.email) {
    redirect(`/${locale}/login?callbackUrl=${encodeURIComponent(`/${locale}/orders`)}`);
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) redirect(`/${locale}/login`);

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold mb-8">
        {rw ? "Amateka y'ibyo naguze" : "My orders"}
      </h1>

      {orders.length === 0 ? (
        <p style={{ color: "var(--steel)" }}>
          {rw ? "Nta cyo uraguze." : "You haven't placed any orders yet."}
        </p>
      ) : (
        <div className="flex flex-col divide-y" style={{ borderColor: "var(--border)" }}>
          {orders.map((order) => {
            const href =
              order.status === "PENDING"
                ? `/${locale}/checkout/${order.id}/pay`
                : `/${locale}/orders/${order.id}/confirmation`;
            return (
              <Link
                key={order.id}
                href={href}
                className="flex items-center justify-between py-4 hover:bg-[var(--surface)]"
              >
                <div>
                  <p className="font-mono text-sm">{order.id.slice(-8).toUpperCase()}</p>
                  <p className="text-xs" style={{ color: "var(--steel)" }}>
                    {order.createdAt.toISOString().slice(0, 10)} ·{" "}
                    {order.items.reduce((n, i) => n + i.quantity, 0)}{" "}
                    {rw ? "ibicuruzwa" : "items"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm">
                    {Number(order.totalRwf).toLocaleString()} RWF
                  </p>
                  <p
                    className="text-xs"
                    style={{
                      color: order.status === "PAID" || order.status === "FULFILLED"
                        ? "var(--in-stock)"
                        : "var(--steel)",
                    }}
                  >
                    {STATUS_LABEL[order.status][locale]}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}