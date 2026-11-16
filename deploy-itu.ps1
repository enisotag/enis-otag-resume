<#
.SYNOPSIS
    Deploys Süleyman Enis Otağ's static portfolio site to ITU personal web space.

.DESCRIPTION
    Stages only the deployable static website files (HTML pages and assets/) into
    a clean temporary directory, excluding repository metadata (.git, README.md,
    deploy-itu.ps1, etc.), verifies OpenSSH scp availability, displays the exact
    upload manifest, and transfers files to ITU servers via SCP.

    Note on ITU BİDB server configuration:
    İTÜ personal web pages use 'ssh.itu.edu.tr' (default SSH/SFTP gateway) or
    'web.itu.edu.tr', mapping to 'public_html' inside your home directory.
    Off-campus connections require an active ITU VPN (FortiClient) session
    because İTÜ BİDB blocks port 22 from external networks.

.PARAMETER Username
    ITU network username (default: "otag23").

.PARAMETER RemoteHost
    Target SSH/SCP hostname (default: "ssh.itu.edu.tr"; automatically falls
    back to "web.itu.edu.tr" if needed).

.PARAMETER RemotePath
    Remote destination directory on the ITU server (default: "public_html").

.PARAMETER Port
    SSH/SCP port number (default: 22).

.PARAMETER DryRun
    Stages the deployable files into a temporary directory, prints the exact
    file manifest and SCP command without uploading, and cleans up.

.EXAMPLE
    .\deploy-itu.ps1 -DryRun

.EXAMPLE
    .\deploy-itu.ps1 -Username "otag23" -RemoteHost "ssh.itu.edu.tr" -RemotePath "public_html"

.EXAMPLE
    .\deploy-itu.ps1 -RemoteHost "web.itu.edu.tr"
#>

