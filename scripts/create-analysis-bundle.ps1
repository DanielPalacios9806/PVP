param(
  [string]$RepoRoot = (Get-Location).Path,
  [string]$OutputRoot = "D:\",
  [string]$NamePrefix = "PVP_ANALISIS_ITERACION"
)

$ErrorActionPreference = "Continue"
$fecha = Get-Date -Format "yyyyMMdd_HHmm"
$nombre = "${NamePrefix}_$fecha"
$destino = Join-Path $OutputRoot $nombre
$zip = "$destino.zip"

Remove-Item $destino -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item $zip -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $destino | Out-Null
New-Item -ItemType Directory -Path "$destino\_ANALISIS_ESTADO_REPO" -Force | Out-Null

robocopy $RepoRoot $destino /E `
  /XD ".git" "node_modules" ".next" "dist" "build" "coverage" ".turbo" ".cache" "backups" "_patches" `
  /XF ".env" ".env.*" "*.pem" "*.key" "*.p12" "*.pfx" "*.crt" "*.dump" "*.sql" "*.backup" "*.zip" "credentials.json" "service-account*.json" "*.log" "*.patch"

Push-Location $RepoRoot

git status --short > "$destino\_ANALISIS_ESTADO_REPO\01_git_status_short.txt"
git branch --show-current > "$destino\_ANALISIS_ESTADO_REPO\02_git_branch.txt"
git remote -v > "$destino\_ANALISIS_ESTADO_REPO\03_git_remotes.txt"
git log --oneline -n 30 > "$destino\_ANALISIS_ESTADO_REPO\04_git_log_ultimos_30.txt"
git diff > "$destino\_ANALISIS_ESTADO_REPO\05_diff_general_no_commiteado.patch"
git diff --name-only > "$destino\_ANALISIS_ESTADO_REPO\06_archivos_modificados_git_diff.txt"

tree $RepoRoot /F > "$destino\_ANALISIS_ESTADO_REPO\07_tree_completo_local.txt"

npm run build *> "$destino\_ANALISIS_ESTADO_REPO\08_build_output.txt"
npm run check:release *> "$destino\_ANALISIS_ESTADO_REPO\09_check_release_output.txt"
npx prisma validate --schema prisma/schema.prisma *> "$destino\_ANALISIS_ESTADO_REPO\10_prisma_validate_output.txt"
npx prisma migrate status --schema prisma/schema.prisma *> "$destino\_ANALISIS_ESTADO_REPO\11_prisma_migrate_status_output.txt"

if (Test-Path "$RepoRoot\.env") {
  Get-Content "$RepoRoot\.env" |
    Where-Object { $_ -match "=" -and $_ -notmatch "^\s*#" } |
    ForEach-Object {
      $key = ($_ -split "=", 2)[0].Trim()
      "$key=<REDACTED>"
    } | Set-Content "$destino\_ANALISIS_ESTADO_REPO\12_env_keys_redacted.txt"
} else {
  "No se encontro .env local." | Set-Content "$destino\_ANALISIS_ESTADO_REPO\12_env_keys_redacted.txt"
}

Pop-Location

Compress-Archive -Path "$destino\*" -DestinationPath $zip -Force
Write-Host "ZIP generado para subir:"
Write-Host $zip

