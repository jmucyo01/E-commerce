"use client";

import { useCart } from "@/frontend/hooks/useCart";
import Link from "next/link";
import { use } from "react";
import { Minus, Plus } from "lucide-react";

export default function CartPage({
  params,
}: {
  params: Promise<{ locale: "en" | "rw" }>;
}) {
  const { locale } = use(params);
  const { items, removeItem, updateQuantity, total } = useCart();

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold mb-8">
        {locale === "rw" ? "Igitebo" : "Your cart"}
      </h1>

      {items.length === 0 ? (
        <p style={{ color: "var(--steel)" }}>
          {locale === "rw" ? "Igitebo cyawe kirimo ubusa." : "Your cart is empty."}
        </p>
      ) : (
        <>
          <div className="flex flex-col divide-y" style={{ borderColor: "var(--border)" }}>
            {items.map((item) => (
              <div key={item.productId} className="flex gap-4 py-4">
                <div
                  className="w-20 h-20 shrink-0 flex items-center justify-center overflow-hidden"
                  style={{ background: "var(--paper)", border: "1px solid var(--border)" }}
                >
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : null}
                </div>

                <div className="flex-1 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.nameEn}</p>
                    <p className="font-mono text-sm" style={{ color: "var(--steel)" }}>
                      {item.priceRwf} RWF
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center border"
                        style={{ borderColor: "var(--border)" }}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center border"
                        style={{ borderColor: "var(--border)" }}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="text-sm"
                      style={{ color: "var(--steel)" }}
                    >
                      {locale === "rw" ? "Kuraho" : "Remove"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-8 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
            <span className="font-medium">
              {locale === "rw" ? "Igiteranyo" : "Total"}
            </span>
            <span className="font-mono text-lg">{total.toLocaleString()} RWF</span>
          </div>

          <Link
            href={`/${locale}/checkout`}
            className="block text-center mt-6 px-5 py-3 text-sm font-medium"
            style={{ background: "var(--ink)", color: "var(--paper)" }}
          >
            {locale === "rw" ? "Komeza kwishyura" : "Proceed to checkout"}
          </Link>
        </>
      )}
    </main>
  );
}