import Link from "next/link";
import { Zap, HardHat, Search } from "lucide-react";
import type { ProductCategory } from "@prisma/client";
import { getProducts, localizedName } from "@/backend/services/product.service";
import { AddToCartButton } from "@/frontend/components/AddToCartButton";

export default async function CatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: "en" | "rw" = rawLocale === "rw" ? "rw" : "en";
  const rw = locale === "rw";
  const localeEnum = rw ? "RW" : "EN";

  const { category: rawCategory, q: rawQ } = await searchParams;

  const category: ProductCategory | undefined =
    rawCategory === "ELECTRONICS" || rawCategory === "CONSTRUCTION"
      ? rawCategory
      : undefined;
  const q = (rawQ ?? "").trim().slice(0, 80);
  const filtering = Boolean(category || q);

  const products = await getProducts({ category, search: q || undefined });

  function href(cat?: ProductCategory) {
    const sp = new URLSearchParams();
    if (cat) sp.set("category", cat);
    if (q) sp.set("q", q);
    const s = sp.toString();
    return `/${locale}${s ? `?${s}` : ""}`;
  }

  const tabs: { key: ProductCategory | undefined; label: string }[] = [
    { key: undefined, label: rw ? "Byose" : "All" },
    { key: "ELECTRONICS", label: rw ? "Amashanyarazi" : "Electronics" },
    { key: "CONSTRUCTION", label: rw ? "Ubwubatsi" : "Construction" },
  ];

  const heading = q
    ? rw ? `Ibyabonetse kuri "${q}"` : `Results for "${q}"`
    : category === "ELECTRONICS"
      ? rw ? "Amashanyarazi" : "Electronics"
      : category === "CONSTRUCTION"
        ? rw ? "Ubwubatsi" : "Construction"
        : rw ? "Ibicuruzwa byose" : "All products";

  return (
    <main>
      {!filtering && (
        <section
          className="border-b"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl font-bold leading-tight mb-4">
                {rw
                  ? "Ibikoresho by'amashanyarazi n'ubwubatsi byose ahantu hamwe"
                  : "Electronics & construction materials, all in one place"}
              </h1>
              <p className="text-base mb-6" style={{ color: "var(--steel)" }}>
                {rw
                  ? "Gura ibikoresho byemewe, byizewe, bitangwa vuba mu Rwanda."
                  : "Quality-checked supplies, delivered reliably across Rwanda."}
              </p>
              <a
                href="#catalog"
                className="inline-block px-6 py-3 text-sm font-medium"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                {rw ? "Reba ibicuruzwa" : "Shop now"}
              </a>
            </div>
            <div
              className="aspect-video flex items-center justify-center text-sm"
              style={{ background: "var(--paper)", color: "var(--steel)", border: "1px solid var(--border)" }}
            >
              {rw ? "Ishusho y'ibicuruzwa" : "Product showcase"}
            </div>
          </div>
        </section>
      )}

      <section id="catalog" className="max-w-6xl mx-auto px-6 py-12">
        {/* The header search is hidden on small screens, so phones get this one. */}
        <form action={`/${locale}`} method="get" className="sm:hidden relative mb-6">
          {category && <input type="hidden" name="category" value={category} />}
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--steel)" }}
          />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder={rw ? "Shakisha ibicuruzwa..." : "Search products..."}
            className="w-full pl-9 pr-4 py-2 text-sm border"
            style={{ borderColor: "var(--border)" }}
          />
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-xl font-semibold">{heading}</h2>
            <p className="text-sm" style={{ color: "var(--steel)" }}>
              {products.length} {rw ? "ibicuruzwa" : products.length === 1 ? "product" : "products"}
              {q && (
                <>
                  {" · "}
                  <Link href={href(category).replace(/[?&]q=[^&]*/, "").replace(/^(\/[a-z]+)&/, "$1?")} className="underline">
                    {rw ? "Siba ishakisha" : "Clear search"}
                  </Link>
                </>
              )}
            </p>
          </div>

          <div className="flex gap-2 text-sm">
            {tabs.map((tab) => {
              const selected = category === tab.key;
              return (
                <Link
                  key={tab.label}
                  href={href(tab.key)}
                  className="px-3 py-1.5 border"
                  style={{
                    borderColor: selected ? "var(--ink)" : "var(--border)",
                    background: selected ? "var(--ink)" : "transparent",
                    color: selected ? "var(--paper)" : "inherit",
                  }}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>

        {products.length === 0 ? (
          <div className="py-12">
            <p className="mb-4" style={{ color: "var(--steel)" }}>
              {filtering
                ? rw ? "Nta bicuruzwa bihuye n'ibyo washakishije." : "No products match your search."
                : rw ? "Nta bicuruzwa biraboneka." : "No products yet."}
            </p>
            {filtering && (
              <Link href={`/${locale}`} className="underline text-sm">
                {rw ? "Reba ibicuruzwa byose" : "See all products"}
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
            {products.map((product) => (
              <div
                key={product.id}
                className="group border flex flex-col"
                style={{ borderColor: "var(--border)", background: "var(--surface)" }}
              >
                <Link href={`/${locale}/products/${product.id}`}>
                  <div
                    className="aspect-square flex items-center justify-center overflow-hidden"
                    style={{ background: "var(--paper)" }}
                  >
                    {product.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.images[0].url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : product.category === "ELECTRONICS" ? (
                      <Zap size={40} strokeWidth={1.5} style={{ color: "var(--accent)" }} />
                    ) : (
                      <HardHat size={40} strokeWidth={1.5} style={{ color: "var(--accent)" }} />
                    )}
                  </div>
                  <div className="p-4 flex flex-col gap-1">
                    <span className="text-xs uppercase tracking-wide" style={{ color: "var(--steel)" }}>
                      {product.category}
                    </span>
                    <span className="font-medium leading-snug group-hover:underline">
                      {localizedName(product, localeEnum)}
                    </span>
                    <span className="font-mono text-sm mt-1">
                      {product.priceRwf.toString()} RWF
                    </span>
                    <span
                      className="text-xs mt-1"
                      style={{ color: product.stockQty > 0 ? "var(--in-stock)" : "var(--steel)" }}
                    >
                      {product.stockQty > 0
                        ? rw ? "Birahari" : "In stock"
                        : rw ? "Byashize" : "Out of stock"}
                    </span>
                  </div>
                </Link>
                {product.stockQty > 0 && (
                  <div className="px-4 pb-4">
                    <AddToCartButton
                      productId={product.id}
                      nameEn={product.nameEn}
                      priceRwf={product.priceRwf.toString()}
                      imageUrl={product.images[0]?.url ?? null}
                      locale={locale}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}