declare global {
  interface Window {
    WidgetCheckout: new (config: {
      currency: string;
      amountInCents: number;
      reference: string;
      publicKey: string;
      signature: { integrity: string };
      redirectUrl?: string;
    }) => {
      open: (
        callback: (result: { transaction: { id: string; status: string } }) => void,
      ) => void;
    };
  }
}

export {};
