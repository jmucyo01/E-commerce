"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  labelEn,
  labelRw,
  locale,
}: {
  labelEn: string;
  labelRw: string;
  locale: "en" | "rw";
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 text-sm font-medium disabled:opacity-50"
      style={{ background: "var(--ink)", color: "var(--paper)" }}
    >
      {pending
        ? locale === "rw" ? "Birimo gukora..." : "Please wait..."
        : locale === "rw" ? labelRw : labelEn}
    </button>
  );
}