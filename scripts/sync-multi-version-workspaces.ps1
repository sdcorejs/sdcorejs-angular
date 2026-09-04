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
# then use this script to roll the same surface to v20, v21 and v22. Direct edits
# in derived workspaces should be limited to Angular-major-specific dependency/shim work.
# Order: v19 -> v20 -> v21 -> v22. Never change this order.
$versions = @(
  @{ Folder = "v19"; Major = "19" },
  @{ Folder = "v20"; Major = "20" },
  @{ Folder = "v21"; Major = "21" },
  @{ Folder = "v22"; Major = "22" }
)

$syncDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$syncCommit = if ($CommitId) { $CommitId } else { "unknown" }

$versionsRoot = Join-Path $RootPath "versions"
$v19Path = Join-Path $versionsRoot "v19"

if (!(Test-Path -LiteralPath $v19Path)) {
  throw "Primary v19 workspace not found: $v19Path"
}

$canonicalNpmReadmePath = Join-Path $RootPath "README.npm.md"
$v19PackageReadmePath = Join-Path $v19Path "projects/sdcorejs-angular/README.md"
if (!(Test-Path -LiteralPath $canonicalNpmReadmePath)) {
  throw "Canonical npm README not found: $canonicalNpmReadmePath"
}
if (!(Test-Path -LiteralPath (Split-Path -Parent $v19PackageReadmePath))) {
  throw "Primary library directory not found: $(Split-Path -Parent $v19PackageReadmePath)"
}

# why: README.npm.md is the public package README source of truth. Refresh
# v19 before mirroring so all published Angular lines carry the same release docs.
$canonicalNpmReadme = [System.IO.File]::ReadAllText($canonicalNpmReadmePath)
$currentV19PackageReadme = if (Test-Path -LiteralPath $v19PackageReadmePath) {
  [System.IO.File]::ReadAllText($v19PackageReadmePath)
} else {
  ""
}
if ($currentV19PackageReadme -ne $canonicalNpmReadme) {
  Write-Utf8NoBom -Path $v19PackageReadmePath -Content $canonicalNpmReadme
}

$v19LibraryPackagePath = Join-Path $v19Path "projects/sdcorejs-angular/package.json"
if (!(Test-Path -LiteralPath $v19LibraryPackagePath)) {
  throw "Primary library package not found: $v19LibraryPackagePath"
}
$canonicalLibraryVersion = (Get-Content -LiteralPath $v19LibraryPackagePath -Raw -Encoding UTF8 | ConvertFrom-Json).version
$managedWorkspaceScripts = @(
  "check-i18n-parity.mjs",
  "check-i18n.mjs",
  "generate-pdf-worker-inline.mjs"
)

function Sync-ManagedWorkspaceScripts {
  param([string]$DestinationWorkspace)

  foreach ($scriptName in $managedWorkspaceScripts) {
    $sourcePath = Join-Path $v19Path "scripts/$scriptName"
    if (!(Test-Path -LiteralPath $sourcePath)) {
      throw "Primary workspace script not found: $sourcePath"
    }

    if ($DestinationWorkspace -eq $v19Path) {
      continue
    }

    $destinationScripts = Join-Path $DestinationWorkspace "scripts"
    if (!(Test-Path -LiteralPath $destinationScripts)) {
      New-Item -ItemType Directory -Path $destinationScripts | Out-Null
    }

    $content = [System.IO.File]::ReadAllText($sourcePath)
    Write-Utf8NoBom -Path (Join-Path $destinationScripts $scriptName) -Content $content
  }
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
    "22" { "~6.0.3" }
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

  if ($Major -eq "22") {
    $frameworkPackages = @(
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
      "@angular/compiler-cli"
    )
    foreach ($pkg in $frameworkPackages) {
      $updated = Set-PackageVersion -Content $updated -PackageName $pkg -Version "~22.1.4"
    }
    $updated = Set-PackageVersion -Content $updated -PackageName "@angular-devkit/build-angular" -Version "~22.1.6"
    $updated = Set-PackageVersion -Content $updated -PackageName "@angular/cli" -Version "~22.1.6"
    $updated = Set-PackageVersion -Content $updated -PackageName "ng-packagr" -Version "~22.1.1"
    $updated = Set-PackageVersion -Content $updated -PackageName "angular-eslint" -Version "~22.1.0"
    $updated = Set-PackageVersion -Content $updated -PackageName "typescript-eslint" -Version "8.60.0"
    $updated = Set-PackageVersion -Content $updated -PackageName "zone.js" -Version "~0.16.2"

    $nodeEngine = '^22.22.3 || ^24.15.0 || ^26.0.0'
    if ($updated -match '"engines"\s*:') {
      $updated = $updated -replace '"node"\s*:\s*"[^"]+"', ('"node": "' + $nodeEngine + '"')
    }
    else {
      $updated = $updated -replace '("private"\s*:\s*true,)', ('$1' + "`r`n" + '  "engines": {' + "`r`n" + '    "node": "' + $nodeEngine + '"' + "`r`n" + '  },')
    }
  }

  if ($updated -ne $content) {
    Write-Utf8NoBom -Path $PackagePath -Content $updated
  }
}

