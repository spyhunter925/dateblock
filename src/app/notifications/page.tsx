import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { markRead } from "./actions"

export default async function NotificationsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {notifications.length === 0 ? (
          <p className="text-slate-600">No notifications yet.</p>
        ) : (
          <ul className="space-y-3">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={`rounded-xl border p-4 shadow-sm ${
                  n.readAt ? "border-slate-200 bg-white" : "border-primary-200 bg-primary-50"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-medium">{n.title}</h3>
                    <p className="text-sm text-slate-600">{n.message}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {n.createdAt.toLocaleString()}
                    </p>
                  </div>
                  {!n.readAt && (
                    <form action={markRead.bind(null, n.id)}>
                      <button
                        type="submit"
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
                      >
                        Mark read
                      </button>
                    </form>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}

export const dynamic = "force-dynamic"
