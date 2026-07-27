export type Currency = 'USD' | 'GBP' | 'CAD' | 'AUD' | 'AED' | 'SGD' | 'EUR';

export interface ExchangeRate {
  code: Currency;
  flag: string;
  name: string;
  rate: number;
  change: number;
  high: number;
  low: number;
  popular?: boolean;
}

export interface RateProvider {
  name: string;
  rate: number;
  fee: string;
  time: string;
  score: number;
  best: boolean;
}

export const exchangeRates: ExchangeRate[] = [
  { code: 'USD', flag: '🇺🇸', name: 'US Dollar',         rate: 83.42,  change: +0.18, high: 83.68,  low: 83.12,  popular: true  },
  { code: 'GBP', flag: '🇬🇧', name: 'British Pound',     rate: 106.74, change: -0.32, high: 107.20, low: 106.50, popular: true  },
  { code: 'CAD', flag: '🇨🇦', name: 'Canadian Dollar',   rate: 61.38,  change: +0.06, high: 61.55,  low: 61.20              },
  { code: 'AUD', flag: '🇦🇺', name: 'Australian Dollar', rate: 54.90,  change: -0.14, high: 55.10,  low: 54.75              },
  { code: 'AED', flag: '🇦🇪', name: 'UAE Dirham',         rate: 22.72,  change: +0.04, high: 22.78,  low: 22.65              },
  { code: 'SGD', flag: '🇸🇬', name: 'Singapore Dollar',  rate: 62.15,  change: +0.22, high: 62.40,  low: 61.90              },
  { code: 'EUR', flag: '🇪🇺', name: 'Euro',               rate: 90.28,  change: -0.55, high: 90.88,  low: 90.10              },
];

export const rateProviders: RateProvider[] = [
  { name: 'Wise',         rate: 83.29, fee: '₹0 flat',  time: 'Instant',   score: 4.9, best: true  },
  { name: 'Remitly',      rate: 83.15, fee: '₹0 first', time: '< 1 hour',  score: 4.8, best: false },
  { name: 'Western Union',rate: 82.80, fee: '₹150',     time: 'Instant',   score: 4.5, best: false },
  { name: 'HDFC Bank',    rate: 82.50, fee: '₹0',       time: '1–2 days',  score: 4.3, best: false },
];

/** 7-day USD/INR trend values (Monday → Sunday). */
export const usdInrTrend = [82.10, 82.45, 82.90, 83.10, 82.85, 83.22, 83.42];