[CmdletBinding()]
param(
    [string]$Username = "otag23",
    [string]$RemoteHost = "ssh.itu.edu.tr",
    [string]$RemotePath = "public_html",
    [int]$Port = 22,
    [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$RemotePath = $RemotePath.Trim().TrimEnd('/')
if ([string]::IsNullOrWhiteSpace($RemotePath)) {
    $RemotePath = "public_html"
}

$ProjectRoot = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }

$DeployFiles = @(
    "index.html",
    "about.html",
    "projects.html",
    "journey.html",
    "enis_journey.html"
)
$DeployDirectories = @(
    "assets"
)
$ExcludedNames = @(
    ".DS_Store",
    "Thumbs.db",
    "desktop.ini"
)

function Format-ByteSize {
    param([long]$Bytes)
    if ($Bytes -ge 1MB) {
        return "{0:N2} MB" -f ($Bytes / 1MB)
    }
    if ($Bytes -ge 1KB) {
        return "{0:N1} KB" -f ($Bytes / 1KB)
    }
    return "{0} B" -f $Bytes
}

function Test-TcpPort {
    param(
        [string]$HostName,
        [int]$PortNumber,
        [int]$TimeoutMs = 3000
    )
    $client = New-Object System.Net.Sockets.TcpClient
    try {
        $async = $client.BeginConnect($HostName, $PortNumber, $null, $null)
        if (-not $async.AsyncWaitHandle.WaitOne($TimeoutMs, $false)) {
            return $false
        }
        $client.EndConnect($async)
        return $true
    }
    catch {
        return $false
    }
    finally {
        $client.Dispose()
    }
}

function Show-FallbackInstructions {
    param(
        [string]$User,
        [string]$HostName,
        [string]$TargetDir
    )
    Write-Host ""
    Write-Host "=== ITU Deployment Troubleshooting & Fallback Guide ===" -ForegroundColor Yellow
    Write-Host "1. ITU VPN Requirement (TR / EN):"
    Write-Host "   [TR] Kampus disindaysaniz ITU BIDB dis aglardan 22 (SSH/SFTP) portunu engeller."
    Write-Host "        Yuklemeden once ITU VPN (FortiClient) baglantisini acip tekrar deneyin."
    Write-Host "   [EN] If you are outside the ITU campus network (eduroam/campus LAN),"
    Write-Host "        connect to ITU VPN (FortiClient) before running SCP/SFTP."
    Write-Host ""
    Write-Host "2. Alternate ITU SSH/SCP Hostname:"
    Write-Host "   Depending on ITU BIDB configuration, try:"
    Write-Host "   .\deploy-itu.ps1 -Username $User -RemoteHost web.itu.edu.tr -RemotePath $TargetDir"
    Write-Host ""
    Write-Host "3. WinSCP / FileZilla GUI Fallback (SFTP or SCP):"
    Write-Host "   - Protocol  : SFTP (or SCP)"
    Write-Host "   - Host name : $HostName (or web.itu.edu.tr)"
    Write-Host "   - Port      : 22"
    Write-Host "   - User name : $User"
    Write-Host "   - Remote dir: ~/$TargetDir"
    Write-Host "   - Upload ONLY: index.html, about.html, projects.html, journey.html, enis_journey.html, and assets/"
    Write-Host "   - Exclude    : .git, .gitignore, README.md, deploy-itu.ps1"
    Write-Host ""
    Write-Host "4. Permissions Check (if https://web.itu.edu.tr/$User/ returns 403):"
    Write-Host "   ssh ${User}@${HostName} 'chmod 701 ~ && chmod 755 ~/$TargetDir && find ~/$TargetDir -type d -exec chmod 755 {} + && find ~/$TargetDir -type f -exec chmod 644 {} +'"
    Write-Host ""
}

$StageId = [Guid]::NewGuid().ToString("N").Substring(0, 8)
$StagingDir = Join-Path ([System.IO.Path]::GetTempPath()) "itu-portfolio-stage-$StageId"

try {
    Write-Host ""
    Write-Host "ITU Portfolio Deployment Pipeline" -ForegroundColor Cyan
    Write-Host "Source : $ProjectRoot"
    Write-Host "Target : ${Username}@${RemoteHost}:${RemotePath}/"
    Write-Host "URL    : https://web.itu.edu.tr/${Username}/"
    if ($DryRun) {
        Write-Host "Mode   : DRY RUN (no network transfer)" -ForegroundColor Yellow
    }
    Write-Host ""

    $MissingFiles = @()
    foreach ($FileName in $DeployFiles) {
        $SourcePath = Join-Path $ProjectRoot $FileName
        if (-not (Test-Path -LiteralPath $SourcePath -PathType Leaf)) {
            $MissingFiles += $FileName
        }
    }
    foreach ($DirName in $DeployDirectories) {
        $SourceDir = Join-Path $ProjectRoot $DirName
        if (-not (Test-Path -LiteralPath $SourceDir -PathType Container)) {
            $MissingFiles += "$DirName/"
        }
    }

    if ($MissingFiles.Count -gt 0) {
        throw "Missing required deployable item(s): $($MissingFiles -join ', ')"
    }

    New-Item -ItemType Directory -Path $StagingDir -Force | Out-Null

    foreach ($FileName in $DeployFiles) {
        $SourcePath = Join-Path $ProjectRoot $FileName
        $DestPath = Join-Path $StagingDir $FileName
        Copy-Item -LiteralPath $SourcePath -Destination $DestPath -Force
    }

    foreach ($DirName in $DeployDirectories) {
        $SourceDir = Join-Path $ProjectRoot $DirName
        $DestDir = Join-Path $StagingDir $DirName
        New-Item -ItemType Directory -Path $DestDir -Force | Out-Null

        Get-ChildItem -LiteralPath $SourceDir -Recurse -File | ForEach-Object {
            if ($ExcludedNames -contains $_.Name) {
                return
            }
            $RelativeSubPath = $_.FullName.Substring($SourceDir.Length).TrimStart('\', '/')
            $TargetFile = Join-Path $DestDir $RelativeSubPath
            $TargetParent = Split-Path -Path $TargetFile -Parent
            if (-not (Test-Path -LiteralPath $TargetParent)) {
                New-Item -ItemType Directory -Path $TargetParent -Force | Out-Null
            }
            Copy-Item -LiteralPath $_.FullName -Destination $TargetFile -Force
        }
    }

    $StagedFiles = @(Get-ChildItem -LiteralPath $StagingDir -Recurse -File | Sort-Object FullName)
    if ($StagedFiles.Count -eq 0) {
        throw "Staging directory is empty. Nothing to upload."
    }

    $TotalBytes = [long]0
    Write-Host "Staged files to upload (excluding .git, README.md, deploy-itu.ps1):" -ForegroundColor Green
    foreach ($Item in $StagedFiles) {
        $RelPath = $Item.FullName.Substring($StagingDir.Length).TrimStart('\', '/').Replace('\', '/')
        $TotalBytes += $Item.Length
        $SizeLabel = Format-ByteSize -Bytes $Item.Length
        Write-Host ("  - {0,-45} {1,10}" -f $RelPath, $SizeLabel)
    }
    Write-Host ("Total: {0} file(s), {1}" -f $StagedFiles.Count, (Format-ByteSize -Bytes $TotalBytes))
    Write-Host ""

    $ScpCommand = Get-Command scp -ErrorAction SilentlyContinue
    $ScpAvailable = $null -ne $ScpCommand

    $TopLevelItems = @($DeployFiles + $DeployDirectories)
    $RemoteSpec = "${Username}@${RemoteHost}:${RemotePath}/"
    $DisplayCmd = "scp -P $Port -r $($TopLevelItems -join ' ') $RemoteSpec"

    Write-Host "Planned SCP command (from staging folder):"
    Write-Host "  $DisplayCmd"
    Write-Host ""

    if (-not $ScpAvailable) {
        Write-Warning "OpenSSH 'scp' executable was not found in PATH."
        Write-Host "To install OpenSSH Client on Windows (Admin PowerShell):"
        Write-Host "  Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0"
        Show-FallbackInstructions -User $Username -HostName $RemoteHost -TargetDir $RemotePath
        if ($DryRun) {
            Write-Host "Dry run completed (scp not available on this host)." -ForegroundColor Yellow
            return
        }
        exit 1
    }

    Write-Host "Detected scp: $($ScpCommand.Source)"

    if ($DryRun) {
        Write-Host "Dry run complete. No files were transferred." -ForegroundColor Yellow
        Show-FallbackInstructions -User $Username -HostName $RemoteHost -TargetDir $RemotePath
        return
    }

    $CandidateHosts = @($RemoteHost)
    if ($RemoteHost -eq "ssh.itu.edu.tr") {
        $CandidateHosts += "web.itu.edu.tr"
    }
    elseif ($RemoteHost -eq "web.itu.edu.tr") {
        $CandidateHosts += "ssh.itu.edu.tr"
    }

    $ReachableHost = $null
    foreach ($Candidate in $CandidateHosts) {
        Write-Host "Checking TCP reachability on ${Candidate}:${Port} (3s timeout)..." -ForegroundColor DarkGray
        if (Test-TcpPort -HostName $Candidate -PortNumber $Port -TimeoutMs 3000) {
            $ReachableHost = $Candidate
            break
        }
    }

    if (-not $ReachableHost) {
        Write-Host ""
        Write-Host "[TR] HATA: $($CandidateHosts -join ' ve ') adreslerinde ${Port} (SSH/SFTP) portu yanit vermedi (zaman asimi)." -ForegroundColor Red
        Write-Host "     ITU BIDB kampus agi (eduroam) disindan 22. porta erisimi engeller." -ForegroundColor Yellow
        Write-Host "     Lutfen once ITU VPN (FortiClient) baglantisini acin ve .\deploy-itu.ps1 komutunu tekrar calistirin." -ForegroundColor Yellow
        Write-Host "[EN] ERROR: Port ${Port} (SSH/SFTP) timed out on $($CandidateHosts -join ' and ')." -ForegroundColor Red
        Write-Host "     ITU BIDB blocks port 22 outside campus unless ITU VPN (FortiClient) is connected." -ForegroundColor Yellow
        Show-FallbackInstructions -User $Username -HostName $RemoteHost -TargetDir $RemotePath
        exit 1
    }

    if ($ReachableHost -ne $RemoteHost) {
        Write-Host "Switched target host to reachable endpoint: $ReachableHost" -ForegroundColor Yellow
        $RemoteHost = $ReachableHost
        $RemoteSpec = "${Username}@${RemoteHost}:${RemotePath}/"
    }

    $ScpArgs = @("-P", "$Port", "-r") + $TopLevelItems + @($RemoteSpec)
    Write-Host "Uploading staged files to $RemoteSpec ..." -ForegroundColor Cyan

    Push-Location -LiteralPath $StagingDir
    try {
        & $ScpCommand.Source @ScpArgs
        $ScpExit = $LASTEXITCODE
    }
    finally {
        Pop-Location
    }

    if ($ScpExit -ne 0) {
        Write-Error "SCP failed with exit code $ScpExit."
        Show-FallbackInstructions -User $Username -HostName $RemoteHost -TargetDir $RemotePath
        exit $ScpExit
    }

    Write-Host ""
    Write-Host "Deployment succeeded!" -ForegroundColor Green
    Write-Host "Verify live site at: https://web.itu.edu.tr/${Username}/"
}
catch {
    Write-Host ""
    Write-Host "Deployment aborted: $($_.Exception.Message)" -ForegroundColor Red
    Show-FallbackInstructions -User $Username -HostName $RemoteHost -TargetDir $RemotePath
    exit 1
}
finally {
    if (Test-Path -LiteralPath $StagingDir) {
        Remove-Item -LiteralPath $StagingDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}
