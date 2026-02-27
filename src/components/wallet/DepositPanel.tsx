'use client'

import { useState, useEffect, useCallback } from 'react'
import { SIMULATE_AMOUNTS } from '@/lib/wallet/constants'
import type { Currency } from '@/types/wallet'

interface DepositPanelProps {
  currency: Currency
  onBalanceUpdate: (newBalance: string) => void
}

export function DepositPanel({ currency, onBalanceUpdate }: DepositPanelProps) {
  const [depositAddress, setDepositAddress] = useState<string | null>(null)
  const [addressLoading, setAddressLoading] = useState(true)
  const [addressError, setAddressError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [simulating, setSimulating] = useState(false)
  const [simError, setSimError] = useState<string | null>(null)

  // Fetch deposit address whenever currency changes
  const fetchAddress = useCallback(async () => {
    setAddressLoading(true)
    setAddressError(null)
    setDepositAddress(null)

    try {
      const res = await fetch(`/api/wallet/address?currency=${currency}`)
      if (!res.ok) throw new Error('Failed to load address')
      const data = await res.json()
      setDepositAddress(data.deposit_address)
    } catch {
      setAddressError('Unable to load deposit address. Please refresh.')
    } finally {
      setAddressLoading(false)
    }
  }, [currency])

  useEffect(() => {
    void fetchAddress()
    setCopied(false)
    setSimError(null)
  }, [fetchAddress])

  // Copy address to clipboard
  async function handleCopy() {
    if (!depositAddress) return
    try {
      await navigator.clipboard.writeText(depositAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: select the text
    }
  }

  // Simulate a deposit
  async function handleSimulateDeposit() {
    setSimulating(true)
    setSimError(null)

    try {
      const res = await fetch('/api/wallet/simulate-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency }),
      })

      if (!res.ok) throw new Error('Deposit simulation failed')
      const data = await res.json()
      onBalanceUpdate(data.new_balance)
    } catch {
      setSimError('Deposit simulation failed. Please try again.')
    } finally {
      setSimulating(false)
    }
  }

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 flex flex-col gap-5">
      {/* Header */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Deposit</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Send only <span className="text-zinc-300 font-medium">{currency}</span> to this address.
        </p>
      </div>

      {/* Deposit address */}
      <div>
        <label className="block text-xs font-medium text-zinc-500 mb-2">
          Your {currency} Deposit Address
        </label>

        {addressLoading ? (
          <div className="h-10 bg-zinc-800 rounded-lg animate-pulse" />
        ) : addressError ? (
          <p className="text-sm text-red-400">{addressError}</p>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 overflow-hidden">
              <p className="font-mono text-sm text-zinc-300 truncate select-all">
                {depositAddress}
              </p>
            </div>
            <button
              onClick={handleCopy}
              aria-label="Copy deposit address"
              className={[
                'shrink-0 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 border',
                copied
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200',
              ].join(' ')}
            >
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
        )}
      </div>

      {/* Simulate deposit */}
      <div className="space-y-2">
        <button
          onClick={handleSimulateDeposit}
          disabled={simulating || addressLoading || !!addressError}
          className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-4 py-2.5 text-sm transition-colors"
        >
          {simulating
            ? 'Simulating…'
            : `Simulate Deposit (+${SIMULATE_AMOUNTS[currency]} ${currency})`}
        </button>

        {simError && (
          <p className="text-xs text-red-400 text-center animate-fade-in">{simError}</p>
        )}

        <p className="text-xs text-zinc-600 text-center">
          MVP only — no real funds are transferred
        </p>
      </div>
    </div>
  )
}
