@echo off
setlocal
cd /d "%~dp0"
title HALVETH PULSAR ROOT - ALLE GITHUB ZWEIGE
color 0B
echo.
echo     HALVETH // PULSAR ROOT
 echo     EIN WURZELPUNKT - ALLE REPOSITORIES - ALLE BRANCHES - ALLE TAGS
 echo.
where py >NUL 2>&1
if not errorlevel 1 (
    py -3 "%~dp0PULSAR_ONE_ROOT.py"
) else (
    where python >NUL 2>&1
    if errorlevel 1 (
        echo Python 3 ist nicht gefunden. Bitte Python installieren oder in PATH aufnehmen.
        pause
        exit /b 1
    )
    python "%~dp0PULSAR_ONE_ROOT.py"
)
set RESULT=%ERRORLEVEL%
if not "%RESULT%"=="0" (
    echo.
    echo Es gab ein Problem. Hinweis oben lesen.
    pause
)
exit /b %RESULT%
