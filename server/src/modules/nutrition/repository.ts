import { prisma } from '../../platform/prisma.js'

export function create(data: {
  userId: string
  occurredOn: Date
  mealType: string
  name: string
  quantity: number
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
}) {
  return prisma.entry.create({ data })
}

export function listForDay(userId: string, occurredOn: Date) {
  return prisma.entry.findMany({
    where: { userId, occurredOn },
    orderBy: { createdAt: 'asc' },
  })
}

export function deleteOwned(userId: string, id: string) {
  return prisma.entry.deleteMany({ where: { id, userId } }).then((r) => r.count > 0)
}
