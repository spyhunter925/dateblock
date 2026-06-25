import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"

async function getActiveForums() {
  return prisma.forum.findMany({
    where: { archivedAt: null },
    orderBy: { name: "asc" },
  })
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: { token?: string }
}) {
  const session = await auth()
  if (session?.user) redirect("/")

  const forums = await getActiveForums()
  const inviteToken = searchParams.token

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Create an account</h1>
          <p className="mt-2 text-sm text-slate-600">Join a forum and start blocking dates.</p>
        </div>
        <form
          action={async (formData) => {
            "use server"
            const name = formData.get("name") as string
            const email = (formData.get("email") as string).toLowerCase()
            const password = formData.get("password") as string
            const forumId = formData.get("forumId") as string
            const token = formData.get("token") as string | undefined

            const existing = await prisma.user.findUnique({ where: { email } })
            if (existing) {
              redirect("/signup?error=exists")
            }

            if (token) {
              const invite = await prisma.forumInvite.findUnique({ where: { token } })
              if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
                redirect("/signup?error=invalidinvite")
              }
            } else if (!forumId) {
              redirect("/signup?error=noforum")
            }

            const passwordHash = await bcrypt.hash(password, 12)
            const user = await prisma.user.create({
              data: {
                email,
                passwordHash,
                displayName: name,
              },
            })

            const finalForumId = token
              ? (await prisma.forumInvite.findUnique({ where: { token } }))?.forumId
              : forumId

            if (finalForumId) {
              await prisma.forumMembership.create({
                data: { userId: user.id, forumId: finalForumId },
              })
            }

            if (token) {
              await prisma.forumInvite.update({
                where: { token },
                data: { usedAt: new Date() },
              })
            }

            revalidatePath("/")
            redirect("/login?registered=1")
          }}
          className="space-y-4"
        >
          <input type="hidden" name="token" value={inviteToken || ""} />
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
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
          {!inviteToken && (
            <div>
              <label htmlFor="forumId" className="block text-sm font-medium text-slate-700">
                Forum
              </label>
              <select
                id="forumId"
                name="forumId"
                required={!inviteToken}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="">Select a forum</option>
                {forums.map((forum) => (
                  <option key={forum.id} value={forum.id}>
                    {forum.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            type="submit"
            className="w-full rounded-lg bg-primary-600 px-4 py-2.5 text-white hover:bg-primary-700 transition"
          >
            Sign up
          </button>
        </form>
        <p className="text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}

export const dynamic = "force-dynamic"
