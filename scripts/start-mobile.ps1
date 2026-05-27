# Inicia servidor para usar con la APK (misma WiFi)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
  $_.InterfaceAlias -notmatch 'Loopback' -and $_.IPAddress -notmatch '^169'
} | Select-Object -First 1).IPAddress

Write-Host "=== Servidor RoboTutor Kids ===" -ForegroundColor Cyan
if ($ip) {
  Write-Host "Configura en la APK (Panel Adultos): http://${ip}:3001" -ForegroundColor Green
}
Write-Host "Mantén esta ventana abierta mientras usas la app en el celular.`n" -ForegroundColor Yellow

Set-Location (Join-Path $root "server")
npm run dev
