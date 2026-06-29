import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { ForumCalendarClient } from "./forum-calendar-client"

export default async function ForumPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const membership = await prisma.forumMembership.findFirst({
    where: { userId: session.user.id },
    include: { forum: true },
  })

  if (!membership) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6">
        <p className="text-slate-600">You are not a member of any forum.</p>
      </main>
    )
  }

  const memberCount = await prisma.forumMembership.count({
    where: { forumId: membership.forumId },
  })

  const blockedDates = await prisma.blockedDate.findMany({
    where: {
      user: {
        memberships: {
          some: { forumId: membership.forumId },
        },
      },
    },
    select: {
      date: true,
      userId: true,
      user: { select: { displayName: true, id: true } },
    },
  })

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="relative mx-auto max-w-4xl">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {membership.forum.name}{" "}
              <span className="text-lg font-normal text-slate-500">
                ({memberCount} member{memberCount !== 1 ? "s" : ""})
              </span>
            </h1>
            <p className="text-sm text-slate-600">Forum aggregate calendar</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/calendar"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              My Calendar
            </Link>
            <Link
              href="/members"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Members
            </Link>
          </div>
        </div>
        <ForumCalendarClient
          currentUserId={session.user.id}
          initialMonth={new Date(new Date().getFullYear(), new Date().getMonth(), 1)}
          blockedDates={blockedDates.map((b) => ({
            userId: b.userId,
            userName: b.user.displayName,
            date: b.date,
          }))}
        />
      </div>
    </main>
  )
}

export const dynamic = "force-dynamic"
