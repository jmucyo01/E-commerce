import { prisma } from "@/backend/lib/prisma";
import type { ProductCategory, Locale } from "@prisma/client";

export async function setProductActive(id: string, isActive: boolean) {
  return prisma.product.update({ where: { id }, data: { isActive } });
}
export async function getProducts(params?: {
  category?: ProductCategory;
  search?: string;
}) {
  return prisma.product.findMany({
    where: {
      isActive: true,
      category: params?.category,
      ...(params?.search && {
        nameEn: { contains: params.search, mode: "insensitive" },
      }),
    },
    include: {
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProductById(id: string) {
  return prisma.product.findUnique({
    where: { id, isActive: true },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
    },
  });
}

// Locale-aware display helpers — falls back to English if Kinyarwanda
// content hasn't been entered yet for a given product.
export function localizedName(
  product: { nameEn: string; nameRw: string | null },
  locale: Locale
) {
  return locale === "RW" && product.nameRw ? product.nameRw : product.nameEn;
}

export function localizedDescription(
  product: { descriptionEn: string | null; descriptionRw: string | null },
  locale: Locale
) {
  return locale === "RW" && product.descriptionRw
    ? product.descriptionRw
    : product.descriptionEn;
}


export async function createProduct(data: {
  sku: string;
  category: "ELECTRONICS" | "CONSTRUCTION";
  nameEn: string;
  nameRw?: string;
  descriptionEn?: string;
  descriptionRw?: string;
  priceRwf: number;
  stockQty: number;
  imageUrls?: string[];
}) {
  const { imageUrls, ...productData } = data;

  return prisma.product.create({
    data: {
      ...productData,
      images: imageUrls?.length
        ? {
            create: imageUrls.map((url, i) => ({ url, sortOrder: i })),
          }
        : undefined,
    },
  });
}

export async function updateProduct(
  id: string,
  data: Partial<{
    sku: string;
    category: "ELECTRONICS" | "CONSTRUCTION";
    nameEn: string;
    nameRw: string;
    descriptionEn: string;
    descriptionRw: string;
    priceRwf: number;
    stockQty: number;
    isActive: boolean;
  }>
) {
  return prisma.product.update({ where: { id }, data });
}

export async function deleteProduct(id: string) {
  // Soft delete — keeps historical OrderItem records intact rather than
  // breaking referential integrity on past orders.
  return prisma.product.update({ where: { id }, data: { isActive: false } });
}

export async function getAllProductsForAdmin() {
  return prisma.product.findMany({ orderBy: { createdAt: "desc" } });
}

export async function hardDeleteProduct(id: string) {
  const orderItemCount = await prisma.orderItem.count({ where: { productId: id } });

  if (orderItemCount > 0) {
    throw new Error("HAS_ORDER_HISTORY");
  }

  // Deletes the product; ProductImage rows go too via onDelete: Cascade
  return prisma.product.delete({ where: { id } });
}

export async function getProductForAdmin(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });
}

export async function deleteProductImage(imageId: string) {
  return prisma.productImage.delete({ where: { id: imageId } });
}

export async function addProductImages(productId: string, urls: string[]) {
  const existingCount = await prisma.productImage.count({ where: { productId } });
  return prisma.productImage.createMany({
    data: urls.map((url, i) => ({
      productId,
      url,
      sortOrder: existingCount + i,
    })),
  });
}