"use client";

import { useCart } from "@/frontend/hooks/useCart";
import { ShoppingCart } from "lucide-react";

export function CartBadge({ locale }: { locale: "en" | "rw" }) {
  const { itemCount, openCart } = useCart();

  return (
    <button onClick={openCart} className="flex items-center gap-1.5 relative">
      <ShoppingCart size={18} />
      <span className="hidden sm:inline">
        {locale === "rw" ? "Igitebo" : "Cart"}
      </span>
      {itemCount > 0 && (
        <span
          className="absolute -top-2 -right-2 sm:static sm:ml-0.5 text-xs font-medium rounded-full w-4 h-4 flex items-center justify-center"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          {itemCount}
        </span>
      )}
    </button>
  );
}