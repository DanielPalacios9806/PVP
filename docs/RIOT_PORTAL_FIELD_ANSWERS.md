# Riot Developer Portal - Field Answers Draft

## Product name

Darkside.cool

## Product type

Web-based esports tournament platform for competitive communities.

## Short description

Darkside.cool is a web platform for organizing esports tournaments, managing teams, registrations, brackets, match rooms, moderation workflows and administrative operations.

## Long description

Darkside.cool is a modular monolith web application designed to support esports tournament operations. The product includes a public landing page, user authentication, tournament hub, tournament detail pages with bracket visualization, teams area, account profile, Riot integration status, admin/ops center, moderation workflow, token ledger for internal non-monetary participation records, and production health checks.

Arena OS is a legacy internal codename retained only in some infrastructure/service names and historical staging URLs.

The application is currently in a pre-beta staging environment hosted on Render with a web service and an API service. Riot API access is handled exclusively through the secured backend API. API keys are never exposed to the frontend, are never committed to the repository, and are configured only through environment variables.

## Main user value

- Players can discover tournaments and manage competitive profile information.
- Teams can organize around tournament participation.
- Organizers can manage events, brackets and operational workflows.
- Admin users can review platform health, moderation, audit and Riot integration status.

## Riot API usage summary

Darkside.cool uses Riot API access through backend-only integration. In the current pre-beta, Riot integration is in development mode. Advanced flows such as RSO and Tournament API production access are documented as future capabilities that require Riot approval.

## Data and privacy

The product includes legal pages for Terms, Privacy and Data Deletion. No Riot API key is exposed to frontend code. Riot protected endpoints require authentication.

## Production request rationale

The application has a functioning staging deployment, documented compliance matrix, production health checks, visual QA evidence, and a clear backend-only Riot API integration model. A production key is requested to support a stable public beta and avoid relying on a temporary development key for player-facing testing.
