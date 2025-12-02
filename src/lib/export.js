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
 * Export a topic as PDF
 * @param {Object} topic - The topic to export
 * @param {HTMLElement} contentElement - The rendered HTML element to convert
 */
export async function exportAsPDF(topic, contentElement) {
  try {
    // Create canvas from HTML element
    const canvas = await html2canvas(contentElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    
    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Add header with metadata
    pdf.setFontSize(16);
    pdf.text(topic.title, 20, 20);
    
    pdf.setFontSize(10);
    pdf.text(`Category: ${topic.category}`, 20, 30);
    pdf.text(`Last Modified: ${new Date(topic.lastModified).toLocaleString()}`, 20, 36);
    
    // Add separator line
    pdf.line(20, 40, 190, 40);

    // Calculate image dimensions to fit page
    const imgWidth = 170; // A4 width minus margins
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const pageHeight = 297; // A4 height in mm
    const headerHeight = 45;
    let heightLeft = imgHeight;
    let position = headerHeight;

    // Add image to PDF (with paging if needed)
    pdf.addImage(imgData, 'PNG', 20, position, imgWidth, imgHeight);
    heightLeft -= (pageHeight - headerHeight);

    while (heightLeft > 0) {
      position = heightLeft - imgHeight + headerHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 20, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
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
