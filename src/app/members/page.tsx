import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { MemberCalendarClient } from "./member-calendar-client"

export default async function MembersPage({
  searchParams,
}: {
  searchParams: { userId?: string }
}) {
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

  const members = await prisma.forumMembership.findMany({
    where: { forumId: membership.forumId },
    include: { user: true },
    orderBy: { user: { displayName: "asc" } },
  })

  const selectedUserId = searchParams.userId || members[0]?.userId
  const selectedMember = members.find((m) => m.userId === selectedUserId)

  let blockedDates: { userId: string; userName: string; date: string }[] = []
  if (selectedMember) {
    const dates = await prisma.blockedDate.findMany({
      where: { userId: selectedMember.userId },
      select: { date: true, userId: true },
    })
    blockedDates = dates.map((d) => ({
      userId: d.userId,
      userName: selectedMember.user.displayName,
      date: d.date,
    }))
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">{membership.forum.name} Members</h1>
            <p className="text-sm text-slate-600">View a member&apos;s calendar</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/calendar"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              My Calendar
            </Link>
            <Link
              href="/forum"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Forum Calendar
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {members.map((m) => (
            <Link
              key={m.userId}
              href={`/members?userId=${m.userId}`}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                selectedUserId === m.userId
                  ? "border-primary-600 bg-primary-50 text-primary-700"
                  : "border-slate-300 bg-white hover:bg-slate-50"
              }`}
            >
              {m.user.displayName} {m.userId === session.user.id && "(You)"}
            </Link>
          ))}
        </div>

        {selectedMember ? (
          <MemberCalendarClient
            userId={selectedMember.userId}
            userName={selectedMember.user.displayName}
            isCurrentUser={selectedMember.userId === session.user.id}
            blockedDates={blockedDates}
          />
        ) : (
          <p className="text-slate-600">No members to display.</p>
        )}
      </div>
    </main>
  )
}

export const dynamic = "force-dynamic"
