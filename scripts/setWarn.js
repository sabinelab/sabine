import { prisma } from '../packages/prisma'

export default async function () {
  await prisma.user.updateMany({
    data: {
      warn: true
    }
  })
}
