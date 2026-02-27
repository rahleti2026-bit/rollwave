# Rollwave

Crypto wallet platform supporting BTC, ETH, USDT, and DOGE.

## Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 (dark theme)
- **Package Manager**: pnpm
- **Backend / DB**: Supabase (Postgres + Auth)
- **Deployment**: Vercel

## Getting Started

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

## Features

- Multi-currency wallet (BTC, ETH, USDT, DOGE)
- Deposit address generation
- Simulated deposits
- Withdrawal with balance validation
- Transaction history per currency
- Supabase Auth (email/password)
