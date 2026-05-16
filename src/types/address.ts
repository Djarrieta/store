export type Address = {
  id: string;
  user_id: string;
  recipient_name: string;
  department: string;
  city: string;
  address_line: string;
  neighborhood: string | null;
  phone: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type ShippingAddressSnapshot = {
  recipient_name: string;
  department: string;
  city: string;
  address_line: string;
  neighborhood: string | null;
  phone: string;
};
