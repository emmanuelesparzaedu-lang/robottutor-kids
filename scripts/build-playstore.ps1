# Build release Android (AAB + APK) para Play Store
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$client = Join-Path $root "client"
$androidDir = Join-Path $client "android"
$keysDir = Join-Path $root "release-keys"
$keystorePath = Join-Path $keysDir "robottutor-upload-keystore.jks"
$keystoreProps = Join-Path $androidDir "keystore.properties"

if (-not (Test-Path $keysDir)) { New-Item -ItemType Directory -Path $keysDir | Out-Null }

# Crear upload key si no existe
if (-not (Test-Path $keystorePath)) {
  $storePass = -join ((48..57 + 65..90 + 97..122) | Get-Random -Count 24 | ForEach-Object {[char]$_})
  $keyPass = -join ((48..57 + 65..90 + 97..122) | Get-Random -Count 24 | ForEach-Object {[char]$_})
  $alias = "robottutor-upload"

  keytool -genkeypair -v -storetype JKS -keystore "$keystorePath" -alias "$alias" -keyalg RSA -keysize 2048 -validity 10000 -storepass "$storePass" -keypass "$keyPass" -dname "CN=RoboTutor Kids, OU=Education, O=RoboTutor, L=CDMX, S=CDMX, C=MX"

  @"
storeFile=../../../release-keys/robottutor-upload-keystore.jks
storePassword=$storePass
keyAlias=$alias
keyPassword=$keyPass
"@ | Out-File -FilePath $keystoreProps -Encoding utf8

  @"
GUARDA ESTE ARCHIVO EN UN LUGAR SEGURO.
Si lo pierdes, no podrás actualizar la app en Play Store.

Keystore: $keystorePath
Alias: $alias
"@ | Out-File -FilePath (Join-Path $keysDir "IMPORTANT-KEEP-SAFE.txt") -Encoding utf8
}

Set-Location $client
npm install
npm run build
npx cap sync android

# Compatibilidad Java 17
$capGradle = Join-Path $client "node_modules\@capacitor\android\capacitor\build.gradle"
$appCapGradle = Join-Path $androidDir "app\capacitor.build.gradle"
foreach ($f in @($capGradle, $appCapGradle)) {
  if (Test-Path $f) {
    (Get-Content $f -Raw) -replace 'VERSION_21','VERSION_17' | Set-Content $f -NoNewline
  }
}

Set-Location $androidDir
.\gradlew.bat clean bundleRelease assembleRelease

$aab = Join-Path $androidDir "app\build\outputs\bundle\release\app-release.aab"
$apk = Join-Path $androidDir "app\build\outputs\apk\release\app-release.apk"
$destAab = Join-Path $root "RoboTutorKids-PlayStore.aab"
$destApk = Join-Path $root "RoboTutorKids-PlayStore.apk"

if (-not (Test-Path $aab)) { throw "No se generó app-release.aab" }
if (-not (Test-Path $apk)) { throw "No se generó app-release.apk" }

Copy-Item $aab $destAab -Force
Copy-Item $apk $destApk -Force

Write-Host "`nListo para Play Store:" -ForegroundColor Green
Write-Host "AAB: $destAab" -ForegroundColor Green
Write-Host "APK release: $destApk" -ForegroundColor Green
Write-Host "Keystore: $keystorePath" -ForegroundColor Yellow

Set-Location $root
