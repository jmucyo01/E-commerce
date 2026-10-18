"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/frontend/hooks/useCart";
import { placeOrder } from "@/backend/lib/actions";
import {
  RWANDA_DISTRICTS,
  RWANDA_DISTRICTS_BY_PROVINCE,
  RW_PHONE_REGEX,
} from "@/backend/lib/rwanda";

type Fulfillment = "DELIVERY" | "PICKUP";

export function CheckoutForm({
  locale,
  name,
  email,
  existingPhone,
  pickupAddress,
}: {
  locale: "en" | "rw";
  name: string;
  email: string;
  existingPhone: string | null;
  pickupAddress: string | null;
}) {
  const { items, total, hydrated } = useCart();
  const router = useRouter();
  const rw = locale === "rw";

  const [fulfillment, setFulfillment] = useState<Fulfillment>("DELIVERY");
  const [recipientName, setRecipientName] = useState(name);
  const [recipientPhone, setRecipientPhone] = useState(existingPhone ?? "");
  const [district, setDistrict] = useState("");
  const [sector, setSector] = useState("");
  const [addressDetails, setAddressDetails] = useState("");
  const [note, setNote] = useState("");
  const [payerPhone, setPayerPhone] = useState(existingPhone ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputClass = "w-full border px-3 py-2";
  const inputStyle = { borderColor: "var(--border)" };

  function validate(): string | null {
    if (recipientName.trim().length < 2)
      return rw ? "Andika amazina y'uzakira." : "Enter the recipient's name.";
    if (!RW_PHONE_REGEX.test(recipientPhone.trim()))
      return rw ? "Andika numero y'uzakira (07XXXXXXXX)." : "Enter a valid recipient phone (07XXXXXXXX).";
    if (fulfillment === "DELIVERY") {
      if (!RWANDA_DISTRICTS.includes(district))
        return rw ? "Hitamo akarere." : "Choose a district.";
      if (sector.trim().length < 2)
        return rw ? "Andika umurenge." : "Enter the sector.";
      if (addressDetails.trim().length < 3)
        return rw ? "Andika aho uherereye (umuhanda, ikimenyetso)." : "Describe where to deliver (street, landmark).";
    }
    if (!RW_PHONE_REGEX.test(payerPhone.trim()))
      return rw ? "Andika numero yo kwishyura (07XXXXXXXX)." : "Enter a valid payment phone number (07XXXXXXXX).";
    return null;
  }

  async function handleSubmit() {
    setError(null);

    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }

    setIsSubmitting(true);
    const result = await placeOrder(
      items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      {
        payerPhone: payerPhone.trim(),
        fulfillment,
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        district,
        sector: sector.trim(),
        addressDetails: addressDetails.trim(),
        note: note.trim(),
      }
    );

    if (result.ok) {
      router.push(`/${locale}/checkout/${result.orderId}/pay`);
      return;
    }

    const itemName = items.find((i) => i.productId === result.productId)?.nameEn;
    if (result.error === "INSUFFICIENT_STOCK") {
      setError(
        rw
          ? `Nta bicuruzwa bihagije bya "${itemName}". Hindura umubare mu gitebo.`
          : `Not enough stock for "${itemName}". Please reduce the quantity in your cart.`
      );
    } else if (result.error === "PRODUCT_UNAVAILABLE") {
      setError(
        rw
          ? `"${itemName}" ntikiboneka. Kiraho mu gitebo.`
          : `"${itemName}" is no longer available. Please remove it from your cart.`
      );
    } else if (result.error === "NOT_AUTHENTICATED") {
      setError(rw ? "Ongera winjire." : "Your session expired. Please log in again.");
    } else if (
      result.error === "INVALID_PHONE" ||
      result.error === "INVALID_RECIPIENT" ||
      result.error === "INVALID_ADDRESS" ||
      result.error === "INVALID_NOTE"
    ) {
      setError(rw ? "Reba amakuru wujuje, hari atari yo." : "Please check the details you entered.");
    } else {
      setError(rw ? "Habaye ikibazo. Ongera ugerageze." : "Something went wrong. Please try again.");
    }
    setIsSubmitting(false);
  }

  // Wait for the cart to load from localStorage before deciding it's empty.
  if (!hydrated) return <div className="h-64" />;

  if (items.length === 0) {
    return (
      <div className="py-12">
        <p className="mb-4" style={{ color: "var(--steel)" }}>
          {rw ? "Igitebo cyawe kirimo ubusa." : "Your cart is empty."}
        </p>
        <Link
          href={`/${locale}`}
          className="inline-block px-5 py-3 text-sm font-medium"
          style={{ background: "var(--ink)", color: "var(--paper)" }}
        >
          {rw ? "Subira ku bicuruzwa" : "Continue shopping"}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-5 gap-10 items-start">
      <div className="md:col-span-3 flex flex-col gap-8">
        <section>
          <h2 className="font-medium mb-3">{rw ? "Konti yawe" : "Your account"}</h2>
          <div
            className="border p-4 text-sm"
            style={{ borderColor: "var(--border)", background: "var(--surface)" }}
          >
            <p className="font-medium">{name}</p>
            <p style={{ color: "var(--steel)" }}>{email}</p>
          </div>
        </section>

        <section>
          <h2 className="font-medium mb-3">
            {rw ? "Uko wifuza kubona ibyo waguze" : "How do you want to receive it?"}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {(["DELIVERY", "PICKUP"] as const).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setFulfillment(method)}
                className="border px-4 py-3 text-sm text-left"
                style={{
                  borderColor: fulfillment === method ? "var(--accent)" : "var(--border)",
                  background: fulfillment === method ? "var(--surface)" : "transparent",
                  borderWidth: fulfillment === method ? 2 : 1,
                }}
              >
                <span className="font-medium block">
                  {method === "DELIVERY"
                    ? rw ? "Kugezwaho" : "Delivery"
                    : rw ? "Kwishakira ku iduka" : "Store pickup"}
                </span>
                <span className="text-xs" style={{ color: "var(--steel)" }}>
                  {method === "DELIVERY"
                    ? rw ? "Tuzabikugezaho" : "We bring it to you"
                    : rw ? "Uzaza kubifata" : "You collect it"}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-medium mb-3">{rw ? "Uzakira" : "Recipient"}</h2>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-sm block mb-1" htmlFor="recipientName">
                {rw ? "Amazina" : "Full name"}
              </label>
              <input
                id="recipientName"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                maxLength={80}
                className={inputClass}
                style={inputStyle}
              />
            </div>
            <div>
              <label className="text-sm block mb-1" htmlFor="recipientPhone">
                {rw ? "Numero ya telefone" : "Phone number"}
              </label>
              <input
                id="recipientPhone"
                type="tel"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                placeholder="07XXXXXXXX"
                className={inputClass}
                style={inputStyle}
              />
            </div>
          </div>
        </section>

        {fulfillment === "DELIVERY" ? (
          <section>
            <h2 className="font-medium mb-3">
              {rw ? "Aho tuzabigezaho" : "Delivery location"}
            </h2>
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm block mb-1" htmlFor="district">
                    {rw ? "Akarere" : "District"}
                  </label>
                  <select
                    id="district"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className={inputClass}
                    style={inputStyle}
                  >
                    <option value="">{rw ? "Hitamo..." : "Select..."}</option>
                    {Object.entries(RWANDA_DISTRICTS_BY_PROVINCE).map(([province, districts]) => (
                      <optgroup key={province} label={province}>
                        {districts.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm block mb-1" htmlFor="sector">
                    {rw ? "Umurenge" : "Sector"}
                  </label>
                  <input
                    id="sector"
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    maxLength={80}
                    className={inputClass}
                    style={inputStyle}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm block mb-1" htmlFor="addressDetails">
                  {rw ? "Umuhanda n'ikimenyetso" : "Street and landmark"}
                </label>
                <textarea
                  id="addressDetails"
                  value={addressDetails}
                  onChange={(e) => setAddressDetails(e.target.value)}
                  maxLength={300}
                  rows={3}
                  placeholder={
                    rw
                      ? "Urugero: KG 11 Ave, hafi ya sitasiyo ya lisansi, inzu y'ubururu"
                      : "e.g. KG 11 Ave, near the fuel station, blue gate"
                  }
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
            </div>
          </section>
        ) : (
          <section>
            <h2 className="font-medium mb-3">{rw ? "Aho uzabifatira" : "Pickup location"}</h2>
            <div
              className="border p-4 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)" }}
            >
              {pickupAddress ??
                (rw
                  ? "Tuzakubwira aho uzabifatira nyuma yo kwishyura."
                  : "We'll tell you where to collect it after payment.")}
            </div>
          </section>
        )}

        <section>
          <h2 className="font-medium mb-3">
            {rw ? "Icyo wifuza kutubwira (si ngombwa)" : "Note to the seller (optional)"}
          </h2>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            rows={3}
            className={inputClass}
            style={inputStyle}
          />
        </section>

        <section>
          <h2 className="font-medium mb-3">
            {rw ? "Kwishyura na Mobile Money" : "Pay with mobile money"}
          </h2>
          <label className="text-sm block mb-1" htmlFor="payerPhone">
            {rw ? "Numero ya MTN MoMo / Airtel Money" : "MTN MoMo / Airtel Money number"}
          </label>
          <input
            id="payerPhone"
            type="tel"
            value={payerPhone}
            onChange={(e) => setPayerPhone(e.target.value)}
            placeholder="07XXXXXXXX"
            className={inputClass}
            style={inputStyle}
          />
          <p className="text-xs mt-1" style={{ color: "var(--steel)" }}>
            {rw
              ? "Uzahabwa ubutumwa kuri iyi numero kugira ngo wemeze kwishyura."
              : "You'll get a prompt on this number to approve the payment."}
          </p>
        </section>
      </div>

      <aside
        className="md:col-span-2 border p-5 md:sticky md:top-6"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <h2 className="font-medium mb-4">{rw ? "Ibyo uguze" : "Order summary"}</h2>

        <div className="flex flex-col divide-y" style={{ borderColor: "var(--border)" }}>
          {items.map((item) => (
            <div key={item.productId} className="flex gap-3 py-3">
              <div
                className="w-12 h-12 shrink-0 overflow-hidden"
                style={{ background: "var(--paper)", border: "1px solid var(--border)" }}
              >
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : null}
              </div>
              <div className="flex-1 min-w-0 text-sm">
                <p className="truncate">{item.nameEn}</p>
                <p style={{ color: "var(--steel)" }}>× {item.quantity}</p>
              </div>
              <span className="font-mono text-sm">
                {(parseFloat(item.priceRwf) * item.quantity).toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        <div
          className="flex justify-between items-center pt-4 mt-1 border-t"
          style={{ borderColor: "var(--border)" }}
        >
          <span className="font-medium">{rw ? "Igiteranyo" : "Total"}</span>
          <span className="font-mono text-lg">{total.toLocaleString()} RWF</span>
        </div>

        {error && (
          <div
            className="mt-4 px-4 py-3 text-sm"
            style={{ background: "#fdeeea", color: "#b3261e", border: "1px solid #f5c2ba" }}
          >
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full mt-5 px-5 py-3 text-sm font-medium disabled:opacity-50"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          {isSubmitting
            ? rw ? "Birimo gukora..." : "Processing..."
            : rw ? "Komeza kwishyura" : "Continue to payment"}
        </button>
      </aside>
    </div>
  );
}