$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.IO.Compression
$projectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$releaseDir = Join-Path $projectRoot 'releases'
New-Item -ItemType Directory -Path $releaseDir -Force | Out-Null
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$archivePath = Join-Path $releaseDir "sanctum-netlify-$stamp.zip"
$entries = @('src', 'public', 'docs', 'scripts', 'tests', 'package.json', 'package-lock.json', 'next.config.ts', 'netlify.toml', 'tsconfig.json', 'eslint.config.mjs', 'postcss.config.mjs', '.env.example', '.nvmrc', '.gitignore', 'README.md', 'AGENTS.md', 'CLAUDE.md', 'REGISTRO.md', 'PRODUCT.md')
$archive = [System.IO.Compression.ZipFile]::Open($archivePath, [System.IO.Compression.ZipArchiveMode]::Create)
try {
  foreach ($entry in $entries) {
    $target = Join-Path $projectRoot $entry
    if (-not (Test-Path -LiteralPath $target)) { throw "Arquivo obrigatório ausente: $entry" }
    $item = Get-Item -LiteralPath $target
    $files = if ($item.PSIsContainer) { Get-ChildItem -LiteralPath $target -File -Recurse } else { @($item) }
    foreach ($file in $files) {
      $relative = $file.FullName.Substring($projectRoot.Length + 1).Replace('\', '/')
      if ($relative -match '(^|/)(data|backups|releases|node_modules|\.next|\.git)/' -or ($file.Name -like '.env*' -and $file.Name -ne '.env.example') -or $file.Extension -in @('.db', '.sqlite', '.pem')) { throw "Arquivo sensível recusado: $relative" }
      [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $file.FullName, $relative, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
    }
  }
} finally { $archive.Dispose() }
$hash = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash.ToLower()
Write-Output "Pacote: $archivePath"
Write-Output "SHA256: $hash"
