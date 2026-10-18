import { NextResponse } from "next/server";
import { auth } from "@/backend/lib/auth";
import { prisma } from "@/backend/lib/prisma";
import { getOrderById } from "@/backend/services/order.service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;

  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ status: "UNAUTHORIZED" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  const order = await getOrderById(orderId);

  if (!user || !order || order.userId !== user.id) {
    return NextResponse.json({ status: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ status: order.status });
}