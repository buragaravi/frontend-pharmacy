import React, { useState } from 'react';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const PDFReportGenerator = ({ assignment, execution, onClose, isOpen }) => {
  const [generating, setGenerating] = useState(false);
  const [reportOptions, setReportOptions] = useState({
    includeHeader: true,
    includeStats: true,
    includeChecklist: true,
    includeFindings: true,
    includeImages: false,
    includeSignatures: true
  });

  const generatePDF = async () => {
    if (!assignment || !execution) return;

    setGenerating(true);
    
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Helper function to add new page if needed
      const checkPageBreak = (requiredHeight) => {
        if (yPosition + requiredHeight > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }
      };

      // Header Section
      if (reportOptions.includeHeader) {
        // Logo placeholder (you can add actual logo here)
        pdf.setFillColor(59, 130, 246); // Blue color
        pdf.rect(20, yPosition, pageWidth - 40, 30, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(20);
        pdf.setFont('helvetica', 'bold');
        pdf.text('QUALITY AUDIT REPORT', pageWidth / 2, yPosition + 20, { align: 'center' });
        
        yPosition += 40;
        
        // Basic Info
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        
        const basicInfo = [
          [`Assignment ID:`, assignment.assignmentId || 'N/A'],
          [`Lab Name:`, assignment.labName || 'N/A'],
          [`Category:`, assignment.category || 'N/A'],
          [`Assigned Faculty:`, assignment.facultyName || 'N/A'],
          [`Assigned Date:`, new Date(assignment.assignedAt).toLocaleDateString()],
          [`Execution Date:`, execution.executedAt ? new Date(execution.executedAt).toLocaleDateString() : 'N/A'],
          [`Status:`, assignment.status || 'N/A']
        ];

        basicInfo.forEach(([label, value]) => {
          checkPageBreak(10);
          pdf.setFont('helvetica', 'bold');
          pdf.text(label, 20, yPosition);
          pdf.setFont('helvetica', 'normal');
          pdf.text(value, 100, yPosition);
          yPosition += 8;
        });

        yPosition += 10;
      }

      // Statistics Section
      if (reportOptions.includeStats && execution.summary) {
        checkPageBreak(60);
        
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('AUDIT SUMMARY', 20, yPosition);
        yPosition += 15;

        const stats = [
          ['Total Items Checked', execution.summary.totalItems || 0],
          ['Items Passed', execution.summary.passedItems || 0],
          ['Items Failed', execution.summary.failedItems || 0],
          ['Items Pending', execution.summary.pendingItems || 0],
          ['Completion Percentage', `${Math.round((execution.summary.completionPercentage || 0) * 100) / 100}%`]
        ];

        // Create stats table
        autoTable(pdf, {
          startY: yPosition,
          head: [['Metric', 'Value']],
          body: stats,
          theme: 'grid',
          headStyles: { fillColor: [59, 130, 246] },
          margin: { left: 20, right: 20 }
        });

        yPosition = pdf.lastAutoTable.finalY + 15;
      }

      // Checklist Section
      if (reportOptions.includeChecklist && execution.checklistItems?.length > 0) {
        checkPageBreak(40);
        
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('DETAILED CHECKLIST', 20, yPosition);
        yPosition += 15;

        const checklistData = execution.checklistItems.map(item => [
          item.itemId || 'N/A',
          item.itemName || 'N/A',
          item.category || 'N/A',
          item.status || 'pending',
          item.location || 'N/A',
          item.notes || '-'
        ]);

        autoTable(pdf, {
          startY: yPosition,
          head: [['Item ID', 'Item Name', 'Category', 'Status', 'Location', 'Notes']],
          body: checklistData,
          theme: 'striped',
          headStyles: { fillColor: [59, 130, 246] },
          margin: { left: 20, right: 20 },
          styles: { fontSize: 8 },
          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 40 },
            2: { cellWidth: 25 },
            3: { cellWidth: 20 },
            4: { cellWidth: 25 },
            5: { cellWidth: 35 }
          }
        });

        yPosition = pdf.lastAutoTable.finalY + 15;
      }

      // Findings Section
      if (reportOptions.includeFindings && assignment.findings?.length > 0) {
        checkPageBreak(40);
        
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('AUDIT FINDINGS & RECOMMENDATIONS', 20, yPosition);
        yPosition += 15;

        assignment.findings.forEach((finding, index) => {
          checkPageBreak(30);
          
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`Finding ${index + 1}:`, 20, yPosition);
          yPosition += 8;
          
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(10);
          
          // Split long text
          const findingLines = pdf.splitTextToSize(finding.description || 'No description', pageWidth - 40);
          findingLines.forEach(line => {
            checkPageBreak(6);
            pdf.text(line, 25, yPosition);
            yPosition += 6;
          });
          
          if (finding.recommendation) {
            yPosition += 3;
            pdf.setFont('helvetica', 'bold');
            pdf.text('Recommendation:', 25, yPosition);
            yPosition += 6;
            
            pdf.setFont('helvetica', 'normal');
            const recLines = pdf.splitTextToSize(finding.recommendation, pageWidth - 40);
            recLines.forEach(line => {
              checkPageBreak(6);
              pdf.text(line, 30, yPosition);
              yPosition += 6;
            });
          }
          
          yPosition += 10;
        });
      }

      // Signatures Section
      if (reportOptions.includeSignatures) {
        checkPageBreak(80);
        
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('SIGNATURES', 20, yPosition);
        yPosition += 20;

        // Auditor signature
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Auditor:', 20, yPosition);
        pdf.line(60, yPosition, 120, yPosition); // Signature line
        yPosition += 15;
        pdf.setFontSize(10);
        pdf.text(`Name: ${assignment.facultyName || 'N/A'}`, 20, yPosition);
        yPosition += 8;
        pdf.text(`Date: ${execution.executedAt ? new Date(execution.executedAt).toLocaleDateString() : '__________'}`, 20, yPosition);
        yPosition += 20;

        // Lab Supervisor signature
        pdf.setFontSize(12);
        pdf.text('Lab Supervisor:', 20, yPosition);
        pdf.line(80, yPosition, 140, yPosition);
        yPosition += 15;
        pdf.setFontSize(10);
        pdf.text('Name: ____________________', 20, yPosition);
        yPosition += 8;
        pdf.text('Date: ____________________', 20, yPosition);
      }

      // Footer
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Generated on ${new Date().toLocaleString()}`, 20, pageHeight - 10);
        pdf.text(`Page ${i} of ${pageCount}`, pageWidth - 40, pageHeight - 10);
      }

      // Save the PDF
      const fileName = `Audit_Report_${assignment.assignmentId || 'Unknown'}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF report. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold">Generate PDF Report</h3>
              <p className="text-blue-100 text-sm">Customize your audit report</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-all duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Report Options */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-800">Report Sections</h4>
            
            {Object.entries({
              includeHeader: 'Header & Basic Information',
              includeStats: 'Summary Statistics',
              includeChecklist: 'Detailed Checklist',
              includeFindings: 'Findings & Recommendations',
              includeImages: 'Images (Coming Soon)',
              includeSignatures: 'Signature Section'
            }).map(([key, label]) => (
              <label key={key} className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={reportOptions[key]}
                  onChange={(e) => setReportOptions(prev => ({
                    ...prev,
                    [key]: e.target.checked
                  }))}
                  disabled={key === 'includeImages'}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
                />
                <span className={`text-sm ${key === 'includeImages' ? 'text-gray-400' : 'text-gray-700'}`}>
                  {label}
                </span>
              </label>
            ))}
          </div>

          {/* Preview Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h5 className="font-medium text-gray-800 mb-2">Report Preview</h5>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Assignment:</strong> {assignment?.assignmentId || 'N/A'}</p>
              <p><strong>Lab:</strong> {assignment?.labName || 'N/A'}</p>
              <p><strong>Faculty:</strong> {assignment?.facultyName || 'N/A'}</p>
              <p><strong>Status:</strong> {assignment?.status || 'N/A'}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={generatePDF}
              disabled={generating}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Generate PDF
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PDFReportGenerator;
