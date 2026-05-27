# APK AUTÓNOMA — funciona sin laptop ni servidor (solo internet + Gemini)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$client = Join-Path $root "client"
$envServer = Join-Path $root "server\.env"

if (-not (Test-Path $envServer)) {
  Write-Host "ERROR: Falta server\.env con GEMINI_API_KEY" -ForegroundColor Red
  exit 1
}

$apiKey = $null
Get-Content $envServer | ForEach-Object {
  if ($_ -match '^\s*GEMINI_API_KEY\s*=\s*(.+)$') { $apiKey = $matches[1].Trim() }
}
if (-not $apiKey) {
  Write-Host "ERROR: GEMINI_API_KEY no encontrada en server\.env" -ForegroundColor Red
  exit 1
}

$model = 'gemini-2.0-flash'
Get-Content $envServer | ForEach-Object {
  if ($_ -match '^\s*GEMINI_MODEL\s*=\s*(.+)$') { $model = $matches[1].Trim() }
}

Write-Host "=== APK INDEPENDIENTE (sin laptop) ===" -ForegroundColor Cyan

$prodEnv = Join-Path $client ".env.production.local"
@"
VITE_STANDALONE_MODE=true
VITE_GEMINI_API_KEY=$apiKey
VITE_GEMINI_MODEL=$model
"@ | Out-File $prodEnv -Encoding utf8

Set-Location $client
npm install
npm run build
npx cap sync android

$capGradle = Join-Path $client "node_modules\@capacitor\android\capacitor\build.gradle"
$appCapGradle = Join-Path $client "android\app\capacitor.build.gradle"
foreach ($f in @($capGradle, $appCapGradle)) {
  if (Test-Path $f) {
    (Get-Content $f -Raw) -replace 'VERSION_21','VERSION_17' | Set-Content $f -NoNewline
  }
}

Set-Location (Join-Path $client "android")
.\gradlew.bat assembleDebug

$apk = Get-ChildItem -Recurse -Filter "app-debug.apk" | Select-Object -First 1
$dest = Join-Path $root "RoboTutorKids-Independiente.apk"
Copy-Item $apk.FullName $dest -Force

# Limpiar clave del archivo de build local
Remove-Item $prodEnv -Force -ErrorAction SilentlyContinue

Write-Host "`nAPK LISTA: $dest" -ForegroundColor Green
Write-Host "Instala en Android. Solo necesita WiFi/datos moviles." -ForegroundColor Cyan
Write-Host "NO necesitas laptop ni Render." -ForegroundColor Cyan
Set-Location $root
