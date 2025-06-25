$mongooseApp = Start-Process powershell -ArgumentList "-Command cd C:\Users\user\dadlaga\my-mongoose-app && npm run start" -PassThru

Write-Host "MongoDB Mongoose server started on port 3001"
Write-Host "Waiting 5 seconds for server to start up..."
Start-Sleep -Seconds 5

Write-Host "Seeding sample data..."
Start-Process powershell -ArgumentList "-Command cd C:\Users\user\dadlaga && npm run seedsample" -Wait -NoNewWindow

Write-Host "Data seeding completed!"
Write-Host "Press any key to stop the server and exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

if (!$mongooseApp.HasExited) { Stop-Process -Id $mongooseApp.Id -Force }
Write-Host "Server stopped"
