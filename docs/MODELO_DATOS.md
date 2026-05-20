# Modelo de Datos

## Criterios generales
- Base relacional en PostgreSQL.
- IDs tipo `String` con `cuid()`.
- Timestamps `createdAt` y `updatedAt`.
- Estados mediante enums.
- Auditoria de acciones criticas.

## users
- `id`: String, PK.
- `email`: String, unique.
- `username`: String, unique.
- `passwordHash`: String.
- `displayName`: String.
- `avatarUrl`: String nullable.
- `bio`: String nullable.
- `role`: Enum (`USER`, `ORGANIZER`, `MODERATOR`, `ADMIN`, `FINANCE`).
- `status`: Enum (`ACTIVE`, `SUSPENDED`, `PENDING`).
- `country`: String nullable.
- `createdAt`: DateTime.
- `updatedAt`: DateTime.
Relaciones:
- 1:N con `user_game_accounts`.
- 1:N con `team_members`.
- 1:N con `space_members`.
- 1:N con `tournament_registrations`.
- 1:N con `user_rewards`.
- 1:N con `wallets`.
- 1:N con `audit_logs`.

## user_game_accounts
- `id`: String, PK.
- `userId`: FK -> users.id.
- `provider`: Enum (`RIOT`, `STEAM`, `DISCORD`, `OTHER`).
- `game`: String.
- `riotGameName`: String nullable.
- `riotTagLine`: String nullable.
- `externalPlayerId`: String nullable.
- `verified`: Boolean.
- `metadata`: JSON nullable.
- `createdAt`: DateTime.
- `updatedAt`: DateTime.
Relaciones:
- N:1 con `users`.

## teams
- `id`: String, PK.
- `name`: String.
- `slug`: String, unique.
- `tag`: String nullable.
- `logoUrl`: String nullable.
- `ownerId`: FK -> users.id.
- `description`: String nullable.
- `status`: Enum (`ACTIVE`, `INACTIVE`, `ARCHIVED`).
- `createdAt`: DateTime.
- `updatedAt`: DateTime.
Relaciones:
- 1:N con `team_members`.
- 1:N con `tournament_registrations`.

## team_members
- `id`: String, PK.
- `teamId`: FK -> teams.id.
- `userId`: FK -> users.id.
- `role`: Enum (`OWNER`, `CAPTAIN`, `MEMBER`, `SUBSTITUTE`).
- `joinedAt`: DateTime.
Relaciones:
- N:1 con `teams`.
- N:1 con `users`.

## spaces
- `id`: String, PK.
- `name`: String.
- `slug`: String, unique.
- `description`: String nullable.
- `ownerId`: FK -> users.id.
- `visibility`: Enum (`PUBLIC`, `PRIVATE`, `UNLISTED`).
- `status`: Enum (`ACTIVE`, `ARCHIVED`).
- `createdAt`: DateTime.
- `updatedAt`: DateTime.
Relaciones:
- 1:N con `space_members`.
- 1:N con `tournaments`.

## space_members
- `id`: String, PK.
- `spaceId`: FK -> spaces.id.
- `userId`: FK -> users.id.
- `role`: Enum (`OWNER`, `ADMIN`, `MODERATOR`, `MEMBER`).
- `joinedAt`: DateTime.
Relaciones:
- N:1 con `spaces`.
- N:1 con `users`.

