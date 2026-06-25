import { prisma } from "@/lib/prisma"

const date = process.env.TEST_DATE || new Date().toISOString().slice(0, 10)

async function main() {
  const user = await prisma.user.findUnique({ where: { email: "member@example.com" } })
  if (!user) throw new Error("Test user missing")

  await prisma.blockedDate.upsert({
    where: { userId_date: { userId: user.id, date } },
    update: {},
    create: { userId: user.id, date },
  })

  console.log("Blocked", date, "for", user.id)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
