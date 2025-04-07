@echo off
setlocal EnableDelayedExpansion

:: Set configuration file path
set "STORAGE_FILE=%APPDATA%\Cursor\User\globalStorage\storage.json"

echo Starting script...
echo Target file path: %STORAGE_FILE%

:: Generate random IDs in correct format
:: Generate machineId (40-character hex)
powershell -Command "$bytes = New-Object Byte[] 32; (New-Object Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes); -join ($bytes | ForEach-Object { $_.ToString('x2') })" > "%TEMP%\guid1.txt"
if errorlevel 1 goto :error
set /p NEW_MACHINE_ID=<"%TEMP%\guid1.txt"

:: Generate macMachineId (40-character hex)
powershell -Command "$bytes = New-Object Byte[] 32; (New-Object Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes); -join ($bytes | ForEach-Object { $_.ToString('x2') })" > "%TEMP%\guid2.txt"
if errorlevel 1 goto :error
set /p NEW_MAC_MACHINE_ID=<"%TEMP%\guid2.txt"

:: Generate sqmId (UUID with braces)
powershell -Command "$guid = [guid]::NewGuid(); '{' + $guid.ToString().ToUpper() + '}'" > "%TEMP%\guid3.txt"
if errorlevel 1 goto :error
set /p NEW_SQM_ID=<"%TEMP%\guid3.txt"

:: Generate devDeviceId (standard UUID)
powershell -Command "[guid]::NewGuid().ToString()" > "%TEMP%\guid4.txt"
if errorlevel 1 goto :error
set /p NEW_DEV_DEVICE_ID=<"%TEMP%\guid4.txt"

:: Clean up temporary files
del "%TEMP%\guid1.txt" "%TEMP%\guid2.txt" "%TEMP%\guid3.txt" "%TEMP%\guid4.txt"

:: Create backup
if exist "%STORAGE_FILE%" (
    copy "%STORAGE_FILE%" "%STORAGE_FILE%.backup_%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%" >nul
)

:: Create and execute update script
(
    echo $ErrorActionPreference = 'Stop'
    echo try {
    echo     $json = Get-Content '%STORAGE_FILE%' -Raw
    echo     $json = $json -replace '"telemetry\.machineId"\s*:\s*"[^"]*"', '"telemetry.machineId": "%NEW_MACHINE_ID%"'
    echo     $json = $json -replace '"telemetry\.macMachineId"\s*:\s*"[^"]*"', '"telemetry.macMachineId": "%NEW_MAC_MACHINE_ID%"'
    echo     $json = $json -replace '"telemetry\.sqmId"\s*:\s*"[^"]*"', '"telemetry.sqmId": "%NEW_SQM_ID%"'
    echo     $json = $json -replace '"telemetry\.devDeviceId"\s*:\s*"[^"]*"', '"telemetry.devDeviceId": "%NEW_DEV_DEVICE_ID%"'
    echo     $json ^| Set-Content '%STORAGE_FILE%' -NoNewline
    echo } catch {
    echo     Write-Host "Error: $($_.Exception.Message)"
    echo     exit 1
    echo }
) > "%TEMP%\update_json.ps1"

powershell -ExecutionPolicy Bypass -File "%TEMP%\update_json.ps1"
if errorlevel 1 (
    del "%TEMP%\update_json.ps1"
    goto :error
)

del "%TEMP%\update_json.ps1"

echo Operation completed successfully!
goto :end

:error
echo Script execution error!
echo Please make sure Cursor editor is closed and you have sufficient file access permissions.

:end
pause