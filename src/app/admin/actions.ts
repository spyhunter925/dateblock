"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { randomBytes } from "crypto"
import nodemailer from "nodemailer"
import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  })
}

export async function createForum(formData: FormData) {
  const session = await auth()
  if (!session?.user || session.user.role !== "global_admin") {
    throw new Error("Unauthorized")
  }

  const name = formData.get("name") as string
  const description = (formData.get("description") as string) || null
  const inviteEmailsRaw = (formData.get("inviteEmails") as string) || ""

  const forum = await prisma.forum.create({
    data: { name, description },
  })

  const emails = inviteEmailsRaw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)

  if (emails.length > 0) {
    const transporter = createTransport()
    for (const email of emails) {
      const token = randomBytes(32).toString("hex")
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
      const inviteUrl = `${baseUrl}/signup?token=${token}`

      await prisma.forumInvite.create({
        data: {
          forumId: forum.id,
          email,
          token,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      })

      try {
        await transporter.sendMail({
          from: process.env.SMTP_FROM,
          to: email,
          subject: `You're invited to join ${forum.name} on Dateblock`,
          text: `You've been invited to join the forum "${forum.name}" on Dateblock. Sign up here: ${inviteUrl}`,
          html: `<p>You've been invited to join the forum "${forum.name}" on Dateblock.</p><p><a href="${inviteUrl}">Sign up here</a></p>`,
        })
      } catch (err) {
        console.error(`Failed to send invite email to ${email}:`, err)
      }
    }
  }

  revalidatePath("/admin")
  redirect("/admin")
}

export async function deleteForum(id: string) {
  const session = await auth()
  if (!session?.user || session.user.role !== "global_admin") {
    throw new Error("Unauthorized")
  }

  await prisma.forum.update({
    where: { id },
    data: { archivedAt: new Date() },
  })

  revalidatePath("/admin")
}

export async function addMember(forumId: string, formData: FormData) {
  const session = await auth()
  if (!session?.user || session.user.role !== "global_admin") {
    throw new Error("Unauthorized")
  }

  const inviteEmailsRaw = (formData.get("inviteEmails") as string) || ""
  const emails = inviteEmailsRaw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)

  if (emails.length === 0) redirect(`/admin/forums/${forumId}`)

  const forum = await prisma.forum.findUnique({ where: { id: forumId } })
  if (!forum) redirect("/admin")

  const transporter = createTransport()
  for (const email of emails) {
    const token = randomBytes(32).toString("hex")
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
    const inviteUrl = `${baseUrl}/signup?token=${token}`

    await prisma.forumInvite.create({
      data: {
        forumId,
        email,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: `You're invited to join ${forum.name} on Dateblock`,
        text: `You've been invited to join the forum "${forum.name}" on Dateblock. Sign up here: ${inviteUrl}`,
        html: `<p>You've been invited to join the forum "${forum.name}" on Dateblock.</p><p><a href="${inviteUrl}">Sign up here</a></p>`,
      })
    } catch (err) {
      console.error(`Failed to send invite email to ${email}:`, err)
    }
  }

  revalidatePath(`/admin/forums/${forumId}`)
  redirect(`/admin/forums/${forumId}`)
}

export async function createMember(forumId: string, formData: FormData) {
  const session = await auth()
  if (!session?.user || session.user.role !== "global_admin") {
    throw new Error("Unauthorized")
  }

  const email = ((formData.get("email") as string) || "").trim().toLowerCase()
  const name = ((formData.get("name") as string) || "").trim()
  const password = formData.get("password") as string

  if (!email || !name || !password || password.length < 6) {
    redirect(`/admin/forums/${forumId}?error=invalid`)
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    redirect(`/admin/forums/${forumId}?error=exists`)
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      displayName: name,
      role: "forum_member",
    },
  })

  await prisma.forumMembership.create({
    data: { userId: user.id, forumId },
  })

  revalidatePath(`/admin/forums/${forumId}`)
  redirect(`/admin/forums/${forumId}?created=${encodeURIComponent(name)}`)
}

export async function resetMemberPassword(
  forumId: string,
  userId: string,
  formData: FormData
) {
  const session = await auth()
  if (!session?.user || session.user.role !== "global_admin") {
    throw new Error("Unauthorized")
  }

  const membership = await prisma.forumMembership.findFirst({
    where: { forumId, userId },
  })
  if (!membership) {
    redirect(`/admin/forums/${forumId}?error=notfound`)
  }

  const newPassword = formData.get("newPassword") as string
  if (!newPassword || newPassword.length < 6) {
    redirect(`/admin/forums/${forumId}?userId=${userId}&error=shortpass`)
  }

  const passwordHash = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  })

  revalidatePath(`/admin/forums/${forumId}`)
  redirect(`/admin/forums/${forumId}?reset=1`)
}

export async function removeMember(forumId: string, userId: string) {
  const session = await auth()
  if (!session?.user || session.user.role !== "global_admin") {
    throw new Error("Unauthorized")
  }

  await prisma.forumMembership.deleteMany({
    where: { forumId, userId },
  })

  revalidatePath(`/admin/forums/${forumId}`)
}

export async function deleteUser(userId: string) {
  const session = await auth()
  if (!session?.user || session.user.role !== "global_admin") {
    throw new Error("Unauthorized")
  }

  // Prevent admin from deleting themselves
  if (userId === session.user.id) {
    throw new Error("Cannot delete your own account")
  }

  // Cascade deletes memberships, blocked dates, and notifications via Prisma schema
  await prisma.user.delete({
    where: { id: userId },
  })

  revalidatePath("/admin/users")
  revalidatePath("/admin/forums")
}

export async function revokeInvite(inviteId: string) {
  const session = await auth()
  if (!session?.user || session.user.role !== "global_admin") {
    throw new Error("Unauthorized")
  }

  await prisma.forumInvite.delete({
    where: { id: inviteId },
  })

  revalidatePath("/admin")
}

export async function changeUserEmail(userId: string, formData: FormData) {
  const session = await auth()
  if (!session?.user || session.user.role !== "global_admin") {
    throw new Error("Unauthorized")
  }

  const newEmail = ((formData.get("newEmail") as string) || "").trim().toLowerCase()
  if (!newEmail || !newEmail.includes("@")) {
    throw new Error("Invalid email address")
  }

  const existing = await prisma.user.findUnique({ where: { email: newEmail } })
  if (existing && existing.id !== userId) {
    throw new Error("Email already in use by another user")
  }

  await prisma.user.update({
    where: { id: userId },
    data: { email: newEmail },
  })

  revalidatePath("/admin/users")
  revalidatePath("/admin/forums")
}
