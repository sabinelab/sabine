import { prisma } from '@db'
import { Elysia } from 'elysia'

export const updates = new Elysia().get('/updates', async ({ set }) => {
  const updates = await prisma.update.findMany({
    include: {
      content: true
    }
  })

  set.status = 'OK'

  return updates
})
