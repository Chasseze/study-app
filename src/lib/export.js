import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Export utilities for topics
 */

/**
 * Download a topic as a markdown file
 * @param {Object} topic - The topic to export
 */
export function exportAsMarkdown(topic) {
  const content = `# ${topic.title}\n\n**Category:** ${topic.category}\n**Last Modified:** ${new Date(topic.lastModified).toLocaleString()}\n\n---\n\n${topic.content}`;
  
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${sanitizeFilename(topic.title)}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export a topic as PDF with proper multi-page support
 * @param {Object} topic - The topic to export
 * @param {HTMLElement} contentElement - The rendered HTML element to convert
 */
export async function exportAsPDF(topic, contentElement) {
  try {
    // Clone the element to avoid modifying the original
    const clone = contentElement.cloneNode(true);
    clone.style.width = '800px';
    clone.style.padding = '20px';
    clone.style.backgroundColor = '#ffffff';
    clone.style.color = '#000000';
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    clone.style.top = '0';
    document.body.appendChild(clone);

    // Create canvas from cloned element
    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 800,
      scrollY: -window.scrollY,
      height: clone.scrollHeight,
      width: clone.scrollWidth
    });

    // Remove clone
    document.body.removeChild(clone);

    const imgData = canvas.toDataURL('image/png', 1.0);
    
    // A4 dimensions in mm
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    const headerHeight = 35;
    
    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Add header with metadata on first page
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(topic.title, margin, 20);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100);
    pdf.text(`Category: ${topic.category}`, margin, 28);
    pdf.text(`Last Modified: ${new Date(topic.lastModified).toLocaleString()}`, margin, 34);
    pdf.setTextColor(0);
    
    // Add separator line
    pdf.setDrawColor(200);
    pdf.line(margin, 38, pageWidth - margin, 38);

    // Calculate image dimensions
    const imgWidth = contentWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Available height on first page (after header)
    const firstPageContentHeight = pageHeight - headerHeight - margin;
    // Available height on subsequent pages
    const subsequentPageContentHeight = pageHeight - (margin * 2);
    
    // If content fits on one page
    if (imgHeight <= firstPageContentHeight) {
      pdf.addImage(imgData, 'PNG', margin, headerHeight + 5, imgWidth, imgHeight);
    } else {
      // Multi-page content - slice the canvas into page-sized chunks
      const pixelsPerMM = canvas.width / imgWidth;
      
      let currentY = 0;
      let pageNum = 0;
      
      while (currentY < canvas.height) {
        const isFirstPage = pageNum === 0;
        const availableHeight = isFirstPage ? firstPageContentHeight : subsequentPageContentHeight;
        const sliceHeight = Math.min(availableHeight * pixelsPerMM, canvas.height - currentY);
        
        // Create a canvas slice for this page
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sliceHeight;
        const ctx = sliceCanvas.getContext('2d');
        
        // Draw the slice from the main canvas
        ctx.drawImage(
          canvas,
          0, currentY,                    // Source x, y
          canvas.width, sliceHeight,      // Source width, height
          0, 0,                           // Destination x, y
          canvas.width, sliceHeight       // Destination width, height
        );
        
        const sliceData = sliceCanvas.toDataURL('image/png', 1.0);
        const sliceImgHeight = (sliceHeight * imgWidth) / canvas.width;
        
        if (pageNum > 0) {
          pdf.addPage();
        }
        
        const yPosition = isFirstPage ? headerHeight + 5 : margin;
        pdf.addImage(sliceData, 'PNG', margin, yPosition, imgWidth, sliceImgHeight);
        
        currentY += sliceHeight;
        pageNum++;
      }
    }

    // Save PDF
    pdf.save(`${sanitizeFilename(topic.title)}.pdf`);
    
    return true;
  } catch (error) {
    console.error('PDF export failed:', error);
    return false;
  }
}

/**
 * Export a topic as MS Word document (.docx)
 * @param {Object} topic - The topic to export
 */
