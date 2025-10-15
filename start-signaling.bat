@echo off
echo 🚀 Iniciando servidor de signaling para WebRTC...
echo.
echo Instalando dependencias...
npm install express socket.io

echo.
echo Iniciando servidor en puerto 3000...
node signaling-server.js

pause
