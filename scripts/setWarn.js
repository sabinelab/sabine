import { prisma } from '../src/database'

export default async function () {
  await prisma.user.updateMany({
    data: {
      warn: true
    }
  })
}
