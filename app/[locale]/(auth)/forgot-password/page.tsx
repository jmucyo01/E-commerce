import { redirect } from "next/navigation";
import { createResetToken } from "@/backend/services/password-reset.service";
import { sendPasswordResetEmail } from "@/backend/lib/email";
import { SubmitButton } from "@/frontend/components/SubmitButton";

export default async function ForgotPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ sent?: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: "en" | "rw" = rawLocale === "rw" ? "rw" : "en";
  const rw = locale === "rw";
  const { sent } = await searchParams;

  async function requestReset(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "").trim();

    if (email) {
      try {
        const result = await createResetToken(email);
        if (result) {
          const base =
            process.env.APP_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
          const link = `${base}/${locale}/reset-password?token=${result.token}`;
          await sendPasswordResetEmail(result.email, link, locale);
        }
      } catch (err) {
        // Logged for us, but the visitor sees the same message either way.
        console.error("Password reset request failed:", err);
      }
    }

    redirect(`/${locale}/forgot-password?sent=1`);
  }

  return (
    <main className="max-w-sm mx-auto px-6 py-16">
      <h1 className="text-2xl font-semibold mb-2">
        {rw ? "Wibagiwe ijambo ry'ibanga?" : "Forgot your password?"}
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--steel)" }}>
        {rw
          ? "Andika email yawe, tuzakoherereza link yo kuryasimbuza."
          : "Enter your email and we'll send you a link to choose a new one."}
      </p>

      {sent && (
        <div
          className="mb-4 px-4 py-3 text-sm"
          style={{ background: "#eaf5ee", color: "#2f6b45", border: "1px solid #bfe2cb" }}
        >
          {rw
            ? "Niba iyi email ibaho muri konti, twayohereje link. Reba muri inbox yawe."
            : "If an account exists for that email, we've sent a reset link. Check your inbox."}
        </div>
      )}

      <form action={requestReset} className="flex flex-col gap-4">
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          className="border px-3 py-2"
          style={{ borderColor: "var(--border)" }}
        />
        <SubmitButton labelEn="Send reset link" labelRw="Ohereza link" locale={locale} />
      </form>

      <p className="text-sm mt-4" style={{ color: "var(--steel)" }}>
        <a href={`/${locale}/login`} className="underline">
          {rw ? "Subira ku kwinjira" : "Back to log in"}
        </a>
      </p>
    </main>
  );
}