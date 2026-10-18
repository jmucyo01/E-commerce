import { notFound, redirect } from "next/navigation";
import { createProduct } from "@/backend/services/product.service";
import { saveUploadedImage } from "@/backend/lib/upload";
import { requireAdmin } from "@/backend/lib/admin";

export default async function NewProductPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  if (!(await requireAdmin())) notFound();

  const { locale: rawLocale } = await params;
  const locale: "en" | "rw" = rawLocale === "rw" ? "rw" : "en";

  async function create(formData: FormData) {
    "use server";
    // First line, before any file is written to disk.
    if (!(await requireAdmin())) throw new Error("FORBIDDEN");

    const files = formData.getAll("images") as File[];
    const validFiles = files.filter((f) => f.size > 0);

    const imageUrls = await Promise.all(
      validFiles.map((file) => saveUploadedImage(file))
    );

    await createProduct({
      sku: formData.get("sku") as string,
      category: formData.get("category") as "ELECTRONICS" | "CONSTRUCTION",
      nameEn: formData.get("nameEn") as string,
      nameRw: (formData.get("nameRw") as string) || undefined,
      descriptionEn: (formData.get("descriptionEn") as string) || undefined,
      priceRwf: parseFloat(formData.get("priceRwf") as string),
      stockQty: parseInt(formData.get("stockQty") as string),
      imageUrls,
    });

    redirect(`/${locale}/admin/products`);
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-semibold mb-6">
        {locale === "rw" ? "Igicuruzwa gishya" : "New product"}
      </h1>
      <form action={create} className="flex flex-col gap-4">
        <input name="sku" placeholder="SKU" required className="border px-3 py-2" style={{ borderColor: "var(--border)" }} />
        <select name="category" required className="border px-3 py-2" style={{ borderColor: "var(--border)" }}>
          <option value="ELECTRONICS">Electronics</option>
          <option value="CONSTRUCTION">Construction</option>
        </select>
        <input name="nameEn" placeholder="Name (English)" required className="border px-3 py-2" style={{ borderColor: "var(--border)" }} />
        <input name="nameRw" placeholder="Name (Kinyarwanda)" className="border px-3 py-2" style={{ borderColor: "var(--border)" }} />
        <textarea name="descriptionEn" placeholder="Description" className="border px-3 py-2" style={{ borderColor: "var(--border)" }} />
        <input name="priceRwf" type="number" step="0.01" placeholder="Price (RWF)" required className="border px-3 py-2" style={{ borderColor: "var(--border)" }} />
        <input name="stockQty" type="number" placeholder="Stock quantity" required className="border px-3 py-2" style={{ borderColor: "var(--border)" }} />

        <label className="text-sm font-medium">
          {locale === "rw" ? "Amafoto y'igicuruzwa" : "Product images"}
        </label>
        <input
          name="images"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="border px-3 py-2"
          style={{ borderColor: "var(--border)" }}
        />

        <button type="submit" className="px-4 py-2 text-sm font-medium" style={{ background: "var(--ink)", color: "var(--paper)" }}>
          {locale === "rw" ? "Bika" : "Save"}
        </button>
      </form>
    </div>
  );
}