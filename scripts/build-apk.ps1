# Genera APK debug de RoboTutor Kids
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$client = Join-Path $root "client"

Write-Host "=== RoboTutor Kids - Build APK ===" -ForegroundColor Cyan

# Mostrar IP local para configurar la app
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
  $_.InterfaceAlias -notmatch 'Loopback' -and $_.IPAddress -notmatch '^169'
} | Select-Object -First 1).IPAddress

if ($ip) {
  Write-Host "Tu IP local: $ip" -ForegroundColor Green
  Write-Host "En la APK configura: http://${ip}:3001" -ForegroundColor Yellow
  $envFile = Join-Path $client ".env.production.local"
  "VITE_API_BASE_URL=http://${ip}:3001" | Out-File -FilePath $envFile -Encoding utf8
}

Set-Location $client
npm install
npm run build

if (-not (Test-Path "android")) {
  npx cap add android
}

npx cap sync android

# Java 17 (si no tienes JDK 21)
$capGradle = Join-Path $client "node_modules\@capacitor\android\capacitor\build.gradle"
$appCapGradle = Join-Path $client "android\app\capacitor.build.gradle"
foreach ($f in @($capGradle, $appCapGradle)) {
  if (Test-Path $f) {
    (Get-Content $f -Raw) -replace 'VERSION_21','VERSION_17' | Set-Content $f -NoNewline
  }
}

Set-Location android
if (Test-Path ".\gradlew.bat") {
  .\gradlew.bat assembleDebug
  $apk = Get-ChildItem -Recurse -Filter "app-debug.apk" | Select-Object -First 1
  if ($apk) {
    $dest = Join-Path $root "RoboTutorKids-debug.apk"
    Copy-Item $apk.FullName $dest -Force
    Write-Host "`nAPK lista: $dest" -ForegroundColor Green
  }
} else {
  Write-Host "Gradle no encontrado. Abre Android Studio: npm run cap:open --prefix client" -ForegroundColor Yellow
}

Set-Location $root
