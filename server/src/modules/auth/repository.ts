import { prisma } from '../../platform/prisma.js'

export function createUser(data: { email: string; passwordHash: string; displayName: string }) {
  return prisma.user.create({ data })
}

export function findByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } })
}

export function findById(id: string) {
  return prisma.user.findUnique({ where: { id } })
}

export function markInactive(id: string) {
  return prisma.user.update({ where: { id }, data: { isActive: false } })
}
