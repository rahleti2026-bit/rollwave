import { redirect } from 'next/navigation'

// Root page redirects to /wallet (middleware will redirect to /login if unauthed)
export default function HomePage() {
  redirect('/wallet')
}
