# Ayuda rápida para configurar la versión nube
$root = Split-Path -Parent $PSScriptRoot
$example = Join-Path $root "cloud-api-url.txt.example"
$target = Join-Path $root "cloud-api-url.txt"

Write-Host "`n=== RoboTutor Kids - Configurar NUBE ===" -ForegroundColor Cyan
Write-Host @"

1. Despliega en Render.com (ver DEPLOY-NUBE.md)
2. Copia tu URL publica, ejemplo:
   https://robottutor-kids-api.onrender.com

3. Prueba en el navegador:
   https://TU-URL.onrender.com/api/health

"@ -ForegroundColor White

$url = Read-Host "Pega tu URL de Render (https://...)"

if (-not $url.StartsWith('https://')) {
  Write-Host "La URL debe empezar con https://" -ForegroundColor Red
  exit 1
}

$url = $url.TrimEnd('/')
$url | Out-File $target -Encoding utf8 -NoNewline

Write-Host "`nGuardado en cloud-api-url.txt" -ForegroundColor Green
Write-Host "Ahora ejecuta: npm run apk:cloud" -ForegroundColor Yellow
