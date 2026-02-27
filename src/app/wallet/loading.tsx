export default function WalletLoading() {
  return (
    <main className="min-h-dvh bg-zinc-950">
      {/* Nav skeleton */}
      <nav className="border-b border-zinc-800 bg-zinc-900/50 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="h-5 w-28 bg-zinc-800 rounded animate-pulse" />
          <div className="h-4 w-36 bg-zinc-800 rounded animate-pulse" />
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Currency tabs skeleton */}
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-9 w-20 bg-zinc-800 rounded-lg animate-pulse" />
          ))}
        </div>

        {/* Balance skeleton */}
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="h-14 w-56 bg-zinc-800 rounded-xl animate-pulse" />
          <div className="h-5 w-12 bg-zinc-800 rounded animate-pulse" />
        </div>

        {/* Action panels skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 space-y-4 animate-pulse">
            <div className="h-4 w-20 bg-zinc-800 rounded" />
            <div className="h-10 w-full bg-zinc-800 rounded-lg" />
            <div className="h-9 w-full bg-zinc-800 rounded-lg" />
          </div>
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 space-y-4 animate-pulse">
            <div className="h-4 w-20 bg-zinc-800 rounded" />
            <div className="h-10 w-full bg-zinc-800 rounded-lg" />
            <div className="h-10 w-full bg-zinc-800 rounded-lg" />
            <div className="h-9 w-full bg-zinc-800 rounded-lg" />
          </div>
        </div>

        {/* Transaction history skeleton */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 space-y-3 animate-pulse">
          <div className="h-4 w-40 bg-zinc-800 rounded" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 w-full bg-zinc-800 rounded" />
          ))}
        </div>
      </div>
    </main>
  )
}
