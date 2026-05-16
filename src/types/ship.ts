export type Ship = {
  id: string;
  department: string;
  city: string;
  department_search: string;
  city_search: string;
  price_cop: number;
  estimated_days: number;
  created_at: string;
  updated_at: string;
};

export type ShipsConfig = {
  singleton: boolean;
  free_above_cop: number | null;
  created_at: string;
  updated_at: string;
};
