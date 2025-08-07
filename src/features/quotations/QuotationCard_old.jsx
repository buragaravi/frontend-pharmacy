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

const FlaskIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547A1.998 1.998 0 004 17.618v.786a2 2 0 002 2h12a2 2 0 002-2v-.786c0-.824-.393-1.596-1.072-2.19z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8a6 6 0 11-12 0 6 6 0 0112 0zM8 14v.01M12 14v.01M16 14v.01" />
  </svg>
);

const EquipmentIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M16 8a6 6 0 11-12 0 6 6 0 0112 0zM8 14v.01M12 14v.01M16 14v.01" />
  </svg>
);

const GlasswareIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const ExcelIcon = () => (
  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M21.8,3H9.2A1.2,1.2 0 0,0 8,4.2V19.8A1.2,1.2 0 0,0 9.2,21H21.8A1.2,1.2 0 0,0 23,19.8V4.2A1.2,1.2 0 0,0 21.8,3M14.34,14.3L12,11.96L9.66,14.3L8.3,12.94L10.64,10.6L8.3,8.26L9.66,6.9L12,9.24L14.34,6.9L15.7,8.26L13.36,10.6L15.7,12.94L14.34,14.3Z" />
  </svg>
);

const PDFIcon = () => (
  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
  </svg>
);

const StatusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const QuotationCard = ({ quotation, refreshList, onViewDetails }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

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
        if (userRole === 'central_store_admin') {
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

            if (userRole === 'central_store_admin') {
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
            } else if (userRole === 'central_store_admin' && quotation.createdByRole === 'lab_assistant') {
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
        const allItems = [];
        let itemCounter = 1;

        // Add chemicals
        if (quotation.chemicals && quotation.chemicals.length > 0) {
            quotation.chemicals.forEach((chem) => {
                allItems.push({
                    '#': itemCounter++,
                    'TYPE': 'Chemical',
                    'ITEM NAME': chem.chemicalName,
                    'QUANTITY': chem.quantity,
                    'UNIT': chem.unit,
                    'PRICE/UNIT': chem.pricePerUnit || 0,
                    'TOTAL': ((chem.pricePerUnit || 0) * chem.quantity).toFixed(2),
                    'REMARKS': chem.remarks || ''
                });
            });
        }

        // Add equipment
        if (quotation.equipment && quotation.equipment.length > 0) {
            quotation.equipment.forEach((equip) => {
                allItems.push({
                    '#': itemCounter++,
                    'TYPE': 'Equipment',
                    'ITEM NAME': equip.equipmentName,
                    'QUANTITY': equip.quantity,
                    'UNIT': equip.unit,
                    'PRICE/UNIT': equip.pricePerUnit || 0,
                    'TOTAL': ((equip.pricePerUnit || 0) * equip.quantity).toFixed(2),
                    'REMARKS': `${equip.specifications ? `Specs: ${equip.specifications}` : ''}${equip.remarks ? ` | ${equip.remarks}` : ''}`
                });
            });
        }

        // Add glassware
        if (quotation.glassware && quotation.glassware.length > 0) {
            quotation.glassware.forEach((glass) => {
                allItems.push({
                    '#': itemCounter++,
                    'TYPE': 'Glassware',
                    'ITEM NAME': glass.glasswareName,
                    'QUANTITY': glass.quantity,
                    'UNIT': glass.unit,
                    'PRICE/UNIT': glass.pricePerUnit || 0,
                    'TOTAL': ((glass.pricePerUnit || 0) * glass.quantity).toFixed(2),
                    'REMARKS': `${glass.condition ? `Condition: ${glass.condition}` : ''}${glass.remarks ? ` | ${glass.remarks}` : ''}`
                });
            });
        }

        // Add grand total row
        const grandTotal = (
            (quotation.totalPrice || 0) +
            (quotation.equipment?.reduce((sum, eq) => sum + (eq.pricePerUnit * eq.quantity || 0), 0) || 0) +
            (quotation.glassware?.reduce((sum, gl) => sum + (gl.pricePerUnit * gl.quantity || 0), 0) || 0)
        );

        allItems.push({
            '#': '',
            'TYPE': '',
            'ITEM NAME': '',
            'QUANTITY': '',
            'UNIT': '',
            'PRICE/UNIT': 'GRAND TOTAL',
            'TOTAL': grandTotal.toFixed(2),
            'REMARKS': ''
        });

        const ws = XLSX.utils.json_to_sheet(allItems, { skipHeader: false });
        const range = XLSX.utils.decode_range(ws['!ref']);
        
        // Header style (vibrant blue background, white text, bold)
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cell = ws[XLSX.utils.encode_cell({ r: range.s.r, c: C })];
            if (cell) {
                cell.s = {
                    font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 13 },
                    fill: { fgColor: { rgb: '2196F3' } },
                    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
                    border: {
                        top: { style: 'medium', color: { rgb: '1976D2' } },
                        bottom: { style: 'medium', color: { rgb: '1976D2' } },
                        left: { style: 'medium', color: { rgb: '1976D2' } },
                        right: { style: 'medium', color: { rgb: '1976D2' } }
                    }
                };
            }
        }

        // Style data rows
        for (let R = range.s.r + 1; R <= range.e.r; ++R) {
            const isEven = (R - range.s.r) % 2 === 0;
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
                if (cell) {
                    // Grand total row styling
                    if (R === range.e.r && (C === range.e.c - 2 || C === range.e.c - 1)) {
                        cell.s = {
                            font: { bold: true, color: { rgb: '2196F3' }, sz: 15 },
                            alignment: { horizontal: 'right', vertical: 'center' },
                            fill: { fgColor: { rgb: 'E3F2FD' } },
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
        // Set column widths for the new structure
        ws['!cols'] = [
            { wch: 5 },   // #
            { wch: 12 },  // TYPE
            { wch: 28 },  // ITEM NAME
            { wch: 12 },  // QUANTITY
            { wch: 10 },  // UNIT
            { wch: 18 },  // PRICE/UNIT
            { wch: 18 },  // TOTAL
            { wch: 35 }   // REMARKS
        ];
        
        // Add a header row above the table for Quotation ID and Created At
        const headerRowNum = 0;
        XLSX.utils.sheet_add_aoa(ws, [
            [`Quotation ID: ${quotation._id.slice(-6).toUpperCase()}`,
             '', '', '', '', '', '',
             `Created At: ${quotation.createdAt ? new Date(quotation.createdAt).toLocaleString() : ''}`]
        ], { origin: -1 });
        
        // Style the header row
        for (let C = 0; C <= 7; ++C) {
            const cell = ws[XLSX.utils.encode_cell({ r: headerRowNum, c: C })];
            if (cell) {
                cell.s = {
                    font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 14 },
                    fill: { fgColor: { rgb: '2196F3' } },
                    alignment: { horizontal: 'left', vertical: 'center' }
                };
            }
        }
        
        ws['!merges'] = [
            { s: { r: headerRowNum, c: 0 }, e: { r: headerRowNum, c: 4 } }, // Quotation ID
            { s: { r: headerRowNum, c: 5 }, e: { r: headerRowNum, c: 7 } }, // Created At
            // Footer merges
            { s: { r: range.e.r + 3, c: 5 }, e: { r: range.e.r + 3, c: 6 } }, // signature line
            { s: { r: range.e.r + 4, c: 5 }, e: { r: range.e.r + 4, c: 6 } }, // signature label
            { s: { r: range.e.r + 5, c: 4 }, e: { r: range.e.r + 5, c: 6 } }  // timestamp
        ];
        // Add a footer row for signature and timestamp
        const footerRow = range.e.r + 3;
        ws[`F${footerRow + 1}`] = { t: 's', v: 'Authorized Signature', s: {
            font: { bold: true, color: { rgb: '2196F3' }, sz: 12 },
            alignment: { horizontal: 'center', vertical: 'center' }
        }};
        ws[`F${footerRow}`] = { t: 's', v: '_________________________', s: {
            font: { color: { rgb: '2196F3' }, sz: 12 },
            alignment: { horizontal: 'center', vertical: 'center' }
        }};
        ws[`E${footerRow + 2}`] = { t: 's', v: `Generated: ${new Date().toLocaleString()}`, s: {
            font: { color: { rgb: '1976D2' }, sz: 10 },
            alignment: { horizontal: 'center', vertical: 'center' }
        }};
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Quotation');
        XLSX.writeFile(wb, `Quotation_${quotation._id.slice(-6).toUpperCase()}.xlsx`);
    };

    // Download as PDF for multi-item quotations
    const handleDownloadPDF = () => {
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm' });
        const pageWidth = 297;
        const pageHeight = 210;
        const leftMargin = 15;
        const rightMargin = 15;
        const availableWidth = pageWidth - leftMargin - rightMargin;
        
        // Colors - vibrant blue theme
        const vibrantBlue = [33, 150, 243]; // #2196F3
        const darkBlue = [25, 118, 210];    // #1976D2
        const white = [255, 255, 255];
        
        // Header section
        const headerHeight = 22;
        doc.setFillColor(...vibrantBlue);
        doc.rect(0, 0, pageWidth, headerHeight, 'F');
        
        // Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(26);
        doc.setTextColor(...white);
        doc.text('MULTI-ITEM QUOTATION', pageWidth / 2, 15, { align: 'center' });
        
        // Decorative line
        doc.setDrawColor(...darkBlue);
        doc.setLineWidth(1.2);
        doc.line(leftMargin, headerHeight + 2, pageWidth - rightMargin, headerHeight + 2);
        
        // Report details
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(...darkBlue);
        doc.text(`Quotation ID: ${quotation._id.slice(-6).toUpperCase()}`, leftMargin, headerHeight + 10);
        doc.text(`Type: ${quotation.quotationType?.toUpperCase() || 'MIXED'}`, leftMargin, headerHeight + 16);
        doc.text(`Created: ${new Date(quotation.createdAt).toLocaleDateString()}`, pageWidth - rightMargin - 50, headerHeight + 10);
        
        // Prepare all items data
        const allItems = [];
        let itemCounter = 1;

        // Add chemicals
        if (quotation.chemicals && quotation.chemicals.length > 0) {
            quotation.chemicals.forEach((chem) => {
                allItems.push({
                    index: itemCounter++,
                    type: 'Chemical',
                    itemName: chem.chemicalName,
                    quantity: chem.quantity,
                    unit: chem.unit,
                    pricePerUnit: chem.pricePerUnit || 0,
                    total: ((chem.pricePerUnit || 0) * chem.quantity).toFixed(2),
                    remarks: chem.remarks || ''
                });
            });
        }

        // Add equipment
        if (quotation.equipment && quotation.equipment.length > 0) {
            quotation.equipment.forEach((equip) => {
                allItems.push({
                    index: itemCounter++,
                    type: 'Equipment',
                    itemName: equip.equipmentName,
                    quantity: equip.quantity,
                    unit: equip.unit,
                    pricePerUnit: equip.pricePerUnit || 0,
                    total: ((equip.pricePerUnit || 0) * equip.quantity).toFixed(2),
                    remarks: `${equip.specifications ? `Specs: ${equip.specifications} | ` : ''}${equip.remarks || ''}`
                });
            });
        }

        // Add glassware
        if (quotation.glassware && quotation.glassware.length > 0) {
            quotation.glassware.forEach((glass) => {
                allItems.push({
                    index: itemCounter++,
                    type: 'Glassware',
                    itemName: glass.glasswareName,
                    quantity: glass.quantity,
                    unit: glass.unit,
                    pricePerUnit: glass.pricePerUnit || 0,
                    total: ((glass.pricePerUnit || 0) * glass.quantity).toFixed(2),
                    remarks: `${glass.condition ? `Condition: ${glass.condition} | ` : ''}${glass.remarks || ''}`
                });
            });
        }

        // Table columns
        const columns = [
            { title: '#', dataKey: 'index', minWidth: 12 },
            { title: 'TYPE', dataKey: 'type', minWidth: 25 },
            { title: 'ITEM NAME', dataKey: 'itemName', minWidth: 60 },
            { title: 'QTY', dataKey: 'quantity', minWidth: 20 },
            { title: 'UNIT', dataKey: 'unit', minWidth: 20 },
            { title: 'PRICE/UNIT', dataKey: 'pricePerUnit', minWidth: 25 },
            { title: 'TOTAL', dataKey: 'total', minWidth: 25 },
            { title: 'REMARKS', dataKey: 'remarks', minWidth: 80 }
        ];

        // Table data
        const tableData = allItems.map(item => columns.map(col => item[col.dataKey]));

        // Calculate grand total
        const grandTotal = (
            (quotation.totalPrice || 0) +
            (quotation.equipment?.reduce((sum, eq) => sum + (eq.pricePerUnit * eq.quantity || 0), 0) || 0) +
            (quotation.glassware?.reduce((sum, gl) => sum + (gl.pricePerUnit * gl.quantity || 0), 0) || 0)
        );

        // Table
        autoTable(doc, {
            head: [columns.map(col => col.title)],
            body: tableData,
            startY: headerHeight + 22,
            margin: { left: leftMargin, right: rightMargin },
            tableWidth: availableWidth,
            styles: {
                fontSize: 9,
                cellPadding: 3,
                overflow: 'linebreak',
                font: 'helvetica',
                textColor: [33, 37, 41],
                lineColor: [33, 150, 243],
                fillColor: white
            },
            headStyles: {
                fillColor: vibrantBlue,
                textColor: 255,
                fontStyle: 'bold',
                halign: 'center',
                fontSize: 10
            },
            bodyStyles: {
                halign: 'center',
                fontSize: 8
            },
            alternateRowStyles: {
                fillColor: [227, 242, 253] // Light blue
            },
            columnStyles: {
                0: { halign: 'center', cellWidth: 12 },
                1: { halign: 'center', cellWidth: 25 },
                2: { halign: 'left', cellWidth: 60 },
                3: { halign: 'center', cellWidth: 20 },
                4: { halign: 'center', cellWidth: 20 },
                5: { halign: 'right', cellWidth: 25 },
                6: { halign: 'right', cellWidth: 25 },
                7: { halign: 'left', cellWidth: 80 }
            }
        });

        // Grand total section
        const finalY = doc.lastAutoTable.finalY + 8;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(...vibrantBlue);
        doc.text(`GRAND TOTAL: ₹${grandTotal.toFixed(2)}`, pageWidth - rightMargin, finalY, { align: 'right' });

        // Footer
        const footerY = pageHeight - 20;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...darkBlue);
        doc.text('Authorized Signature: ________________________', pageWidth - 80, footerY);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, leftMargin, footerY);

        // Save PDF
        doc.save(`Multi_Item_Quotation_${quotation._id.slice(-6).toUpperCase()}.pdf`);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300';
            case 'pending': return 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-300';
            case 'draft': return 'bg-gradient-to-r from-[#F5F9FD] to-[#E1F1FF] text-[#0B3861] border border-[#BCE0FD]';
            case 'purchased': return 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300';
            case 'ordered': return 'bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-800 border border-indigo-300';
            case 'allocated': return 'bg-gradient-to-r from-teal-100 to-teal-200 text-teal-800 border border-teal-300';
            case 'partially_fulfilled': return 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border border-orange-300';
            default: return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300';
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
        } else if (userRole === 'central_store_admin' && quotation.createdByRole === 'lab_assistant') {
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
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-[#BCE0FD]/30 overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] group">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-[#F5F9FD] to-[#E1F1FF] px-6 py-4 border-b border-[#BCE0FD]/30">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-br from-[#0B3861] to-[#1E88E5] rounded-xl">
                            <DocumentIcon />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-[#0B3861]">
                                Quotation #{quotation._id.slice(-6).toUpperCase()}
                            </h3>
                            <p className="text-sm text-[#64B5F6] font-medium">
                                {quotation.quotationType ? quotation.quotationType.replace('_', ' ').toUpperCase() : 'MULTI-ITEM'} Quotation
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${getStatusColor(quotation.status)}`}>
                            {quotation.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </span>
                        <span className="text-xs text-[#64B5F6] font-medium">
                            {new Date(quotation.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                            })}
                        </span>
                    </div>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
                    <div className="flex items-center">
                        <svg className="w-4 h-4 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        {error}
                    </div>
                </div>
            )}

            <div className="p-6 space-y-6">
                {/* Quotation Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <p className="text-xs font-semibold text-[#64B5F6] uppercase tracking-wide">Created By</p>
                        <p className="text-sm font-medium text-[#0B3861] capitalize">
                            {quotation.createdByRole.replace('_', ' ')}
                        </p>
                    </div>
                    {quotation.labId && (
                        <div className="space-y-1">
                            <p className="text-xs font-semibold text-[#64B5F6] uppercase tracking-wide">Lab ID</p>
                            <p className="text-sm font-medium text-[#0B3861]">{quotation.labId}</p>
                        </div>
                    )}
                    {quotation.quotationType && (
                        <div className="space-y-1 col-span-2">
                            <p className="text-xs font-semibold text-[#64B5F6] uppercase tracking-wide">Quotation Type</p>
                            <p className="text-sm font-medium text-[#0B3861] capitalize">{quotation.quotationType.replace('_', ' ')}</p>
                        </div>
                    )}
                </div>

                {/* Items Section - Chemicals */}
                {quotation.chemicals && quotation.chemicals.length > 0 && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-bold text-[#0B3861] flex items-center">
                            <FlaskIcon />
                            <span className="ml-2">Chemicals</span>
                            <span className="ml-2 px-2 py-1 bg-[#F5F9FD] text-[#64B5F6] rounded-full text-xs font-semibold">
                                {quotation.chemicals.length}
                            </span>
                        </h4>
                        {userRole === 'central_store_admin' && (
                            <button
                                onClick={() => setShowRemarksModal(true)}
                                className="text-xs px-3 py-1 bg-gradient-to-r from-[#F5F9FD] to-[#E1F1FF] text-[#0B3861] rounded-full hover:from-[#BCE0FD] hover:to-[#64B5F6] hover:text-white transition-all duration-200 font-medium border border-[#BCE0FD]/50"
                            >
                                Apply Standard Remarks
                            </button>
                        )}
                    </div>
                    
                    <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                        {quotation.chemicals.map((chem, index) => (
                            <div key={index} className="bg-[#F5F9FD]/50 border border-[#BCE0FD]/30 rounded-xl p-4 transition-all duration-200 hover:bg-[#F5F9FD] hover:border-[#BCE0FD]/50">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                        <h5 className="font-semibold text-[#0B3861] text-sm mb-1">{chem.chemicalName}</h5>
                                        <div className="flex items-center space-x-4 text-xs text-[#64B5F6]">
                                            <span className="flex items-center">
                                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                                </svg>
                                                {chem.quantity} {chem.unit}
                                            </span>
                                            {chem.pricePerUnit && (
                                                <span className="flex items-center font-semibold text-[#0B3861]">
                                                    ₹{(chem.pricePerUnit * chem.quantity).toFixed(2)}
                                                </span>
                                            )}
                                        </div>
                                        {chem.description && (
                                            <p className="text-xs text-[#64B5F6] mt-1 italic">{chem.description}</p>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Chemical Remarks Section */}
                                {(userRole === 'central_store_admin' || userRole === 'admin') && (
                                    <div className="mt-3 pt-3 border-t border-[#BCE0FD]/30">
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="text-xs font-semibold text-[#0B3861] flex items-center">
                                                <CommentIcon />
                                                <span className="ml-1">Remarks:</span>
                                            </p>
                                            {(editingChemicalIndex !== index) && (
                                                <button
                                                    onClick={() => setEditingChemicalIndex(index)}
                                                    className="text-xs text-[#1E88E5] hover:text-[#0B3861] flex items-center transition-colors duration-200"
                                                >
                                                    <EditIcon />
                                                    <span className="ml-1">Edit</span>
                                                </button>
                                            )}
                                            {(editingChemicalIndex === index) && (
                                                <button
                                                    onClick={() => handleUpdateChemicalRemark(index)}
                                                    className="text-xs text-green-600 hover:text-green-700 flex items-center transition-colors duration-200"
                                                    disabled={isLoading}
                                                >
                                                    <SaveIcon />
                                                    <span className="ml-1">Save</span>
                                                </button>
                                            )}
                                        </div>
                                        {editingChemicalIndex === index ? (
                                            <textarea
                                                value={chemicalRemarks[index] || ''}
                                                onChange={e => setChemicalRemarks({ ...chemicalRemarks, [index]: e.target.value })}
                                                className="w-full px-3 py-2 text-xs border border-[#BCE0FD] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1E88E5] focus:border-[#1E88E5] transition-all duration-200 resize-none"
                                                rows="2"
                                                placeholder="Add remarks for this chemical"
                                            />
                                        ) : (
                                            <p className="text-xs text-[#64B5F6] bg-white/50 rounded-lg p-2 border border-[#BCE0FD]/30">
                                                {chem.remarks || chemicalRemarks[index] || 'No remarks added'}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    
                    {quotation.totalPrice && (
                        <div className="mt-4 pt-4 border-t border-[#BCE0FD]/30">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-[#64B5F6]">Chemicals Total:</span>
                                <span className="text-lg font-bold text-[#0B3861]">₹{quotation.totalPrice.toFixed(2)}</span>
                            </div>
                        </div>
                    )}
                </div>
                )}

                {/* Equipment Section */}
                {quotation.equipment && quotation.equipment.length > 0 && (
                <div className="mt-6">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-bold text-[#0B3861] flex items-center">
                            <EquipmentIcon />
                            <span className="ml-2">Equipment</span>
                            <span className="ml-2 px-2 py-1 bg-[#F5F9FD] text-[#64B5F6] rounded-full text-xs font-semibold">
                                {quotation.equipment.length}
                            </span>
                        </h4>
                    </div>
                    
                    <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                        {quotation.equipment.map((equip, index) => (
                            <div key={index} className="bg-[#F5F9FD]/50 border border-[#BCE0FD]/30 rounded-xl p-4 transition-all duration-200 hover:bg-[#F5F9FD] hover:border-[#BCE0FD]/50">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                        <h5 className="font-semibold text-[#0B3861] text-sm mb-1">{equip.equipmentName}</h5>
                                        <div className="flex items-center space-x-4 text-xs text-[#64B5F6]">
                                            <span className="flex items-center">
                                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                                </svg>
                                                {equip.quantity} {equip.unit}
                                            </span>
                                            {equip.pricePerUnit && (
                                                <span className="flex items-center font-semibold text-[#0B3861]">
                                                    ₹{(equip.pricePerUnit * equip.quantity).toFixed(2)}
                                                </span>
                                            )}
                                        </div>
                                        {equip.specifications && (
                                            <p className="text-xs text-[#64B5F6] mt-1 italic">Specs: {equip.specifications}</p>
                                        )}
                                        {equip.remarks && (
                                            <p className="text-xs text-[#0B3861] mt-1 bg-white/50 rounded-lg p-2 border border-[#BCE0FD]/30">
                                                {equip.remarks}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                )}

                {/* Glassware Section */}
                {quotation.glassware && quotation.glassware.length > 0 && (
                <div className="mt-6">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-bold text-[#0B3861] flex items-center">
                            <GlasswareIcon />
                            <span className="ml-2">Glassware</span>
                            <span className="ml-2 px-2 py-1 bg-[#F5F9FD] text-[#64B5F6] rounded-full text-xs font-semibold">
                                {quotation.glassware.length}
                            </span>
                        </h4>
                    </div>
                    
                    <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                        {quotation.glassware.map((glass, index) => (
                            <div key={index} className="bg-[#F5F9FD]/50 border border-[#BCE0FD]/30 rounded-xl p-4 transition-all duration-200 hover:bg-[#F5F9FD] hover:border-[#BCE0FD]/50">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                        <h5 className="font-semibold text-[#0B3861] text-sm mb-1">{glass.glasswareName}</h5>
                                        <div className="flex items-center space-x-4 text-xs text-[#64B5F6]">
                                            <span className="flex items-center">
                                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                                </svg>
                                                {glass.quantity} {glass.unit}
                                            </span>
                                            {glass.condition && (
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    glass.condition === 'new' ? 'bg-green-100 text-green-800' :
                                                    glass.condition === 'good' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-orange-100 text-orange-800'
                                                }`}>
                                                    {glass.condition}
                                                </span>
                                            )}
                                            {glass.pricePerUnit && (
                                                <span className="flex items-center font-semibold text-[#0B3861]">
                                                    ₹{(glass.pricePerUnit * glass.quantity).toFixed(2)}
                                                </span>
                                            )}
                                        </div>
                                        {glass.remarks && (
                                            <p className="text-xs text-[#0B3861] mt-1 bg-white/50 rounded-lg p-2 border border-[#BCE0FD]/30">
                                                {glass.remarks}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                )}

                {/* Total Price for all items */}
                {(quotation.totalPrice || (quotation.chemicals?.length > 0 || quotation.equipment?.length > 0 || quotation.glassware?.length > 0)) && (
                    <div className="mt-6 pt-4 border-t border-[#BCE0FD]/30">
                        <div className="flex justify-between items-center">
                            <span className="text-base font-bold text-[#64B5F6]">Grand Total:</span>
                            <span className="text-xl font-bold text-[#0B3861]">
                                ₹{(
                                    (quotation.totalPrice || 0) +
                                    (quotation.equipment?.reduce((sum, eq) => sum + (eq.pricePerUnit * eq.quantity || 0), 0) || 0) +
                                    (quotation.glassware?.reduce((sum, gl) => sum + (gl.pricePerUnit * gl.quantity || 0), 0) || 0)
                                ).toFixed(2)}
                            </span>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                    {/* Export Buttons */}
                    <div className="flex space-x-2">
                        <button
                            onClick={handleDownloadExcel}
                            className="flex items-center px-3 py-2 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-all duration-200 text-xs font-medium border border-green-200"
                            title="Export to Excel"
                        >
                            <ExcelIcon />
                            <span className="ml-1">Excel</span>
                        </button>
                        <button
                            onClick={handleDownloadPDF}
                            className="flex items-center px-3 py-2 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 transition-all duration-200 text-xs font-medium border border-red-200"
                            title="Export to PDF"
                        >
                            <PDFIcon />
                            <span className="ml-1">PDF</span>
                        </button>
                    </div>

                    {/* Draft Submit Button - Central Store Admin Only */}
                    {userRole === 'central_store_admin' && quotation.status === 'draft' && (
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setShowAddChemicalModal(true)}
                                className="flex items-center px-3 py-2 bg-gradient-to-r from-[#F5F9FD] to-[#E1F1FF] text-[#0B3861] rounded-xl hover:from-[#BCE0FD] hover:to-[#64B5F6] hover:text-white transition-all duration-200 text-xs font-medium border border-[#BCE0FD]/50"
                            >
                                <AddIcon />
                                <span className="ml-1">Add Chemical</span>
                            </button>
                            <button
                                onClick={handleSubmitDraft}
                                className="flex items-center px-4 py-2 bg-gradient-to-r from-[#0B3861] to-[#1E88E5] text-white rounded-xl hover:from-[#1E88E5] hover:to-[#64B5F6] transition-all duration-200 text-xs font-medium shadow-lg hover:shadow-xl"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Submitting...' : (
                                    <>
                                        <SendIcon />
                                        <span className="ml-1">Submit Draft</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                {/* Status Update Section */}
                {(userRole === 'admin' || (userRole === 'central_store_admin' && quotation.createdByRole === 'lab_assistant')) && (
                    <div className="bg-gradient-to-r from-[#F5F9FD] to-[#E1F1FF] rounded-xl p-4 border border-[#BCE0FD]/30">
                        <h4 className="text-sm font-bold text-[#0B3861] mb-3 flex items-center">
                            <StatusIcon />
                            <span className="ml-2">{userRole === 'central_store_admin' ? 'Process Lab Request' : 'Update Status'}</span>
                        </h4>
                        <div className="space-y-3">
                            <select
                                value={statusUpdate}
                                onChange={(e) => setStatusUpdate(e.target.value)}
                                className="w-full px-3 py-2 border border-[#BCE0FD] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#1E88E5] focus:border-[#1E88E5] transition-all duration-200 text-sm font-medium text-[#0B3861]"
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
                                className="w-full px-3 py-2 border border-[#BCE0FD] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#1E88E5] focus:border-[#1E88E5] transition-all duration-200 text-sm placeholder-[#64B5F6] resize-none"
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleStatusUpdate}
                                className="w-full px-4 py-3 bg-gradient-to-r from-[#0B3861] to-[#1E88E5] text-white rounded-xl hover:from-[#1E88E5] hover:to-[#64B5F6] transition-all duration-200 font-semibold text-sm shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={!statusUpdate || isLoading}
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing...
                                    </span>
                                ) : (
                                    'Update Status'
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Comments Section */}
                <div>
                    <button
                        onClick={() => setShowComment(!showComment)}
                        className="flex items-center text-[#0B3861] hover:text-[#1E88E5] font-semibold text-sm transition-colors duration-200 mb-3"
                        disabled={isLoading}
                    >
                        <CommentIcon />
                        <span className="ml-2">{showComment ? 'Hide Comments' : 'View/Add Comments'}</span>
                        {quotation.comments && quotation.comments.length > 0 && (
                            <span className="ml-2 px-2 py-1 bg-[#F5F9FD] text-[#64B5F6] rounded-full text-xs font-semibold">
                                {quotation.comments.length}
                            </span>
                        )}
                    </button>
                    {showComment && (
                        <div className="bg-[#F5F9FD]/50 rounded-xl p-4 border border-[#BCE0FD]/30">
                            <CommentSection
                                quotationId={quotation._id}
                                comments={quotation.comments}
                                createdByRole={quotation.createdByRole}
                                status={quotation.status}
                                userRole={userRole}
                                onStatusUpdate={refreshList}
                                onCommentAdded={handleAddComment}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Modal: Central Store Admin Add to Draft */}
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

            <style jsx>{`
                .custom-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: #BCE0FD #F5F9FD;
                }
                
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #F5F9FD;
                    border-radius: 2px;
                }
                
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #BCE0FD;
                    border-radius: 2px;
                }
                
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #64B5F6;
                }
            `}</style>
        </div>
    );
};

export default QuotationCard;