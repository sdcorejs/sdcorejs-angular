param(
  [string]$RootPath = ""
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($RootPath)) {
  $RootPath = Resolve-Path (Join-Path $PSScriptRoot "..")
}

if (!(Test-Path -LiteralPath $RootPath)) {
  throw "RootPath not found: $RootPath"
}

$versions = @(
  @{ Folder = "19.x.x"; Major = "19" },
  @{ Folder = "20.x.x"; Major = "20" },
  @{ Folder = "21.x.x"; Major = "21" }
)

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

function Apply-MajorToPackageJson {
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

function Patch-SideDrawerPortalCall {
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

foreach ($v in $versions) {
  $dest = Join-Path $versionsRoot $v.Folder

  if (!(Test-Path -LiteralPath $dest)) {
    New-Item -ItemType Directory -Path $dest | Out-Null
  }

  Write-Host "Syncing version $($v.Folder) (Angular $($v.Major))..." -ForegroundColor Cyan

  robocopy $RootPath $dest /MIR /XD .git node_modules dist .angular coverage versions /R:1 /W:1 /NFL /NDL /NP | Out-Null

  $rootPackagePath = Join-Path $dest "package.json"
  Apply-MajorToPackageJson -PackagePath $rootPackagePath -Major $v.Major

  $sideDrawerPath = Join-Path $dest "projects/sdcorejs-angular/components/side-drawer/src/side-drawer.component.ts"
  Patch-SideDrawerPortalCall -FilePath $sideDrawerPath -Major $v.Major
}

Write-Host "Done. Version workspaces synchronized: 19.x.x, 20.x.x, 21.x.x" -ForegroundColor Green
