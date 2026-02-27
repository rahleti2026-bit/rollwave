'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Currency, Transaction, TransactionType, TransactionStatus } from '@/types/wallet'

interface TransactionHistoryProps {
  currency: Currency
  /** Increment this to trigger a refresh (e.g. after deposit/withdrawal) */
  refreshKey: number
}

const TYPE_LABELS: Record<TransactionType, string> = {
  deposit: 'Deposit',
  withdrawal: 'Withdrawal',
}

const STATUS_STYLES: Record<TransactionStatus, string> = {
  confirmed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  pending: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  failed: 'bg-red-500/15 text-red-400 border-red-500/30',
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(dateStr))
}

export function TransactionHistory({ currency, refreshKey }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/wallet/transactions?currency=${currency}`)
      if (!res.ok) throw new Error('Failed to fetch transactions')
      const data = await res.json()
      setTransactions(data.transactions ?? [])
    } catch {
      setError('Unable to load transactions. Please refresh.')
    } finally {
      setLoading(false)
    }
  }, [currency])

  useEffect(() => {
    void fetchTransactions()
  }, [fetchTransactions, refreshKey])

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
      <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">
        Transaction History
        <span className="ml-2 text-zinc-600 normal-case tracking-normal font-normal">
          — {currency}
        </span>
      </h2>

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-zinc-800 rounded animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-red-400 text-center py-6">{error}</p>
      ) : transactions.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-zinc-500 text-sm">No transactions yet for {currency}.</p>
          <p className="text-zinc-600 text-xs mt-1">Simulate a deposit to get started.</p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="text-left border-b border-zinc-800">
                <th className="pb-3 px-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider w-40">
                  Date / Time
                </th>
                <th className="pb-3 px-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider w-28">
                  Type
                </th>
                <th className="pb-3 px-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">
                  Amount
                </th>
                <th className="pb-3 px-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right w-28">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3 px-2 text-zinc-400 text-xs font-mono tabular-nums">
                    {formatDate(tx.created_at)}
                  </td>
                  <td className="py-3 px-2">
                    <span
                      className={[
                        'text-xs font-semibold',
                        tx.type === 'deposit' ? 'text-emerald-400' : 'text-zinc-300',
                      ].join(' ')}
                    >
                      {tx.type === 'deposit' ? '↓' : '↑'} {TYPE_LABELS[tx.type]}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right tabular-nums font-mono">
                    <span
                      className={
                        tx.type === 'deposit' ? 'text-emerald-400' : 'text-zinc-300'
                      }
                    >
                      {tx.type === 'deposit' ? '+' : '−'}
                      {parseFloat(tx.amount).toFixed(8)}{' '}
                      <span className="text-zinc-600 text-xs">{currency}</span>
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <span
                      className={[
                        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border',
                        STATUS_STYLES[tx.status],
                      ].join(' ')}
                    >
                      {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
