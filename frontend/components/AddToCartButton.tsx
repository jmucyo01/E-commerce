"use client";

import { useCart } from "@/frontend/hooks/useCart";

export function AddToCartButton({
  productId,
  nameEn,
  priceRwf,
  imageUrl,
  locale,
}: {
  productId: string;
  nameEn: string;
  priceRwf: string;
  imageUrl: string | null;
  locale: "en" | "rw";
}) {
  const { addItem, openCart } = useCart();

  return (
    <button
      onClick={() => {
        addItem({ productId, nameEn, priceRwf, imageUrl });
        openCart();
      }}
      className="mt-4 px-5 py-2 text-sm font-medium"
      style={{ background: "var(--ink)", color: "var(--paper)" }}
    >
      {locale === "rw" ? "Ongeraho mu gitebo" : "Add to cart"}
    </button>
  );
}