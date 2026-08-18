export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  USH: "USh",
  BND: "B$",
  CAD: "C$",
  SGD: "S$",
  MYR: "RM",
  AUD: "A$",
  NZD: "NZ$",
  GBP: "£",
  EUR: "€",
  INR: "₹",
  JPY: "¥",
  CNY: "¥",
  CHF: "CHF ",
  AED: "AED ",
  SAR: "SAR ",
  QAR: "QR ",
  KWD: "KD ",
};

export function currencyPrefix(iso?: string): string {
  if (!iso) return "$";
  return CURRENCY_SYMBOLS[String(iso).toUpperCase()] ?? `${iso} `;
}

export function formatPrice(
  value: string | number | undefined | null,
  iso?: string,
): string {
  const num = Number(String(value ?? "").replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(num) || num <= 0) return "—";
  const formatted = num.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return `${currencyPrefix(iso)}${formatted}`;
}