# Requests de referencia

## Register
```http
POST /auth/register
Content-Type: application/json

{
  "email": "player1@example.com",
  "username": "player1",
  "displayName": "Player One",
  "password": "Password123!"
}
```

## Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "player1@example.com",
  "password": "Password123!"
}
```

## Create Team
```http
POST /teams
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "name": "Blue Wolves",
  "tag": "BW",
  "description": "Main competitive roster"
}
```

## Add Team Member
```http
POST /teams/{{teamId}}/members
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "userId": "{{userId}}",
  "role": "MEMBER"
}
```

## Create Team Invitation
```http
POST /teams/{{teamId}}/invitations
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "invitedUserId": "{{userId}}",
  "role": "MEMBER"
}
```

## Respond Team Invitation
```http
POST /teams/invitations/{{teamInvitationId}}/respond
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "action": "ACCEPT"
}
```

## Create Space
```http
POST /spaces
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "name": "LATAM Arena",
  "visibility": "PUBLIC",
  "description": "Regional community hub"
}
```

## Create Space Invitation
```http
POST /spaces/{{spaceId}}/invitations
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "invitedUserId": "{{userId}}",
  "role": "MEMBER"
}
```

## Respond Space Invitation
```http
POST /spaces/invitations/{{spaceInvitationId}}/respond
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "action": "ACCEPT"
}
```

## Create Tournament
```http
POST /tournaments
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "name": "Valorant Weekly Cup",
  "game": "VALORANT",
  "format": "SINGLE_ELIMINATION",
  "type": "TEAM",
  "maxParticipants": 8,
  "checkInEnabled": true
}
```

## Register Tournament
```http
POST /tournaments/{{tournamentId}}/register
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "teamId": "{{teamId}}"
}
```

## Check-in
```http
POST /tournaments/{{tournamentId}}/check-in
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "registrationId": "{{registrationId}}"
}
```

## Generate Bracket
```http
POST /tournaments/{{tournamentId}}/bracket
Authorization: Bearer {{token}}
```

## Create Match
```http
POST /tournaments/{{tournamentId}}/matches
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "homeRegistrationId": "{{registrationA}}",
  "awayRegistrationId": "{{registrationB}}",
  "bestOf": 1,
  "status": "READY"
}
```

## Report Result
```http
POST /matches/{{matchId}}/results
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "winnerRegistrationId": "{{registrationA}}",
  "homeScore": 1,
  "awayScore": 0,
  "evidenceUrls": ["https://example.com/screenshot.png"],
  "notes": "Reported by captain"
}
```

## Confirm Result
```http
POST /matches/results/{{resultId}}/confirm
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "approved": true
}
```

## Open Dispute
```http
POST /disputes/matches/{{matchId}}
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "reason": "Opponent reported an incorrect score."
}
```

## Audit Logs
```http
GET /admin/audit-logs?limit=50
Authorization: Bearer {{token}}
```
