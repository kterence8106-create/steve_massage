Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\Users\HomePC\Downloads\steves_massage"
WshShell.Run "cmd /c start_system.bat", 0, False
