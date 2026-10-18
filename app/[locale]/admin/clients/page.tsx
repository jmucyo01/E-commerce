import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/backend/lib/admin";
import { getClientsForAdmin } from "@/backend/services/admin-client.service";

export default async function AdminClientsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  if (!(await requireAdmin())) notFound();

  const { locale: rawLocale } = await params;
  const locale: "en" | "rw" = rawLocale === "rw" ? "rw" : "en";
  const rw = locale === "rw";
  const t = (en: string, rwText: string) => (rw ? rwText : en);

  const q = ((await searchParams).q ?? "").trim().slice(0, 80);
  const clients = await getClientsForAdmin(q);

  const muted = { color: "var(--steel)" };

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">{t("Clients", "Abakiriya")}</h1>

      <form action={`/${locale}/admin/clients`} method="get" className="flex gap-2 mb-6 max-w-md">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder={t("Search name, email or phone", "Shakisha izina, email cyangwa telefone")}
          className="flex-1 border px-3 py-2 text-sm"
          style={{ borderColor: "var(--border)" }}
        />
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium"
          style={{ background: "var(--ink)", color: "var(--paper)" }}
        >
          {t("Search", "Shakisha")}
        </button>
      </form>

      {clients.length === 0 ? (
        <p style={muted}>{t("No clients found.", "Nta mukiriya wabonetse.")}</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b" style={{ borderColor: "var(--border)" }}>
              <th className="py-2">{t("Name", "Izina")}</th>
              <th className="py-2">{t("Phone", "Telefone")}</th>
              <th className="py-2">{t("Role", "Uruhare")}</th>
              <th className="py-2">{t("Status", "Imiterere")}</th>
              <th className="py-2">{t("Paid orders", "Yishyuwe")}</th>
              <th className="py-2">{t("Spent", "Yakoreshejwe")}</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id} className="border-b" style={{ borderColor: "var(--border)" }}>
                <td className="py-2">
                  <div>{c.name}</div>
                  <div className="text-xs" style={muted}>{c.email}</div>
                </td>
                <td className="py-2">{c.phoneNumber ?? "—"}</td>
                <td className="py-2">{c.role === "ADMIN" ? "Admin" : t("Customer", "Umukiriya")}</td>
                <td className="py-2" style={{ color: c.isBlocked ? "#b3261e" : "var(--in-stock)" }}>
                  {c.isBlocked ? t("Blocked", "Yahagaritswe") : t("Active", "Arakora")}
                </td>
                <td className="py-2">{c.paidOrders}</td>
                <td className="py-2 font-mono">{c.spentRwf.toLocaleString()} RWF</td>
                <td className="py-2 text-right">
                  <Link href={`/${locale}/admin/clients/${c.id}`} className="underline">
                    {t("View", "Reba")}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p className="text-xs mt-4" style={muted}>
        {t("Showing up to 100 clients, newest first.", "Hagaragara abakiriya bagera ku 100, abashya mbere.")}
      </p>
    </div>
  );
}