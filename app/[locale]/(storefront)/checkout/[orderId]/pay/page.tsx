import { auth } from "@/backend/lib/auth";
import { prisma } from "@/backend/lib/prisma";
import { getOrderById } from "@/backend/services/order.service";
import { notFound, redirect } from "next/navigation";
import { PayButton } from "@/frontend/components/PayButton";

export default async function PayPage({
  params,
}: {
  params: Promise<{ locale: "en" | "rw"; orderId: string }>;
}) {
  const { locale, orderId } = await params;
  const rw = locale === "rw";

  const session = await auth();
  if (!session?.user?.email) {
    redirect(
      `/${locale}/login?callbackUrl=${encodeURIComponent(`/${locale}/checkout/${orderId}/pay`)}`
    );
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  const order = await getOrderById(orderId);

  // Someone else's order looks exactly like a missing one.
  if (!user || !order || order.userId !== user.id) notFound();

  if (order.status === "PAID") {
    return (
      <main className="max-w-md mx-auto px-6 py-16 text-center">
        <h1 className="text-xl font-semibold mb-2">{rw ? "Byishyuwe" : "Already paid"}</h1>
        <p style={{ color: "var(--steel)" }}>
          {rw ? "Iri tegeko ryamaze kwishyurwa." : "This order has already been paid."}
        </p>
      </main>
    );
  }

  if (order.status !== "PENDING") {
    return (
      <main className="max-w-md mx-auto px-6 py-16 text-center">
        <p style={{ color: "var(--steel)" }}>
          {rw ? "Iri tegeko ntirigishoboye kwishyurwa." : "This order can no longer be paid."}
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto px-6 py-16">
      <h1 className="text-xl font-semibold mb-2">
        {rw ? "Ishyura ibyo waguze" : "Pay for your order"}
      </h1>
      <p className="font-mono text-2xl mb-2">
        {Number(order.totalRwf).toLocaleString()} RWF
      </p>
      <p className="text-sm mb-6" style={{ color: "var(--steel)" }}>
        {rw
          ? `Ubutumwa buzoherezwa kuri ${order.payerPhone} kugira ngo wemeze kwishyura.`
          : `A prompt will be sent to ${order.payerPhone} to approve the payment.`}
      </p>
      <PayButton orderId={order.id} locale={locale} />
    </main>
  );
}