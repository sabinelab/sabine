import { prisma } from '../prisma'

export default async function () {
  let cursor = undefined
  while (true) {
    const users = await prisma.user.findMany({
      where: {
        warn: false
      },
      take: 1000,
      cursor: cursor
        ? {
            id: cursor
          }
        : cursor,
      select: {
        id: true
      }
    })
    if (!users.length) break

    await prisma.user.updateMany({
      where: {
        id: {
          in: users.map((user) => user.id)
        }
      },
      data: {
        warn: true
      }
    })

    cursor = users.at(-1)?.id
  }
}