"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { getShippingCost, type ShippingResult } from "@/app/actions/shipping";
import { getDefaultAddress } from "@/app/perfil/actions";
import type { Address } from "@/types";

export type CartItem = {
  id: string;
  title: string;
  /** Effective price in COP (after discount). */
  price: number;
  /** price * 100, what Wompi receives. */
  amountInCents: number;
  quantity: number;
  image?: string;
};

export type ShippingDisplay = "none" | "loading" | "free" | "price" | "unknown_city";

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  selectedAddress: Address | null;
};

type CartAction =
  | { type: "HYDRATE"; items: CartItem[]; selectedAddress?: Address | null }
  | { type: "ADD_ITEM"; item: Omit<CartItem, "quantity"> }
  | { type: "REMOVE_ITEM"; id: string }
  | { type: "SET_QUANTITY"; id: string; quantity: number }
  | { type: "CLEAR" }
  | { type: "OPEN" }
  | { type: "CLOSE" }
  | { type: "SET_ADDRESS"; address: Address | null }
  | { type: "CLEAR_ADDRESS" };

type ShippingState = {
  cost: number;
  display: ShippingDisplay;
  info: ShippingResult | null;
};

type ShippingAction =
  | { type: "RESET" }
  | { type: "LOADING" }
  | { type: "SET"; cost: number; display: ShippingDisplay; info: ShippingResult };

function shippingReducer(state: ShippingState, action: ShippingAction): ShippingState {
  switch (action.type) {
    case "RESET":
      return { cost: 0, display: "none", info: null };
    case "LOADING":
      return { ...state, display: "loading" };
    case "SET":
      return { cost: action.cost, display: action.display, info: action.info };
  }
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "HYDRATE":
      return {
        ...state,
        items: action.items,
        selectedAddress: action.selectedAddress ?? state.selectedAddress,
      };

    case "ADD_ITEM": {
      const existing = state.items.find((i) => i.id === action.item.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.id === action.item.id ? { ...i, quantity: i.quantity + 1 } : i,
          ),
        };
      }
      return {
        ...state,
        items: [...state.items, { ...action.item, quantity: 1 }],
      };
    }

    case "REMOVE_ITEM":
      return { ...state, items: state.items.filter((i) => i.id !== action.id) };

    case "SET_QUANTITY":
      if (action.quantity <= 0) {
        return { ...state, items: state.items.filter((i) => i.id !== action.id) };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.id ? { ...i, quantity: action.quantity } : i,
        ),
      };

    case "CLEAR":
      return { ...state, items: [] };

    case "OPEN":
      return { ...state, isOpen: true };

    case "CLOSE":
      return { ...state, isOpen: false };

    case "SET_ADDRESS":
      return { ...state, selectedAddress: action.address };

    case "CLEAR_ADDRESS":
      return { ...state, selectedAddress: null };
  }
}

const STORAGE_KEY = "store:cart";

type StoredCart = {
  items: CartItem[];
  selectedAddress: Address | null;
};

type CartContextValue = {
  items: CartItem[];
  isOpen: boolean;
  totalItems: number;
  subtotalAmountInCents: number;
  totalAmountInCents: number;
  shippingCost: number;
  shippingDisplay: ShippingDisplay;
  shippingInfo: ShippingResult | null;
  selectedAddress: Address | null;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  setSelectedAddress: (address: Address | null) => void;
  clearAddress: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    isOpen: false,
    selectedAddress: null,
  });
  const [shipping, dispatchShipping] = useReducer(shippingReducer, {
    cost: 0,
    display: "none" as ShippingDisplay,
    info: null,
  });

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored) as StoredCart;
      dispatch({
        type: "HYDRATE",
        items: parsed.items ?? [],
        selectedAddress: parsed.selectedAddress ?? null,
      });
    } catch {
      // ignore parse errors
    }
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    try {
      const payload: StoredCart = {
        items: state.items,
        selectedAddress: state.selectedAddress,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore quota errors
    }
  }, [state.items, state.selectedAddress]);

  // Recalculate shipping whenever address or subtotal changes
  const subtotal = state.items.reduce((s, i) => s + i.price * i.quantity, 0);

  useEffect(() => {
    if (!state.selectedAddress) {
      dispatchShipping({ type: "RESET" });
      return;
    }

    let cancelled = false;
    dispatchShipping({ type: "LOADING" });

    getShippingCost(state.selectedAddress.city, state.selectedAddress.department, subtotal)
      .then((result) => {
        if (cancelled) return;
        let display: ShippingDisplay;
        if (result.isFree) display = "free";
        else if (result.isUnknownCity) display = "unknown_city";
        else display = "price";
        dispatchShipping({ type: "SET", cost: result.cost, display, info: result });
      })
      .catch(() => {
        if (!cancelled) dispatchShipping({ type: "SET", cost: 0, display: "unknown_city", info: { cost: 0, estimated_days: null, isFree: false, isUnknownCity: true } });
      });

    return () => {
      cancelled = true;
    };
  }, [state.selectedAddress, subtotal]);

  const setSelectedAddress = useCallback((address: Address | null) => {
    dispatch({ type: "SET_ADDRESS", address });
  }, []);

  const clearAddress = useCallback(() => {
    dispatch({ type: "CLEAR_ADDRESS" });
  }, []);

  // Auto-load the default address once per session when the first item is added
  const hasAutoLoadedAddressRef = useRef(false);
  const addItem = useCallback(
    (item: Omit<CartItem, "quantity">) => {
      dispatch({ type: "ADD_ITEM", item });
      if (
        state.items.length === 0 &&
        !state.selectedAddress &&
        !hasAutoLoadedAddressRef.current
      ) {
        hasAutoLoadedAddressRef.current = true;
        getDefaultAddress().then((addr) => {
          if (addr) dispatch({ type: "SET_ADDRESS", address: addr });
        });
      }
    },
    [state.items.length, state.selectedAddress],
  );

  const totalItems = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotalAmountInCents = state.items.reduce(
    (sum, i) => sum + i.amountInCents * i.quantity,
    0,
  );
  const shippingCostCents = Math.round(shipping.cost * 100);
  const totalAmountInCents = subtotalAmountInCents + shippingCostCents;

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        isOpen: state.isOpen,
        totalItems,
        subtotalAmountInCents,
        totalAmountInCents,
        shippingCost: shipping.cost,
        shippingDisplay: shipping.display,
        shippingInfo: shipping.info,
        selectedAddress: state.selectedAddress,
        addItem,
        removeItem: (id) => dispatch({ type: "REMOVE_ITEM", id }),
        setQuantity: (id, quantity) => dispatch({ type: "SET_QUANTITY", id, quantity }),
        clearCart: () => dispatch({ type: "CLEAR" }),
        openCart: () => dispatch({ type: "OPEN" }),
        closeCart: () => dispatch({ type: "CLOSE" }),
        setSelectedAddress,
        clearAddress,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
