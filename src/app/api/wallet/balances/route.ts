import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CURRENCIES, generateDepositAddress } from '@/lib/wallet/constants'
import type { Currency } from '@/types/wallet'

export async function GET() {
  const supabase = await createClient()

  // Verify authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch all existing wallet rows for this user
  const { data: existingWallets, error: fetchError } = await supabase
    .from('wallets')
    .select('currency, balance')
    .eq('user_id', user.id)

  if (fetchError) {
    console.error('[balances] fetch error:', fetchError)
    return NextResponse.json({ error: 'Failed to fetch balances' }, { status: 500 })
  }

  // Build a map of existing balances
  const existingMap: Record<string, string> = {}
  for (const w of existingWallets ?? []) {
    existingMap[w.currency] = w.balance
  }

  // Find which currencies don't have a wallet row yet
  const missing = CURRENCIES.filter((c) => !(c in existingMap))

  // Create missing wallet rows on the fly
  if (missing.length > 0) {
    const rowsToInsert = missing.map((currency) => ({
      user_id: user.id,
      currency,
      balance: 0,
      deposit_address: generateDepositAddress(user.id, currency),
    }))

    const { error: insertError } = await supabase
      .from('wallets')
      .insert(rowsToInsert)

    if (insertError && insertError.code !== '23505') {
      // 23505 = unique_violation (race condition — already exists), safe to ignore
      console.error('[balances] insert error:', insertError)
      return NextResponse.json({ error: 'Failed to initialize wallets' }, { status: 500 })
    }

    // Set missing balances to 0 in the map
    for (const c of missing) {
      existingMap[c] = '0.00000000'
    }
  }

  // Build the response — all 4 currencies
  const balances = Object.fromEntries(
    CURRENCIES.map((c) => [c, existingMap[c] ?? '0.00000000']),
  ) as Record<Currency, string>

  return NextResponse.json({ balances })
}
