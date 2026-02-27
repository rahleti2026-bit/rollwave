'use client'

import { useState, useCallback } from 'react'
import { CurrencyTabs } from './CurrencyTabs'
import { BalanceDisplay } from './BalanceDisplay'
import { DepositPanel } from './DepositPanel'
import { WithdrawPanel } from './WithdrawPanel'
import { TransactionHistory } from './TransactionHistory'
import type { Currency } from '@/types/wallet'

interface WalletShellProps {
  initialBalances: Record<Currency, string>
  userId: string
}

export function WalletShell({ initialBalances }: WalletShellProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('BTC')
  const [balances, setBalances] = useState<Record<Currency, string>>(initialBalances)
  // Increment to trigger transaction history refresh
  const [txRefreshKey, setTxRefreshKey] = useState(0)

  const handleBalanceUpdate = useCallback(
    (newBalance: string) => {
      setBalances((prev) => ({ ...prev, [selectedCurrency]: newBalance }))
      setTxRefreshKey((k) => k + 1)
    },
    [selectedCurrency],
  )

  const handleTransactionCreated = useCallback(() => {
    setTxRefreshKey((k) => k + 1)
  }, [])

  const handleCurrencyChange = useCallback((currency: Currency) => {
    setSelectedCurrency(currency)
    setTxRefreshKey((k) => k + 1)
  }, [])

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">My Wallet</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Manage your crypto balances across all currencies.
        </p>
      </div>

      {/* Currency tabs */}
      <CurrencyTabs selected={selectedCurrency} onChange={handleCurrencyChange} />

      {/* Balance — the epicenter */}
      <BalanceDisplay
        currency={selectedCurrency}
        balance={balances[selectedCurrency]}
      />

      {/* Action panels: Deposit (left) + Withdraw (right) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DepositPanel
          key={`deposit-${selectedCurrency}`}
          currency={selectedCurrency}
          onBalanceUpdate={handleBalanceUpdate}
        />
        <WithdrawPanel
          key={`withdraw-${selectedCurrency}`}
          currency={selectedCurrency}
          balance={balances[selectedCurrency]}
          onBalanceUpdate={handleBalanceUpdate}
          onTransactionCreated={handleTransactionCreated}
        />
      </div>

      {/* Transaction history */}
      <TransactionHistory
        currency={selectedCurrency}
        refreshKey={txRefreshKey}
      />
    </div>
  )
}
