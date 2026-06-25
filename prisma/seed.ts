import { PrismaClient, UserRole } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  const name = process.env.ADMIN_NAME

  if (!email || !password || !name) {
    console.warn("ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_NAME must be set to seed admin.")
    return
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log("Admin user already exists.")
    return
  }

  const passwordHash = await bcrypt.hash(password, 12)

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      displayName: name,
      role: UserRole.global_admin,
    },
  })

  console.log("Admin user created.")
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