export function exportAsWord(topic) {
  try {
    // Convert markdown to simple HTML for Word
    const htmlContent = convertMarkdownToHtml(topic.content);
    
    // Create Word document using HTML
    const docContent = `
<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' 
      xmlns:w='urn:schemas-microsoft-com:office:word' 
      xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(topic.title)}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    body {
      font-family: 'Calibri', 'Arial', sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #333;
      max-width: 6.5in;
      margin: 0 auto;
    }
    h1 {
      font-size: 24pt;
      color: #1a1a1a;
      border-bottom: 2px solid #3b82f6;
      padding-bottom: 8pt;
      margin-bottom: 12pt;
    }
    h2 {
      font-size: 18pt;
      color: #2563eb;
      margin-top: 18pt;
      margin-bottom: 8pt;
    }
    h3 {
      font-size: 14pt;
      color: #3b82f6;
      margin-top: 14pt;
      margin-bottom: 6pt;
    }
    p {
      margin: 8pt 0;
    }
    .metadata {
      color: #666;
      font-size: 10pt;
      margin-bottom: 16pt;
      padding-bottom: 8pt;
      border-bottom: 1px solid #ddd;
    }
    code {
      font-family: 'Consolas', 'Courier New', monospace;
      background-color: #f3f4f6;
      padding: 2pt 4pt;
      border-radius: 3pt;
      font-size: 10pt;
    }
    pre {
      background-color: #f3f4f6;
      padding: 12pt;
      border-radius: 4pt;
      overflow-x: auto;
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 10pt;
      line-height: 1.4;
    }
    blockquote {
      border-left: 4pt solid #3b82f6;
      margin: 12pt 0;
      padding: 8pt 16pt;
      background-color: #f8fafc;
      color: #475569;
    }
    ul, ol {
      margin: 8pt 0;
      padding-left: 24pt;
    }
    li {
      margin: 4pt 0;
    }
    strong {
      font-weight: bold;
    }
    em {
      font-style: italic;
    }
    a {
      color: #2563eb;
      text-decoration: underline;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 12pt 0;
    }
    th, td {
      border: 1pt solid #d1d5db;
      padding: 8pt;
      text-align: left;
    }
    th {
      background-color: #f3f4f6;
      font-weight: bold;
    }
    img {
      max-width: 100%;
      height: auto;
    }
    hr {
      border: none;
      border-top: 1pt solid #e5e7eb;
      margin: 16pt 0;
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(topic.title)}</h1>
  <div class="metadata">
    <strong>Category:</strong> ${escapeHtml(topic.category)}<br>
    <strong>Last Modified:</strong> ${new Date(topic.lastModified).toLocaleString()}
  </div>
  <div class="content">
    ${htmlContent}
  </div>
</body>
</html>`;

    // Create blob with Word MIME type
    const blob = new Blob([docContent], { 
      type: 'application/vnd.ms-word;charset=utf-8' 
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sanitizeFilename(topic.title)}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Word export failed:', error);
    return false;
  }
}

/**
 * Convert markdown content to HTML for Word export
 * @param {string} markdown - The markdown content
 * @returns {string} HTML content
 */
function convertMarkdownToHtml(markdown) {
  if (!markdown) return '';
  
  let html = markdown;
  
  // Escape HTML entities first (but preserve markdown)
  html = html.replace(/&/g, '&amp;');
  
  // Code blocks (before other transformations)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre><code>${escapeHtml(code.trim())}</code></pre>`;
  });
  
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  
  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');
  
  // Strikethrough
  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');
  
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  
  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');
  
  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
  
  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr>');
  html = html.replace(/^\*\*\*$/gm, '<hr>');
  
  // Unordered lists
  html = html.replace(/^[-*] (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
  
  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
  
  // Paragraphs (lines that aren't already wrapped)
  const lines = html.split('\n');
  html = lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('<')) return line;
    return `<p>${line}</p>`;
  }).join('\n');
  
  // Clean up empty paragraphs and fix nested lists
  html = html.replace(/<p><\/p>/g, '');
  html = html.replace(/<\/ul>\s*<ul>/g, '');
  html = html.replace(/<p>(<ul>)/g, '$1');
  html = html.replace(/(<\/ul>)<\/p>/g, '$1');
  
  return html;
}

/**
 * Escape HTML entities
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Export all topics as a single JSON file
 * @param {Array} topics - Array of topics to export
 */
export function exportAllAsJSON(topics) {
  const data = {
    exportDate: new Date().toISOString(),
    version: '1.0',
    topics: topics
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `study-notes-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Import topics from JSON file
 * @param {File} file - The JSON file to import
 * @returns {Promise<Array>} Array of topics
 */
export async function importFromJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        if (!data.topics || !Array.isArray(data.topics)) {
          reject(new Error('Invalid file format: missing topics array'));
          return;
        }
        
        resolve(data.topics);
      } catch (error) {
        reject(new Error('Failed to parse JSON file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
}

/**
 * Sanitize filename to remove invalid characters
 * @param {string} filename - The filename to sanitize
 * @returns {string} Sanitized filename
 */
function sanitizeFilename(filename) {
  return filename
    .replace(/[^a-z0-9]/gi, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase();
}
