"use client";

import { useCart } from "@/frontend/hooks/useCart";
import { X, Minus, Plus } from "lucide-react";
import Link from "next/link";

export function CartDrawer({ locale }: { locale: "en" | "rw" }) {
  const { items, isOpen, closeCart, updateQuantity, removeItem, total } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.4)" }}
        onClick={closeCart}
      />

      {/* panel */}
      <div
        className="relative w-full max-w-sm h-full flex flex-col"
        style={{ background: "var(--surface)" }}
      >
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <h2 className="font-semibold">
            {locale === "rw" ? "Igitebo" : "Your cart"}
          </h2>
          <button onClick={closeCart}>
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <p style={{ color: "var(--steel)" }}>
              {locale === "rw" ? "Igitebo cyawe kirimo ubusa." : "Your cart is empty."}
            </p>
          ) : (
            <div className="flex flex-col divide-y" style={{ borderColor: "var(--border)" }}>
              {items.map((item) => (
                <div key={item.productId} className="flex gap-3 py-4">
                  <div
                    className="w-16 h-16 shrink-0 flex items-center justify-center overflow-hidden"
                    style={{ background: "var(--paper)", border: "1px solid var(--border)" }}
                  >
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.nameEn}</p>
                    <p className="font-mono text-sm" style={{ color: "var(--steel)" }}>
                      {item.priceRwf} RWF
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="w-6 h-6 flex items-center justify-center border"
                        style={{ borderColor: "var(--border)" }}
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-sm w-5 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center border"
                        style={{ borderColor: "var(--border)" }}
                      >
                        <Plus size={12} />
                      </button>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="text-xs ml-2"
                        style={{ color: "var(--steel)" }}
                      >
                        {locale === "rw" ? "Kuraho" : "Remove"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="px-5 py-4 border-t" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <span className="font-medium">
                {locale === "rw" ? "Igiteranyo" : "Total"}
              </span>
              <span className="font-mono text-lg">{total.toLocaleString()} RWF</span>
            </div>
            <Link
              href={`/${locale}/checkout`}
              onClick={closeCart}
              className="block text-center px-5 py-3 text-sm font-medium"
              style={{ background: "var(--ink)", color: "var(--paper)" }}
            >
              {locale === "rw" ? "Komeza kwishyura" : "Proceed to checkout"}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}