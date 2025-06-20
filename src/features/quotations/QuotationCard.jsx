import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import CommentSection from './CommentSection';
import ChemicalAddToDraftModal from './ChemicalAddToDraftModal';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // Use this import for Vite/React, do NOT import as a variable

// SVG Icons
const DocumentIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const AddIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

const SendIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const CommentIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const SaveIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const QuotationCard = ({ quotation, refreshList }) => {
    const [showComment, setShowComment] = useState(false);
    const [showAddChemicalModal, setShowAddChemicalModal] = useState(false);
    const [statusUpdate, setStatusUpdate] = useState('');
    const [comment, setComment] = useState('');
    const [draftQuotations, setDraftQuotations] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showRemarksModal, setShowRemarksModal] = useState(false);
    const [standardRemark, setStandardRemark] = useState('');
    const [editingChemicalIndex, setEditingChemicalIndex] = useState(null);
    const [chemicalRemarks, setChemicalRemarks] = useState({});

    const token = localStorage.getItem('token');
    const decodedToken = token ? jwtDecode(token) : null;
    const userRole = decodedToken?.user?.role;
    
    // Initialize chemical remarks from quotation data
    useEffect(() => {
        if (quotation && quotation.chemicals) {
            const initialRemarks = {};
            quotation.chemicals.forEach((chem, index) => {
                initialRemarks[index] = chem.remarks || '';
            });
            setChemicalRemarks(initialRemarks);
        }
    }, [quotation]);

    useEffect(() => {
        if (userRole === 'central_lab_admin') {
            fetchDraftQuotations();
        }
    }, [userRole]);

    const fetchDraftQuotations = async () => {
        try {
            const res = await axios.get('https://backend-pharmacy-5541.onrender.com/api/quotations/central', {
                headers: { Authorization: `Bearer ${token}` },
                params: { status: 'draft' }
            });
            setDraftQuotations(res.data || []);
        } catch (err) {
            console.error('Failed to load drafts', err);
            setError('Failed to load draft quotations');
        }
    };

    const handleSubmitDraft = async () => {
        setIsLoading(true);
        try {
            await axios.patch(
                'https://backend-pharmacy-5541.onrender.com/api/quotations/central/draft/submit',
                { quotationId: quotation._id },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            refreshList();
        } catch (err) {
            console.error('Failed to submit draft', err);
            setError(err.response?.data?.message || 'Failed to submit draft');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddComment = async (newComment) => {
        setIsLoading(true);
        try {
            let endpoint;
            let requestData = { comments: newComment };

            if (userRole === 'central_lab_admin') {
                endpoint = `/api/quotations/central/allocate`;
                requestData.status = quotation.status;
                requestData.quotationId = quotation._id;
                requestData.comments = newComment;
            } else if (userRole === 'admin') {
                endpoint = `/api/quotations/admin/process`;
                requestData.status = quotation.status;
                requestData.comments = newComment;
                requestData.quotationId = quotation._id;
            } else {
                endpoint = `/api/quotations/lab/${quotation._id}`;
            }

            await axios.patch(
                `https://backend-pharmacy-5541.onrender.com${endpoint}`,
                requestData,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            refreshList();
        } catch (err) {
            console.error('Error updating comment:', err);
            setError(err.response?.data?.message || 'Failed to add comment');
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusUpdate = async () => {
        if (!statusUpdate) {
            setError('Please select a status');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            let endpoint;
            let payload = {
                status: statusUpdate,
                comments: comment || undefined
            };
            // For admin, send all chemical remarks as chemicalUpdates
            if (userRole === 'admin') {
                endpoint = `https://backend-pharmacy-5541.onrender.com/api/quotations/admin/process`;
                payload.quotationId = quotation._id;
                payload.status = statusUpdate;
                payload.comments = comment;
                // Build chemicalUpdates array for all chemicals
                payload.chemicalUpdates = quotation.chemicals.map((chem, idx) => ({
                    index: idx,
                    remarks: chemicalRemarks[idx] || ''
                }));
            } else if (userRole === 'central_lab_admin' && quotation.createdByRole === 'lab_assistant') {
                endpoint = `https://backend-pharmacy-5541.onrender.com/api/quotations/central/allocate`;
                payload.quotationId = quotation._id;
                payload.status = statusUpdate;
                payload.comments = comment;
            } else {
                throw new Error('Unauthorized status update');
            }
            await axios.patch(
                endpoint,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            refreshList();
            setStatusUpdate('');
            setComment('');
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update status');
        } finally {
            setIsLoading(false);
        }
    };

    // Updated function to handle chemical remark update
    const handleUpdateChemicalRemark = async (index) => {
        setIsLoading(true);
        try {
            const remark = chemicalRemarks[index];
            if (userRole === 'admin') {
                await axios.patch(
                    `https://backend-pharmacy-5541.onrender.com/api/quotations/admin/process`,
                    {
                        quotationId: quotation._id,
                        status: quotation.status,
                        chemicalUpdates: [{ index, remarks: remark }]
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            } else {
                await axios.patch(
                    `https://backend-pharmacy-5541.onrender.com/api/quotations/${quotation._id}/chemicals/remarks`,
                    {
                        chemicalUpdates: [{ index, remarks: remark }]
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            }
            setEditingChemicalIndex(null);
            refreshList();
        } catch (err) {
            console.error('Failed to update chemical remark:', err);
            setError(err.response?.data?.message || 'Failed to update chemical remark');
        } finally {
            setIsLoading(false);
        }
    };

    // New function to handle batch update of chemical remarks
    const handleBatchUpdateRemarks = async () => {
        if (!standardRemark.trim()) {
            setError('Please enter a standard remark');
            return;
        }

        setIsLoading(true);
        try {
            await axios.patch(
                `https://backend-pharmacy-5541.onrender.com/api/quotations/${quotation._id}/chemicals/batch-remarks`,
                { standardRemark },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setShowRemarksModal(false);
            setStandardRemark('');
            refreshList();
        } catch (err) {
            console.error('Failed to update batch remarks:', err);
            setError(err.response?.data?.message || 'Failed to update batch remarks');
        } finally {
            setIsLoading(false);
        }
    };

    // Download as Excel (colorful, professional, matches PDF style, improved structure)
    const handleDownloadExcel = () => {
        const data = quotation.chemicals.map((chem, idx) => ({
            '#': idx + 1,
            'CHEMICAL NAME': chem.chemicalName,
            'QUANTITY': chem.quantity,
            'UNIT': chem.unit,
            'PRICE/UNIT': chem.pricePerUnit,
            'TOTAL': (chem.pricePerUnit * chem.quantity).toFixed(2),
            'REMARKS': chem.remarks || ''
        }));
        // Add total estimation row
        data.push({
            '#': '',
            'CHEMICAL NAME': '',
            'QUANTITY': '',
            'UNIT': '',
            'PRICE/UNIT': 'Total Estimation',
            'TOTAL': quotation.totalPrice ? quotation.totalPrice.toFixed(2) : '',
            'REMARKS': ''
        });
        const ws = XLSX.utils.json_to_sheet(data, { skipHeader: false });
        const range = XLSX.utils.decode_range(ws['!ref']);
        // Header style (deep sea blue background, white text, bold, larger font)
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cell = ws[XLSX.utils.encode_cell({ r: range.s.r, c: C })];
            if (cell) {
                cell.s = {
                    font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 13 },
                    fill: { fgColor: { rgb: '0B3861' } },
                    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
                    border: {
                        top: { style: 'medium', color: { rgb: '2196F3' } },
                        bottom: { style: 'medium', color: { rgb: '2196F3' } },
                        left: { style: 'medium', color: { rgb: '2196F3' } },
                        right: { style: 'medium', color: { rgb: '2196F3' } }
                    }
                };
            }
        }
        // Alternate row colors and borders (sky blue and white, more contrast)
        for (let R = range.s.r + 1; R <= range.e.r; ++R) {
            const isEven = (R - range.s.r) % 2 === 0;
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
                if (cell) {
                    // Total Estimation row (last row): big, bold, sky blue, right-aligned
                    if (R === range.e.r && (C === range.e.c - 2 || C === range.e.c - 1)) {
                        cell.s = {
                            font: { bold: true, color: { rgb: '2196F3' }, sz: 15 },
                            alignment: { horizontal: 'right', vertical: 'center' },
                            fill: { fgColor: { rgb: 'E1F1FF' } },
                            border: {
                                top: { style: 'medium', color: { rgb: '2196F3' } },
                                bottom: { style: 'medium', color: { rgb: '2196F3' } },
                                left: { style: 'medium', color: { rgb: '2196F3' } },
                                right: { style: 'medium', color: { rgb: '2196F3' } }
                            }
                        };
                    } else {
                        cell.s = {
                            fill: { fgColor: { rgb: isEven ? 'F5F9FD' : 'E1F1FF' } },
                            border: {
                                top: { style: 'thin', color: { rgb: 'BCE0FD' } },
                                bottom: { style: 'thin', color: { rgb: 'BCE0FD' } },
                                left: { style: 'thin', color: { rgb: 'BCE0FD' } },
                                right: { style: 'thin', color: { rgb: 'BCE0FD' } }
                            },
                            alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
                            font: { sz: 11, color: { rgb: '0B3861' } }
                        };
                    }
                }
            }
        }
        // Set column widths to match PDF look and improve readability
        ws['!cols'] = [
            { wch: 7 },   // #
            { wch: 32 },  // CHEMICAL NAME
            { wch: 14 },  // QUANTITY
            { wch: 12 },  // UNIT
            { wch: 20 },  // PRICE/UNIT
            { wch: 18 },  // TOTAL
            { wch: 36 }   // REMARKS
        ];
        // Add a header row above the table for Quotation ID and Created At (styled like PDF)
        const headerRowNum = 0;
        XLSX.utils.sheet_add_aoa(ws, [
            [`Quotation ID: ${quotation._id.slice(-6).toUpperCase()}`,
             '', '', '', '', '',
             `Created At: ${quotation.createdAt ? new Date(quotation.createdAt).toLocaleString() : ''}`]
        ], { origin: -1 });
        // Style the header row (deep sea blue, white, bold, merged cells)
        for (let C = 0; C <= 6; ++C) {
            const cell = ws[XLSX.utils.encode_cell({ r: headerRowNum, c: C })];
            if (cell) {
                cell.s = {
                    font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 14 },
                    fill: { fgColor: { rgb: '0B3861' } },
                    alignment: { horizontal: 'left', vertical: 'center' }
                };
            }
        }
        ws['!merges'] = [
            { s: { r: headerRowNum, c: 0 }, e: { r: headerRowNum, c: 3 } }, // Quotation ID
            { s: { r: headerRowNum, c: 4 }, e: { r: headerRowNum, c: 6 } }, // Created At
            // Table header row merge (none, keep as is)
            // Signature and timestamp merges (footer)
            { s: { r: range.e.r + 3, c: 4 }, e: { r: range.e.r + 3, c: 5 } }, // signature line
            { s: { r: range.e.r + 4, c: 4 }, e: { r: range.e.r + 4, c: 5 } }, // signature label
            { s: { r: range.e.r + 5, c: 3 }, e: { r: range.e.r + 5, c: 5 } }  // timestamp
        ];
        // Add a footer row for signature and timestamp (like PDF)
        const footerRow = range.e.r + 3;
        ws[`E${footerRow + 1}`] = { t: 's', v: 'Authorized Signature', s: {
            font: { bold: true, color: { rgb: '0B3861' }, sz: 12 },
            alignment: { horizontal: 'center', vertical: 'center' }
        }};
        ws[`E${footerRow}`] = { t: 's', v: '_________________________', s: {
            font: { color: { rgb: '0B3861' }, sz: 12 },
            alignment: { horizontal: 'center', vertical: 'center' }
        }};
        ws[`D${footerRow + 2}`] = { t: 's', v: `Generated: ${new Date().toLocaleString()}`, s: {
            font: { color: { rgb: '2196F3' }, sz: 10 },
            alignment: { horizontal: 'center', vertical: 'center' }
        }};
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Quotation');
        XLSX.writeFile(wb, `Quotation_${quotation._id.slice(-6).toUpperCase()}.xlsx`);
    };

    // Download as PDF (colorful, professional) using LabRequestListPage's PDF logic
    const handleDownloadPDF = () => {
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm' });
        const pageWidth = 297;
        const pageHeight = 210;
        const leftMargin = 15;
        const rightMargin = 15;
        const availableWidth = pageWidth - leftMargin - rightMargin;
        // Colors
        const deepSeaBlue = [11, 56, 97]; // #0B3861
        const skyBlue = [33, 150, 243];   // #2196F3
        const white = [255, 255, 255];
        // Header Gradient
        const headerHeight = 22;
        doc.setFillColor(...deepSeaBlue);
        doc.rect(0, 0, pageWidth, headerHeight, 'F');
        doc.setFillColor(...skyBlue);
        doc.rect(pageWidth / 2, 0, pageWidth / 2, headerHeight, 'F');
        // Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(26);
        doc.setTextColor(...white);
        doc.text('QUOTATION REPORT', pageWidth / 2, 15, { align: 'center' });
        // Decorative line
        doc.setDrawColor(...deepSeaBlue);
        doc.setLineWidth(1.2);
        doc.line(leftMargin, headerHeight + 2, pageWidth - rightMargin, headerHeight + 2);
        // Report details
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(...deepSeaBlue);
        const reportDetails = [
            `Quotation ID: ${quotation._id.slice(-6).toUpperCase()}`,
            { title: 'REMARKS', dataKey: 'remarks', minWidth: 40 }
        ];
        const totalMinWidth = columns.reduce((sum, col) => sum + col.minWidth, 0);
        const extraWidth = availableWidth - totalMinWidth;
        const extraPerColumn = extraWidth / columns.length;
        const finalColumnWidths = columns.map(col => col.minWidth + extraPerColumn);
        // Table data
        const tableData = quotation.chemicals.map((chem, idx) => ({
            index: idx + 1,
            chemicalName: chem.chemicalName,
            quantity: chem.quantity,
            unit: chem.unit,
            pricePerUnit: chem.pricePerUnit,
            total: (chem.pricePerUnit * chem.quantity).toFixed(2),
            remarks: chem.remarks || ''
        }));
        // Table
        autoTable(doc, {
            head: [columns.map(col => col.title)],
            body: tableData.map(row => columns.map(col => row[col.dataKey])),
            startY: headerHeight + 16,
            margin: { left: leftMargin, right: rightMargin },
            tableWidth: availableWidth,
            styles: {
                fontSize: 9,
                cellPadding: 3,
                overflow: 'linebreak',
                font: 'helvetica',
                textColor: [33, 37, 41],
                lineColor: skyBlue,
                fillColor: white
            },
            headStyles: {
                fillColor: deepSeaBlue,
                textColor: 255,
                fontStyle: 'bold',
                halign: 'center',
                lineWidth: 0.5,
                fontSize: 11
            },
            bodyStyles: {
                halign: 'center',
                lineWidth: 0.1
            },
            alternateRowStyles: {
                fillColor: [241, 249, 253], // very light blue
                lineWidth: 0.1
            },
            columnStyles: columns.reduce((styles, _, i) => {
                styles[i] = {
                    cellWidth: finalColumnWidths[i],
                    halign: ['index', 'quantity', 'unit', 'pricePerUnit', 'total'].includes(columns[i].dataKey)
                        ? 'center' : 'left'
                };
                return styles;
            }, {})
        });
        // Total Estimation (big, bold, colorful, right-aligned)
        const totalY = doc.lastAutoTable.finalY + 12;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.setTextColor(...skyBlue);
        doc.text(
            `Total Estimation: Rs.${quotation.totalPrice ? quotation.totalPrice.toFixed(2) : ''}`,
            pageWidth - rightMargin,
            totalY,
            { align: 'right' }
        );
        // Authorized Signature (bottom right, signature line and label centered below)
        const signatureLineWidth = 60;
        const signatureY = pageHeight - 32;
        const signatureX = pageWidth - rightMargin - signatureLineWidth;
        doc.setDrawColor(...deepSeaBlue);
        doc.setLineWidth(0.7);
        // Draw signature line
        doc.line(signatureX, signatureY, signatureX + signatureLineWidth, signatureY);
        // Label below the line, centered
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(13);
        doc.setTextColor(...deepSeaBlue);
        doc.text(
            'Authorized Signature',
            signatureX + signatureLineWidth / 2,
            signatureY + 7,
            { align: 'center' }
        );
        // Footer: timestamp (bottom center)
        doc.setFontSize(10);
        doc.setTextColor(...skyBlue);
        doc.text(
            `Generated: ${new Date().toLocaleString()}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
        );
        doc.save(`Quotation_${quotation._id.slice(-6).toUpperCase()}.pdf`);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'bg-green-100 text-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'draft': return 'bg-blue-100 text-blue-800';
            case 'purchased': return 'bg-purple-100 text-purple-800';
            case 'ordered': return 'bg-indigo-100 text-indigo-800';
            case 'allocated': return 'bg-teal-100 text-teal-800';
            case 'partially_fulfilled': return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const statusOptions = () => {
        if (userRole === 'admin') {
            return [
                { value: 'approved', label: 'Approve' },
                { value: 'purchasing', label: 'Mark for Purchasing' }, 
                { value: 'rejected', label: 'Reject' },
                { value: 'purchased', label: 'Purchase' }
            ];
        } else if (userRole === 'central_lab_admin' && quotation.createdByRole === 'lab_assistant') {
            return [
                { value: 'allocated', label: 'Allocate Chemicals' },
                { value: 'partially_fulfilled', label: 'Partially Fulfill' },
                { value: 'rejected', label: 'Reject' }
            ];
        }
        return [];
    };

    // Modal for batch remarks
    const BatchRemarksModal = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                <h3 className="text-xl font-semibold mb-4 text-[#0B3861]">Apply Standard Remark</h3>
                <p className="text-sm mb-3 text-gray-600">This will apply the standard remark to all chemicals that don't already have remarks.</p>
                
                <textarea
                    rows="4"
                    value={standardRemark}
                    onChange={(e) => setStandardRemark(e.target.value)}
                    placeholder="Enter standard remark"
                    className="w-full px-3 py-2 mb-4 border border-[#BCE0FD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3861]"
                />
                
                {error && (
                    <div className="mb-4 p-2 bg-red-100 text-red-700 rounded text-sm">
                        {error}
                    </div>
                )}
                
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={() => {
                            setShowRemarksModal(false);
                            setError('');
                        }}
                        className="px-4 py-2 text-[#0B3861] hover:bg-gray-100 rounded-lg transition-colors"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleBatchUpdateRemarks}
                        className="px-4 py-2 bg-[#0B3861] text-white rounded-lg hover:bg-[#1E88E5] transition-colors"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Applying...' : 'Apply to All'}
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="bg-white rounded-lg shadow-md p-4 flex flex-col h-full">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="bg-[#0B3861] p-1.5 rounded-lg">
                        <DocumentIcon className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-[#0B3861] truncate">
                        {quotation.createdByRole === 'lab_assistant' ? 'Request' : 'Quotation'} #{quotation._id.slice(-6).toUpperCase()}
                    </h3>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(quotation.status)}`}
                    style={{ minWidth: 80, textAlign: 'center' }}>
                    {quotation.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </span>
            </div>

            {error && (
                <div className="mb-2 p-2 bg-red-100 text-red-700 rounded text-xs">{error}</div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                <div>
                    <p className="text-xs text-[#0B3861] font-medium mb-0.5">Created By</p>
                    <p className="text-xs text-[#0B3861] capitalize">{quotation.createdByRole.replace('_', ' ')}</p>
                </div>
                {quotation.labId && (
                    <div>
                        <p className="text-xs text-[#0B3861] font-medium mb-0.5">Lab ID</p>
                        <p className="text-xs text-[#0B3861]">{quotation.labId}</p>
                    </div>
                )}
                {quotation.vendorName && (
                    <div>
                        <p className="text-xs text-[#0B3861] font-medium mb-0.5">Vendor</p>
                        <p className="text-xs text-[#0B3861]">{quotation.vendorName}</p>
                    </div>
                )}
                {quotation.createdAt && (
                    <div>
                        <p className="text-xs text-[#0B3861] font-medium mb-0.5">Created At</p>
                        <p className="text-xs text-[#0B3861]">{new Date(quotation.createdAt).toLocaleString()}</p>
                    </div>
                )}
            </div>

            <div className="mb-3">
                <div className="flex justify-between items-center mb-1">
                    <h4 className="text-xs font-semibold text-[#0B3861]">
                        {quotation.createdByRole === 'lab_assistant' ? 'Chemicals Requested' : 'Chemicals to Purchase'}
                    </h4>
                    {userRole === 'central_lab_admin' && (
                        <button
                            onClick={() => setShowRemarksModal(true)}
                            className="text-[10px] px-2 py-0.5 bg-[#E1F1FF] text-[#0B3861] rounded hover:bg-[#BCE0FD] transition-colors"
                        >
                            Apply Standard Remarks
                        </button>
                    )}
                </div>
                <ul className="space-y-1">
                    {quotation.chemicals.map((chem, index) => (
                        <li key={index} className="bg-[#F5F9FD] p-2 rounded flex flex-col gap-1">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-medium text-[#0B3861] text-xs">{chem.chemicalName}</p>
                                    <p className="text-xs text-[#0B3861]">{chem.quantity} {chem.unit}</p>
                                    {chem.description && (
                                        <p className="text-[10px] text-[#64B5F6] mt-0.5">{chem.description}</p>
                                    )}
                                </div>
                                {chem.pricePerUnit && (
                                    <span className="text-[#0B3861] font-medium text-xs">₹{(chem.pricePerUnit * chem.quantity).toFixed(2)}</span>
                                )}
                            </div>
                            {(userRole === 'central_lab_admin' || userRole === 'admin') && (
                                <div className="mt-1 pt-1 border-t border-[#BCE0FD]">
                                    <div className="flex justify-between items-center">
                                        <p className="text-[10px] font-medium text-[#0B3861]">Remarks:</p>
                                        {(editingChemicalIndex !== index) && (
                                            <button
                                                onClick={() => setEditingChemicalIndex(index)}
                                                className="text-[10px] text-[#0B3861] hover:text-[#1E88E5] flex items-center"
                                            >
                                                <EditIcon className="mr-1" />Edit
                                            </button>
                                        )}
                                        {(editingChemicalIndex === index) && (
                                            <button
                                                onClick={() => handleUpdateChemicalRemark(index)}
                                                className="text-[10px] text-green-600 hover:text-green-700 flex items-center"
                                                disabled={isLoading}
                                            >
                                                <SaveIcon className="mr-1" />Save
                                            </button>
                                        )}
                                    </div>
                                    {editingChemicalIndex === index ? (
                                        <textarea
                                            value={chemicalRemarks[index] || ''}
                                            onChange={e => setChemicalRemarks({ ...chemicalRemarks, [index]: e.target.value })}
                                            className="w-full px-2 py-1 mt-1 text-xs border border-[#BCE0FD] rounded focus:outline-none focus:ring-1 focus:ring-[#0B3861]"
                                            rows="2"
                                            placeholder="Add remarks for this chemical"
                                        />
                                    ) : (
                                        <p className="text-xs text-gray-600 mt-0.5">
                                            {chem.remarks || chemicalRemarks[index] || 'No remarks added'}
                                        </p>
                                    )}
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
                {quotation.totalPrice && (
                    <div className="mt-2 text-right font-medium text-[#0B3861] text-xs">
                        Total: ₹{quotation.totalPrice.toFixed(2)}
                    </div>
                )}
            </div>

            <div className="flex gap-2 mb-2 justify-end">
                <button
                    onClick={handleDownloadExcel}
                    className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs hover:bg-green-200 border border-green-200"
                >
                    Download Excel
                </button>
                <button
                    onClick={handleDownloadPDF}
                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs hover:bg-blue-200 border border-blue-200"
                >
                    Download PDF
                </button>
            </div>

            {/* Action Buttons */}
            {userRole === 'central_lab_admin' && quotation.status === 'draft' && (
                <div className="flex flex-wrap gap-2 mb-4">
                    <button
                        onClick={() => setShowAddChemicalModal(true)}
                        className="flex items-center px-3 py-1.5 bg-[#E1F1FF] text-[#0B3861] rounded font-medium hover:bg-[#BCE0FD] transition-colors text-xs"
                        disabled={isLoading}
                    >
                        <AddIcon className="mr-1" />Add Chemical
                    </button>
                    <button
                        onClick={handleSubmitDraft}
                        className="flex items-center px-3 py-1.5 bg-[#0B3861] text-white rounded font-medium hover:bg-[#1E88E5] transition-colors text-xs"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Submitting...' : (<><SendIcon className="mr-1" />Submit Draft</>)}
                    </button>
                </div>
            )}

            {/* Status Update Section */}
            {(userRole === 'admin' || (userRole === 'central_lab_admin' && quotation.createdByRole === 'lab_assistant')) && (
                <div className="mb-4">
                    <h4 className="text-xs font-semibold text-[#0B3861] mb-1">
                        {userRole === 'central_lab_admin' ? 'Process Lab Request' : 'Update Status'}
                    </h4>
                    <div className="space-y-2">
                        <select
                            value={statusUpdate}
                            onChange={(e) => setStatusUpdate(e.target.value)}
                            className="w-full px-3 py-1.5 border border-[#BCE0FD] rounded focus:outline-none focus:ring-2 focus:ring-[#0B3861] text-xs"
                            disabled={isLoading}
                        >
                            <option value="">Select action</option>
                            {statusOptions().map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                        <textarea
                            rows="2"
                            placeholder="Add comments (optional)"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full px-3 py-1.5 border border-[#BCE0FD] rounded focus:outline-none focus:ring-2 focus:ring-[#0B3861] text-xs"
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleStatusUpdate}
                            className="px-4 py-1.5 bg-[#0B3861] text-white rounded font-medium hover:bg-[#1E88E5] transition-colors text-xs"
                            disabled={!statusUpdate || isLoading}
                        >
                            {isLoading ? 'Processing...' : 'Update Status'}
                        </button>
                    </div>
                </div>
            )}

            {/* Comments Section */}
            <div>
                <button
                    onClick={() => setShowComment(!showComment)}
                    className="flex items-center text-[#0B3861] hover:text-[#1E88E5] font-medium text-xs"
                    disabled={isLoading}
                >
                    <CommentIcon className="mr-1" />
                    {showComment ? 'Hide Comments' : 'View/Add Comments'}
                </button>
                {showComment && (
                    <div className="mt-2">
                        <CommentSection
                            quotationId={quotation._id}
                            comments={quotation.comments}
                            createdByRole={quotation.createdByRole}
                            status={quotation.status}
                            onStatusUpdate={refreshList}
                            onCommentAdded={handleAddComment}
                        />
                    </div>
                )}
            </div>

            {/* Modal: Central Lab Admin Add to Draft */}
            {showAddChemicalModal && (
                <ChemicalAddToDraftModal
                    isOpen={showAddChemicalModal}
                    onClose={() => setShowAddChemicalModal(false)}
                    labQuotationChemicals={quotation.chemicals}
                    draftQuotations={draftQuotations}
                    onSuccess={refreshList}
                />
            )}
            {/* Batch Remarks Modal */}
            {showRemarksModal && <BatchRemarksModal />}
        </div>
    );
};

export default QuotationCard;