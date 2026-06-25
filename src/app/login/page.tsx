import { auth, signIn } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function LoginPage() {
  const session = await auth()
  if (session?.user) redirect("/")

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Sign in to Dateblock</h1>
          <p className="mt-2 text-sm text-slate-600">Enter your email and password.</p>
        </div>
        <form
          action={async (formData) => {
            "use server"
            const result = await signIn("credentials", {
              email: formData.get("email") as string,
              password: formData.get("password") as string,
              redirect: false,
            })
            if (result?.error) {
              redirect("/login?error=invalid")
            }
            redirect("/")
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-primary-600 px-4 py-2.5 text-white hover:bg-primary-700 transition"
          >
            Sign in
          </button>
        </form>
        <p className="text-center text-sm text-slate-600">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-primary-600 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  )
}

export const dynamic = "force-dynamic"
