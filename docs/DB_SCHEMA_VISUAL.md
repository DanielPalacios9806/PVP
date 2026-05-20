# DB Schema Visual

## Objetivo
Este documento resume visualmente la estructura actual de base de datos del proyecto para facilitar revision tecnica, planeacion de nuevas migraciones y posterior despliegue en servidor Ubuntu con PostgreSQL.

## Vista global
```mermaid
erDiagram
    users ||--o{ user_game_accounts : has
    users ||--o{ team_members : joins
    teams ||--o{ team_members : contains

    users ||--o{ space_members : joins
    spaces ||--o{ space_members : contains

    users ||--o{ tournaments : organizes
    spaces ||--o{ tournaments : groups

    tournaments ||--o{ tournament_registrations : receives
    users ||--o{ tournament_registrations : solo_entry
    teams ||--o{ tournament_registrations : team_entry

    tournaments ||--|| brackets : has
    brackets ||--o{ rounds : contains
    rounds ||--o{ matches : contains
    tournaments ||--o{ matches : owns

    matches ||--o{ match_results : receives
    matches ||--o{ disputes : may_trigger

    rewards ||--o{ user_rewards : grants
    users ||--o{ user_rewards : receives

    users ||--o{ wallets : owns
    tournaments ||--o{ prize_pools : may_define
    prize_pools ||--o{ prize_allocations : distributes
    wallets ||--o{ payouts : processes

    users ||--o{ audit_logs : performs
```

## Modulo 1. Identidad y acceso
Tablas:
- `users`
- `user_game_accounts`
- `audit_logs`

Proposito:
- Gestionar usuarios, roles y estado de acceso.
- Preparar vinculacion futura con cuentas de juego.
- Registrar trazabilidad de acciones criticas.

```mermaid
erDiagram
    users ||--o{ user_game_accounts : has
    users ||--o{ audit_logs : performs

    users {
        string id PK
        string email UK
        string username UK
        string passwordHash
        string displayName
        enum role
        enum status
    }

    user_game_accounts {
        string id PK
        string userId FK
        enum provider
        string game
        string externalPlayerId
        boolean verified
    }

    audit_logs {
        string id PK
        string actorUserId FK
        string action
        string entityType
        string entityId
        json before
        json after
        string ipAddress
    }
```

## Modulo 2. Equipos
Tablas:
- `teams`
- `team_members`

Proposito:
- Crear equipos competitivos.
- Gestionar owner, capitanes, miembros y suplentes.

```mermaid
erDiagram
    users ||--o{ teams : owns
    teams ||--o{ team_members : contains
    users ||--o{ team_members : participates

    teams {
        string id PK
        string name
        string slug UK
        string ownerId FK
        enum status
    }

    team_members {
        string id PK
        string teamId FK
        string userId FK
        enum role
        datetime joinedAt
    }
```

## Modulo 3. Spaces o comunidades
Tablas:
- `spaces`
- `space_members`

Proposito:
- Organizar comunidades, hubs competitivos y futuros ecosistemas por region o organizacion.

```mermaid
erDiagram
    users ||--o{ spaces : owns
    spaces ||--o{ space_members : contains
    users ||--o{ space_members : participates

    spaces {
        string id PK
        string name
        string slug UK
        string ownerId FK
        enum visibility
        enum status
    }

    space_members {
        string id PK
        string spaceId FK
        string userId FK
        enum role
        datetime joinedAt
    }
```

## Modulo 4. Torneos
Tablas:
- `tournaments`
- `tournament_registrations`

Proposito:
- Definir torneos individuales o por equipos.
- Manejar cupos, estados e inscripciones.

```mermaid
erDiagram
    users ||--o{ tournaments : organizes
    spaces ||--o{ tournaments : groups
    tournaments ||--o{ tournament_registrations : receives
    users ||--o{ tournament_registrations : solo_entry
    teams ||--o{ tournament_registrations : team_entry

    tournaments {
        string id PK
        string spaceId FK
        string organizerId FK
        string name
        string slug UK
        string game
        enum format
        enum type
        enum status
        int maxParticipants
        boolean checkInEnabled
    }

    tournament_registrations {
        string id PK
        string tournamentId FK
        string userId FK
        string teamId FK
        enum status
        datetime checkedInAt
    }
```

## Modulo 5. Brackets y partidas
Tablas:
- `brackets`
- `rounds`
- `matches`

Proposito:
- Representar estructura competitiva y avance del torneo.

