param(
  [string]$RootPath = "",
  [string]$CommitId = ""
)

$ErrorActionPreference = "Stop"

# why: same encoding hygiene as the archived legacy sync script.
# Get-Content -Raw mặc định ANSI cp1252 trên PS 5.1 → mojibake với Vietnamese.
# Set-Content -Encoding UTF8 ghi BOM → inconsistent with repo-owned source files.
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
function Write-Utf8NoBom {
  param([string]$Path, [string]$Content)
  [System.IO.File]::WriteAllText($Path, $Content, $script:Utf8NoBom)
}

if ([string]::IsNullOrWhiteSpace($RootPath)) {
  $RootPath = Resolve-Path (Join-Path $PSScriptRoot "..")
}

if (!(Test-Path -LiteralPath $RootPath)) {
  throw "RootPath not found: $RootPath"
}

# --- WORKSPACE ROLLOUT RULE ---
# After the final legacy sync from vn-angular@d12478a1 (2026-06-24), v19 is the
# repo-owned primary workspace. Build features, docs, tests, and showcase in v19,
# then use this script to roll the same surface to v20 and v21. Direct edits in
# v20/v21 should be limited to Angular-major-specific dependency/shim work.
# Order: v19 → v20 → v21. Never change this order.
$versions = @(
  @{ Folder = "v19"; Major = "19" },
  @{ Folder = "v20"; Major = "20" },
  @{ Folder = "v21"; Major = "21" }
)

$syncDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$syncCommit = if ($CommitId) { $CommitId } else { "unknown" }

$versionsRoot = Join-Path $RootPath "versions"
$v19Path = Join-Path $versionsRoot "v19"

