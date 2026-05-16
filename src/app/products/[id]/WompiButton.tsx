"use client";

import Script from "next/script";

interface WompiButtonProps {
  amountInCents: number;
  reference: string;
  integrityHash: string;
}

export default function WompiButton({ amountInCents, reference, integrityHash }: WompiButtonProps) {

  function handlePay() {
    const checkout = new window.WidgetCheckout({
      currency: "COP",
      amountInCents,
      reference,
      publicKey: process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY!,
      signature: { integrity: integrityHash },
    });

    checkout.open(function (result) {
      const { transaction } = result;
      console.log("Wompi transaction ID:", transaction.id);
      console.log("Wompi transaction status:", transaction.status);
    });
  }

  return (
    <>
      <Script
        src="https://checkout.wompi.co/widget.js"
        strategy="lazyOnload"
       
      />
      <button
        type="button"
        onClick={handlePay}
        className="mt-6 w-full rounded-xl border-2 border-black bg-[var(--accent)] px-6 py-3 font-bold shadow-[4px_4px_0_0_#111] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        Buy now
      </button>
    </>
  );
}
