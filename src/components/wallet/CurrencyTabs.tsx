import { CURRENCIES, CURRENCY_META } from '@/lib/wallet/constants'
import type { Currency } from '@/types/wallet'

interface CurrencyTabsProps {
  selected: Currency
  onChange: (currency: Currency) => void
}

export function CurrencyTabs({ selected, onChange }: CurrencyTabsProps) {
  return (
    <div className="flex gap-2 flex-wrap" role="tablist" aria-label="Select currency">
      {CURRENCIES.map((currency) => {
        const isActive = currency === selected
        const meta = CURRENCY_META[currency]

        return (
          <button
            key={currency}
            role="tab"
            aria-selected={isActive}
            aria-label={`${meta.label} (${currency})`}
            onClick={() => onChange(currency)}
            className={[
              'px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
              isActive
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 border border-zinc-700',
            ].join(' ')}
          >
            <span className="mr-1.5 opacity-75">{meta.symbol}</span>
            {currency}
          </button>
        )
      })}
    </div>
  )
}
