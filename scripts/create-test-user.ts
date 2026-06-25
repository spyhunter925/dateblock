import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

async function main() {
  const email = "member@example.com"
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log("Test user already exists.")
    return
  }

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash("testpass", 12),
      displayName: "Test Member",
      role: "forum_member",
    },
  })

  await prisma.forumMembership.create({
    data: {
      userId: user.id,
      forumId: "test-forum-id",
    },
  })

  console.log("Test user created:", user.id, user.email)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
