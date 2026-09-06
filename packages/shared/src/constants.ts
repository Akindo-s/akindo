export const API_URL: string =
  process.env.EXPO_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://127.0.0.1:8000';

export const MONEDA = "MXN" as const;
export type Moneda = typeof MONEDA;
