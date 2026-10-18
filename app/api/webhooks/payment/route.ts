import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { prisma } from "@/backend/lib/prisma";
import { markOrderPaid } from "@/backend/services/order.service";
import { getTransaction } from "@/backend/lib/paypack";

function tokenMatches(given: string | null) {
  const expected = process.env.PAYMENT_WEBHOOK_TOKEN;
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Rwanda prefixes: MTN 078/079, Airtel 072/073. Anything else is left unset.
function providerFromPhone(phone: string) {
  if (/^07[89]/.test(phone)) return "MTN_MOMO" as const;
  if (/^07[23]/.test(phone)) return "AIRTEL_MONEY" as const;
  return null;
}

export async function POST(req: Request) {
  // Layer 1: a secret only Paypack's configured URL knows.
  const token = new URL(req.url).searchParams.get("token");
  if (!tokenMatches(token)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // UNVERIFIED payload shape: we only read the ref, and nothing else in the body is trusted.
  const ref =
    typeof body?.data?.ref === "string"
      ? body.data.ref
      : typeof body?.ref === "string"
        ? body.ref
        : null;

  if (!ref) return NextResponse.json({ ok: false }, { status: 400 });

  const order = await prisma.order.findUnique({ where: { providerTxRef: ref } });
  if (!order) return NextResponse.json({ ok: false }, { status: 404 });
  if (order.status === "PAID") return NextResponse.json({ ok: true });

  // Layer 2: ask Paypack for the real state instead of believing the request.
  let tx;
  try {
    tx = await getTransaction(ref);
  } catch (err) {
    console.error("Could not verify transaction with Paypack:", err);
    return NextResponse.json({ ok: false }, { status: 502 });
  }

  // Not successful yet (or failed): leave the order PENDING so the customer can retry.
  if (tx.status !== "successful") return NextResponse.json({ ok: true });

  if (Math.round(tx.amount) !== Math.round(Number(order.totalRwf))) {
    console.error(
      `Amount mismatch for order ${order.id}: paid ${tx.amount}, expected ${order.totalRwf}`
    );
    return NextResponse.json({ ok: true }); // not marked paid; needs a manual look
  }

  try {
    await markOrderPaid(order.id, ref, providerFromPhone(order.payerPhone ?? ""));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Webhook processing failed:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}