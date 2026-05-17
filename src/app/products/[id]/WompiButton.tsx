"use client";

import Script from "next/script";
import Button from "@/app/components/Button";

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
      <Button
        variant="primary"
        size="xl"
        shadow
        fullWidth
        onClick={handlePay}
        className="mt-6"
      >
        Buy now
      </Button>
    </>
  );
}
