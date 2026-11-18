$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$Shortcut = $WshShell.CreateShortcut("$DesktopPath\Steve's Massage Parlour.lnk")
$Shortcut.TargetPath = "C:\Users\HomePC\Downloads\steves_massage\start_system.bat"
$Shortcut.WorkingDirectory = "C:\Users\HomePC\Downloads\steves_massage"
$Shortcut.Description = "Steve's Massage Parlour Management System"
$Shortcut.Save()
Write-Host "Created shortcut at $DesktopPath\Steve's Massage Parlour.lnk"
