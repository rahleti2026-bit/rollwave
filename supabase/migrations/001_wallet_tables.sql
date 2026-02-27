-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: 001_wallet_tables.sql
-- Creates: wallets, transactions tables with RLS policies
-- ─────────────────────────────────────────────────────────────────────────────

-- ── wallets ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wallets (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  currency         text NOT NULL CHECK (currency IN ('BTC', 'ETH', 'USDT', 'DOGE')),
  balance          numeric(20, 8) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  deposit_address  text UNIQUE,
  created_at       timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT wallets_user_currency_unique UNIQUE (user_id, currency)
);

-- Index for fast per-user lookups
CREATE INDEX IF NOT EXISTS wallets_user_id_idx ON public.wallets (user_id);

-- ── transactions ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.transactions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  currency            text NOT NULL CHECK (currency IN ('BTC', 'ETH', 'USDT', 'DOGE')),
  type                text NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
  amount              numeric(20, 8) NOT NULL CHECK (amount > 0),
  destination_address text,
  status              text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'pending', 'failed')),
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- Index for fast per-user + currency queries
CREATE INDEX IF NOT EXISTS transactions_user_id_idx      ON public.transactions (user_id);
CREATE INDEX IF NOT EXISTS transactions_user_currency_idx ON public.transactions (user_id, currency);
CREATE INDEX IF NOT EXISTS transactions_created_at_idx   ON public.transactions (created_at DESC);

-- ── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE public.wallets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- wallets: users can only see and modify their own rows
CREATE POLICY "wallets_select_own"
  ON public.wallets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "wallets_insert_own"
  ON public.wallets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "wallets_update_own"
  ON public.wallets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- transactions: users can only see and insert their own rows
CREATE POLICY "transactions_select_own"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "transactions_insert_own"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ── Withdraw helper function (atomic debit + insert) ─────────────────────────
-- Called from the API route to ensure the debit and transaction insert
-- happen atomically inside a single Postgres transaction.
CREATE OR REPLACE FUNCTION public.process_withdrawal(
  p_user_id             uuid,
  p_currency            text,
  p_amount              numeric,
  p_destination_address text
)
RETURNS TABLE (new_balance numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance numeric;
BEGIN
  -- Lock the wallet row for update
  SELECT balance INTO v_current_balance
  FROM public.wallets
  WHERE user_id = p_user_id AND currency = p_currency
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    RAISE EXCEPTION 'WALLET_NOT_FOUND';
  END IF;

  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'INSUFFICIENT_BALANCE';
  END IF;

  -- Debit the balance
  UPDATE public.wallets
  SET balance = balance - p_amount
  WHERE user_id = p_user_id AND currency = p_currency
  RETURNING balance INTO v_current_balance;

  -- Record the transaction
  INSERT INTO public.transactions (user_id, currency, type, amount, destination_address, status)
  VALUES (p_user_id, p_currency, 'withdrawal', p_amount, p_destination_address, 'confirmed');

  RETURN QUERY SELECT v_current_balance;
END;
$$;
