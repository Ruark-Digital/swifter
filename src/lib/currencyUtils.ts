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
