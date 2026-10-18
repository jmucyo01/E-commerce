import { prisma } from "@/backend/lib/prisma";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { SubmitButton } from "@/frontend/components/SubmitButton";
import { GoogleSignInButton } from "@/frontend/components/GoogleSignInButton";

export default async function RegisterPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: "en" | "rw" }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale } = await params;
  const { error } = await searchParams;

  async function register(formData: FormData) {
    "use server";
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    const name = formData.get("name") as string;
    const phoneNumber = formData.get("phoneNumber") as string;

    if (password !== confirmPassword) {
      redirect(`/${locale}/register?error=mismatch`);
    }
    if (password.length < 8) {
      redirect(`/${locale}/register?error=weak`);
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      redirect(`/${locale}/register?error=exists`);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: { email, name, phoneNumber, passwordHash },
    });

    redirect(`/${locale}/login?registered=1`);
  }

  const errorMessages: Record<string, { en: string; rw: string }> = {
    exists: {
      en: "An account with this email already exists.",
      rw: "Konti ifite iyi email isanzwe ibaho.",
    },
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
        {locale === "rw" ? "Kwiyandikisha" : "Create an account"}
      </h1>

      {error && errorMessages[error] && (
        <div
          className="mb-4 px-4 py-3 text-sm"
          style={{ background: "#fdeeea", color: "#b3261e", border: "1px solid #f5c2ba" }}
        >
          {locale === "rw" ? errorMessages[error].rw : errorMessages[error].en}
        </div>
      )}

      <GoogleSignInButton locale={locale} />
      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
        <span className="text-xs" style={{ color: "var(--steel)" }}>
          {locale === "rw" ? "cyangwa" : "or"}
        </span>
        <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
      </div>

      <form action={register} className="flex flex-col gap-4">
        <input
          name="name"
          placeholder={locale === "rw" ? "Amazina" : "Full name"}
          required
          className="border px-3 py-2"
          style={{ borderColor: "var(--border)" }}
        />
        <input
          name="phoneNumber"
          type="tel"
          placeholder={locale === "rw" ? "Numero ya telefone (07XXXXXXXX)" : "Phone number (07XXXXXXXX)"}
          required
          pattern="^0[7][0-9]{8}$"
          title={locale === "rw" ? "Andika nka 0781234567" : "Enter as 0781234567"}
          className="border px-3 py-2"
          style={{ borderColor: "var(--border)" }}
        />
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
          minLength={8}
          className="border px-3 py-2"
          style={{ borderColor: "var(--border)" }}
        />
        <input
          name="confirmPassword"
          type="password"
          placeholder={locale === "rw" ? "Emeza ijambo banga" : "Confirm password"}
          required
          minLength={8}
          className="border px-3 py-2"
          style={{ borderColor: "var(--border)" }}
        />
        <SubmitButton labelEn="Register" labelRw="Iyandikishe" locale={locale} />
      </form>
      <p className="text-sm mt-4" style={{ color: "var(--steel)" }}>
        {locale === "rw" ? "Usanzwe ufite konti?" : "Already have an account?"}{" "}
        <a href={`/${locale}/login`} className="underline">
          {locale === "rw" ? "Injira" : "Log in"}
        </a>
      </p>
    </main>
  );
}