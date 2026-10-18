"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { initiatePayment } from "@/backend/lib/actions";
import { useCart } from "@/frontend/hooks/useCart";

export function PayButton({
  orderId,
  locale,
}: {
  orderId: string;
  locale: "en" | "rw";
}) {
  const [status, setStatus] = useState<"idle" | "waiting" | "error" | "timeout">("idle");
  const router = useRouter();
  const { clearCart } = useCart();
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const rw = locale === "rw";

  useEffect(() => {
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  async function handlePay() {
    setStatus("waiting");
    const result = await initiatePayment(orderId);
    if (!result.ok) {
      setStatus("error");
      return;
    }

    const startedAt = Date.now();
    timer.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}/status`);
        const data = await res.json();
        if (data.status === "PAID") {
          if (timer.current) clearInterval(timer.current);
          clearCart();
          router.push(`/${locale}/orders/${orderId}/confirmation`);
        } else if (Date.now() - startedAt > 120_000) {
          if (timer.current) clearInterval(timer.current);
          setStatus("timeout");
        }
      } catch {
        // transient network error, keep polling
      }
    }, 3000);
  }

  if (status === "waiting") {
    return (
      <p className="text-sm" style={{ color: "var(--steel)" }}>
        {rw
          ? "Reba kuri telefone yawe kugira ngo wemeze..."
          : "Check your phone to approve the payment..."}
      </p>
    );
  }

  return (
    <div>
      {status === "timeout" && (
        <p className="text-sm mb-3" style={{ color: "var(--steel)" }}>
          {rw
            ? "Nta cyemezo twabonye. Niba wemeje, subiramo urupapuro; niba atari byo, ongera ugerageze."
            : "We didn't get a confirmation. If you approved it, refresh this page; otherwise try again."}
        </p>
      )}
      {status === "error" && (
        <p className="text-sm mb-3" style={{ color: "#b3261e" }}>
          {rw ? "Ntibishobotse gutangira kwishyura." : "Couldn't start the payment. Please try again."}
        </p>
      )}
      <button
        onClick={handlePay}
        className="w-full px-5 py-3 text-sm font-medium"
        style={{ background: "var(--ink)", color: "var(--paper)" }}
      >
        {rw ? "Tangira kwishyura" : "Send payment request"}
      </button>
    </div>
  );
}