"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { format } from "date-fns"

export async function blockDates(dates: string[]) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const normalized = dates.filter((d) => !isNaN(Date.parse(d)))
  if (normalized.length === 0) return

  const data = normalized.map((date) => ({ userId: session.user.id, date }))

  await prisma.blockedDate.createMany({
    data,
    skipDuplicates: true,
  })

  await notifyForumMembers(session.user.id, normalized, "blocked")

  revalidatePath("/calendar")
  revalidatePath("/forum")
  revalidatePath("/members")
}

export async function unblockDates(dates: string[]) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  await prisma.blockedDate.deleteMany({
    where: {
      userId: session.user.id,
      date: { in: dates },
    },
  })

  await notifyForumMembers(session.user.id, dates, "unblocked")

  revalidatePath("/calendar")
  revalidatePath("/forum")
  revalidatePath("/members")
}

async function notifyForumMembers(actorUserId: string, dates: string[], action: "blocked" | "unblocked") {
  const membership = await prisma.forumMembership.findFirst({
    where: { userId: actorUserId },
    include: { forum: true, user: true },
  })

  if (!membership) return

  const actorName = membership.user.displayName
  const forumId = membership.forumId

  const otherMembers = await prisma.forumMembership.findMany({
    where: { forumId, userId: { not: actorUserId } },
    select: { userId: true },
  })

  const summary =
    dates.length === 1
      ? format(new Date(dates[0]), "MMM d")
      : `${format(new Date(dates[0]), "MMM d")} - ${format(new Date(dates[dates.length - 1]), "MMM d")}`

  const title = action === "blocked" ? "Schedule changed" : "Schedule opened up"
  const message = `${actorName} ${action} ${dates.length} date(s) (${summary}) in ${membership.forum.name}.`

  await prisma.notification.createMany({
    data: otherMembers.map((m) => ({
      userId: m.userId,
      type: "BLOCKS_CHANGED" as const,
      title,
      message,
    })),
  })
}
