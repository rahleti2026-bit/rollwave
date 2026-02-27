import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CURRENCIES } from '@/lib/wallet/constants'
import type { Currency } from '@/types/wallet'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // Verify authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse request body
  let body: { currency?: unknown; amount?: unknown; destination_address?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { currency, amount, destination_address } = body

  // ── Validate currency ────────────────────────────────────────────────────
  if (!currency || !CURRENCIES.includes(currency as Currency)) {
    return NextResponse.json(
      { error: `currency must be one of: ${CURRENCIES.join(', ')}` },
      { status: 400 },
    )
  }

  // ── Validate destination address ─────────────────────────────────────────
  if (!destination_address || typeof destination_address !== 'string' || destination_address.trim() === '') {
    return NextResponse.json(
      { error: 'Please enter a destination address' },
      { status: 400 },
    )
  }

  // ── Validate amount ──────────────────────────────────────────────────────
  const parsedAmount = typeof amount === 'string' ? parseFloat(amount) : Number(amount)

  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return NextResponse.json(
      { error: 'Amount must be greater than zero' },
      { status: 400 },
    )
  }

  const cur = currency as Currency

  // ── Call the atomic Postgres function ────────────────────────────────────
  // process_withdrawal locks the row, checks balance, debits, and inserts tx
  const { data, error: rpcError } = await supabase.rpc('process_withdrawal', {
    p_user_id: user.id,
    p_currency: cur,
    p_amount: parsedAmount.toFixed(8),
    p_destination_address: destination_address.trim(),
  })

  if (rpcError) {
    console.error('[withdraw] rpc error:', rpcError)

    // Map Postgres exceptions to user-facing errors
    if (rpcError.message?.includes('INSUFFICIENT_BALANCE')) {
      return NextResponse.json(
        { error: `Insufficient ${cur} balance` },
        { status: 422 },
      )
    }

    if (rpcError.message?.includes('WALLET_NOT_FOUND')) {
      return NextResponse.json(
        { error: `No ${cur} wallet found. Please deposit first.` },
        { status: 422 },
      )
    }

    return NextResponse.json({ error: 'Withdrawal failed. Please try again.' }, { status: 500 })
  }

  // data is an array returned by the RETURNS TABLE function
  const newBalance = Array.isArray(data) && data.length > 0
    ? parseFloat(data[0].new_balance).toFixed(8)
    : '0.00000000'

  return NextResponse.json({
    currency: cur,
    amount_withdrawn: parsedAmount.toFixed(8),
    new_balance: newBalance,
  })
}
