import { auth } from "@/backend/lib/auth";
import { prisma } from "@/backend/lib/prisma";
import { getOrderById } from "@/backend/services/order.service";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ locale: "en" | "rw"; orderId: string }>;
}) {
  const { locale, orderId } = await params;
  const rw = locale === "rw";

  const session = await auth();
  if (!session?.user?.email) {
    redirect(
      `/${locale}/login?callbackUrl=${encodeURIComponent(`/${locale}/orders/${orderId}/confirmation`)}`
    );
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  const order = await getOrderById(orderId);
  if (!user || !order || order.userId !== user.id) notFound();

  const paid = order.status === "PAID" || order.status === "FULFILLED";

  return (
    <main className="max-w-lg mx-auto px-6 py-12">
      <h1 className="text-2xl font-semibold mb-2">
        {paid
          ? rw ? "Murakoze, byishyuwe!" : "Thank you, payment received"
          : rw ? "Tegereje kwemeza kwishyura" : "Waiting for payment confirmation"}
      </h1>
      <p className="text-sm mb-8" style={{ color: "var(--steel)" }}>
        {rw ? "Nomero y'itegeko:" : "Order number:"}{" "}
        <span className="font-mono">{order.id.slice(-8).toUpperCase()}</span>
      </p>

      <div
        className="border p-5 mb-6"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <div className="flex flex-col divide-y" style={{ borderColor: "var(--border)" }}>
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between py-3 text-sm">
              <span>
                {item.productNameEn} × {item.quantity}
              </span>
              <span className="font-mono">
                {(Number(item.unitPriceRwf) * item.quantity).toLocaleString()} RWF
              </span>
            </div>
          ))}
        </div>
        <div
          className="flex justify-between pt-4 border-t font-medium"
          style={{ borderColor: "var(--border)" }}
        >
          <span>{rw ? "Igiteranyo" : "Total"}</span>
          <span className="font-mono">{Number(order.totalRwf).toLocaleString()} RWF</span>
        </div>
      </div>

      <div className="flex gap-3">
        <Link
          href={`/${locale}/orders`}
          className="px-5 py-3 text-sm font-medium border"
          style={{ borderColor: "var(--border)" }}
        >
          {rw ? "Amateka y'ibyo naguze" : "My orders"}
        </Link>
        <Link
          href={`/${locale}`}
          className="px-5 py-3 text-sm font-medium"
          style={{ background: "var(--ink)", color: "var(--paper)" }}
        >
          {rw ? "Komeza ugure" : "Continue shopping"}
        </Link>
      </div>
            <div
        className="border p-5 mb-6 text-sm"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <p className="font-medium mb-2">
          {order.fulfillment === "PICKUP"
            ? rw ? "Kwishakira ku iduka" : "Store pickup"
            : rw ? "Kugezwaho" : "Delivery"}
        </p>
        <p>
          {order.recipientName} · {order.recipientPhone}
        </p>
        {order.fulfillment === "DELIVERY" && (
          <p style={{ color: "var(--steel)" }}>
            {order.sector}, {order.district}
            {order.addressDetails ? ` — ${order.addressDetails}` : ""}
          </p>
        )}
        {order.note && (
          <p className="mt-2" style={{ color: "var(--steel)" }}>
            {rw ? "Icyitonderwa:" : "Note:"} {order.note}
          </p>
        )}
      </div>
    </main>
  );
}