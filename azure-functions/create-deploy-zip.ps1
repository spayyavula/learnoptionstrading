# Create deployment zip for Azure Functions
Set-Location $PSScriptRoot

# Remove old zip if exists
if (Test-Path deploy.zip) {
    Remove-Item deploy.zip -Force
}

# Create new zip with correct structure (compiled files at root)
$items = @('index.js', 'index.js.map', 'functions', 'lib', 'host.json', 'package.json', 'node_modules')
Compress-Archive -Path $items -DestinationPath deploy.zip -CompressionLevel Optimal

Write-Host "Created deploy.zip"
Get-Item deploy.zip | Select-Object Name, Length
