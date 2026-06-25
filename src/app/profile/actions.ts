"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function changePassword(currentPassword: string, newPassword: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  if (!currentPassword || !newPassword || newPassword.length < 6) {
    return { success: false, message: "Current and new password are required, with new password at least 6 characters." }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, passwordHash: true },
  })

  if (!user) {
    return { success: false, message: "User not found." }
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!valid) {
    return { success: false, message: "Current password is incorrect." }
  }

  const newHash = await bcrypt.hash(newPassword, 12)

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash },
  })

  return { success: true, message: "Password changed successfully." }
}
