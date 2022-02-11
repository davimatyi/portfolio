Write-Host "Building project..."
npm run build

Set-Location dist

Write-Host "Setting up repository..."
git init
git add -A
git commit -m 'deploy'

Write-Host "Pushing to github pages repo..."
git push -f https://github.com/davimatyi/davimatyi.github.io.git master

Write-Host "Removing git repo..."
Remove-Item -Recurse -Force .git

Set-Location ..

Write-Host "Done"