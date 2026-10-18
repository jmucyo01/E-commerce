"use client";

export function DeleteProductButton({
  productId,
  action,
  locale,
}: {
  productId: string;
  action: (formData: FormData) => void;
  locale: "en" | "rw";
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(locale === "rw" ? "Uzi neza?" : "Are you sure?")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={productId} />
      <button type="submit" className="underline" style={{ color: "#b3261e" }}>
        {locale === "rw" ? "Siba" : "Delete"}
      </button>
    </form>
  );
}