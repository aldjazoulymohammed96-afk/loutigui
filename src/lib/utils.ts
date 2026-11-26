import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Currency } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Exchange rates relative to XOF (FCFA)
export const EXCHANGE_RATES: Record<Currency, number> = {
  XOF: 1,
  EUR: 1 / 655.957, // 1 EUR = 655.957 FCFA
  USD: 1 / 615.0,   // 1 USD = ~615 FCFA
};

export function formatCurrency(amount: number, currency: Currency = "XOF"): string {
  if (currency === "XOF") {
    // Format integer with non-breaking space
    const formatted = Math.round(amount).toLocaleString("fr-FR");
    return `${formatted} FCFA`;
  } else if (currency === "EUR") {
    const converted = amount * EXCHANGE_RATES.EUR;
    return converted.toLocaleString("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
    });
  } else {
    const converted = amount * EXCHANGE_RATES.USD;
    return converted.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    });
  }
}

// Convert amount in French words for receipts
export function numberToWordsFrench(num: number): string {
  if (num === 0) return "zéro franc CFA";

  const units = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"];
  const teens = ["dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
  const tens = ["", "dix", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante-dix", "quatre-vingts", "quatre-vingt-dix"];

  function convertGroup(n: number): string {
    let res = "";
    const h = Math.floor(n / 100);
    const r = n % 100;

    if (h > 0) {
      if (h === 1) res += "cent ";
      else res += units[h] + " cents ";
    }

    if (r > 0) {
      if (r < 10) {
        res += units[r];
      } else if (r >= 10 && r < 20) {
        res += teens[r - 10];
      } else if (r >= 20 && r < 70) {
        const t = Math.floor(r / 10);
        const u = r % 10;
        if (u === 1 && t !== 8) res += tens[t] + " et un";
        else if (u > 0) res += tens[t] + "-" + units[u];
        else res += tens[t];
      } else if (r >= 70 && r < 80) {
        const u = r - 60;
        if (u === 11) res += "soixante et onze";
        else res += "soixante-" + teens[u - 10];
      } else if (r >= 80 && r < 90) {
        const u = r % 10;
        if (u === 0) res += "quatre-vingts";
        else res += "quatre-vingt-" + units[u];
      } else if (r >= 90) {
        const u = r - 80;
        res += "quatre-vingt-" + teens[u - 10];
      }
    }
    return res.trim();
  }

  const millions = Math.floor(num / 1000000);
  const thousands = Math.floor((num % 1000000) / 1000);
  const remainder = Math.floor(num % 1000);

  const parts: string[] = [];

  if (millions > 0) {
    if (millions === 1) parts.push("un million");
    else parts.push(convertGroup(millions) + " millions");
  }

  if (thousands > 0) {
    if (thousands === 1) parts.push("mille");
    else parts.push(convertGroup(thousands) + " mille");
  }

  if (remainder > 0) {
    parts.push(convertGroup(remainder));
  }

  const result = parts.join(" ").trim();
  const capitalized = result.charAt(0).toUpperCase() + result.slice(1);
  return `${capitalized} Francs CFA`;
}
