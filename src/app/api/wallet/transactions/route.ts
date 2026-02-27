import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CURRENCIES } from '@/lib/wallet/constants'
import type { Currency } from '@/types/wallet'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  // Verify authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Validate currency query param
  const { searchParams } = new URL(request.url)
  const currency = searchParams.get('currency') as Currency | null

  if (!currency || !CURRENCIES.includes(currency)) {
    return NextResponse.json(
      { error: `currency must be one of: ${CURRENCIES.join(', ')}` },
      { status: 400 },
    )
  }

  // Fetch transactions newest-first
  const { data: transactions, error: fetchError } = await supabase
    .from('transactions')
    .select('id, currency, type, amount, destination_address, status, created_at')
    .eq('user_id', user.id)
    .eq('currency', currency)
    .order('created_at', { ascending: false })
    .limit(100)

  if (fetchError) {
    console.error('[transactions] fetch error:', fetchError)
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }

  return NextResponse.json({
    currency,
    transactions: transactions ?? [],
  })
}
