export type CurrencyOption = { label: string; value: string };

/**
 * Build a de-duplicated, sorted list of currency options for a select input.
 * Uses `Intl.supportedValuesOf("currency")` when available (with a small
 * fallback list) and resolves human-readable names via `Intl.DisplayNames`.
 * Same logic used by the Create Contract wizard's currency picker.
 */
export const getCurrencyOptions = (): CurrencyOption[] => {
  const supportedValuesOf = (Intl as any).supportedValuesOf as
    | undefined
    | ((type: string) => string[]);

  const supportedCurrencies =
    typeof supportedValuesOf === "function" ? supportedValuesOf("currency") : [];

  const fallbackCurrencies = ["CAD", "USD", "EUR", "GBP"];

  const codes =
    supportedCurrencies.length > 0 ? supportedCurrencies : fallbackCurrencies;

  const displayNames =
    typeof (Intl as any).DisplayNames === "function"
      ? new (Intl as any).DisplayNames(["en"], { type: "currency" })
      : null;

  const getCurrencyName = (code: string) => {
    try {
      const name = displayNames?.of(code);
      if (typeof name === "string" && name.trim() && name !== code) return name;
    } catch (err) {
      void err;
    }

    try {
      const parts = new Intl.NumberFormat("en", {
        style: "currency",
        currency: code,
        currencyDisplay: "name",
      }).formatToParts(0);
      const name = parts.find((p) => p.type === "currency")?.value;
      if (typeof name === "string" && name.trim() && name !== code) return name;
    } catch (err) {
      void err;
    }

    return "";
  };

  return Array.from(new Set(codes))
    .map((code) => {
      const name = getCurrencyName(code);
      return {
        value: code,
        label: name ? `${code} — ${name}` : code,
      };
    })
    .sort((a, b) => a.value.localeCompare(b.value));
};

const EXCHANGE_API_BASE = "https://api.exchangerate-api.com/v4/latest";

type ExchangeRates = Record<string, number>;

let cachedRates: { base: string; rates: ExchangeRates; timestamp: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

export const getExchangeRates = async (baseCurrency: string): Promise<ExchangeRates> => {
  const now = Date.now();

  if (cachedRates && cachedRates.base === baseCurrency && now - cachedRates.timestamp < CACHE_TTL_MS) {
    return cachedRates.rates;
  }

  const response = await fetch(`${EXCHANGE_API_BASE}/${baseCurrency}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch exchange rates: ${response.statusText}`);
  }

  const data = await response.json() as { rates: ExchangeRates };

  cachedRates = {
    base: baseCurrency,
    rates: data.rates,
    timestamp: now,
  };

  return data.rates;
};

export const convertCurrency = async (
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> => {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  const rates = await getExchangeRates(fromCurrency);
  const rate = rates[toCurrency];

  if (rate === undefined) {
    throw new Error(`Exchange rate not available for ${fromCurrency} to ${toCurrency}`);
  }

  return amount * rate;
};

export const getExchangeRate = async (
  fromCurrency: string,
  toCurrency: string
): Promise<number> => {
  if (fromCurrency === toCurrency) {
    return 1;
  }

  const rates = await getExchangeRates(fromCurrency);
  const rate = rates[toCurrency];

  if (rate === undefined) {
    throw new Error(`Exchange rate not available for ${fromCurrency} to ${toCurrency}`);
  }

  return rate;
};

/**
 * Resolve the conversion rate to send with a submission (e.g. a vendor
 * proposal). Mirrors the Create Contract wizard: no conversion (rate 1) when
 * the two currencies match or either is missing, otherwise the live rate from
 * `getExchangeRate(from, to)`. Falls back to 1 if the rate lookup fails so a
 * submission is never blocked by the exchange-rate service being unavailable.
 */
export const resolveConversionRate = async (
  fromCurrency?: string | null,
  toCurrency?: string | null,
): Promise<number> => {
  if (!fromCurrency || !toCurrency || fromCurrency === toCurrency) return 1;
  try {
    return await getExchangeRate(fromCurrency, toCurrency);
  } catch {
    return 1;
  }
};
