import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * Export data to PDF
 * @param {string} title - Report title
 * @param {Array} headers - Table headers ['Date', 'Invoice', ...]
 * @param {Array} data - Array of arrays [[row1_col1, row1_col2], ...]
 * @param {string} filename - Filename to save
 */
export const exportToPDF = (title, headers, data, filename = 'report.pdf') => {
  const doc = jsPDF('p', 'mm', 'a4');
  
  // Header
  doc.setFontSize(18);
  doc.setTextColor(40);
  doc.text(title, 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleString('id-ID')}`, 14, 30);
  
  // Table
  doc.autoTable({
    startY: 35,
    head: [headers],
    body: data,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] }, // primary-500
    styles: { fontSize: 8, cellPadding: 3 },
  });
  
  doc.save(filename);
};

/**
 * Export data to Excel
 * @param {Array} data - Array of objects [{ Date: '...', Invoice: '...' }, ...]
 * @param {string} filename - Filename to save
 */
export const exportToExcel = (data, filename = 'report.xlsx') => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
  XLSX.writeFile(workbook, filename);
};
