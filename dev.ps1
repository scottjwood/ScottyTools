# ScottyTools local dev — PowerShell entry point.
# Finds Git Bash and delegates to dev.sh so all Unix tooling works correctly.
# Usage: .\dev.ps1

$ErrorActionPreference = 'Stop'

# Common Git for Windows install locations
$candidates = @(
    (Get-Command bash -ErrorAction SilentlyContinue)?.Source,
    "$env:ProgramFiles\Git\bin\bash.exe",
    "${env:ProgramFiles(x86)}\Git\bin\bash.exe",
    "$env:LocalAppData\Programs\Git\bin\bash.exe"
) | Where-Object { $_ -and (Test-Path $_) }

if (-not $candidates) {
    Write-Error "Git Bash not found. Install Git for Windows: https://git-scm.com/download/win"
    exit 1
}

$bash = $candidates[0]
Write-Host "Using bash: $bash" -ForegroundColor DarkGray

# Run dev.sh via Git Bash (--login loads the bash profile so PATH is correct)
& $bash --login -c "cd '$(Get-Location -PsProvider FileSystem | Select-Object -ExpandProperty ProviderPath)' && bash dev.sh"
