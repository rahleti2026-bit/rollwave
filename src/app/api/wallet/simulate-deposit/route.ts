import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CURRENCIES, SIMULATE_AMOUNTS, generateDepositAddress } from '@/lib/wallet/constants'
import type { Currency } from '@/types/wallet'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // Verify authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse and validate request body
  let body: { currency?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const currency = body.currency as Currency | undefined
  if (!currency || !CURRENCIES.includes(currency)) {
    return NextResponse.json(
      { error: `currency must be one of: ${CURRENCIES.join(', ')}` },
      { status: 400 },
    )
  }

  const amountToAdd = parseFloat(SIMULATE_AMOUNTS[currency])
  const depositAddress = generateDepositAddress(user.id, currency)

  // Step 1: Ensure wallet row exists (upsert with ignoreDuplicates)
  await supabase
    .from('wallets')
    .upsert(
      { user_id: user.id, currency, balance: 0, deposit_address: depositAddress },
      { onConflict: 'user_id,currency', ignoreDuplicates: true },
    )

  // Step 2: Fetch current balance
  const { data: wallet, error: fetchError } = await supabase
    .from('wallets')
    .select('balance')
    .eq('user_id', user.id)
    .eq('currency', currency)
    .single()

  if (fetchError || !wallet) {
    console.error('[simulate-deposit] fetch error:', fetchError)
    return NextResponse.json({ error: 'Failed to fetch wallet' }, { status: 500 })
  }

  // Step 3: Compute new balance and update
  const newBalance = (parseFloat(wallet.balance) + amountToAdd).toFixed(8)

  const { data: updated, error: updateError } = await supabase
    .from('wallets')
    .update({ balance: newBalance })
    .eq('user_id', user.id)
    .eq('currency', currency)
    .select('balance')
    .single()

  if (updateError || !updated) {
    console.error('[simulate-deposit] update error:', updateError)
    return NextResponse.json({ error: 'Failed to update balance' }, { status: 500 })
  }

  // Step 4: Insert confirmed deposit transaction
  const { error: txError } = await supabase.from('transactions').insert({
    user_id: user.id,
    currency,
    type: 'deposit',
    amount: SIMULATE_AMOUNTS[currency],
    destination_address: null,
    status: 'confirmed',
  })

  if (txError) {
    // Non-fatal: balance already updated — log and continue
    console.error('[simulate-deposit] tx insert error:', txError)
  }

  return NextResponse.json({
    currency,
    amount_added: SIMULATE_AMOUNTS[currency],
    new_balance: parseFloat(updated.balance).toFixed(8),
  })
}
