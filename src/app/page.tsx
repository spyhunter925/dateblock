import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function Home() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Dateblock</h1>
        <p className="text-slate-600">
          Welcome, <span className="font-semibold">{session.user.name}</span>.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/calendar"
            className="rounded-lg bg-primary-600 px-4 py-3 text-white hover:bg-primary-700 transition"
          >
            My Calendar
          </Link>
          <Link
            href="/forum"
            className="rounded-lg border border-slate-300 bg-white px-4 py-3 hover:bg-slate-50 transition"
          >
            Forum Calendar
          </Link>
          {session.user.role === "global_admin" && (
            <Link
              href="/admin"
              className="rounded-lg bg-slate-800 px-4 py-3 text-white hover:bg-slate-900 transition"
            >
              Admin Portal
            </Link>
          )}
        </div>
      </div>
    </main>
  )
}

export const dynamic = "force-dynamic"
