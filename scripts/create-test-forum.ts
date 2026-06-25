import { prisma } from "@/lib/prisma"

async function main() {
  const forum = await prisma.forum.upsert({
    where: { id: "test-forum-id" },
    update: {},
    create: {
      id: "test-forum-id",
      name: "Test Forum",
      description: "Created for smoke testing",
    },
  })
  console.log("Forum ready:", forum.id, forum.name)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
