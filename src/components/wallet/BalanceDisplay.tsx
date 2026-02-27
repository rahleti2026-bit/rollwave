import { CURRENCY_META, formatBalance } from '@/lib/wallet/constants'
import type { Currency } from '@/types/wallet'

interface BalanceDisplayProps {
  currency: Currency
  balance: string
}

export function BalanceDisplay({ currency, balance }: BalanceDisplayProps) {
  const meta = CURRENCY_META[currency]
  const formatted = formatBalance(balance, currency)

  // Split into integer and decimal parts for styled display
  const [intPart, decPart] = formatted.split('.')

  return (
    <div className="flex flex-col items-center gap-2 py-8 select-none">
      {/* Currency label */}
      <span className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">
        {meta.label} Balance
      </span>

      {/* Large balance numeral */}
      <div className="flex items-baseline gap-1">
        <span className="text-zinc-500 text-2xl font-light">{meta.symbol}</span>
        <span className="text-5xl sm:text-6xl font-bold tabular-nums tracking-tight text-zinc-100">
          {intPart}
        </span>
        {decPart && (
          <span className="text-2xl sm:text-3xl font-semibold tabular-nums text-zinc-400">
            .{decPart}
          </span>
        )}
      </div>

      {/* Currency code badge */}
      <span className="mt-1 bg-zinc-800 border border-zinc-700 rounded-full px-3 py-0.5 text-xs font-mono font-semibold text-emerald-400 tracking-wider">
        {currency}
      </span>
    </div>
  )
}
