// ─── Currency ────────────────────────────────────────────────────────────────

export type Currency = 'BTC' | 'ETH' | 'USDT' | 'DOGE'

// ─── Wallet ──────────────────────────────────────────────────────────────────

export interface Wallet {
  id: string
  user_id: string
  currency: Currency
  /** Stored as numeric(20,8) in Postgres — serialised as string to avoid float precision loss */
  balance: string
  deposit_address: string | null
  created_at: string
}

// ─── Transaction ─────────────────────────────────────────────────────────────

export type TransactionType = 'deposit' | 'withdrawal'
export type TransactionStatus = 'confirmed' | 'pending' | 'failed'

export interface Transaction {
  id: string
  user_id: string
  currency: Currency
  type: TransactionType
  /** Always positive; stored as numeric(20,8) */
  amount: string
  destination_address: string | null
  status: TransactionStatus
  created_at: string
}

// ─── API response shapes ─────────────────────────────────────────────────────

export interface BalancesResponse {
  balances: Record<Currency, string>
}

export interface AddressResponse {
  currency: Currency
  deposit_address: string
}

export interface SimulateDepositResponse {
  currency: Currency
  amount_added: string
  new_balance: string
}

export interface WithdrawResponse {
  currency: Currency
  amount_withdrawn: string
  new_balance: string
}

export interface WithdrawErrorResponse {
  error: string
}

export interface TransactionsResponse {
  currency: Currency
  transactions: Transaction[]
}
