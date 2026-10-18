import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/backend/lib/admin";
import {
  getClientForAdmin,
  updateClientDetails,
  setClientRole,
  setClientBlocked,
} from "@/backend/services/admin-client.service";
import { ConfirmSubmitButton } from "@/frontend/components/ConfirmSubmitButton";

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

export default async function AdminClientPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; clientId: string }>;
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  const admin = await requireAdmin();
  if (!admin) notFound();

  const { locale: rawLocale, clientId } = await params;
  const locale: "en" | "rw" = rawLocale === "rw" ? "rw" : "en";
  const rw = locale === "rw";
  const t = (en: string, rwText: string) => (rw ? rwText : en);
  const { notice, error } = await searchParams;

  const client = await getClientForAdmin(clientId);
  if (!client) notFound();

  const isSelf = client.id === admin.id;
  const base = `/${locale}/admin/clients/${clientId}`;
  const nextRole = client.role === "ADMIN" ? "CUSTOMER" : "ADMIN";
  const nextBlocked = !client.isBlocked;

  async function save(formData: FormData) {
    "use server";
    if (!(await requireAdmin())) throw new Error("FORBIDDEN");
    const res = await updateClientDetails(clientId, {
      name: String(formData.get("name") ?? ""),
      phoneNumber: String(formData.get("phoneNumber") ?? ""),
    });
    revalidatePath(base);
    redirect(res.ok ? `${base}?notice=saved` : `${base}?error=${res.error.toLowerCase()}`);
  }

  async function changeRole() {
    "use server";
    const actor = await requireAdmin();
    if (!actor) throw new Error("FORBIDDEN");
    const res = await setClientRole(actor.id, clientId, nextRole);
    revalidatePath(base);
    redirect(res.ok ? `${base}?notice=role` : `${base}?error=${res.error.toLowerCase()}`);
  }

  async function changeBlocked() {
    "use server";
    const actor = await requireAdmin();
    if (!actor) throw new Error("FORBIDDEN");
    const res = await setClientBlocked(actor.id, clientId, nextBlocked);
    revalidatePath(base);
    redirect(
      res.ok
        ? `${base}?notice=${nextBlocked ? "blocked" : "unblocked"}`
        : `${base}?error=${res.error.toLowerCase()}`
    );
  }

  const notices: Record<string, string> = {
    saved: t("Details saved.", "Amakuru yabitswe."),
    role: t("Role updated.", "Uruhare rwahinduwe."),
    blocked: t("Client blocked.", "Umukiriya yahagaritswe."),
    unblocked: t("Client unblocked.", "Umukiriya yemerewe."),
  };
  const errors: Record<string, string> = {
    invalid_name: t("Enter a name of 2 to 80 characters.", "Andika izina riri hagati y'inyuguti 2 na 80."),
    invalid_phone: t("Enter a valid phone (07XXXXXXXX) or leave it empty.", "Andika telefone nziza (07XXXXXXXX) cyangwa uyihe ubusa."),
    self: t("You can't do that to your own account.", "Ntushobora kubikorera konti yawe."),
    not_found: t("Client not found.", "Umukiriya ntabonetse."),
  };

  const muted = { color: "var(--steel)" };
  const card = { borderColor: "var(--border)", background: "var(--surface)" };
  const inputClass = "w-full border px-3 py-2 text-sm";

  return (
    <div>
      <Link href={`/${locale}/admin/clients`} className="text-sm underline" style={muted}>
        ← {t("All clients", "Abakiriya bose")}
      </Link>

      <div className="flex items-center justify-between mt-3 mb-6">
        <div>
          <h1 className="text-xl font-semibold">{client.name}</h1>
          <p className="text-sm" style={muted}>
            {client.email} · {t("joined", "yinjiye")} {formatDate(client.createdAt)}
          </p>
        </div>
        <div className="text-sm text-right">
          <p className="font-medium">{client.role === "ADMIN" ? "Admin" : t("Customer", "Umukiriya")}</p>
          <p style={{ color: client.isBlocked ? "#b3261e" : "var(--in-stock)" }}>
            {client.isBlocked ? t("Blocked", "Yahagaritswe") : t("Active", "Arakora")}
          </p>
        </div>
      </div>

      {notice && notices[notice] && (
        <div
          className="mb-4 px-4 py-3 text-sm"
          style={{ background: "#eaf5ee", color: "#2f6b45", border: "1px solid #bfe2cb" }}
        >
          {notices[notice]}
        </div>
      )}
      {error && errors[error] && (
        <div
          className="mb-4 px-4 py-3 text-sm"
          style={{ background: "#fdeeea", color: "#b3261e", border: "1px solid #f5c2ba" }}
        >
          {errors[error]}
        </div>
      )}

      <div className="grid md:grid-cols-5 gap-8 items-start">
        <section className="md:col-span-3">
          <h2 className="font-medium mb-1">{t("Orders", "Amategeko")}</h2>
          <p className="text-sm mb-3" style={muted}>
            {client.paidOrders} {t("paid", "yishyuwe")} · {client.spentRwf.toLocaleString()} RWF
          </p>

          {client.orders.length === 0 ? (
            <p className="text-sm" style={muted}>{t("No orders yet.", "Nta tegeko riraba.")}</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b" style={{ borderColor: "var(--border)" }}>
                  <th className="py-2">{t("Order", "Itegeko")}</th>
                  <th className="py-2">{t("Date", "Itariki")}</th>
                  <th className="py-2">{t("Total", "Igiteranyo")}</th>
                  <th className="py-2">{t("Status", "Imiterere")}</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {client.orders.map((o) => (
                  <tr key={o.id} className="border-b" style={{ borderColor: "var(--border)" }}>
                    <td className="py-2 font-mono text-xs">{o.id.slice(-8).toUpperCase()}</td>
                    <td className="py-2">{formatDate(o.createdAt)}</td>
                    <td className="py-2 font-mono">{Number(o.totalRwf).toLocaleString()}</td>
                    <td className="py-2">{STATUS[o.status][locale]}</td>
                    <td className="py-2 text-right">
                      <Link href={`/${locale}/admin/orders/${o.id}`} className="underline">
                        {t("View", "Reba")}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <aside className="md:col-span-2 flex flex-col gap-4">
          <form action={save} className="border p-4 flex flex-col gap-3" style={card}>
            <p className="font-medium text-sm">{t("Details", "Amakuru")}</p>
            <div>
              <label className="text-xs block mb-1" style={muted} htmlFor="name">
                {t("Name", "Izina")}
              </label>
              <input id="name" name="name" defaultValue={client.name} maxLength={80} required className={inputClass} style={{ borderColor: "var(--border)" }} />
            </div>
            <div>
              <label className="text-xs block mb-1" style={muted} htmlFor="phoneNumber">
                {t("Phone", "Telefone")}
              </label>
              <input id="phoneNumber" name="phoneNumber" defaultValue={client.phoneNumber ?? ""} placeholder="07XXXXXXXX" className={inputClass} style={{ borderColor: "var(--border)" }} />
            </div>
            <p className="text-xs" style={muted}>
              {t("Email can't be changed: it identifies the account.", "Email ntishobora guhinduka: ni yo iranga konti.")}
            </p>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium"
              style={{ background: "var(--ink)", color: "var(--paper)" }}
            >
              {t("Save details", "Bika amakuru")}
            </button>
          </form>

          <div className="border p-4 flex flex-col gap-3" style={card}>
            <p className="font-medium text-sm">{t("Access", "Uburenganzira")}</p>

            {isSelf ? (
              <p className="text-xs" style={muted}>
                {t(
                  "This is your own account. You can't change your own role or block yourself.",
                  "Iyi ni konti yawe. Ntushobora guhindura uruhare rwawe cyangwa kwihagarika."
                )}
              </p>
            ) : (
              <>
                <ConfirmSubmitButton
                  action={changeRole}
                  message={
                    nextRole === "ADMIN"
                      ? t(`Make ${client.name} an admin? They'll be able to manage products, orders and clients.`, `Hindura ${client.name} admin?`)
                      : t(`Remove admin access from ${client.name}?`, `Kuraho uburenganzira bwa admin bwa ${client.name}?`)
                  }
                  className="w-full px-4 py-2 text-sm font-medium border"
                  style={{ borderColor: "var(--border)" }}
                >
                  {nextRole === "ADMIN" ? t("Make admin", "Mugire admin") : t("Remove admin access", "Kuraho admin")}
                </ConfirmSubmitButton>

                <ConfirmSubmitButton
                  action={changeBlocked}
                  message={
                    nextBlocked
                      ? t(`Block ${client.name}? They won't be able to log in or check out.`, `Hagarika ${client.name}? Ntazashobora kwinjira cyangwa kugura.`)
                      : t(`Unblock ${client.name}?`, `Emerera ${client.name}?`)
                  }
                  className="w-full px-4 py-2 text-sm font-medium border"
                  style={nextBlocked ? { borderColor: "#b3261e", color: "#b3261e" } : { borderColor: "var(--border)" }}
                >
                  {nextBlocked ? t("Block client", "Hagarika umukiriya") : t("Unblock client", "Emerera umukiriya")}
                </ConfirmSubmitButton>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}