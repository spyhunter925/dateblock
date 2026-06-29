import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { AdminForumList } from "./admin-forum-list"
import { createForum, deleteForum } from "./actions"

export default async function AdminPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "global_admin") {
    redirect("/")
  }

  const forums = await prisma.forum.findMany({
    where: { archivedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { memberships: true } },
    },
  })

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin Portal</h1>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/users"
              className="rounded-lg border border-primary-200 bg-primary-50 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-100"
            >
              Manage Users
            </Link>
            <Link
              href="/"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Back home
            </Link>
          </div>
        </div>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Create Forum</h2>
          <form action={createForum} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                Forum name
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
              <label htmlFor="description" className="block text-sm font-medium text-slate-700">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label htmlFor="inviteEmails" className="block text-sm font-medium text-slate-700">
                Invite emails (comma separated)
              </label>
              <input
                id="inviteEmails"
                name="inviteEmails"
                type="text"
                placeholder="[EMAIL], [EMAIL]"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-primary-600 px-5 py-2.5 text-white hover:bg-primary-700 transition"
            >
              Create forum
            </button>
          </form>
        </section>

        <AdminForumList forums={forums} deleteForum={deleteForum} />
      </div>
    </main>
  )
}

export const dynamic = "force-dynamic"
