@echo off
echo ========================================
echo    Kanban Board PDF Generator
echo ========================================
echo.

echo Starting PDF generation...
echo.

REM Check if PHP is available
php --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: PHP is not installed or not in PATH
    echo Please install PHP and try again.
    pause
    exit /b 1
)

REM Run the PDF generator
php generate_pdf.php

echo.
echo ========================================
echo PDF generation completed!
echo ========================================
echo.

REM Check if PDF was created
if exist "Kanban_Board_Documentation.pdf" (
    echo ✅ PDF file created successfully!
    echo 📄 File: Kanban_Board_Documentation.pdf
    echo 📏 Size: 
    for %%A in ("Kanban_Board_Documentation.pdf") do echo    %%~zA bytes
    echo.
    echo 🚀 Opening PDF file...
    start "" "Kanban_Board_Documentation.pdf"
) else if exist "Kanban_Board_Documentation.html" (
    echo ⚠️  HTML file created (PDF generation requires additional tools)
    echo 📄 File: Kanban_Board_Documentation.html
    echo.
    echo 💡 To convert to PDF:
    echo    1. Open the HTML file in your browser
    echo    2. Press Ctrl+P to print
    echo    3. Select "Save as PDF" as destination
    echo.
    echo 🚀 Opening HTML file...
    start "" "Kanban_Board_Documentation.html"
) else (
    echo ❌ No output file was created
    echo Please check the error messages above.
)

echo.
pause
