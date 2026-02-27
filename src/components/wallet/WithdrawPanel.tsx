'use client'

import { useState, FormEvent } from 'react'
import { formatBalance } from '@/lib/wallet/constants'
import type { Currency } from '@/types/wallet'

interface WithdrawPanelProps {
  currency: Currency
  balance: string
  onBalanceUpdate: (newBalance: string) => void
  onTransactionCreated: () => void
}

interface FormErrors {
  address?: string
  amount?: string
  general?: string
}

export function WithdrawPanel({
  currency,
  balance,
  onBalanceUpdate,
  onTransactionCreated,
}: WithdrawPanelProps) {
  const [address, setAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  function validate(): FormErrors {
    const errs: FormErrors = {}

    if (!address.trim()) {
      errs.address = 'Please enter a destination address'
    }

    const parsed = parseFloat(amount)
    if (!amount || isNaN(parsed) || parsed <= 0) {
      errs.amount = 'Amount must be greater than zero'
    } else if (parsed > parseFloat(balance)) {
      errs.amount = `Insufficient ${currency} balance`
    }

    return errs
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSuccess(false)
    setErrors({})

    // Client-side validation — no API call if invalid
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currency,
          amount,
          destination_address: address.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        // Map API errors to field errors
        if (res.status === 422 && data.error?.includes('Insufficient')) {
          setErrors({ amount: data.error })
        } else {
          setErrors({ general: data.error ?? 'Withdrawal failed. Please try again.' })
        }
        return
      }

      // Success — update balance, clear form, show success message
      onBalanceUpdate(data.new_balance)
      onTransactionCreated()
      setAddress('')
      setAmount('')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 4000)
    } catch {
      setErrors({ general: 'Withdrawal failed. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 flex flex-col gap-5">
      {/* Header */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Withdraw</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Send <span className="text-zinc-300 font-medium">{currency}</span> to an external address.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {/* Destination address */}
        <div>
          <label htmlFor="withdraw-address" className="block text-xs font-medium text-zinc-500 mb-1.5">
            Destination Address
          </label>
          <input
            id="withdraw-address"
            type="text"
            value={address}
            onChange={(e) => { setAddress(e.target.value); setErrors((p) => ({ ...p, address: undefined })) }}
            placeholder={`Enter ${currency} address`}
            spellCheck={false}
            autoComplete="off"
            className={[
              'w-full bg-zinc-800 border rounded-lg px-3 py-2.5 text-sm font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition',
              errors.address ? 'border-red-600' : 'border-zinc-700',
            ].join(' ')}
          />
          {errors.address && (
            <p className="mt-1.5 text-xs text-red-400 animate-fade-in">{errors.address}</p>
          )}
        </div>

        {/* Amount */}
        <div>
          <label htmlFor="withdraw-amount" className="block text-xs font-medium text-zinc-500 mb-1.5">
            Amount
          </label>
          <div className="relative">
            <input
              id="withdraw-amount"
              type="number"
              step="any"
              min="0"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setErrors((p) => ({ ...p, amount: undefined })) }}
              placeholder="0.00000000"
              className={[
                'w-full bg-zinc-800 border rounded-lg pl-3 pr-16 py-2.5 text-sm tabular-nums text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition',
                errors.amount ? 'border-red-600' : 'border-zinc-700',
              ].join(' ')}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-500 pointer-events-none">
              {currency}
            </span>
          </div>
          {errors.amount ? (
            <p className="mt-1.5 text-xs text-red-400 animate-fade-in">{errors.amount}</p>
          ) : (
            <p className="mt-1.5 text-xs text-zinc-600">
              Available: <span className="text-zinc-400 tabular-nums">{formatBalance(balance, currency)} {currency}</span>
            </p>
          )}
        </div>

        {/* General API error */}
        {errors.general && (
          <div className="bg-red-950/60 border border-red-800 rounded-lg px-3 py-2.5 text-sm text-red-400 animate-fade-in">
            {errors.general}
          </div>
        )}

        {/* Success message */}
        {success && (
          <div className="bg-emerald-950/60 border border-emerald-800 rounded-lg px-3 py-2.5 text-sm text-emerald-400 animate-fade-in">
            ✓ Withdrawal submitted successfully
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-4 py-2.5 text-sm transition-colors mt-1"
        >
          {loading ? 'Processing…' : `Withdraw ${currency}`}
        </button>
      </form>
    </div>
  )
}
