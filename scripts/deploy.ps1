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
  Write-Host "  @sdcorejs/angular — Multi-Version Deploy" -ForegroundColor Cyan
  Write-Host "==============================================" -ForegroundColor Cyan
  Write-Host ""
  Write-Host "Enter patch version suffix (e.g. '0.5' → publishes 19.0.5 / 20.0.5 / 21.0.5)" -ForegroundColor Yellow
  $PatchVersion = Read-Host "Patch version"
}

if ([string]::IsNullOrWhiteSpace($PatchVersion)) {
  throw "Patch version is required. Example: 0.5"
}

# Validate: must be in x.y format
if ($PatchVersion -notmatch '^\d+\.\d+$') {
  throw "Invalid patch version '$PatchVersion'. Expected format: 'x.y' (e.g. '0.5', '1.0', '2.3')"
}

$rootPath = Resolve-Path (Join-Path $PSScriptRoot "..")
$versionsRoot = Join-Path $rootPath "versions"

$targets = @(
  @{ Folder = "v19"; Major = "19" },
  @{ Folder = "v20"; Major = "20" },
  @{ Folder = "v21"; Major = "21" }
)

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
    Write-Warning "Version folder not found: $versionDir — skipping."
    continue
  }

  Write-Host ""
  Write-Host "[$step/3] $($t.Folder) — @sdcorejs/angular@$fullVersion" -ForegroundColor Cyan

  # --- 1. Update library package.json version ---
  Write-Host "  Updating library version..." -ForegroundColor Gray
  if (!$DryRun) {
    # why: encoding hygiene — UTF8 explicit cho read (tránh ANSI cp1252 mặc định PS 5.1)
    # + no-BOM cho write (consistent với vn-angular source).
    $pkg = Get-Content -LiteralPath $libPackagePath -Raw -Encoding UTF8 | ConvertFrom-Json
    $pkg.version = $fullVersion
    $jsonOut = $pkg | ConvertTo-Json -Depth 100
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
    # Skip prebuild (test:ci) — use ng directly
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
  Write-Host "  DRY RUN complete — nothing was published" -ForegroundColor Magenta
} else {
  Write-Host "  Deploy complete!" -ForegroundColor Green
  Write-Host "  Published: @sdcorejs/angular@19.$PatchVersion, 20.$PatchVersion, 21.$PatchVersion" -ForegroundColor White
}
Write-Host "============================================" -ForegroundColor Cyan

# Helper: print last N lines of npm output
function Tail-Output {
  process { $_ | Write-Host -ForegroundColor DarkGray }
}
