const PAYPACK_BASE_URL = "https://payments.paypack.rw/api";

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  const res = await fetch(`${PAYPACK_BASE_URL}/auth/agents/authorize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.PAYPACK_CLIENT_ID,
      client_secret: process.env.PAYPACK_CLIENT_SECRET,
    }),
  });

  if (!res.ok) {
    throw new Error("PAYPACK_AUTH_FAILED");
  }

  const data = await res.json();
  cachedToken = {
    token: data.access,
    expiresAt: Date.now() + 10 * 60 * 1000,
  };
  return cachedToken.token;
}

export async function initiateCashIn({
  amountRwf,
  phoneNumber,
}: {
  amountRwf: number;
  phoneNumber: string;
}): Promise<{ ref: string | null; raw: unknown }> {
  const token = await getAccessToken();

  const res = await fetch(`${PAYPACK_BASE_URL}/transactions/cashin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      amount: Math.round(amountRwf),
      number: phoneNumber,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PAYPACK_CASHIN_FAILED: ${body}`);
  }

  const raw = await res.json();
  // UNVERIFIED: assumes the response has a top-level "ref".
  return { ref: typeof raw?.ref === "string" ? raw.ref : null, raw };
}

// Asks Paypack directly for a transaction's real state.
// UNVERIFIED: the endpoint path and the "status"/"amount" field names are
// from memory, so check them against docs.paypack.rw before relying on this.
export async function getTransaction(
  ref: string
): Promise<{ status: string; amount: number }> {
  const token = await getAccessToken();

  const res = await fetch(
    `${PAYPACK_BASE_URL}/transactions/find/${encodeURIComponent(ref)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) {
    throw new Error(`PAYPACK_FIND_FAILED: ${res.status}`);
  }

  const data = await res.json();
  return { status: String(data.status), amount: Number(data.amount) };
}