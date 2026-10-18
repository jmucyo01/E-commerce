import { signIn } from "@/backend/lib/auth";
import { redirect } from "next/navigation";
import { SubmitButton } from "@/frontend/components/SubmitButton";
import { GoogleSignInButton } from "@/frontend/components/GoogleSignInButton";

// Only allow same-site relative paths, so ?callbackUrl can't be used for open redirects.
function safePath(path: string | undefined, fallback: string) {
  return path && path.startsWith("/") && !path.startsWith("//") ? path : fallback;
}

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    error?: string;
    registered?: string;
    reset?: string;
    callbackUrl?: string;
  }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: "en" | "rw" = rawLocale === "rw" ? "rw" : "en";
  const { error, registered, reset, callbackUrl } = await searchParams;
  const destination = safePath(callbackUrl, `/${locale}`);

  async function login(formData: FormData) {
    "use server";
    try {
      await signIn("credentials", {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        redirect: false,
      });
    } catch {
      redirect(`/${locale}/login?error=1&callbackUrl=${encodeURIComponent(destination)}`);
    }
    redirect(destination);
  }

  const success = { background: "#eaf5ee", color: "#2f6b45", border: "1px solid #bfe2cb" };

  return (
    <main className="max-w-sm mx-auto px-6 py-16">
      <h1 className="text-2xl font-semibold mb-6">
        {locale === "rw" ? "Kwinjira" : "Log in"}
      </h1>

      {registered && (
        <div className="mb-4 px-4 py-3 text-sm" style={success}>
          {locale === "rw"
            ? "Kwiyandikisha byagenze neza. Injira hano."
            : "Account created. You can log in now."}
        </div>
      )}

      {reset && (
        <div className="mb-4 px-4 py-3 text-sm" style={success}>
          {locale === "rw"
            ? "Ijambo ry'ibanga ryahinduwe. Injira hano."
            : "Password updated. You can log in now."}
        </div>
      )}

      {error && (
        <div
          className="mb-4 px-4 py-3 text-sm"
          style={{ background: "#fdeeea", color: "#b3261e", border: "1px solid #f5c2ba" }}
        >
          {locale === "rw"
            ? "Email cyangwa ijambo ry'ibanga sibyo."
            : "Incorrect email or password."}
        </div>
      )}

      <GoogleSignInButton locale={locale} callbackUrl={destination} />
      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
        <span className="text-xs" style={{ color: "var(--steel)" }}>
          {locale === "rw" ? "cyangwa" : "or"}
        </span>
        <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
      </div>

      <form action={login} className="flex flex-col gap-4">
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          className="border px-3 py-2"
          style={{ borderColor: "var(--border)" }}
        />
        <input
          name="password"
          type="password"
          placeholder={locale === "rw" ? "Ijambo banga" : "Password"}
          required
          className="border px-3 py-2"
          style={{ borderColor: "var(--border)" }}
        />
        <SubmitButton labelEn="Log in" labelRw="Injira" locale={locale} />
      </form>

      <p className="text-sm mt-3">
        <a
          href={`/${locale}/forgot-password`}
          className="underline"
          style={{ color: "var(--steel)" }}
        >
          {locale === "rw" ? "Wibagiwe ijambo ry'ibanga?" : "Forgot your password?"}
        </a>
      </p>
      <p className="text-sm mt-4" style={{ color: "var(--steel)" }}>
        {locale === "rw" ? "Nta konti ufite?" : "Don't have an account?"}{" "}
        <a href={`/${locale}/register`} className="underline">
          {locale === "rw" ? "Iyandikishe" : "Register"}
        </a>
      </p>
    </main>
  );
}