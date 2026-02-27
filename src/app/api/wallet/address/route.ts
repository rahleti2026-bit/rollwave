import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CURRENCIES, generateDepositAddress } from '@/lib/wallet/constants'
import type { Currency } from '@/types/wallet'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  // Verify authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Validate currency param
  const { searchParams } = new URL(request.url)
  const currency = searchParams.get('currency') as Currency | null

  if (!currency || !CURRENCIES.includes(currency)) {
    return NextResponse.json(
      { error: `currency must be one of: ${CURRENCIES.join(', ')}` },
      { status: 400 },
    )
  }

  // Check if wallet row already exists
  const { data: wallet, error: fetchError } = await supabase
    .from('wallets')
    .select('deposit_address')
    .eq('user_id', user.id)
    .eq('currency', currency)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') {
    // PGRST116 = row not found — expected for new users
    console.error('[address] fetch error:', fetchError)
    return NextResponse.json({ error: 'Failed to fetch address' }, { status: 500 })
  }

  // If wallet exists and already has an address, return it
  if (wallet?.deposit_address) {
    return NextResponse.json({ currency, deposit_address: wallet.deposit_address })
  }

  // Generate a new deposit address
  const depositAddress = generateDepositAddress(user.id, currency)

  // Upsert the wallet row with the new address
  const { error: upsertError } = await supabase
    .from('wallets')
    .upsert(
      {
        user_id: user.id,
        currency,
        balance: 0,
        deposit_address: depositAddress,
      },
      { onConflict: 'user_id,currency' },
    )

  if (upsertError) {
    console.error('[address] upsert error:', upsertError)
    return NextResponse.json({ error: 'Failed to generate address' }, { status: 500 })
  }

  return NextResponse.json({ currency, deposit_address: depositAddress })
}
