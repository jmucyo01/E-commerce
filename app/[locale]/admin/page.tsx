import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/backend/lib/admin";
import {
  getDashboardData,
  LOW_STOCK_THRESHOLD,
} from "@/backend/services/admin-dashboard.service";

const STATUS: Record<string, { en: string; rw: string }> = {
  PENDING: { en: "Awaiting payment", rw: "Itegereje kwishyurwa" },
  PAID: { en: "Paid", rw: "Byishyuwe" },
  FAILED: { en: "Failed", rw: "Ntibyagenze neza" },
  FULFILLED: { en: "Completed", rw: "Byarangiye" },
  CANCELLED: { en: "Cancelled", rw: "Byasheshwe" },
};

function formatDate(d: Date) {
  return d.toLocaleString("en-GB", {
    timeZone: "Africa/Kigali",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  if (!(await requireAdmin())) notFound();

  const { locale: rawLocale } = await params;
  const locale: "en" | "rw" = rawLocale === "rw" ? "rw" : "en";
  const rw = locale === "rw";
  const t = (en: string, rwText: string) => (rw ? rwText : en);

  const data = await getDashboardData();

  const muted = { color: "var(--steel)" };
  const card = { borderColor: "var(--border)", background: "var(--surface)" };
  const short = (id: string) => id.slice(-8).toUpperCase();

  const stats = [
    { label: t("Today", "Uyu munsi"), ...data.today },
    { label: t("This week", "Iki cyumweru"), ...data.week },
    { label: t("This month", "Uku kwezi"), ...data.month },
  ];

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-xl font-semibold">{t("Dashboard", "Incamake")}</h1>

      <section>
        <div className="grid sm:grid-cols-3 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="border p-5" style={card}>
              <p className="text-sm" style={muted}>{s.label}</p>
              <p className="font-mono text-2xl mt-1">{s.revenue.toLocaleString()} RWF</p>
              <p className="text-sm mt-1" style={muted}>
                {s.orders} {t(s.orders === 1 ? "paid order" : "paid orders", "amategeko yishyuwe")}
              </p>
            </div>
          ))}
        </div>
        <p className="text-xs mt-2" style={muted}>
          {t(
            "Counted by the date the order was placed, for paid and completed orders.",
            "Bibarwa hakurikijwe itariki itegeko ryatangiweho, ku mategeko yishyuwe cyangwa yarangiye."
          )}
        </p>
      </section>

      <div className="grid md:grid-cols-2 gap-6 items-start">
        <section className="border p-5" style={card}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium">
              {t("Paid, waiting to be completed", "Byishyuwe, bitegereje kurangira")} ({data.awaitingCount})
            </h2>
            {data.awaitingCount > 5 && (
              <Link href={`/${locale}/admin/orders?status=PAID`} className="text-sm underline">
                {t("See all", "Reba byose")}
              </Link>
            )}
          </div>
          {data.awaiting.length === 0 ? (
            <p className="text-sm" style={muted}>{t("Nothing waiting.", "Nta kintu gitegereje.")}</p>
          ) : (
            <div className="flex flex-col divide-y text-sm" style={{ borderColor: "var(--border)" }}>
              {data.awaiting.map((o) => (
                <Link
                  key={o.id}
                  href={`/${locale}/admin/orders/${o.id}`}
                  className="flex justify-between py-2"
                >
                  <span>
                    <span className="font-mono text-xs">{short(o.id)}</span> · {o.user.name}
                    <span className="block text-xs" style={muted}>{formatDate(o.createdAt)}</span>
                  </span>
                  <span className="font-mono">{Number(o.totalRwf).toLocaleString()}</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="border p-5" style={card}>
          <h2 className="font-medium mb-3">
            {t("Low stock", "Ibicuruzwa bigiye gushira")} (≤ {LOW_STOCK_THRESHOLD})
          </h2>
          {data.lowStock.length === 0 ? (
            <p className="text-sm" style={muted}>{t("All products are well stocked.", "Ibicuruzwa byose birahagije.")}</p>
          ) : (
            <div className="flex flex-col divide-y text-sm" style={{ borderColor: "var(--border)" }}>
              {data.lowStock.map((p) => (
                <Link
                  key={p.id}
                  href={`/${locale}/admin/products/${p.id}`}
                  className="flex justify-between py-2"
                >
                  <span>
                    {p.nameEn}
                    <span className="block text-xs font-mono" style={muted}>{p.sku}</span>
                  </span>
                  <span style={{ color: p.stockQty === 0 ? "#b3261e" : undefined }}>
                    {p.stockQty === 0 ? t("Out of stock", "Byashize") : p.stockQty}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="border p-5" style={card}>
          <h2 className="font-medium mb-3">{t("Recent orders", "Amategeko aheruka")}</h2>
          {data.recentOrders.length === 0 ? (
            <p className="text-sm" style={muted}>{t("No orders yet.", "Nta tegeko riraba.")}</p>
          ) : (
            <div className="flex flex-col divide-y text-sm" style={{ borderColor: "var(--border)" }}>
              {data.recentOrders.map((o) => (
                <Link
                  key={o.id}
                  href={`/${locale}/admin/orders/${o.id}`}
                  className="flex justify-between py-2"
                >
                  <span>
                    <span className="font-mono text-xs">{short(o.id)}</span> · {o.user.name}
                    <span className="block text-xs" style={muted}>
                      {STATUS[o.status][locale]}
                    </span>
                  </span>
                  <span className="font-mono">{Number(o.totalRwf).toLocaleString()}</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="border p-5" style={card}>
          <h2 className="font-medium mb-3">{t("New clients", "Abakiriya bashya")}</h2>
          {data.newClients.length === 0 ? (
            <p className="text-sm" style={muted}>{t("No clients yet.", "Nta mukiriya uraboneka.")}</p>
          ) : (
            <div className="flex flex-col divide-y text-sm" style={{ borderColor: "var(--border)" }}>
              {data.newClients.map((c) => (
                <Link
                  key={c.id}
                  href={`/${locale}/admin/clients/${c.id}`}
                  className="flex justify-between py-2"
                >
                  <span>
                    {c.name}
                    <span className="block text-xs" style={muted}>{c.email}</span>
                  </span>
                  <span className="text-xs" style={muted}>{formatDate(c.createdAt)}</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}