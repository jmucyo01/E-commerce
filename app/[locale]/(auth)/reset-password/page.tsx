import { redirect } from "next/navigation";
import {
  isResetTokenValid,
  resetPassword,
} from "@/backend/services/password-reset.service";
import { SubmitButton } from "@/frontend/components/SubmitButton";

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: "en" | "rw" = rawLocale === "rw" ? "rw" : "en";
  const rw = locale === "rw";
  const { token = "", error } = await searchParams;

  const valid = token ? await isResetTokenValid(token) : false;

  async function reset(formData: FormData) {
    "use server";
    const token = String(formData.get("token") ?? "");
    const password = String(formData.get("password") ?? "");
    const confirm = String(formData.get("confirmPassword") ?? "");

    const back = (err: string): never =>
      redirect(`/${locale}/reset-password?token=${encodeURIComponent(token)}&error=${err}`);

    if (password !== confirm) back("mismatch");
    if (password.length < 8) back("weak");

    const result = await resetPassword(token, password);
    if (result !== "ok") redirect(`/${locale}/reset-password`);

    redirect(`/${locale}/login?reset=1`);
  }

  if (!valid) {
    return (
      <main className="max-w-sm mx-auto px-6 py-16">
        <h1 className="text-2xl font-semibold mb-2">
          {rw ? "Link ntikora" : "This link isn't valid"}
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--steel)" }}>
          {rw
            ? "Iyi link yararangiye cyangwa yamaze gukoreshwa. Saba indi."
            : "It has expired or was already used. Request a new one."}
        </p>
        <a
          href={`/${locale}/forgot-password`}
          className="inline-block px-5 py-3 text-sm font-medium"
          style={{ background: "var(--ink)", color: "var(--paper)" }}
        >
          {rw ? "Saba link nshya" : "Request a new link"}
        </a>
      </main>
    );
  }

  const messages: Record<string, { en: string; rw: string }> = {
    mismatch: {
      en: "Passwords do not match.",
      rw: "Amagambo y'ibanga ntahura.",
    },
    weak: {
      en: "Password must be at least 8 characters.",
      rw: "Ijambo ry'ibanga rigomba kuba nibura inyuguti 8.",
    },
  };

  return (
    <main className="max-w-sm mx-auto px-6 py-16">
      <h1 className="text-2xl font-semibold mb-6">
        {rw ? "Shyiraho ijambo ry'ibanga rishya" : "Choose a new password"}
      </h1>

      {error && messages[error] && (
        <div
          className="mb-4 px-4 py-3 text-sm"
          style={{ background: "#fdeeea", color: "#b3261e", border: "1px solid #f5c2ba" }}
        >
          {rw ? messages[error].rw : messages[error].en}
        </div>
      )}

      <form action={reset} className="flex flex-col gap-4">
        <input type="hidden" name="token" value={token} />
        <input
          name="password"
          type="password"
          placeholder={rw ? "Ijambo banga rishya" : "New password"}
          required
          minLength={8}
          className="border px-3 py-2"
          style={{ borderColor: "var(--border)" }}
        />
        <input
          name="confirmPassword"
          type="password"
          placeholder={rw ? "Emeza ijambo banga" : "Confirm password"}
          required
          minLength={8}
          className="border px-3 py-2"
          style={{ borderColor: "var(--border)" }}
        />
        <SubmitButton labelEn="Save new password" labelRw="Bika ijambo ry'ibanga" locale={locale} />
      </form>
    </main>
  );
}