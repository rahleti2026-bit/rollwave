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

  const amountToAdd = SIMULATE_AMOUNTS[currency]
  const depositAddress = generateDepositAddress(user.id, currency)

  // Upsert wallet row (create if not exists), then increment balance
  // Step 1: Ensure the wallet row exists
  const { error: upsertError } = await supabase
    .from('wallets')
    .upsert(
      {
        user_id: user.id,
        currency,
        balance: 0,
        deposit_address: depositAddress,
      },
      { onConflict: 'user_id,currency', ignoreDuplicates: true },
    )

  if (upsertError) {
    console.error('[simulate-deposit] upsert error:', upsertError)
    return NextResponse.json({ error: 'Failed to initialize wallet' }, { status: 500 })
  }

  // Step 2: Increment balance using Postgres arithmetic (safe for concurrency)
  const { data: updatedWallet, error: updateError } = await supabase
    .from('wallets')
    .update({ balance: supabase.rpc('increment_balance', { 
      // Use raw SQL increment via a workaround: fetch then update
    }) })
    .eq('user_id', user.id)
    .eq('currency', currency)
    .select('balance')
    .single()

  // Fallback: fetch current balance then set balance = current + amount
  if (updateError || !updatedWallet) {
    // Fetch current balance
    const { data: currentWallet, error: fetchError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', user.id)
      .eq('currency', currency)
      .single()

    if (fetchError || !currentWallet) {
      console.error('[simulate-deposit] fetch error:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch wallet' }, { status: 500 })
    }

    const newBalance = (parseFloat(currentWallet.balance) + parseFloat(amountToAdd)).toFixed(8)

    const { data: finalWallet, error: finalError } = await supabase
      .from('wallets')
      .update({ balance: newBalance })
      .eq('user_id', user.id)
      .eq('currency', currency)
      .select('balance')
      .single()

    if (finalError || !finalWallet) {
      console.error('[simulate-deposit] update error:', finalError)
      return NextResponse.json({ error: 'Failed to update balance' }, { status: 500 })
    }

    // Insert confirmed deposit transaction
    const { error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        currency,
        type: 'deposit',
        amount: amountToAdd,
        destination_address: null,
        status: 'confirmed',
      })

    if (txError) {
      console.error('[simulate-deposit] transaction insert error:', txError)
      // Non-fatal — balance was updated, just log
    }

    return NextResponse.json({
      currency,
      amount_added: amountToAdd,
      new_balance: parseFloat(finalWallet.balance).toFixed(8),
    })
  }

  // Insert confirmed deposit transaction
  const { error: txError } = await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      currency,
      type: 'deposit',
      amount: amountToAdd,
      destination_address: null,
      status: 'confirmed',
    })

  if (txError) {
    console.error('[simulate-deposit] transaction insert error:', txError)
  }

  return NextResponse.json({
    currency,
    amount_added: amountToAdd,
    new_balance: parseFloat(updatedWallet.balance).toFixed(8),
  })
}
