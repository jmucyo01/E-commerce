import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  getProductForAdmin,
  updateProduct,
  deleteProductImage,
  addProductImages,
} from "@/backend/services/product.service";
import { saveUploadedImage } from "@/backend/lib/upload";
import { requireAdmin } from "@/backend/lib/admin";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  if (!(await requireAdmin())) notFound();

  const { locale: rawLocale, id } = await params;
  const locale: "en" | "rw" = rawLocale === "rw" ? "rw" : "en";
  const product = await getProductForAdmin(id);

  if (!product) notFound();

  async function save(formData: FormData) {
    "use server";
    if (!(await requireAdmin())) throw new Error("FORBIDDEN");

    await updateProduct(id, {
      sku: formData.get("sku") as string,
      category: formData.get("category") as "ELECTRONICS" | "CONSTRUCTION",
      nameEn: formData.get("nameEn") as string,
      nameRw: (formData.get("nameRw") as string) || undefined,
      descriptionEn: (formData.get("descriptionEn") as string) || undefined,
      priceRwf: parseFloat(formData.get("priceRwf") as string),
      stockQty: parseInt(formData.get("stockQty") as string),
    });

    const files = formData.getAll("images") as File[];
    const validFiles = files.filter((f) => f.size > 0);
    if (validFiles.length > 0) {
      const urls = await Promise.all(validFiles.map((f) => saveUploadedImage(f)));
      await addProductImages(id, urls);
    }

    redirect(`/${locale}/admin/products`);
  }

  async function removeImage(formData: FormData) {
    "use server";
    if (!(await requireAdmin())) throw new Error("FORBIDDEN");

    const imageId = formData.get("imageId") as string;
    await deleteProductImage(imageId);
    revalidatePath(`/${locale}/admin/products/${id}`);
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-semibold mb-6">
        {locale === "rw" ? "Hindura igicuruzwa" : "Edit product"}
      </h1>

      <form action={save} className="flex flex-col gap-4">
        <input
          name="sku"
          defaultValue={product.sku}
          placeholder="SKU"
          required
          className="border px-3 py-2"
          style={{ borderColor: "var(--border)" }}
        />
        <select
          name="category"
          defaultValue={product.category}
          required
          className="border px-3 py-2"
          style={{ borderColor: "var(--border)" }}
        >
          <option value="ELECTRONICS">Electronics</option>
          <option value="CONSTRUCTION">Construction</option>
        </select>
        <input
          name="nameEn"
          defaultValue={product.nameEn}
          placeholder="Name (English)"
          required
          className="border px-3 py-2"
          style={{ borderColor: "var(--border)" }}
        />
        <input
          name="nameRw"
          defaultValue={product.nameRw ?? ""}
          placeholder="Name (Kinyarwanda)"
          className="border px-3 py-2"
          style={{ borderColor: "var(--border)" }}
        />
        <textarea
          name="descriptionEn"
          defaultValue={product.descriptionEn ?? ""}
          placeholder="Description"
          className="border px-3 py-2"
          style={{ borderColor: "var(--border)" }}
        />
        <input
          name="priceRwf"
          type="number"
          step="0.01"
          defaultValue={product.priceRwf.toString()}
          placeholder="Price (RWF)"
          required
          className="border px-3 py-2"
          style={{ borderColor: "var(--border)" }}
        />
        <input
          name="stockQty"
          type="number"
          defaultValue={product.stockQty}
          placeholder="Stock quantity"
          required
          className="border px-3 py-2"
          style={{ borderColor: "var(--border)" }}
        />

        <label className="text-sm font-medium">
          {locale === "rw" ? "Ongeraho amafoto" : "Add more images"}
        </label>
        <input
          name="images"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="border px-3 py-2"
          style={{ borderColor: "var(--border)" }}
        />

        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium"
          style={{ background: "var(--ink)", color: "var(--paper)" }}
        >
          {locale === "rw" ? "Bika impinduka" : "Save changes"}
        </button>
      </form>

      {product.images.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-medium mb-3">
            {locale === "rw" ? "Amafoto asanzwe" : "Current images"}
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {product.images.map((img) => (
              <div key={img.id} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt=""
                  className="w-full aspect-square object-cover border"
                  style={{ borderColor: "var(--border)" }}
                />
                <form action={removeImage} className="mt-1">
                  <input type="hidden" name="imageId" value={img.id} />
                  <button
                    type="submit"
                    className="text-xs underline"
                    style={{ color: "#b3261e" }}
                  >
                    {locale === "rw" ? "Kuraho" : "Remove"}
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}