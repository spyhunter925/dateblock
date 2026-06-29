import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import {
  addMember,
  createMember,
  removeMember,
  resetMemberPassword,
  deleteUser,
  revokeInvite,
  changeUserEmail,
} from "../../actions"
import { DeleteUserButton } from "../../delete-user-button"

export default async function ForumDetailPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { error?: string; created?: string; reset?: string; userId?: string }
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== "global_admin") {
    redirect("/")
  }

  const forum = await prisma.forum.findUnique({
    where: { id: params.id, archivedAt: null },
    include: {
      memberships: {
        include: { user: true },
        orderBy: { user: { displayName: "asc" } },
      },
      invites: {
        where: { usedAt: null, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!forum) redirect("/admin")

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/admin" className="hover:underline">
            Admin
          </Link>
          <span>/</span>
          <span className="font-medium text-slate-900">{forum.name}</span>
        </div>

        <h1 className="text-2xl font-bold">{forum.name}</h1>

        {searchParams?.created && searchParams.created.length > 0 && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800">
            Member {decodeURIComponent(searchParams.created)} created successfully.
          </div>
        )}
        {searchParams?.error === "exists" && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800">
            A user with that email already exists.
          </div>
        )}
        {searchParams?.error === "invalid" && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800">
            Please provide a name, valid email, and password of at least 6 characters.
          </div>
        )}
        {searchParams?.error === "notfound" && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800">
            Member not found in this forum.
          </div>
        )}
        {searchParams?.error === "shortpass" && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800">
            Password must be at least 6 characters.
          </div>
        )}
        {searchParams?.reset === "1" && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800">
            Member password reset successfully.
          </div>
        )}

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Create member account</h2>
          <p className="mb-4 text-sm text-slate-600">
            Create a user account directly. The member can sign in immediately with these credentials.
          </p>
          <form action={createMember.bind(null, forum.id)} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                Display name
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
              <p className="mt-1 text-xs text-slate-500">Minimum 6 characters.</p>
            </div>
            <button
              type="submit"
              className="rounded-lg bg-primary-600 px-5 py-2.5 text-white hover:bg-primary-700 transition"
            >
              Create member
            </button>
          </form>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Invite members by email</h2>
          <form action={addMember.bind(null, forum.id)} className="space-y-4">
            <div>
              <label htmlFor="inviteEmails" className="block text-sm font-medium text-slate-700">
                Email addresses (comma separated)
              </label>
              <input
                id="inviteEmails"
                name="inviteEmails"
                type="text"
                required
                placeholder="[EMAIL], [EMAIL]"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg border border-primary-600 bg-white px-5 py-2.5 font-medium text-primary-700 hover:bg-primary-50 transition"
            >
              Send invites
            </button>
          </form>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Members</h2>
          {forum.memberships.length === 0 ? (
            <p className="text-slate-600">No members yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {forum.memberships.map((m) => (
                <li key={m.userId} className="flex flex-col gap-3 py-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-medium">{m.user.displayName}</p>
                    <p className="text-sm text-slate-500">{m.user.email}</p>
                  </div>
                  <div className="flex flex-col gap-2 md:items-end">
                    <form
                      action={resetMemberPassword.bind(null, forum.id, m.userId)}
                      className="flex flex-wrap items-center gap-2"
                    >
                      <input
                        name="newPassword"
                        type="password"
                        required
                        minLength={6}
                        placeholder="New password"
                        className="w-40 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                      <button
                        type="submit"
                        className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm text-amber-800 hover:bg-amber-100"
                      >
                        Reset password
                      </button>
                    </form>
                    <form action={changeUserEmail.bind(null, m.userId)} className="flex items-center gap-2">
                      <input
                        name="newEmail"
                        type="email"
                        defaultValue={m.user.email}
                        required
                        className="w-40 rounded-lg border border-slate-300 px-2 py-1 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                      <button
                        type="submit"
                        className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                      >
                        Save email
                      </button>
                    </form>
                    <form action={removeMember.bind(null, forum.id, m.userId)}>
                      <button
                        type="submit"
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm text-red-700 hover:bg-red-100"
                      >
                        Remove from forum
                      </button>
                    </form>
                    {m.userId !== session.user.id && (
                      <DeleteUserButton
                        userId={m.userId}
                        userName={m.user.displayName}
                        userEmail={m.user.email}
                        deleteAction={deleteUser}
                      />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Pending invites</h2>
          {forum.invites.length === 0 ? (
            <p className="text-slate-600">No pending invites.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {forum.invites.map((invite) => (
                <li key={invite.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{invite.email}</p>
                    <p className="text-sm text-slate-500">
                      Expires {invite.expiresAt.toLocaleDateString()}
                    </p>
                  </div>
                  <form action={revokeInvite.bind(null, invite.id)}>
                    <button
                      type="submit"
                      className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm text-amber-800 hover:bg-amber-100"
                    >
                      Revoke
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}

export const dynamic = "force-dynamic"
