import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ChangePasswordForm } from "./change-password-form"

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Profile</h1>
            <p className="text-sm text-slate-600">{session.user.email}</p>
          </div>
          <Link
            href="/"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 transition"
          >
            Back home
          </Link>
        </div>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Change password</h2>
          <ChangePasswordForm />
        </section>
      </div>
    </main>
  )
}

export const dynamic = "force-dynamic"