if (!(Test-Path -LiteralPath $v19Path)) {
  throw "Primary v19 workspace not found: $v19Path"
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

  $content = Get-Content -LiteralPath $PackagePath -Raw -Encoding UTF8
  $updated = $content

  $angularVersion = "^$Major.0.0"
  $ngPackagrVersion = "^$Major.0.0"
  $materoVersion = "^$Major.0.0"
  $typescriptVersion = switch ($Major) {
    "20" { "~5.8.3" }
    "21" { "~5.9.3" }
    default { "~5.7.2" }
  }

  $packages = @(
    "@angular/animations",
    "@angular/cdk",
    "@angular/common",
    "@angular/compiler",
    "@angular/core",
    "@angular/forms",
    "@angular/material",
    "@angular/material-date-fns-adapter",
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
  $updated = Set-PackageVersion -Content $updated -PackageName "typescript" -Version $typescriptVersion

  if ($Major -eq "21") {
    $updated = Set-PackageVersion -Content $updated -PackageName "angular-eslint" -Version "^21.0.0"
    $updated = Set-PackageVersion -Content $updated -PackageName "typescript-eslint" -Version "^8.60.0"
  }

  if ($updated -ne $content) {
    Write-Utf8NoBom -Path $PackagePath -Content $updated
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

  $content = Get-Content -LiteralPath $FilePath -Raw -Encoding UTF8
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
    Write-Utf8NoBom -Path $FilePath -Content $updated
  }
}

function Update-VersionTsConfig {
  param(
    [string]$TsConfigPath
  )

  if (!(Test-Path -LiteralPath $TsConfigPath)) {
    return
  }

  $content = Get-Content -LiteralPath $TsConfigPath -Raw -Encoding UTF8
  $updated = $content

  $updated = $updated -replace '"@sdcorejs/angular":\s*\["dist/sdcorejs-angular"\]', '"@sdcorejs/angular": ["./dist/sdcorejs-angular"]'
  $updated = $updated -replace '"@sdcorejs/angular/\*":\s*\["dist/sdcorejs-angular/\*",\s*"projects/sdcorejs-angular/\*"\]', '"@sdcorejs/angular/*": ["./dist/sdcorejs-angular/*", "./projects/sdcorejs-angular/*"]'
  $updated = $updated -replace '\s*"baseUrl"\s*:\s*"\.\/",\r?\n', ''
  $updated = $updated -replace '\s*"ignoreDeprecations"\s*:\s*"[^"]+",\r?\n', ''

  if ($updated -notmatch '"rootDir"\s*:') {
    $updated = $updated -replace '"outDir"\s*:\s*"\.\/dist\/out-tsc",', ('"outDir": "./dist/out-tsc",' + "`r`n" + '    "rootDir": "./projects",')
  }

  if ($updated -ne $content) {
    Write-Utf8NoBom -Path $TsConfigPath -Content $updated
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

  if ($v.Folder -ne "v19") {
    # Mirror copy from versions/v19 to the target version folder
    # why: /XF CHANGELOG.md — changelog độc lập ở root repo, không lan vào versions/ (xem sync-from-vn-angular.ps1).
    robocopy $v19Path $dest /MIR /XD .git node_modules dist .angular coverage versions scripts demo /XF CHANGELOG.md /R:1 /W:1 /NFL /NDL /NP | Out-Null
  }

  # Explicitly delete projects/demo folder in target if present
  $versionDemoPath = Join-Path $dest "projects/demo"
  if (Test-Path -LiteralPath $versionDemoPath) {
    Remove-Item -LiteralPath $versionDemoPath -Recurse -Force | Out-Null
  }

  $rootPackagePath = Join-Path $dest "package.json"
  Update-MajorInPackageJson -PackagePath $rootPackagePath -Major $v.Major

  $rootTsConfigPath = Join-Path $dest "tsconfig.json"
  Update-VersionTsConfig -TsConfigPath $rootTsConfigPath

  $sideDrawerPath = Join-Path $dest "projects/sdcorejs-angular/components/side-drawer/src/side-drawer.component.ts"
  Update-SideDrawerPortalCall -FilePath $sideDrawerPath -Major $v.Major

  # Write workspace status
  # why: build the arrow at runtime ([char]0x2192) instead of embedding a literal `→`.
  # PS 5.1 reads this .ps1 as cp1252 (no BOM), so a literal U+2192 can decode to mojibake
  # and gets written into SYNC-STATUS.md. Keeping the source ASCII avoids that round-trip.
  $arrow = [char]0x2192
  $legacyCommit = if ($syncCommit -ne "unknown") { $syncCommit } else { "d12478a1" }
  $originLabel = if ($syncCommit -ne "unknown") { "legacy vn-angular@$syncCommit" } else { "repo-owned versions/v19 (final legacy sync vn-angular@d12478a1)" }
  $workspaceFlow = if ($v.Folder -eq "v19") { "versions/v19" } else { "versions/v19 $arrow $($v.Folder)" }
  $domNote = if ($v.Major -eq "19") { "4-arg constructor (with ViewContainerRef)" } else { "3-arg constructor" }
  $statusLines = @(
    "# Workspace Status - $($v.Folder)",
    "",
    "| Key | Value |",
    "|-----|-------|",
    "| Angular Major | $($v.Major) |",
    "| Legacy Source Commit | $legacyCommit |",
    "| Updated At | $syncDate |",
    "| Origin | $originLabel |",
    "| Workspace Flow | $workspaceFlow |",
    "| Development Mode | repo-owned independent pack |",
    "",
    "## Notes",
    "- Final legacy sync was confirmed from vn-angular@d12478a1 on 2026-06-24.",
    "- Normal development happens in this repo: change v19 first, then roll out to v20/v21.",
    "- DomPortalOutlet: $domNote"
  )
  Write-Utf8NoBom -Path (Join-Path $dest "SYNC-STATUS.md") -Content (($statusLines -join "`n") + "`n")
}

Write-Host "Done. Version workspaces synchronized: v19, v20, v21" -ForegroundColor Green
if ($syncCommit -ne "unknown") {
  Write-Host "Source commit: $syncCommit" -ForegroundColor Yellow
}
