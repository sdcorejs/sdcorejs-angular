param(
  [string]$PatchVersion = "",
  [switch]$SkipInstall,
  [switch]$DryRun,
  [string]$OutputPath = "",
  [ValidateSet("", "v19", "v20", "v21", "v22")]
  [string]$InjectFailureAfterStamp = ""
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$targets = @(
  @{ Folder = "v19"; Major = "19" },
  @{ Folder = "v20"; Major = "20" },
  @{ Folder = "v21"; Major = "21" },
  @{ Folder = "v22"; Major = "22" }
)

function Invoke-Checked {
  param(
    [Parameter(Mandatory = $true)][string]$Executable,
    [Parameter(Mandatory = $true)][string[]]$Arguments,
    [Parameter(Mandatory = $true)][string]$WorkingDirectory,
    [Parameter(Mandatory = $true)][string]$Label
  )

  Push-Location -LiteralPath $WorkingDirectory
  try {
    & $Executable @Arguments
    if ($LASTEXITCODE -ne 0) {
      throw "$Label failed with exit code $LASTEXITCODE."
    }
  }
  finally {
    Pop-Location
  }
}

function Assert-ChildPath {
  param(
    [Parameter(Mandatory = $true)][string]$Parent,
    [Parameter(Mandatory = $true)][string]$Child
  )

  $parentFull = [System.IO.Path]::GetFullPath($Parent).TrimEnd([System.IO.Path]::DirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar
  $childFull = [System.IO.Path]::GetFullPath($Child)
  if (-not $childFull.StartsWith($parentFull, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to modify path outside the explicit output directory: $childFull"
  }
}

function Write-Utf8NoBom {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][string]$Content
  )

  [System.IO.File]::WriteAllText($Path, $Content, (New-Object System.Text.UTF8Encoding($false)))
}

if ([string]::IsNullOrWhiteSpace($PatchVersion)) {
  throw "-PatchVersion is required (for this release use 2.5)."
}
if ($PatchVersion -notmatch '^\d+\.\d+$') {
  throw "Invalid release suffix '$PatchVersion'. Expected <minor>.<patch>, for example 2.5."
}
$releaseParts = $PatchVersion.Split('.')
if ([int]$releaseParts[1] -le 0) {
  throw "Release suffix '$PatchVersion' has no automatic previous-patch baseline."
}
$baselineSuffix = "$([int]$releaseParts[0]).$([int]$releaseParts[1] - 1)"
if ([string]::IsNullOrWhiteSpace($OutputPath)) {
  throw "-OutputPath is required so staged artifacts never land in a source workspace."
}
if (-not [string]::IsNullOrWhiteSpace($InjectFailureAfterStamp) -and -not $DryRun) {
  throw "-InjectFailureAfterStamp is a DryRun-only regression hook."
}

$rootPath = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$versionsRoot = Join-Path $rootPath "versions"
$outputRoot = [System.IO.Path]::GetFullPath($OutputPath)
if ($outputRoot -eq [System.IO.Path]::GetPathRoot($outputRoot)) {
  throw "Refusing to use a filesystem root as -OutputPath."
}
$separator = [System.IO.Path]::DirectorySeparatorChar
$rootPrefix = $rootPath.TrimEnd($separator) + $separator
$outputPrefix = $outputRoot.TrimEnd($separator) + $separator
if (
  $outputRoot.Equals($rootPath, [System.StringComparison]::OrdinalIgnoreCase) -or
  $outputRoot.StartsWith($rootPrefix, [System.StringComparison]::OrdinalIgnoreCase) -or
  $rootPath.StartsWith($outputPrefix, [System.StringComparison]::OrdinalIgnoreCase)
) {
  throw "-OutputPath must not overlap the source repository: $outputRoot"
}

$nodeVersionOutput = & node --version
if ($LASTEXITCODE -ne 0 -or ($nodeVersionOutput | Select-Object -First 1).Trim() -ne "v22.22.3") {
  throw "Release staging requires exact Node v22.22.3."
}

if (-not $DryRun) {
  $confirmation = Read-Host "Stage four release artifacts under '$outputRoot'? (y/N)"
  if ($confirmation -notmatch '^[Yy]$') {
    Write-Host "Aborted."
    exit 0
  }
}

$syncCheckScript = Join-Path $rootPath "scripts\check-version-sync.mjs"
Invoke-Checked -Executable "node" -Arguments @($syncCheckScript) -WorkingDirectory $rootPath -Label "Workspace sync check"

$sourceShaOutput = & git -C $rootPath rev-parse HEAD
if ($LASTEXITCODE -ne 0) {
  throw "Cannot resolve the source SHA."
}
$sourceSha = ($sourceShaOutput | Select-Object -First 1).Trim()
if ($sourceSha -notmatch '^[a-f0-9]{40}$') {
  throw "Invalid source SHA '$sourceSha'."
}

New-Item -ItemType Directory -Path $outputRoot -Force | Out-Null
$originalManifestBytes = @{}
$artifactRecords = New-Object System.Collections.Generic.List[object]

try {
  $step = 0
  foreach ($target in $targets) {
    $step++
    $workspace = $target.Folder
    $major = $target.Major
    $fullVersion = "$major.$PatchVersion"
    $versionDir = Join-Path $versionsRoot $workspace
    $libraryManifestPath = Join-Path $versionDir "projects\sdcorejs-angular\package.json"
    $stageDir = Join-Path $outputRoot $workspace

    if (-not (Test-Path -LiteralPath $versionDir -PathType Container)) {
      throw "Required workspace is missing: $versionDir"
    }
    if (-not (Test-Path -LiteralPath $libraryManifestPath -PathType Leaf)) {
      throw "Required package manifest is missing: $libraryManifestPath"
    }

    Write-Host "[$step/4] Staging @sdcorejs/angular@$fullVersion from $workspace" -ForegroundColor Cyan
    $originalManifestBytes[$libraryManifestPath] = [System.IO.File]::ReadAllBytes($libraryManifestPath)
    $manifestContent = Get-Content -LiteralPath $libraryManifestPath -Raw -Encoding UTF8
    $versionPattern = New-Object System.Text.RegularExpressions.Regex('"version"\s*:\s*"[^"]+"')
    $stampedContent = $versionPattern.Replace($manifestContent, ('"version": "' + $fullVersion + '"'), 1)
    Write-Utf8NoBom -Path $libraryManifestPath -Content $stampedContent

    if ($InjectFailureAfterStamp -eq $workspace) {
      throw "Injected DryRun failure after stamping $workspace."
    }

    if (-not $SkipInstall) {
      if ($workspace -eq "v22") {
        Invoke-Checked -Executable "npm" -Arguments @("ci") -WorkingDirectory $versionDir -Label "$workspace clean install"
      }
      else {
        Invoke-Checked -Executable "npm" -Arguments @("ci", "--legacy-peer-deps") -WorkingDirectory $versionDir -Label "$workspace clean install"
      }
    }
    elseif (-not (Test-Path -LiteralPath (Join-Path $versionDir "node_modules") -PathType Container)) {
      throw "$workspace node_modules is missing; -SkipInstall cannot be used."
    }

    Invoke-Checked -Executable "npm" -Arguments @("run", "build") -WorkingDirectory $versionDir -Label "$workspace build"
    $distDir = Join-Path $versionDir "dist\sdcorejs-angular"
    if (-not (Test-Path -LiteralPath $distDir -PathType Container)) {
      throw "$workspace build did not create $distDir."
    }

    Assert-ChildPath -Parent $outputRoot -Child $stageDir
    if (Test-Path -LiteralPath $stageDir) {
      Remove-Item -LiteralPath $stageDir -Recurse -Force
    }
    New-Item -ItemType Directory -Path $stageDir -Force | Out-Null

    Push-Location -LiteralPath $distDir
    try {
      $packOutput = & npm pack --json --pack-destination $stageDir
      if ($LASTEXITCODE -ne 0) {
        throw "$workspace npm pack failed with exit code $LASTEXITCODE."
      }
    }
    finally {
      Pop-Location
    }

    $packJson = ($packOutput -join [Environment]::NewLine)
    $packRecords = $packJson | ConvertFrom-Json
    $pack = @($packRecords)[0]
    if ([string]::IsNullOrWhiteSpace($pack.filename) -or [string]::IsNullOrWhiteSpace($pack.integrity) -or [string]::IsNullOrWhiteSpace($pack.shasum)) {
      throw "$workspace npm pack metadata is incomplete."
    }
    Write-Utf8NoBom -Path (Join-Path $stageDir "pack.json") -Content (($packRecords | ConvertTo-Json -Depth 100) + [Environment]::NewLine)

    $tarballPath = Join-Path $stageDir $pack.filename
    if (-not (Test-Path -LiteralPath $tarballPath -PathType Leaf)) {
      throw "$workspace tarball is missing: $tarballPath"
    }
    $sha256 = (Get-FileHash -LiteralPath $tarballPath -Algorithm SHA256).Hash.ToLowerInvariant()
    $sha1 = (Get-FileHash -LiteralPath $tarballPath -Algorithm SHA1).Hash.ToLowerInvariant()
    $sha512Algorithm = [System.Security.Cryptography.SHA512]::Create()
    try {
      $tarballBytes = [System.IO.File]::ReadAllBytes($tarballPath)
      $integrity = "sha512-$([Convert]::ToBase64String($sha512Algorithm.ComputeHash($tarballBytes)))"
    }
    finally {
      $sha512Algorithm.Dispose()
    }
    if ($sha1 -ne $pack.shasum -or $integrity -ne $pack.integrity) {
      throw "$workspace tarball does not match npm shasum/integrity metadata."
    }
    Write-Utf8NoBom -Path (Join-Path $stageDir "sha256.txt") -Content "$sha256  $($pack.filename)$([Environment]::NewLine)"

    $baselineMajor = if ($major -eq "22") { "21" } else { $major }
    $tag = if ($major -eq "22") { "latest" } else { "angular$major" }
    $artifact = [ordered]@{
      target = [ordered]@{
        major = [int]$major
        workspace = $workspace
        version = $fullVersion
        tag = $tag
        baselineVersion = "$baselineMajor.$baselineSuffix"
        baselineMajor = [int]$baselineMajor
      }
      tarball = $pack.filename
      sha256 = $sha256
      sourceSha = $sourceSha
      pack = $pack
    }
    Write-Utf8NoBom -Path (Join-Path $stageDir "artifact.json") -Content (($artifact | ConvertTo-Json -Depth 100) + [Environment]::NewLine)
    $artifactRecords.Add($artifact)
  }

  $registryPlan = New-Object System.Collections.Generic.List[object]
  foreach ($artifact in $artifactRecords) {
    $version = $artifact.target.version
    $oldPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
      $viewOutput = & npm view "@sdcorejs/angular@$version" dist --json 2>&1
      $viewExitCode = $LASTEXITCODE
    }
    finally {
      $ErrorActionPreference = $oldPreference
    }

    if ($viewExitCode -eq 0) {
      $registryDist = (($viewOutput -join [Environment]::NewLine) | ConvertFrom-Json)
      if ($registryDist.integrity -ne $artifact.pack.integrity -or $registryDist.shasum -ne $artifact.pack.shasum) {
        throw "$version already exists with different immutable integrity/shasum."
      }
      $registryPlan.Add([ordered]@{ version = $version; action = "reuse"; tag = $artifact.target.tag })
    }
    else {
      $viewText = $viewOutput -join [Environment]::NewLine
      if ($viewText -notmatch 'E404|404 Not Found|is not in this registry') {
        throw "Registry preflight failed for $version`n$viewText"
      }
      $registryPlan.Add([ordered]@{ version = $version; action = "publish"; tag = $artifact.target.tag })
    }
  }

  $bundle = [ordered]@{
    sourceSha = $sourceSha
    suffix = $PatchVersion
    artifacts = $artifactRecords
    registryPlan = $registryPlan
    dryRun = [bool]$DryRun
  }
  Write-Utf8NoBom -Path (Join-Path $outputRoot "bundle.json") -Content (($bundle | ConvertTo-Json -Depth 100) + [Environment]::NewLine)
  Write-Host "Staged and collision-checked four immutable artifacts at $outputRoot" -ForegroundColor Green
}
finally {
  foreach ($manifestPath in $originalManifestBytes.Keys) {
    [System.IO.File]::WriteAllBytes($manifestPath, $originalManifestBytes[$manifestPath])
  }
}
