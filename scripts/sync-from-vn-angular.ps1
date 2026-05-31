param(
  [string]$SourcePath = "C:/Users/Admin/Documents/lib-core-angular/vn-angular",
  [string]$TargetPath = "C:/Users/Admin/Documents/sdcorejs/sdcorejs-angular"
)

$ErrorActionPreference = "Stop"

# why: PS 5.1 `Set-Content -Encoding UTF8` ghi BOM; vn-angular source KHÔNG có BOM →
# round-trip read/write làm git diff churn + file format inconsistent. Helper dưới ghi
# UTF-8 không BOM. Tất cả Set-Content trong script này phải đi qua helper này.
# Đồng thời `Get-Content -Raw` MẶC ĐỊNH dùng ANSI cp1252 trên PS 5.1 (Windows VN locale)
# → đọc Vietnamese UTF-8 bytes sai → mojibake. Mọi Get-Content -Raw PHẢI có -Encoding UTF8.
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
function Write-Utf8NoBom {
  param([string]$Path, [string]$Content)
  [System.IO.File]::WriteAllText($Path, $Content, $script:Utf8NoBom)
}

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

  $content = Get-Content -LiteralPath $TsConfigPath -Raw -Encoding UTF8
  $updated = $content

  $updated = $updated -replace '"@sdcorejs/angular":\s*\["dist/sdcorejs-angular"\]', '"@sdcorejs/angular": ["./dist/sdcorejs-angular"]'
  $updated = $updated -replace '"@sdcorejs/angular/\*":\s*\["dist/sdcorejs-angular/\*",\s*"projects/sdcorejs-angular/\*"\]', '"@sdcorejs/angular/*": ["./dist/sdcorejs-angular/*", "./projects/sdcorejs-angular/*"]'
  $updated = $updated -replace '\s*"baseUrl"\s*:\s*"\.\/",\r?\n', ''
  $updated = $updated -replace '\s*"ignoreDeprecations"\s*:\s*"[^"]+",\r?\n', ''

  if ($updated -ne $content) {
    Write-Utf8NoBom -Path $TsConfigPath -Content $updated
  }
}

function Update-AngularJson {
  param(
    [string]$AngularJsonPath
  )

  if (!(Test-Path -LiteralPath $AngularJsonPath)) {
    return
  }

  try {
    $content = Get-Content -LiteralPath $AngularJsonPath -Raw -Encoding UTF8
    $json = ConvertFrom-Json $content
    if ($json.projects.demo) {
      $json.projects.PSObject.Properties.Remove('demo')
      $updated = $json | ConvertTo-Json -Depth 100
      $updated = $updated -replace '\\u0026', '&' `
                          -replace '\\u003c', '<' `
                          -replace '\\u003e', '>' `
                          -replace '\\u0027', "'" `
                          -replace '\\u2019', [char]0x2019 `
                          -replace '\\u201c', [char]0x201c `
                          -replace '\\u201d', [char]0x201d
      Write-Utf8NoBom -Path $AngularJsonPath -Content $updated
      Write-Host "    Successfully removed 'demo' project from angular.json" -ForegroundColor Green
    }
  }
  catch {
    Write-Warning "Could not parse or update angular.json at $AngularJsonPath"
  }
}

function Update-ChartInputSignalAnnotations {
  param(
    [string]$RootPath
  )

  $chartTypes = @("bar", "line", "pie", "doughnut")

  foreach ($chartType in $chartTypes) {
    $filePath = Join-Path $RootPath "projects/sdcorejs-angular/components/chart/src/$chartType-chart.component.ts"
    if (!(Test-Path -LiteralPath $filePath)) {
      continue
    }

    $content = Get-Content -LiteralPath $filePath -Raw -Encoding UTF8
    $updated = $content

    if ($updated -notmatch "\bInputSignal\b") {
      $updated = $updated -replace "ElementRef, ", "ElementRef, InputSignal, "
    }

    $updated = $updated -replace "data = input\.required<ChartData<'$chartType'>>\(\);", "data: InputSignal<ChartData<'$chartType'>> = input.required<ChartData<'$chartType'>>();"
    $updated = $updated -replace "options = input<ChartOptions<'$chartType'>>\(\);", "options: InputSignal<ChartOptions<'$chartType'> | undefined> = input<ChartOptions<'$chartType'>>();"
    $updated = $updated -replace "plugins = input<Plugin<'$chartType'>\[\]>\(\[\]\);", "plugins: InputSignal<Plugin<'$chartType'>[]> = input<Plugin<'$chartType'>[]>([]);"

    if ($updated -ne $content) {
      Write-Utf8NoBom -Path $filePath -Content $updated
    }
  }
}

$v19Path = Join-Path $TargetPath "versions/v19"
if (!(Test-Path -LiteralPath $v19Path)) {
  New-Item -ItemType Directory -Path $v19Path | Out-Null
}

Write-Host "[1/5] Mirror copy source -> target v19 workspace" -ForegroundColor Cyan
robocopy $SourcePath $v19Path /MIR /XD .git node_modules dist .angular coverage versions scripts demo /R:1 /W:1 /NFL /NDL /NP | Out-Null

