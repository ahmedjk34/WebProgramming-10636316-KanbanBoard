<?php
/**
 * PDF Generator for Kanban Board Project Documentation
 * Converts the comprehensive documentation to PDF format
 */

// Include TCPDF library (you may need to install it via Composer)
// require_once('vendor/autoload.php');

// For now, we'll create a simple HTML to PDF converter
// You can install TCPDF or mPDF for better PDF generation

class DocumentationPDFGenerator {
    
    private $content;
    private $outputFile;
    
    public function __construct($markdownFile, $outputFile = 'Kanban_Board_Documentation.pdf') {
        $this->content = file_get_contents($markdownFile);
        $this->outputFile = $outputFile;
    }
    
    /**
     * Convert Markdown to HTML
     */
    private function markdownToHtml($markdown) {
        // Basic markdown to HTML conversion
        $html = $markdown;
        
        // Headers
        $html = preg_replace('/^### (.*$)/m', '<h3>$1</h3>', $html);
        $html = preg_replace('/^## (.*$)/m', '<h2>$1</h2>', $html);
        $html = preg_replace('/^# (.*$)/m', '<h1>$1</h1>', $html);
        
        // Bold and italic
        $html = preg_replace('/\*\*(.*?)\*\*/', '<strong>$1</strong>', $html);
        $html = preg_replace('/\*(.*?)\*/', '<em>$1</em>', $html);
        
        // Code blocks
        $html = preg_replace('/```(\w+)?\n(.*?)\n```/s', '<pre><code class="$1">$2</code></pre>', $html);
        $html = preg_replace('/`(.*?)`/', '<code>$1</code>', $html);
        
        // Lists
        $html = preg_replace('/^\* (.*$)/m', '<li>$1</li>', $html);
        $html = preg_replace('/^- (.*$)/m', '<li>$1</li>', $html);
        
        // Links
        $html = preg_replace('/\[([^\]]+)\]\(([^)]+)\)/', '<a href="$2">$1</a>', $html);
        
        // Line breaks
        $html = str_replace("\n\n", '</p><p>', $html);
        $html = '<p>' . $html . '</p>';
        
        return $html;
    }
    
