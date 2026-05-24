import {
  BracketStatus,
  ExternalAccountProvider,
  MatchStatus,
  RegistrationStatus,
  RewardType,
  RoundStatus,
  SpaceMemberRole,
  SpaceVisibility,
  TeamMemberRole,
  TournamentFormat,
  TournamentStatus,
  TournamentType,
  UserRole,
  UserStatus,
  WalletType
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const demoPassword = "Admin1234!";

async function ensureInternalWallet(userId: string, balance = 250) {
  const existing = await prisma.wallet.findFirst({
    where: {
      userId,
      type: WalletType.INTERNAL_REWARD,
      currencyCode: "DS_TOKEN"
    }
  });

  if (existing) {
    return prisma.wallet.update({
      where: { id: existing.id },
      data: {
        balance,
        nonWithdrawable: true
      }
    });
  }

  return prisma.wallet.create({
    data: {
      userId,
      type: WalletType.INTERNAL_REWARD,
      currencyCode: "DS_TOKEN",
      balance,
      nonWithdrawable: true
    }
  });
}

async function ensureTeamMember(teamId: string, userId: string, role: TeamMemberRole) {
  return prisma.teamMember.upsert({
    where: {
      teamId_userId: {
        teamId,
        userId
      }
    },
    update: { role },
    create: {
      teamId,
      userId,
      role
    }
  });
}

async function ensureSpaceMember(spaceId: string, userId: string, role: SpaceMemberRole) {
  return prisma.spaceMember.upsert({
    where: {
      spaceId_userId: {
        spaceId,
        userId
      }
    },
    update: { role },
    create: {
      spaceId,
      userId,
      role
    }
  });
}

async function ensureRegistration(params: {
  tournamentId: string;
  teamId?: string;
  userId?: string;
  status?: RegistrationStatus;
  approvedByUserId?: string;
}) {
  const existing = await prisma.tournamentRegistration.findFirst({
    where: {
      tournamentId: params.tournamentId,
      teamId: params.teamId,
      userId: params.userId
    }
  });

  if (existing) {
    return prisma.tournamentRegistration.update({
      where: { id: existing.id },
      data: {
        status: params.status ?? RegistrationStatus.CONFIRMED,
        approvedByUserId: params.approvedByUserId,
        approvedAt: params.approvedByUserId ? new Date() : existing.approvedAt
      }
    });
  }

  return prisma.tournamentRegistration.create({
    data: {
      tournamentId: params.tournamentId,
      teamId: params.teamId,
      userId: params.userId,
      status: params.status ?? RegistrationStatus.CONFIRMED,
      approvedByUserId: params.approvedByUserId,
      approvedAt: params.approvedByUserId ? new Date() : undefined
    }
  });
}

async function ensureDemoBracket(params: {
  tournamentId: string;
  registrations: Array<{ id: string }>;
}) {
  const existing = await prisma.bracket.findUnique({
    where: { tournamentId: params.tournamentId },
    include: {
      rounds: {
        include: {
          matches: true
        }
      }
    }
  });

  if (existing) {
    return existing;
  }

  return prisma.bracket.create({
    data: {
      tournamentId: params.tournamentId,
      status: BracketStatus.GENERATED,
      metadata: {
        source: "seed",
        description: "Bracket demo single elimination para validar UX sin Riot API real."
      },
      rounds: {
        create: [
          {
            name: "Semifinales",
            sequence: 1,
            status: RoundStatus.ACTIVE,
            matches: {
              create: [
                {
                  tournamentId: params.tournamentId,
                  homeRegistrationId: params.registrations[0]?.id,
                  awayRegistrationId: params.registrations[1]?.id,
                  status: MatchStatus.READY,
                  bestOf: 1,
                  riotShortCode: "MOCK-DS-LOL-SF1",
                  riotPlatform: "LA1",
                  riotRegion: "AMERICAS"
                },
                {
                  tournamentId: params.tournamentId,
                  homeRegistrationId: params.registrations[2]?.id,
                  awayRegistrationId: params.registrations[3]?.id,
                  status: MatchStatus.READY,
                  bestOf: 1,
                  riotShortCode: "MOCK-DS-LOL-SF2",
                  riotPlatform: "LA1",
                  riotRegion: "AMERICAS"
                }
              ]
            }
          },
          {
            name: "Final",
            sequence: 2,
            status: RoundStatus.PENDING,
            matches: {
              create: [
                {
                  tournamentId: params.tournamentId,
                  status: MatchStatus.PENDING,
                  bestOf: 3
                }
              ]
            }
          }
        ]
      }
    },
    include: {
      rounds: {
        include: {
          matches: true
        }
      }
    }
  });
}

async function main() {
  const passwordHash = await bcrypt.hash(demoPassword, 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@esports.local" },
    update: {
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      displayName: "Darkside Super Admin"
    },
    create: {
      email: "admin@esports.local",
      username: "admin",
      displayName: "Darkside Super Admin",
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      country: "EC"
    }
  });

  const organizer = await prisma.user.upsert({
    where: { email: "organizer@darkside.cool" },
    update: {
      role: UserRole.ORGANIZER,
      status: UserStatus.ACTIVE
    },
    create: {
      email: "organizer@darkside.cool",
      username: "darkside_org",
      displayName: "Organizador ESPE",
      passwordHash,
      role: UserRole.ORGANIZER,
      status: UserStatus.ACTIVE,
      country: "EC"
    }
  });

  const moderator = await prisma.user.upsert({
    where: { email: "moderator@darkside.cool" },
    update: {
      role: UserRole.MODERATOR,
      status: UserStatus.ACTIVE
    },
    create: {
      email: "moderator@darkside.cool",
      username: "darkside_mod",
      displayName: "Moderador Darkside",
      passwordHash,
      role: UserRole.MODERATOR,
      status: UserStatus.ACTIVE,
      country: "EC"
    }
  });

  const players = await Promise.all(
    [
      ["captain@darkside.cool", "capitan_espe", "Capitan ESPE"],
      ["player1@darkside.cool", "midlaner_espe", "Midlaner ESPE"],
      ["player2@darkside.cool", "sentinel_espe", "Sentinel ESPE"],
      ["player3@darkside.cool", "duelist_espe", "Duelist ESPE"],
      ["player4@darkside.cool", "support_espe", "Support ESPE"]
    ].map(([email, username, displayName]) =>
      prisma.user.upsert({
        where: { email },
        update: {
          status: UserStatus.ACTIVE,
          role: UserRole.USER
        },
        create: {
          email,
          username,
          displayName,
          passwordHash,
          role: UserRole.USER,
          status: UserStatus.ACTIVE,
          country: "EC"
        }
      })
    )
  );

  for (const user of [superAdmin, organizer, moderator, ...players]) {
    await ensureInternalWallet(user.id, user.role === UserRole.USER ? 300 : 500);
  }

  const welcomeReward = await prisma.reward.upsert({
    where: { code: "WELCOME_XP" },
    update: {
      name: "XP de bienvenida",
      description: "Recompensa interna por unirse a Darkside.gg.",
      type: RewardType.XP,
      value: 100,
      isMonetary: false
    },
    create: {
      code: "WELCOME_XP",
      name: "XP de bienvenida",
      description: "Recompensa interna por unirse a Darkside.gg.",
      type: RewardType.XP,
      value: 100,
      isMonetary: false
    }
  });

  await prisma.reward.upsert({
    where: { code: "RIOT_MOCK_READY" },
    update: {
      name: "Riot ID Mock Listo",
      description: "Badge interno para usuarios que prueban vinculacion Riot en modo mock.",
      type: RewardType.BADGE,
      value: 1,
      isMonetary: false
    },
    create: {
      code: "RIOT_MOCK_READY",
      name: "Riot ID Mock Listo",
      description: "Badge interno para usuarios que prueban vinculacion Riot en modo mock.",
      type: RewardType.BADGE,
      value: 1,
      isMonetary: false
    }
  });

  for (const user of players) {
    const existingReward = await prisma.userReward.findFirst({
      where: {
        userId: user.id,
        rewardId: welcomeReward.id
      }
    });

    if (!existingReward) {
      await prisma.userReward.create({
        data: {
          userId: user.id,
          rewardId: welcomeReward.id,
          grantedByUserId: superAdmin.id,
          notes: "Seed demo Darkside.gg"
        }
      });
    }
  }

  await prisma.userGameAccount.upsert({
    where: { id: "riot-mock-captain-espe" },
    update: {
      riotGameName: "Palax",
      riotTagLine: "LAN",
      verified: true,
      verifiedAt: new Date(),
      lastSyncedAt: new Date()
    },
    create: {
      id: "riot-mock-captain-espe",
      userId: players[0].id,
      provider: ExternalAccountProvider.RIOT,
      game: "LEAGUE_OF_LEGENDS",
      riotGameName: "Palax",
      riotTagLine: "LAN",
      externalPlayerId: "mock-palax-lan",
      puuid: "mock-puuid-palax-lan",
      summonerId: "mock-summoner-palax",
      platformRoute: "LA1",
      regionalRoute: "AMERICAS",
      verified: true,
      verifiedAt: new Date(),
      lastSyncedAt: new Date(),
      metadata: {
        mode: "mock",
        level: 132,
        source: "seed"
      }
    }
  });

  const teams = await Promise.all([
    prisma.team.upsert({
      where: { slug: "espe-dark-wolves" },
      update: {
        name: "ESPE Dark Wolves",
        tag: "EDW",
        ownerId: players[0].id,
        description: "Roster universitario de League of Legends para torneos internos."
      },
      create: {
        name: "ESPE Dark Wolves",
        slug: "espe-dark-wolves",
        tag: "EDW",
        ownerId: players[0].id,
        description: "Roster universitario de League of Legends para torneos internos."
      }
    }),
    prisma.team.upsert({
      where: { slug: "red-sentinel-espe" },
      update: {
        name: "Red Sentinel ESPE",
        tag: "RSE",
        ownerId: players[2].id,
        description: "Escuadra tactica enfocada en VALORANT."
      },
      create: {
        name: "Red Sentinel ESPE",
        slug: "red-sentinel-espe",
        tag: "RSE",
        ownerId: players[2].id,
        description: "Escuadra tactica enfocada en VALORANT."
      }
    }),
    prisma.team.upsert({
      where: { slug: "nova-esports-u" },
      update: {
        name: "Nova Esports U",
        tag: "NOV",
        ownerId: players[3].id,
        description: "Equipo invitado para brackets demo."
      },
      create: {
        name: "Nova Esports U",
        slug: "nova-esports-u",
        tag: "NOV",
        ownerId: players[3].id,
        description: "Equipo invitado para brackets demo."
      }
    }),
    prisma.team.upsert({
      where: { slug: "summoners-lab" },
      update: {
        name: "Summoners Lab",
        tag: "SLB",
        ownerId: players[4].id,
        description: "Roster demo para completar bracket single elimination."
      },
      create: {
        name: "Summoners Lab",
        slug: "summoners-lab",
        tag: "SLB",
        ownerId: players[4].id,
        description: "Roster demo para completar bracket single elimination."
      }
    })
  ]);

  await ensureTeamMember(teams[0].id, players[0].id, TeamMemberRole.OWNER);
  await ensureTeamMember(teams[0].id, players[1].id, TeamMemberRole.MEMBER);
  await ensureTeamMember(teams[1].id, players[2].id, TeamMemberRole.OWNER);
  await ensureTeamMember(teams[2].id, players[3].id, TeamMemberRole.OWNER);
  await ensureTeamMember(teams[3].id, players[4].id, TeamMemberRole.OWNER);

  const espeSpace = await prisma.space.upsert({
    where: { slug: "espe-darkside-arena" },
    update: {
      name: "ESPE Darkside Arena",
      description: "Comunidad demo para organizar torneos universitarios, scrims y brackets auditables.",
      ownerId: organizer.id,
      visibility: SpaceVisibility.PUBLIC
    },
    create: {
      name: "ESPE Darkside Arena",
      slug: "espe-darkside-arena",
      description: "Comunidad demo para organizar torneos universitarios, scrims y brackets auditables.",
      ownerId: organizer.id,
      visibility: SpaceVisibility.PUBLIC
    }
  });

  await ensureSpaceMember(espeSpace.id, organizer.id, SpaceMemberRole.OWNER);
  await ensureSpaceMember(espeSpace.id, moderator.id, SpaceMemberRole.MODERATOR);
  for (const player of players) {
    await ensureSpaceMember(espeSpace.id, player.id, SpaceMemberRole.MEMBER);
  }

  const registrationClosesAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
  const startsAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 10);

  const lolTournament = await prisma.tournament.upsert({
    where: { slug: "darkside-cup-espe-lol" },
    update: {
      name: "Darkside Cup ESPE - League of Legends",
      status: TournamentStatus.REGISTRATION_OPEN,
      registrationClosesAt,
      startsAt
    },
    create: {
      spaceId: espeSpace.id,
      organizerId: organizer.id,
      name: "Darkside Cup ESPE - League of Legends",
      slug: "darkside-cup-espe-lol",
      game: "LEAGUE_OF_LEGENDS",
      platformRoute: "LA1",
      regionalRoute: "AMERICAS",
      teamSize: 5,
      format: TournamentFormat.SINGLE_ELIMINATION,
      type: TournamentType.TEAM,
      status: TournamentStatus.REGISTRATION_OPEN,
      publicRules: "Torneo universitario en modo MVP. Resultados manuales, evidencias y Riot mock para pruebas.",
      prizes: "XP, badges y tokens internos no monetarios.",
      entryFeeTokens: 0,
      maxParticipants: 16,
      minParticipants: 4,
      checkInEnabled: true,
      registrationClosesAt,
      startsAt
    }
  });

  const valorantTournament = await prisma.tournament.upsert({
    where: { slug: "red-sentinel-open-valorant" },
    update: {
      name: "Red Sentinel Open - VALORANT",
      status: TournamentStatus.PUBLISHED,
      registrationClosesAt,
      startsAt
    },
    create: {
      spaceId: espeSpace.id,
      organizerId: organizer.id,
      name: "Red Sentinel Open - VALORANT",
      slug: "red-sentinel-open-valorant",
      game: "VALORANT",
      platformRoute: "LATAM",
      regionalRoute: "AMERICAS",
      teamSize: 5,
      format: TournamentFormat.SINGLE_ELIMINATION,
      type: TournamentType.TEAM,
      status: TournamentStatus.PUBLISHED,
      publicRules: "Circuito tactico demo para validar inscripciones, check-in y reportes.",
      prizes: "Badges, XP y beneficios internos no monetarios.",
      entryFeeTokens: 0,
      maxParticipants: 8,
      minParticipants: 4,
      checkInEnabled: true,
      registrationClosesAt,
      startsAt
    }
  });

  const registrations = [];
  for (const team of teams) {
    registrations.push(
      await ensureRegistration({
        tournamentId: lolTournament.id,
        teamId: team.id,
        status: RegistrationStatus.CONFIRMED,
        approvedByUserId: organizer.id
      })
    );
  }

  await ensureRegistration({
    tournamentId: valorantTournament.id,
    teamId: teams[1].id,
    status: RegistrationStatus.CONFIRMED,
    approvedByUserId: organizer.id
  });

  await ensureRegistration({
    tournamentId: valorantTournament.id,
    teamId: teams[2].id,
    status: RegistrationStatus.PENDING
  });

  await ensureDemoBracket({
    tournamentId: lolTournament.id,
    registrations
  });

  await prisma.prizePool.upsert({
    where: { id: "seed-prizepool-lol" },
    update: {
      tournamentId: lolTournament.id,
      name: "Recompensas internas Darkside",
      currencyCode: "DS_TOKEN",
      totalAmount: 1200
    },
    create: {
      id: "seed-prizepool-lol",
      tournamentId: lolTournament.id,
      name: "Recompensas internas Darkside",
      currencyCode: "DS_TOKEN",
      totalAmount: 1200
    }
  });

  const existingAudit = await prisma.auditLog.findFirst({
    where: {
      action: "seed.demo.ready",
      entityType: "platform"
    }
  });

  if (!existingAudit) {
    await prisma.auditLog.create({
      data: {
        actorUserId: superAdmin.id,
        action: "seed.demo.ready",
        entityType: "platform",
        entityId: "darkside-demo",
        after: {
          users: 8,
          teams: teams.length,
          tournaments: 2,
          riotMode: "mock"
        },
        metadata: {
          note: "Datos demo no monetarios para MVP universitario."
        }
      }
    });
  }

  console.log("Seed demo Darkside.gg listo.");
  console.log(`Credenciales demo: admin@esports.local / ${demoPassword}`);
  console.log(`Jugador demo: captain@darkside.cool / ${demoPassword}`);
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
