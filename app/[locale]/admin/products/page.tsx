import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  getAllProductsForAdmin,
  setProductActive,
  hardDeleteProduct,
} from "@/backend/services/product.service";
import { requireAdmin } from "@/backend/lib/admin";
import { DeleteProductButton } from "@/frontend/components/DeleteProductButton";

export default async function AdminProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  // The layout checks too, but layouts don't re-run on every navigation,
  // so the page checks right next to the data it reads.
  if (!(await requireAdmin())) notFound();

  const { locale: rawLocale } = await params;
  const locale: "en" | "rw" = rawLocale === "rw" ? "rw" : "en";
  const { error } = await searchParams;
  const products = await getAllProductsForAdmin();

  async function togglePublish(formData: FormData) {
    "use server";
    if (!(await requireAdmin())) throw new Error("FORBIDDEN");
    const id = formData.get("id") as string;
    const nextState = formData.get("nextState") === "true";
    await setProductActive(id, nextState);
    revalidatePath(`/${locale}/admin/products`);
  }

  async function deleteProduct(formData: FormData) {
    "use server";
    if (!(await requireAdmin())) throw new Error("FORBIDDEN");
    const id = formData.get("id") as string;
    try {
      await hardDeleteProduct(id);
    } catch (err) {
      if (err instanceof Error && err.message === "HAS_ORDER_HISTORY") {
        redirect(`/${locale}/admin/products?error=has_orders`);
      }
      throw err;
    }
    revalidatePath(`/${locale}/admin/products`);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">
          {locale === "rw" ? "Ibicuruzwa" : "Products"}
        </h1>
        <Link
          href={`/${locale}/admin/products/new`}
          className="px-4 py-2 text-sm font-medium"
          style={{ background: "var(--ink)", color: "var(--paper)" }}
        >
          {locale === "rw" ? "Ongeraho igicuruzwa" : "New product"}
        </Link>
      </div>

      {error === "has_orders" && (
        <div
          className="mb-4 px-4 py-3 text-sm"
          style={{ background: "#fdeeea", color: "#b3261e", border: "1px solid #f5c2ba" }}
        >
          {locale === "rw"
            ? "Ntushobora gusiba iki gicuruzwa kuko cyaraguzwe mbere. Ushobora kugihagarika ahubwo."
            : "This product can't be deleted because it has order history. You can unpublish it instead."}
        </div>
      )}

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b" style={{ borderColor: "var(--border)" }}>
            <th className="py-2">SKU</th>
            <th className="py-2">{locale === "rw" ? "Izina" : "Name"}</th>
            <th className="py-2">{locale === "rw" ? "Igiciro" : "Price"}</th>
            <th className="py-2">{locale === "rw" ? "Ubwinshi" : "Stock"}</th>
            <th className="py-2">{locale === "rw" ? "Imiterere" : "Status"}</th>
            <th className="py-2"></th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-b" style={{ borderColor: "var(--border)" }}>
              <td className="py-2 font-mono text-xs">{p.sku}</td>
              <td className="py-2">{p.nameEn}</td>
              <td className="py-2 font-mono">{p.priceRwf.toString()} RWF</td>
              <td className="py-2">{p.stockQty}</td>
              <td
                className="py-2"
                style={{ color: p.isActive ? "var(--in-stock)" : "var(--steel)" }}
              >
                {p.isActive
                  ? locale === "rw" ? "Birakora" : "Active"
                  : locale === "rw" ? "Byahagaritswe" : "Inactive"}
              </td>
              <td className="py-2 text-right">
                <div className="flex justify-end gap-3">
                  <Link href={`/${locale}/admin/products/${p.id}`} className="underline">
                    {locale === "rw" ? "Hindura" : "Edit"}
                  </Link>

                  <form action={togglePublish}>
                    <input type="hidden" name="id" value={p.id} />
                    <input
                      type="hidden"
                      name="nextState"
                      value={(!p.isActive).toString()}
                    />
                    <button
                      type="submit"
                      className="underline"
                      style={{ color: "var(--accent)" }}
                    >
                      {p.isActive
                        ? locale === "rw" ? "Hagarika" : "Unpublish"
                        : locale === "rw" ? "Shyira ahagaragara" : "Publish"}
                    </button>
                  </form>

                  <DeleteProductButton
                    productId={p.id}
                    action={deleteProduct}
                    locale={locale}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}