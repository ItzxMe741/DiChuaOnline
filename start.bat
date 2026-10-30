@echo off
chcp 65001 > nul
echo ===================================================
echo     CHUA AN LAC 3D - GAME DI CHUA ONLINE MULTIPLAYER
echo ===================================================
echo Dang khoi dong may chu tai http://localhost:8000 ...
start http://localhost:8000
python server.py
pause
