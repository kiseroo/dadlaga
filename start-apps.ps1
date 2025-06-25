$mongooseApp = Start-Process powershell -ArgumentList "-Command cd C:\Users\user\dadlaga\my-mongoose-app && npm run start" -PassThru
$nextApp = Start-Process powershell -ArgumentList "-Command cd C:\Users\user\dadlaga && npm run dev" -PassThru

Write-Host "MongoDB Mongoose server started on port 3001"
Write-Host "Next.js frontend started on port 3000"
Write-Host "Press Ctrl+C to stop both servers"

try {
    Wait-Process -Id $mongooseApp.Id, $nextApp.Id -ErrorAction SilentlyContinue
} finally {
    if (!$mongooseApp.HasExited) { Stop-Process -Id $mongooseApp.Id -Force }
    if (!$nextApp.HasExited) { Stop-Process -Id $nextApp.Id -Force }
    Write-Host "All servers stopped"
}
