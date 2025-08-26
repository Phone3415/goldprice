export interface CurrencyExchange {
  disclaimer: "https://openexchangerates.org/terms/";
  license: "https://openexchangerates.org/license/";
  timestamp: number;
  base: string;
  rates: Record<string, number>;
}

export interface GoldPrice {
  name: string;
  price: number;
  symbol: string;
  updatedAt: string;
  updatedAtReadable: string;
}

export const MILLISECONDS_7_DAYS = 604800000;