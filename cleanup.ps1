# Cleanup script for dadlaga project

# Remove backup and unnecessary files
Write-Host "Removing backup files..." -ForegroundColor Green
Remove-Item -Path ".\components\Map.js.bak" -Force -ErrorAction SilentlyContinue
Remove-Item -Path ".\components\Map.js.new" -Force -ErrorAction SilentlyContinue

# Remove unnecessary API endpoints
Write-Host "Removing unnecessary API endpoints..." -ForegroundColor Green
Remove-Item -Path ".\pages\api\serve-kml\[...path].js" -Force -ErrorAction SilentlyContinue
Remove-Item -Path ".\pages\api\kml-files.js" -Force -ErrorAction SilentlyContinue
Remove-Item -Path ".\pages\api\serve-kml" -Force -Recurse -ErrorAction SilentlyContinue

# Optional cleanup - uncomment if you want to remove these
# Write-Host "Performing optional cleanup..." -ForegroundColor Yellow
# Remove-Item -Path ".\khoroo2021.rar" -Force -ErrorAction SilentlyContinue
# Remove-Item -Path ".\khoroo2021" -Force -Recurse -ErrorAction SilentlyContinue

Write-Host "Project cleanup complete!" -ForegroundColor Green
Write-Host "NOTE: The following items were kept as they may be needed:" -ForegroundColor Cyan
Write-Host "- public/khoroo2021 directory (KML files for the application)" -ForegroundColor Cyan
Write-Host "- my-mongoose-app (backend server with user authentication)" -ForegroundColor Cyan
Write-Host "- compare-kml.js API endpoint (useful for debugging)" -ForegroundColor Cyan

Write-Host "`nIf you're sure you don't need these, you can manually remove them." -ForegroundColor Yellow
