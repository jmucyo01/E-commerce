import { auth, signOut } from "@/backend/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: "en" | "rw" }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  async function logout() {
    "use server";
    await signOut({ redirect: false });
    redirect(`/${locale}`);
  }

  return (
    <main className="max-w-lg mx-auto px-6 py-16">
      <h1 className="text-2xl font-semibold mb-8">
        {locale === "rw" ? "Konti yanjye" : "My account"}
      </h1>

      <div
        className="border p-6 mb-6"
        style={{ borderColor: "var(--border)" }}
      >
        <p className="text-sm" style={{ color: "var(--steel)" }}>
          {locale === "rw" ? "Amazina" : "Name"}
        </p>
        <p className="font-medium mb-4">{session.user.name}</p>

        <p className="text-sm" style={{ color: "var(--steel)" }}>
          Email
        </p>
        <p className="font-medium">{session.user.email}</p>
      </div>

      <div className="flex flex-col gap-3">
        <Link
          href={`/${locale}/orders`}
          className="px-4 py-2 text-sm font-medium text-center"
          style={{ border: "1px solid var(--border)" }}
        >
          {locale === "rw" ? "Amateka y'ibyo naguze" : "Order history"}
        </Link>

        <form action={logout}>
          <button
            type="submit"
            className="w-full px-4 py-2 text-sm font-medium"
            style={{ background: "var(--ink)", color: "var(--paper)" }}
          >
            {locale === "rw" ? "Sohoka" : "Sign out"}
          </button>
        </form>
      </div>
    </main>
  );
}