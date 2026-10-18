import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/backend/lib/admin";
import {
  getOrderForAdmin,
  markOrderFulfilled,
  cancelUnpaidOrder,
} from "@/backend/services/admin-order.service";
import { ConfirmSubmitButton } from "@/frontend/components/ConfirmSubmitButton";

const STATUS_LABEL = {
  PENDING: { en: "Awaiting payment", rw: "Itegereje kwishyurwa" },
  PAID: { en: "Paid", rw: "Byishyuwe" },
  FAILED: { en: "Failed", rw: "Ntibyagenze neza" },
  FULFILLED: { en: "Completed", rw: "Byarangiye" },
  CANCELLED: { en: "Cancelled", rw: "Byasheshwe" },
} as const;

const PROVIDER_LABEL = {
  MTN_MOMO: "MTN MoMo",
  AIRTEL_MONEY: "Airtel Money",
  CARD: "Card",
} as const;

function formatDate(d: Date) {
  return d.toLocaleString("en-GB", {
    timeZone: "Africa/Kigali",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div
      className="border p-4 text-sm"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <p className="font-medium mb-2">{title}</p>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}

export default async function AdminOrderPage({
  params,
}: {
  params: Promise<{ locale: string; orderId: string }>;
}) {
    if (!(await requireAdmin())) notFound();
  const { locale: rawLocale, orderId } = await params;
  const locale: "en" | "rw" = rawLocale === "rw" ? "rw" : "en";
  const rw = locale === "rw";

  const order = await getOrderForAdmin(orderId);
  if (!order) notFound();

  async function fulfil() {
    "use server";
    if (!(await requireAdmin())) return;
    await markOrderFulfilled(orderId);
    revalidatePath(`/${locale}/admin/orders`);
    revalidatePath(`/${locale}/admin/orders/${orderId}`);
  }

  async function cancel() {
    "use server";
    if (!(await requireAdmin())) return;
    await cancelUnpaidOrder(orderId);
    revalidatePath(`/${locale}/admin/orders`);
    revalidatePath(`/${locale}/admin/orders/${orderId}`);
  }

  const statusColor =
    order.status === "PAID"
      ? "var(--accent)"
      : order.status === "FULFILLED"
        ? "var(--in-stock)"
        : "var(--steel)";

  const muted = { color: "var(--steel)" };

  return (
    <div>
      <Link href={`/${locale}/admin/orders`} className="text-sm underline" style={muted}>
        ← {rw ? "Amategeko yose" : "All orders"}
      </Link>

      <div className="flex items-center justify-between mt-3 mb-6">
        <div>
          <h1 className="text-xl font-semibold font-mono">
            {order.id.slice(-8).toUpperCase()}
          </h1>
          <p className="text-sm" style={muted}>
            {formatDate(order.createdAt)}
          </p>
        </div>
        <span className="text-sm font-medium" style={{ color: statusColor }}>
          {STATUS_LABEL[order.status][locale]}
        </span>
      </div>

      <div className="grid md:grid-cols-5 gap-8 items-start">
        <section className="md:col-span-3">
          <h2 className="font-medium mb-3">{rw ? "Ibyaguzwe" : "Items"}</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b" style={{ borderColor: "var(--border)" }}>
                <th className="py-2">{rw ? "Igicuruzwa" : "Product"}</th>
                <th className="py-2">{rw ? "Umubare" : "Qty"}</th>
                <th className="py-2 text-right">{rw ? "Igiciro" : "Price"}</th>
                <th className="py-2 text-right">{rw ? "Yose" : "Line total"}</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-b" style={{ borderColor: "var(--border)" }}>
                  <td className="py-2">{item.productNameEn}</td>
                  <td className="py-2">{item.quantity}</td>
                  <td className="py-2 text-right font-mono">
                    {Number(item.unitPriceRwf).toLocaleString()}
                  </td>
                  <td className="py-2 text-right font-mono">
                    {(Number(item.unitPriceRwf) * item.quantity).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-between pt-4 font-medium">
            <span>{rw ? "Igiteranyo" : "Total"}</span>
            <span className="font-mono">{Number(order.totalRwf).toLocaleString()} RWF</span>
          </div>
        </section>

        <aside className="md:col-span-2 flex flex-col gap-4">
          <Block title={rw ? "Umukiriya" : "Customer"}>
            <span>{order.user.name}</span>
            <span style={muted}>{order.user.email}</span>
            {order.user.phoneNumber && <span style={muted}>{order.user.phoneNumber}</span>}
          </Block>

          <Block
            title={
              order.fulfillment === "PICKUP"
                ? rw ? "Kwishakira ku iduka" : "Store pickup"
                : rw ? "Kugezwaho" : "Delivery"
            }
          >
            <span>
              {order.recipientName ?? "—"} · {order.recipientPhone ?? "—"}
            </span>
            {order.fulfillment === "DELIVERY" && (
              <span style={muted}>
                {[order.sector, order.district].filter(Boolean).join(", ")}
                {order.addressDetails ? ` — ${order.addressDetails}` : ""}
              </span>
            )}
          </Block>

          {order.note && (
            <Block title={rw ? "Icyitonderwa cy'umukiriya" : "Customer note"}>
              <span>{order.note}</span>
            </Block>
          )}

          <Block title={rw ? "Kwishyura" : "Payment"}>
            <span>
              {order.paymentProvider ? PROVIDER_LABEL[order.paymentProvider] : "—"} ·{" "}
              {order.payerPhone ?? "—"}
            </span>
            {order.providerTxRef && (
              <span className="font-mono text-xs break-all" style={muted}>
                {order.providerTxRef}
              </span>
            )}
          </Block>

          {order.status === "PAID" && (
            <ConfirmSubmitButton
              action={fulfil}
              message={
                rw
                  ? "Emeza ko iri tegeko ryarangiye?"
                  : "Mark this order as completed? This can't be undone."
              }
              className="w-full px-4 py-3 text-sm font-medium"
              style={{ background: "var(--ink)", color: "var(--paper)" }}
            >
              {rw ? "Emeza ko byarangiye" : "Mark as completed"}
            </ConfirmSubmitButton>
          )}

          {order.status === "PENDING" && !order.providerTxRef && (
            <ConfirmSubmitButton
              action={cancel}
              message={rw ? "Sesa iri tegeko?" : "Cancel this order?"}
              className="w-full px-4 py-3 text-sm font-medium border"
              style={{ borderColor: "#b3261e", color: "#b3261e" }}
            >
              {rw ? "Sesa itegeko" : "Cancel order"}
            </ConfirmSubmitButton>
          )}

          {order.status === "PENDING" && order.providerTxRef && (
            <p className="text-xs" style={muted}>
              {rw
                ? "Hoherejwe icyifuzo cyo kwishyura. Ntishobora gusesa kugeza gikemutse."
                : "A payment request was sent for this order, so it can't be cancelled while it may still be approved."}
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}