import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { deleteUser, changeUserEmail } from "../actions"
import { DeleteUserButton } from "../delete-user-button"

export default async function AdminUsersPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "global_admin") {
    redirect("/")
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      memberships: {
        include: { forum: true },
        orderBy: { forum: { name: "asc" } },
      },
    },
  })

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">All Users</h1>
            <p className="text-sm text-slate-600">
              {users.length} user{users.length !== 1 ? "s" : ""} total
            </p>
          </div>
          <Link
            href="/admin"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Back to admin
          </Link>
        </div>

        {users.length === 0 ? (
          <p className="text-slate-600">No users yet.</p>
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <div
                key={user.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{user.displayName}</p>
                      {user.role === "global_admin" && (
                        <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-800">
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">{user.email}</p>
                    <p className="text-xs text-slate-400">
                      Joined {user.createdAt.toLocaleDateString()}
                    </p>

                    {user.memberships.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {user.memberships.map((m) => (
                          <Link
                            key={m.id}
                            href={`/admin/forums/${m.forumId}`}
                            className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs text-slate-600 hover:bg-slate-100"
                          >
                            {m.forum.name}
                          </Link>
                        ))}
                      </div>
                    )}
                    {user.memberships.length === 0 && (
                      <p className="text-xs italic text-slate-400">
                        No forum memberships
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {user.id !== session.user.id ? (
                      <>
                        <form
                          action={changeUserEmail.bind(null, user.id)}
                          className="flex items-center gap-2"
                        >
                          <input
                            name="newEmail"
                            type="email"
                            defaultValue={user.email}
                            required
                            className="w-48 rounded-lg border border-slate-300 px-2 py-1 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                          />
                          <button
                            type="submit"
                            className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                          >
                            Save
                          </button>
                        </form>
                        <DeleteUserButton
                          userId={user.id}
                          userName={user.displayName}
                          userEmail={user.email}
                          deleteAction={deleteUser}
                        />
                      </>
                    ) : (
                      <span className="text-xs text-slate-400">This is you</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

export const dynamic = "force-dynamic"