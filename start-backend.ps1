# GeneoRx Backend Startup Script
# Run with: powershell -ExecutionPolicy Bypass -File start-backend.ps1

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  GeneoRx Backend Startup" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Find local IP
$ip = (Get-NetIPAddress -AddressFamily IPv4 |
       Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.*" -and $_.PrefixOrigin -eq "Dhcp" } |
       Select-Object -First 1).IPAddress

if (-not $ip) {
    $ip = (Get-NetIPAddress -AddressFamily IPv4 |
           Where-Object { $_.IPAddress -like "192.168.*" -or $_.IPAddress -like "172.20.*" -or $_.IPAddress -like "10.*" } |
           Select-Object -First 1).IPAddress
}

Write-Host "Detected local IP: $ip" -ForegroundColor Yellow
Write-Host ""

# Step 1: APP_KEY
Write-Host "[1/4] Checking app key..." -ForegroundColor Green
$envContent = Get-Content .env -Raw
if ($envContent -match "APP_KEY=\s*$" -or $envContent -match "APP_KEY=`r?`n") {
    php artisan key:generate
} else {
    Write-Host "      App key already exists." -ForegroundColor Gray
}

# Step 2: SQLite database
Write-Host "[2/4] Setting up SQLite database..." -ForegroundColor Green
if (-not (Test-Path "database\database.sqlite")) {
    New-Item -ItemType File -Path "database\database.sqlite" -Force | Out-Null
    Write-Host "      Created database/database.sqlite" -ForegroundColor Gray
} else {
    Write-Host "      Database file already exists." -ForegroundColor Gray
}

# Step 3: Run migrations
Write-Host "[3/4] Running migrations..." -ForegroundColor Green
php artisan migrate --force

# Step 4: Start server
Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  Backend ready!" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Web URL (local):   http://127.0.0.1:8000" -ForegroundColor White
Write-Host "  Web URL (network): http://$ip:8000" -ForegroundColor White
Write-Host "  Admin panel:       http://127.0.0.1:8000/admin" -ForegroundColor White
Write-Host ""
Write-Host "  Mobile API URL: http://$ip:8000/api" -ForegroundColor Yellow
Write-Host "  -> Update mobile/app.json apiBaseUrl with the above" -ForegroundColor Yellow
Write-Host ""
Write-Host "[4/4] Starting server (Ctrl+C to stop)..." -ForegroundColor Green
Write-Host ""

php artisan serve --host=0.0.0.0 --port=8000
