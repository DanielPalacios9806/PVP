import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { UserRole, UserStatus, WalletType } from "@prisma/client";
import { env } from "../../config/env.js";
import { prisma } from "../../lib/prisma.js";
import { badRequest, conflict, unauthorized } from "../../utils/http-error.js";
import { createAuditLog } from "../audit/audit.service.js";

type AuthSessionUser = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: UserRole;
  mustChangePassword: boolean;
  wallets?: Array<{
    balance: unknown;
    currencyCode: string;
  }>;
};

export function createAuthSession(user: AuthSessionUser) {
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

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      mustChangePassword: user.mustChangePassword
    },
    wallet: {
      balance: Number(user.wallets?.[0]?.balance ?? 100),
      currencyCode: user.wallets?.[0]?.currencyCode ?? "TOKENS"
    }
  };
}

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
    throw conflict("El correo o usuario ya esta registrado.");
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
      mustChangePassword: false,
      passwordChangedAt: new Date(),
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
    throw unauthorized("Correo o contrasena incorrectos.");
  }

  if (user.status !== UserStatus.ACTIVE) {
    throw unauthorized("La cuenta no esta activa.");
  }

  const valid = await bcrypt.compare(data.password, user.passwordHash);

  if (!valid) {
    throw unauthorized("Correo o contrasena incorrectos.");
  }

  await createAuditLog({
    actorUserId: user.id,
    action: "auth.login",
    entityType: "user",
    entityId: user.id,
    metadata: { email: user.email },
    ipAddress: data.ipAddress
  });

  return createAuthSession(user);
}

export async function changePassword(data: {
  userId: string;
  currentPassword: string;
  newPassword: string;
  ipAddress?: string | null;
}) {
  const user = await prisma.user.findUnique({
    where: { id: data.userId }
  });

  if (!user) {
    throw unauthorized("Invalid session");
  }

  const valid = await bcrypt.compare(data.currentPassword, user.passwordHash);

  if (!valid) {
    throw unauthorized("La contrasena actual es incorrecta.");
  }

  const samePassword = await bcrypt.compare(data.newPassword, user.passwordHash);

  if (samePassword) {
    throw badRequest("La nueva contrasena debe ser diferente de la actual.");
  }

  const passwordHash = await bcrypt.hash(data.newPassword, 10);
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      mustChangePassword: false,
      passwordChangedAt: new Date()
    },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      role: true,
      mustChangePassword: true,
      passwordChangedAt: true
    }
  });

  await createAuditLog({
    actorUserId: user.id,
    action: "auth.password.change",
    entityType: "user",
    entityId: user.id,
    before: { mustChangePassword: user.mustChangePassword },
    after: {
      mustChangePassword: updated.mustChangePassword,
      passwordChangedAt: updated.passwordChangedAt
    },
    ipAddress: data.ipAddress
  });

  return updated;
}