# Clean up projects/demo inside v19 if it was not caught by robocopy
$v19DemoPath = Join-Path $v19Path "projects/demo"
if (Test-Path -LiteralPath $v19DemoPath) {
  Remove-Item -LiteralPath $v19DemoPath -Recurse -Force | Out-Null
}

Write-Host "[2/5] Normalize library folder sd-angular -> sdcorejs-angular in v19" -ForegroundColor Cyan
$legacyLibPath = Join-Path $v19Path "projects/sd-angular"
$targetLibPath = Join-Path $v19Path "projects/sdcorejs-angular"
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

Write-Host "[3/5] Replace legacy namespace and project references in v19" -ForegroundColor Cyan
$extensions = @("*.ts","*.tsx","*.js","*.jsx","*.mjs","*.cjs","*.json","*.md","*.scss","*.css","*.html","*.yml","*.yaml","*.txt","*.xml")
$files = Get-ChildItem -Path $v19Path -Recurse -File -Include $extensions |
  Where-Object {
    $_.FullName -notmatch "\\.git\\|\\node_modules\\|\\dist\\|\\.angular\\|\\coverage\\"
  }

$modified = 0
foreach ($file in $files) {
  $content = Get-Content -LiteralPath $file.FullName -Raw -Encoding UTF8
  $newContent = $content

  $newContent = $newContent -replace [regex]::Escape("@sd-angular/core"), "@sdcorejs/angular"
  $newContent = $newContent -replace [regex]::Escape("projects/sd-angular"), "projects/sdcorejs-angular"
  $newContent = $newContent -replace [regex]::Escape("dist/sd-angular"), "dist/sdcorejs-angular"
  $newContent = $newContent -replace [regex]::Escape("ng build sd-angular"), "ng build sdcorejs-angular"
  $newContent = $newContent -replace [regex]::Escape("ng test sd-angular"), "ng test sdcorejs-angular"
  $newContent = $newContent -replace '"sd-angular"\s*:\s*\{', '"sdcorejs-angular": {'

  if ($newContent -ne $content) {
    Write-Utf8NoBom -Path $file.FullName -Content $newContent
    $modified++
  }
}

Write-Host "[4/5] Capture source commit and patch v19 configuration" -ForegroundColor Cyan

$commitId = (git -C $SourcePath rev-parse --short HEAD 2>$null).Trim()
if (!$commitId) { $commitId = "unknown" }
Write-Host "    Source commit: $commitId" -ForegroundColor DarkGray

# Remove demo from v19 angular.json
Update-AngularJson -AngularJsonPath (Join-Path $v19Path "angular.json")

# Update package.json in v19 to remove start demo and use build:watch
$v19PackagePath = Join-Path $v19Path "package.json"
if (Test-Path -LiteralPath $v19PackagePath) {
  $package = Get-Content -LiteralPath $v19PackagePath -Raw -Encoding UTF8 | ConvertFrom-Json
  $needsWrite = $false

  if ($package.name -ne "sdcorejs-angular") {
    $package.name = "sdcorejs-angular"
    $needsWrite = $true
  }

  if ($package.scripts.start -eq "ng serve demo") {
    $package.scripts.start = "ng build sdcorejs-angular --watch"
    $needsWrite = $true
  }

  if ($package.scripts.prebuild) {
    # remove prebuild as we do not run tests before build
    $package.scripts.PSObject.Properties.Remove('prebuild')
    $needsWrite = $true
  }

  if ($needsWrite) {
    $jsonStr = $package | ConvertTo-Json -Depth 100
    $jsonStr = $jsonStr -replace '\\u0026', '&' `
                        -replace '\\u003c', '<' `
                        -replace '\\u003e', '>' `
                        -replace '\\u0027', "'" `
                        -replace '\\u2019', [char]0x2019 `
                        -replace '\\u201c', [char]0x201c `
                        -replace '\\u201d', [char]0x201d
    Write-Utf8NoBom -Path $v19PackagePath -Content $jsonStr
  }
}

$v19TsConfigPath = Join-Path $v19Path "tsconfig.json"
Update-RootTsConfig -TsConfigPath $v19TsConfigPath
Update-ChartInputSignalAnnotations -RootPath $v19Path

Write-Host "[5/5] Rollout to v20, v21 based on v19 workspace" -ForegroundColor Cyan
$multiVersionScript = Join-Path $PSScriptRoot "sync-multi-version-workspaces.ps1"
& $multiVersionScript -RootPath $TargetPath -CommitId $commitId

# Git commit in target workspace
Write-Host "Creating git commit in target repository..." -ForegroundColor Cyan
git -C $TargetPath add -A
$hasChanges = (git -C $TargetPath status --porcelain 2>$null)
if ($hasChanges) {
  $commitMsg = "Sync with vn-angular@$commitId (standardized monorepo, demo removed)"
  git -C $TargetPath commit -m $commitMsg
  Write-Host "Committed changes: $commitMsg" -ForegroundColor Green
} else {
  Write-Host "No changes detected. Workspace is clean and up to date." -ForegroundColor Yellow
}

Write-Host "All done. Synced vn-angular@$commitId -> versions/v19 -> v20/v21. Reorganized monorepo structure." -ForegroundColor Green
