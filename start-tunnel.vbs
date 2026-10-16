Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c ""ngrok http 3000 --domain=flatbed-carve-imprint.ngrok-free.dev""", 0, False
