param(
  [string]$SourcePath = "C:/Users/Admin/Documents/lib-core-angular/vn-angular",
  [string]$TargetPath = "C:/Users/Admin/Documents/sdcorejs/sdcorejs-angular"
)

$ErrorActionPreference = "Stop"

if (!(Test-Path -LiteralPath $SourcePath)) {
  throw "SourcePath not found: $SourcePath"
}
if (!(Test-Path -LiteralPath $TargetPath)) {
  throw "TargetPath not found: $TargetPath"
}

function Update-RootTsConfig {
  param(
    [string]$TsConfigPath
  )

  if (!(Test-Path -LiteralPath $TsConfigPath)) {
    return
  }

  $content = Get-Content -LiteralPath $TsConfigPath -Raw
  $updated = $content

  $updated = $updated -replace '"@sdcorejs/angular":\s*\["dist/sdcorejs-angular"\]', '"@sdcorejs/angular": ["./dist/sdcorejs-angular"]'
  $updated = $updated -replace '"@sdcorejs/angular/\*":\s*\["dist/sdcorejs-angular/\*",\s*"projects/sdcorejs-angular/\*"\]', '"@sdcorejs/angular/*": ["./dist/sdcorejs-angular/*", "./projects/sdcorejs-angular/*"]'
  $updated = $updated -replace '\s*"baseUrl"\s*:\s*"\.\/",\r?\n', ''
  $updated = $updated -replace '\s*"ignoreDeprecations"\s*:\s*"[^"]+",\r?\n', ''

  if ($updated -ne $content) {
    Set-Content -LiteralPath $TsConfigPath -Value $updated -Encoding UTF8
  }
}

Write-Host "[1/5] Mirror copy source -> target" -ForegroundColor Cyan
robocopy $SourcePath $TargetPath /MIR /XD .git node_modules dist .angular coverage versions scripts /R:1 /W:1 /NFL /NDL /NP | Out-Null

Write-Host "[2/5] Normalize library folder sd-angular -> sdcorejs-angular" -ForegroundColor Cyan
$legacyLibPath = Join-Path $TargetPath "projects/sd-angular"
$targetLibPath = Join-Path $TargetPath "projects/sdcorejs-angular"
if (Test-Path -LiteralPath $legacyLibPath) {
  if (!(Test-Path -LiteralPath $targetLibPath)) {
    New-Item -ItemType Directory -Path $targetLibPath | Out-Null
  }

  robocopy $legacyLibPath $targetLibPath /MIR /R:1 /W:1 /NFL /NDL /NP | Out-Null

  try {
    Remove-Item -LiteralPath $legacyLibPath -Recurse -Force
  }
  catch {
    Write-Warning "Could not remove legacy library folder after copy: $legacyLibPath"
  }
}

Write-Host "[3/5] Replace legacy namespace and project references" -ForegroundColor Cyan
$extensions = @("*.ts","*.tsx","*.js","*.jsx","*.mjs","*.cjs","*.json","*.md","*.scss","*.css","*.html","*.yml","*.yaml","*.txt","*.xml")
$files = Get-ChildItem -Path $TargetPath -Recurse -File -Include $extensions |
  Where-Object {
    $_.FullName -notmatch "\\.git\\|\\node_modules\\|\\dist\\|\\.angular\\|\\coverage\\|\\versions\\"
  }

$modified = 0
foreach ($file in $files) {
  $content = Get-Content -LiteralPath $file.FullName -Raw
  $newContent = $content

  $newContent = $newContent -replace [regex]::Escape("@sd-angular/core"), "@sdcorejs/angular"
  $newContent = $newContent -replace [regex]::Escape("projects/sd-angular"), "projects/sdcorejs-angular"
  $newContent = $newContent -replace [regex]::Escape("dist/sd-angular"), "dist/sdcorejs-angular"
  $newContent = $newContent -replace [regex]::Escape("ng build sd-angular"), "ng build sdcorejs-angular"
  $newContent = $newContent -replace [regex]::Escape("ng test sd-angular"), "ng test sdcorejs-angular"
  $newContent = $newContent -replace '"sd-angular"\s*:\s*\{', '"sdcorejs-angular": {'

  if ($newContent -ne $content) {
    Set-Content -LiteralPath $file.FullName -Value $newContent -Encoding UTF8
    $modified++
  }
}

Write-Host "[4/5] Capture source commit and patch package.json" -ForegroundColor Cyan

$commitId = (git -C $SourcePath rev-parse --short HEAD 2>$null).Trim()
if (!$commitId) { $commitId = "unknown" }
Write-Host "    Source commit: $commitId" -ForegroundColor DarkGray

$rootPackagePath = Join-Path $TargetPath "package.json"
if (Test-Path -LiteralPath $rootPackagePath) {
  $package = Get-Content -LiteralPath $rootPackagePath -Raw | ConvertFrom-Json
  $needsWrite = $false

  if ($package.name -ne "sdcorejs-angular") {
    $package.name = "sdcorejs-angular"
    $needsWrite = $true
  }

  if ($null -eq $package.scripts."mv:sync") {
    $package.scripts | Add-Member -NotePropertyName "mv:sync" -NotePropertyValue "powershell -ExecutionPolicy Bypass -File ./scripts/sync-multi-version-workspaces.ps1"
    $needsWrite = $true
  }

  if ($needsWrite) {
    $jsonStr = $package | ConvertTo-Json -Depth 100
    # PowerShell 5.x escapes non-ASCII and special chars as \uXXXX – unescape them back
    $jsonStr = $jsonStr -replace '\\u0026', '&' `
                        -replace '\\u003c', '<' `
                        -replace '\\u003e', '>' `
                        -replace '\\u0027', "'" `
                        -replace '\\u2019', [char]0x2019 `
                        -replace '\\u201c', [char]0x201c `
                        -replace '\\u201d', [char]0x201d
    Set-Content -LiteralPath $rootPackagePath -Value $jsonStr -Encoding UTF8
  }
}

$rootTsConfigPath = Join-Path $TargetPath "tsconfig.json"
Update-RootTsConfig -TsConfigPath $rootTsConfigPath

Write-Host "[5/5] Rollout to v19 (primary) then v20, v21..." -ForegroundColor Cyan
$multiVersionScript = Join-Path $PSScriptRoot "sync-multi-version-workspaces.ps1"
& $multiVersionScript -RootPath $TargetPath -CommitId $commitId

Write-Host "All done. Synced vn-angular@$commitId -> sdcorejs-angular -> v19/v20/v21. Modified files: $modified" -ForegroundColor Green
