# APK conectada a servidor en la nube (sin laptop)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$client = Join-Path $root "client"
$urlFile = Join-Path $root "cloud-api-url.txt"

if (-not (Test-Path $urlFile)) {
  Write-Host "ERROR: Crea cloud-api-url.txt con la URL de Render." -ForegroundColor Red
  Write-Host "Copia cloud-api-url.txt.example y pega tu URL, ej:" -ForegroundColor Yellow
  Write-Host "  https://robottutor-kids-api.onrender.com" -ForegroundColor Cyan
  exit 1
}

$cloudUrl = (Get-Content $urlFile -Raw).Trim() -replace '#.*','' -replace '\s',''
if ($cloudUrl -match '^#|TU-APP|^$') {
  Write-Host "ERROR: Edita cloud-api-url.txt con tu URL real de Render." -ForegroundColor Red
  exit 1
}
$cloudUrl = $cloudUrl.TrimEnd('/')

if (-not $cloudUrl.StartsWith('https://')) {
  Write-Host "ERROR: La URL debe empezar con https://" -ForegroundColor Red
  exit 1
}

Write-Host "=== APK NUBE ===" -ForegroundColor Cyan
Write-Host "Servidor: $cloudUrl" -ForegroundColor Green

# Verificar que el servidor responde
try {
  $health = Invoke-RestMethod -Uri "$cloudUrl/api/health" -TimeoutSec 60
  if (-not $health.ok) { throw "Health check failed" }
  Write-Host "Servidor OK - Gemini: $($health.geminiConfigured)" -ForegroundColor Green
} catch {
  Write-Host "AVISO: No se pudo verificar $cloudUrl/api/health" -ForegroundColor Yellow
  Write-Host "  $($_.Exception.Message)" -ForegroundColor Yellow
  Write-Host "  Continuando build de todas formas..." -ForegroundColor Yellow
}

$envFile = Join-Path $client ".env.production.local"
"VITE_API_BASE_URL=$cloudUrl" | Out-File -FilePath $envFile -Encoding utf8 -NoNewline

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
$dest = Join-Path $root "RoboTutorKids-Cloud.apk"
Copy-Item $apk.FullName $dest -Force

Write-Host "`nAPK NUBE lista: $dest" -ForegroundColor Green
Write-Host "Instala en Android. No necesitas laptop encendida." -ForegroundColor Cyan
Set-Location $root
