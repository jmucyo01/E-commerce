"use server";

import { auth } from "@/backend/lib/auth";
import { prisma } from "@/backend/lib/prisma";
import {
  createPendingOrder,
  getOrderById,
  OrderError,
  type OrderLineInput,
} from "@/backend/services/order.service";
import { initiateCashIn } from "@/backend/lib/paypack";
import { RWANDA_DISTRICTS, RW_PHONE_REGEX } from "@/backend/lib/rwanda";

export type CheckoutDetails = {
  payerPhone: string;
  fulfillment: "DELIVERY" | "PICKUP";
  recipientName: string;
  recipientPhone: string;
  district: string;
  sector: string;
  addressDetails: string;
  note: string;
};

export type PlaceOrderResult =
  | { ok: true; orderId: string }
  | { ok: false; error: string; productId?: string };

// Input comes from the browser, so nothing is trusted: coerce, trim, validate.
const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

export async function placeOrder(
  lines: OrderLineInput[],
  input: CheckoutDetails
): Promise<PlaceOrderResult> {
  const session = await auth();
  if (!session?.user?.email) return { ok: false, error: "NOT_AUTHENTICATED" };

  const payerPhone = str(input?.payerPhone);
  const recipientName = str(input?.recipientName);
  const recipientPhone = str(input?.recipientPhone);
  const note = str(input?.note);
  const fulfillment = input?.fulfillment === "PICKUP" ? "PICKUP" : "DELIVERY";

  if (!RW_PHONE_REGEX.test(payerPhone)) return { ok: false, error: "INVALID_PHONE" };
  if (recipientName.length < 2 || recipientName.length > 80 || !RW_PHONE_REGEX.test(recipientPhone)) {
    return { ok: false, error: "INVALID_RECIPIENT" };
  }
  if (note.length > 500) return { ok: false, error: "INVALID_NOTE" };

  let district: string | null = null;
  let sector: string | null = null;
  let addressDetails: string | null = null;

  if (fulfillment === "DELIVERY") {
    district = str(input?.district);
    sector = str(input?.sector);
    addressDetails = str(input?.addressDetails);

    if (
      !RWANDA_DISTRICTS.includes(district) ||
      sector.length < 2 || sector.length > 80 ||
      addressDetails.length < 3 || addressDetails.length > 300
    ) {
      return { ok: false, error: "INVALID_ADDRESS" };
    }
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return { ok: false, error: "NOT_AUTHENTICATED" };

  // First phone number becomes the account's number (e.g. Google sign-ups).
  if (!user.phoneNumber) {
    await prisma.user.update({ where: { id: user.id }, data: { phoneNumber: payerPhone } });
  }

  try {
    const order = await createPendingOrder(user.id, lines, {
      payerPhone,
      fulfillment,
      recipientName,
      recipientPhone,
      district,
      sector,
      addressDetails,
      note: note || null,
    });
    return { ok: true, orderId: order.id };
  } catch (err) {
    if (err instanceof OrderError) {
      return { ok: false, error: err.code, productId: err.productId };
    }
    console.error("placeOrder failed:", err);
    return { ok: false, error: "UNKNOWN" };
  }
}

export async function initiatePayment(orderId: string): Promise<{ ok: boolean }> {
  const session = await auth();
  if (!session?.user?.email) return { ok: false };

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  const order = await getOrderById(orderId);

  // The order must belong to the person asking to pay for it.
  if (!user || !order || order.userId !== user.id) return { ok: false };
  if (order.status !== "PENDING" || !order.payerPhone) return { ok: false };

  try {
    const { ref, raw } = await initiateCashIn({
      amountRwf: Number(order.totalRwf),
      phoneNumber: order.payerPhone,
    });

    if (!ref) {
      // Fail closed: without a ref the webhook could never match this payment.
      console.error("Paypack cash-in returned no ref:", raw);
      return { ok: false };
    }

    // The webhook finds the order by this ref, not by anything in its own body.
    await prisma.order.update({
      where: { id: order.id },
      data: { providerTxRef: ref },
    });
    return { ok: true };
  } catch (err) {
    console.error("initiatePayment failed:", err);
    return { ok: false };
  }
}