# Riot API key rotation y variables Render

## Objetivo

Este documento deja el flujo seguro para cambiar la `RIOT_API_KEY` diaria de pruebas sin tocar código, sin subir secretos a GitHub y sin exponer la key al frontend.

Darkside usa un monolito modular con backend API y frontend web separados por workspace. La key de Riot pertenece solo al backend.

## Reglas obligatorias

- No subir `.env` al repositorio.
- No colocar `RIOT_API_KEY` en `NEXT_PUBLIC_*`.
- No imprimir la key en logs.
- No pegar la key en documentación, README, commits ni issues.
- Configurar la key solo en `.env` local y en el servicio API de Render.

## Local

Actualizar la key local desde PowerShell:

```powershell
cd D:\Codex

$key = Read-Host "Pega la nueva RIOT_API_KEY" -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($key)
$plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)

$envPath = ".\.env"
if (!(Test-Path $envPath)) { New-Item -ItemType File -Path $envPath | Out-Null }
$content = Get-Content $envPath -Raw

if ($content -match "(?m)^RIOT_API_KEY=") {
  $content = $content -replace "(?m)^RIOT_API_KEY=.*$", "RIOT_API_KEY=$plain"
} else {
  $content = $content.TrimEnd() + "`r`nRIOT_API_KEY=$plain`r`n"
}

Set-Content $envPath $content -Encoding UTF8
Write-Host "RIOT_API_KEY actualizada en .env local."
```

Para pruebas reales de la key diaria:

```env
RIOT_API_MODE=development
RIOT_API_KEY=RGAPI-...
RIOT_REGION=la1
RIOT_REGIONAL_ROUTE=americas
RIOT_TOURNAMENT_API_ENABLED=false
```

Para demo sin depender de Riot:

```env
RIOT_API_MODE=mock
RIOT_TOURNAMENT_API_ENABLED=false
```

## Render

En Render configura la key en el servicio API, no en el servicio web:

Servicio API recomendado:

```text
RIOT_API_MODE=development
RIOT_API_KEY=<valor diario de Riot>
RIOT_REGION=la1
RIOT_REGIONAL_ROUTE=americas
RIOT_API_TIMEOUT_MS=8000
RIOT_TOURNAMENT_API_ENABLED=false
```

Servicio Web:

```text
NEXT_PUBLIC_API_URL=https://api.darkside.cool/api
```

No crear:

```text
NEXT_PUBLIC_RIOT_API_KEY
```

## Validación

Después de actualizar la key:

```powershell
npm run check:riot
npm run build
npm run check:release
```

Con servidores levantados:

```powershell
npm run dev
npm run check:prebeta
```

## Notas para Riot Developer Portal

- La key diaria sirve para pruebas `development`.
- La key de producción debe obtenerse por aprobación de Riot.
- Tournament Codes y RSO deben mantenerse en modo controlado hasta tener credenciales oficiales y callback aprobado.
