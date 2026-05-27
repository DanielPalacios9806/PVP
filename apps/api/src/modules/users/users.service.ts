import { prisma } from "../../lib/prisma.js";
import { badRequest, notFound } from "../../utils/http-error.js";
import { UserStatus } from "@prisma/client";

interface RequestUserDeletionInput {
  userId: string;
  ipAddress?: string | null;
}

interface ExecuteUserDeletionInput {
  userId: string;
  ipAddress?: string | null;
}

interface DeletionResult {
  email: string;
  scheduledForDeletion: string;
}

interface DeletedResult {
  previousEmail: string;
  deletedAt: string;
}

/**
 * Solicita eliminación de cuenta de usuario
 * Marca la cuenta como "pendiente de eliminación"
 * Proporciona un período de gracia de 30 días
 */
export async function requestUserDeletion(input: RequestUserDeletionInput): Promise<DeletionResult> {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true, email: true, status: true }
  });

  if (!user) {
    throw notFound("Usuario no encontrado");
  }

  if (user.status === UserStatus.SUSPENDED) {
    throw badRequest("No puedes solicitar eliminación siendo una cuenta suspendida");
  }

  // Calcular fecha de eliminación (30 días desde ahora)
  const scheduledForDeletionDate = new Date();
  scheduledForDeletionDate.setDate(scheduledForDeletionDate.getDate() + 30);

  // Actualizar usuario con estado de eliminación pendiente
  await prisma.user.update({
    where: { id: input.userId },
    data: {
      status: UserStatus.PENDING,
      updatedAt: new Date()
    }
  });

  // En una implementación real, aquí enviarías un email de confirmación
  // await sendDeletionConfirmationEmail({
  //   email: user.email,
  //   confirmationUrl: `${FRONTEND_URL}/legal/data-deletion/confirm?token=${token}`,
  //   deletionDate: scheduledForDeletionDate
  // });

  return {
    email: user.email,
    scheduledForDeletion: scheduledForDeletionDate.toISOString()
  };
}

/**
 * Ejecuta la eliminación real de datos de usuario
 * Se puede llamar automáticamente después de 30 días
 * O manualmente si el usuario confirma vía email
 */
export async function executeUserDeletion(input: ExecuteUserDeletionInput): Promise<DeletedResult> {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true, email: true, status: true }
  });

  if (!user) {
    throw notFound("Usuario no encontrado");
  }

  const previousEmail = user.email;

  // Anonimizar datos personales
  await prisma.user.update({
    where: { id: input.userId },
    data: {
      email: `deleted-${input.userId}@deleted.local`,
      displayName: `Deleted User ${input.userId.slice(0, 8)}`,
      username: `deleted_${input.userId.slice(0, 8)}`,
      passwordHash: `deleted_${Date.now()}`,
      updatedAt: new Date()
    }
  });

  // Desvincular todas las cuentas OAuth
  await prisma.userOAuthAccount.deleteMany({
    where: { userId: input.userId }
  });

  // Anonimizar datos de Riot
  await prisma.userGameAccount.updateMany({
    where: { userId: input.userId },
    data: {
      riotGameName: "Deleted",
      riotTagLine: "DELETED",
      summonerId: `deleted_${input.userId}`,
      externalPlayerId: null,
      puuid: null,
      verified: false,
      verificationStatus: "MANUAL",
      verifiedAt: null,
      lastSyncedAt: null,
      metadata: {
        deleted: true,
        deletedAt: new Date().toISOString()
      }
    }
  });

  // Opcionalmente, anonimizar wallets (retener para auditoría pero no accesible)
  // Los wallets se dejan con los mismos IDs pero usuario anónimo no puede acceder

  return {
    previousEmail,
    deletedAt: new Date().toISOString()
  };
}

/**
 * Cancelar solicitud de eliminación
 * El usuario puede cambiar de opinión durante el período de gracia
 */
export async function cancelUserDeletionRequest(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { status: true }
  });

  if (!user) {
    throw notFound("Usuario no encontrado");
  }

  if (user.status !== UserStatus.PENDING) {
    throw badRequest("Tu cuenta no tiene una solicitud de eliminación pendiente");
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      status: UserStatus.ACTIVE,
      updatedAt: new Date()
    }
  });

  return { message: "Solicitud de eliminación cancelada. Tu cuenta está activa de nuevo." };
}
