import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PersonalCalendarClient } from "./personal-calendar-client"

export default async function CalendarPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const membership = await prisma.forumMembership.findFirst({
    where: { userId: session.user.id },
    include: { forum: true },
  })

  const blockedDates = await prisma.blockedDate.findMany({
    where: { userId: session.user.id },
    select: { date: true, userId: true },
  })

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        <PersonalCalendarClient
          userId={session.user.id}
          userName={session.user.name || "You"}
          forumName={membership?.forum.name || "No forum"}
          initialBlockedDates={blockedDates.map((b) => ({
            userId: b.userId,
            userName: session.user.name || "You",
            date: b.date,
          }))}
        />
      </div>
    </main>
  )
}

export const dynamic = "force-dynamic"
