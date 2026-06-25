"use client"

import Link from "next/link"

type ForumWithCount = {
  id: string
  name: string
  description: string | null
  _count: { memberships: number }
}

export function AdminForumList({
  forums,
  deleteForum,
}: {
  forums: ForumWithCount[]
  deleteForum: (id: string) => Promise<void>
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold">Forums</h2>
      {forums.length === 0 ? (
        <p className="text-slate-600">No forums yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {forums.map((forum) => (
            <li key={forum.id} className="flex items-center justify-between py-4">
              <div>
                <h3 className="font-medium">{forum.name}</h3>
                <p className="text-sm text-slate-500">
                  {forum.description || "No description"} · {forum._count.memberships} members
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/admin/forums/${forum.id}`}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
                >
                  Manage
                </Link>
                <form
                  action={async () => {
                    if (confirm(`Delete "${forum.name}"? This cannot be undone.`)) {
                      await deleteForum(forum.id)
                    }
                  }}
                >
                  <button
                    type="submit"
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm text-red-700 hover:bg-red-100"
                  >
                    Delete
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
