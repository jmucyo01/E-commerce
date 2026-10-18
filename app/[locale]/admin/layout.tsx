import { redirect } from "next/navigation";
import { requireAdmin } from "@/backend/lib/admin";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: "en" | "rw" = rawLocale === "rw" ? "rw" : "en";
  const rw = locale === "rw";

  if (!(await requireAdmin())) redirect(`/${locale}/login`);

  const links = [
    { href: `/${locale}/admin`, label: rw ? "Incamake" : "Dashboard" },
    { href: `/${locale}/admin/orders`, label: rw ? "Amategeko" : "Orders" },
    { href: `/${locale}/admin/products`, label: rw ? "Ibicuruzwa" : "Products" },
    { href: `/${locale}/admin/clients`, label: rw ? "Abakiriya" : "Clients" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <nav
        className="flex gap-6 text-sm mb-8 pb-4 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        {links.map((l) => (
          <a key={l.href} href={l.href} className="font-medium">
            {l.label}
          </a>
        ))}
      </nav>
      {children}
    </div>
  );
}