import { prisma } from '../src/database'

export default async function (version, content) {
  if (!version) throw new Error('version is needed')
  if (!content || !content.length) throw new Error('content is needed')
  if (await prisma.update.findUnique({ where: { id: version } })) throw new Error('this version already exists')

  return await prisma.update.create({
    data: {
      id: version,
      content: {
        createMany: {
          data: content
        }
      },
      published_at: new Date()
    }
  })
}
