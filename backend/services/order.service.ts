import { prisma } from "@/backend/lib/prisma";

export type OrderLineInput = { productId: string; quantity: number };

export type OrderDetails = {
  payerPhone: string;
  fulfillment: "DELIVERY" | "PICKUP";
  recipientName: string;
  recipientPhone: string;
  district: string | null;
  sector: string | null;
  addressDetails: string | null;
  note: string | null;
};

type OrderErrorCode =
  | "EMPTY_CART"
  | "INVALID_QUANTITY"
  | "PRODUCT_UNAVAILABLE"
  | "INSUFFICIENT_STOCK";

export class OrderError extends Error {
  code: OrderErrorCode;
  productId?: string;

  constructor(code: OrderErrorCode, productId?: string) {
    super(code);
    this.code = code;
    this.productId = productId;
  }
}

// Only productId + quantity are accepted from the client. Prices and names
// are always read from the database, never from the browser cart.
export async function createPendingOrder(
  userId: string,
  lines: OrderLineInput[],
  details: OrderDetails
) {
  if (lines.length === 0) throw new OrderError("EMPTY_CART");

  const merged = new Map<string, number>();
  for (const line of lines) {
    if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 1000) {
      throw new OrderError("INVALID_QUANTITY", line.productId);
    }
    merged.set(line.productId, (merged.get(line.productId) ?? 0) + line.quantity);
  }

  return prisma.$transaction(async (tx) => {
    const products = await tx.product.findMany({
      where: { id: { in: [...merged.keys()] }, isActive: true },
    });

    let total = 0;
    const itemsData = [];

    for (const [productId, quantity] of merged) {
      const product = products.find((p) => p.id === productId);
      if (!product) throw new OrderError("PRODUCT_UNAVAILABLE", productId);
      if (product.stockQty < quantity) throw new OrderError("INSUFFICIENT_STOCK", productId);

      total += Number(product.priceRwf) * quantity;
      itemsData.push({
        productId,
        quantity,
        unitPriceRwf: product.priceRwf,
        productNameEn: product.nameEn,
      });
    }

    // Stock is NOT deducted here, only when payment is confirmed (markOrderPaid).
    // No delivery fee for now, so the total is items only.
    return tx.order.create({
      data: {
        userId,
        status: "PENDING",
        totalRwf: total,
        payerPhone: details.payerPhone,
        fulfillment: details.fulfillment,
        recipientName: details.recipientName,
        recipientPhone: details.recipientPhone,
        district: details.district,
        sector: details.sector,
        addressDetails: details.addressDetails,
        note: details.note,
        items: { create: itemsData },
      },
    });
  });
}

export async function getOrderById(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
}

export async function markOrderPaid(
  orderId: string,
  providerTxRef: string,
  provider: "MTN_MOMO" | "AIRTEL_MONEY" | "CARD" | null
) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) throw new Error("ORDER_NOT_FOUND");
    if (order.status === "PAID") return order; // already processed

    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stockQty: { decrement: item.quantity } },
      });
    }

    return tx.order.update({
      where: { id: orderId },
      data: { status: "PAID", providerTxRef, paymentProvider: provider },
    });
  });
}