import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { UserRole, UserStatus, WalletType } from "@prisma/client";
import { env } from "../../config/env.js";
import { prisma } from "../../lib/prisma.js";
import { conflict, unauthorized } from "../../utils/http-error.js";
import { createAuditLog } from "../audit/audit.service.js";

export async function registerUser(data: {
  email: string;
  username: string;
  displayName: string;
  password: string;
  ipAddress?: string | null;
}) {
  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email: data.email }, { username: data.username }]
    }
  });

  if (existing) {
    throw conflict("Email or username already exists");
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      username: data.username,
      displayName: data.displayName,
      passwordHash,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      wallets: {
        create: {
          type: WalletType.INTERNAL_REWARD,
          currencyCode: "TOKENS",
          balance: 100,
          nonWithdrawable: true
        }
      }
    },
    include: {
      wallets: true
    }
  });

  await createAuditLog({
    actorUserId: user.id,
    action: "auth.register",
    entityType: "user",
    entityId: user.id,
    after: { email: user.email, username: user.username, role: user.role },
    ipAddress: data.ipAddress
  });

  return user;
}

export async function loginUser(data: { email: string; password: string; ipAddress?: string | null }) {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
    include: {
      wallets: true
    }
  });

  if (!user) {
    throw unauthorized("Invalid credentials");
  }

  const valid = await bcrypt.compare(data.password, user.passwordHash);

  if (!valid) {
    throw unauthorized("Invalid credentials");
  }

  const token = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role
    },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"]
    }
  );

  await createAuditLog({
    actorUserId: user.id,
    action: "auth.login",
    entityType: "user",
    entityId: user.id,
    metadata: { email: user.email },
    ipAddress: data.ipAddress
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      role: user.role
    },
    wallet: {
      balance: Number(user.wallets[0]?.balance ?? 100),
      currencyCode: user.wallets[0]?.currencyCode ?? "TOKENS"
    }
  };
}
