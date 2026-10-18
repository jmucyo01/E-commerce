import { auth } from "@/backend/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/backend/lib/prisma";
import { CheckoutForm } from "@/frontend/components/CheckoutForm";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: "en" | "rw" = rawLocale === "rw" ? "rw" : "en";

  const session = await auth();

  if (!session?.user?.email) {
    redirect(
      `/${locale}/login?callbackUrl=${encodeURIComponent(`/${locale}/checkout`)}`
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) redirect(`/${locale}/login`);

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold mb-8">
        {locale === "rw" ? "Kwishyura" : "Checkout"}
      </h1>
      <CheckoutForm
        locale={locale}
        name={user.name}
        email={user.email}
        existingPhone={user.phoneNumber}
        pickupAddress={process.env.STORE_PICKUP_ADDRESS ?? null}
      />
    </main>
  );
}