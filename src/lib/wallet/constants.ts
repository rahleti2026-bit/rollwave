import type { Currency } from '@/types/wallet'

// ─── Supported currencies ─────────────────────────────────────────────────────

export const CURRENCIES: Currency[] = ['BTC', 'ETH', 'USDT', 'DOGE']

// ─── Simulate deposit amounts (fixed per currency) ───────────────────────────

export const SIMULATE_AMOUNTS: Record<Currency, string> = {
  BTC:  '0.00100000',
  ETH:  '0.01000000',
  USDT: '10.00000000',
  DOGE: '10.00000000',
}

// ─── Currency display metadata ────────────────────────────────────────────────

export const CURRENCY_META: Record<
  Currency,
  { label: string; symbol: string; decimals: number }
> = {
  BTC:  { label: 'Bitcoin',  symbol: '₿', decimals: 8 },
  ETH:  { label: 'Ethereum', symbol: 'Ξ', decimals: 8 },
  USDT: { label: 'Tether',   symbol: '$', decimals: 2 },
  DOGE: { label: 'Dogecoin', symbol: 'Ð', decimals: 8 },
}

// ─── Deposit address generation ───────────────────────────────────────────────

/**
 * Generates a deterministic mock deposit address for a given user + currency.
 * Format: <CURRENCY>_<first 24 chars of userId with dashes removed>
 *
 * This is NOT a real crypto address — MVP only.
 */
export function generateDepositAddress(userId: string, currency: Currency): string {
  const stripped = userId.replace(/-/g, '').substring(0, 24)
  return `${currency}_${stripped}`
}

// ─── Format balance for display ───────────────────────────────────────────────

export function formatBalance(balance: string, currency: Currency): string {
  const num = parseFloat(balance)
  const decimals = CURRENCY_META[currency].decimals
  return num.toFixed(decimals)
}
