import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CURRENCIES } from '@/lib/wallet/constants'
import { WalletShell } from '@/components/wallet/WalletShell'
import type { Currency } from '@/types/wallet'

export const metadata = {
  title: 'Wallet — Rollwave',
}

export default async function WalletPage() {
  const supabase = await createClient()

  // Server-side auth check — middleware also guards this route
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Fetch initial balances for all currencies
  const { data: wallets } = await supabase
    .from('wallets')
    .select('currency, balance')
    .eq('user_id', user.id)

  // Build balances map — default 0 for any missing currency
  const initialBalances = Object.fromEntries(
    CURRENCIES.map((c) => {
      const found = wallets?.find((w) => w.currency === c)
      return [c, found ? parseFloat(found.balance).toFixed(8) : '0.00000000']
    }),
  ) as Record<Currency, string>

  return (
    <main className="min-h-dvh bg-zinc-950">
      {/* Top nav */}
      <nav className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-lg font-bold tracking-tight">
            Roll<span className="text-emerald-500">wave</span>
          </span>
          <span className="text-xs text-zinc-500 font-mono truncate max-w-[200px]">
            {user.email}
          </span>
        </div>
      </nav>

      {/* Wallet shell (client component) */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <WalletShell initialBalances={initialBalances} userId={user.id} />
      </div>
    </main>
  )
}
