export async function sendPasswordResetEmail(
  to: string,
  link: string,
  locale: "en" | "rw"
) {
  const rw = locale === "rw";
  const subject = rw ? "Garura ijambo ry'ibanga" : "Reset your password";
  const html = `
    <p>${
      rw
        ? "Kanda kuri iyi link kugira ngo ushyireho ijambo ry'ibanga rishya. Irarangira nyuma y'isaha imwe."
        : "Click the link below to choose a new password. It expires in 1 hour."
    }</p>
    <p><a href="${link}">${link}</a></p>
    <p>${
      rw
        ? "Niba utabisabye, hita wirengagiza ubu butumwa."
        : "If you didn't ask for this, you can ignore this email."
    }</p>`;

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    if (process.env.NODE_ENV === "production") throw new Error("EMAIL_NOT_CONFIGURED");
    // Local development: no email account needed, the link is printed here.
    console.log(`\n[dev] Password reset link for ${to}:\n${link}\n`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "MaterialsCo <onboarding@resend.dev>",
      to,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    throw new Error(`EMAIL_SEND_FAILED: ${res.status} ${await res.text()}`);
  }
}