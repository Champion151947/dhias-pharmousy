@echo off
start "API Server" cmd /k "cd /d D:\Pharmacy\api && node --watch src/server.js"
start "Web Server" cmd /k "cd /d D:\Pharmacy\web && npx vite --host"