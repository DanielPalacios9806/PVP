import { prisma } from "../lib/prisma.js";

export async function getAuthProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      role: true,
      status: true,
      createdAt: true,
      wallets: {
        select: {
          id: true,
          type: true,
          currencyCode: true,
          balance: true,
          nonWithdrawable: true
        }
      }
    }
  });
}
