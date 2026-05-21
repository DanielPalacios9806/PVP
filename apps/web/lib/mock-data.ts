export const mockTeams = [
  {
    id: "mock-team-1",
    name: "Blue Wolves",
    slug: "blue-wolves",
    tag: "BW",
    status: "ACTIVE",
    description: "Roster principal preparado para brackets semanales y copas de temporada.",
    members: [
      {
        id: "tm1",
        userId: "u1",
        role: "OWNER",
        joinedAt: new Date().toISOString(),
        user: { id: "u1", username: "mauro", displayName: "Mauro" }
      },
      {
        id: "tm2",
        userId: "u2",
        role: "CAPTAIN",
        joinedAt: new Date().toISOString(),
        user: { id: "u2", username: "rook", displayName: "Rook" }
      }
    ],
    registrations: [
      {
        id: "tr1",
        status: "CHECKED_IN",
        tournament: {
          id: "mock-tournament-1",
          name: "VALORANT Night Circuit",
          game: "VALORANT"
        }
      }
    ]
  }
];

export const mockSpaces = [
  {
    id: "mock-space-1",
    name: "Darkside Campus",
    slug: "latam-arena",
    visibility: "PUBLIC",
    status: "ACTIVE",
    description: "Hub competitivo regional para equipos organizados, eventos y scrims.",
    members: [
      {
        id: "sm1",
        userId: "u1",
        role: "OWNER",
        joinedAt: new Date().toISOString(),
        user: { id: "u1", username: "mauro", displayName: "Mauro" }
      },
      {
        id: "sm2",
        userId: "u3",
        role: "MODERATOR",
        joinedAt: new Date().toISOString(),
        user: { id: "u3", username: "viper", displayName: "Viper" }
      }
    ],
    tournaments: [
      {
        id: "mock-tournament-1",
        name: "VALORANT Night Circuit",
        game: "VALORANT",
        status: "IN_PROGRESS"
      }
    ]
  }
];

export const mockTournaments = [
  {
    id: "mock-tournament-1",
    name: "VALORANT Night Circuit",
    game: "VALORANT",
    format: "SINGLE_ELIMINATION",
    type: "TEAM",
    status: "IN_PROGRESS",
    maxParticipants: 8,
    registrations: [
      {
        id: "reg-a",
        status: "CHECKED_IN",
        team: { id: "mock-team-1", name: "Blue Wolves", tag: "BW" }
      },
      {
        id: "reg-b",
        status: "CHECKED_IN",
        team: { id: "mock-team-2", name: "Neon Strike", tag: "NS" }
      }
    ],
    organizer: {
      id: "u1",
      username: "mauro",
      displayName: "Mauro"
    },
    rules: "Bo1 hasta la final. Final Bo3. Reporte manual con evidencia obligatoria.",
    bracket: {
      rounds: [
        {
          id: "round-1",
          name: "Round 1",
          sequence: 1,
          status: "ACTIVE",
          matches: [
            {
              id: "mock-match-1",
              status: "READY",
              bestOf: 1,
              homeRegistration: {
                id: "reg-a",
                team: { name: "Blue Wolves", tag: "BW" }
              },
              awayRegistration: {
                id: "reg-b",
                team: { name: "Neon Strike", tag: "NS" }
              },
              winnerRegistration: null
            }
          ]
        },
        {
          id: "round-2",
          name: "Final",
          sequence: 2,
          status: "PENDING",
          matches: [
            {
              id: "mock-match-2",
              status: "PENDING",
              bestOf: 3,
              homeRegistration: null,
              awayRegistration: null,
              winnerRegistration: null
            }
          ]
        }
      ]
    }
  }
];

export const mockMatch = {
  id: "mock-match-1",
  status: "RESULT_PENDING",
  bestOf: 1,
  round: { id: "round-1", name: "Round 1" },
  tournament: {
    id: "mock-tournament-1",
    name: "VALORANT Night Circuit",
    game: "VALORANT",
    format: "SINGLE_ELIMINATION",
    type: "TEAM",
    status: "IN_PROGRESS"
  },
  homeRegistration: {
    id: "reg-a",
    team: { id: "mock-team-1", name: "Blue Wolves", tag: "BW" }
  },
  awayRegistration: {
    id: "reg-b",
    team: { id: "mock-team-2", name: "Neon Strike", tag: "NS" }
  },
  winnerRegistration: null,
  results: [
    {
      id: "result-1",
      status: "PENDING_CONFIRMATION",
      homeScore: 1,
      awayScore: 0,
      winnerRegistrationId: "reg-a",
      notes: "Resultado reportado por el capitan con captura de pantalla."
    }
  ],
  disputes: [
    {
      id: "dispute-1",
      status: "OPEN",
      reason: "El rival solicito verificacion manual antes de confirmar el resultado.",
      createdAt: new Date().toISOString()
    }
  ]
};

export const mockAuditLogs = [
  {
    id: "log-1",
    action: "tournament.create",
    entityType: "tournament",
    entityId: "mock-tournament-1",
    createdAt: new Date().toISOString(),
    ipAddress: "127.0.0.1",
    actorUser: { username: "mauro" }
  },
  {
    id: "log-2",
    action: "match_result.report",
    entityType: "match_result",
    entityId: "result-1",
    createdAt: new Date().toISOString(),
    ipAddress: "127.0.0.1",
    actorUser: { username: "rook" }
  }
];

export const mockDisputes = [
  {
    id: "dispute-1",
    status: "OPEN",
    matchId: "mock-match-1",
    reason: "El marcador reportado requiere revision manual antes de la confirmacion final."
  }
];

export const mockTeamInvitations = [
  {
    id: "team-invite-1",
    invitedUserId: "u4",
    invitedUser: { id: "u4", username: "sage", displayName: "Sage" },
    role: "MEMBER",
    status: "PENDING"
  }
];

export const mockSpaceInvitations = [
  {
    id: "space-invite-1",
    invitedUserId: "u5",
    invitedUser: { id: "u5", username: "omen", displayName: "Omen" },
    role: "MEMBER",
    status: "PENDING"
  }
];
