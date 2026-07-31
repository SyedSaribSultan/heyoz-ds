# push-to-github.ps1
#
# Fixes the jammed git repo and publishes this folder to GitHub as heyoz-ds.
# Run once, in PowerShell, from inside C:\Users\sarib\Downloads\heyoz-ds
#
#   cd C:\Users\sarib\Downloads\heyoz-ds
#   .\push-to-github.ps1
#
# If PowerShell refuses to run it:
#   powershell -ExecutionPolicy Bypass -File .\push-to-github.ps1
#
# Delete this file afterwards. It is one-time scaffolding.

$ErrorActionPreference = 'Stop'

# --- 0. sanity: are we in the right folder? --------------------------------
if (-not (Test-Path 'build\spec.mjs')) {
    throw "Run this from inside the heyoz-ds folder (build\spec.mjs not found here)."
}
if (-not (Test-Path 'git-history')) {
    if (Test-Path '.git') {
        Write-Host "git-history/ is gone and .git exists - the rename already happened. Skipping to step 3." -ForegroundColor Yellow
        $alreadyRenamed = $true
    } else {
        throw "Neither git-history/ nor .git found. Nothing to activate."
    }
}

# --- 1. swap the jammed stub for the real history --------------------------
# Order matters: park the stub before touching git-history, so the real
# history is never the only thing at risk if a step fails.
if (-not $alreadyRenamed) {
    Write-Host "`n[1/6] Activating the real git history..." -ForegroundColor Cyan

    if (Test-Path '.git') {
        if (Test-Path '.git-jammed') { Remove-Item -Recurse -Force '.git-jammed' }
        Rename-Item '.git' '.git-jammed'
    }
    Rename-Item 'git-history' '.git'
    if (Test-Path '.git-jammed') { Remove-Item -Recurse -Force '.git-jammed' }

    # The jammed stub left empty lock files behind; make sure none came across.
    Remove-Item '.git\*.lock' -Force -ErrorAction SilentlyContinue

    git config core.fileMode false
}

# --- 2. verify we got the right repo ---------------------------------------
Write-Host "`n[2/6] Verifying history..." -ForegroundColor Cyan
$count = (git rev-list --count HEAD)
Write-Host "  commits on HEAD: $count  (expect 12)"
if ([int]$count -lt 12) { throw "Expected 12 commits, found $count. Stopping before anything is pushed." }
git log --oneline -3

# --- 3. master -> main ------------------------------------------------------
Write-Host "`n[3/6] Renaming branch to main..." -ForegroundColor Cyan
$branch = (git rev-parse --abbrev-ref HEAD)
if ($branch -eq 'master') { git branch -m master main } else { Write-Host "  already on '$branch'" }
git config init.defaultBranch main

# --- 4. retire the one-time scaffolding ------------------------------------
# GIT-SETUP.md describes the rename that just happened, and says to delete it.
# .gitignore's git-history/ line no longer matches anything (already removed).
Write-Host "`n[4/6] Committing housekeeping..." -ForegroundColor Cyan
if (Test-Path 'GIT-SETUP.md') { git rm --quiet GIT-SETUP.md }
git add -A
if ((git diff --cached --name-only).Length -gt 0) {
    git commit --quiet -m @"
Activate git history; retire the rename scaffolding

The history lived in git-history/ because the authoring mount blocked file
deletion and git removes a lock file on every operation, which jammed the
first git init. Renamed to .git on Windows, where that restriction does not
apply, and dropped GIT-SETUP.md (which described this step) and the now-dead
git-history/ ignore line. Branch renamed master -> main.

reports/audit.json and test/index.html carry a new generatedAt only; the
build is deterministic apart from that timestamp.
"@
    Write-Host "  committed."
} else {
    Write-Host "  nothing to commit."
}

# --- 5. confirm the build still passes before publishing -------------------
Write-Host "`n[5/6] Running the build as the test suite..." -ForegroundColor Cyan
node build\build.mjs
if ($LASTEXITCODE -ne 0) { throw "Build failed - not pushing. Fix the gate it printed first." }
# The build rewrites generated files; absorb any timestamp churn it just made.
if ((git status --porcelain).Length -gt 0) {
    git add -A
    git commit --quiet -m "Rebuild generated artifacts"
}

# --- 6. create the repo and push -------------------------------------------
Write-Host "`n[6/6] Creating github.com/<you>/heyoz-ds and pushing..." -ForegroundColor Cyan
gh auth status
if (-not (git remote | Select-String -Quiet '^origin$')) {
    gh repo create heyoz-ds --public --source . --remote origin --push `
        --description "HeyOz design tokens. Colours authored in OKLCH and computed; Figma JSON and app CSS generated from two source files."
} else {
    Write-Host "  origin already exists - pushing to it instead."
    git push -u origin main
}

git branch --set-upstream-to=origin/main main 2>$null

Write-Host "`nDone." -ForegroundColor Green
Write-Host "  local  : $(git rev-parse --short HEAD) on $(git rev-parse --abbrev-ref HEAD)"
Write-Host "  remote : $(git remote get-url origin)"
Write-Host "`nOpen it:  gh repo view --web"
Write-Host "Then delete this script and GIT-SETUP.md is already gone."
