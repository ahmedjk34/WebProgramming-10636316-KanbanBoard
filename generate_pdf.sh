#!/bin/bash

echo "========================================"
echo "   Kanban Board PDF Generator"
echo "========================================"
echo

echo "Starting PDF generation..."
echo

# Check if PHP is available
if ! command -v php &> /dev/null; then
    echo "ERROR: PHP is not installed or not in PATH"
    echo "Please install PHP and try again."
    exit 1
fi

# Run the PDF generator
php generate_pdf.php

echo
echo "========================================"
echo "PDF generation completed!"
echo "========================================"
echo

# Check if PDF was created
if [ -f "Kanban_Board_Documentation.pdf" ]; then
    echo "✅ PDF file created successfully!"
    echo "📄 File: Kanban_Board_Documentation.pdf"
    echo "📏 Size: $(du -h Kanban_Board_Documentation.pdf | cut -f1)"
    echo
    echo "🚀 Opening PDF file..."
    
    # Try to open PDF with default application
    if command -v xdg-open &> /dev/null; then
        xdg-open "Kanban_Board_Documentation.pdf"  # Linux
    elif command -v open &> /dev/null; then
        open "Kanban_Board_Documentation.pdf"       # macOS
    else
        echo "Please open the PDF file manually."
    fi
    
elif [ -f "Kanban_Board_Documentation.html" ]; then
    echo "⚠️  HTML file created (PDF generation requires additional tools)"
    echo "📄 File: Kanban_Board_Documentation.html"
    echo
    echo "💡 To convert to PDF:"
    echo "   1. Open the HTML file in your browser"
    echo "   2. Press Ctrl+P (or Cmd+P on Mac) to print"
    echo "   3. Select 'Save as PDF' as destination"
    echo
    echo "🚀 Opening HTML file..."
    
    # Try to open HTML with default browser
    if command -v xdg-open &> /dev/null; then
        xdg-open "Kanban_Board_Documentation.html"  # Linux
    elif command -v open &> /dev/null; then
        open "Kanban_Board_Documentation.html"       # macOS
    else
        echo "Please open the HTML file manually."
    fi
    
else
    echo "❌ No output file was created"
    echo "Please check the error messages above."
fi

echo
