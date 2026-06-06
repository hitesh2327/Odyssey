Write-Host "Initializing Git in monorepo root..."
git -C .. init

# Create a standard .gitignore in the root directory if it doesn't exist
$gitignorePath = "../.gitignore"
if (-not (Test-Path $gitignorePath)) {
    Set-Content -Path $gitignorePath -Value @"
node_modules/
dist/
.env
*.log
.system_generated/
.gemini/
"@
}

Write-Host "Setting remote origin..."
git -C .. remote remove origin 2>$null
git -C .. remote add origin git@github.com:hitesh2327/Odyssey.git

Write-Host "Staging files..."
git -C .. add -A

Write-Host "Creating commit..."
git -C .. commit -m "feat: implement AI Interview Platform backend with Auth, Topics, and Sessions Question Flow"

Write-Host "Pushing to main branch..."
git -C .. branch -M main
git -C .. push -u origin main --force

Write-Host "Creating and pushing to develop branch..."
git -C .. checkout -b develop 2>$null || git -C .. checkout develop
git -C .. push -u origin develop --force

Write-Host "Git push complete!"