## tournaments
- `id`: String, PK.
- `spaceId`: FK -> spaces.id nullable.
- `organizerId`: FK -> users.id.
- `name`: String.
- `slug`: String, unique.
- `game`: String.
- `format`: Enum (`SINGLE_ELIMINATION`, `DOUBLE_ELIMINATION`, `ROUND_ROBIN`).
- `type`: Enum (`SOLO`, `TEAM`).
- `status`: Enum (`DRAFT`, `PUBLISHED`, `CHECK_IN`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`).
- `rules`: String nullable.
- `maxParticipants`: Int.
- `checkInEnabled`: Boolean.
- `startsAt`: DateTime nullable.
- `endsAt`: DateTime nullable.
- `createdAt`: DateTime.
- `updatedAt`: DateTime.
Relaciones:
- N:1 con `spaces`.
- N:1 con `users`.
- 1:N con `tournament_registrations`.
- 1:1 con `brackets`.
- 1:N con `prize_pools`.

## tournament_registrations
- `id`: String, PK.
- `tournamentId`: FK -> tournaments.id.
- `userId`: FK -> users.id nullable.
- `teamId`: FK -> teams.id nullable.
- `status`: Enum (`PENDING`, `CONFIRMED`, `CHECKED_IN`, `REJECTED`, `CANCELLED`).
- `checkedInAt`: DateTime nullable.
- `createdAt`: DateTime.
- `updatedAt`: DateTime.
Relaciones:
- N:1 con `tournaments`.
- N:1 con `users`.
- N:1 con `teams`.

## brackets
- `id`: String, PK.
- `tournamentId`: FK -> tournaments.id unique.
- `status`: Enum (`DRAFT`, `GENERATED`, `LOCKED`, `COMPLETED`).
- `metadata`: JSON nullable.
- `createdAt`: DateTime.
- `updatedAt`: DateTime.
Relaciones:
- 1:1 con `tournaments`.
- 1:N con `rounds`.

## rounds
- `id`: String, PK.
- `bracketId`: FK -> brackets.id.
- `name`: String.
- `sequence`: Int.
- `status`: Enum (`PENDING`, `ACTIVE`, `COMPLETED`).
- `createdAt`: DateTime.
- `updatedAt`: DateTime.
Relaciones:
- N:1 con `brackets`.
- 1:N con `matches`.

## matches
- `id`: String, PK.
- `roundId`: FK -> rounds.id.
- `tournamentId`: FK -> tournaments.id.
- `homeRegistrationId`: FK -> tournament_registrations.id nullable.
- `awayRegistrationId`: FK -> tournament_registrations.id nullable.
- `status`: Enum (`PENDING`, `READY`, `IN_PROGRESS`, `RESULT_PENDING`, `COMPLETED`, `DISPUTED`, `CANCELLED`).
- `scheduledAt`: DateTime nullable.
- `bestOf`: Int.
- `winnerRegistrationId`: FK -> tournament_registrations.id nullable.
- `createdAt`: DateTime.
- `updatedAt`: DateTime.
Relaciones:
- N:1 con `rounds`.
- N:1 con `tournaments`.
- 1:N con `match_results`.
- 1:N con `disputes`.

## match_results
- `id`: String, PK.
- `matchId`: FK -> matches.id.
- `reportedByUserId`: FK -> users.id.
- `winnerRegistrationId`: FK -> tournament_registrations.id nullable.
- `homeScore`: Int.
- `awayScore`: Int.
- `status`: Enum (`PENDING_CONFIRMATION`, `CONFIRMED`, `REJECTED`).
- `evidenceUrls`: JSON nullable.
- `notes`: String nullable.
- `confirmedByUserId`: FK -> users.id nullable.
- `confirmedAt`: DateTime nullable.
- `createdAt`: DateTime.
- `updatedAt`: DateTime.
Relaciones:
- N:1 con `matches`.
- N:1 con `users`.

## disputes
- `id`: String, PK.
- `matchId`: FK -> matches.id.
- `openedByUserId`: FK -> users.id.
- `reason`: String.
- `status`: Enum (`OPEN`, `UNDER_REVIEW`, `RESOLVED`, `REJECTED`).
- `resolution`: String nullable.
- `resolvedByUserId`: FK -> users.id nullable.
- `createdAt`: DateTime.
- `updatedAt`: DateTime.
Relaciones:
- N:1 con `matches`.
- N:1 con `users`.

## rewards
- `id`: String, PK.
- `code`: String, unique.
- `name`: String.
- `description`: String nullable.
- `type`: Enum (`POINTS`, `XP`, `BADGE`, `BENEFIT`).
- `value`: Int.
- `isMonetary`: Boolean default false.
- `createdAt`: DateTime.
- `updatedAt`: DateTime.
Relaciones:
- 1:N con `user_rewards`.

## user_rewards
- `id`: String, PK.
- `userId`: FK -> users.id.
- `rewardId`: FK -> rewards.id.
- `grantedByUserId`: FK -> users.id nullable.
- `notes`: String nullable.
- `grantedAt`: DateTime.
Relaciones:
- N:1 con `users`.
- N:1 con `rewards`.

## wallets
- `id`: String, PK.
- `userId`: FK -> users.id.
- `type`: Enum (`INTERNAL_REWARD`, `TOURNAMENT_PRIZE`).
- `currencyCode`: String.
- `balance`: Decimal.
- `nonWithdrawable`: Boolean.
- `createdAt`: DateTime.
- `updatedAt`: DateTime.
Relaciones:
- N:1 con `users`.
- 1:N con `payouts`.
Nota:
- Para MVP se usara solo como preparacion conceptual, no para pagos reales.

## prize_pools
- `id`: String, PK.
- `tournamentId`: FK -> tournaments.id.
- `name`: String.
- `currencyCode`: String.
- `totalAmount`: Decimal.
- `status`: Enum (`DRAFT`, `APPROVED`, `LOCKED`, `DISTRIBUTED`).
- `createdAt`: DateTime.
- `updatedAt`: DateTime.
Relaciones:
- N:1 con `tournaments`.
- 1:N con `prize_allocations`.

## prize_allocations
- `id`: String, PK.
- `prizePoolId`: FK -> prize_pools.id.
- `position`: Int.
- `amount`: Decimal.
- `registrationId`: FK -> tournament_registrations.id nullable.
- `status`: Enum (`PENDING`, `APPROVED`, `PAID`, `BLOCKED`).
- `createdAt`: DateTime.
- `updatedAt`: DateTime.
Relaciones:
- N:1 con `prize_pools`.

## payouts
- `id`: String, PK.
- `walletId`: FK -> wallets.id.
- `prizeAllocationId`: FK -> prize_allocations.id nullable.
- `status`: Enum (`PENDING`, `UNDER_REVIEW`, `APPROVED`, `PAID`, `REJECTED`).
- `amount`: Decimal.
- `requestedAt`: DateTime.
- `processedAt`: DateTime nullable.
- `metadata`: JSON nullable.
Relaciones:
- N:1 con `wallets`.

## audit_logs
- `id`: String, PK.
- `actorUserId`: FK -> users.id nullable.
- `action`: String.
- `entityType`: String.
- `entityId`: String nullable.
- `before`: JSON nullable.
- `after`: JSON nullable.
- `metadata`: JSON nullable.
- `ipAddress`: String nullable.
- `createdAt`: DateTime.
Relaciones:
- N:1 con `users`.
