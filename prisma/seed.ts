import { PrismaClient, RewardType, UserRole, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Admin1234!", 10);

  await prisma.user.upsert({
    where: { email: "admin@esports.local" },
    update: {
      role: UserRole.SUPER_ADMIN
    },
    create: {
      email: "admin@esports.local",
      username: "admin",
      displayName: "Platform Admin",
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE
    }
  });

  await prisma.reward.upsert({
    where: { code: "WELCOME_XP" },
    update: {},
    create: {
      code: "WELCOME_XP",
      name: "Welcome XP",
      description: "Reward for joining the platform.",
      type: RewardType.XP,
      value: 100,
      isMonetary: false
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
