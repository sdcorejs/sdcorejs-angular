param(
  [string]$RootPath = "",
  [string]$CommitId = ""
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($RootPath)) {
  $RootPath = Resolve-Path (Join-Path $PSScriptRoot "..")
}

if (!(Test-Path -LiteralPath $RootPath)) {
  throw "RootPath not found: $RootPath"
}

# --- SYNC RULE ---
# v19 is synced FIRST as the primary target (closest to source vn-angular).
# v20 and v21 are rollout targets derived from v19 — version patches applied on top.
# Order: v19 → v20 → v21. Never change this order.
$versions = @(
  @{ Folder = "v19"; Major = "19" },
  @{ Folder = "v20"; Major = "20" },
  @{ Folder = "v21"; Major = "21" }
)

$syncDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$syncCommit = if ($CommitId) { $CommitId } else { "unknown" }

$versionsRoot = Join-Path $RootPath "versions"
if (!(Test-Path -LiteralPath $versionsRoot)) {
  New-Item -ItemType Directory -Path $versionsRoot | Out-Null
}

function Set-PackageVersion {
  param(
    [string]$Content,
    [string]$PackageName,
    [string]$Version
  )

  $pattern = '"' + [regex]::Escape($PackageName) + '"\s*:\s*"[^"]+"'
  $replacement = '"' + $PackageName + '": "' + $Version + '"'
  return ($Content -replace $pattern, $replacement)
}

function Update-MajorInPackageJson {
  param(
    [string]$PackagePath,
    [string]$Major
  )

  if (!(Test-Path -LiteralPath $PackagePath)) {
    return
  }

  $content = Get-Content -LiteralPath $PackagePath -Raw
  $updated = $content

  $angularVersion = "^$Major.0.0"
  $ngPackagrVersion = "^$Major.0.0"
  $materoVersion = "^$Major.0.0"

  $packages = @(
    "@angular/animations",
    "@angular/cdk",
    "@angular/common",
    "@angular/compiler",
    "@angular/core",
    "@angular/forms",
    "@angular/material",
    "@angular/material-moment-adapter",
    "@angular/platform-browser",
    "@angular/platform-browser-dynamic",
    "@angular/router",
    "@angular-devkit/build-angular",
    "@angular/cli",
    "@angular/compiler-cli"
  )

  foreach ($pkg in $packages) {
    $updated = Set-PackageVersion -Content $updated -PackageName $pkg -Version $angularVersion
  }

  $updated = Set-PackageVersion -Content $updated -PackageName "@ng-matero/extensions" -Version $materoVersion
  $updated = Set-PackageVersion -Content $updated -PackageName "@ng-matero/extensions-moment-adapter" -Version $materoVersion
  $updated = Set-PackageVersion -Content $updated -PackageName "ng-packagr" -Version $ngPackagrVersion

  if ($updated -ne $content) {
    Set-Content -LiteralPath $PackagePath -Value $updated -Encoding UTF8
  }
}

function Update-SideDrawerPortalCall {
  param(
    [string]$FilePath,
    [string]$Major
  )

  if (!(Test-Path -LiteralPath $FilePath)) {
    return
  }

  $content = Get-Content -LiteralPath $FilePath -Raw
  $updated = $content

  $legacyCall = "new DomPortalOutlet(document.body, this.#viewContainerRef, this.#ar, this.#injector)"
  $modernCall = "new DomPortalOutlet(document.body, this.#ar, this.#injector)"

  if ($Major -eq "19") {
    $updated = $updated -replace [regex]::Escape($modernCall), $legacyCall
  }
  else {
    $updated = $updated -replace [regex]::Escape($legacyCall), $modernCall
  }

  if ($updated -ne $content) {
    Set-Content -LiteralPath $FilePath -Value $updated -Encoding UTF8
  }
}

$step = 0
foreach ($v in $versions) {
  $step++
  $dest = Join-Path $versionsRoot $v.Folder

  if (!(Test-Path -LiteralPath $dest)) {
    New-Item -ItemType Directory -Path $dest | Out-Null
  }

  Write-Host "[$step/3] Syncing $($v.Folder) (Angular $($v.Major))..." -ForegroundColor Cyan

  robocopy $RootPath $dest /MIR /XD .git node_modules dist .angular coverage versions /R:1 /W:1 /NFL /NDL /NP | Out-Null

  $rootPackagePath = Join-Path $dest "package.json"
  Update-MajorInPackageJson -PackagePath $rootPackagePath -Major $v.Major

  $sideDrawerPath = Join-Path $dest "projects/sdcorejs-angular/components/side-drawer/src/side-drawer.component.ts"
  Update-SideDrawerPortalCall -FilePath $sideDrawerPath -Major $v.Major

  # Write sync status
  $domNote = if ($v.Major -eq "19") { "4-arg constructor (with ViewContainerRef)" } else { "3-arg constructor" }
  $statusLines = @(
    "# Sync Status - $($v.Folder)",
    "",
    "| Key | Value |",
    "|-----|-------|",
    "| Angular Major | $($v.Major) |",
    "| Source Commit | $syncCommit |",
    "| Synced At | $syncDate |",
    "| Source | vn-angular → sdcorejs-angular (root) → $($v.Folder) |",
    "",
    "## Notes",
    "- Sync rule: v19 is synced first (primary). v20 and v21 are rollout targets.",
    "- DomPortalOutlet: $domNote"
  )
  Set-Content -LiteralPath (Join-Path $dest "SYNC-STATUS.md") -Value ($statusLines -join "`n") -Encoding UTF8
}

Write-Host "Done. Version workspaces synchronized: v19, v20, v21" -ForegroundColor Green
if ($syncCommit -ne "unknown") {
  Write-Host "Source commit: $syncCommit" -ForegroundColor Yellow
}
