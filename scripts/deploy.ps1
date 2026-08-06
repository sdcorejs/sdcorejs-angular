param(
  [string]$PatchVersion = "",
  [switch]$SkipInstall,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

# --- PROMPT for version if not provided ---
if ([string]::IsNullOrWhiteSpace($PatchVersion)) {
  Write-Host ""
  Write-Host "==============================================" -ForegroundColor Cyan
  Write-Host "  @sdcorejs/angular - Multi-Version Deploy" -ForegroundColor Cyan
  Write-Host "==============================================" -ForegroundColor Cyan
  Write-Host ""
  Write-Host "Enter release suffix (e.g. '1.0' -> publishes 19.1.0 / 20.1.0 / 21.1.0)" -ForegroundColor Yellow
  $PatchVersion = Read-Host "Release suffix"
}

if ([string]::IsNullOrWhiteSpace($PatchVersion)) {
  throw "Release suffix is required. Example: 1.0"
}

# Validate: must be in x.y format
if ($PatchVersion -notmatch '^\d+\.\d+$') {
  throw "Invalid release suffix '$PatchVersion'. Expected format: 'x.y' (e.g. '1.0', '1.1', '2.0')"
}

$rootPath = Resolve-Path (Join-Path $PSScriptRoot "..")
$versionsRoot = Join-Path $rootPath "versions"

$targets = @(
  @{ Folder = "v19"; Major = "19" },
  @{ Folder = "v20"; Major = "20" },
  @{ Folder = "v21"; Major = "21" }
)

$syncCheckScript = Join-Path $rootPath "scripts\check-version-sync.mjs"
if (Test-Path -LiteralPath $syncCheckScript) {
  Write-Host "Checking v19 -> v20/v21 workspace sync..." -ForegroundColor Gray
  Push-Location $rootPath
  node $syncCheckScript
  $syncCheckExitCode = $LASTEXITCODE
  Pop-Location

  if ($syncCheckExitCode -ne 0) {
    throw "Workspace sync check failed. Run `npm run sync`, review the generated diff, and retry deploy."
  }
}

# Preview
Write-Host ""
Write-Host "Will publish the following packages:" -ForegroundColor White
foreach ($t in $targets) {
  $v = "$($t.Major).$PatchVersion"
  Write-Host "  @sdcorejs/angular@$v  (from versions/$($t.Folder))" -ForegroundColor Gray
}
Write-Host ""

if ($DryRun) {
  Write-Host "[DRY RUN] No changes will be made." -ForegroundColor Magenta
}

$confirm = Read-Host "Proceed? (y/N)"
if ($confirm -notmatch '^[Yy]$') {
  Write-Host "Aborted." -ForegroundColor Red
  exit 0
}

# --- DEPLOY each version ---
$step = 0
foreach ($t in $targets) {
  $step++
  $fullVersion = "$($t.Major).$PatchVersion"
  $versionDir = Join-Path $versionsRoot $t.Folder
  $libPackagePath = Join-Path $versionDir "projects\sdcorejs-angular\package.json"

  if (!(Test-Path -LiteralPath $versionDir)) {
    Write-Warning "Version folder not found: $versionDir - skipping."
    continue
  }

  Write-Host ""
  Write-Host "[$step/3] $($t.Folder) - @sdcorejs/angular@$fullVersion" -ForegroundColor Cyan

  # --- 1. Update library package.json version ---
  Write-Host "  Updating library version..." -ForegroundColor Gray
  if (!$DryRun) {
    # why: explicit UTF8 read avoids ANSI cp1252 defaults in Windows PowerShell 5.1.
    # Use no-BOM writes to stay consistent with repo-owned source files.
    # why: string-replace the version instead of a ConvertFrom-Json/ConvertTo-Json round-trip.
    # ConvertTo-Json reformats the whole file into PowerShell's 4-space/key-aligned style and
    # clobbers the repo's 2-space prettier format. Mirrors Update-LibraryPackageVersion in
    # sync-multi-version-workspaces.ps1 and the node writer in publish-npm.yml.
    $content = Get-Content -LiteralPath $libPackagePath -Raw -Encoding UTF8
    $versionPattern = New-Object System.Text.RegularExpressions.Regex('"version"\s*:\s*"[^"]+"')
    $jsonOut = $versionPattern.Replace($content, ('"version": "' + $fullVersion + '"'), 1)
    [System.IO.File]::WriteAllText($libPackagePath, $jsonOut, (New-Object System.Text.UTF8Encoding($false)))
  }
  Write-Host "  version = $fullVersion" -ForegroundColor Green

  # --- 2. Install dependencies (skip if node_modules exists and -SkipInstall) ---
  $nmPath = Join-Path $versionDir "node_modules"
  if (!$SkipInstall -or !(Test-Path -LiteralPath $nmPath)) {
    Write-Host "  Installing dependencies..." -ForegroundColor Gray
    if (!$DryRun) {
      Push-Location $versionDir
      npm install --legacy-peer-deps --prefer-offline 2>&1 | Tail-Output
      Pop-Location
    }
  } else {
    Write-Host "  Skipping npm install (node_modules exists)" -ForegroundColor DarkGray
  }

  # --- 3. Build library ---
  Write-Host "  Building @sdcorejs/angular..." -ForegroundColor Gray
  if (!$DryRun) {
    Push-Location $versionDir
    # Skip prebuild (test:ci) - use ng directly.
    node --max_old_space_size=8000 ./node_modules/@angular/cli/bin/ng build sdcorejs-angular
    if ($LASTEXITCODE -ne 0) {
      Pop-Location
      throw "Build failed for $($t.Folder)"
    }
    Pop-Location
  }
  Write-Host "  Build OK" -ForegroundColor Green

  # --- 4. Publish to npm ---
  $distPath = Join-Path $versionDir "dist\sdcorejs-angular"
  if (!$DryRun) {
    if (!(Test-Path -LiteralPath $distPath)) {
      throw "dist not found after build: $distPath"
    }
    Push-Location $distPath
    npm publish --access public
    if ($LASTEXITCODE -ne 0) {
      Pop-Location
      throw "Publish failed for $($t.Folder)"
    }
    Pop-Location
  }
  Write-Host "  Published @sdcorejs/angular@$fullVersion" -ForegroundColor Green
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
if ($DryRun) {
  Write-Host "  DRY RUN complete - nothing was published" -ForegroundColor Magenta
} else {
  Write-Host "  Deploy complete!" -ForegroundColor Green
  Write-Host "  Published: @sdcorejs/angular@19.$PatchVersion, 20.$PatchVersion, 21.$PatchVersion" -ForegroundColor White
}
Write-Host "============================================" -ForegroundColor Cyan

# Helper: print last N lines of npm output
function Tail-Output {
  process { $_ | Write-Host -ForegroundColor DarkGray }
}
