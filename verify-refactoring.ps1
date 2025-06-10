# Verify refactoring to use only public/khoroo2021
# This script checks if all references to the root khoroo2021 directory have been removed

Write-Host "Verifying KML directory refactoring..." -ForegroundColor Green

# Function to check if a string is found in a file
function Find-InFile {
    param(
        [string]$Path,
        [string]$Pattern
    )
    
    $content = Get-Content -Path $Path -ErrorAction SilentlyContinue
    if ($content -match $Pattern) {
        return $true
    }
    return $false
}

# Check API endpoints for root khoroo2021 references
$apiDir = ".\pages\api"
$apiFiles = Get-ChildItem -Path $apiDir -Filter "*.js" -Recurse

$hasReferences = $false

foreach ($file in $apiFiles) {
    $content = Get-Content -Path $file.FullName -Raw
    
    # Look for direct references to root khoroo2021 directory
    if ($content -match "path\.join\(\s*(?:process\.cwd\(\)|__dirname),\s*['\"]khoroo2021['\"]") {
        Write-Host "Found reference to root khoroo2021 directory in $($file.Name)" -ForegroundColor Red
        $hasReferences = $true
    }
}

# Check all JavaScript files in the project
$jsFiles = Get-ChildItem -Path "." -Filter "*.js" -Recurse -Exclude "node_modules"

foreach ($file in $jsFiles) {
    $content = Get-Content -Path $file.FullName -Raw
    
    # Look for other patterns that might indicate usage of the root directory
    if ($content -match "khoroo2021(?!/)" -and $content -notmatch "public/khoroo2021" -and $content -notmatch "public[\\\/]khoroo2021") {
        Write-Host "Potential reference to root khoroo2021 directory in $($file.Name)" -ForegroundColor Yellow
        $hasReferences = $true
    }
}

if ($hasReferences) {
    Write-Host "`nFound references to the root khoroo2021 directory. Please check the files listed above." -ForegroundColor Red
} else {
    Write-Host "`nNo references to the root khoroo2021 directory found. Refactoring is complete!" -ForegroundColor Green
    
    Write-Host "`nYou can now safely remove the root khoroo2021 directory if desired by uncommenting the line in cleanup.ps1" -ForegroundColor Cyan
    Write-Host "or by running:" -ForegroundColor Cyan
    Write-Host "Remove-Item -Path '.\khoroo2021' -Force -Recurse" -ForegroundColor Cyan
}
