# =============================================================================
#  ScamShield - start the backend and put it on a public HTTPS address.
#  Run start_scamshield.bat (double-click), then paste the printed address
#  into the phone app.
# =============================================================================

$ErrorActionPreference = 'Continue'
Set-Location -LiteralPath $PSScriptRoot

Write-Host ''
Write-Host '  ScamShield - starting up' -ForegroundColor Cyan
Write-Host '  ========================'
Write-Host ''

# --- 1. API key present? -----------------------------------------------------
if (-not (Test-Path '.env')) {
    Write-Host '  [!] No .env file. Copy .env.example to .env and add GEMINI_API_KEY,' -ForegroundColor Yellow
    Write-Host '      otherwise live call analysis cannot run.' -ForegroundColor Yellow
    Write-Host ''
} elseif (-not (Select-String -Path '.env' -Pattern '^GEMINI_API_KEY=.+' -Quiet)) {
    Write-Host '  [!] GEMINI_API_KEY is empty in .env - live call analysis will not work.' -ForegroundColor Yellow
    Write-Host ''
}

function Test-Backend {
    try {
        $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8000/health' -TimeoutSec 3 -UseBasicParsing
        return $r.StatusCode -eq 200
    } catch { return $false }
}

# --- 2. Backend --------------------------------------------------------------
if (Test-Backend) {
    Write-Host '  [OK] Backend already running on port 8000.' -ForegroundColor Green
} else {
    Write-Host '  Starting the backend on port 8000...'
    Start-Process -FilePath 'python' -ArgumentList 'run_system.py' `
        -WorkingDirectory $PSScriptRoot -WindowStyle Minimized | Out-Null

    $up = $false
    foreach ($i in 1..25) {
        Start-Sleep -Seconds 2
        if (Test-Backend) { $up = $true; break }
    }
    if (-not $up) {
        Write-Host '  [X] The backend did not start.' -ForegroundColor Red
        Write-Host '      Run "python run_system.py" in this folder to see the error.'
        Read-Host '  Press Enter to close'
        exit 1
    }
    Write-Host '  [OK] Backend is running.' -ForegroundColor Green
}
Write-Host ''

# --- 3. Public address -------------------------------------------------------
$cf = $null
$candidate = Join-Path ${env:ProgramFiles(x86)} 'cloudflared\cloudflared.exe'
if (Test-Path $candidate) { $cf = $candidate }
elseif (Get-Command cloudflared -ErrorAction SilentlyContinue) { $cf = 'cloudflared' }

$lanIp = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
          Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } |
          Select-Object -First 1 -ExpandProperty IPAddress)

if (-not $cf) {
    Write-Host '  [!] cloudflared not found, so there is no public address.' -ForegroundColor Yellow
    if ($lanIp) {
        Write-Host ''
        Write-Host '   Use this address, with the phone on the same Wi-Fi:'
        Write-Host "     http://${lanIp}:8000" -ForegroundColor Cyan
    }
} else {
    Write-Host '  Opening a public address so the phone works on any network...'
    $tunnelLog = Join-Path $env:TEMP 'scamshield_tunnel.log'
    if (Test-Path $tunnelLog) { Remove-Item -LiteralPath $tunnelLog -Force -ErrorAction SilentlyContinue }

    Start-Process -FilePath $cf `
        -ArgumentList 'tunnel', '--url', 'http://localhost:8000', '--no-autoupdate' `
        -RedirectStandardError $tunnelLog -WindowStyle Hidden | Out-Null

    $url = $null
    foreach ($i in 1..40) {
        Start-Sleep -Seconds 2
        if (Test-Path $tunnelLog) {
            $m = Select-String -Path $tunnelLog -Pattern 'https://[a-z0-9-]+\.trycloudflare\.com' -AllMatches -ErrorAction SilentlyContinue
            if ($m) { $url = $m.Matches[0].Value; break }
        }
    }

    Write-Host ''
    if ($url) {
        Write-Host '  ================================================================' -ForegroundColor Green
        Write-Host '   PUT THIS ADDRESS IN THE PHONE APP:'
        Write-Host ''
        Write-Host "     $url" -ForegroundColor Cyan
        Write-Host ''
        Write-Host '   In ScamShield: tap the "Shield Active" pill, paste it into'
        Write-Host '   ScamShield Server URL, then tap "Save & Test Server".'
        Write-Host '  ================================================================' -ForegroundColor Green
        try { Set-Clipboard -Value $url; Write-Host '   (copied to clipboard)' -ForegroundColor DarkGray } catch { }
    } else {
        Write-Host '  [!] The tunnel did not come up.' -ForegroundColor Yellow
        if ($lanIp) { Write-Host "      Use http://${lanIp}:8000 with the phone on the same Wi-Fi." }
    }
}

Write-Host ''
Write-Host '  Keep this window open while you use ScamShield.'
Write-Host '  Closing it stops the server and the public address.'
Write-Host ''
Read-Host '  Press Enter to stop ScamShield'

# --- 4. Shut down ------------------------------------------------------------
Write-Host '  Stopping...'
Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -like '*run_system.py*' -or $_.CommandLine -like '*trycloudflare*' -or $_.Name -eq 'cloudflared.exe' } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Write-Host '  Stopped.'
