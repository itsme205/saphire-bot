@echo off
call npm install
call npm run build
call node dist/index.js
pause