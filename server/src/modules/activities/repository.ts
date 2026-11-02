import type { Prisma } from '../../generated/prisma/client.js'
import { prisma } from '../../platform/prisma.js'

export interface SessionFilter {
  type?: string | undefined
  from?: Date | undefined
  to?: Date | undefined
}

function where(userId: string, f: SessionFilter): Prisma.SessionWhereInput {
  return {
    userId,
    ...(f.type ? { type: f.type } : {}),
    ...(f.from || f.to ? { occurredOn: { ...(f.from ? { gte: f.from } : {}), ...(f.to ? { lte: f.to } : {}) } } : {}),
  }
}

export function create(data: {
  userId: string
  type: string
  occurredOn: Date
  durationMinutes: number
  metrics: Prisma.InputJsonValue
}) {
  return prisma.session.create({ data })
}

export function list(userId: string, filter: SessionFilter, page?: { limit: number; offset: number }) {
  return prisma.session.findMany({
    where: where(userId, filter),
    orderBy: [{ occurredOn: 'desc' }, { createdAt: 'desc' }],
    ...(page ? { take: page.limit, skip: page.offset } : {}),
  })
}

export function findOwned(userId: string, id: string) {
  return prisma.session.findFirst({ where: { id, userId } })
}

export async function deleteOwned(userId: string, id: string): Promise<boolean> {
  const { count } = await prisma.session.deleteMany({ where: { id, userId } })
  return count > 0
}