function Update-LibraryPackageVersion {
  param(
    [string]$PackagePath,
    [string]$Version
  )

  if (!(Test-Path -LiteralPath $PackagePath)) {
    throw "Library package not found: $PackagePath"
  }

  $content = Get-Content -LiteralPath $PackagePath -Raw -Encoding UTF8
  $versionPattern = New-Object System.Text.RegularExpressions.Regex('"version"\s*:\s*"[^"]+"')
  $updated = $versionPattern.Replace($content, ('"version": "' + $Version + '"'), 1)
  if ($updated -ne $content) {
    Write-Utf8NoBom -Path $PackagePath -Content $updated
  }
}

function Update-LibraryPackageContract {
  param(
    [string]$PackagePath,
    [string]$Major
  )

  if ($Major -ne "22") {
    return
  }

  $content = Get-Content -LiteralPath $PackagePath -Raw -Encoding UTF8
  $updated = $content
  $angularPeers = @(
    "@angular/animations",
    "@angular/cdk",
    "@angular/common",
    "@angular/core",
    "@angular/forms",
    "@angular/material",
    "@angular/material-date-fns-adapter",
    "@angular/platform-browser",
    "@angular/router"
  )
  foreach ($peer in $angularPeers) {
    $updated = Set-PackageVersion -Content $updated -PackageName $peer -Version "^22.0.0"
  }
  $updated = $updated -replace '"node"\s*:\s*"[^"]+"', '"node": "^22.22.3 || ^24.15.0 || ^26.0.0"'

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

function Update-SpecTsConfig {
  param(
    [string]$TsConfigPath,
    [string]$Major
  )

  if ($Major -ne "22" -or !(Test-Path -LiteralPath $TsConfigPath)) {
    return
  }

  $content = Get-Content -LiteralPath $TsConfigPath -Raw -Encoding UTF8
  $updated = $content
  # why: TypeScript 6 reports baseUrl as an error. Paths no longer require it, but
  # without baseUrl their values resolve from this project-level config directory.
  $updated = $updated -replace '(?m)^[ \t]*"baseUrl"\s*:\s*"\.\./\.\./",\r?\n', ''
  $updated = $updated.Replace(
    '"@sdcorejs/angular": ["./projects/sdcorejs-angular/src/public-api"]',
    '"@sdcorejs/angular": ["./src/public-api"]'
  )
  $updated = $updated.Replace(
    '"@sdcorejs/angular/*": ["./projects/sdcorejs-angular/*"]',
    '"@sdcorejs/angular/*": ["./*"]'
  )

  if ($updated -ne $content) {
    Write-Utf8NoBom -Path $TsConfigPath -Content $updated
  }
}

function Update-Angular22GeneratedCompatibility {
  param(
    [string]$WorkspacePath,
    [string]$Major
  )

  if ($Major -ne "22") {
    return
  }

  $projectPath = Join-Path $WorkspacePath "projects/sdcorejs-angular"
  $checkerPath = Join-Path $RootPath "scripts/check-version-sync.mjs"
  if (!(Test-Path -LiteralPath $projectPath)) {
    throw "Angular 22 project path not found: $projectPath"
  }
  if (!(Test-Path -LiteralPath $checkerPath)) {
    throw "Angular 22 compatibility transformer not found: $checkerPath"
  }

  # why: Angular 22 changes an omitted component strategy from eager to OnPush. The official
  # migration makes the old behavior explicit; this deterministic generated-only transform does
  # the same after every v19 -> v22 mirror without changing canonical v19-v21 source.
  $transformScript = @'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const [checkerPath, projectPath] = process.argv.slice(2);
const { applyAngular22GeneratedCompatibility } = await import(pathToFileURL(resolve(checkerPath)).href);
const workspacePath = resolve(projectPath, '..', '..');
const generatedExtensions = new Set(['.ts', '.html', '.scss', '.svg']);

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return walk(path);
    return entry.isFile() && generatedExtensions.has(extname(entry.name)) ? [path] : [];
  });
}