```mermaid
erDiagram
    tournaments ||--|| brackets : has
    brackets ||--o{ rounds : contains
    rounds ||--o{ matches : contains
    tournaments ||--o{ matches : owns
    tournament_registrations ||--o{ matches : home_side
    tournament_registrations ||--o{ matches : away_side
    tournament_registrations ||--o{ matches : winner

    brackets {
        string id PK
        string tournamentId FK
        enum status
        json metadata
    }

    rounds {
        string id PK
        string bracketId FK
        string name
        int sequence
        enum status
    }

    matches {
        string id PK
        string roundId FK
        string tournamentId FK
        string homeRegistrationId FK
        string awayRegistrationId FK
        string winnerRegistrationId FK
        enum status
        int bestOf
        datetime scheduledAt
    }
```

## Modulo 6. Resultados y disputas
Tablas:
- `match_results`
- `disputes`

Proposito:
- Permitir reporte manual, confirmacion bilateral y resolucion moderada.

```mermaid
erDiagram
    matches ||--o{ match_results : receives
    matches ||--o{ disputes : may_trigger
    users ||--o{ match_results : reports
    users ||--o{ disputes : opens
    users ||--o{ disputes : resolves

    match_results {
        string id PK
        string matchId FK
        string reportedByUserId FK
        string winnerRegistrationId FK
        int homeScore
        int awayScore
        enum status
        json evidenceUrls
        string confirmedByUserId FK
    }

    disputes {
        string id PK
        string matchId FK
        string openedByUserId FK
        enum status
        string resolution
        string resolvedByUserId FK
    }
```

## Modulo 7. Rewards internas
Tablas:
- `rewards`
- `user_rewards`

Proposito:
- Recompensas no monetarias como XP, puntos, badges o beneficios internos.

```mermaid
erDiagram
    rewards ||--o{ user_rewards : grants
    users ||--o{ user_rewards : receives

    rewards {
        string id PK
        string code UK
        string name
        enum type
        int value
        boolean isMonetary
    }

    user_rewards {
        string id PK
        string userId FK
        string rewardId FK
        string grantedByUserId
        datetime grantedAt
    }
```

## Modulo 8. Premios futuros
Tablas:
- `wallets`
- `prize_pools`
- `prize_allocations`
- `payouts`

Proposito:
- Preparar capa futura de premios de torneos sin mezclarla con apuestas o depositos de usuarios.

```mermaid
erDiagram
    users ||--o{ wallets : owns
    tournaments ||--o{ prize_pools : may_define
    prize_pools ||--o{ prize_allocations : distributes
    tournament_registrations ||--o{ prize_allocations : assigned
    wallets ||--o{ payouts : processes
    prize_allocations ||--o{ payouts : references

    wallets {
        string id PK
        string userId FK
        enum type
        string currencyCode
        decimal balance
        boolean nonWithdrawable
    }

    prize_pools {
        string id PK
        string tournamentId FK
        string currencyCode
        decimal totalAmount
        enum status
    }

    prize_allocations {
        string id PK
        string prizePoolId FK
        int position
        decimal amount
        string registrationId FK
        enum status
    }

    payouts {
        string id PK
        string walletId FK
        string prizeAllocationId FK
        decimal amount
        enum status
    }
```

## Relaciones criticas a cuidar en futuras migraciones
- `users.email` unique.
- `users.username` unique.
- `teams.slug` unique.
- `spaces.slug` unique.
- `tournaments.slug` unique.
- `team_members(teamId, userId)` unique.
- `space_members(spaceId, userId)` unique.
- `brackets.tournamentId` unique.

## Riesgos de crecimiento del esquema
- `evidenceUrls` en JSON funciona para MVP, pero puede convenir una tabla `match_evidences` mas adelante.
- `wallets` y `payouts` deben mantenerse aisladas del flujo competitivo para evitar confusiones legales.
- `tournament_registrations` necesitara reglas adicionales si luego hay reservas, waitlist o substitutes avanzados.
- Rankings y notificaciones aun no tienen tablas propias.

## Recomendaciones de proximas migraciones de base de datos
### Migracion sugerida 0002
- Tabla `notifications`.
- Tabla `team_invitations`.
- Tabla `space_invitations`.

### Migracion sugerida 0003
- Tabla `match_evidences`.
- Tabla `dispute_messages`.
- Indices adicionales para consultas de torneos y matches.

### Migracion sugerida 0004
- Tabla `leaderboards`.
- Tabla `ranking_snapshots`.
- Tabla `reward_transactions`.
