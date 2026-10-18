import {
  getProductById,
  localizedName,
  localizedDescription,
} from "@/backend/services/product.service";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/frontend/components/AddToCartButton";
import { Zap, HardHat, ChevronRight } from "lucide-react";
import Link from "next/link";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ locale: "en" | "rw"; id: string }>;
}) {
  const { locale, id } = await params;
  const product = await getProductById(id);

  if (!product) notFound();

  const localeEnum = locale === "rw" ? "RW" : "EN";
  const categoryLabel =
    product.category === "ELECTRONICS"
      ? locale === "rw" ? "Amashanyarazi" : "Electronics"
      : locale === "rw" ? "Ubwubatsi" : "Construction";

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <nav
        className="flex items-center gap-1.5 text-sm mb-8"
        style={{ color: "var(--steel)" }}
      >
        <Link href={`/${locale}`} className="hover:underline">
          {locale === "rw" ? "Ahabanza" : "Home"}
        </Link>
        <ChevronRight size={14} />
        <span>{categoryLabel}</span>
        <ChevronRight size={14} />
        <span style={{ color: "var(--ink)" }}>
          {localizedName(product, localeEnum)}
        </span>
      </nav>

      <div className="grid md:grid-cols-2 gap-10">
        <div
          className="aspect-square flex items-center justify-center"
          style={{ background: "var(--paper)", border: "1px solid var(--border)" }}
        >
          {product.category === "ELECTRONICS" ? (
            <Zap size={96} strokeWidth={1.25} style={{ color: "var(--accent)" }} />
          ) : (
            <HardHat size={96} strokeWidth={1.25} style={{ color: "var(--accent)" }} />
          )}
        </div>

        <div className="flex flex-col">
          <span
            className="text-xs uppercase tracking-wide mb-2"
            style={{ color: "var(--steel)" }}
          >
            {categoryLabel}
          </span>
          <h1 className="text-2xl font-semibold mb-3">
            {localizedName(product, localeEnum)}
          </h1>
          <p className="font-mono text-2xl mb-4">
            {product.priceRwf.toString()} RWF
          </p>

          <p
            className="text-sm font-medium mb-6"
            style={{ color: product.stockQty > 0 ? "var(--in-stock)" : "var(--steel)" }}
          >
            {product.stockQty > 0
              ? locale === "rw"
                ? `Birahari: ${product.stockQty}`
                : `${product.stockQty} in stock`
              : locale === "rw"
                ? "Ntibiboneka"
                : "Out of stock"}
          </p>

          {product.stockQty > 0 && (
            <AddToCartButton
  productId={product.id}
  nameEn={product.nameEn}
  priceRwf={product.priceRwf.toString()}
  imageUrl={product.images[0]?.url ?? null}
  locale={locale}
/>
          )}

          <div
            className="mt-8 pt-6 border-t text-sm leading-relaxed"
            style={{ borderColor: "var(--border)", color: "var(--steel)" }}
          >
            <h2 className="text-sm font-medium mb-2" style={{ color: "var(--ink)" }}>
              {locale === "rw" ? "Ibisobanuro" : "Description"}
            </h2>
            <p>
              {localizedDescription(product, localeEnum) ||
                (locale === "rw"
                  ? "Nta bisobanuro birahari."
                  : "No description available yet.")}
            </p>
          </div>

          <div
            className="mt-6 pt-4 border-t text-xs font-mono"
            style={{ borderColor: "var(--border)", color: "var(--steel)" }}
          >
            SKU: {product.sku}
          </div>
        </div>
      </div>
    </main>
  );
}