for (const filePath of walk(projectPath)) {
  const relativePath = relative(workspacePath, filePath).split(sep).join('/');
  const content = readFileSync(filePath, 'utf8');
  const migrated = applyAngular22GeneratedCompatibility(content, relativePath);
  if (migrated !== content) writeFileSync(filePath, migrated, 'utf8');
}
'@

  $transformScript | & node --input-type=module - $checkerPath $projectPath
  if ($LASTEXITCODE -ne 0) {
    throw "Angular 22 generated compatibility transform failed with exit code $LASTEXITCODE"
  }
}

$step = 0
foreach ($v in $versions) {
  $step++
  $dest = Join-Path $versionsRoot $v.Folder

  if (!(Test-Path -LiteralPath $dest)) {
    New-Item -ItemType Directory -Path $dest | Out-Null
  }

  Write-Host "[$step/$($versions.Count)] Syncing $($v.Folder) (Angular $($v.Major))..." -ForegroundColor Cyan

  if ($v.Folder -ne "v19") {
    # Mirror copy from versions/v19 to the target version folder
    # why: package-lock.json stays major-specific after each workspace install.
    # CHANGELOG.md is independent at the root repo and is not rolled into versions/.
    robocopy $v19Path $dest /MIR /XD .git .sdcorejs node_modules dist .angular coverage versions scripts demo /XF CHANGELOG.md package-lock.json .gitattributes /R:1 /W:1 /NFL /NDL /NP | Out-Null
  }

  # scripts/ is otherwise workspace-specific; only these quality gates are
  # canonical v19 files that every package.json exposes and must keep runnable.
  Sync-ManagedWorkspaceScripts -DestinationWorkspace $dest

  # Explicitly delete projects/demo folder in target if present
  $versionDemoPath = Join-Path $dest "projects/demo"
  if (Test-Path -LiteralPath $versionDemoPath) {
    Remove-Item -LiteralPath $versionDemoPath -Recurse -Force | Out-Null
  }

  $rootPackagePath = Join-Path $dest "package.json"
  Update-MajorInPackageJson -PackagePath $rootPackagePath -Major $v.Major

  $libraryPackagePath = Join-Path $dest "projects/sdcorejs-angular/package.json"
  $targetLibraryVersion = $canonicalLibraryVersion -replace '^\d+\.', "$($v.Major)."
  Update-LibraryPackageVersion -PackagePath $libraryPackagePath -Version $targetLibraryVersion
  Update-LibraryPackageContract -PackagePath $libraryPackagePath -Major $v.Major

  $rootTsConfigPath = Join-Path $dest "tsconfig.json"
  Update-VersionTsConfig -TsConfigPath $rootTsConfigPath

  $specTsConfigPath = Join-Path $dest "projects/sdcorejs-angular/tsconfig.spec.json"
  Update-SpecTsConfig -TsConfigPath $specTsConfigPath -Major $v.Major

  $sideDrawerPath = Join-Path $dest "projects/sdcorejs-angular/components/side-drawer/src/side-drawer.component.ts"
  Update-SideDrawerPortalCall -FilePath $sideDrawerPath -Major $v.Major

  Update-Angular22GeneratedCompatibility -WorkspacePath $dest -Major $v.Major

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
    "- Normal development happens in this repo: change v19 first, then roll out to v20/v21/v22.",
    "- DomPortalOutlet: $domNote"
  )
  Write-Utf8NoBom -Path (Join-Path $dest "SYNC-STATUS.md") -Content (($statusLines -join "`n") + "`n")
}

Write-Host "Done. Version workspaces synchronized: v19, v20, v21, v22" -ForegroundColor Green
if ($syncCommit -ne "unknown") {
  Write-Host "Source commit: $syncCommit" -ForegroundColor Yellow
}