    /**
     * Generate HTML with CSS styling
     */
    private function generateStyledHTML() {
        $html = $this->markdownToHtml($this->content);
        
        $styledHTML = '
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Kanban Board Project Documentation</title>
            <style>
                body {
                    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f9f9f9;
                }
                
                .container {
                    background-color: white;
                    padding: 40px;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                
                h1 {
                    color: #2c3e50;
                    border-bottom: 3px solid #3498db;
                    padding-bottom: 10px;
                    margin-bottom: 30px;
                }
                
                h2 {
                    color: #34495e;
                    border-left: 4px solid #3498db;
                    padding-left: 15px;
                    margin-top: 40px;
                    margin-bottom: 20px;
                }
                
                h3 {
                    color: #2c3e50;
                    margin-top: 30px;
                    margin-bottom: 15px;
                }
                
                p {
                    margin-bottom: 15px;
                    text-align: justify;
                }
                
                code {
                    background-color: #f8f9fa;
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-family: "Courier New", monospace;
                    color: #e74c3c;
                }
                
                pre {
                    background-color: #f8f9fa;
                    padding: 15px;
                    border-radius: 5px;
                    overflow-x: auto;
                    border-left: 4px solid #3498db;
                }
                
                pre code {
                    background-color: transparent;
                    padding: 0;
                    color: #333;
                }
                
                ul, ol {
                    margin-bottom: 15px;
                    padding-left: 30px;
                }
                
                li {
                    margin-bottom: 8px;
                }
                
                a {
                    color: #3498db;
                    text-decoration: none;
                }
                
                a:hover {
                    text-decoration: underline;
                }
                
                .highlight {
                    background-color: #fff3cd;
                    padding: 15px;
                    border-radius: 5px;
                    border-left: 4px solid #ffc107;
                    margin: 20px 0;
                }
                
                .info-box {
                    background-color: #d1ecf1;
                    padding: 15px;
                    border-radius: 5px;
                    border-left: 4px solid #17a2b8;
                    margin: 20px 0;
                }
                
                .warning-box {
                    background-color: #f8d7da;
                    padding: 15px;
                    border-radius: 5px;
                    border-left: 4px solid #dc3545;
                    margin: 20px 0;
                }
                
                .success-box {
                    background-color: #d4edda;
                    padding: 15px;
                    border-radius: 5px;
                    border-left: 4px solid #28a745;
                    margin: 20px 0;
                }
                
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                }
                
                th, td {
                    border: 1px solid #ddd;
                    padding: 12px;
                    text-align: left;
                }
                
                th {
                    background-color: #f8f9fa;
                    font-weight: bold;
                }
                
                .footer {
                    margin-top: 50px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    text-align: center;
                    color: #666;
                    font-size: 0.9em;
                }
                
                @media print {
                    body {
                        background-color: white;
                        margin: 0;
                        padding: 20px;
                    }
                    
                    .container {
                        box-shadow: none;
                        padding: 0;
                    }
                    
                    h1, h2, h3 {
                        page-break-after: avoid;
                    }
                    
                    pre, .highlight, .info-box, .warning-box, .success-box {
                        page-break-inside: avoid;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                ' . $html . '
                
                <div class="footer">
                    <p><strong>Kanban Board Project Documentation</strong></p>
                    <p>Web Programming (10636316) - An-Najah National University</p>
                    <p>Generated on: ' . date('F j, Y') . '</p>
                    <p>Course Instructor: Dr. Sufyan Samara</p>
                </div>
            </div>
        </body>
        </html>';
        
        return $styledHTML;
    }
    
    /**
     * Generate PDF using wkhtmltopdf (if available)
     */
    public function generatePDF() {
        $html = $this->generateStyledHTML();
        $htmlFile = 'temp_documentation.html';
        
        // Save HTML file
        file_put_contents($htmlFile, $html);
        
        // Try to generate PDF using wkhtmltopdf
        $command = "wkhtmltopdf --page-size A4 --margin-top 20 --margin-bottom 20 --margin-left 20 --margin-right 20 --encoding UTF-8 $htmlFile {$this->outputFile}";
        
        $output = [];
        $returnCode = 0;
        
        exec($command, $output, $returnCode);
        
        // Clean up temporary HTML file
        unlink($htmlFile);
        
        if ($returnCode === 0 && file_exists($this->outputFile)) {
            return [
                'success' => true,
                'message' => "PDF generated successfully: {$this->outputFile}",
                'file' => $this->outputFile
            ];
        } else {
            // Fallback: return HTML file
            $htmlOutputFile = str_replace('.pdf', '.html', $this->outputFile);
            file_put_contents($htmlOutputFile, $html);
            
            return [
                'success' => false,
                'message' => "wkhtmltopdf not available. HTML file generated: {$htmlOutputFile}",
                'file' => $htmlOutputFile,
                'html' => $html
            ];
        }
    }
    
    /**
     * Generate PDF using TCPDF (if available)
     */
    public function generatePDFWithTCPDF() {
        // This would require TCPDF library to be installed
        // For now, we'll return the HTML version
        $html = $this->generateStyledHTML();
        $htmlOutputFile = str_replace('.pdf', '.html', $this->outputFile);
        file_put_contents($htmlOutputFile, $html);
        
        return [
            'success' => false,
            'message' => "TCPDF not available. HTML file generated: {$htmlOutputFile}",
            'file' => $htmlOutputFile,
            'html' => $html
        ];
    }
}

// Usage
if (php_sapi_name() === 'cli' || isset($_GET['generate'])) {
    $generator = new DocumentationPDFGenerator('Kanban_Board_Project_Documentation.md');
    $result = $generator->generatePDF();
    
    if ($result['success']) {
        echo "✅ PDF generated successfully!\n";
        echo "📄 File: " . $result['file'] . "\n";
        echo "📏 Size: " . number_format(filesize($result['file']) / 1024, 2) . " KB\n";
    } else {
        echo "⚠️  " . $result['message'] . "\n";
        echo "📄 HTML file available: " . $result['file'] . "\n";
        echo "💡 You can convert the HTML to PDF using your browser's print function.\n";
    }
}

// Web interface
if (!isset($_GET['generate'])) {
    ?>
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PDF Generator - Kanban Board Documentation</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                max-width: 600px;
                margin: 50px auto;
                padding: 20px;
                background-color: #f5f5f5;
            }
            .container {
                background-color: white;
                padding: 30px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 {
                color: #2c3e50;
                text-align: center;
                margin-bottom: 30px;
            }
            .btn {
                display: inline-block;
                background-color: #3498db;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 5px;
                font-size: 16px;
                margin: 10px 5px;
                transition: background-color 0.3s;
            }
            .btn:hover {
                background-color: #2980b9;
            }
            .info {
                background-color: #d1ecf1;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
                border-left: 4px solid #17a2b8;
            }
            .warning {
                background-color: #fff3cd;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
                border-left: 4px solid #ffc107;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>📄 PDF Generator</h1>
            <h2>Kanban Board Project Documentation</h2>
            
            <div class="info">
                <strong>📋 What this does:</strong>
                <ul>
                    <li>Converts the comprehensive project documentation to PDF format</li>
                    <li>Includes all project details, API documentation, and guides</li>
                    <li>Creates a professionally formatted document</li>
                </ul>
            </div>
            
            <div class="warning">
                <strong>⚠️ Requirements:</strong>
                <ul>
                    <li><strong>Option 1:</strong> wkhtmltopdf installed on your system</li>
                    <li><strong>Option 2:</strong> TCPDF library (via Composer)</li>
                    <li><strong>Fallback:</strong> HTML file that can be printed to PDF</li>
                </ul>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
                <a href="?generate=1" class="btn">🚀 Generate PDF</a>
                <a href="Kanban_Board_Project_Documentation.md" class="btn" target="_blank">📖 View Markdown</a>
            </div>
            
            <div style="margin-top: 30px; text-align: center;">
                <p><strong>Alternative:</strong> You can also use online tools to convert the markdown file to PDF:</p>
                <ul style="text-align: left; display: inline-block;">
                    <li>Pandoc (command line tool)</li>
                    <li>Online Markdown to PDF converters</li>
                    <li>Browser print function (after converting to HTML)</li>
                </ul>
            </div>
        </div>
    </body>
    </html>
    <?php
}
?>
